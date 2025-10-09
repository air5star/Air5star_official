# HVAC E-Commerce API Documentation

This document provides comprehensive documentation for all API endpoints in the HVAC E-Commerce application.

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Admin-only endpoints require the user to have `ADMIN` role.

## Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "data": {},
  "message": "Success message",
  "pagination": {} // For paginated responses
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": {} // Optional additional error details
}
```

## API Endpoints

### Authentication

#### Register User
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "phone": "string" // optional
  }
  ```
- **Response:** User object with JWT token

#### Login User
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User object with JWT token

### User Management

#### Get User Profile
- **GET** `/user/profile`
- **Auth:** Required
- **Response:** User profile data

#### Update User Profile
- **PUT** `/user/profile`
- **Auth:** Required
- **Body:**
  ```json
  {
    "name": "string",
    "phone": "string",
    "image": "string" // optional
  }
  ```

#### Get User Addresses
- **GET** `/user/addresses`
- **Auth:** Required
- **Response:** Array of user addresses

#### Create Address
- **POST** `/user/addresses`
- **Auth:** Required
- **Body:**
  ```json
  {
    "name": "string",
    "phone": "string",
    "addressLine1": "string",
    "addressLine2": "string", // optional
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string",
    "isDefault": "boolean" // optional
  }
  ```

#### Update Address
- **PUT** `/user/addresses/[id]`
- **Auth:** Required
- **Body:** Same as create address

#### Delete Address
- **DELETE** `/user/addresses/[id]`
- **Auth:** Required

### Products

#### Get All Products
- **GET** `/products`
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `search`: Search term
  - `categoryId`: Filter by category
  - `minPrice`: Minimum price filter
  - `maxPrice`: Maximum price filter
  - `sortBy`: Sort field (price, name, createdAt)
  - `sortOrder`: Sort direction (asc, desc)
- **Response:** Paginated products with category and inventory info

#### Get Single Product
- **GET** `/products/[id]`
- **Response:** Product details with category, inventory, and reviews

#### Create Product (Admin)
- **POST** `/products`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "name": "string",
    "description": "string",
    "price": "number",
    "categoryId": "string",
    "image": "string",
    "specifications": {}, // optional
    "initialStock": "number" // optional
  }
  ```

#### Update Product (Admin)
- **PUT** `/products/[id]`
- **Auth:** Admin required
- **Body:** Same as create product

#### Delete Product (Admin)
- **DELETE** `/products/[id]`
- **Auth:** Admin required

### Categories

#### Get All Categories
- **GET** `/categories`
- **Query Parameters:**
  - `includeProducts`: Include products in response
  - `activeOnly`: Only active categories
- **Response:** Array of categories

#### Get Single Category
- **GET** `/categories/[id]`
- **Query Parameters:**
  - `includeProducts`: Include products
  - `page`: Page number for products
  - `limit`: Products per page
- **Response:** Category with optional products

#### Create Category (Admin)
- **POST** `/categories`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "name": "string",
    "description": "string", // optional
    "image": "string", // optional
    "isActive": "boolean" // optional
  }
  ```

#### Update Category (Admin)
- **PUT** `/categories/[id]`
- **Auth:** Admin required
- **Body:** Same as create category

#### Delete Category (Admin)
- **DELETE** `/categories/[id]`
- **Auth:** Admin required

### Cart Management

#### Get Cart
- **GET** `/cart`
- **Auth:** Required
- **Response:** Cart items with totals

#### Add to Cart
- **POST** `/cart`
- **Auth:** Required
- **Body:**
  ```json
  {
    "productId": "string",
    "quantity": "number"
  }
  ```

#### Update Cart Item
- **PUT** `/cart/[id]`
- **Auth:** Required
- **Body:**
  ```json
  {
    "quantity": "number"
  }
  ```

#### Remove Cart Item
- **DELETE** `/cart/[id]`
- **Auth:** Required

#### Clear Cart
- **DELETE** `/cart`
- **Auth:** Required

### Orders

#### Get User Orders
- **GET** `/orders`
- **Auth:** Required
- **Query Parameters:**
  - `page`: Page number
  - `limit`: Items per page
  - `status`: Filter by order status
