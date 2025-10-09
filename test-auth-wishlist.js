const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const newUser = {
  name: 'New Test User',
  email: 'newuser@example.com',
  password: 'password123',
  phone: '9876543211'
};

let authToken = '';
let productId = '';

async function testSignup() {
  try {
    console.log('🔐 Testing Signup...');
    const response = await axios.post(`${BASE_URL}/auth/signup`, newUser);
    console.log('✅ Signup successful:', response.data.message);
    console.log('User created:', response.data.user.name, response.data.user.email);
    return response.data.token;
  } catch (error) {
    console.log('❌ Signup failed:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testLogin() {
  try {
    console.log('\n🔑 Testing Login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', response.data.message);
    console.log('User:', response.data.user.name, response.data.user.email);
    return response.data.token;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error || error.message);
    return null;
  }
}

async function getProducts() {
  try {
    console.log('\n📦 Getting products...');
    const response = await axios.get(`${BASE_URL}/products?limit=5`);
    console.log('✅ Products fetched:', response.data.products.length, 'products');
    if (response.data.products.length > 0) {
      productId = response.data.products[0].id;
      console.log('First product:', response.data.products[0].name);
    }
    return response.data.products;
  } catch (error) {
    console.log('❌ Failed to get products:', error.response?.data?.error || error.message);
    return [];
  }
}

async function testAddToWishlist() {
  try {
    console.log('\n❤️ Testing Add to Wishlist...');
    const response = await axios.post(
      `${BASE_URL}/wishlist`,
      { productId },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Added to wishlist:', response.data.message);
    console.log('Product added:', response.data.wishlistItem.product.name);
    return true;
  } catch (error) {
    console.log('❌ Failed to add to wishlist:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetWishlist() {
  try {
    console.log('\n📋 Testing Get Wishlist...');
    const response = await axios.get(`${BASE_URL}/wishlist`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Wishlist fetched:', response.data.items.length, 'items');
    if (response.data.items.length > 0) {
      console.log('Wishlist items:');
      response.data.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.product.name} - ₹${item.product.price}`);
      });
    } else {
      console.log('Wishlist is empty');
    }
    return response.data.items;
  } catch (error) {
    console.log('❌ Failed to get wishlist:', error.response?.data?.error || error.message);
    return [];
  }
}

async function testRemoveFromWishlist() {
  try {
    console.log('\n🗑️ Testing Remove from Wishlist...');
    const response = await axios.delete(
      `${BASE_URL}/wishlist/remove`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          productId
        }
      }
    );
    console.log('✅ Removed from wishlist:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Failed to remove from wishlist:', error.response?.data?.error || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication and Wishlist Tests\n');
  console.log('=' .repeat(50));

  // Test signup
  await testSignup();

  // Test login
  authToken = await testLogin();
  if (!authToken) {
    console.log('❌ Cannot proceed without authentication token');
    return;
  }

  // Get products
  const products = await getProducts();
  if (products.length === 0) {
    console.log('❌ No products available for wishlist testing');
    return;
  }

  // Test wishlist functionality
  await testAddToWishlist();
  await testGetWishlist();
  await testRemoveFromWishlist();
  
  // Check wishlist after removal
  console.log('\n🔍 Checking wishlist after removal...');
  await testGetWishlist();

  console.log('\n' + '=' .repeat(50));
  console.log('🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error);