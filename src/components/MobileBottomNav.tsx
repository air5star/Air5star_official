'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, User } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      isActive: pathname === '/'
    },
    {
      href: '/products',
      icon: ShoppingBag,
      label: 'Shop',
      isActive: pathname === '/products'
    },
    {
      href: '/wishlist',
      icon: Heart,
      label: 'Wishlist',
      isActive: pathname === '/wishlist',
      badge: wishlistCount
    },
    {
      href: isAuthenticated ? '/user-profile' : '/login',
      icon: User,
      label: isAuthenticated ? 'Account' : 'Login',
      isActive: pathname === '/user-profile' || pathname === '/login' || pathname === '/signup'
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-between py-2 px-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center min-h-[52px] px-2 py-1 text-center transition-colors duration-200 ${
                item.isActive
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="relative leading-none">
                <IconComponent className={`h-6 w-6 ${item.isActive ? 'text-gray-900' : 'text-gray-600'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-semibold ring-2 ring-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium leading-tight ${
                item.isActive ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;