- **Response:** Paginated user orders

#### Create Order
- **POST** `/orders`
- **Auth:** Required
- **Body:**
  ```json
  {
    "shippingAddressId": "string",
    "paymentMethod": "ONLINE|COD",
    "emiPlanId": "string", // optional
    "couponCode": "string" // optional
  }
  ```

#### Get Single Order
- **GET** `/orders/[id]`
- **Auth:** Required
- **Response:** Order details with items and tracking

### Payments

#### Create Payment
- **POST** `/payments/create`
- **Auth:** Required
- **Body:**
  ```json
  {
    "orderId": "string",
    "method": "ONLINE|COD"
  }
  ```

#### Verify Payment
- **POST** `/payments/verify`
- **Body:**
  ```json
  {
    "razorpay_order_id": "string",
    "razorpay_payment_id": "string",
    "razorpay_signature": "string"
  }
  ```

#### Get Payment Status
- **GET** `/payments/verify?paymentId=[id]`

### Reviews

#### Get Product Reviews
- **GET** `/reviews`
- **Query Parameters:**
  - `productId`: Product ID (required)
  - `page`: Page number
  - `limit`: Items per page
  - `rating`: Filter by rating
- **Response:** Paginated reviews with statistics

#### Create Review
- **POST** `/reviews`
- **Auth:** Required
- **Body:**
  ```json
  {
    "productId": "string",
    "rating": "number", // 1-5
    "comment": "string", // optional
    "title": "string" // optional
  }
  ```

### Wishlist

#### Get Wishlist
- **GET** `/wishlist`
- **Auth:** Required
- **Query Parameters:**
  - `page`: Page number
  - `limit`: Items per page
- **Response:** Paginated wishlist items

#### Add to Wishlist
- **POST** `/wishlist`
- **Auth:** Required
- **Body:**
  ```json
  {
    "productId": "string"
  }
  ```

#### Remove from Wishlist
- **DELETE** `/wishlist/[id]`
- **Auth:** Required

#### Clear Wishlist
- **DELETE** `/wishlist`
- **Auth:** Required

### EMI Plans

#### Get EMI Plans
- **GET** `/emi/plans`
- **Query Parameters:**
  - `amount`: Calculate EMI for specific amount
- **Response:** Available EMI plans with calculations

#### Calculate EMI
- **POST** `/emi/calculate`
- **Body:**
  ```json
  {
    "amount": "number",
    "emiPlanId": "string", // optional
    "tenure": "number", // optional if emiPlanId provided
    "interestRate": "number" // optional if emiPlanId provided
  }
  ```

### Settings

#### Get Public Settings
- **GET** `/settings`
- **Query Parameters:**
  - `category`: Filter by category
  - `keys`: Comma-separated list of specific keys
- **Response:** Public configuration settings

## Admin APIs

### Admin Dashboard

#### Get Dashboard Data
- **GET** `/admin/dashboard`
- **Auth:** Admin required
- **Response:** Comprehensive dashboard statistics

### Admin User Management

#### Get All Users
- **GET** `/admin/users`
- **Auth:** Admin required
- **Query Parameters:**
  - `page`: Page number
  - `limit`: Items per page
  - `search`: Search term
  - `role`: Filter by role
- **Response:** Paginated users with statistics

#### Update User Role
- **PUT** `/admin/users`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "userId": "string",
    "role": "USER|ADMIN"
  }
  ```

#### Deactivate User
- **DELETE** `/admin/users?userId=[id]`
- **Auth:** Admin required

### Admin Order Management

#### Get All Orders
- **GET** `/admin/orders`
- **Auth:** Admin required
- **Query Parameters:**
  - `page`: Page number
  - `limit`: Items per page
  - `status`: Filter by status
  - `search`: Search term
  - `startDate`: Date range start
  - `endDate`: Date range end
  - `paymentStatus`: Filter by payment status
- **Response:** Paginated orders with statistics

#### Update Order Status
- **PUT** `/admin/orders`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "orderId": "string",
    "status": "PENDING|CONFIRMED|PROCESSING|SHIPPED|OUT_FOR_DELIVERY|DELIVERED|CANCELLED|RETURNED|REFUNDED",
    "trackingNumber": "string", // optional
    "notes": "string" // optional
  }
  ```

