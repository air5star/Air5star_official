interface ShiprocketConfig {
  email: string;
  password: string;
  baseUrl: string;
}

interface ShiprocketOrderData {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: number;
  }>;
  payment_method: 'COD' | 'Prepaid';
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

interface ShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
}

interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_status: number;
      status: string;
      remarks: string;
      misc: string;
      shipment_track_activities: Array<{
        date: string;
        status: string;
        activity: string;
        location: string;
      }>;
    }>;
  };
}

interface ShiprocketAuthResponse {
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  company_id: number;
}

class ShiprocketService {
  private config: ShiprocketConfig;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      email: process.env.SHIPROCKET_EMAIL || '',
      password: process.env.SHIPROCKET_PASSWORD || '',
      baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
    };
  }

  private async authenticate(): Promise<string> {
    // Check if token is still valid (tokens typically last 10 days)
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.config.email,
          password: this.config.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data: ShiprocketAuthResponse = await response.json();
      this.token = data.token;
      // Set token expiry to 9 days from now (tokens last 10 days)
      this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      
      return this.token;
    } catch (error) {
      console.error('Shiprocket authentication error:', error);
      throw new Error('Failed to authenticate with Shiprocket');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shiprocket API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Shiprocket API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createOrder(orderData: ShiprocketOrderData): Promise<ShiprocketOrderResponse> {
    try {
      console.log('Creating Shiprocket order:', orderData.order_id);
      
      const response = await this.makeRequest<ShiprocketOrderResponse>('/orders/create/adhoc', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      console.log('Shiprocket order created successfully:', response);
      return response;
    } catch (error) {
      console.error('Error creating Shiprocket order:', error);
      throw error;
    }
  }

  async trackShipment(awbCode: string): Promise<ShiprocketTrackingResponse> {
    try {
      const response = await this.makeRequest<ShiprocketTrackingResponse>(
        `/courier/track/awb/${awbCode}`
      );
      return response;
    } catch (error) {
      console.error('Error tracking shipment:', error);
      throw error;
    }
  }

  async cancelShipment(awbCode: string): Promise<any> {
    try {
      const response = await this.makeRequest('/orders/cancel/shipment/awbs', {
        method: 'POST',
        body: JSON.stringify({
          awbs: [awbCode],
        }),
      });
      return response;
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      throw error;
    }
  }

  async getServiceability(pickupPincode: string, deliveryPincode: string, weight: number): Promise<any> {
    try {
      const response = await this.makeRequest(
        `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=1`
      );
      return response;
    } catch (error) {
      console.error('Error checking serviceability:', error);
      throw error;
    }
  }

  // Helper method to format order data from your database structure
  formatOrderForShiprocket(order: any, user: any, shippingAddress: any): ShiprocketOrderData {
    const orderItems = order.orderItems.map((item: any) => ({
      name: item.product.name,
      sku: item.product.sku || `SKU-${item.product.id}`,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: 0,
    }));

    return {
      order_id: order.orderNumber,
      order_date: order.createdAt.toISOString().split('T')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
      billing_customer_name: user.name || 'Customer',
      billing_address: shippingAddress.addressLine1,
      billing_address_2: shippingAddress.addressLine2 || '',
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.pincode,
      billing_state: shippingAddress.state,
      billing_country: shippingAddress.country || 'India',
      billing_email: user.email,
      billing_phone: user.phone || shippingAddress.mobile || '9999999999',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.paymentStatus === 'COMPLETED' ? 'Prepaid' : 'COD',
      sub_total: order.subtotal,
      length: order.packageLength || 10,
      breadth: order.packageBreadth || 10,
      height: order.packageHeight || 10,
      weight: order.packageWeight || 1,
    };
  }
}

// Export singleton instance
export const shiprocketService = new ShiprocketService();
export default shiprocketService;