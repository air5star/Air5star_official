import React from 'react'
import { TProduct } from '../types/product'
import Image from 'next/image'
import Link from 'next/link'

const Product: React.FC<{ product: TProduct }> = ({ product }) => {
  return (
    <div className="w-full max-w-[200px] bg-white border rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-between p-4 mx-auto">
      <Link href={`/products/${product.category}`} className="w-full flex flex-col items-center">
        <div className="w-24 h-24 relative mb-4">
          <Image
            src={product.imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="contain"
          />
        </div>
        <h1 className="text-center text-sm font-medium mb-3">{product.name}</h1>
      </Link>
    </div>
  )
}

export default Product
