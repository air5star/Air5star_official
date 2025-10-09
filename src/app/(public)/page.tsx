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
                <div className="relative mx-auto mt-3 md:mt-5 h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px] w-full max-w-[1400px] bg-[#0a2a56] overflow-hidden rounded-lg shadow-md">
                  <div className="h-full w-full">
                    <Image
                      src={activeImage ?? bannerImages[0]}
                      alt="carousel banner"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1400px"
                      priority
                    />
                  </div>

                  {/* Banner Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 bg-black/30">
                    <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-2 md:mb-4">
                      Premium HVAC Solutions
                    </h1>
                    <p className="text-sm md:text-lg text-center max-w-2xl mb-4 md:mb-6 hidden sm:block">
                      Quality products for all your heating, ventilation, and air conditioning needs
                    </p>
                    <div className="flex flex-col items-center space-y-3">
                      <Link href="/products">
                        <Button className="bg-blue-900 hover:bg-blue-800 text-white rounded-md px-6 py-2 md:px-8 md:py-3 text-sm md:text-base font-medium transition-colors">
                          Shop Now
                        </Button>
                      </Link>
                      <ACCalculator className="text-sm md:text-base" />
                    </div>
                  </div>

                  {/* Carousel Indicators */}
                  <div className="absolute bottom-3 md:bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {bannerImages.map((image, i) => (
                      <button
                        key={i}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${i === bannerImages.indexOf(activeImage ?? bannerImages[0]) ? 'bg-white scale-125' : 'bg-white/60'}`}
                        onClick={() => setActiveImage(bannerImages[i])}
                        aria-label={`Go to slide ${i + 1}`}
                      ></button>
                    ))}
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
