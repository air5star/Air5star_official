import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React from 'react';

const LeadingBrands = () => {
  return (
    <>
      <div className="container mx-auto px-4 py-3 my-8">
        <div className="flex flex-col items-center justify-items-center">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-medium">Discover Leading Brands</h1>
            <p>
              Explore a curated selection of leading brands, where innovation
              meets quality, only at Air5Star.
            </p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-3 gap-4 mb-10 pt-5">
            <div className="bg-gray-100 rounded-full px-2 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
              <Image
                src={'/leadingBrands-imgs/vise.svg'}
                alt={'Vise'}
                width={80}
                height={80}
              />
            </div>
            <div className="bg-gray-100 rounded-full w-20 h-20 flex md:w-24 md:h-24 items-center justify-center">
              <Image
                src={'/leadingBrands-imgs/lg.svg'}
                alt={'LG'}
                width={80}
                height={80}
              />
            </div>
            <div className="bg-gray-100 rounded-full px-2 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
              <Image
                src={'/leadingBrands-imgs/whirpool.svg'}
                alt={'Whirpool'}
                width={80}
                height={80}
              />
            </div>
          </div>
          <div className="mb-4">
            <Button className="bg-black text-white rounded-full px-8 py-6 text-sm cursor-pointer font-medium hover:bg-gray-800">
              Shop Top Brands
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadingBrands;
