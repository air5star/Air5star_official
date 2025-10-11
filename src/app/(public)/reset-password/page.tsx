'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { CheckCircle, AlertCircle } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
      return;
    }
    verifyToken();
  }, [token, router]);

  const verifyToken = async () => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        const errorData = await response.json();
        setError(errorData.message || 'Invalid or expired reset token');
      }
    } catch (error) {
      setTokenValid(false);
      setError('Network error. Please try again.');
    }
  };

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4 py-6 sm:py-8">
        <Card className="w-full max-w-sm p-4 sm:p-6 md:p-8 shadow-lg md:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying reset token...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4 py-6 sm:py-8">
        <Card className="w-full max-w-sm p-4 sm:p-6 md:p-8 shadow-lg md:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link is invalid or has expired. Please request a new one.'}
            </p>
            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button className="w-full">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4 py-6 sm:py-8">
        <Card className="w-full max-w-sm p-4 sm:p-6 md:p-8 shadow-lg md:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Password Reset Successful
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Link href="/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-6 sm:py-8">
      <Card className="w-full max-w-sm p-4 sm:p-6 md:p-8 shadow-lg md:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Reset Your Password
            </h1>
            <p className="text-gray-600 text-sm">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm sm:text-base font-medium">
              New Password
            </Label>
            <Input
              {...register('password')}
              id="password"
              name="password"
              type="password"
              placeholder="Enter your new password"
              className="h-12"
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm sm:text-base font-medium">
              Confirm New Password
            </Label>
            <Input
              {...register('confirmPassword')}
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              className="h-12"
              required
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen px-4 py-6 sm:py-8">
        <Card className="w-full max-w-sm p-4 sm:p-6 md:p-8 shadow-lg md:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reset page...</p>
          </div>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}