'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Tag, 
  Package, 
  Eye, 
  Save, 
  X,
  ChevronRight,
  Folder,
  FolderOpen,
  AlertCircle
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  isActive: boolean;
  parentId?: string;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  isActive: boolean;
}

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    isActive: true
  });

  // Mock data - In real app, this would come from API
  useEffect(() => {
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Ventilation',
        slug: 'ventilation',
        description: 'All ventilation products and systems',
        productCount: 45,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        children: [
          {
            id: '3',
            name: 'Exhaust Fans',
            slug: 'exhaust-fans',
            description: 'Industrial and residential exhaust fans',
            productCount: 25,
            isActive: true,
            parentId: '1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '4',
            name: 'Ventilation Ducts',
            slug: 'ventilation-ducts',
            description: 'Ductwork and ventilation accessories',
            productCount: 20,
            isActive: true,
            parentId: '1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      },
      {
        id: '2',
        name: 'Air Conditioning',
        slug: 'air-conditioning',
        description: 'Air conditioning units and accessories',
        productCount: 38,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        children: [
          {
            id: '5',
            name: 'Split AC Units',
            slug: 'split-ac-units',
            description: 'Split air conditioning systems',
            productCount: 20,
            isActive: true,
            parentId: '2',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '6',
            name: 'Central AC Systems',
            slug: 'central-ac-systems',
            description: 'Central air conditioning systems',
            productCount: 18,
            isActive: true,
            parentId: '2',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      }
    ];

    setCategories(mockCategories);
    setFilteredCategories(mockCategories);
    setLoading(false);
  }, []);

  // Filter categories based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCategories(categories);
      return;
    }

    const filterCategories = (cats: Category[]): Category[] => {
      return cats.filter(category => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            category.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (matchesSearch) return true;
        
        // Check if any children match
        if (category.children) {
          const filteredChildren = filterCategories(category.children);
          return filteredChildren.length > 0;
        }
        
        return false;
      }).map(category => ({
        ...category,
        children: category.children ? filterCategories(category.children) : undefined
      }));
    };

    setFilteredCategories(filterCategories(categories));
  }, [searchTerm, categories]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleFormChange = (field: keyof CategoryFormData, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug when name changes
      if (field === 'name' && typeof value === 'string') {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parentId: '',
      isActive: true
    });
  };

  const handleAddCategory = () => {
    if (!formData.name.trim()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      productCount: 0,
      isActive: formData.isActive,
      parentId: formData.parentId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (formData.parentId) {
      // Add as child category
      setCategories(prev => prev.map(cat => {
        if (cat.id === formData.parentId) {
          return {
            ...cat,
            children: [...(cat.children || []), newCategory]
          };
        }
        return cat;
      }));
    } else {
      // Add as root category
      setCategories(prev => [...prev, newCategory]);
    }

    resetForm();
    setIsAddingCategory(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId || '',
      isActive: category.isActive
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !formData.name.trim()) return;

    const updateCategoryInTree = (cats: Category[]): Category[] => {
      return cats.map(cat => {
        if (cat.id === editingCategory.id) {
          return {
            ...cat,
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            isActive: formData.isActive,
            updatedAt: new Date().toISOString()
          };
        }
        if (cat.children) {
          return {
            ...cat,
            children: updateCategoryInTree(cat.children)
          };
        }
        return cat;
      });
    };

    setCategories(prev => updateCategoryInTree(prev));
    setEditingCategory(null);
    resetForm();
  };

  const handleDeleteCategory = (categoryId: string) => {
    const deleteCategoryFromTree = (cats: Category[]): Category[] => {
      return cats.filter(cat => cat.id !== categoryId).map(cat => ({
        ...cat,
        children: cat.children ? deleteCategoryFromTree(cat.children) : undefined
      }));
    };

    setCategories(prev => deleteCategoryFromTree(prev));
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <Card className="mb-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategoryExpansion(category.id)}
                    className="p-1 h-6 w-6"
                  >
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4" />
                    ) : (
                      <Folder className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {!hasChildren && <div className="w-6" />}
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{category.name}</h3>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {category.productCount} products
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  <p className="text-xs text-gray-500">Slug: /{category.slug}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditCategory(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getAllCategories = (cats: Category[]): Category[] => {
    let allCats: Category[] = [];
    cats.forEach(cat => {
      allCats.push(cat);
      if (cat.children) {
        allCats = allCats.concat(getAllCategories(cat.children));
      }
    });
    return allCats;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600 mt-1">Organize and manage product categories</p>
        </div>
        <Button onClick={() => setIsAddingCategory(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAllCategories(categories).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Root Categories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getAllCategories(categories).reduce((sum, cat) => sum + cat.productCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Category Form */}
      {(isAddingCategory || editingCategory) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </CardTitle>
            <CardDescription>
              {editingCategory ? 'Update category information' : 'Create a new product category'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleFormChange('slug', e.target.value)}
                  placeholder="category-url-slug"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Category description"
                />
              </div>
              
              <div>
                <Label htmlFor="parent">Parent Category (Optional)</Label>
                <select
                  id="parent"
                  value={formData.parentId}
                  onChange={(e) => handleFormChange('parentId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Parent (Root Category)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active Category</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingCategory(false);
                  setEditingCategory(null);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Manage your product categories hierarchy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => renderCategory(category))
            ) : (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Start by creating your first category.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;