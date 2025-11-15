// @refresh reload
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types/types';
import { useAuth } from './AuthContext';
import { database } from '../config/firebase';
import { ref, set, get, remove, onValue, off } from 'firebase/database';
import toast from 'react-hot-toast';

interface WishlistContextType {
  wishlistItems: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const { currentUser } = useAuth();

  // Load wishlist from Firebase when user changes
  useEffect(() => {
    if (!currentUser) {
      setWishlistItems([]);
      return;
    }

    const wishlistRef = ref(database, `users/${currentUser.uid}/wishlist`);

    onValue(wishlistRef, (snapshot) => {
      if (snapshot.exists()) {
        const wishlistData = snapshot.val();
        const items: Product[] = Object.values(wishlistData);
        setWishlistItems(items);
      } else {
        setWishlistItems([]);
      }
    });

    return () => {
      off(wishlistRef);
    };
  }, [currentUser]);

  const addToWishlist = async (product: Product) => {
    if (!currentUser) {
      toast.error('Please log in to add items to wishlist');
      return;
    }

    try {
      // Check if already in wishlist
      const wishlistRef = ref(database, `users/${currentUser.uid}/wishlist`);
      const snapshot = await get(wishlistRef);
      
      if (snapshot.exists()) {
        const existingItems = snapshot.val();
        if (existingItems[product.id]) {
          toast.error('Item already in wishlist');
          return;
        }
      }

      // Add to Firebase
      const productRef = ref(database, `users/${currentUser.uid}/wishlist/${product.id}`);
      await set(productRef, product);

      toast.success('Added to wishlist', {
        id: 'wishlist-add',
        duration: 2000,
      });
    } catch (error: any) {
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!currentUser) {
      return;
    }

    try {
      // Dismiss any pending "Added to wishlist" toast to prevent it from showing after removal
      toast.dismiss('wishlist-add');
      
      const productRef = ref(database, `users/${currentUser.uid}/wishlist/${productId}`);
      await remove(productRef);
      toast.success('Removed from wishlist', {
        id: 'wishlist-remove',
        duration: 2000,
      });
    } catch (error: any) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some((item) => item.id === productId);
  };

  const clearWishlist = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const wishlistRef = ref(database, `users/${currentUser.uid}/wishlist`);
      await set(wishlistRef, null);
      toast.success('Wishlist cleared');
    } catch (error: any) {
      toast.error('Failed to clear wishlist');
    }
  };

  const value: WishlistContextType = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

