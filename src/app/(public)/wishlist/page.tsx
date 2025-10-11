'use client';

import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const handleRemoveFromWishlist = async (productId: string) => {
    setLoadingItems(prev => new Set(prev).add(productId));
    try {
      await removeFromWishlist(productId);
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = (item: any) => {
    // Convert wishlist item to product format for cart
    const productData = {
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      price: item.product.price,
      category: item.product.category
    };
    addToCart(item.product.id, 1, productData);
  };

  const handleMoveToCart = async (item: any) => {
    handleAddToCart(item);
    await handleRemoveFromWishlist(item.productId);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
            
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon on any product.</p>
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
              My Wishlist ({wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'})
            </h1>
            {wishlistItems.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-red-600 hover:text-red-700 font-medium text-sm md:text-base"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid gap-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-3 md:p-6">
                <div className="flex flex-row gap-3 md:gap-4 items-start">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 relative bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={item.product.imageUrl || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                      <div className="flex-grow">
                        <Link href={`/products/${item.product.id}`}>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          {String(item.product.category)}
                        </p>
                        {item.product.brand && (
                          <p className="text-xs md:text-sm text-gray-500 mt-1">{item.product.brand}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg md:text-xl font-bold text-gray-900">
                            ₹{item.product.price.toLocaleString()}
                          </span>
                          {item.product.mrp && item.product.mrp > item.product.price && (
                            <span className="text-xs md:text-sm text-gray-500 line-through">
                              ₹{item.product.mrp.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="w-full md:w-auto flex flex-col gap-2 md:items-end">
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </button>
                        <div className="flex items-center justify-between md:justify-end gap-3">
                          <button
                            onClick={() => handleMoveToCart(item)}
                            className="text-sm md:text-base text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Move to Cart
                          </button>
                          <button
                            onClick={() => handleRemoveFromWishlist(item.productId)}
                            disabled={loadingItems.has(item.productId)}
                            className="p-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Shopping */}
          <div className="mt-6 md:mt-8 text-center">
            <Link
              href="/products"
              className="inline-flex items-center px-5 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;