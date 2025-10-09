'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Search, ShoppingCart, Mail, TrendingUp, MessageCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'running';
  message?: string;
  data?: any;
}

export default function TestAIFeaturesPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const updateTestResult = (name: string, status: TestResult['status'], message?: string, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      }
      return [...prev, { name, status, message, data }];
    });
  };

  const testEndpoint = async (name: string, url: string, options?: RequestInit) => {
    updateTestResult(name, 'running');
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (response.ok) {
        updateTestResult(name, 'success', `Status: ${response.status}`, data);
      } else {
        updateTestResult(name, 'error', `Status: ${response.status} - ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      updateTestResult(name, 'error', `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Tidio Webhook Health',
        url: '/api/tidio-webhook'
      },
      {
        name: 'Smart Search Autocomplete',
        url: '/api/search?q=air&type=autocomplete&limit=5'
      },
      {
        name: 'Product Recommendations',
        url: '/api/recommendations?type=similar&productId=1&limit=4'
      },
      {
        name: 'Inventory Forecast',
        url: '/api/inventory-forecast?productId=1&days=30'
      },
      {
        name: 'Abandoned Cart Health',
        url: '/api/abandoned-cart'
      }
    ];

    for (const test of tests) {
      await testEndpoint(test.name, test.url);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const testSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=search&limit=10`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search test failed:', error);
      setSearchResults([]);
    }
  };

  const testAbandonedCart = async () => {
    const cartData = {
      user_id: 'test-user-123',
      email: 'test@example.com',
      cart_items: [
        {
          product_id: '1',
          name: 'Test Air Conditioner',
          price: 25000,
          quantity: 1,
          image: '/ac-1.webp'
        }
      ],
      cart_total: 25000,
      currency: 'INR'
    };

    await testEndpoint(
      'Abandoned Cart POST',
      '/api/abandoned-cart',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      }
    );
  };

  const testRecommendationTracking = async () => {
    const interactionData = {
      user_id: 'test-user-123',
      product_id: '1',
      action: 'view'
    };

    await testEndpoint(
      'Recommendation Tracking',
      '/api/recommendations',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData)
      }
    );
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Features Testing Dashboard</h1>
        <p className="text-muted-foreground">
          Test all implemented AI-powered features in your HVAC eCommerce website.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search Test</TabsTrigger>
          <TabsTrigger value="cart">Cart Test</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                API Endpoints Test Suite
              </CardTitle>
              <CardDescription>
                Run automated tests for all AI-powered API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>

              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Test Results:</h3>
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(result.status)}
                        {result.message && (
                          <span className="text-sm text-muted-foreground max-w-xs truncate">
                            {result.message}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4" />
                  Tidio Chatbot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Check bottom-right corner for chat widget
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Search className="h-4 w-4" />
                  Smart Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Try typing in the header search box
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Visit product pages to see suggestions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  Email Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Add items to cart and abandon
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Search Testing</CardTitle>
              <CardDescription>
                Test the search functionality and autocomplete features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && testSearch()}
                />
                <Button onClick={testSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Search Results:</h3>
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="font-medium">{result.name || result.title}</div>
                        <div className="text-muted-foreground">
                          {result.category} - ₹{result.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Abandoned Cart Testing</CardTitle>
              <CardDescription>
                Test the abandoned cart email automation system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testAbandonedCart} className="w-full">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Test Abandoned Cart API
              </Button>
              
              <Alert>
                <AlertDescription>
                  This will simulate an abandoned cart scenario with test data.
                  Check the test results above for API response.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations Testing</CardTitle>
              <CardDescription>
                Test the product recommendation system and user interaction tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testRecommendationTracking} className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                Test Recommendation Tracking
              </Button>
              
              <Alert>
                <AlertDescription>
                  This will simulate a user viewing a product to test the recommendation
                  tracking system. The system learns from user interactions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}