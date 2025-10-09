'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApiDocsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the static Swagger UI HTML file
    window.location.href = '/swagger-ui.html';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading API Documentation...</h2>
        <p className="text-gray-500">Redirecting to Swagger UI interface</p>
        <div className="mt-4">
          <a 
            href="/swagger-ui.html" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Click here if not redirected automatically
          </a>
        </div>
      </div>
    </div>
  );
}