'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const verifyEmailSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser, refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
  });

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Redirect to signup if no email provided
      router.push('/signup');
    }
  }, [searchParams, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (data: VerifyEmailFormData) => {
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await authAPI.verifyEmail(email, data.otp);
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        const { token, user } = result.data as any;

        // Store auth data
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));

        // Immediately reflect logged-in state in UI
        updateUser(user);
        // Also refresh from API in background for consistency
        refreshUser().catch(() => {});

        setSuccess('Email verified successfully! Redirecting...');

        // Redirect to home page after successful verification
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    } catch (error: any) {
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email || countdown > 0) return;
    
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const result = await authAPI.resendVerificationOTP(email);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Verification code sent successfully!');
        setCountdown(60); // 60 second cooldown
        reset(); // Clear the OTP input
      }
    } catch (error: any) {
      setError(error.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-6 sm:py-8">
      <Card className="w-full max-w-sm p-4 sm:p-6 md:p-8 shadow-lg md:max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {email}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm sm:text-base font-medium">
              Verification Code
            </Label>
            <Input
              {...register('otp')}
              id="otp"
              name="otp"
              type="text"
              placeholder="Enter 6-digit code"
              className="h-12 text-center text-lg tracking-widest"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
            {errors.otp && (
              <p className="text-red-500 text-sm">
                {errors.otp.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-md"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          <Button
            type="button"
            variant="link"
            className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
            onClick={handleResendOTP}
            disabled={isResending || countdown > 0}
          >
            {isResending 
              ? 'Sending...' 
              : countdown > 0 
                ? `Resend in ${countdown}s`
                : 'Resend verification code'
            }
          </Button>
        </div>

        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="link"
            className="text-gray-600 hover:text-gray-800 p-0 h-auto"
            onClick={() => router.push('/signup')}
          >
            ← Back to Sign Up
          </Button>
        </div>
      </Card>
    </div>
  );
}