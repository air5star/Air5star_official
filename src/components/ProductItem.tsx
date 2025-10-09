'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Minus, Plus, Heart } from 'lucide-react';
import { TProduct } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const ProductItem: React.FC<{ product: TProduct }> = ({ product }) => {
  const { addToCart, cartItems } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, isLoading: wishlistLoading } = useWishlist();
  // Find if this product is in cart and get its quantity
  const productInCart = cartItems.find(item => item.productId === String(product.id));
  const [quantity, setQuantity] = useState(productInCart ? productInCart.quantity : 1);
  const [isWishlistAnimating, setIsWishlistAnimating] = useState(false);
  
  const isProductInWishlist = isInWishlist(product.id);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation(); // Stop event bubbling
    
    // Pass productId, quantity, and product data for guest users
    addToCart(String(product.id), quantity, {
      name: product.name,
      imageUrl: product.imageUrl,
      category: product.category,
      price: product.price
    });
  };
  
  const incrementQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };
  
  const decrementQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (wishlistLoading) return;
    
    setIsWishlistAnimating(true);
    
    try {
      if (isProductInWishlist) {
        await removeFromWishlist(String(product.id));
      } else {
        await addToWishlist(String(product.id));
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      // Reset animation after a short delay
      setTimeout(() => setIsWishlistAnimating(false), 300);
    }
  };
  
  // Calculate discount percentage if both mrp and price are available
  const discountPercentage = product.mrp && product.price && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
    
  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-[280px] sm:h-[340px] relative">
      {/* Wishlist Heart Icon */}
      <button
        onClick={handleWishlistToggle}
        disabled={wishlistLoading}
        className={`absolute top-2 right-2 z-20 p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 group ${
          isWishlistAnimating ? 'animate-pulse scale-110' : 'hover:scale-110'
        } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isProductInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        aria-label={isProductInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart
          className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 ${
            isProductInWishlist
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 group-hover:text-red-500'
          }`}
        />
      </button>
      
      <Link href={`/products/${product.category}/${product.id}`} className="flex flex-col flex-1 overflow-hidden">
        {/* Product Image */}
        <div className="relative overflow-hidden p-2 flex items-center justify-center h-[130px] sm:h-[160px]">
          <Image
            src={product.imageUrl || '/placeholder-product.jpg'}
            alt={product.name}
            width={150}
            height={150}
            className="object-contain max-h-[120px] sm:max-h-[150px] w-auto transition-transform duration-300 hover:scale-105"
            priority={false}
          />
        </div>
        
        <div className="px-2 sm:px-3 pt-1 pb-1 flex-1 flex flex-col">
          {/* Category Tag */}
          <div className="mb-1">
            <span className="text-[8px] sm:text-xs uppercase text-gray-500 tracking-wider font-medium">
              {product.category}
            </span>
          </div>
          
          {/* Product Title - Fixed height with ellipsis */}
          <div className="mb-1">
            <h3 className="text-[10px] sm:text-sm font-medium text-gray-900 line-clamp-2 h-[28px] sm:h-[40px] overflow-hidden">
              {product.name}
            </h3>
          </div>
          
          {/* Sold By */}
          <div className="mb-1">
            <span className="text-[8px] sm:text-xs text-gray-500">
              Sold By: {product.brand || 'admin'}
            </span>
          </div>
          
          {/* Pricing Section - Improved styling */}
          <div className="flex flex-col w-full mt-auto pt-1 border-t border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-bold text-[11px] sm:text-sm text-gray-900">
                  ₹{product.price ? product.price.toLocaleString() : '0'}
                </span>
                
                {product.mrp && product.mrp > product.price && (
                  <span className="text-[8px] sm:text-xs text-gray-400 line-through">
                    ₹{product.mrp.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Quantity Selector and Add to Cart - Fixed at bottom */}
      <div className="flex items-center justify-between p-2 border-t border-gray-100 mt-auto">
        {/* Quantity Selector - More compact */}
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden h-7">
          <button 
            onClick={decrementQuantity} 
            className="px-1 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <span className="px-2 text-[10px] font-medium w-5 text-center">{quantity}</span>
          <button 
            onClick={incrementQuantity} 
            className="px-1 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>
        
        {/* Add to Cart Button - Consistent size */}
        <button 
          onClick={(e) => handleAddToCart(e)}
          className="flex items-center justify-center px-2 sm:px-3 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors text-[10px] sm:text-xs font-medium"
          aria-label="Add to cart"
        >
          <ShoppingCart className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Add to cart</span>
          <span className="inline sm:hidden">Add</span>
        </button>
      </div>
    </div>
  );
};

export default ProductItem;