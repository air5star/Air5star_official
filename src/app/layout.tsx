import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Air5Star',
  description: 'Your one-stop destination for premium quality Products',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: '128x128' },
      { url: '/A5S-logo.jpg' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/A5S-logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
