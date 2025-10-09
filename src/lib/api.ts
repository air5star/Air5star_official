// API utility functions for frontend-backend integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Generic API request function with error handling
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `HTTP error! status: ${response.status}`,
        status: response.status,
      };
    }

    return { data, status: response.status };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// Auth API functions
export const authAPI = {
  signup: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    return apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async () => {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  refreshToken: async () => {
    return apiRequest('/api/auth/refresh', {
      method: 'POST',
    });
  },

  verifyEmail: async (email: string, otp: string) => {
    return apiRequest('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resendVerificationOTP: async (email: string) => {
    return apiRequest('/api/auth/verify-email', {
      method: 'PUT',
      body: JSON.stringify({ email }),
    });
  },
};

// Products API functions
export const productsAPI = {
  getAll: async (params?: {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiRequest(`/api/products?${searchParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/api/products/${id}`);
  },

  search: async (query: string, filters?: any) => {
    const searchParams = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiRequest(`/api/products?${searchParams.toString()}`);
  },
};

// Categories API functions
export const categoriesAPI = {
  getAll: async (includeProducts = false) => {
    const params = includeProducts ? '?includeProducts=true' : '';
    return apiRequest(`/api/categories${params}`);
  },

  getById: async (id: string, includeProducts = false) => {
    const params = includeProducts ? '?includeProducts=true' : '';
    return apiRequest(`/api/categories/${id}${params}`);
  },
};

// Cart API functions
export const cartAPI = {
  get: async () => {
    return apiRequest('/api/cart');
  },

  add: async (productId: string, quantity: number = 1, category?: string | { name: string; slug: string }) => {
    const body: any = { productId, quantity };
    if (category) {
      body.category = category;
    }
    return apiRequest('/api/cart', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update: async (productId: string, quantity: number) => {
    return apiRequest('/api/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  remove: async (productId: string) => {
    return apiRequest('/api/cart/remove', {
      method: 'DELETE',
      body: JSON.stringify({ productId }),
    });
  },

  clear: async () => {
    return apiRequest('/api/cart', {
      method: 'DELETE',
    });
  },
};

// User API functions
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/api/user/profile');
  },

  updateProfile: async (userData: any) => {
    return apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  getAddresses: async () => {
    return apiRequest('/api/user/addresses');
  },

  addAddress: async (address: any) => {
    return apiRequest('/api/user/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  },

  updateAddress: async (id: string, address: any) => {
    return apiRequest(`/api/user/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    });
  },

  deleteAddress: async (id: string) => {
    return apiRequest(`/api/user/addresses/${id}`, {
      method: 'DELETE',
    });
  },
};

// Orders API functions
export const ordersAPI = {
  getAll: async (page = 1, limit = 10) => {
    return apiRequest(`/api/orders?page=${page}&limit=${limit}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/api/orders/${id}`);
  },

  create: async (orderData: any) => {
    return apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  cancel: async (id: string, reason?: string) => {
    return apiRequest(`/api/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  track: async (id: string) => {
    return apiRequest(`/api/orders/${id}/tracking`);
  },
};

// Wishlist API functions
export const wishlistAPI = {
  get: async () => {
    return apiRequest('/api/wishlist');
  },

  add: async (productId: string) => {
    return apiRequest('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  remove: async (id: string) => {
    return apiRequest(`/api/wishlist/${id}`, {
      method: 'DELETE',
    });
  },

  clear: async () => {
    return apiRequest('/api/wishlist', {
      method: 'DELETE',
    });
  },
};

// Reviews API functions
export const reviewsAPI = {
  getByProduct: async (productId: string, page = 1, limit = 10) => {
    return apiRequest(`/api/reviews?productId=${productId}&page=${page}&limit=${limit}`);
  },

  create: async (reviewData: {
    productId: string;
    rating: number;
    comment?: string;
  }) => {
    return apiRequest('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },
};

// Payment API functions
export const paymentAPI = {
  createOrder: async (orderData: any) => {
    return apiRequest('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  verifyPayment: async (paymentData: any) => {
    return apiRequest('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
};

// EMI API functions
export const emiAPI = {
  getPlans: async (amount?: number) => {
    const params = amount ? `?amount=${amount}` : '';
    return apiRequest(`/api/emi/plans${params}`);
  },

  calculate: async (amount: number, planId?: string, tenure?: number, interestRate?: number) => {
    return apiRequest('/api/emi/calculate', {
      method: 'POST',
      body: JSON.stringify({ amount, planId, tenure, interestRate }),
    });
  },
};

// Settings API functions
export const settingsAPI = {
  getPublic: async (category?: string, keys?: string[]) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (keys) keys.forEach(key => params.append('keys', key));
    
    return apiRequest(`/api/settings?${params.toString()}`);
  },
};

// Helper function to get auth token from session
export function getAuthHeaders() {
  // This will be implemented based on your auth setup
  // For now, returning empty object
  return {};
}

// Helper function to handle API errors
export function handleApiError(error: any, options?: { silent?: boolean }) {
  console.error('API Error:', error);
  
  // Check if we're on the order success page - avoid showing alerts there
  const isOrderSuccessPage = typeof window !== 'undefined' && 
    window.location.pathname.includes('/order-success');
  
  const shouldShowAlert = !options?.silent && !isOrderSuccessPage;
  
  if (error.status === 401) {
    // Handle unauthorized - redirect to login
    window.location.href = '/login';
    return;
  }
  
  if (error.status === 403) {
    // Handle forbidden
    if (shouldShowAlert) {
      alert('You do not have permission to perform this action.');
    }
    return;
  }
  
  if (error.status >= 500) {
    // Handle server errors
    if (shouldShowAlert) {
      alert('Server error. Please try again later.');
    }
    return;
  }
  
  // Handle other errors
  if (shouldShowAlert) {
    alert(error.error || 'An error occurred. Please try again.');
  }
}
