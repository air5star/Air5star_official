#!/usr/bin/env node

/**
 * AI Features Test Script
 * Run this script to quickly test all implemented AI endpoints
 * Usage: node test-ai-features.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  try {
    log(`\n🧪 Testing ${name}...`, 'blue');
    const response = await makeRequest(url, options);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      log(`✅ ${name} - Status: ${response.statusCode}`, 'green');
      
      // Try to parse JSON response
      try {
        const jsonData = JSON.parse(response.data);
        if (jsonData.error) {
          log(`⚠️  Response contains error: ${jsonData.error}`, 'yellow');
        } else {
          log(`📄 Response preview: ${JSON.stringify(jsonData).substring(0, 100)}...`, 'blue');
        }
      } catch (e) {
        log(`📄 Response preview: ${response.data.substring(0, 100)}...`, 'blue');
      }
    } else {
      log(`❌ ${name} - Status: ${response.statusCode}`, 'red');
      log(`Error: ${response.data}`, 'red');
    }
  } catch (error) {
    log(`❌ ${name} - Connection Error: ${error.message}`, 'red');
  }
}

async function runTests() {
  log('🚀 Starting AI Features Test Suite', 'green');
  log('=' .repeat(50), 'blue');
  
  // Test 1: Tidio Webhook Health Check
  await testEndpoint(
    'Tidio Webhook Health Check',
    `${BASE_URL}/api/tidio-webhook`
  );
  
  // Test 2: Smart Search Autocomplete
  await testEndpoint(
    'Smart Search Autocomplete',
    `${BASE_URL}/api/search?q=air&type=autocomplete&limit=5`
  );
  
  // Test 3: Smart Search Full
  await testEndpoint(
    'Smart Search Full',
    `${BASE_URL}/api/search?q=conditioner&type=search&limit=10`
  );
  
  // Test 4: Product Recommendations
  await testEndpoint(
    'Product Recommendations',
    `${BASE_URL}/api/recommendations?type=similar&productId=1&limit=4`
  );
  
  // Test 5: Inventory Forecast
  await testEndpoint(
    'Inventory Forecast',
    `${BASE_URL}/api/inventory-forecast?productId=1&days=30`
  );
  
  // Test 6: Abandoned Cart Health Check
  await testEndpoint(
    'Abandoned Cart Health Check',
    `${BASE_URL}/api/abandoned-cart`
  );
  
  // Test 7: Abandoned Cart POST (with sample data)
  const cartData = {
    email: 'test@example.com',
    cartItems: [
      {
        productId: '1',
        name: 'Test Air Conditioner',
        price: 25000,
        quantity: 1,
        image: '/ac-1.webp'
      }
    ],
    cartTotal: 25000,
    currency: 'INR'
  };
  
  await testEndpoint(
    'Abandoned Cart POST',
    `${BASE_URL}/api/abandoned-cart`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cartData)
    }
  );
  
  // Test 8: Recommendations POST (track interaction)
  const interactionData = {
    userId: 'test-user',
    productId: '1',
    action: 'view',
    timestamp: new Date().toISOString()
  };
  
  await testEndpoint(
    'Recommendations Interaction Tracking',
    `${BASE_URL}/api/recommendations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(interactionData)
    }
  );
  
  // Test 9: Inventory Forecast CSV Export
  await testEndpoint(
    'Inventory Forecast CSV Export',
    `${BASE_URL}/api/inventory-forecast?format=csv&productId=1`,
    {
      method: 'PUT'
    }
  );
  
  log('\n' + '=' .repeat(50), 'blue');
  log('🏁 Test Suite Complete!', 'green');
  log('\n📋 Next Steps:', 'yellow');
  log('1. Check the TESTING_GUIDE.md for detailed testing instructions');
  log('2. Configure environment variables in .env file');
  log('3. Test the UI components in your browser');
  log('4. Set up external services (Tidio, Typesense, Redis, MailerLite)');
  log('\n💡 Tip: If any tests fail, check your .env configuration and ensure the dev server is running.');
}

// Check if server is running first
async function checkServer() {
  try {
    await makeRequest(`${BASE_URL}/api/health`);
    return true;
  } catch (error) {
    try {
      // Try the main page
      await makeRequest(BASE_URL);
      return true;
    } catch (e) {
      return false;
    }
  }
}

async function main() {
  log('🔍 Checking if development server is running...', 'blue');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    log('❌ Development server is not running!', 'red');
    log('Please start the server with: npm run dev', 'yellow');
    process.exit(1);
  }
  
  log('✅ Development server is running!', 'green');
  await runTests();
}

// Run the tests
main().catch(error => {
  log(`\n💥 Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});