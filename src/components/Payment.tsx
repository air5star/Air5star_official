'use client';

import { useState } from 'react';
import Script from 'next/script';

interface PaymentProps {
  amount: number;
  currency: string;
}

const Payment: React.FC<PaymentProps> = ({ amount, currency }) => {
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!isRazorpayLoaded) {
      alert('Razorpay SDK is not loaded yet. Please wait.');
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency }),
      });

      const orderData = await response.json();
      if (!response.ok)
        throw new Error(orderData.error || 'Order creation failed');

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Air5Star',
        description: 'Purchase Payment',
        order_id: orderData.order_id,
        handler: async (response: any) => {
          // Verify payment
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
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

      // Open Razorpay checkout
      const rzp = new (window as any).Razorpay(options);
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
