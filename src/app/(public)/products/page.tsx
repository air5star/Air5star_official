'use client';
import React from 'react';
import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { productsData } from '@/data';
import { Search, ArrowUpDown, Filter, X } from 'lucide-react';
import { TProduct } from '@/types/product';
import { useSearchParams } from 'next/navigation';
import { productsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Lazy load ProductItem component for better performance
const ProductItem = lazy(() => import('@/components/ProductItem'));

// Simple loading fallback for lazy-loaded components
const ProductItemFallback = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
    <div className="bg-gray-200 h-4 rounded mb-1"></div>
    <div className="bg-gray-200 h-3 rounded w-3/4 mb-1"></div>
    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
  </div>
);

type ProductType = {
  id: number;
  category: string;
  subCategory?: string;
  brand: string;
  productTitle: string;
  description: string;
  mrp: number;
  price: number;
  imageUrl: string;
  rating?: number;
  reviews?: number;
  bestSeller?: boolean;
  featured?: boolean;
  capacity?: string;
  deals?: boolean;
  [key: string]: any; // For other properties
};

// Convert ProductType to TProduct for our ProductItem component
const convertToTProduct = (product: ProductType): TProduct => {
  return {
    id: product.id,
    name: product.productTitle,
    category: product.category,
    price: product.price,
    mrp: product.mrp, // Include original price for discount calculation
    imageUrl: product.imageUrl,
    description: product.description || '',
    brand: product.brand || '',
    // Add any other required fields
  };
};

