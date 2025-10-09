import React from 'react';
import { TProduct } from '../types/product'
import CategoryItem from './CategoryItem'

const CategoryCard: React.FC<{products: TProduct[]}> = ({products}) => {
  return (
    <div className='w-full'>
      {products.map((product) => (
        <div key={product.id} className="w-full">
          <CategoryItem key={product.id} product={product} />
        </div>
      ))}
    </div>
  )
} 

export default CategoryCard
