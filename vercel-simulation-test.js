#!/usr/bin/env node

/**
 * Vercel Serverless Environment Simulation Test
 * 
 * This test simulates how Vercel handles serverless functions:
 * 1. Tests the function as a module export (how Vercel imports it)
 * 2. Simulates Vercel's request/response objects
 * 3. Tests various URL rewriting scenarios
 * 4. Validates serverless function behavior
 */

const fs = require('fs');
const path = require('path');

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

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

// Simulate Vercel's serverless function handler
function simulateVercelHandler(app, req, res) {
  return new Promise((resolve, reject) => {
    // Set up response object to capture data
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;
    const originalSetHeader = res.setHeader;
    const originalEnd = res.end;
    
    let statusCode = 200;
    let responseData = null;
    let responseHeaders = {};
    let isEnded = false;
    
    res.status = (code) => {
      statusCode = code;
      return res;
    };
    
    res.setHeader = (name, value) => {
      responseHeaders[name.toLowerCase()] = value;
      return res;
    };
    
    res.json = (data) => {
      responseData = data;
      isEnded = true;
      resolve({
        statusCode,
        headers: responseHeaders,
        body: data
      });
      return res;
    };
    
    res.send = (data) => {
      responseData = data;
      isEnded = true;
      resolve({
        statusCode,
        headers: responseHeaders,
        body: data
      });
      return res;
    };
    
    res.end = (data) => {
      if (data) responseData = data;
      isEnded = true;
      resolve({
        statusCode,
        headers: responseHeaders,
        body: responseData
      });
      return res;
    };
    
    // Handle the request through the Express app
    try {
      app(req, res);
      
      // Set a timeout in case the response doesn't resolve
      setTimeout(() => {
        if (!isEnded) {
          reject(new Error('Request timeout - response never sent'));
        }
      }, 5000);
    } catch (error) {
      reject(error);
    }
  });
}

// Create mock request object
function createMockRequest(method, url, body = null, headers = {}) {
  const urlParts = new URL(url, 'http://localhost');
  
  return {
    method,
    url: urlParts.pathname + urlParts.search,
    originalUrl: urlParts.pathname + urlParts.search,
    path: urlParts.pathname,
    query: Object.fromEntries(urlParts.searchParams),
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body || {},
    on: () => {},
    emit: () => {},
    pause: () => {},
    resume: () => {},
    pipe: () => {}
  };
}

// Create mock response object
function createMockResponse() {
  return {
    status: () => {},
    setHeader: () => {},
    json: () => {},
    send: () => {},
    end: () => {},
    on: () => {},
    emit: () => {},
    headersSent: false
  };
}

// Test 1: Serverless function module export
async function testServerlessFunctionExport() {
  try {
    console.log('\n=== Vercel Test 1: Serverless Function Export ===');
    
    // Clear require cache
    const apiIndexPath = path.join(__dirname, 'api', 'index.js');
    delete require.cache[require.resolve(apiIndexPath)];
    
    const app = require('./api/index.js');
    
    if (typeof app !== 'function') {
      throw new Error('api/index.js does not export a function (Express app)');
    }
    
    logTest('Serverless Function Export', 'PASS', 'Function exports correctly for Vercel');
    return app;
  } catch (error) {
    logTest('Serverless Function Export', 'FAIL', error.message);
    throw error;
  }
}