#### Cancel Order
- **DELETE** `/admin/orders?orderId=[id]&reason=[reason]`
- **Auth:** Admin required

### Admin Inventory Management

#### Get Inventory Overview
- **GET** `/admin/inventory`
- **Auth:** Admin required
- **Query Parameters:**
  - `page`: Page number
  - `limit`: Items per page
  - `search`: Search term
  - `categoryId`: Filter by category
  - `stockStatus`: Filter by stock status (low, out, available)
- **Response:** Inventory data with statistics

#### Update Inventory
- **PUT** `/admin/inventory`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "productId": "string",
    "quantity": "number",
    "reservedQuantity": "number", // optional
    "lowStockThreshold": "number" // optional
  }
  ```

#### Bulk Update Inventory
- **POST** `/admin/inventory`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "updates": [
      {
        "productId": "string",
        "quantity": "number",
        "reservedQuantity": "number", // optional
        "lowStockThreshold": "number" // optional
      }
    ]
  }
  ```

### Admin Review Management

#### Get All Reviews
- **GET** `/admin/reviews`
- **Auth:** Admin required
- **Query Parameters:**
  - `page`: Page number
  - `limit`: Items per page
  - `status`: Filter by status (pending, approved, rejected)
  - `productId`: Filter by product
- **Response:** Paginated reviews with statistics

#### Update Review Status
- **PUT** `/admin/reviews`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "reviewId": "string",
    "status": "PENDING|APPROVED|REJECTED",
    "adminNote": "string" // optional
  }
  ```

#### Delete Review
- **DELETE** `/admin/reviews?reviewId=[id]`
- **Auth:** Admin required

### Admin Analytics

#### Get Analytics Data
- **GET** `/admin/analytics`
- **Auth:** Admin required
- **Query Parameters:**
  - `period`: Number of days (default: 30)
  - `startDate`: Custom start date
  - `endDate`: Custom end date
- **Response:** Comprehensive analytics data including:
  - Sales data
  - Order statistics
  - Product performance
  - User analytics
  - Revenue breakdown
  - Category performance
  - Payment method distribution
  - EMI statistics
  - Geographical distribution
  - Customer lifetime value
  - Inventory turnover

### Admin Settings Management

#### Get All Settings
- **GET** `/admin/settings`
- **Auth:** Admin required
- **Query Parameters:**
  - `category`: Filter by category
  - `isPublic`: Filter by public/private
- **Response:** All system settings grouped by category

#### Create/Update Setting
- **POST** `/admin/settings`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "key": "string",
    "value": "string",
    "description": "string", // optional
    "category": "string", // optional
    "isPublic": "boolean" // optional
  }
  ```

#### Bulk Update Settings
- **PUT** `/admin/settings`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "settings": [
      {
        "key": "string",
        "value": "string",
        "description": "string", // optional
        "category": "string", // optional
        "isPublic": "boolean" // optional
      }
    ]
  }
  ```

#### Delete Setting
- **DELETE** `/admin/settings?key=[key]`
- **Auth:** Admin required

## Error Codes

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists
- **422**: Unprocessable Entity - Validation errors
- **500**: Internal Server Error - Server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- General endpoints: 100 requests per minute
- Authentication endpoints: 10 requests per minute
- Admin endpoints: 200 requests per minute

## Data Migration

To migrate existing product data to the database, run:
```bash
npm run migrate-products
```

This will execute the migration script located at `scripts/migrate-products.ts`.

## Environment Variables

Required environment variables:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## Testing

Use tools like Postman or curl to test the API endpoints. Example:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'

# Get products
curl -X GET "http://localhost:3000/api/products?page=1&limit=10"

# Get user profile (with auth)
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer your-jwt-token"
```

This API provides a complete e-commerce backend with user management, product catalog, shopping cart, order processing, payment integration, reviews, wishlist, EMI plans, and comprehensive admin functionality.