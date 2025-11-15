// @refresh reload
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types/types';
import { useAuth } from './AuthContext';
import { database } from '../config/firebase';
import { ref, set, onValue, off } from 'firebase/database';
import toast from 'react-hot-toast';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, silent?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: (silent?: boolean) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { currentUser } = useAuth();

  // Load cart from Firebase (for logged-in users) or localStorage (for anonymous users)
  useEffect(() => {
    if (currentUser) {
      // Load from Firebase for logged-in users
      const cartRef = ref(database, `users/${currentUser.uid}/cart`);
      
      onValue(cartRef, (snapshot) => {
        if (snapshot.exists()) {
          const cartData = snapshot.val();
          const items: CartItem[] = Object.values(cartData);
          setCartItems(items);
        } else {
          // If Firebase cart is empty, check localStorage and merge if exists
          try {
            const localCart = localStorage.getItem('cart');
            if (localCart) {
              const parsedCart = JSON.parse(localCart);
              if (parsedCart.length > 0) {
                // Merge localStorage cart to Firebase
                const cartObject: Record<string, CartItem> = {};
                parsedCart.forEach((item: CartItem) => {
                  cartObject[item.product.id] = item;
                });
                set(cartRef, cartObject).catch(() => {
                });
                setCartItems(parsedCart);
                // Clear localStorage after merging
                localStorage.removeItem('cart');
                return;
              }
            }
          } catch (error) {
          }
          setCartItems([]);
        }
        setIsInitialLoad(false);
      });

      return () => {
        off(cartRef);
      };
    } else {
      // Load from localStorage for anonymous users
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
        }
      } catch (error) {
      }
      setIsInitialLoad(false);
    }
  }, [currentUser]);

  // Save cart to Firebase or localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    // Skip saving on initial load to prevent overwriting with empty cart
    if (isInitialLoad) {
      return;
    }

    if (currentUser) {
      // Save to Firebase for logged-in users
      const cartRef = ref(database, `users/${currentUser.uid}/cart`);
      if (cartItems.length > 0) {
        // Convert array to object with product IDs as keys
        const cartObject: Record<string, CartItem> = {};
        cartItems.forEach((item) => {
          cartObject[item.product.id] = item;
        });
        set(cartRef, cartObject).catch(() => {
        });
      } else {
        // Clear cart in Firebase if empty
        set(cartRef, null).catch(() => {
        });
      }
    } else {
      // Save to localStorage for anonymous users
      try {
        if (cartItems.length > 0) {
          localStorage.setItem('cart', JSON.stringify(cartItems));
        } else {
          localStorage.removeItem('cart');
        }
      } catch (error) {
      }
    }
  }, [cartItems, currentUser, isInitialLoad]);

  const addToCart = (product: Product, quantity: number = 1, silent: boolean = false) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);

      if (existingItem) {
        // Update quantity if item already exists
        const newQuantity = existingItem.quantity + quantity;
        if (!silent) {
          // Use same toast ID to replace previous toast instead of creating new ones
          toast.success(`Added ${quantity} more to cart`, {
            id: 'cart-update',
            duration: 2000,
          });
        }
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item to cart
        if (!silent) {
          const quantityText = quantity > 1 ? ` (${quantity} items)` : '';
          // Use same toast ID to replace previous toast instead of creating new ones
          toast.success(`Added to cart${quantityText}`, {
            id: 'cart-update',
            duration: 2000,
          });
        }
        return [...prevItems, { product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => {
      const item = prevItems.find((item) => item.product.id === productId);
      if (item) {
        // Use same toast ID to replace previous toast instead of creating new ones
        toast.success(`${item.product.name} removed from cart`, {
          id: 'cart-remove',
          duration: 2000,
        });
      }
      return prevItems.filter((item) => item.product.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) => {
      return prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = (silent: boolean = false) => {
    setCartItems([]);
    if (!silent) {
      toast.success('Cart cleared');
    }
    // Note: The useEffect will handle clearing Firebase/localStorage automatically
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

