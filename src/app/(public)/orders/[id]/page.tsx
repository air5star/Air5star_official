'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  Calendar,
  CreditCard,
  ArrowLeft,
  Download,
  Phone,
  Mail,
  ShoppingBag
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  mrp: number;
  product: {
    id: string;
    name: string;
    imageUrl?: string;
    sku: string;
  };
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  type: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

interface OrderTracking {
  id: string;
  status: string;
  message: string;
  location?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
  estimatedDelivery?: string;
  orderItems: OrderItem[];
  shippingAddress: Address;
  payments?: Payment[];
  orderTracking: OrderTracking[];
}

const OrderDetailsPage = ({ params }: { params: { id: string } }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    let isMounted = true;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/orders/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          setError('Order not found');
        }
      } catch (error) {
        if (!isMounted) return;
        setError('Failed to load order details');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, params.id, router]);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  const getConfirmedAt = (o: Order) => {
    const confirmedTrack = o.orderTracking?.find(t => t.status === 'CONFIRMED');
    return confirmedTrack ? new Date(confirmedTrack.createdAt) : new Date(o.createdAt);
  };

  const hoursSinceConfirmation = order ? ((Date.now() - getConfirmedAt(order).getTime()) / (1000 * 60 * 60)) : 0;
  const canCancel = order ? (order.status === 'CONFIRMED' && hoursSinceConfirmation <= 12) : false;
  const cancelDisabledReason = !order ? '' : (
    order.status !== 'CONFIRMED'
      ? 'Cancellation is only available for confirmed orders.'
      : hoursSinceConfirmation > 12
        ? 'Cancellation window expired (12 hours after confirmation).'
        : ''
  );

  const handleCancelOrder = async () => {
    if (!order || !canCancel) return;
    try {
      setIsCancelling(true);
      setCancelError('');
      setCancelSuccess('');
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'User initiated cancellation from My Orders' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCancelSuccess(data?.message || 'Order cancelled successfully.');
        if (data?.order) {
          setOrder(data.order);
        } else {
          // Fallback: update local status
          setOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : prev);
        }
      } else {
        setCancelError(data?.error || 'Failed to cancel order');
      }
    } catch (e) {
      setCancelError('Network error while cancelling order');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The order you are looking for does not exist.'}</p>
          <Link href="/user-profile">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/user-profile">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
          </div>
        </div>

        {/* Success Message */}
        {isSuccess && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-green-800 mb-1">Order Placed Successfully!</h2>
                  <p className="text-green-700">Thank you for your order. We'll send you updates via email and SMS.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Placed on {formatDate(order.createdAt)}
                  </span>
                </div>
                {/* Cancellation helper */}
                <div className="mt-2">
                  {canCancel ? (
                    <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded border border-blue-100">
                      You can cancel this confirmed order within 12 hours of confirmation. A 5% fee will be deducted from your refund.
                    </p>
                  ) : (
                    cancelDisabledReason && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                        {cancelDisabledReason}
                      </p>
                    )
                  )}
                </div>
                
                {order.estimatedDelivery && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Estimated delivery: {formatDate(order.estimatedDelivery)}</span>
                  </div>
                )}

                {/* Order Tracking */}
                {order.orderTracking && order.orderTracking.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-3">Tracking History</h4>
                    <div className="space-y-3">
                      {order.orderTracking.map((track, index) => (
                        <div key={track.id} className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{track.message}</p>
                            {track.location && (
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {track.location}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">{formatDate(track.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      {item.product.imageUrl && (
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                        <p className="text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                        {item.mrp > item.price && (
                          <p className="text-sm text-gray-500 line-through">
                            ₹{(item.mrp * item.quantity).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p className="text-gray-600">{order.shippingAddress.addressLine}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  {order.shippingAddress.phone && (
                    <p className="text-gray-600 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST)</span>
                  <span>₹{order.tax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {order.payments && order.payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Method</span>
                    <span>{order.payments[0]?.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={getPaymentStatusColor(order.payments[0]?.status || 'PENDING')}>
                        {order.payments[0]?.status || 'PENDING'}
                    </Badge>
                  </div>
                  {order.payments[0]?.transactionId && (
                    <div className="flex justify-between">
                      <span>Transaction ID</span>
                      <span className="text-sm font-mono">{order.payments[0]?.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span>₹{order.payments[0]?.amount.toLocaleString() || '0'}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Cancel Order */}
                {cancelSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700">
                    {cancelSuccess}
                  </div>
                )}
                {cancelError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">
                    {cancelError}
                  </div>
                )}
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={!canCancel || isCancelling}
                  onClick={handleCancelOrder}
                  title={!canCancel ? cancelDisabledReason : 'Cancel order (5% fee deduction)'}
                >
                  {isCancelling ? 'Cancelling…' : 'Cancel Order'}
                </Button>

                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Link href="/products" className="block">
                  <Button className="w-full">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;