import { checkAdminStatus } from '../services/adminService';

/**
 * Check if a user is an admin
 * This function is synchronous for immediate checks, but uses cached admin status
 * For async checks, use checkAdminStatus from adminService directly
 */
let adminCache: Map<string, { isAdmin: boolean; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Synchronous check using cache (for immediate UI updates)
 * Can also accept email for backward compatibility, but prefers userId
 */
export const isAdmin = (userIdOrEmail: string | null | undefined): boolean => {
  if (!userIdOrEmail) return false;
  
  const cached = adminCache.get(userIdOrEmail);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.isAdmin;
  }
  
  // If not cached, return false (will be updated by async check)
  return false;
};

/**
 * Async check that fetches from Firebase and updates cache
 */
export const checkAndCacheAdminStatus = async (userId: string | null | undefined): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const isAdminUser = await checkAdminStatus(userId);
    adminCache.set(userId, { isAdmin: isAdminUser, timestamp: Date.now() });
    return isAdminUser;
  } catch (error) {
    return false;
  }
};

/**
 * Clear admin cache for a user (useful after admin status changes)
 */
export const clearAdminCache = (userId?: string) => {
  if (userId) {
    adminCache.delete(userId);
  } else {
    adminCache.clear();
  }
};

