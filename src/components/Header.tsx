'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search, User, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const navigationLinks = [
  {
    category: 'heating',
    label: 'HEATING',
  },
  {
    category: 'ventilation',
    label: 'VENTILATION',
  },
  {
    category: 'air-conditioning',
    label: 'AIR CONDITIONING',
  },
  {
    category: 'hvac-materials-spares',
    label: 'HVAC MATERIALS & SPARES',
  },
  {
    category: 'refrigeration',
    label: 'REFRIGERATION',
  },
];

const Header = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const pathName = usePathname();
  const moreRef = useRef<HTMLDivElement>(null);
  // const handleMouseEnter = () => setIsMoreOpen(true);
  // const handleMouseLeave = () => setIsMoreOpen(false);

  // 🧠 Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Header */}
      <header className="px-6 shadow-md bg-white sticky top-0 z-50">
        <div className="flex items-center border-b justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              {/* Logo Image */}
              <Image
                src="/logo-Air5Star.png"
                alt="Air5Star"
                width={250}
                height={35}
                className="h-[120px]"
                priority
              />
            </Link>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xl mx-8">
            <div className="relative group">
              {/* Search input  */}
              <Input
                type="text"
                placeholder="Search for Air conditioners, home appliances..."
                className="w-full rounded-full bg-gray-50 border-gray-200 pl-5 pr-12 py-2 h-11 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
              />
              {/* Search Icon */}
              <div className="absolute right-3 top-2.5 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-900 cursor-pointer hover:bg-blue-200 transition-colors duration-200 group-hover:bg-blue-200">
                <Search className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-8">
            {/* More Dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setIsMoreOpen((prev) => !prev)}
                className="py-2 font-semibold tracking-wide cursor-pointer text-gray-700 hover:text-blue-600 hover:border-blue-600 transition-colors"
              >
                More
              </button>

              {isMoreOpen && (
                <ul className="absolute left-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-md w-48 z-50">
                  {[
                    { href: '/about-us', label: 'About Us' },
                    { href: '/contact-us', label: 'Contact Us' },
                    { href: '/faqs', label: 'FAQs' },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)} // ✅ Close dropdown on click
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link
              href="/signup"
              className="flex flex-col items-center text-gray-700 hover:text-blue-900 transition-colors duration-200 hover:scale-105"
            >
              <div className="bg-blue-50 p-2 rounded-full">
                <User className="h-5 w-5 text-blue-900" />
              </div>
              <span className="text-xs mt-1 font-medium">Account</span>
            </Link>
            <Link
              href="/cart"
              className="flex flex-col items-center text-gray-700 hover:text-blue-900 transition-colors duration-200 hover:scale-105 relative"
            >
              <div className="bg-blue-50 p-2 rounded-full">
                <ShoppingCart className="h-5 w-5 text-blue-900" />
              </div>
              <span className="text-xs mt-1 font-medium">Cart</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="">
          <div className="max-w-7xl mx-auto">
            <ul className="flex items-center justify-center text-sm font-medium py-3 px-4 space-x-12">
              {navigationLinks.map((link) => {
                const isActive = pathName === `/products/${link.category}`;
                return (
                  <li key={link.category}>
                    <Link
                      href={`/products/${link.category}`}
                      className={`py-2 border-b-2 font-semibold tracking-wide transition-colors ${isActive ? 'text-blue-900 border-blue-900' : 'text-gray-700 border-transparent hover:text-blue-900 hover:border-blue-900'}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
