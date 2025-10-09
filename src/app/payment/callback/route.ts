import { NextRequest, NextResponse } from 'next/server';

// Handle Razorpay's POST redirect by converting form data into query params
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const razorpay_order_id = (form.get('razorpay_order_id') || '').toString();
    const razorpay_payment_id = (form.get('razorpay_payment_id') || '').toString();
    const razorpay_signature = (form.get('razorpay_signature') || '').toString();

    // If any required field is missing, send user to orders with an error
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const fallback = new URL('/orders', request.url);
      fallback.searchParams.set('error', 'missing_payment_confirmation');
      return NextResponse.redirect(fallback, 303);
    }

    // Redirect to the GET page with the required params for client-side verification
    const redirectUrl = new URL('/payment/callback', request.url);
    redirectUrl.searchParams.set('razorpay_order_id', razorpay_order_id);
    redirectUrl.searchParams.set('razorpay_payment_id', razorpay_payment_id);
    redirectUrl.searchParams.set('razorpay_signature', razorpay_signature);

    return NextResponse.redirect(redirectUrl, 303);
  } catch (err) {
    // On unexpected errors, route to orders with a generic error
    const fallback = new URL('/orders', request.url);
    fallback.searchParams.set('error', 'payment_callback_error');
    return NextResponse.redirect(fallback, 303);
  }
}