'use client';

import type React from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import loginSchema from '../schemas/loginSchema/page';
import { useState } from 'react';

type TLoginSchema = z.infer<typeof loginSchema>;

export default function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit = async (data: TLoginSchema) => {
    const res = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });
    if (res?.error) {
      setLoginError('Invalid email or password');
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-sm p-8 shadow-lg md:max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {loginError && (
              <p className="text-red-600 text-center">{loginError}</p>
            )}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input
                {...register('email')}
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="h-12"
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{`${errors.email.message}`}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <Input
                {...register('password')}
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="h-12"
                required
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{`${errors.password.message}`}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-md"
            >
              Login
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <div className="flex flex-row justify-between gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => signIn('google', { callbackUrl: '/' })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => signIn('facebook', { callbackUrl: '/' })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
                Facebook
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => signIn('apple', { callbackUrl: '/' })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
                  <path d="M10 2c1 .5 2 2 2 5"/>
                </svg>
                Apple
              </Button>
            </div>
            
            <div className="text-center">
              <p>
                Don&apos;t have an Account?
                <Link href="/signup" className="text-blue-900 underline px-1">
                  Register
                </Link>
                here
              </p>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
