#!/usr/bin/env node

/**
 * Comprehensive Verification Test Suite
 * 
 * This test verifies that all Vercel fixes are working correctly:
 * 1. Local API endpoint testing
 * 2. Serverless function simulation
 * 3. Image upload functionality
 * 4. Enhanced logging verification
 * 5. Middleware stack validation
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');

// Test configuration
const TEST_CONFIG = {
  VERCEL_ENV: process.env.NODE_ENV === 'production',
  BASE64_TEST_IMAGE: '', // Will be loaded from file
  TARGET_WIDTH: 50,
  TARGET_HEIGHT: 70,
  VALID_SHADES: [9, 10, 11, 12],
  INVALID_SHADES: [8, 13, 15]
};

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Utility functions
function logTest(testName, status, details = '') {
  const timestamp = new Date().toISOString();
  const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  
  console.log(`[${timestamp}] ${statusSymbol} ${testName}`);
  if (details) {
    console.log(`    ${details}`);
  }
  
  testResults.details.push({
    name: testName,
    status,
    details,
    timestamp
  });
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

function loadTestImage() {
  try {
    // Try to load existing test image
    const testImagePath = path.join(__dirname, 'test_image.b64');
    if (fs.existsSync(testImagePath)) {
      return fs.readFileSync(testImagePath, 'utf8').trim();
    }
    
    // If not available, create a simple test image in base64
    const testImageB64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    logTest('Test Image Loading', 'WARN', 'Using minimal test image - real test image not found');
    return testImageB64;
  } catch (error) {
    logTest('Test Image Loading', 'FAIL', `Failed to load test image: ${error.message}`);
    // Return minimal valid base64 image
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }
}

// Test 1: Verify the serverless function can be imported without errors
async function testServerlessFunctionImport() {
  try {
    console.log('\n=== Test 1: Serverless Function Import ===');
    
    // Clear require cache to ensure fresh import
    const apiIndexPath = path.join(__dirname, 'api', 'index.js');
    delete require.cache[require.resolve(apiIndexPath)];
    
    const app = require('./api/index.js');
    
    if (!app) {
      throw new Error('API index.js did not export an Express app');
    }
    
    if (typeof app !== 'function') {
      throw new Error('Exported app is not a function (not an Express app)');
    }
    
    logTest('Serverless Function Import', 'PASS', 'api/index.js imports successfully');
    return app;
  } catch (error) {
    logTest('Serverless Function Import', 'FAIL', error.message);
    throw error;
  }
}

// Test 2: Test middleware stack for undefined functions
async function testMiddlewareStack(app) {
  try {
    console.log('\n=== Test 2: Middleware Stack Validation ===');
    
    // Get the middleware stack
    const stack = app._router ? app._router.stack : [];
    
    let undefinedMiddleware = 0;
    let totalMiddleware = stack.length;
    
    stack.forEach((layer, index) => {
      if (!layer.handle || typeof layer.handle !== 'function') {
        undefinedMiddleware++;
        logTest(`Middleware Layer ${index}`, 'FAIL', 'Undefined or invalid middleware function');
      }
    });
    
    if (undefinedMiddleware === 0) {
      logTest('Middleware Stack Validation', 'PASS', `${totalMiddleware} middleware functions all valid`);
    } else {
      logTest('Middleware Stack Validation', 'FAIL', `${undefinedMiddleware}/${totalMiddleware} middleware functions are undefined`);
    }
    
    return undefinedMiddleware === 0;
  } catch (error) {
    logTest('Middleware Stack Validation', 'FAIL', error.message);
    return false;
  }
}

// Test 3: Test health endpoint
async function testHealthEndpoint(app) {
  try {
    console.log('\n=== Test 3: Health Endpoint Testing ===');
    
    const routes = ['/health', '/api/health'];
    
    for (const route of routes) {
      const response = await request(app)
        .get(route)
        .expect(200);
      
      if (response.body.success !== true) {
        throw new Error(`Health check failed for ${route}: success is not true`);
      }
      
      if (response.body.environment !== 'Vercel') {
        logTest(`Health Endpoint ${route}`, 'WARN', 'Environment not set to Vercel');
      } else {
        logTest(`Health Endpoint ${route}`, 'PASS', 'Health check successful');
      }
    }
    
    return true;
  } catch (error) {
    logTest('Health Endpoint Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 4: Test info endpoint
async function testInfoEndpoint(app) {
  try {
    console.log('\n=== Test 4: Info Endpoint Testing ===');
    
    const routes = ['/info', '/api/info'];
    
    for (const route of routes) {
      const response = await request(app)
        .get(route)
        .expect(200);
      
      if (!response.body.success || !response.body.data) {
        throw new Error(`Info endpoint failed for ${route}: missing success or data`);
      }
      
      if (response.body.data.environment !== 'Vercel Serverless') {
        logTest(`Info Endpoint ${route}`, 'WARN', 'Environment not set to Vercel Serverless');
      } else {
        logTest(`Info Endpoint ${route}`, 'PASS', 'Info endpoint successful');
      }
    }
    
    return true;
  } catch (error) {
    logTest('Info Endpoint Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 5: Test convert endpoint with valid data
async function testConvertEndpoint(app, testImage) {
  try {
    console.log('\n=== Test 5: Convert Endpoint Testing ===');
    
    const routes = ['/convert', '/api/convert'];
    
    for (const route of routes) {
      // Test with valid data
      const response = await request(app)
        .post(route)
        .send({
          imageData: testImage,
          shades: 10,
          format: 'json'
        })
        .expect(200);
      
      if (!response.body.success) {
        throw new Error(`Convert failed for ${route}: ${JSON.stringify(response.body.error)}`);
      }
      
      if (!response.body.data || !response.body.data.pixelMap) {
        throw new Error(`Convert failed for ${route}: missing pixel map data`);
      }
      
      logTest(`Convert Endpoint ${route}`, 'PASS', `Successfully converted image to ${response.body.data.pixelMap.length} pixel rows`);
    }
    
    return true;
  } catch (error) {
    logTest('Convert Endpoint Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 6: Test convert endpoint error handling
async function testConvertErrorHandling(app) {
  try {
    console.log('\n=== Test 6: Convert Error Handling Testing ===');
    
    // Test missing image data
    let response = await request(app)
      .post('/api/convert')
      .send({
        shades: 10,
        format: 'json'
      })
      .expect(400);
    
    if (response.body.error.code !== 'MISSING_IMAGE_DATA') {
      throw new Error('Missing image data error not handled correctly');
    }
    logTest('Missing Image Data Error', 'PASS', 'Correctly handled missing image data');
    
    // Test invalid shades
    response = await request(app)
      .post('/api/convert')
      .send({
        imageData: TEST_CONFIG.BASE64_TEST_IMAGE,
        shades: 15,
        format: 'json'
      })
      .expect(400);
    
    if (response.body.error.code !== 'INVALID_SHADES') {
      throw new Error('Invalid shades error not handled correctly');
    }
    logTest('Invalid Shades Error', 'PASS', 'Correctly handled invalid shades');
    
    // Test invalid format
    response = await request(app)
      .post('/api/convert')
      .send({
        imageData: TEST_CONFIG.BASE64_TEST_IMAGE,
        shades: 10,
        format: 'invalid'
      })
      .expect(400);
    
    if (response.body.error.code !== 'INVALID_FORMAT') {
      throw new Error('Invalid format error not handled correctly');
    }
    logTest('Invalid Format Error', 'PASS', 'Correctly handled invalid format');
    
    return true;
  } catch (error) {
    logTest('Convert Error Handling Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 7: Test CSV format output
async function testCSVFormat(app, testImage) {
  try {
    console.log('\n=== Test 7: CSV Format Testing ===');
    
    const response = await request(app)
      .post('/api/convert')
      .send({
        imageData: testImage,
        shades: 10,
        format: 'csv'
      })
      .expect(200);
    
    if (response.headers['content-type'] !== 'text/csv; charset=utf-8') {
      throw new Error('CSV content type not set correctly');
    }
    
    if (!response.headers['content-disposition'] || !response.headers['content-disposition'].includes('carte-pixels.csv')) {
      throw new Error('CSV filename not set correctly');
    }
    
    if (typeof response.text !== 'string' || response.text.length === 0) {
      throw new Error('CSV content is empty');
    }
    
    logTest('CSV Format Output', 'PASS', `Generated CSV with ${response.text.split('\n').length} lines`);
    return true;
  } catch (error) {
    logTest('CSV Format Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 8: Test enhanced logging functionality
async function testEnhancedLogging(app) {
  try {
    console.log('\n=== Test 8: Enhanced Logging Testing ===');
    
    // Capture console output
    const originalLog = console.log;
    const logMessages = [];
    
    console.log = (...args) => {
      logMessages.push(args.join(' '));
      originalLog(...args);
    };
    
    // Make a request to trigger logging
    await request(app)
      .get('/api/health')
      .expect(200);
    
    // Restore console.log
    console.log = originalLog;
    
    // Check for Vercel-specific logging
    const vercelLogs = logMessages.filter(msg => msg.includes('[Vercel]'));
    
    if (vercelLogs.length === 0) {
      throw new Error('No [Vercel] prefixed log messages found');
    }
    
    logTest('Enhanced Logging', 'PASS', `Found ${vercelLogs.length} Vercel-specific log messages`);
    return true;
  } catch (error) {
    logTest('Enhanced Logging Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 9: Test catch-all route
async function testCatchAllRoute(app) {
  try {
    console.log('\n=== Test 9: Catch-all Route Testing ===');
    
    const response = await request(app)
      .get('/nonexistent-route')
      .expect(404);
    
    if (!response.body.error || response.body.error !== 'Route not found') {
      throw new Error('Catch-all route not working correctly');
    }
    
    if (!response.body.debug) {
      throw new Error('Debug information not included in catch-all response');
    }
    
    logTest('Catch-all Route', 'PASS', 'Correctly handles non-existent routes');
    return true;
  } catch (error) {
    logTest('Catch-all Route Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 10: Test CORS headers
async function testCORSHeaders(app) {
  try {
    console.log('\n=== Test 10: CORS Headers Testing ===');
    
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    const requiredHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    for (const header of requiredHeaders) {
      if (!response.headers[header]) {
        throw new Error(`Missing CORS header: ${header}`);
      }
    }
    
    // Test OPTIONS request
    const optionsResponse = await request(app)
      .options('/api/convert')
      .expect(200);
    
    logTest('CORS Headers', 'PASS', 'All CORS headers present and OPTIONS handled');
    return true;
  } catch (error) {
    logTest('CORS Headers Testing', 'FAIL', error.message);
    return false;
  }
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Verification Test Suite');
  console.log('='.repeat(60));
  
  let app;
  
  try {
    // Load test image
    TEST_CONFIG.BASE64_TEST_IMAGE = loadTestImage();
    
    // Test 1: Import serverless function
    app = await testServerlessFunctionImport();
    
    // Test 2: Validate middleware stack
    await testMiddlewareStack(app);
    
    // Test 3: Health endpoint
    await testHealthEndpoint(app);
    
    // Test 4: Info endpoint
    await testInfoEndpoint(app);
    
    // Test 5: Convert endpoint with valid data
    await testConvertEndpoint(app, TEST_CONFIG.BASE64_TEST_IMAGE);
    
    // Test 6: Convert error handling
    await testConvertErrorHandling(app);
    
    // Test 7: CSV format
    await testCSVFormat(app, TEST_CONFIG.BASE64_TEST_IMAGE);
    
    // Test 8: Enhanced logging
    await testEnhancedLogging(app);
    
    // Test 9: Catch-all route
    await testCatchAllRoute(app);
    
    // Test 10: CORS headers
    await testCORSHeaders(app);
    
  } catch (error) {
    console.error('\n💥 Critical test failure:', error.message);
    testResults.failed++;
  }
  
  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed + testResults.warnings}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The Vercel fixes are working correctly.');
    console.log('✅ Ready for deployment to Vercel');
  } else {
    console.log('\n⚠️  Some tests failed. Review the failures above.');
    console.log('❌ Fix issues before deploying to Vercel');
  }
  
  // Save detailed results
  const reportPath = path.join(__dirname, 'verification-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      total: testResults.passed + testResults.failed + testResults.warnings
    },
    details: testResults.details,
    verdict: testResults.failed === 0 ? 'READY_FOR_DEPLOYMENT' : 'NEEDS_FIXES'
  }, null, 2));
  
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  testResults
};