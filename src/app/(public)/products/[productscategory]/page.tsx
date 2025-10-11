'use client';

import { productsData } from '@/data';
import { AProducts, TProduct } from '@/types/product';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import ProductItem from '@/components/ProductItem';

type ProductType = {
  id: string | number;
  category: string;
  subCategory?: string;
  brand: string;
  productTitle: string;
  description: string;
  mrp: number;
  price: number;
  gst?: number;
  grossVolume?: string;
  energyRating?: string;
  swing?: string;
  inverter_non_inverter?: string;
  model?: string;
  imageUrl: string;
  thumbnail_images: {
    thumbnail1?: string;
    thumbnail2?: string;
    thumbnail3?: string;
    thumbnail4?: string;
  };
};

// Convert ProductType to TProduct for our Product component
const convertToTProduct = (product: ProductType): TProduct => {
  return {
    id: Number(product.id),
    name: product.productTitle,
    category: product.category,
    price: product.price,
    mrp: product.mrp,  // Include original price
    imageUrl: product.imageUrl,
    description: product.description || '',
    brand: product.brand || '',
    // Add any other required fields
  };
};

type ProductCategory = {
  category: string;
  products: ProductType[];
};

const ProductCategoryPage = () => {
  // Use the useParams hook to get the params
  const params = useParams();
  const categoryParam = params.productscategory as string;
  
  const productsCategory = productsData.find(
    (product) => product.category === categoryParam
  );
  const url = `/banner-images/specific-categories/${productsCategory?.category}-category.png`;

  return (
    <div>
      {/* Category banner Image */}
      <div className="px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="relative mt-3 sm:mt-5 mx-auto h-[180px] sm:h-[250px] md:h-[350px] w-full max-w-[1400px] bg-[#0a2a56] overflow-hidden rounded-lg shadow-md">
          <div className="relative h-full w-full">
            <Image
              src={url}
              alt={`${productsCategory?.category}`}
              fill
              className="object-cover md:object-fill"
              sizes="(max-width: 640px) 95vw, (max-width: 768px) 95vw, (max-width: 1200px) 90vw, 1400px"
              priority
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-4 md:gap-6 py-3 sm:py-8 md:py-10 px-1.5 sm:px-6 md:px-8 lg:px-10">
        {productsCategory && productsCategory.products.length > 0 ? (
          productsCategory.products.map((product) => {
            const discount = product.mrp - product.price;
            const discP = Math.round((discount / product.mrp) * 100);
            return (
              <div key={product.id} className="relative">
                {discP > 0 && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1.5 py-0.5 z-10 rounded-br-md">
                    {discP}% off
                  </div>
                )}
                
                {/* Use our ProductItem component */}
                <ProductItem product={convertToTProduct(product)} />
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 sm:py-10">
            <p className="text-base sm:text-lg text-gray-600">No products found in this category.</p>
            <p className="text-sm text-gray-500 mt-2">Try browsing other categories.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategoryPage;
