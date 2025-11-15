/**
 * Debug utility to check admin status
 * Run this in browser console: window.checkAdminStatus()
 */
import { checkAdminStatus } from '../services/adminService';
import { auth } from '../config/firebase';

export const debugAdminStatus = async () => {
  const user = auth.currentUser;
  if (!user) {
    return;
  }
  
  try {
    await checkAdminStatus(user.uid);
    
    // Also check Firebase directly
    const { ref, get } = await import('firebase/database');
    const { database } = await import('../config/firebase');
    const adminRef = ref(database, `admins/${user.uid}`);
    await get(adminRef);
  } catch (error) {
    // Error handled silently
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).checkAdminStatus = debugAdminStatus;
}

