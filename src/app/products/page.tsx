'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { productsData } from '@/data';

const ProductsPage = () => {
  const [airConditioning, setAirConditioning] = useState<any>([]);
  const [heating, setHeating] = useState<any>([]);
  const [ventilation, setVentilation] = useState<any>([]);
  const [hvac, setHVAC] = useState<any>([]);
  const [refrigiration, setRefrigiration] = useState<any>([]);

  // Fetching data of AC category
  const airCondData = () => {
    const data = productsData.find(
      (data) => data.category === 'air-conditioning'
    );
    return data?.products || [];
  };

  // Air conditioning 10 products
  const acData = airConditioning.slice(0, 10);

  // Fetching data of AC category
  const heatingData = () => {
    const data = productsData.find((data) => data.category === 'heating');
    return data?.products || [];
  };

  // Air conditioning 10 products
  const heatData = heating.slice(0, 10);
  console.log(heatData);

  useEffect(() => {
    setAirConditioning(airCondData());
    setHeating(heatingData());
  }, []);

  return (
    <div className="">
      <div className="container md:w-7xl mt-8 mx-auto">
        {/* Text to highlight */}
        <div className="mb-8">
          <p className="text-center md:text-2xl">
            Welcome to Air5Star Where Product Meets Quality
          </p>
        </div>

        {/* Discounts */}
        <div className="border-1 border-black h-[100px] mb-5">
          <h1 className="text-2xl text-center">Discounts Here [slideshow]</h1>
        </div>

        {/* Products based on  Categories */}
        {/* ACs */}
        <div className="bg-gray-100 rounded-lg py-8 px-4 mb-10">
          <h1 className="mb-4 px-2 text-xl font-semibold">Air Conditioners</h1>
          {airConditioning.length > 0 ? (
            <ul className="flex flex-row w-full gap-x-8 overflow-x-scroll scrollbar-hidden">
              {acData.map((data: any) => (
                <li className="bg-white rounded-lg" key={data.id}>
                  <div className="w-[250px] h-[250px] p-4">
                    <h1>{data.name}</h1>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p>No Products Found. Please Try Again</p>
            </div>
          )}
        </div>

        {/* Heating */}
        <div className="bg-gray-100 rounded-lg py-8 px-4 mb-10">
          <h1 className="mb-4 px-2 text-xl font-semibold">
            Heating Products from Air5Star
          </h1>
          {heating.length > 0 ? (
            <ul className="flex flex-row w-full gap-x-8 overflow-x-scroll scrollbar-hidden">
              {heatData.map((data: any) => (
                <li className="bg-white rounded-lg" key={data.id}>
                  <div className="w-[250px] h-[250px] p-4">
                    <h1>{data.name}</h1>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p>No Products Found. Please Try Again</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
