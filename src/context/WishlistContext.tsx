'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { wishlistAPI, handleApiError } from '@/lib/api';
import { useAuth } from './AuthContext';

type WishlistItem = {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    mrp?: number;
    category: string;
    brand?: string;
  };
  createdAt: string;
};

type WishlistContextType = {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string | number) => boolean;
  wishlistCount: number;
  refreshWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

type WishlistProviderProps = {
  children: ReactNode;
};

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch wishlist items
  const fetchWishlist = async () => {
    if (!isAuthenticated || !user) {
      setWishlistItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await wishlistAPI.get();
      if (response.data) {
        setWishlistItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId: string) => {
    if (!isAuthenticated || !user) {
      // Handle guest user - could show login modal or store in localStorage
      console.warn('User must be logged in to add items to wishlist');
      return;
    }

    try {
      setIsLoading(true);
      const response = await wishlistAPI.add(productId);
      if (response.data) {
        // Refresh wishlist to get updated data
        await fetchWishlist();
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsLoading(true);
      // Find the wishlist item by productId
      const wishlistItem = wishlistItems.find(item => item.productId === productId);
      if (wishlistItem) {
        const response = await wishlistAPI.remove(wishlistItem.id);
        if (response.status === 200 || response.data) {
          // Remove from local state immediately for better UX
          setWishlistItems(prev => prev.filter(item => item.productId !== productId));
        }
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all wishlist items
  const clearWishlist = async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await wishlistAPI.clear();
      if (response.status === 200 || response.data) {
        // Clear local state
        setWishlistItems([]);
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: string | number): boolean => {
    const id = String(productId);
    return wishlistItems.some(item => item.productId === id);
  };

  // Refresh wishlist
  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  // Get wishlist count
  const wishlistCount = wishlistItems.length;

  // Fetch wishlist on mount and when auth state changes
  useEffect(() => {
    if (isClient) {
      fetchWishlist();
    }
  }, [isAuthenticated, user, isClient]);

  const value: WishlistContextType = {
    wishlistItems,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    wishlistCount,
    refreshWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;