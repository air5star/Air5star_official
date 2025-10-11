'use client';

import React from 'react'
import { TProduct } from '../types/product'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const Product: React.FC<{ product: TProduct }> = ({ product }) => {
  const { cartItems, addToCart } = useCart();
  
  // Find if this product is in cart and get its quantity
  const productInCart = cartItems.find(item => item.productId === String(product.id));
  const quantityInCart = productInCart ? productInCart.quantity : 0;
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation(); // Stop event bubbling

    addToCart(
      String(product.id),
      1,
      {
        name: product.name,
        imageUrl: product.imageUrl,
        category: product.category,
        price: product.price,
        brand: (product as any).brand,
      }
    );

    // Optional: Show a confirmation message
    alert(`${product.name} added to cart!`);
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <Link href={`/products/${product.category}/${product.id}`} className="flex flex-col flex-grow">
        <div className="w-full aspect-square relative p-2">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, 250px"
          />
          
          {quantityInCart > 0 && (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {quantityInCart}
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 flex-grow flex flex-col">
          <h3 className="text-center text-sm sm:text-base font-medium text-gray-800 hover:text-blue-900 transition-colors line-clamp-2 h-10 mb-2">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between mt-auto">
            <p className="font-semibold text-sm sm:text-base">
              ₹{product.price ? product.price.toLocaleString() : '0'}
            </p>
            
            <span className="text-xs text-gray-500">
              {product.brand || 'Brand'}
            </span>
          </div>
        </div>
      </Link>
      
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <button 
          onClick={handleAddToCart}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export default Product
