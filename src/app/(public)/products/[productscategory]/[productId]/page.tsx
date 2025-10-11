'use client';
import React from 'react';
import { productsData } from '@/data';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import Payment from '@/components/Payment';
import { useCart } from '@/context/CartContext';
import { useRouter, useParams } from 'next/navigation';

import '@/styles/scrollbar.css';

type Product = {
  id: number;
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
  power?: string;
  speed?: number | string;
  imageUrl?: string;
  thumbnail_images?: {
    thumbnail1?: string;
    thumbnail2?: string;
    thumbnail3?: string;
    thumbnail4?: string;
  };
};

const ProductIdPage = () => {
  const { productscategory, productId } = useParams() as { productscategory: string; productId: string };
  
  const category = productsData.find(
    (cat) => cat.category === productscategory
  );
  console.log('Hello category: ', category?.category);

  const product = category?.products.find(
    (pId) => String(pId.id) === productId
  ) as Product | undefined;
  
  const { addToCart } = useCart();
  const router = useRouter();

  console.log(product);

  // Quantity state
  const [quantity, setQuantity] = useState(1);

  // Calculate total amount based on quantity
  const totalAmount =
    product && typeof (product as any).price === 'number'
      ? (product as any).price * quantity
      : 0;

  // Thumbnail Images function
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Convert thumbnail_images object to array
  const images =
    product && product.thumbnail_images
      ? Object.values(product.thumbnail_images)
      : [];

  const handleNext = () => {
    if (images.length > 0) {
      setSelectedIndex((prev) => (prev + 1) % images.length);
    }
    console.log('Next image:', images[selectedIndex]);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  //  Key Features based on category
  // AC
  const acKF = () => {
    return (
      <div className="py-2">
        <h1 className="font-semibold text-base sm:text-lg">Key Features</h1>
        <ul className="list-disc list-inside text-xs sm:text-sm px-2">
          <li>{product?.grossVolume} Capacity</li>
          <li>{product?.energyRating} Star Energy Rating</li>
          <li>Smart 4-Way Swing</li>
          <li>Turbo Cool</li>
          <li>Installation Check</li>
          <li>Low Gas Detection</li>
          <li>Clean Filter Indication</li>
          <li>Wi-Fi Ready (Optional Wi-Fi)</li>
          <li>Clean Air Filter</li>
          <li>Golden Fin Evaporator</li>
          <li>Hidden LED Display</li>
          <li>Stabilizer Free Operation</li>
          <li>Strong Dehumidifier</li>
          <li>Blow Function</li>
          <li>100% Copper</li>
          <li>Eco Friendly Refrigerant</li>
          <li>Anti Corrosion Coating</li>
          <li>
            IDU Dimensions: Height: 31.6 cm | Width: 92 cm | Depth: 22.2 cm
          </li>
          <li>ODU Dimensions: Height: 52 cm | Width: 83.5 cm | Depth: 30 cm</li>
        </ul>
      </div>
    );
  };

  // Ventilation
  const ventilationKF = () => {
    const hasAutoShutter = (product?.description || '').toLowerCase().includes('automatic shutter');
    return (
      <div className="py-2">
        <h1 className="font-semibold text-base sm:text-lg">Key Features</h1>
        <ul className="list-disc list-inside text-xs sm:text-sm px-2">
          <li>High airflow {product?.swing ? `(${product.swing})` : ''}</li>
          <li>Energy efficient {product?.power ? `(${product.power})` : ''}</li>
          <li>Low noise operation</li>
          <li>Durable design with rust-proof body</li>
          {hasAutoShutter && <li>Automatic shutter for dust protection</li>}
          <li>Easy installation; ideal for kitchen, bathroom, office</li>
          {product?.model && <li>Model: {product.model}</li>}
          {product?.brand && <li>Brand: {product.brand}</li>}
        </ul>
      </div>
    );
  };

  const discount = product ? product.mrp - product.price : 0;
  const discP =
    product && product.mrp ? Math.round((discount / product.mrp) * 100) : 0;

  // Coupon display based on category
  const couponAmount = category?.category === 'ventilation' ? 200 : 4000;

  return (
    <div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {product ? (
          <div className="">
            <div className="flex flex-col md:flex-row pb-6 md:pb-8 justify-between border-b gap-6 md:gap-4">
              {/* Product Image section */}
              <div className="flex flex-col h-auto md:h-[500px] gap-4 md:gap-6 items-center justify-around">
                <div className="flex flex-col items-center">
                  <Image
                    src={images[selectedIndex]}
                    alt={product?.productTitle || 'Product Image'}
                    width={350}
                    height={350}
                    className="object-contain w-full max-w-[280px] sm:max-w-[320px] md:max-w-[350px]"
                    priority={true}
                  />
                </div>

                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 w-full max-w-[320px] md:max-w-[350px]">
                  <button
                    onClick={handlePrev}
                    className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
                  >
                    <ChevronLeft />
                  </button>

                  <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={`border rounded-md p-1 cursor-pointer flex-shrink-0 ${
                          selectedIndex === index
                            ? 'border-black'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumb ${index + 1}`}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>

              {/* Product Details Section */}
              <div className="w-full md:w-[700px] max-h-full md:h-[500px] md:overflow-y-scroll hide-scrollbar">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-black text-white text-xs px-2 py-1 rounded">
                    ₹{couponAmount.toLocaleString()} Coupon
                  </span>
                  <span className="border border-gray-400 text-xs px-2 py-1 rounded">
                    New Arrival
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-semibold mb-1">
                  {product.productTitle}
                </h1>
                <p className="mb-4">
                  <span className="text-bold">Capacity:</span>{' '}
                  <span className=" text-black px-2 rounded border border-black">
                    {product.grossVolume}
                  </span>
                </p>

                {/* Price Section */}
                <div className="flex items-center flex-wrap gap-2">
                  <p className="text-lg sm:text-xl font-semibold mb-1">
                    ₹{(product.price * quantity).toLocaleString()}
                    <span className="text-sm text-gray-600 ml-2">
                      (Incl. of all taxes)
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 line-through">
                    MRP ₹{(product.mrp * quantity).toLocaleString()}
                  </p>
                  <p className="w-fit bg-green-600 text-xs sm:text-sm px-2 py-0.5 text-white rounded-xl">
                    {discP}% off
                  </p>
                </div>

                <p>
                  Brand: <span className="font-semibold">{product.brand}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-800 mb-4">
                  EMI starting from{' '}
                  <span className="font-semibold">₹3,636/mo</span> for 24
                  months.{' '}
                  <span className="text-blue-600 underline cursor-pointer">
                    See EMI options
                  </span>
                </p>

                {/* Stock & Delivery */}
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <span className="text-sm font-medium">✔ In stock</span>
                </div>
                <div className="text-xs text-gray-600 mb-4">
                  {/* 🚚 Free delivery by <strong>Tomorrow, 2 PM</strong> */}
                </div>

                {/* Quantity + Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
                  <div className="flex items-center gap-2 border rounded px-2 py-1">
                    <span className="text-sm">Qty</span>
                    <select
                      className="border-none focus:outline-none text-sm"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4].map((qty) => (
                        <option key={qty} value={qty}>
                          {qty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 w-full mt-2 sm:mt-0">
                    <button
                      onClick={() => {
                        if (product) {
                          addToCart(
                            String(product.id),
                            quantity,
                            {
                              name: product.productTitle,
                              imageUrl: images[0] || '/placeholder-product.jpg',
                              category: category?.category || '',
                              price: product.price,
                              brand: product.brand,
                            }
                          );
                          alert('Product added to cart!');
                        }
                      }}
                      className="bg-blue-600 text-white rounded-full px-6 py-2 text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        if (product) {
                          addToCart(
                            String(product.id),
                            quantity,
                            {
                              name: product.productTitle,
                              imageUrl: images[0] || '/placeholder-product.jpg',
                              category: category?.category || '',
                              price: product.price,
                              brand: product.brand,
                            }
                          );
                          router.push('/checkout');
                        }
                      }}
                      className="bg-orange-600 text-white rounded-full px-6 py-2 text-sm font-medium hover:bg-orange-700 transition-colors"
                    >
                      Buy Now
                    </button>
                </div>
                </div>

                {/* Offer Footer */}
                <div className="bg-green-100 px-4 py-2 text-green-700 text-sm rounded-md flex justify-between items-center">
                  Extra Deals Available{' '}
                  <span className="text-blue-600 cursor-pointer">See All</span>
                </div>

                {/* Key features */}
                <div>
                  {category?.category === 'air-conditioning' && acKF()}
                  {category?.category === 'ventilation' && ventilationKF()}
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="w-full max-w-full md:max-w-[500px] md:h-[500px] pt-6 md:pt-10">
              <h1 className="font-bold text-lg sm:text-xl">Product Specifications</h1>
              <h1 className="pb-2 sm:pb-3 text-base sm:text-xl">{product.productTitle}</h1>
              {category?.category === 'ventilation' ? (
                <>
                  <p className="pb-2 text-sm sm:text-base">GENERAL FEATURES</p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">BRAND</span>{' '}
                    <span>{product.brand}</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">TYPE</span>{' '}
                    <span>{product.subCategory || 'Ventilation Fan'}</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">POWER</span>{' '}
                    <span>{product.power || '-'}</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">SPEED</span>{' '}
                    <span>{product.speed ? `${product.speed} RPM` : '-'}</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">SIZE</span>{' '}
                    <span>{product.swing || '-'}</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">MODEL</span>{' '}
                    <span>{product.model}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="pb-2 text-sm sm:text-base">GENERAL FEATURES</p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">BRAND</span>{' '}
                    <span>{product.brand}</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">CAPACITY</span>{' '}
                    <span>{product.grossVolume}</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">TYPE</span> <span>Split AC</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">TECHNOLOGY</span>{' '}
                    <span>Inverter</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">COMPRESSOR</span>{' '}
                    <span>Inverter Rotary</span>
                  </p>
                  <p className="flex items-center justify-between pb-2 text-sm sm:text-base">
                    <span className="font-medium">STAR RATING</span>{' '}
                    <span>{product.energyRating}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full py-10">
            <p className="text-base sm:text-lg">No product found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductIdPage;
