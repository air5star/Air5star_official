'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  MapPin, 
  Plus, 
  Edit, 
  CreditCard,
  Truck,
  ShoppingBag,
  CheckCircle,
  Home,
  Building,
  MapPinIcon,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Wallet,
  Building2,
  Percent,
  Tag,
  Gift,
  Shield,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  AlertCircle,
  Loader2,
  QrCode,
  Camera
} from 'lucide-react';

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  type: 'HOME' | 'OFFICE' | 'OTHER';
  isDefault: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    brand?: string;
  };
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
}

interface PaymentMethod {
  id: string;
  type: 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET' | 'EMI';
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { cartItems, clearCart } = useCart();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 0
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<Coupon[]>([]);
  const [showOffers, setShowOffers] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('RAZORPAY');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [saveCard, setSaveCard] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  
  // Ensure Razorpay Checkout script is loaded before initializing
  const ensureRazorpayLoaded = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if ((window as any).Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      try {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => {
          setError('Failed to load Razorpay script. Please retry.');
          resolve(false);
        };
        document.body.appendChild(script);
      } catch (_) {
        setError('Unable to initialize payment script.');
        resolve(false);
      }
    });
  };

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

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi',
      type: 'UPI',
      name: 'UPI',
      description: 'Pay using UPI ID or QR code',
      icon: <Smartphone className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'cards',
      type: 'CREDIT_CARD',
      name: 'Credit/Debit Cards',
      description: 'Visa, Mastercard, RuPay, AMEX',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'netbanking',
      type: 'NET_BANKING',
      name: 'Net Banking',
      description: 'All major banks supported',
      icon: <Building2 className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'wallets',
      type: 'WALLET',
      name: 'Wallets',
      description: 'PhonePe, Google Pay, Paytm',
      icon: <Wallet className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'emi',
      type: 'EMI',
      name: 'EMI',
      description: 'Easy monthly installments',
      icon: <Clock className="h-5 w-5" />,
      enabled: orderSummary.total >= 5000
    }
  ];

  const popularBanks = [
    { code: 'SBI', name: 'State Bank of India' },
    { code: 'HDFC', name: 'HDFC Bank' },
    { code: 'ICICI', name: 'ICICI Bank' },
    { code: 'AXIS', name: 'Axis Bank' },
    { code: 'KOTAK', name: 'Kotak Mahindra Bank' },
    { code: 'PNB', name: 'Punjab National Bank' }
  ];

  const walletProviders = [
    { id: 'PHONEPE', name: 'PhonePe', icon: '📱' },
    { id: 'GOOGLEPAY', name: 'Google Pay', icon: '🔵' },
    { id: 'PAYTM', name: 'Paytm', icon: '💙' },
    { id: 'AMAZONPAY', name: 'Amazon Pay', icon: '🟠' }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      router.push('/cart');
      return;
    }
    fetchAddresses();
    fetchAvailableOffers();
    calculateOrderSummary();
    calculateEstimatedDelivery();
  }, [isAuthenticated, cartItems, router]);

  useEffect(() => {
    calculateOrderSummary();
  }, [appliedCoupon, cartItems]);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
        const defaultAddress = data.addresses?.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchAvailableOffers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/coupons/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableOffers(data.coupons || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const calculateOrderSummary = () => {
    if (!cartItems) return;
    
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const tax = subtotal * 0.18;
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'PERCENTAGE') {
        discount = (subtotal * appliedCoupon.value) / 100;
        if (appliedCoupon.maxDiscountAmount) {
          discount = Math.min(discount, appliedCoupon.maxDiscountAmount);
        }
      } else if (appliedCoupon.type === 'FIXED_AMOUNT') {
        discount = appliedCoupon.value;
      } else if (appliedCoupon.type === 'FREE_SHIPPING') {
        discount = shipping;
      }
    }
    
    const total = subtotal + shipping + tax - discount;
    setOrderSummary({ subtotal, shipping, tax, discount, total });
  };

  const calculateEstimatedDelivery = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponCode,
          orderAmount: orderSummary.subtotal
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setAppliedCoupon(data.coupon);
        setSuccess(`Coupon applied! You saved ₹${data.discount}`);
        setCouponCode('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Invalid coupon code');
      }
    } catch (error) {
      setError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setSuccess('Coupon removed');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchAddresses();
        setSelectedAddress(data.address);
        setIsAddingAddress(false);
        resetAddressForm();
        setSuccess('Address added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save address');
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

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }
    
    // Payment method selection UI is bypassed; Razorpay handles methods in popup.

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddressId: selectedAddress.id,
          paymentMethod: 'RAZORPAY',
          couponCode: appliedCoupon?.code,
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await initiatePayment(data.order);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to place order');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (order: any) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: orderSummary.total,
          paymentMethod: 'RAZORPAY'
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err?.error || 'Failed to initialize payment');
        return;
      }

      const paymentData = await response.json();
      const scriptReady = await ensureRazorpayLoaded();
      if (!scriptReady) return;
      // No custom payment inputs; all validation occurs inside Razorpay.
      const options = {
        key: paymentData?.razorpay?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: paymentData?.razorpay?.amount,
        currency: paymentData?.razorpay?.currency || 'INR',
        name: 'Air5Star',
        description: `Order #${order.orderNumber}`,
        order_id: paymentData?.razorpay?.orderId,
        // Do not use Razorpay-managed redirect; rely solely on handler
        handler: async (response: any) => {
          try {
            console.log('[Checkout] Razorpay handler response:', response);
            await verifyPayment(response, order.id);
          } catch (err) {
            console.error('[Checkout] Error in handler verification call:', err);
            setError('Payment verification failed. Please contact support if amount was deducted.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: selectedAddress?.phone
        },
        upi: selectedPaymentMethod === 'UPI' && upiId ? { vpa: upiId } : undefined,
        theme: {
          color: '#3B82F6'
        },
        method: {
          card: true,
          netbanking: true,
          upi: true,
          wallet: true,
          emi: true,
          paylater: true,
          international: true,
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled or closed. No charge applied.');
          },
        },
      } as any;

      if (!(window as any).Razorpay) {
        setError('Payment script not loaded. Please retry.');
        return;
      }
      if (!options.key) {
        console.error('[Checkout] Missing Razorpay key. Set NEXT_PUBLIC_RAZORPAY_KEY_ID.');
        setError('Payment gateway not configured. Please contact support.');
        return;
      }

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', (event: any) => {
        const desc = event?.error?.description || 'Unknown error';
        console.error('[Checkout] payment.failed:', event);
        setError(`Payment failed: ${desc}`);
      });
      razorpay.open();
    } catch (error) {
      setError('Payment initialization failed');
    }
  };

  const verifyPayment = async (paymentResponse: any, orderId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...paymentResponse,
          orderId
        }),
      });

      const verifyData = await response.json().catch(() => ({}));
      console.log('[Checkout] Verification response:', verifyData);
      if (response.ok) {
        // Clear cart locally then redirect to confirmation
        try {
          clearCart();
          localStorage.removeItem('cart');
        } catch (e) {
          console.warn('[Checkout] Cart clear encountered an issue but continuing:', e);
        }
        router.push(`/order-success?orderId=${orderId}`);
      } else {
        const errMsg = verifyData?.error || 'Payment verification failed';
        console.error('[Checkout] Verification failed:', errMsg);
        setError(errMsg);
      }
    } catch (error) {
      console.error('[Checkout] Network/unknown error verifying payment:', error);
      setError('Payment verification error');
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'HOME': return <Home className="h-4 w-4" />;
      case 'OFFICE': return <Building className="h-4 w-4" />;
      default: return <MapPinIcon className="h-4 w-4" />;
    }
  };

  const steps = [
    { id: 1, title: 'Delivery', icon: MapPin },
    { id: 2, title: 'Payment', icon: CreditCard },
    { id: 3, title: 'Review', icon: CheckCircle }
  ];

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to proceed with checkout</p>
          <Link href="/products">
            <Button className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/cart">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold">Checkout</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="md:hidden"
              onClick={() => setShowOrderSummary(!showOrderSummary)}
            >
              ₹{orderSummary.total.toLocaleString()}
              {showOrderSummary ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    isActive ? 'bg-blue-100 text-blue-600' : 
                    isCompleted ? 'bg-green-100 text-green-600' : 
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="font-medium hidden sm:inline">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Order Summary */}
      {showOrderSummary && (
        <div className="md:hidden bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <OrderSummaryContent />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-700">{success}</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700">{error}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setError('')}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 1: Delivery Address */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Address Button */}
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingAddress(true)}
                    className="w-full flex items-center gap-2 h-12"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Address
                  </Button>

                  {/* Add Address Form */}
                  {isAddingAddress && (
                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fullName">Full Name *</Label>
                              <Input
                                id="fullName"
                                value={addressForm.fullName}
                                onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})}
                                className="h-12"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="mobile">Mobile Number *</Label>
                              <Input
                                id="mobile"
                                value={addressForm.mobile}
                                onChange={(e) => setAddressForm({...addressForm, mobile: e.target.value})}
                                className="h-12"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <Label htmlFor="addressLine1">Address Line 1 *</Label>
                              <Input
                                id="addressLine1"
                                value={addressForm.addressLine1}
                                onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                                className="h-12"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="city">City *</Label>
                              <Input
                                id="city"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                                className="h-12"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State *</Label>
                              <Input
                                id="state"
                                value={addressForm.state}
                                onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                                className="h-12"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="pincode">PIN Code *</Label>
                              <Input
                                id="pincode"
                                value={addressForm.pincode}
                                onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})}
                                className="h-12"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" className="h-12">Save Address</Button>
                            <Button type="button" variant="outline" onClick={() => setIsAddingAddress(false)} className="h-12">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Existing Addresses */}
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <Card 
                        key={address.id} 
                        className={`cursor-pointer transition-all ${
                          selectedAddress?.id === address.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              checked={selectedAddress?.id === address.id}
                              onChange={() => setSelectedAddress(address)}
                              className="mt-1 h-4 w-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getAddressTypeIcon(address.type)}
                                <Badge variant="secondary">{address.type}</Badge>
                                {address.isDefault && <Badge variant="outline">Default</Badge>}
                              </div>
                              <p className="font-medium">{address.firstName} {address.lastName}</p>
                              <p className="text-sm text-gray-600">{address.addressLine}</p>
                              <p className="text-sm text-gray-600">{address.city}, {address.state} {address.postalCode}</p>
                              {address.phone && <p className="text-sm text-gray-600">Phone: {address.phone}</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {addresses.length === 0 && !isAddingAddress && (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">No addresses found. Please add a delivery address.</p>
                    </div>
                  )}

                  {selectedAddress && (
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      className="w-full h-12"
                    >
                      Continue to Payment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Simplified message — methods chosen in Razorpay */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-700">
                      Payment options (UPI, Cards, Netbanking, Wallets, EMI) are selected within the secure Razorpay popup. No selection is required here.
                    </p>
                  </div>
                  {/* Security Badge */}
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Secure Payment</p>
                      <p className="text-xs text-green-600">Your payment information is encrypted and secure</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="h-12">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(3)} 
                      className="flex-1 h-12"
                    >
                      Continue to Review
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Review Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Address */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Delivery Address</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentStep(1)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedAddress?.firstName} {selectedAddress?.lastName}</p>
                      <p className="text-sm text-gray-600">{selectedAddress?.addressLine}</p>
                      <p className="text-sm text-gray-600">{selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.postalCode}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Estimated delivery: {estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Payment</h3>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">Razorpay Secure Checkout</p>
                      <p className="text-sm text-gray-600">Choose UPI, Card, Netbanking, Wallets, or EMI inside the Razorpay popup.</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium mb-3">Order Items ({cartItems.length})</h3>
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          {item.product.imageUrl && (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            {item.product.brand && (
                              <p className="text-sm text-gray-600">{item.product.brand}</p>
                            )}
                            <p className="text-sm">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      I agree to the <Link href="/terms-of-use" className="text-blue-600 hover:underline">Terms & Conditions</Link> and <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} className="h-12">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-1 h-12"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay Now - ₹${orderSummary.total.toLocaleString()}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24">
              <OrderSummaryContent />
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );

  function OrderSummaryContent() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coupon Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Apply Coupon</span>
            </div>
            
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-10"
                />
                <Button 
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  size="sm"
                  className="h-10"
                >
                  {couponLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{appliedCoupon.code}</p>
                    <p className="text-xs text-green-600">-₹{orderSummary.discount.toLocaleString()} saved</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={removeCoupon}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Available Offers */}
            {availableOffers.length > 0 && !appliedCoupon && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOffers(!showOffers)}
                  className="w-full justify-between h-8 text-blue-600"
                >
                  <span className="text-sm">View available offers ({availableOffers.length})</span>
                  {showOffers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {showOffers && (
                  <div className="space-y-2 mt-2">
                    {availableOffers.slice(0, 3).map((offer) => (
                      <div 
                        key={offer.id} 
                        className="p-2 border border-dashed border-blue-200 rounded cursor-pointer hover:bg-blue-50"
                        onClick={() => {
                          setCouponCode(offer.code);
                          setShowOffers(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Percent className="h-3 w-3 text-blue-600" />
                          <div>
                            <p className="text-xs font-medium">{offer.code}</p>
                            <p className="text-xs text-gray-600">{offer.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{orderSummary.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span className={orderSummary.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                {orderSummary.shipping === 0 ? 'FREE' : `₹${orderSummary.shipping}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (GST 18%)</span>
              <span>₹{orderSummary.tax.toLocaleString()}</span>
            </div>
            {orderSummary.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-₹{orderSummary.discount.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{orderSummary.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Savings Indicator */}
          {orderSummary.discount > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  You're saving ₹{orderSummary.discount.toLocaleString()}!
                </span>
              </div>
            </div>
          )}

          {/* Free Shipping Badge */}
          {orderSummary.shipping === 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">FREE Shipping!</span>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Estimated delivery: 3-5 business days</p>
            <p>• Easy returns within 7 days</p>
            <p>• 24/7 customer support</p>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default CheckoutPage;