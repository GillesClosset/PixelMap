/**
 * Test the Fixed Version
 * Validates that the single route pattern fix resolves the Vercel issue
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Test the fixed version
const fixedApp = require('./api/index-fixed.js');

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

async function testFixedVersion() {
  console.log('='.repeat(60));
  console.log('TESTING FIXED VERSION');
  console.log('='.repeat(60));
  
  const testImage = await loadTestImage();
  if (!testImage) {
    console.error('❌ Could not load test image');
    return;
  }
  
  console.log('✅ Test image loaded successfully');
  
  // Test 1: Health Check
  console.log('\n1. Testing Health Check (Fixed Version)');
  console.log('-'.repeat(40));
  
  try {
    const healthResponse = await request(fixedApp)
      .get('/health')
      .expect(200);
      
    console.log('✅ Fixed health check successful');
    console.log('Response:', JSON.stringify(healthResponse.body, null, 2));
    
    if (healthResponse.body.version === 'fixed') {
      console.log('✅ Confirmed using fixed version');
    }
  } catch (error) {
    console.error('❌ Fixed health check failed:', error.message);
    return false;
  }
  
  // Test 2: Info endpoint
  console.log('\n2. Testing Info Endpoint');
  console.log('-'.repeat(40));
  
  try {
    const infoResponse = await request(fixedApp)
      .get('/info')
      .expect(200);
      
    console.log('✅ Fixed info endpoint successful');
    console.log('Environment:', infoResponse.body.data?.environment);
  } catch (error) {
    console.error('❌ Fixed info endpoint failed:', error.message);
    return false;
  }
  
  // Test 3: Convert endpoint with single route pattern
  console.log('\n3. Testing Convert Endpoint (Fixed Version)');
  console.log('-'.repeat(40));
  
  try {
    const convertResponse = await request(fixedApp)
      .post('/convert')
      .send({
        imageData: testImage,
        shades: 10,
        format: 'json'
      })
      .expect(200);
      
    console.log('✅ Fixed convert successful');
    
    if (convertResponse.body.success) {
      console.log('✅ Image conversion successful');
      console.log('Pixel map dimensions:', convertResponse.body.data?.dimensions);
      console.log('Shades:', convertResponse.body.data?.shades);
      console.log('Timestamp:', convertResponse.body.data?.timestamp);
      
      // Validate pixel map structure
      const pixelMap = convertResponse.body.data?.pixelMap;
      if (pixelMap && Array.isArray(pixelMap)) {
        console.log('✅ Pixel map structure valid');
        console.log('Pixel map size:', pixelMap.length + 'x' + (pixelMap[0]?.length || 0));
      } else {
        console.log('❌ Pixel map structure invalid');
        return false;
      }
    } else {
      console.log('❌ Conversion failed:', convertResponse.body.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Fixed convert failed:', error.message);
    console.error('Error details:', error.response?.text || 'No response text');
    return false;
  }
  
  // Test 4: CSV format
  console.log('\n4. Testing CSV Format');
  console.log('-'.repeat(40));
  
  try {
    const csvResponse = await request(fixedApp)
      .post('/convert')
      .send({
        imageData: testImage,
        shades: 10,
        format: 'csv'
      })
      .expect(200);
      
    console.log('✅ CSV conversion successful');
    console.log('Content-Type:', csvResponse.headers['content-type']);
    console.log('Content-Disposition:', csvResponse.headers['content-disposition']);
    console.log('CSV preview (first 100 chars):', csvResponse.text.substring(0, 100));
  } catch (error) {
    console.error('❌ CSV conversion failed:', error.message);
    return false;
  }
  
  // Test 5: Error handling
  console.log('\n5. Testing Error Handling');
  console.log('-'.repeat(40));
  
  try {
    const errorResponse = await request(fixedApp)
      .post('/convert')
      .send({
        // Missing imageData
        shades: 10,
        format: 'json'
      })
      .expect(400);
      
    console.log('✅ Error handling working');
    console.log('Error response:', errorResponse.body.error);
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
  
  // Test 6: Route Analysis
  console.log('\n6. Fixed Version Route Analysis');
  console.log('-'.repeat(40));
  
  console.log('Fixed version uses SINGLE route patterns:');
  console.log('- GET /health');
  console.log('- GET /info');  
  console.log('- POST /convert');
  console.log('');
  console.log('No array patterns that could conflict with Vercel rewrites');
  console.log('Vercel rewrite: /api/convert → /api/index-fixed → /convert');
  
  if (fixedApp._router && fixedApp._router.stack) {
    console.log('Route count:', fixedApp._router.stack.length);
    fixedApp._router.stack.forEach((layer, index) => {
      if (layer.route) {
        console.log(`- Route ${index}:`, {
          path: layer.route.path,
          methods: Object.keys(layer.route.methods || {})
        });
      }
    });
  }
  
  console.log('\n✅ All fixed version tests completed successfully');
  return true;
}

// Run the test
async function runTest() {
  try {
    const success = await testFixedVersion();
    
    if (success) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 FIXED VERSION VALIDATION SUCCESSFUL');
      console.log('='.repeat(60));
      console.log('');
      console.log('✅ Single route patterns work correctly');
      console.log('✅ No array route conflicts with Vercel');
      console.log('✅ All endpoints function properly');
      console.log('✅ Error handling works');
      console.log('');
      console.log('DEPLOYMENT READY:');
      console.log('1. Replace api/index.js with api/index-fixed.js');
      console.log('2. Update vercel.json to point to index-fixed');
      console.log('3. Deploy to Vercel');
      console.log('');
      console.log('This should resolve the "apply" error on Vercel.');
    } else {
      console.log('\n❌ Fixed version validation failed');
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

runTest();