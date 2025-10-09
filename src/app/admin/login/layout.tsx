import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - HVAC E-commerce',
  description: 'Admin login page for HVAC E-commerce platform',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}