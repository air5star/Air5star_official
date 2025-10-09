'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  MapPin, 
  Package, 
  Heart, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Home,
  Building,
  MapPinIcon
} from 'lucide-react';

interface Address {
  id: string;
  fullName: string;
  mobile: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  addressType: 'HOME' | 'OFFICE' | 'OTHER';
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
}

const UserProfilePage = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [addressForm, setAddressForm] = useState({
    fullName: '',
    mobile: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    addressType: 'HOME' as 'HOME' | 'OFFICE' | 'OTHER',
    isDefault: false
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchUserProfile();
  }, [isAuthenticated, router]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setProfileForm({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || ''
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        updateUser(data.user);
        setIsEditing(false);
      } else {
        setError('Failed to update profile');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const url = editingAddress ? `/api/user/addresses/${editingAddress.id}` : '/api/user/addresses';
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        fetchUserProfile();
        setIsAddingAddress(false);
        setEditingAddress(null);
        resetAddressForm();
      } else {
        setError('Failed to save address');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchUserProfile();
      } else {
        setError('Failed to delete address');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      fullName: '',
      mobile: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      addressType: 'HOME',
      isDefault: false
    });
  };

  const startEditingAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      fullName: address.fullName,
      mobile: address.mobile,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      addressType: address.addressType,
      isDefault: address.isDefault
    });
    setIsAddingAddress(true);
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'HOME': return <Home className="h-4 w-4" />;
      case 'OFFICE': return <Building className="h-4 w-4" />;
      default: return <MapPinIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Failed to load profile'}</div>
          <Button onClick={fetchUserProfile}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Save Changes</Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{userProfile.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{userProfile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{userProfile.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Saved Addresses</h2>
                <Button
                  onClick={() => {
                    setIsAddingAddress(true);
                    setEditingAddress(null);
                    resetAddressForm();
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Address
                </Button>
              </div>

              {isAddingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="mobile">Mobile Number</Label>
                          <Input
                            id="mobile"
                            value={addressForm.mobile}
                            onChange={(e) => setAddressForm({...addressForm, mobile: e.target.value})}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="addressLine1">Address Line 1</Label>
                          <Input
                            id="addressLine1"
                            value={addressForm.addressLine1}
                            onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                          <Input
                            id="addressLine2"
                            value={addressForm.addressLine2}
                            onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="pincode">PIN Code</Label>
                          <Input
                            id="pincode"
                            value={addressForm.pincode}
                            onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="landmark">Landmark (Optional)</Label>
                          <Input
                            id="landmark"
                            value={addressForm.landmark}
                            onChange={(e) => setAddressForm({...addressForm, landmark: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="addressType">Address Type</Label>
                          <select
                            id="addressType"
                            value={addressForm.addressType}
                            onChange={(e) => setAddressForm({...addressForm, addressType: e.target.value as 'HOME' | 'OFFICE' | 'OTHER'})}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="HOME">Home</option>
                            <option value="OFFICE">Office</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="isDefault">Set as default address</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">{editingAddress ? 'Update' : 'Save'} Address</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingAddress(false);
                            setEditingAddress(null);
                            resetAddressForm();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile.addresses?.map((address) => (
                  <Card key={address.id} className={`relative ${address.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getAddressTypeIcon(address.addressType)}
                          <Badge variant={address.isDefault ? 'default' : 'secondary'}>
                            {address.addressType}
                          </Badge>
                          {address.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingAddress(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{address.fullName}</p>
                        <p>{address.addressLine1}</p>
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        <p>{address.city}, {address.state} {address.pincode}</p>
                        {address.landmark && <p className="text-gray-600">Landmark: {address.landmark}</p>}
                        <p className="text-gray-600">Phone: {address.mobile}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {(!userProfile.addresses || userProfile.addresses.length === 0) && !isAddingAddress && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
                    <p className="text-gray-600 mb-4">Add your first address to make checkout faster</p>
                    <Button
                      onClick={() => {
                        setIsAddingAddress(true);
                        resetAddressForm();
                      }}
                    >
                      Add Address
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Order History</h3>
                <p className="text-gray-600 mb-4">View and track all your orders</p>
                <Link href="/orders">
                  <Button>View Orders</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Your Wishlist</h3>
                <p className="text-gray-600 mb-4">Save items for later</p>
                <Link href="/wishlist">
                  <Button>View Wishlist</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfilePage;