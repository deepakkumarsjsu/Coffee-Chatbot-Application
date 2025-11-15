import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiX, FiLock, FiArrowLeft, FiCheckCircle, FiCalendar, FiShield, FiPackage, FiShoppingCart, FiStar, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImageCropModal from '../components/ImageCropModal';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { currentUser, userProfile, updateUserProfile, updateUserPassword, loadUserProfile, uploadProfilePicture } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState<UserProfile>({
    displayName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Show spinner for minimum 1 second on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Load profile data when component mounts or profile updates
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || currentUser?.displayName || '',
        phone: userProfile.phone || '',
        address: {
          street: userProfile.address?.street || '',
          city: userProfile.address?.city || '',
          state: userProfile.address?.state || '',
          zipCode: userProfile.address?.zipCode || '',
          country: userProfile.address?.country || '',
        },
      });
    } else if (currentUser) {
      // Set default values if profile doesn't exist yet
      setFormData({
        displayName: currentUser.displayName || '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
      });
    }
  }, [userProfile, currentUser]);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserProfile] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await updateUserProfile(formData);
      setIsEditing(false);
      await loadUserProfile(); // Reload to get updated data
    } catch (error) {
      // Error already handled in updateUserProfile
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      // Error already handled in updateUserPassword
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original profile data
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || currentUser?.displayName || '',
        phone: userProfile.phone || '',
        address: {
          street: userProfile.address?.street || '',
          city: userProfile.address?.city || '',
          state: userProfile.address?.state || '',
          zipCode: userProfile.address?.zipCode || '',
          country: userProfile.address?.country || '',
        },
      });
    }
    setIsEditing(false);
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB for editing, will be compressed after cropping)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB');
      e.target.value = '';
      return;
    }

    // Create image URL and show crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    setUploadingPhoto(true);
    try {
      // Convert data URL to Blob, then to File
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });

      // Upload the cropped image
      await uploadProfilePicture(file);
      await loadUserProfile(); // Reload to get updated profile with new photo URL
    } catch (error) {
      // Error already handled in uploadProfilePicture
    } finally {
      setUploadingPhoto(false);
      setImageSrc('');
    }
  };

  if (!currentUser) {
    return null;
  }

  if (isPageLoading) {
    return <LoadingSpinner message="Loading your profile" />;
  }

  const initials = (formData.displayName || currentUser.email || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-neutral-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 relative z-10">
        {/* Header Section - Enhanced */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-600 mb-4 sm:mb-6 md:mb-8"
          >
            <div className="p-1.5 sm:p-2 bg-white rounded-xl shadow-sm">
              <FiArrowLeft size={16} />
            </div>
            <span className="font-bold text-sm sm:text-base">Back to Home</span>
          </button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            {/* Profile Avatar - Large and Beautiful */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white relative overflow-hidden">
                {/* Profile Picture or Initials */}
                {userProfile?.photoURL || currentUser?.photoURL ? (
                  <img
                    src={(userProfile?.photoURL || currentUser?.photoURL) || undefined}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {/* Decorative background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full blur-xl"></div>
                    </div>
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white relative z-10">{initials}</span>
                  </>
                )}
                {/* Upload overlay */}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer flex items-center justify-center rounded-2xl sm:rounded-3xl">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiCamera className="text-white" size={20} />
                  )}
                </label>
              </div>
              {/* Status indicator */}
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-2 sm:border-4 border-white shadow-lg"></div>
            </div>

            <div className="flex-1 w-full md:w-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight mb-1 sm:mb-2 break-words">
                {formData.displayName || currentUser.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 font-medium mb-3 sm:mb-4 break-words">{currentUser.email}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-bold text-green-800">Active Account</span>
                  </div>
                </div>
                {userProfile?.createdAt && (
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-100 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2">
                    <FiCalendar className="text-neutral-600" size={12} />
                    <span className="text-xs sm:text-sm font-semibold text-neutral-700">
                      Member since {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Account Information Card - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-neutral-200/50 overflow-hidden hover:shadow-3xl transition-all duration-300">
              <div className="bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 border-b-2 border-neutral-700 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <FiUser className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">Account Information</h2>
                    <p className="text-xs sm:text-sm text-neutral-300 mt-0.5">Manage your personal details</p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg sm:rounded-xl font-black transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border border-white/30 text-sm sm:text-base"
                  >
                    <FiEdit2 size={16} />
                    Edit
                  </button>
                )}
              </div>

              <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <div className="p-1 sm:p-1.5 bg-neutral-100 rounded-lg">
                      <FiMail className="text-neutral-700" size={14} />
                    </div>
                    Email Address
                  </label>
                  <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-700 font-semibold shadow-sm text-sm sm:text-base break-words">
                    {currentUser.email}
                  </div>
                  <p className="text-xs text-neutral-500 font-medium ml-1">Email cannot be changed</p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <div className="p-1 sm:p-1.5 bg-neutral-100 rounded-lg">
                      <FiUser className="text-neutral-700" size={14} />
                    </div>
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                      placeholder="Enter your username"
                    />
                  ) : (
                    <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-700 font-semibold shadow-sm text-sm sm:text-base">
                      {formData.displayName || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <div className="p-1 sm:p-1.5 bg-neutral-100 rounded-lg">
                      <FiPhone className="text-neutral-700" size={14} />
                    </div>
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-700 font-semibold shadow-sm text-sm sm:text-base">
                      {formData.phone || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Address Section */}
                <div className="space-y-4 sm:space-y-5 pt-4 sm:pt-6 border-t-2 border-neutral-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg sm:rounded-xl">
                      <FiMapPin className="text-white" size={16} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">Address Information</h3>
                  </div>

                  {/* Street */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                      Street Address
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address?.street || ''}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                        placeholder="Enter street address"
                      />
                    ) : (
                      <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-700 font-semibold shadow-sm text-sm sm:text-base">
                        {formData.address?.street || 'Not set'}
                      </div>
                    )}
                  </div>

                  {/* City, State, Zip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                        City
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address?.city || ''}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                          placeholder="City"
                        />
                      ) : (
                        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-700 font-semibold shadow-sm text-sm sm:text-base">
                          {formData.address?.city || 'Not set'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                        State
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address?.state || ''}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                          placeholder="State"
                        />
                      ) : (
                        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-700 font-semibold shadow-sm text-sm sm:text-base">
                          {formData.address?.state || 'Not set'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 sm:col-span-2 md:col-span-1">
                      <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                        ZIP Code
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address?.zipCode || ''}
                          onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                          placeholder="ZIP"
                        />
                      ) : (
                        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-700 font-semibold shadow-sm text-sm sm:text-base">
                          {formData.address?.zipCode || 'Not set'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                      Country
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address?.country || ''}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                        placeholder="Country"
                      />
                    ) : (
                      <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-700 font-semibold shadow-sm text-sm sm:text-base">
                        {formData.address?.country || 'Not set'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-neutral-200">
                    <button
                      onClick={handleCancel}
                      className="w-full sm:flex-1 px-5 sm:px-6 py-3 sm:py-4 border-2 border-neutral-300 rounded-lg sm:rounded-xl text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 font-black shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <FiX size={18} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="w-full sm:flex-1 px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 text-white rounded-lg sm:rounded-xl font-black hover:from-neutral-900 hover:via-neutral-950 hover:to-neutral-900 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden group text-sm sm:text-base"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      {loading ? (
                        <>
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FiSave size={18} className="relative z-10" />
                          <span className="relative z-10">Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Password Change Card - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-neutral-200/50 overflow-hidden hover:shadow-3xl transition-all duration-300">
              <div className="bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 border-b-2 border-neutral-700 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <FiLock className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">Security Settings</h2>
                    <p className="text-xs sm:text-sm text-neutral-300 mt-0.5">Manage your password</p>
                  </div>
                </div>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg sm:rounded-xl font-black transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border border-white/30 text-sm sm:text-base"
                  >
                    <FiEdit2 size={16} />
                    Change Password
                  </button>
                )}
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                {isChangingPassword ? (
                  <div className="space-y-4 sm:space-y-5">
                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-neutral-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-neutral-400/50 focus:border-neutral-500 outline-none transition-all duration-300 text-neutral-900 font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                      <button
                        onClick={handleCancel}
                        className="w-full sm:flex-1 px-5 sm:px-6 py-3 sm:py-4 border-2 border-neutral-300 rounded-lg sm:rounded-xl text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 font-black shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <FiX size={18} />
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className="w-full sm:flex-1 px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 text-white rounded-lg sm:rounded-xl font-black hover:from-neutral-900 hover:via-neutral-950 hover:to-neutral-900 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden group text-sm sm:text-base"
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        {loading ? (
                          <>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <FiCheckCircle size={18} className="relative z-10" />
                            <span className="relative z-10">Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-xl sm:rounded-2xl inline-block mb-4 sm:mb-6 border-2 border-neutral-200/50">
                      <FiShield className="text-neutral-600" size={32} />
                    </div>
                    <p className="text-neutral-700 font-semibold text-base sm:text-lg">Your password is secure</p>
                    <p className="text-neutral-500 text-xs sm:text-sm mt-2">Click "Change Password" to update your password</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Enhanced */}
          <div className="space-y-4 sm:space-y-6">
            {/* Account Summary Card - Enhanced */}
            <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-neutral-700 p-5 sm:p-6 md:p-8 text-white overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <FiStar className="text-white" size={18} />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight">Account Summary</h3>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                    <p className="text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1 sm:mb-2">Member Since</p>
                    <p className="text-base sm:text-lg md:text-xl font-black">
                      {userProfile?.createdAt
                        ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : 'Recently'}
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                    <p className="text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1 sm:mb-2">Last Updated</p>
                    <p className="text-base sm:text-lg md:text-xl font-black">
                      {userProfile?.updatedAt
                        ? new Date(userProfile.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'}
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                    <p className="text-xs font-bold text-neutral-300 uppercase tracking-widest mb-2 sm:mb-3">Account Status</p>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                      <p className="text-base sm:text-lg md:text-xl font-black">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-neutral-200/50 p-4 sm:p-6 hover:shadow-3xl transition-all duration-300">
              <h3 className="text-lg sm:text-xl font-black text-neutral-900 mb-4 sm:mb-6 tracking-tight flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg sm:rounded-xl">
                  <FiCheckCircle className="text-white" size={18} />
                </div>
                Quick Actions
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-100 to-neutral-50 hover:from-neutral-200 hover:to-neutral-100 rounded-lg sm:rounded-xl text-neutral-900 font-black transition-all duration-300 text-left flex items-center gap-2 sm:gap-3 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 border-2 border-neutral-200 hover:border-neutral-300 text-sm sm:text-base"
                >
                  <div className="p-1.5 sm:p-2 bg-neutral-800 rounded-lg">
                    <FiPackage className="text-white" size={16} />
                  </div>
                  <span>Order History</span>
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-100 to-neutral-50 hover:from-neutral-200 hover:to-neutral-100 rounded-lg sm:rounded-xl text-neutral-900 font-black transition-all duration-300 text-left flex items-center gap-2 sm:gap-3 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 border-2 border-neutral-200 hover:border-neutral-300 text-sm sm:text-base"
                >
                  <div className="p-1.5 sm:p-2 bg-neutral-800 rounded-lg">
                    <FiShoppingCart className="text-white" size={16} />
                  </div>
                  <span>Shopping Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={imageSrc}
        onClose={() => {
          setIsCropModalOpen(false);
          setImageSrc('');
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default Profile;
