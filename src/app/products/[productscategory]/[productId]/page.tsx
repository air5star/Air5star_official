'use client';
import React from 'react';
import { productsData } from '@/data';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Payment from '@/components/Payment';

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
  imageUrl?: string;
  thumbnail_images?: {
    thumbnail1?: string;
    thumbnail2?: string;
    thumbnail3?: string;
    thumbnail4?: string;
  };
};

type Props = {
  params: {
    productscategory: any;
    productId: any;
  };
};

const ProductIdPage = (props: Props) => {
  const category = productsData.find(
    (cat) => cat.category === props.params.productscategory
  );
  console.log('Hello category: ', category?.category);

  const product = category?.products.find(
    (pId) => String(pId.id) === props.params.productId
  ) as Product | undefined;

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
        <h1 className="font-semibold">Key Features</h1>
        <ul className="list-disc list-inside text-sm px-2">
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
    return (
      <div className="py-2">
        <h1 className="font-semibold">Key Features</h1>
        <ul className="list-disc list-inside text-sm px-2">
          <li>Ventilation Key Features are visible</li>
        </ul>
      </div>
    );
  };

  const discount = product ? product.mrp - product.price : 0;
  const discP =
    product && product.mrp ? Math.round((discount / product.mrp) * 100) : 0;

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {product ? (
          <div className="">
            <div className="flex flex-row pb-8 justify-between border-b">
              {/* Product Image section */}
              <div className="flex flex-col h-[500px] gap-6 items-center justify-around">
                <div className="flex flex-col items-center">
                  <Image
                    src={images[selectedIndex]}
                    alt={product?.productTitle || 'Product Image'}
                    width={350}
                    height={350}
                    className="object-contain"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronLeft />
                  </button>

                  <div className="flex gap-2">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={`border rounded-md p-1 cursor-pointer ${
                          selectedIndex === index
                            ? 'border-black'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumb ${index + 1}`}
                          className="w-16 h-16 object-contain"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>

              {/* Product Details Section */}
              <div className="md:w-[700px] md:h-[500px] md:overflow-y-scroll hide-scrollbar">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-black text-white text-xs px-2 py-1 rounded">
                    ₹4,000 Coupon
                  </span>
                  <span className="border border-gray-400 text-xs px-2 py-1 rounded">
                    New Arrival
                  </span>
                </div>

                <h1 className="text-2xl font-semibold mb-1">
                  {product.productTitle}
                </h1>
                <p className="mb-4">
                  <span className="text-bold">Capacity:</span>{' '}
                  <span className=" text-black px-2 rounded border border-black">
                    {product.grossVolume}
                  </span>
                </p>

                {/* Price Section */}
                <div className="flex items-center">
                  <p className="text-xl font-semibold mb-1">
                    MRP ₹{totalAmount.toLocaleString()}
                    <span className="text-sm text-gray-600 ml-2">
                      (Incl. of all taxes)
                    </span>
                  </p>
                  <p className="w-fit bg-green-600 text-sm  ml-2 px-2 py-0.5 text-white rounded-xl">
                    {discP}% off
                  </p>
                </div>

                <p>
                  Brand: <span className="font-semibold">{product.brand}</span>
                </p>
                <p className="text-sm text-gray-800 mb-4">
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
                <div className="flex items-center gap-4 mb-4">
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

                  <div className="flex gap-3 w-full">
                    <Payment amount={totalAmount} currency="INR" />
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
            <div className="w-[500px] md:h-[500px] pt-10">
              <h1 className="font-bold text-xl">Product Specifications</h1>
              <h1 className="pb-3 text-xl">{product.productTitle}</h1>
              <p className="pb-2">GENERAL FEATURES</p>
              <p className="flex items-center justify-between pb-2">
                <span className="font-medium">BRAND</span>{' '}
                <span>{product.brand}</span>
              </p>
              <p className="flex items-center justify-between pb-2">
                <span className="font-medium">CAPACITY</span>{' '}
                <span>{product.grossVolume}</span>
              </p>
              <p className="flex items-center justify-between pb-2">
                <span className="font-medium">TYPE</span> <span>Split AC</span>
              </p>
              <p className="flex items-center justify-between pb-2">
                <span className="font-medium">TECHNOLOGY</span>{' '}
                <span>Inverter</span>
              </p>
              <p className="flex items-center justify-between pb-2">
                <span className="font-medium">COMPRESSOR</span>{' '}
                <span>Inverter Rotary</span>
              </p>
              <p className="flex items-center justify-between pb-2">
                <span className="font-medium">STAR RATING</span>{' '}
                <span>{product.energyRating}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>No product found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductIdPage;
