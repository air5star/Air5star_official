'use client';

import React from 'react'
import { TProduct } from '../types/product'
import Image from 'next/image'
import Link from 'next/link'

const CategoryItem: React.FC<{ product: TProduct }> = ({ product }) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <Link href={`/products/${product.category}`} className="flex flex-col flex-grow">
        <div className="w-full aspect-square relative p-2">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, 250px"
          />
        </div>
        
        <div className="p-3 sm:p-4 flex-grow flex flex-col">
          <h3 className="text-center text-sm sm:text-base font-medium text-gray-800 hover:text-blue-900 transition-colors line-clamp-2 h-10 mb-2">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-center mt-auto">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              View Products
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default CategoryItem