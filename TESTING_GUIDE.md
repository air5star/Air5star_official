# AI Features Testing Guide

This guide will help you test all the AI-powered features implemented in your HVAC eCommerce website.

## Prerequisites

1. **Environment Setup**: Copy `.env.example` to `.env` and configure the following:
   ```bash
   # Required for testing
   NEXT_PUBLIC_TIDIO_PUBLIC_KEY=your_tidio_key
   TIDIO_WEBHOOK_SECRET=your_webhook_secret
   TYPESENSE_API_KEY=your_typesense_key
   TYPESENSE_HOST=localhost
   TYPESENSE_PORT=8108
   TYPESENSE_PROTOCOL=http
   REDIS_URL=redis://localhost:6379
   MAILERLITE_API_KEY=your_mailerlite_key
   MAILERLITE_GROUP_ID=your_group_id
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Feature Testing Checklist

### ✅ 1. Tidio Chatbot Integration

**What to Test:**
- [ ] Chatbot widget appears in bottom-right corner
- [ ] Widget is responsive on mobile devices
- [ ] Chatbot loads without console errors

**How to Test:**
1. Open http://localhost:3000
2. Look for Tidio chat widget in bottom-right
3. Test on mobile by resizing browser window
4. Check browser console for errors (F12)

**API Endpoint Test:**
```bash
# Test webhook endpoint
curl -X GET http://localhost:3000/api/tidio-webhook
# Should return: {"status":"Tidio webhook endpoint is active"}
```

### ✅ 2. Smart Search & Autocomplete

**What to Test:**
- [ ] Search input shows autocomplete suggestions
- [ ] Debounced search (waits before searching)
- [ ] Recent searches are stored
- [ ] Mobile-responsive search interface

**How to Test:**
1. Click on search input in header
2. Type "air conditioner" slowly
3. Observe autocomplete suggestions appear
4. Check recent searches section
5. Test on mobile viewport

**API Endpoint Test:**
```bash
# Test search API
curl "http://localhost:3000/api/search?q=air&type=autocomplete"
# Should return search suggestions
```

### ✅ 3. Product Recommendations

**What to Test:**
- [ ] Recommendation component renders
- [ ] Different recommendation types work
- [ ] User interactions are tracked
- [ ] Mobile-responsive layout

**How to Test:**
1. Navigate to any product page
2. Look for "Recommended Products" section
3. Click on recommended products
4. Add items to cart/wishlist
5. Check if recommendations update

**API Endpoint Test:**
```bash
# Test recommendations API
curl "http://localhost:3000/api/recommendations?type=similar&productId=1&limit=4"
# Should return product recommendations
```

### ✅ 4. Abandoned Cart Email Automation

**What to Test:**
- [ ] API accepts cart data
- [ ] Email sequences are configured
- [ ] GDPR compliance features
- [ ] Recovery token generation

**How to Test:**
1. Add items to cart
2. Navigate away without purchasing
3. Test API endpoint manually:

```bash
# Test abandoned cart API
curl -X POST http://localhost:3000/api/abandoned-cart \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "cartItems": [
      {
        "productId": "1",
        "name": "Air Conditioner",
        "price": 25000,
        "quantity": 1,
        "image": "/ac-1.webp"
      }
    ],
    "cartTotal": 25000,
    "currency": "INR"
  }'
```

### ✅ 5. Inventory Forecasting

**What to Test:**
- [ ] Forecast API returns predictions
- [ ] CSV export functionality
- [ ] Reorder alerts generation
- [ ] Sales data processing

**How to Test:**

```bash
# Test inventory forecast API
curl "http://localhost:3000/api/inventory-forecast?productId=1&days=30"
# Should return forecast data

# Test CSV export
curl -X PUT "http://localhost:3000/api/inventory-forecast?format=csv&productId=1"
# Should return CSV data
```

### ✅ 6. API Documentation

**What to Test:**
- [ ] Swagger documentation is complete
- [ ] All endpoints are documented
- [ ] Request/response schemas are accurate

**How to Test:**
1. Open `swagger.yaml` file
2. Use online Swagger editor: https://editor.swagger.io/
3. Paste the YAML content
4. Verify all endpoints are documented

### ✅ 7. Security & Performance

**What to Test:**
- [ ] Environment variables are used
- [ ] HMAC verification works
- [ ] No sensitive data in client-side code
- [ ] API rate limiting (if configured)

**Security Checklist:**
1. Check `.env.example` for all required variables
2. Verify no API keys in source code
3. Test HMAC signature verification
4. Check HTTPS redirects (in production)

## Browser Testing

### Desktop Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Edge (latest)

### Mobile Testing
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Responsive design (320px - 1920px)

## Performance Testing

### Core Web Vitals
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run performance audit
4. Check for:
   - [ ] LCP < 2.5s
   - [ ] FID < 100ms
   - [ ] CLS < 0.1

### Network Testing
1. Test on slow 3G connection
2. Check image loading
3. Verify API response times

## Troubleshooting

### Common Issues

1. **Chatbot not loading:**
   - Check `NEXT_PUBLIC_TIDIO_PUBLIC_KEY` in `.env`
   - Verify internet connection
   - Check browser console for errors

2. **Search not working:**
   - Verify Typesense configuration
   - Check API endpoint responses
   - Ensure lodash is installed

3. **Recommendations empty:**
   - Check Redis connection
   - Verify product data exists
   - Test API endpoints manually

4. **Email automation failing:**
   - Verify MailerLite API key
   - Check email format validation
   - Test with valid email addresses

### Debug Commands

```bash
# Check if all dependencies are installed
npm list

# Run type checking
npx tsc --noEmit

# Check for linting issues
npm run lint

# Format code
npm run format
```

## Production Deployment Checklist

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error monitoring setup
- [ ] Database migrations run
- [ ] CDN configured for static assets
- [ ] Backup strategy in place

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify environment variables
3. Test API endpoints individually
4. Check network connectivity
5. Review server logs

---

**Note:** This testing guide covers all implemented AI features. Make sure to test thoroughly before deploying to production.