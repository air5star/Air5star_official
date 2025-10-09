#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Testing Script
 * Tests all endpoints documented in swagger.yaml
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000/api';
const COLORS = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    CYAN: '\x1b[36m',
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m'
};

function colorLog(color, message) {
    console.log(`${color}${message}${COLORS.RESET}`);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestModule = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'API-Test-Script/1.0',
                ...options.headers
            }
        };

        const req = requestModule.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

async function testEndpoint(name, url, options = {}) {
    try {
        colorLog(COLORS.CYAN, `\n🧪 Testing: ${name}`);
        colorLog(COLORS.BLUE, `   ${options.method || 'GET'} ${url}`);
        
        const result = await makeRequest(url, options);
        
        if (result.status >= 200 && result.status < 300) {
            colorLog(COLORS.GREEN, `   ✅ SUCCESS (${result.status})`);
            if (result.data && typeof result.data === 'object') {
                console.log(`   📊 Response:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
            }
        } else if (result.status >= 400 && result.status < 500) {
            colorLog(COLORS.YELLOW, `   ⚠️  CLIENT ERROR (${result.status})`);
            if (result.data) {
                console.log(`   📋 Error:`, JSON.stringify(result.data, null, 2).substring(0, 150) + '...');
            }
        } else {
            colorLog(COLORS.RED, `   ❌ SERVER ERROR (${result.status})`);
            if (result.data) {
                console.log(`   📋 Error:`, JSON.stringify(result.data, null, 2).substring(0, 150) + '...');
            }
        }
        
        return result;
    } catch (error) {
        colorLog(COLORS.RED, `   ❌ REQUEST FAILED: ${error.message}`);
        return { status: 0, error: error.message };
    }
}

async function runAllTests() {
    colorLog(COLORS.BOLD + COLORS.BLUE, '🚀 Air5Star API Endpoint Testing Suite');
    colorLog(COLORS.BLUE, '=' .repeat(50));
    
    // Check if server is running
    try {
        await makeRequest(`${BASE_URL.replace('/api', '')}`);
        colorLog(COLORS.GREEN, '✅ Development server is running');
    } catch (error) {
        colorLog(COLORS.RED, '❌ Development server is not running!');
        colorLog(COLORS.YELLOW, '   Please run: npm run dev');
        process.exit(1);
    }

    const tests = [
        // Health Checks
        {
            name: 'Tidio Webhook Health Check',
            url: `${BASE_URL}/tidio-webhook`,
            options: { method: 'HEAD' }
        },
        {
            name: 'Search API Health Check',
            url: `${BASE_URL}/search?q=test`,
            options: { method: 'HEAD' }
        },
        {
            name: 'Recommendations Health Check',
            url: `${BASE_URL}/recommendations?type=trending`,
            options: { method: 'HEAD' }
        },
        {
            name: 'Abandoned Cart Health Check',
            url: `${BASE_URL}/abandoned-cart`,
            options: { method: 'HEAD' }
        },
        {
            name: 'Inventory Forecast Health Check',
            url: `${BASE_URL}/inventory-forecast?productId=1`,
            options: { method: 'HEAD' }
        },

        // GET Endpoints
        {
            name: 'Smart Search - Basic Query',
            url: `${BASE_URL}/search?q=air+conditioner&limit=5`
        },
        {
            name: 'Smart Search - Autocomplete Mode',
            url: `${BASE_URL}/search?q=split&mode=autocomplete&limit=3`
        },
        {
            name: 'Smart Search - Category Filter',
            url: `${BASE_URL}/search?q=ac&category=Air+Conditioners&limit=5`
        },
        {
            name: 'Recommendations - Trending Products',
            url: `${BASE_URL}/recommendations?type=trending&limit=5`
        },
        {
            name: 'Recommendations - Category Based',
            url: `${BASE_URL}/recommendations?type=category&category=Air+Conditioners&limit=3`
        },
        {
            name: 'Recommendations - Similar Products',
            url: `${BASE_URL}/recommendations?type=similar&productId=1&limit=4`
        },
        {
            name: 'Inventory Forecast - Basic Query',
            url: `${BASE_URL}/inventory-forecast?productId=1&days=30`
        },
        {
            name: 'Inventory Forecast - Multiple Products',
            url: `${BASE_URL}/inventory-forecast?productId=1,2,3&days=7`
        },
        {
            name: 'Inventory Forecast - CSV Export',
            url: `${BASE_URL}/inventory-forecast?format=csv&productId=1`
        },

        // POST Endpoints
        {
            name: 'Tidio Webhook - Message Processing',
            url: `${BASE_URL}/tidio-webhook`,
            options: {
                method: 'POST',
                body: {
                    type: 'message',
                    visitor_id: 'test_visitor_123',
                    message: 'I need a 1.5 ton split AC',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        source: 'widget',
                        page_url: 'http://localhost:3000/products'
                    }
                }
            }
        },
        {
            name: 'Recommendations - Track Interaction',
            url: `${BASE_URL}/recommendations`,
            options: {
                method: 'POST',
                body: {
                    user_id: 'test_user_123',
                    product_id: '1',
                    action: 'view',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        source: 'product_page',
                        duration: 30
                    }
                }
            }
        },
        {
            name: 'Abandoned Cart - Submit Cart Data',
            url: `${BASE_URL}/abandoned-cart`,
            options: {
                method: 'POST',
                body: {
                    user_id: 'test_user_123',
                    cart_items: [
                        {
                            product_id: '1',
                            name: 'Split AC 1.5 Ton',
                            price: 35000,
                            quantity: 1,
                            image_url: '/images/split-ac-1.jpg'
                        }
                    ],
                    cart_total: 35000,
                    user_email: 'test@example.com',
                    user_name: 'Test User',
                    timestamp: new Date().toISOString()
                }
            }
        },
        {
            name: 'Inventory Forecast - Upload Sales Data',
            url: `${BASE_URL}/inventory-forecast`,
            options: {
                method: 'POST',
                body: {
                    product_id: '1',
                    sales_data: [
                        {
                            date: '2024-01-01',
                            quantity_sold: 5,
                            revenue: 175000
                        },
                        {
                            date: '2024-01-02',
                            quantity_sold: 3,
                            revenue: 105000
                        }
                    ]
                }
            }
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const result = await testEndpoint(test.name, test.url, test.options);
        if (result.status >= 200 && result.status < 400) {
            passed++;
        } else {
            failed++;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    colorLog(COLORS.BOLD + COLORS.BLUE, '\n📊 Test Summary');
    colorLog(COLORS.BLUE, '=' .repeat(30));
    colorLog(COLORS.GREEN, `✅ Passed: ${passed}`);
    colorLog(COLORS.RED, `❌ Failed: ${failed}`);
    colorLog(COLORS.CYAN, `📋 Total: ${tests.length}`);
    
    if (failed === 0) {
        colorLog(COLORS.GREEN + COLORS.BOLD, '\n🎉 All tests passed! Your API is ready for Swagger UI testing.');
    } else {
        colorLog(COLORS.YELLOW + COLORS.BOLD, '\n⚠️  Some tests failed. Check the errors above and your .env configuration.');
    }
    
    colorLog(COLORS.CYAN, '\n🌐 Access Swagger UI at: http://localhost:3000/swagger-ui.html');
    colorLog(COLORS.CYAN, '📚 API Documentation: http://localhost:3000/api-docs');
}

if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testEndpoint, makeRequest };