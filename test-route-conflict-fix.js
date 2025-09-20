/**
 * Test Route Conflict Fix
 * Tests the debug version to validate if single route patterns fix the 'apply' error
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Test the debug version
const debugApp = require('./api/index-debug.js');
// Test the original version for comparison
const originalApp = require('./api/index.js');

async function loadTestImage() {
  try {
    // Load a base64 test image
    const imagePath = path.join(__dirname, 'test_image.b64');
    if (fs.existsSync(imagePath)) {
      return fs.readFileSync(imagePath, 'utf8').trim();
    }
    
    // If no test image, create a minimal one
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return testImageBase64;
  } catch (error) {
    console.error('Error loading test image:', error);
    return null;
  }
}

async function testRouteConflictFix() {
  console.log('='.repeat(60));
  console.log('TESTING ROUTE CONFLICT FIX');
  console.log('='.repeat(60));
  
  const testImage = await loadTestImage();
  if (!testImage) {
    console.error('❌ Could not load test image');
    return;
  }
  
  console.log('✅ Test image loaded successfully');
  console.log('Image data length:', testImage.length);
  
  // Test 1: Health Check on Debug Version
  console.log('\n1. Testing Health Check (Debug Version)');
  console.log('-'.repeat(40));
  
  try {
    const healthResponse = await request(debugApp)
      .get('/health')
      .expect(200);
      
    console.log('✅ Debug health check successful');
    console.log('Response:', JSON.stringify(healthResponse.body, null, 2));
  } catch (error) {
    console.error('❌ Debug health check failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
  
  // Test 2: Convert endpoint on Debug Version (single route pattern)
  console.log('\n2. Testing Convert Endpoint (Debug Version - Single Route)');
  console.log('-'.repeat(40));
  
  try {
    const convertResponse = await request(debugApp)
      .post('/convert')
      .send({
        imageData: testImage,
        shades: 10,
        format: 'json'
      })
      .expect(200);
      
    console.log('✅ Debug convert successful');
    console.log('Response keys:', Object.keys(convertResponse.body));
    if (convertResponse.body.success) {
      console.log('✅ Conversion successful');
      console.log('Pixel map dimensions:', convertResponse.body.data?.dimensions);
    } else {
      console.log('❌ Conversion failed:', convertResponse.body.error);
    }
  } catch (error) {
    console.error('❌ Debug convert failed:', error.message);
    console.error('Error details:', error.response?.text || 'No response text');
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
  
  // Test 3: Compare with Original Version (array route patterns)
  console.log('\n3. Testing Original Version (Array Route Patterns)');
  console.log('-'.repeat(40));
  
  try {
    console.log('Testing original health check...');
    const originalHealthResponse = await request(originalApp)
      .get('/health')
      .expect(200);
      
    console.log('✅ Original health check successful');
    console.log('Response:', JSON.stringify(originalHealthResponse.body, null, 2));
  } catch (error) {
    console.error('❌ Original health check failed:', error.message);
    if (error.message.includes('apply')) {
      console.error('🎯 FOUND THE APPLY ERROR in original version!');
    }
  }
  
  try {
    console.log('Testing original convert endpoint...');
    const originalConvertResponse = await request(originalApp)
      .post('/convert')
      .send({
        imageData: testImage,
        shades: 10,
        format: 'json'
      })
      .expect(200);
      
    console.log('✅ Original convert successful');
  } catch (error) {
    console.error('❌ Original convert failed:', error.message);
    if (error.message.includes('apply')) {
      console.error('🎯 FOUND THE APPLY ERROR in original version!');
      console.error('This confirms the route conflict hypothesis!');
    }
    console.error('Error details:', error.response?.text || 'No response text');
  }
  
  // Test 4: Route Pattern Analysis
  console.log('\n4. Route Pattern Analysis');
  console.log('-'.repeat(40));
  
  console.log('Debug version routes:');
  console.log('- GET /health (single pattern)');
  console.log('- POST /convert (single pattern)');
  console.log('');
  console.log('Original version routes:');
  console.log('- GET ["/health", "/api/health"] (array pattern)');
  console.log('- POST ["/convert", "/api/convert"] (array pattern)');
  console.log('');
  console.log('Vercel rewrite rule: /api/(.*) → /api/index');
  console.log('This creates double-routing when array patterns include /api/convert');
  
  // Test 5: Simulated Vercel Request
  console.log('\n5. Simulating Vercel Request Pattern');
  console.log('-'.repeat(40));
  
  // Simulate how Vercel would handle the request
  console.log('Simulating: POST /api/convert → rewritten to → /api/index');
  console.log('Expected behavior with debug version: single /convert route should work');
  
  try {
    // Test the actual route that Vercel would hit after rewrite
    const simulatedResponse = await request(debugApp)
      .post('/convert')
      .set('X-Forwarded-Host', 'yourapp.vercel.app')
      .send({
        imageData: testImage,
        shades: 10,
        format: 'json'
      });
      
    console.log('✅ Simulated Vercel request successful');
    console.log('Status:', simulatedResponse.status);
    if (simulatedResponse.body?.success) {
      console.log('✅ Route conflict fix appears to work!');
    }
  } catch (error) {
    console.error('❌ Simulated Vercel request failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('ROUTE CONFLICT TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log('Debug version (single routes): Testing completed');
  console.log('Original version (array routes): Comparison completed');
  console.log('');
  console.log('If debug version works and original fails with "apply" error,');
  console.log('this confirms the route conflict is the root cause.');
}

// Test 6: Express Router Internal Analysis
async function testExpressRouterInternals() {
  console.log('\n6. Express Router Internal Analysis');
  console.log('-'.repeat(40));
  
  try {
    // Check if the route handlers are properly defined
    console.log('Checking route handler definitions...');
    
    // Debug app analysis
    console.log('Debug app type:', typeof debugApp);
    console.log('Debug app._router type:', typeof debugApp._router);
    
    // Original app analysis  
    console.log('Original app type:', typeof originalApp);
    console.log('Original app._router type:', typeof originalApp._router);
    
    if (debugApp._router && debugApp._router.stack) {
      console.log('Debug app routes count:', debugApp._router.stack.length);
      debugApp._router.stack.forEach((layer, index) => {
        console.log(`- Route ${index}:`, {
          regexp: layer.regexp.toString(),
          methods: Object.keys(layer.route?.methods || {}),
          path: layer.route?.path
        });
      });
    }
    
    if (originalApp._router && originalApp._router.stack) {
      console.log('Original app routes count:', originalApp._router.stack.length);
      originalApp._router.stack.forEach((layer, index) => {
        console.log(`- Route ${index}:`, {
          regexp: layer.regexp.toString(),
          methods: Object.keys(layer.route?.methods || {}),
          path: layer.route?.path
        });
      });
    }
    
  } catch (error) {
    console.error('Error analyzing Express internals:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testRouteConflictFix();
    await testExpressRouterInternals();
    
    console.log('\n✅ All route conflict tests completed');
    console.log('\nNext steps:');
    console.log('1. If debug version works → deploy with single route patterns');
    console.log('2. If both fail → investigate serverless export format');
    console.log('3. Check Vercel logs for detailed error traces');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the tests
runAllTests();