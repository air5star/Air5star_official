'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Image,
  Star,
  ShoppingCart,
  MoreHorizontal,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: {
    id: string;
    name: string;
  };
  price: number;
  originalPrice?: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image: string;
  rating: number;
  reviews: number;
  sales: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  description: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter })
      });

      const response = await fetch(`/api/admin/products?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || mockProducts);
      setTotalPages(Math.ceil((data.total || mockProducts.length) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      // Fallback to mock data
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.categories || mockCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(mockCategories);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update product status');
    }
  };

  const mockCategories = [
    { id: '1', name: 'Air Conditioners' },
    { id: '2', name: 'Air Purifiers' },
    { id: '3', name: 'Fans' },
    { id: '4', name: 'Refrigeration' },
    { id: '5', name: 'Heating' },
    { id: '6', name: 'Ventilation' }
  ];

  const mockProducts = [
    {
      id: '1',
      name: 'Carrier 1.5 Ton 3 Star Split AC',
      sku: 'CAR-AC-001',
      category: { id: '1', name: 'Air Conditioners' },
      price: 32999,
      originalPrice: 39999,
      stock: 25,
      status: 'active',
      image: '/api/placeholder/300/200',
      rating: 4.3,
      reviews: 128,
      sales: 45,
      featured: true,
      createdAt: '2023-06-15',
      updatedAt: '2024-01-10',
      description: 'High-efficiency split AC unit for residential use',
      isActive: true
    },
    {
      id: '2',
      name: 'Daikin 2 Ton Inverter Split AC',
      sku: 'DAI-AC-002',
      category: { id: '1', name: 'Air Conditioners' },
      price: 45999,
      originalPrice: 52999,
      stock: 18,
      status: 'active',
      image: '/api/placeholder/300/200',
      rating: 4.6,
      reviews: 89,
      sales: 32,
      featured: true,
      createdAt: '2023-07-20',
      updatedAt: '2024-01-08',
      description: 'Energy-efficient inverter AC with advanced cooling',
      isActive: true
    },
    {
      id: '3',
      name: 'Blue Star Window AC 1 Ton',
      sku: 'BLS-AC-003',
      category: { id: '1', name: 'Air Conditioners' },
      price: 24999,
      stock: 12,
      status: 'active',
      image: '/api/placeholder/300/200',
      rating: 4.1,
      reviews: 67,
      sales: 28,
      featured: false,
      createdAt: '2023-08-10',
      updatedAt: '2024-01-05',
      description: 'Compact window AC perfect for small rooms',
      isActive: true
    },
    {
      id: '4',
      name: 'Honeywell Air Purifier HEPA',
      sku: 'HON-AP-004',
      category: { id: '2', name: 'Air Purifiers' },
      price: 15999,
      originalPrice: 18999,
      stock: 0,
      status: 'out_of_stock',
      image: '/api/placeholder/300/200',
      rating: 4.4,
      reviews: 156,
      sales: 67,
      featured: false,
      createdAt: '2023-09-05',
      updatedAt: '2024-01-12',
      description: 'HEPA filter air purifier for clean indoor air',
      isActive: false
    },
    {
      id: '5',
      name: 'Crompton Ceiling Fan 48 inch',
      sku: 'CRM-FAN-005',
      category: { id: '3', name: 'Fans' },
      price: 3499,
      stock: 45,
      status: 'active',
      image: '/api/placeholder/300/200',
      rating: 4.2,
      reviews: 234,
      sales: 89,
      featured: false,
      createdAt: '2023-10-12',
      updatedAt: '2024-01-14',
      description: 'Energy-efficient ceiling fan with remote control',
      isActive: true
    },
    {
      id: '6',
      name: 'Voltas Deep Freezer 300L',
      sku: 'VOL-FRZ-006',
      category: { id: '4', name: 'Refrigeration' },
      price: 18999,
      stock: 8,
      status: 'inactive',
      image: '/api/placeholder/300/200',
      rating: 4.0,
      reviews: 45,
      sales: 12,
      featured: false,
      createdAt: '2023-11-18',
      updatedAt: '2024-01-06',
      description: 'Large capacity deep freezer for commercial use',
      isActive: false
    }
  ];



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category.id === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    let matchesTab = true;
    if (activeTab === 'featured') matchesTab = product.featured;
    else if (activeTab === 'low_stock') matchesTab = product.stock <= 10;
    else if (activeTab === 'out_of_stock') matchesTab = product.status === 'out_of_stock';
    
    return matchesSearch && matchesCategory && matchesStatus && matchesTab;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return b.price - a.price;
      case 'stock':
        return b.stock - a.stock;
      case 'sales':
        return b.sales - a.sales;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock <= 10 && p.stock > 0).length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  };

  if (loading && products.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error && products.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={fetchProducts} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your HVAC product catalog</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Import Products
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="low_stock">Low Stock</TabsTrigger>
          <TabsTrigger value="out_of_stock">Out of Stock</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="stock">Sort by Stock</option>
                  <option value="sales">Sort by Sales</option>
                  <option value="rating">Sort by Rating</option>
                </select>
              </div>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                    <Image className="h-48 w-full object-cover text-gray-400" />
                  </div>
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                      Featured
                    </Badge>
                  )}
                  <Badge className={`absolute top-2 right-2 ${getStatusColor(product.status)} border-0`}>
                    {product.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {product.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                  <p className="text-xs text-gray-600 mb-3">{product.category.name}</p>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm">
                      <span className="text-gray-600">Stock: </span>
                      <span className={`font-medium ${product.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Sales: </span>
                      <span className="font-medium text-blue-600">{product.sales}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {sortedProducts.length === 0 && (
            <Card className="p-8">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No products found matching your criteria.</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}