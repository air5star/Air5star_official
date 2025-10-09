'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TProduct } from '../types/product';
import { cartAPI, handleApiError } from '@/lib/api';
import { useAuth } from './AuthContext';
import { productsData } from '@/data';

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    mrp?: number;
    imageUrl: string;
    category: any;
  };
  maxQuantity?: number;
};

type CartContextType = {
  cartItems: CartItem[];
  isLoading: boolean;
  addToCart: (productIdOrItem: string | CartItem, quantity?: number, productData?: any) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
  refreshCart: () => Promise<void>;
  syncWithLocalStorage: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load cart from localStorage for guest users
  const loadCartFromLocalStorage = useCallback(() => {
    if (!isClient) return;
    
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, [isClient]);

  // Load cart from API for authenticated users
  const loadCartFromAPI = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await cartAPI.get();
      
      if (result.error) {
        console.error('Failed to load cart:', result.error);
        loadCartFromLocalStorage(); // Fallback to localStorage
        return;
      }

      if (result.data) {
        const apiCartItems = (result.data as any).items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            mrp: item.product.mrp,
            imageUrl: item.product.imageUrl || '/placeholder-product.jpg',
            category: item.product.category
          },
          maxQuantity: item.availableStock || 100,
        }));
        setCartItems(apiCartItems);
        
        // Sync with localStorage for offline access
        if (isClient) {
          localStorage.setItem('cart', JSON.stringify(apiCartItems));
        }
      }
    } catch (error) {
      console.error('Error loading cart from API:', error);
      loadCartFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [isClient]);

  // Load cart on authentication change
  useEffect(() => {
    if (!isClient) return;
    
    if (isAuthenticated) {
      loadCartFromAPI();
    } else {
      loadCartFromLocalStorage();
    }
  }, [isAuthenticated, isClient, loadCartFromAPI, loadCartFromLocalStorage]);

  // Save cart to localStorage whenever it changes (for guest users)
  useEffect(() => {
    if (!isAuthenticated && isClient) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated, isClient]);

  // Add to cart function - works with both static data and future API
  const addToCart = async (productIdOrItem: string | CartItem, quantity: number = 1, productData?: any) => {
    // Handle both string productId and CartItem object
    let productId: string;
    let productInfo: Partial<CartItem> | null = null;
    
    if (typeof productIdOrItem === 'string') {
      productId = productIdOrItem;
      // Use productData parameter if provided
      if (productData) {
        productInfo = productData;
      }
    } else {
      // It's a CartItem object from ProductItem component
      productId = productIdOrItem.productId || productIdOrItem.id;
      productInfo = productIdOrItem;
      quantity = productIdOrItem.quantity || quantity;
    }
    
    // Create a composite key that includes category to avoid ID collisions
        const compositeProductId = productInfo?.category 
          ? `${productInfo.category}_${productId}` 
          : productId.toString();
    
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // For authenticated users, use API when available
        // Pass category information to help with correct product lookup
        const categoryInfo = productInfo?.category || (typeof productInfo === 'object' && 'category' in productInfo ? productInfo.category : undefined);
        const result = await cartAPI.add(productId, quantity, categoryInfo);
        
        if (result.error) {
          handleApiError(result);
          return;
        }
        
        // Refresh cart from API
        await loadCartFromAPI();
      } else {
        // For guest users, use static data and localStorage
        setCartItems((prevItems) => {
          const existingItemIndex = prevItems.findIndex(item => item.productId === compositeProductId);
          
          if (existingItemIndex !== -1) {
            // Item exists, update quantity
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex].quantity += quantity;
            return updatedItems;
          } else {
            let newItem: CartItem;
            
            if (productInfo) {
              // Use the product data passed from component
              newItem = {
                id: `temp_${Date.now()}`, // Temporary ID for guest users
                productId: compositeProductId,
                quantity,
                product: {
                  id: compositeProductId,
                  name: productInfo.name || 'Unknown Product',
                  price: productInfo.price || 0,
                  mrp: productInfo.mrp,
                  imageUrl: productInfo.imageUrl || '/placeholder-product.jpg',
                  category: productInfo.category || 'Unknown'
                },
                maxQuantity: 100, // Default stock for guest users
              };
            } else {
              // Find product details from static data
              let productDetails = null;
              for (const category of productsData) {
                  // If we have category info, prefer matching category to avoid ID collisions
                  if (productInfo?.category && category.category !== productInfo.category) {
                    continue;
                  }
                const product = category.products.find((p: any) => p.id.toString() === productId.toString());
                if (product) {
                  productDetails = product;
                  break;
                }
              }
              
              if (!productDetails) {
                console.error('Product not found:', productId);
                return prevItems;
              }
              
              // Create new cart item with actual product data
              newItem = {
                id: `temp_${Date.now()}`, // Temporary ID for guest users
                productId: compositeProductId,
                quantity,
                product: {
                  id: compositeProductId,
                  name: productDetails.productTitle || productDetails.name,
                  price: productDetails.price,
                  mrp: productDetails.mrp,
                  imageUrl: productDetails.imageUrl || '/placeholder-product.jpg',
                  // Normalize category to an object to improve UI consistency
                  category: typeof productDetails.category === 'string'
                    ? { name: productDetails.category, slug: productDetails.category }
                    : productDetails.category
                },
                maxQuantity: 100, // Default stock for guest users
              };
            }
            
            return [...prevItems, newItem];
          }
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // Find the productId from the itemId
        const item = cartItems.find(item => item.id === itemId);
        if (!item) {
          console.error('Item not found in cart:', itemId);
          return;
        }
        
        // For authenticated users, use API when available
        const result = await cartAPI.remove(item.productId);
        
        if (result.error) {
          handleApiError(result);
          return;
        }
        
        // Refresh cart from API
        await loadCartFromAPI();
      } else {
        // For guest users, remove from local state
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // Find the productId from the itemId
        const item = cartItems.find(item => item.id === itemId);
        if (!item) {
          console.error('Item not found in cart:', itemId);
          return;
        }
        
        // For authenticated users, use API when available
        const result = await cartAPI.update(item.productId, quantity);
        
        if (result.error) {
          handleApiError(result);
          return;
        }
        
        // Refresh cart from API
        await loadCartFromAPI();
      } else {
        // For guest users, update local state
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId ? { ...item, quantity } : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // For authenticated users, use API when available
        const result = await cartAPI.clear();
        
        if (result.error) {
          handleApiError(result);
          return;
        }
      }
      
      // Clear local state for both authenticated and guest users
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh cart from API
  const refreshCart = async () => {
    if (isAuthenticated) {
      await loadCartFromAPI();
    }
  };

  // Sync cart with localStorage (useful for guest users)
  const syncWithLocalStorage = () => {
    if (!isAuthenticated && isClient) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        refreshCart,
        syncWithLocalStorage
      }}
    >
      {children}
    </CartContext.Provider>
  );
};