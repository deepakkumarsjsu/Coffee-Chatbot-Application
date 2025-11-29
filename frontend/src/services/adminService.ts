import { ref, get, set, remove, DataSnapshot } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Check if a user is an admin by fetching from Firebase Realtime Database
 */
export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const adminRef = ref(database, `admins/${userId}`);
    const snapshot: DataSnapshot = await get(adminRef);
    
    if (snapshot.exists()) {
      const adminData = snapshot.val();
      // Check if admin status is true and not expired (if expiration is set)
      if (adminData.isAdmin === true) {
        if (adminData.expiresAt) {
          const expirationDate = new Date(adminData.expiresAt);
          if (expirationDate > new Date()) {
            return true;
          } else {
            // Admin status expired, remove it
            await remove(adminRef);
            return false;
          }
        }
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Add a user as admin
 */
export const addAdmin = async (userId: string, email: string, expiresAt?: string): Promise<void> => {
  try {
    const adminRef = ref(database, `admins/${userId}`);
    await set(adminRef, {
      isAdmin: true,
      email: email,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
    });
  } catch (error) {
    throw new Error('Failed to add admin. Please try again later.');
  }
};

/**
 * Remove admin status from a user
 */
export const removeAdmin = async (userId: string): Promise<void> => {
  try {
    const adminRef = ref(database, `admins/${userId}`);
    await remove(adminRef);
  } catch (error) {
    throw new Error('Failed to remove admin. Please try again later.');
  }
};

/**
 * Get all admins
 */
export const getAllAdmins = async (): Promise<Array<{ userId: string; email: string; createdAt: string; expiresAt?: string }>> => {
  try {
    const adminsRef = ref(database, 'admins');
    const snapshot: DataSnapshot = await get(adminsRef);
    
    if (snapshot.exists()) {
      const adminsData = snapshot.val();
      return Object.keys(adminsData)
        .map((userId) => ({
          userId,
          email: adminsData[userId].email || '',
          createdAt: adminsData[userId].createdAt || '',
          expiresAt: adminsData[userId].expiresAt || undefined,
        }))
        .filter((admin) => {
          // Filter out expired admins
          if (admin.expiresAt) {
            return new Date(admin.expiresAt) > new Date();
          }
          return true;
        });
    }
    return [];
  } catch (error) {
    throw new Error('Failed to fetch admins. Please try again later.');
  }
};

