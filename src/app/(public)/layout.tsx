import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import Script from 'next/script';
import DemoChatbot from '@/components/DemoChatbot';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Header />
          <main className="pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}