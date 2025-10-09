'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search, User, ShoppingCart, Menu, X, Heart, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useRouter } from 'next/navigation';
import { productsData } from '@/data';
import SmartSearch from '@/components/SmartSearch';

const navigationLinks = [
  {
    category: 'ventilation',
    label: 'VENTILATION',
  },
  {
    category: 'air-conditioning',
    label: 'AIR CONDITIONING',
  },
];

const Header = () => {

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState('relevance');
  const pathName = usePathname();

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const { getCartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close mobile menu and search when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsSortOpen(false);
  }, [pathName]);
  
  // Handle search submission
  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Navigate to products page with search query and sort option
      router.push(`/products?search=${encodeURIComponent(searchTerm)}&sort=${sortOption}`);
    }
  };
  
  // Handle sort option selection
  const handleSortChange = (option: string) => {
    setSortOption(option);
    setIsSortOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className="px-4 md:px-6 shadow-md bg-white sticky top-0 z-50">
        <div className="flex items-center border-b justify-between max-w-7xl mx-auto">
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              {/* Logo Image */}
              <Image
                src="/logo-Air5Star.png"
                alt="Air5Star"
                width={250}
                height={35}
                className="h-[70px] md:h-[100px] object-contain"
                priority
              />
            </Link>
          </div>

          {/* Smart Search - Hidden on mobile */}
          <div className="hidden md:block relative flex-1 max-w-xl mx-8">
            <SmartSearch 
              placeholder="Search for HVAC Materials..."
              onSearch={(query) => {
                setSearchTerm(query);
                handleSearch();
              }}
              className="w-full"
            />
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Desktop - All Icons */}
            <div className="hidden md:flex items-center gap-6">
              {/* Login/Signup Text Link */}
              {isAuthenticated ? (
                <div className="relative group">
                  <div className="text-gray-800 hover:text-gray-600 transition-colors duration-200 cursor-pointer text-sm font-medium">
                    {user?.fullName?.split(' ')[0] || 'Account'}
                  </div>
                  
                  {/* User Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <ul>
                      <li>
                        <Link href="/user-profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          My Orders
                        </Link>
                      </li>
                      <li>
                        <Link href="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Wishlist
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  prefetch={true}
                  className="text-gray-800 hover:text-gray-600 transition-colors duration-200 text-sm font-medium"
                >
                  Login / Signup
                </Link>
              )}
              
              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                className="relative text-gray-700 hover:text-gray-900 transition-all duration-200 hover:scale-105"
              >
                <Heart className="h-6 w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </div>
            
            {/* Cart Icon - Always Visible */}
            <Link
              href="/cart"
              className="relative text-gray-700 hover:text-gray-900 transition-all duration-200 hover:scale-105"
            >
              <ShoppingCart className="h-6 w-6" />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>
            
            {/* Order Tracking/Truck Icon - Always Visible */}
            <Link
              href={isAuthenticated ? "/orders" : "/login"}
              className="text-gray-700 hover:text-gray-900 transition-all duration-200 hover:scale-105"
              title={isAuthenticated ? "Track Orders" : "Login to track orders"}
            >
              <Truck className="h-6 w-6" />
            </Link>
          </div>
        </div>

        {/* Main Navigation - Desktop */}
        <nav className="hidden md:block">
          <div className="max-w-7xl mx-auto">
            <ul className="flex items-center justify-center text-sm font-medium py-3 px-4 space-x-12 lg:space-x-20 overflow-x-auto scrollbar-hidden">
              {navigationLinks.map((link) => {
                const isActive = pathName === `/products/${link.category}` || pathName.startsWith(`/products/${link.category}/`);
                return (
                  <li key={link.category}>
                    <Link
                      href={`/products/${link.category}`}
                      className={`py-2 border-b-2 font-semibold text-base tracking-wide transition-colors whitespace-nowrap ${isActive ? 'text-blue-900 border-blue-900' : 'text-gray-700 border-transparent hover:text-blue-900 hover:border-blue-900'}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden fixed inset-0 z-50 bg-white pt-16 overflow-y-auto"
          >
            {/* Close button at top-right corner */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
            
            <div className="container mx-auto px-4 py-4">
              {/* Mobile Search */}
              <div className="relative mb-6">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    className="w-full rounded-lg bg-gray-50 border-gray-200 pl-10 pr-4 py-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  />
                  <div 
                    className="absolute left-3 top-2.5 cursor-pointer"
                    onClick={() => {
                      handleSearch();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                {/* Mobile Menu Sort Options */}
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-700 mb-1">Sort By:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { value: 'relevance', label: 'Relevance' },
                      { value: 'price-low-high', label: 'Price: Low to High' },
                      { value: 'price-high-low', label: 'Price: High to Low' },
                      { value: 'latest', label: 'Latest Arrivals' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`text-xs px-2 py-1 rounded ${sortOption === option.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-700'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Mobile Wishlist */}
              <div className="mb-6">
                <Link 
                  href="/wishlist" 
                  className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Heart className="h-5 w-5 text-blue-900" />
                  <span className="text-base font-medium text-gray-700">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-auto">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>
              
              {/* Mobile Navigation Links */}
              <nav className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">CATEGORIES</h3>
                <ul className="space-y-3">
                  {navigationLinks.map((link) => {
                    const isActive = pathName === `/products/${link.category}` || pathName.startsWith(`/products/${link.category}/`);
                    return (
                      <li key={link.category}>
                        <Link
                          href={`/products/${link.category}`}
                          className={`block py-2 text-base font-medium ${isActive ? 'text-blue-900' : 'text-gray-700'}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              
              {/* Mobile Account Links */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">ACCOUNT</h3>
                <ul className="space-y-3">
                  {isAuthenticated ? (
                    <>
                      <li>
                        <div className="flex items-center gap-3 py-2">
                          <User className="h-5 w-5 text-blue-900" />
                          <div>
                            <p className="text-base font-medium text-gray-700">{user?.fullName}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </li>
                      <li>
                        <Link href="/user-profile" className="flex items-center gap-3 py-2 pl-8" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="text-base font-medium text-gray-700">My Profile</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/orders" className="flex items-center gap-3 py-2 pl-8" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="text-base font-medium text-gray-700">My Orders</span>
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 py-2 pl-8 text-red-600"
                        >
                          <span className="text-base font-medium">Logout</span>
                        </button>
                      </li>
                    </>
                    ) : (
                      <>
                        <li>
                          <Link href="/login" className="flex items-center gap-3 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <User className="h-5 w-5 text-blue-900" />
                            <span className="text-base font-medium text-gray-700">Login / Signup</span>
                          </Link>
                        </li>
                      </>
                    )}
                </ul>
              </div>
              

              
              {/* Close button at bottom */}
              <div className="mt-8 pb-8 flex justify-center">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-gray-100 text-gray-700 rounded-full px-6 py-2 flex items-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Close Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
