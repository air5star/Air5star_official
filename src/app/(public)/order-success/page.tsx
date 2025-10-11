'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Calendar, ArrowRight, Heart, Star, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';

interface OrderDetails {
  id: string;
  orderNumber: string;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  discount?: number;
  status?: string;
  updatedAt?: string;
  orderTracking?: Array<{ status: string; createdAt: string }>;
  estimatedDelivery: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
      imageUrl: string;
    };
  }>;
}

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get('orderId');
  const shouldClearCart = searchParams.get('clearCart') === 'true';
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const cartClearedRef = useRef(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const orderData = await response.json();
          setOrder(orderData);
        } else {
          setError('Order not found');
        }
      } catch (error) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
    
    // Clear cart after successful order placement if requested (only once)
    if (shouldClearCart && !cartClearedRef.current) {
      clearCart();
      cartClearedRef.current = true;
    }
  }, [orderId, router, shouldClearCart]); // Removed clearCart from dependencies

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canCancel = (() => {
    if (!order) return false;
    if (order.status !== 'CONFIRMED') return false;
    const confirmedTrack = order.orderTracking?.find(t => t.status === 'CONFIRMED');
    const confirmedAt = confirmedTrack ? new Date(confirmedTrack.createdAt) : (order.updatedAt ? new Date(order.updatedAt) : null);
    if (!confirmedAt) return false;
    const hoursSince = (Date.now() - confirmedAt.getTime()) / (1000 * 60 * 60);
    return hoursSince <= 12;
  })();

  const cancelDisabledReason = (() => {
    if (!order) return undefined;
    if (order.status === 'CANCELLED') return 'Order already cancelled';
    const confirmedTrack = order.orderTracking?.find(t => t.status === 'CONFIRMED');
    const confirmedAt = confirmedTrack ? new Date(confirmedTrack.createdAt) : (order.updatedAt ? new Date(order.updatedAt) : null);
    if (order.status !== 'CONFIRMED') return 'Cancellation only available after confirmation';
    if (!confirmedAt) return 'Confirmation time not available';
    const hoursSince = (Date.now() - confirmedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 12) return 'Cancellation unavailable after 12 hours';
    return undefined;
  })();

  const statusBadgeClass = (() => {
    const s = order?.status || 'PENDING';
    switch (s) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'DELIVERED':
        return 'bg-teal-100 text-teal-800 border border-teal-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  })();

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      setIsCancelling(true);
      setCancelMessage('');
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Customer requested cancellation' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelMessage(data.error || 'Failed to cancel order');
      } else {
        setCancelMessage(`Order cancelled. Refund (after 5% deduction): ₹${Number(data.refundAmount).toLocaleString()}`);
        setOrder({ ...order, status: 'CANCELLED' });
      }
    } catch (e) {
      setCancelMessage('Unexpected error while cancelling');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="text-center py-8">
            <div className="text-red-500 mb-4">
              <Package className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Order not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the order you're looking for.
            </p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-green-400 to-green-600 mb-6 shadow-lg animate-bounce">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
              🎉 Order Placed Successfully! 🎉
            </h1>
            <p className="text-xl text-gray-700 font-medium">
              Thank you for choosing Air5Star! 
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your order has been confirmed and is being processed with care. We're excited to deliver your HVAC solutions to you!
            </p>
          </div>
        </div>

        {/* Celebration Banner */}
        <Card className="mb-8 bg-gradient-to-r from-green-100 to-blue-100 border-green-200 shadow-lg">
          <CardContent className="py-6">
            <div className="flex items-center justify-center space-x-4 text-center">
              <Gift className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  🌟 Congratulations on Your Purchase! 🌟
                </h3>
                <p className="text-green-700">
                  You've made an excellent choice for your comfort and energy efficiency!
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary Card */}
        <Card className="mb-6 shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-xl">
              <span className="flex items-center space-x-2 flex-wrap">
                <Package className="h-6 w-6" />
                <span>Order #{order.orderNumber}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass}`}>
                  {order.status || 'PENDING'}
                </span>
              </span>
              <span className="text-2xl font-bold bg-white text-green-600 px-4 py-2 rounded-full">
                {formatPrice(order.totalAmount)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Estimated Delivery */}
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Estimated Delivery</p>
                  <p className="text-lg font-bold text-blue-600">
                    {order.estimatedDelivery ? formatDate(order.estimatedDelivery) : 'Within 5-7 business days'}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Shipping To</p>
                  <p className="text-sm font-bold text-green-600">
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="text-sm text-green-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                </div>
              </div>

              {/* Items Count */}
              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-800">Items Ordered</p>
                  <p className="text-lg font-bold text-purple-600">
                    {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Price Breakdown</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{Number(order.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className={Number(order.shippingCost || 0) === 0 ? 'text-green-600 font-medium' : ''}>
                    {Number(order.shippingCost || 0) === 0 ? 'FREE' : `₹${Number(order.shippingCost || 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (GST)</span>
                  <span>₹{Number(order.tax || 0).toLocaleString()}</span>
                </div>
                {Number(order.discount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{Number(order.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>₹{Number(order.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-6 w-6 text-yellow-500" />
              <span>Your Amazing Products</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <img
                      src={item.product.imageUrl || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      className="h-16 w-16 object-cover rounded-lg border-2 border-white shadow-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-green-600 font-semibold">
                    ✓ Confirmed
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Policy and Action */}
        <Card className="mb-8 shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-800">Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              You can cancel your order within <span className="font-semibold">12 hours</span> of confirmation.
              A <span className="font-semibold">5% cancellation charge</span> applies. After 12 hours, cancellation is not available.
            </p>
            {cancelMessage && (
              <div className="text-sm p-3 rounded-md border 
                ${order?.status === 'CANCELLED' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">
                {cancelMessage}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleCancelOrder}
                disabled={!canCancel || isCancelling || order.status === 'CANCELLED'}
                title={cancelDisabledReason || 'Cancel within 12 hours (5% fee applies)'}
                aria-disabled={!canCancel || order.status === 'CANCELLED'}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </Button>
              {(!canCancel || order.status === 'CANCELLED') && (
                <p className="text-xs text-gray-600 sm:self-center">
                  {cancelDisabledReason || 'Cancellation unavailable at this time.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-orange-800">What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h4 className="font-semibold text-orange-800">Order Processing</h4>
                  <p className="text-orange-700">We're preparing your items for shipment</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h4 className="font-semibold text-orange-800">Shipping Notification</h4>
                  <p className="text-orange-700">You'll receive tracking details via email</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h4 className="font-semibold text-orange-800">Delivery & Installation</h4>
                  <p className="text-orange-700">Professional installation available for HVAC products</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/orders">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg shadow-lg">
              <Package className="h-5 w-5 mr-2" />
              Track Your Orders
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg shadow-lg">
              Continue Shopping
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Thank You for Trusting Air5Star! 💙
          </h3>
          <p className="text-gray-600">
            We appreciate your business and look forward to serving you again. 
            For any questions, contact our support team at support@air5star.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order confirmation…</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}