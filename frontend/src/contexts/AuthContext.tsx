// @refresh reload
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth, database, storage } from '../config/firebase';
import { ref, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import toast from 'react-hot-toast';
import { checkAndCacheAdminStatus, clearAdminCache } from '../utils/adminCheck';

export interface UserProfile {
  displayName?: string;
  phone?: string;
  photoURL?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>, silent?: boolean) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }
      toast.success('Account created successfully!');
    } catch (error: any) {
      let errorMessage = 'Failed to create account';
      
      // Provide more helpful error messages
      if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Invalid Firebase API key. Please check your .env file.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase project configuration not found. Please verify your Firebase project settings.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!', {
        id: 'login-success',
        duration: 2000,
      });
    } catch (error: any) {
      let errorMessage = 'Failed to sign in';
      
      // Provide more helpful error messages
      if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Invalid Firebase API key. Please check your .env file.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase project configuration not found. Please verify your Firebase project settings.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please check your email or create an account.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again or use "Forgot password?" to reset it.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format. Please check your email and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please wait a few minutes or reset your password.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support for assistance.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Use a consistent toast ID to prevent duplicate toasts
      toast.error(errorMessage, {
        id: 'login-error',
        duration: 4000,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign out';
      toast.error(errorMessage);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send password reset email';
      toast.error(errorMessage);
      throw error;
    }
  };

  const loadUserProfile = async () => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    try {
      const profileRef = ref(database, `users/${currentUser.uid}/profile`);
      const snapshot = await get(profileRef);
      
      if (snapshot.exists()) {
        setUserProfile(snapshot.val());
      } else {
        // Create default profile if it doesn't exist
        const defaultProfile: UserProfile = {
          displayName: currentUser.displayName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await set(profileRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (error: any) {
      toast.error('Failed to load profile');
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>, silent: boolean = false) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const profileRef = ref(database, `users/${currentUser.uid}/profile`);
      const currentProfile = userProfile || {};
      
      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...profileData,
        updatedAt: new Date().toISOString(),
      };

      await set(profileRef, updatedProfile);
      setUserProfile(updatedProfile);

      // Update Firebase Auth profile if displayName or photoURL changed
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (profileData.displayName && profileData.displayName !== currentUser.displayName) {
        authUpdates.displayName = profileData.displayName;
      }
      if (profileData.photoURL && profileData.photoURL !== currentUser.photoURL) {
        authUpdates.photoURL = profileData.photoURL;
      }
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(currentUser, authUpdates);
      }

      if (!silent) {
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) {
      throw new Error('No user logged in');
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
      toast.success('Password updated successfully!');
    } catch (error: any) {
      let errorMessage = 'Failed to update password';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please use a stronger password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    try {
      // Delete old profile picture if it exists
      if (userProfile?.photoURL) {
        try {
          const oldPhotoRef = storageRef(storage, userProfile.photoURL);
          await deleteObject(oldPhotoRef);
        } catch (error) {
          // Ignore errors when deleting old photo (might not exist)
        }
      }

      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile_${currentUser.uid}_${Date.now()}.${fileExtension}`;
      const photoRef = storageRef(storage, `profile-pictures/${currentUser.uid}/${fileName}`);

      // Upload the file
      await uploadBytes(photoRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(photoRef);

      // Update profile with new photo URL (silent to avoid duplicate toast)
      await updateUserProfile({ photoURL: downloadURL }, true);

      // Also update Firebase Auth profile photo
      await updateProfile(currentUser, {
        photoURL: downloadURL,
      });

      toast.success('Profile picture updated successfully!');
      return downloadURL;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload profile picture';
      toast.error(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    const loadProfileForUser = async (user: User) => {
      try {
        const profileRef = ref(database, `users/${user.uid}/profile`);
        const snapshot = await get(profileRef);
        
        if (snapshot.exists()) {
          setUserProfile(snapshot.val());
        } else {
          // Create default profile if it doesn't exist
          const defaultProfile: UserProfile = {
            displayName: user.displayName || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await set(profileRef, defaultProfile);
          setUserProfile(defaultProfile);
        }
      } catch (error: any) {
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Check admin status when user changes
      if (user) {
        const adminStatus = await checkAndCacheAdminStatus(user.uid);
        setIsAdmin(adminStatus);
        // Load user profile
        await loadProfileForUser(user);
      } else {
        setIsAdmin(false);
        clearAdminCache();
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  const value: AuthContextType = {
    currentUser,
    loading,
    isAdmin,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserPassword,
    loadUserProfile,
    uploadProfilePicture,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

