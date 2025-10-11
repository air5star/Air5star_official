'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, TrendingUp, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface RecommendationItem {
  id: string;
  name: string;
  price: number;
  mrp: number;
  imageUrl: string;
  category: string;
  brand: string;
  description: string;
  score: number;
  reason: string;
}

interface ProductRecommendationsProps {
  type?: 'similar' | 'trending' | 'personalized' | 'category';
  productId?: string;
  category?: string;
  limit?: number;
  title?: string;
  className?: string;
  showReason?: boolean;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  type = 'trending',
  productId,
  category,
  limit = 8,
  title,
  className = '',
  showReason = false
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  
  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          type,
          limit: limit.toString()
        });
        
        if (userId) params.append('user_id', userId);
        if (productId) params.append('product_id', productId);
        if (category) params.append('category', category);
        
        const response = await fetch(`/api/recommendations?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setRecommendations(data.data.recommendations);
        } else {
          throw new Error(data.error || 'Failed to load recommendations');
        }
        
      } catch (err) {
        console.error('Recommendations error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [type, productId, category, limit, userId]);
  
  // Track user interaction
  const trackInteraction = async (productId: string, action: string) => {
    if (!userId) return;
    
    try {
      await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          product_id: productId,
          action
        })
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = (product: RecommendationItem) => {
    addToCart(
      product.id,
      1,
      {
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        imageUrl: product.imageUrl,
        category: product.category,
        brand: product.brand,
      }
    );

    trackInteraction(product.id, 'add_to_cart');
  };
  
  // Handle wishlist toggle
  const handleWishlistToggle = (product: RecommendationItem) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      trackInteraction(product.id, 'remove_from_wishlist');
    } else {
      // Wishlist API expects a productId string
      addToWishlist(product.id);
      trackInteraction(product.id, 'add_to_wishlist');
    }
  };
  
  // Handle product view
  const handleProductView = (productId: string) => {
    trackInteraction(productId, 'view');
  };
  
  // Get default title based on type
  const getDefaultTitle = () => {
    switch (type) {
      case 'similar':
        return 'Similar Products';
      case 'trending':
        return 'Trending Products';
      case 'personalized':
        return 'Recommended for You';
      case 'category':
        return `Popular in ${category || 'Category'}`;
      default:
        return 'You Might Also Like';
    }
  };
  
  const displayTitle = title || getDefaultTitle();
  
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{displayTitle}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error || recommendations.length === 0) {
    return null; // Don't show anything if there's an error or no recommendations
  }
  
  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            {type === 'trending' && <TrendingUp className="h-6 w-6 text-primary" />}
            {type === 'personalized' && <Star className="h-6 w-6 text-primary" />}
            {displayTitle}
          </h2>
          {showReason && recommendations[0]?.reason && (
            <p className="text-sm text-gray-600">{recommendations[0].reason}</p>
          )}
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden rounded-t-lg group">
              <Link 
                href={`/product/${product.id}`}
                onClick={() => handleProductView(product.id)}
              >
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                />
              </Link>
              
              {/* Wishlist Button */}
              <button
                onClick={() => handleWishlistToggle(product)}
                className={`absolute top-2 right-2 p-2 rounded-full transition-colors duration-200 ${
                  isInWishlist(product.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </button>
              
              {/* Quick View */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Link 
                  href={`/product/${product.id}`}
                  onClick={() => handleProductView(product.id)}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Quick View
                </Link>
              </div>
            </div>
            
            {/* Product Info */}
            <div className="p-4">
              <Link 
                href={`/product/${product.id}`}
                onClick={() => handleProductView(product.id)}
              >
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-primary transition-colors duration-200">
                  {product.name}
                </h3>
              </Link>
              
              <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
              
              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-gray-900">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      ₹{product.mrp.toLocaleString()}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
                    </span>
                  </>
                )}
              </div>
              
              {/* Reason (if enabled) */}
              {showReason && (
                <p className="text-xs text-gray-500 mb-3">{product.reason}</p>
              )}
              
              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product)}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendations;