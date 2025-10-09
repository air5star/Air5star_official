'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  FileText,
  Image,
  Video,
  Mail,
  Megaphone,
  Calendar,
  TrendingUp,
  Users,
  Globe,
  Star,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'page' | 'banner' | 'email' | 'social';
  status: 'published' | 'draft' | 'scheduled';
  author: string;
  createdAt: string;
  updatedAt: string;
  views?: number;
  engagement?: number;
  publishDate?: string;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'banner' | 'promotion';
  status: 'active' | 'paused' | 'completed' | 'draft';
  startDate: string;
  endDate: string;
  reach: number;
  clicks: number;
  conversions: number;
  budget: number;
  spent: number;
}

export default function ContentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('content');

  const [content] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Best HVAC Systems for Indian Homes 2024',
      type: 'blog',
      status: 'published',
      author: 'Admin',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      views: 1250,
      engagement: 85
    },
    {
      id: '2',
      title: 'Summer Sale - Up to 40% Off',
      type: 'banner',
      status: 'published',
      author: 'Marketing Team',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-12',
      views: 5600,
      engagement: 320
    },
    {
      id: '3',
      title: 'About Us - Company Story',
      type: 'page',
      status: 'published',
      author: 'Admin',
      createdAt: '2023-12-20',
      updatedAt: '2024-01-08',
      views: 890,
      engagement: 45
    },
    {
      id: '4',
      title: 'Weekly Newsletter - HVAC Tips',
      type: 'email',
      status: 'scheduled',
      author: 'Content Team',
      createdAt: '2024-01-14',
      updatedAt: '2024-01-14',
      publishDate: '2024-01-20'
    },
    {
      id: '5',
      title: 'New Product Launch Announcement',
      type: 'social',
      status: 'draft',
      author: 'Social Media Manager',
      createdAt: '2024-01-12',
      updatedAt: '2024-01-14'
    }
  ]);

  const [campaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Summer AC Sale 2024',
      type: 'email',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      reach: 15000,
      clicks: 1200,
      conversions: 180,
      budget: 50000,
      spent: 32000
    },
    {
      id: '2',
      name: 'Social Media Brand Awareness',
      type: 'social',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      reach: 25000,
      clicks: 2100,
      conversions: 95,
      budget: 30000,
      spent: 18000
    },
    {
      id: '3',
      name: 'Website Banner Promotion',
      type: 'banner',
      status: 'completed',
      startDate: '2023-12-01',
      endDate: '2023-12-31',
      reach: 45000,
      clicks: 3200,
      conversions: 420,
      budget: 25000,
      spent: 25000
    },
    {
      id: '4',
      name: 'Winter Heating Solutions',
      type: 'promotion',
      status: 'paused',
      startDate: '2023-11-01',
      endDate: '2024-02-28',
      reach: 12000,
      clicks: 890,
      conversions: 67,
      budget: 40000,
      spent: 15000
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'page':
        return <Globe className="h-4 w-4" />;
      case 'banner':
        return <Image className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'social':
        return <Megaphone className="h-4 w-4" />;
      case 'promotion':
        return <Star className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content & Marketing</h1>
          <p className="text-gray-600 mt-1">Manage content and marketing campaigns</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">{content.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-green-600">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
            <Megaphone className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-purple-600">
                {content.reduce((sum, item) => sum + (item.views || 0), 0).toLocaleString()}
              </p>
            </div>
            <Eye className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Campaign Budget</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(campaigns.reduce((sum, c) => sum + c.budget, 0))}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content Management</TabsTrigger>
          <TabsTrigger value="campaigns">Marketing Campaigns</TabsTrigger>
        </TabsList>

        {/* Content Management Tab */}
        <TabsContent value="content" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="blog">Blog Posts</option>
                  <option value="page">Pages</option>
                  <option value="banner">Banners</option>
                  <option value="email">Email</option>
                  <option value="social">Social Media</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  New Post
                </Button>
                <Button variant="outline" size="sm">
                  <Image className="h-4 w-4 mr-2" />
                  New Banner
                </Button>
              </div>
            </div>
          </Card>

          {/* Content List */}
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Content</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Author</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Performance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Updated</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">
                            Created {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          {getTypeIcon(item.type)}
                          <span className="ml-2 text-sm text-gray-600 capitalize">
                            {item.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${getStatusColor(item.status)} border-0`}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">{item.author}</p>
                      </td>
                      <td className="py-4 px-4">
                        {item.views !== undefined && (
                          <div className="text-sm">
                            <p className="text-gray-900">{item.views.toLocaleString()} views</p>
                            {item.engagement && (
                              <p className="text-gray-500">{item.engagement} engagements</p>
                            )}
                          </div>
                        )}
                        {item.publishDate && (
                          <p className="text-sm text-blue-600">
                            Scheduled: {formatDate(item.publishDate)}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">
                          {formatDate(item.updatedAt)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Marketing Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Campaign Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="email">Email</option>
                  <option value="social">Social Media</option>
                  <option value="banner">Banner</option>
                  <option value="promotion">Promotion</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </Card>

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getTypeIcon(campaign.type)}
                    <h3 className="font-semibold text-gray-900 ml-2">{campaign.name}</h3>
                  </div>
                  <Badge className={`${getStatusColor(campaign.status)} border-0`}>
                    {campaign.status}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="text-gray-900">
                      {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reach:</span>
                    <span className="text-gray-900">{campaign.reach.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Clicks:</span>
                    <span className="text-gray-900">{campaign.clicks.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conversions:</span>
                    <span className="text-gray-900">{campaign.conversions}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="text-gray-900">{formatCurrency(campaign.budget)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent:</span>
                    <span className="text-gray-900">{formatCurrency(campaign.spent)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}