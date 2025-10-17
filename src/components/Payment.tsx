'use client';

import { useState } from 'react';
import Script from 'next/script';

interface PaymentProps {
  orderId: string;
  amount: number;
  currency: string;
}

const Payment: React.FC<PaymentProps> = ({ orderId, amount, currency }) => {
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!isRazorpayLoaded) {
      alert('Razorpay SDK is not loaded yet. Please wait.');
      return;
    }

    setIsLoading(true);

    try {
      // Create payment/order via unified endpoint
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId, amount, currency, paymentMethod: 'RAZORPAY' }),
      });

      const paymentData = await response.json();
      if (!response.ok) {
        throw new Error(paymentData.error || 'Payment initialization failed');
      }

      // Razorpay options
      const options = {
        key: paymentData?.razorpay?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: paymentData?.razorpay?.amount,
        currency: paymentData?.razorpay?.currency || currency,
        name: 'Air5Star',
        description: 'Purchase Payment',
        order_id: paymentData?.razorpay?.orderId,
        handler: async (response: any) => {
          // Verify payment via unified endpoint
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            }),
          });

          const verifyData = await verifyResponse.json();
          if (verifyData.success) {
            alert('Payment successful!');
            // Optionally redirect or update UI
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#F37254',
        },
        modal: {
          ondismiss: () => {
            alert('Payment modal closed.');
          },
        },
      };

      // Assert script and key are present
      if (!(window as any).Razorpay) {
        alert('Payment script not loaded. Please retry.');
        return;
      }
      if (!options.key) {
        console.error('[Payment Component] Missing Razorpay key. Ensure NEXT_PUBLIC_RAZORPAY_KEY_ID is set.');
        alert('Payment gateway not configured. Please contact support.');
        return;
      }

      // Open Razorpay checkout with hardened failure handler
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (event: any) => {
        const desc = event?.error?.description || 'Unknown error';
        console.error('[Payment Component] payment.failed:', event);
        alert(`Payment failed: ${desc}`);
      });
      rzp.open();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsRazorpayLoaded(true)}
      />
      <button
        onClick={handlePayment}
        disabled={isLoading || !isRazorpayLoaded}
        className="bg-black text-white rounded-full px-6 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </>
  );
};

export default Payment;
