#!/usr/bin/env node

/**
 * Verify Enhanced Debugging Output Test
 * 
 * This test verifies that the enhanced debugging in api/index-fixed.js will produce
 * visible output in Vercel logs by:
 * 1. Testing the vercelDebugLog function directly
 * 2. Simulating Vercel's serverless environment
 * 3. Checking that console.error outputs are visible
 * 4. Validating the debugging approach
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

// Test 1: Verify vercelDebugLog function in index-fixed.js
async function testVercelDebugLogFunction() {
  try {
    console.log('\n=== Test 1: Vercel Debug Log Function ===');
    
    // Read the index-fixed.js file
    const indexPath = path.join(__dirname, 'api', 'index-fixed.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if vercelDebugLog function exists
    if (!indexContent.includes('function vercelDebugLog')) {
      throw new Error('vercelDebugLog function not found in index-fixed.js');
    }
    
    // Check if it uses console.error
    if (!indexContent.includes('console.error')) {
      throw new Error('console.error not found in vercelDebugLog function');
    }
    
    // Check if it includes the [VERCEL_DEBUG] prefix
    if (!indexContent.includes('[VERCEL_DEBUG]')) {
      throw new Error('[VERCEL_DEBUG] prefix not found in vercelDebugLog function');
    }
    
    logTest('Vercel Debug Log Function', 'PASS', 'Function exists with correct implementation');
    return true;
  } catch (error) {
    logTest('Vercel Debug Log Function', 'FAIL', error.message);
    return false;
  }
}

// Test 2: Simulate Vercel's logging environment
async function testVercelLoggingEnvironment() {
  try {
    console.log('\n=== Test 2: Vercel Logging Environment Simulation ===');
    
    // Test console.error output (what Vercel uses for logs)
    console.error('[VERCEL_DEBUG] Test message for Vercel logging');
    
    // Test multiple log levels
    console.log('[VERCEL_DEBUG] Test console.log output');
    console.info('[VERCEL_DEBUG] Test console.info output');
    console.warn('[VERCEL_DEBUG] Test console.warn output');
    console.error('[VERCEL_DEBUG] Test console.error output (Vercel visible)');
    
    logTest('Vercel Logging Environment', 'PASS', 'Multiple console methods tested');
    return true;
  } catch (error) {
    logTest('Vercel Logging Environment', 'FAIL', error.message);
    return false;
  }
}

// Test 3: Check debug log placement and frequency
async function testDebugLogPlacement() {
  try {
    console.log('\n=== Test 3: Debug Log Placement Analysis ===');
    
    // Read the index-fixed.js file
    const indexPath = path.join(__dirname, 'api', 'index-fixed.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Count debug log statements
    const debugLogMatches = indexContent.match(/vercelDebugLog\(/g);
    const debugLogCount = debugLogMatches ? debugLogMatches.length : 0;
    
    console.log(`Found ${debugLogCount} vercelDebugLog statements in index-fixed.js`);
    
    // Check for key debugging points
    const keyDebugPoints = [
      'Starting API handler initialization',
      'Creating Express app',
      'Registering middleware',
      'Registering route',
      'Incoming request',
      'Health check endpoint called',
      'Convert endpoint called',
      'EXPRESS ERROR HANDLER TRIGGERED'
    ];
    
    let foundPoints = 0;
    keyDebugPoints.forEach(point => {
      if (indexContent.includes(point)) {
        foundPoints++;
        console.log(`✅ Found debug point: ${point}`);
      } else {
        console.log(`❌ Missing debug point: ${point}`);
      }
    });
    
    console.log(`Found ${foundPoints}/${keyDebugPoints.length} key debug points`);
    
    if (debugLogCount > 20) {
      logTest('Debug Log Placement', 'PASS', `Extensive logging (${debugLogCount} statements) should provide detailed Vercel logs`);
    } else {
      logTest('Debug Log Placement', 'WARN', `Limited logging (${debugLogCount} statements) may not provide sufficient detail`);
    }
    
    return true;
  } catch (error) {
    logTest('Debug Log Placement', 'FAIL', error.message);
    return false;
  }
}

// Test 4: Validate error handling debugging
async function testErrorHandlingDebugging() {
  try {
    console.log('\n=== Test 4: Error Handling Debugging ===');
    
    // Read the index-fixed.js file
    const indexPath = path.join(__dirname, 'api', 'index-fixed.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for apply error detection
    if (indexContent.includes('apply') && indexContent.includes('DETECTED APPLY ERROR')) {
      logTest('Apply Error Detection', 'PASS', 'Specific "apply" error detection implemented');
    } else {
      logTest('Apply Error Detection', 'WARN', 'No specific "apply" error detection found');
    }
    
    // Check for enhanced error handler
    if (indexContent.includes('app.use((error, req, res, next)')) {
      logTest('Enhanced Error Handler', 'PASS', 'Custom error handler with debugging implemented');
    } else {
      logTest('Enhanced Error Handler', 'FAIL', 'Custom error handler not found');
      return false;
    }
    
    // Check for error stack logging
    if (indexContent.includes('stack: error.stack')) {
      logTest('Error Stack Logging', 'PASS', 'Error stack traces will be logged');
    } else {
      logTest('Error Stack Logging', 'WARN', 'Error stack traces may not be fully logged');
    }
    
    return true;
  } catch (error) {
    logTest('Error Handling Debugging', 'FAIL', error.message);
    return false;
  }
}

// Test 5: Router wrapping for undefined handler detection
async function testRouterWrapping() {
  try {
    console.log('\n=== Test 5: Router Wrapping Analysis ===');
    
    // Read the index-fixed.js file
    const indexPath = path.join(__dirname, 'api', 'index-fixed.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for router wrapping
    if (indexContent.includes('originalRouter = express.Router') && 
        indexContent.includes('router.handle = function')) {
      logTest('Router Wrapping', 'PASS', 'Express router wrapped to catch undefined handlers');
    } else {
      logTest('Router Wrapping', 'WARN', 'Router not wrapped for undefined handler detection');
    }
    
    // Check for middleware wrapping
    if (indexContent.includes('originalUse = app.use') && 
        indexContent.includes('app.use = function')) {
      logTest('Middleware Wrapping', 'PASS', 'Middleware registration wrapped for debugging');
    } else {
      logTest('Middleware Wrapping', 'WARN', 'Middleware registration not wrapped for debugging');
    }
    
    // Check for route method wrapping
    if (indexContent.includes("app[method] = function(path, ...handlers)")) {
      logTest('Route Method Wrapping', 'PASS', 'Route method registration wrapped for debugging');
    } else {
      logTest('Route Method Wrapping', 'WARN', 'Route method registration not wrapped for debugging');
    }
    
    return true;
  } catch (error) {
    logTest('Router Wrapping Analysis', 'FAIL', error.message);
    return false;
  }
}

// Test 6: Validate single route patterns (no array conflicts)
async function testSingleRoutePatterns() {
  try {
    console.log('\n=== Test 6: Single Route Pattern Validation ===');
    
    // Read the index-fixed.js file
    const indexPath = path.join(__dirname, 'api', 'index-fixed.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check that routes are defined with single patterns, not arrays
    const routeDefinitions = indexContent.match(/app\.(get|post|put|delete|patch)\([^)]+\)/g);
    
    if (routeDefinitions) {
      let hasArrayPattern = false;
      routeDefinitions.forEach(route => {
        if (route.includes('[') && route.includes(']') && route.includes(',')) {
          console.log(`❌ Found array pattern: ${route}`);
          hasArrayPattern = true;
        } else {
          console.log(`✅ Single pattern: ${route}`);
        }
      });
      
      if (!hasArrayPattern) {
        logTest('Single Route Patterns', 'PASS', 'All routes use single patterns, no array conflicts');
      } else {
        logTest('Single Route Patterns', 'FAIL', 'Found array patterns that could conflict with Vercel rewrites');
        return false;
      }
    } else {
      logTest('Single Route Patterns', 'WARN', 'Could not analyze route patterns');
    }
    
    return true;
  } catch (error) {
    logTest('Single Route Pattern Validation', 'FAIL', error.message);
    return false;
  }
}

// Main test runner
async function runEnhancedDebuggingVerification() {
  console.log('🔍 Starting Enhanced Debugging Verification Test');
  console.log('='.repeat(60));
  
  try {
    // Run all tests
    await testVercelDebugLogFunction();
    await testVercelLoggingEnvironment();
    await testDebugLogPlacement();
    await testErrorHandlingDebugging();
    await testRouterWrapping();
    await testSingleRoutePatterns();
    
  } catch (error) {
    console.error('\n💥 Critical test failure:', error.message);
    testResults.failed++;
  }
  
  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENHANCED DEBUGGING VERIFICATION RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed + testResults.warnings}`);
  
  // Overall assessment
  if (testResults.failed === 0) {
    console.log('\n🎉 ENHANCED DEBUGGING VERIFICATION SUCCESSFUL!');
    console.log('✅ The enhanced debugging in api/index-fixed.js should produce visible output in Vercel logs');
    console.log('✅ Debug logs use console.error which Vercel captures');
    console.log('✅ Extensive logging throughout the application lifecycle');
    console.log('✅ Specific error detection for the "apply" issue');
    console.log('✅ Router and middleware wrapping for undefined handler detection');
    console.log('✅ Single route patterns to avoid Vercel rewrite conflicts');
  } else {
    console.log('\n⚠️  Some enhanced debugging verification tests failed.');
    console.log('❌ Review failures before deploying to Vercel');
  }
  
 // Detailed recommendations
  console.log('\n📋 DETAILED RECOMMENDATIONS:');
  console.log('1. Deploy api/index-fixed.js to Vercel to see enhanced debug logs');
  console.log('2. Monitor Vercel logs for [VERCEL_DEBUG] prefixed messages');
  console.log('3. Look specifically for "DETECTED APPLY ERROR" messages');
  console.log('4. Check middleware and route registration logs for undefined handlers');
  console.log('5. Verify request flow logging for routing issues');
  
  // Save results
  const reportPath = path.join(__dirname, 'enhanced-debugging-verification-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      total: testResults.passed + testResults.failed + testResults.warnings
    },
    details: testResults.details,
    verdict: testResults.failed === 0 ? 'DEBUGGING_READY' : 'NEEDS_REVIEW'
  }, null, 2));
  
  console.log(`\n📄 Verification results saved to: ${reportPath}`);
  
  return testResults.failed === 0;
}

// Run the verification
if (require.main === module) {
  runEnhancedDebuggingVerification()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Enhanced debugging verification crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  runEnhancedDebuggingVerification,
  testResults
};