const ProductsPage = () => {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState('default');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if the device is mobile - prevent hydration mismatch
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check after component mounts
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Prevent hydration mismatch by not rendering mobile-specific content on first render
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Toggle filter menu for mobile
  const toggleFilterMenu = useCallback(() => {
    setIsFilterMenuOpen(prev => !prev);
  }, []);

  // Load products from API or fallback to static data
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Try to fetch from API if authenticated, otherwise use static data
      if (isAuthenticated) {
        try {
          const response = await productsAPI.getAll();
          if (response.success && response.data) {
            // Convert API response to our ProductType format
            const apiProducts = response.data.map((product: any) => ({
              id: product.id,
              category: product.category,
              subCategory: product.subCategory,
              brand: product.brand,
              productTitle: product.name,
              description: product.description,
              mrp: product.originalPrice || product.price,
              price: product.price,
              imageUrl: product.imageUrl,
              rating: product.rating,
              reviews: product.reviewCount,
              bestSeller: product.isBestSeller,
              featured: product.isFeatured,
              capacity: product.specifications?.capacity,
              deals: product.isOnSale,
            }));
            setAllProducts(apiProducts);
            setFilteredProducts(apiProducts);
            return;
          }
        } catch (apiError) {
          console.warn('API fetch failed, falling back to static data:', apiError);
        }
      }
      
      // Fallback to static data
      const products: ProductType[] = [];
      productsData.forEach(category => {
        if (category.products && Array.isArray(category.products)) {
          // Add some sample values for sorting features if they don't exist
          const enhancedProducts = category.products.map((product, index) => ({
            ...product,
            rating: product.rating || Math.floor(Math.random() * 5) + 1,
            reviews: product.reviews || Math.floor(Math.random() * 100),
            bestSeller: product.bestSeller || index % 5 === 0,
            featured: product.featured || index % 7 === 0,
            deals: product.deals || index % 4 === 0,
          }));
          products.push(...enhancedProducts);
        }
      });
      setAllProducts(products);
      setFilteredProducts(products);
      
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);
  
  // Get all products from API or static data
  useEffect(() => {
    loadProducts();
    
    // Get search and sort parameters from URL
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    
    if (search) {
      setSearchTerm(search);
    }
    
    if (sort) {
      // Map the sort options from header to the ones used in the products page
      const sortMap: Record<string, string> = {
        'relevance': 'default',
        'price-low-high': 'low-price',
        'price-high-low': 'high-price',
        'latest': 'featured'
      };
      setSortOption(sortMap[sort] || 'default');
    }
  }, [searchParams, loadProducts]);

  // Filter and sort products based on search term, category, and sort option
  useEffect(() => {
    let result = [...allProducts];
    
    // Filter by category if not 'all'
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(product => {
        return (
          product.productTitle.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          (product.subCategory && product.subCategory.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Sort products based on selected sort option
    switch (sortOption) {
      case 'featured':
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'best-seller':
        result.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
        break;
      case 'best-review':
        result.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      case 'best-rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'low-price':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'high-price':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'capacity':
        // Sort by capacity if available (assuming capacity is stored as string like "1.5 Ton")
        result.sort((a, b) => {
          const capA = parseFloat(a.capacity?.split(' ')[0] || '0');
          const capB = parseFloat(b.capacity?.split(' ')[0] || '0');
          return capB - capA;
        });
        break;
      case 'brand':
        result.sort((a, b) => a.brand.localeCompare(b.brand));
        break;
      case 'deals':
        result.sort((a, b) => (b.deals ? 1 : 0) - (a.deals ? 1 : 0));
        break;
      default:
        // Default sorting (no specific sort)
        break;
    }
    
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, sortOption, allProducts]);

  // Get unique categories for the filter dropdown
  const categories = ['all', ...new Set(allProducts.map(product => product.category))];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6 lg:py-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
          All Products
        </h1>
        <p className="text-center text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg">
          Welcome to Air5Star Where Product Meets Quality
        </p>
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
            {error}
            <button 
              onClick={loadProducts}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Mobile Search and Filter Toggle */}
      {isClient && (
        <div className="md:hidden mb-4">
          <div className="relative w-full mb-3">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={toggleFilterMenu}
            className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter & Sort
          </button>
        </div>
      )}

      {/* Mobile Filter Menu Overlay */}
      {isClient && isMobile && isFilterMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-[280px] h-full overflow-y-auto p-4 animate-slide-in-right shadow-lg">
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pt-1 pb-2 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Filters & Sorting</h3>
              <button 
                onClick={toggleFilterMenu}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close filter menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Mobile Category Filter */}
            <div className="mb-5">
              <label htmlFor="mobile-category-filter" className="block mb-2 text-sm font-medium text-gray-700">Category</label>
              <select
                id="mobile-category-filter"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Mobile Sort Options */}
            <div className="mb-5">
              <label htmlFor="mobile-sort-options" className="block mb-2 text-sm font-medium text-gray-700">Sort By</label>
              <select
                id="mobile-sort-options"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="featured">Featured</option>
                <option value="best-seller">Best Seller</option>
                <option value="best-review">Best Review</option>
                <option value="best-rating">Best Rating</option>
                <option value="low-price">Price: Low to High</option>
                <option value="high-price">Price: High to Low</option>
                <option value="capacity">Capacity</option>
                <option value="brand">Brand</option>
                <option value="deals">Deals</option>
              </select>
            </div>
            
            <div className="sticky bottom-0 pt-3 pb-2 bg-white border-t border-gray-100">
              <button 
                onClick={toggleFilterMenu}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-4 py-3 transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Search, Filter, and Sort Section */}
      <div className="hidden md:block mb-6 md:mb-8">
        {/* Search Bar */}
        <div className="relative w-full mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3 shadow-sm"
            placeholder="Search products by name, brand, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          {/* Category Filter */}
          <div className="w-full sm:w-1/2 md:w-1/3">
            <label htmlFor="category-filter" className="block mb-2 text-sm font-medium text-gray-700">Category</label>
            <select
              id="category-filter"
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 shadow-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort Options */}
          <div className="w-full sm:w-1/2 md:w-1/3">
            <label htmlFor="sort-options" className="block mb-2 text-sm font-medium text-gray-700">Sort By</label>
            <div className="relative">
              <select
                id="sort-options"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 pr-10 shadow-sm"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="featured">Featured</option>
                <option value="best-seller">Best Seller</option>
                <option value="best-review">Best Review</option>
                <option value="best-rating">Best Rating</option>
                <option value="low-price">Price: Low to High</option>
                <option value="high-price">Price: High to Low</option>
                <option value="capacity">Capacity</option>
                <option value="brand">Brand</option>
                <option value="deals">Deals</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid - Consistent with category pages */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full overflow-x-visible">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 rounded mb-1"></div>
              <div className="bg-gray-200 h-3 rounded w-3/4 mb-1"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={`${product.category}-${product.id}`}>
              <div className="relative">
                {/* Discount badge - positioned like category pages */}
                {product.mrp && product.price && product.mrp > product.price && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1.5 py-0.5 z-10 rounded-br-md">
                    {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
                  </div>
                )}
                
                {/* Other badges - positioned at top-right */}
                <div className="absolute top-0 right-0 z-10 flex flex-wrap gap-1 p-1">
                  {product.featured && (
                    <span className="bg-purple-100 text-purple-800 text-[8px] sm:text-[10px] md:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded">Featured</span>
                  )}
                  {product.bestSeller && (
                    <span className="bg-yellow-100 text-yellow-800 text-[8px] sm:text-[10px] md:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded">Best Seller</span>
                  )}
                  {product.deals && (
                    <span className="bg-red-100 text-red-800 text-[8px] sm:text-[10px] md:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded">Deal</span>
                  )}
                </div>
                
                {/* Rating badge - positioned at bottom-right of image */}
                {product.rating && (
                  <div className="absolute bottom-[130px] sm:bottom-[160px] right-0 z-10 p-1">
                    <span className="bg-blue-100 text-blue-800 text-[8px] sm:text-[10px] md:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded">
                      ★ {product.rating.toFixed(1)}{product.reviews ? ` (${product.reviews})` : ''}
                    </span>
                  </div>
                )}
                
                <Suspense fallback={<ProductItemFallback />}>
                  <ProductItem product={convertToTProduct(product)} />
                </Suspense>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 sm:py-10">
            <p className="text-lg sm:text-xl text-gray-600">No products found matching your criteria.</p>
            <p className="text-sm sm:text-base text-gray-500 mt-2">Try adjusting your search or filter options.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
