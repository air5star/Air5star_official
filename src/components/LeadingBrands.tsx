import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';

const LeadingBrands = () => {
  return (
    <section className="bg-gray-50 py-10 md:py-16 my-8 md:my-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center">
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 md:mb-4 text-gray-900">Discover Premium HVAC Brands</h2>
            <p className="text-sm md:text-base text-gray-600 px-2 md:px-0">
              Explore our collection of trusted HVAC brands including Voltas, Blue Star, Daikin and more - where innovation
              meets reliability, only at Air5Star.
            </p>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-8 mb-8 md:mb-12 w-full max-w-5xl">
            {/* Brand 1 - Voltas */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-center group">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={'/leadingBrands-imgs/voltas.jpeg'}
                  alt={'Voltas'}
                  width={80}
                  height={80}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
            
            {/* Brand 2 - LG */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-center group">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={'/leadingBrands-imgs/lg.svg'}
                  alt={'LG'}
                  width={80}
                  height={80}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
            
            {/* Brand 3 - Whirlpool */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-center group">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={'/leadingBrands-imgs/whirpool.svg'}
                  alt={'Whirlpool'}
                  width={80}
                  height={80}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
            
            {/* Brand 4 - Blue Star */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-center group">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={'/leadingBrands-imgs/bluestar.jpeg'}
                  alt={'Blue Star'}
                  width={80}
                  height={80}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
            
            {/* Brand 5 - Daikin */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-center group">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={'/leadingBrands-imgs/daikin.jpeg'}
                  alt={'Daikin'}
                  width={80}
                  height={80}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>

            {/* Additional brands from our product data */}
            <div className="hidden md:flex bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 items-center justify-center group">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={'/leadingBrands-imgs/havellss.png'}
                  alt={'Havells'}
                  width={80}
                  height={80}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>

            <div className="hidden md:flex bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 items-center justify-center group">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={'/leadingBrands-imgs/cromptonn.png'}
                  alt={'Crompton'}
                  width={80}
                  height={80}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>

            <div className="hidden md:flex bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 items-center justify-center group">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={'/leadingBrands-imgs/luker.png'}
                  alt={'Luker'}
                  width={80}
                  height={80}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
          </div>
          
          <Link href="/products">
            <Button className="bg-blue-900 hover:bg-blue-800 text-white rounded-md px-6 py-2 md:px-8 md:py-3 text-sm md:text-base font-medium transition-colors">
              Shop Top Brands
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LeadingBrands;
