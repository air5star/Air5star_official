import { TProduct } from '../types/product'
import Product from './Product'

const CategoryCard: React.FC<{products: TProduct[]}> = ({products}) => {
  return (
    <div className='grid'>
      {products.map((product) => (
        <Product key={product.id} product={product} />
      ))}
    </div>
  )
} 

export default CategoryCard
