'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const CallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const razorpay_order_id = searchParams.get('razorpay_order_id');
    const razorpay_payment_id = searchParams.get('razorpay_payment_id');
    const razorpay_signature = searchParams.get('razorpay_signature');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      setStatus('error');
      setMessage('Missing payment confirmation details.');
      return;
    }

    const verify = async () => {
      try {
        setStatus('verifying');
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const resp = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          setStatus('success');
          setMessage('Payment verified successfully. Redirecting...');
          // Redirect to order success using returned order id
          const orderId = data?.order?.id || searchParams.get('orderId');
          setTimeout(() => {
            if (orderId) {
              router.push(`/order-success?orderId=${orderId}&clearCart=true`);
            } else {
              router.push('/');
            }
          }, 1200);
        } else {
          const err = await resp.json().catch(() => ({}));
          setStatus('error');
          setMessage(err?.error || 'Payment verification failed.');
        }
      } catch (e) {
        setStatus('error');
        setMessage('Network error during verification.');
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verifying your payment…</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>{message}</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{message}</span>
            </div>
          )}
          <div className="pt-2">
            <Button variant="outline" onClick={() => router.push('/')}>Go Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PaymentCallbackPage = () => (
  <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading payment callback…</div>}>
    <CallbackContent />
  </Suspense>
);

export default PaymentCallbackPage;