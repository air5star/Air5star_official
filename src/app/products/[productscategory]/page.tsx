import { productsData } from '@/data';
import { AProducts } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';

type ProductType = {
  id: string | number;
  category: string;
  subCategory: string;
  brand: string;
  productTitle: string;
  description: string;
  mrp: number;
  price: number;
  gst: number;
  grossVolume: string;
  energyRating: string;
  swing: string;
  inverter_non_inverter: string;
  model: string;
  imageUrl: string;
  thumbnail_images: {
    thumbnail1: string;
    thumbnail2: string;
    thumbnail3: string;
    thumbnail4: string;
  };
};

type ProductCategory = {
  category: string;
  products: ProductType[];
};

const ProductCategoryPage = ({
  params,
}: {
  params: { productscategory: string };
}) => {
  const productsCategory = productsData.find(
    (product) => product.category === params.productscategory
  );
  const url = `/banner-images/specific-categories/${productsCategory?.category}-category.png`;

  return (
    <div>
      {/* Category banner Image */}
      <div className="">
        <div className="relative mt-5 mx-auto h-[400px] w-[1400px] bg-[#0a2a56]">
          <div className="relative h-full w-full px-4">
            <Image
              src={url}
              alt={`${productsCategory?.category}`}
              fill
              className="object-fill"
              priority
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 py-8 px-24">
        {productsCategory && productsCategory.products.length > 0 ? (
          productsCategory.products.map((product) => {
            const discount = product.mrp - product.price;
            const discP = Math.round((discount / product.mrp) * 100);
            return (
              <Link
                key={product.id}
                href={`/products/${params.productscategory}/${product.id}`}
              >
                <div className="flex h-[350px] flex-col bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
                  <Image
                    src={product.imageUrl || '/placeholder.png'}
                    alt={product.productTitle}
                    width={300}
                    height={230}
                    className="h-[180px] mb-4"
                  />
                  <div className="flex flex-col">
                    <h3 className="text-md font-bold mb-2">
                      {product.productTitle}
                    </h3>
                    <div className="flex items-center">
                      <p className="text-lg font-bold mr-2">₹{product.price}</p>
                      <span className="text-sm">
                        MRP₹
                        <span className="line-through text-sm">
                          {product.mrp}
                        </span>
                      </span>
                      <p className="w-fit bg-green-600 text-sm  ml-2 px-2 py-0.5 text-white rounded-xl">
                        {discP}% off
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-4 text-center text-gray-500">
            No products found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategoryPage;
