'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { products } from '../data';
import Header from '@/components/Header'; // Header component in components/Header.tsx
import AboutUs from '@/components/AboutUs'; // About component in components/aboutUs.tsx
import LeadingBrands from '@/components/LeadingBrands'; // LeadingBrands component in components/LeadingBrands.tsx
import Footer from '@/components/Footer'; // Footer component in components/Footer.tsx
import CategoryCard from '@/components/CategoryCard';
import Shipping from '@/components/Shipping';
import { useState, useEffect } from 'react';

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
    <div className="min-h-scree bg-white">
      {/* Hero Banner */}
      <section className="">
        <Carousel className="w-full">
          <CarouselContent>
            {bannerImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative mx-auto mt-5 h-[400px] w-[1400px] bg-[#0a2a56]">
                  <div className="container h-full w-full  px-4">
                    <Image
                      src={activeImage ?? bannerImages[0]}
                      alt="carousel banner"
                      fill
                      className="object-fill"
                      priority
                    />
                  </div>

                  {/* Shop Now Button */}
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 ">
                    <Link href="/products">
                      <Button className="bg-black text-white rounded-full px-8 py-6 text-lg cursor-pointer font-medium hover:bg-gray-800">
                        Shop Now
                      </Button>
                    </Link>
                  </div>

                  {/* Carousel Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {bannerImages.map((image, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${i === bannerImages.indexOf(activeImage ?? bannerImages[0]) ? 'bg-white' : 'bg-white/50'}`}
                        onClick={() => setActiveImage(bannerImages[i])}
                        style={{ cursor: 'pointer' }}
                      ></div>
                    ))}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>
      {/* Product Categories */}
      <section className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {products.map((eachProduct) => (
            <CategoryCard products={[eachProduct]} key={eachProduct.category} />
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
