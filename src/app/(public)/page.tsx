'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { products } from '@/data';
import LeadingBrands from '@/components/LeadingBrands'; // LeadingBrands component in components/LeadingBrands.tsx
import CategoryCard from '@/components/CategoryCard';
import Shipping from '@/components/Shipping';
import { useState, useEffect } from 'react';
import ACCalculator from '@/components/ACCalculator';

// All the imports

// Banner Images
const bannerImages = [
  '/banner-images/heating.png',
  '/banner-images/ventilation.jpg',
  '/banner-images/air-conditioner.jpg',
  '/banner-images/hvac.jpg',
  '/banner-images/refrigerators.jpg',
];

export default function Home() {
  const [activeImage, setActiveImage] = useState<string | undefined>(
    bannerImages[0]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => {
        console.log('changed');
        const currentIndex = bannerImages.indexOf(prev ?? bannerImages[0]);
        const nextIndex = (currentIndex + 1) % bannerImages.length;
        return bannerImages[nextIndex];
      });
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="px-2 sm:px-4 md:px-6 mb-6 md:mb-10">
        <Carousel className="w-full">
          <CarouselContent>
            {bannerImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative mx-auto mt-3 md:mt-5 w-full max-w-[1400px] bg-[#0a2a56] overflow-hidden rounded-lg shadow-md">
                  {/* Responsive container with aspect ratio */}
                  <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a2a56]">
                      <Image
                        src={activeImage ?? bannerImages[0]}
                        alt="carousel banner"
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1400px"
                        priority
                      />
                    </div>

                    {/* Banner Content - Positioned to avoid text areas */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-20 md:pb-24 lg:pb-28 text-white p-2 sm:p-4 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6">
                        <Link href="/products">
                          <Button className="bg-blue-900 hover:bg-blue-800 text-white rounded-md px-4 py-2 sm:px-6 sm:py-2 md:px-8 md:py-3 text-xs sm:text-sm md:text-base font-medium transition-colors shadow-lg">
                            Shop Now
                          </Button>
                        </Link>
                        <ACCalculator className="text-xs sm:text-sm md:text-base" />
                      </div>
                    </div>

                    {/* Carousel Indicators */}
                    <div className="absolute bottom-2 sm:bottom-3 md:bottom-5 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2">
                      {bannerImages.map((image, i) => (
                        <button
                          key={i}
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full transition-all ${i === bannerImages.indexOf(activeImage ?? bannerImages[0]) ? 'bg-white scale-125 shadow-lg' : 'bg-white/60'}`}
                          onClick={() => setActiveImage(bannerImages[i])}
                          aria-label={`Go to slide ${i + 1}`}
                        ></button>
                      ))}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      {/* Product Categories */}
      <section className="container mx-auto py-6 md:py-10 px-4">
        <h2 className="text-xl md:text-3xl font-semibold mb-6 md:mb-8 text-center">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {products.map((eachProduct) => (
            <div key={eachProduct.category} className="w-full">
              <CategoryCard products={[eachProduct]} />
            </div>
          ))}
        </div>
      </section>
      {/* LeadingBrands */}
      <LeadingBrands />
      {/* Shipping Component */}
      <Shipping />
         
    </div>
  );
}