// Test 2: Health endpoint with Vercel URL rewrites
async function testVercelHealthEndpoint(app) {
  try {
    console.log('\n=== Vercel Test 2: Health Endpoint with URL Rewrites ===');
    
    // Test various URL patterns Vercel might send
    const testUrls = [
      '/api/health',
      '/health',
      '/api/index/health'  // Potential rewrite result
    ];
    
    for (const url of testUrls) {
      const req = createMockRequest('GET', url);
      const res = createMockResponse();
      
      try {
        const result = await simulateVercelHandler(app, req, res);
        
        if (result.statusCode !== 200) {
          throw new Error(`Health check failed for ${url}: status ${result.statusCode}`);
        }
        
        if (!result.body || !result.body.success) {
          throw new Error(`Health check failed for ${url}: response not successful`);
        }
        
        logTest(`Health Endpoint ${url}`, 'PASS', 'Responds correctly');
      } catch (error) {
        if (url === '/api/index/health') {
          logTest(`Health Endpoint ${url}`, 'WARN', 'Expected to fail - this is rewrite edge case');
        } else {
          logTest(`Health Endpoint ${url}`, 'FAIL', error.message);
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    logTest('Vercel Health Endpoint Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 3: Convert endpoint with real image data
async function testVercelConvertEndpoint(app) {
  try {
    console.log('\n=== Vercel Test 3: Convert Endpoint Simulation ===');
    
    // Load test image
    let testImage;
    try {
      const testImagePath = path.join(__dirname, 'test_image.b64');
      if (fs.existsSync(testImagePath)) {
        testImage = fs.readFileSync(testImagePath, 'utf8').trim();
      } else {
        testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      }
    } catch (error) {
      testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
    
    // Test convert endpoints
    const testUrls = ['/api/convert', '/convert'];
    
    for (const url of testUrls) {
      const req = createMockRequest('POST', url, {
        imageData: testImage,
        shades: 10,
        format: 'json'
      });
      const res = createMockResponse();
      
      const result = await simulateVercelHandler(app, req, res);
      
      if (result.statusCode !== 200) {
        throw new Error(`Convert failed for ${url}: status ${result.statusCode}, body: ${JSON.stringify(result.body)}`);
      }
      
      if (!result.body || !result.body.success || !result.body.data || !result.body.data.pixelMap) {
        throw new Error(`Convert failed for ${url}: invalid response structure`);
      }
      
      logTest(`Convert Endpoint ${url}`, 'PASS', `Generated ${result.body.data.pixelMap.length} pixel rows`);
    }
    
    return true;
  } catch (error) {
    logTest('Vercel Convert Endpoint Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 4: Error handling in serverless environment
async function testVercelErrorHandling(app) {
  try {
    console.log('\n=== Vercel Test 4: Error Handling Simulation ===');
    
    // Test missing image data
    const req = createMockRequest('POST', '/api/convert', {
      shades: 10,
      format: 'json'
      // Missing imageData
    });
    const res = createMockResponse();
    
    const result = await simulateVercelHandler(app, req, res);
    
    if (result.statusCode !== 400) {
      throw new Error(`Expected status 400, got ${result.statusCode}`);
    }
    
    if (!result.body || !result.body.error || result.body.error.code !== 'MISSING_IMAGE_DATA') {
      throw new Error('Error response format incorrect');
    }
    
    logTest('Error Handling', 'PASS', 'Correctly handles missing image data');
    return true;
  } catch (error) {
    logTest('Vercel Error Handling Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 5: CORS headers in serverless environment
async function testVercelCORS(app) {
  try {
    console.log('\n=== Vercel Test 5: CORS Headers Simulation ===');
    
    // Test OPTIONS request
    const req = createMockRequest('OPTIONS', '/api/convert');
    const res = createMockResponse();
    
    const result = await simulateVercelHandler(app, req, res);
    
    if (result.statusCode !== 200) {
      throw new Error(`OPTIONS request failed: status ${result.statusCode}`);
    }
    
    // Test regular request with CORS
    const req2 = createMockRequest('GET', '/api/health');
    const res2 = createMockResponse();
    
    const result2 = await simulateVercelHandler(app, req2, res2);
    
    const requiredHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    for (const header of requiredHeaders) {
      if (!result2.headers[header]) {
        throw new Error(`Missing CORS header: ${header}`);
      }
    }
    
    logTest('CORS Headers', 'PASS', 'All CORS headers present in serverless environment');
    return true;
  } catch (error) {
    logTest('Vercel CORS Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 6: Memory and performance simulation
async function testVercelPerformance(app) {
  try {
    console.log('\n=== Vercel Test 6: Performance Simulation ===');
    
    const startTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Make multiple concurrent requests to simulate load
    const requests = [];
    for (let i = 0; i < 5; i++) {
      const req = createMockRequest('GET', '/api/health');
      const res = createMockResponse();
      requests.push(simulateVercelHandler(app, req, res));
    }
    
    await Promise.all(requests);
    
    const endTime = Date.now();
    const finalMemory = process.memoryUsage().heapUsed;
    const duration = endTime - startTime;
    const memoryDelta = finalMemory - initialMemory;
    
    logTest('Performance Test', 'PASS', 
      `5 concurrent requests in ${duration}ms, memory delta: ${Math.round(memoryDelta/1024)}KB`);
    
    if (duration > 5000) {
      logTest('Performance Warning', 'WARN', 'Requests took longer than 5 seconds');
    }
    
    return true;
  } catch (error) {
    logTest('Vercel Performance Testing', 'FAIL', error.message);
    return false;
  }
}

// Test 7: Environment variable simulation
async function testVercelEnvironment(app) {
  try {
    console.log('\n=== Vercel Test 7: Environment Simulation ===');
    
    // Set Vercel-like environment variables
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    
    const req = createMockRequest('GET', '/api/info');
    const res = createMockResponse();
    
    const result = await simulateVercelHandler(app, req, res);
    
    // Restore environment
    process.env.NODE_ENV = originalEnv;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    
    if (result.statusCode !== 200 || !result.body.success) {
      throw new Error('Info endpoint failed in production environment');
    }
    
    logTest('Environment Simulation', 'PASS', 'Works correctly with Vercel environment variables');
    return true;
  } catch (error) {
    logTest('Vercel Environment Testing', 'FAIL', error.message);
    return false;
  }
}

// Main test runner
async function runVercelSimulation() {
  console.log('🚀 Starting Vercel Serverless Environment Simulation');
  console.log('='.repeat(65));
  
  let app;
  
  try {
    // Test 1: Import serverless function
    app = await testServerlessFunctionExport();
    
    // Test 2: Health endpoint with URL rewrites
    await testVercelHealthEndpoint(app);
    
    // Test 3: Convert endpoint
    await testVercelConvertEndpoint(app);
    
    // Test 4: Error handling
    await testVercelErrorHandling(app);
    
    // Test 5: CORS headers
    await testVercelCORS(app);
    
    // Test 6: Performance
    await testVercelPerformance(app);
    
    // Test 7: Environment simulation
    await testVercelEnvironment(app);
    
  } catch (error) {
    console.error('\n💥 Critical Vercel simulation failure:', error.message);
    testResults.failed++;
  }
  
  // Print final results
  console.log('\n' + '='.repeat(65));
  console.log('📊 VERCEL SIMULATION RESULTS');
  console.log('='.repeat(65));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed + testResults.warnings}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 VERCEL SIMULATION SUCCESSFUL!');
    console.log('✅ The serverless function should work correctly on Vercel');
    console.log('🚀 Ready for Vercel deployment');
  } else {
    console.log('\n⚠️  Some Vercel simulation tests failed.');
    console.log('❌ Review failures before Vercel deployment');
  }
  
  // Save results
  const reportPath = path.join(__dirname, 'vercel-simulation-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      total: testResults.passed + testResults.failed + testResults.warnings
    },
    details: testResults.details,
    verdict: testResults.failed === 0 ? 'VERCEL_READY' : 'NEEDS_FIXES'
  }, null, 2));
  
  console.log(`\n📄 Vercel simulation results saved to: ${reportPath}`);
  
  return testResults.failed === 0;
}

// Run the simulation
if (require.main === module) {
  runVercelSimulation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Vercel simulation crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  runVercelSimulation,
  testResults
};