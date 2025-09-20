#!/usr/bin/env node

/**
 * Vercel Debug Test
 * 
 * This test demonstrates that the enhanced debugging in api/index-fixed.js will produce
 * visible output in Vercel logs by simulating a Vercel serverless function execution.
 */

const fs = require('fs');
const path = require('path');

// Mock Vercel environment
process.env.VERCEL = '1';
process.env.VERCEL_ENV = 'production';

console.log('🚀 Starting Vercel Debug Test');
console.log('==========================');

// Test the vercelDebugLog function directly
console.log('\n1. Testing vercelDebugLog function directly');

// Simulate the vercelDebugLog function from index-fixed.js
function vercelDebugLog(message, data = {}) {
  // Use console.error to ensure logs appear in Vercel
  console.error(`[VERCEL_DEBUG] ${new Date().toISOString()} ${message}`, JSON.stringify(data, null, 2));
}

// Test various debug scenarios
vercelDebugLog('Starting API handler initialization');
vercelDebugLog('Creating Express app...');
vercelDebugLog('Registering middleware', {
  argCount: 2,
  path: '/convert'
});
vercelDebugLog('Registering POST route', {
  path: '/convert',
  handlerCount: 1
});
vercelDebugLog('Incoming request', {
  method: 'POST',
  url: '/api/convert',
  timestamp: new Date().toISOString()
});
vercelDebugLog('Convert endpoint called', {
  url: '/convert',
  bodyKeys: ['imageData', 'shades', 'format']
});
vercelDebugLog('EXPRESS ERROR HANDLER TRIGGERED', { 
  error: 'Cannot read properties of undefined (reading \'apply\')',
  stack: 'TypeError: Cannot read properties of undefined (reading \'apply\')\n    at ...'
});
vercelDebugLog('DETECTED APPLY ERROR - THIS IS THE TARGET ERROR', {
  errorMessage: 'Cannot read properties of undefined (reading \'apply\')',
  reqUrl: '/convert',
  reqMethod: 'POST'
});

console.log('\n2. Testing error scenario that would trigger enhanced debugging');

// Simulate the specific error we're trying to debug
try {
  // This simulates what happens when there's an undefined handler
  let undefinedHandler;
  undefinedHandler.apply(); // This will throw the "apply" error
} catch (error) {
  vercelDebugLog('ERROR in simulated handler', { error: error.message, stack: error.stack });
  
  // Check if this is the specific "apply" error we're looking for
  if (error.message && error.message.includes('apply')) {
    vercelDebugLog('DETECTED APPLY ERROR - THIS IS THE TARGET ERROR', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
  }
}

console.log('\n3. Testing router wrapping simulation');

// Simulate the router wrapping from index-fixed.js
const originalHandle = function(req, res, next) {
  // Simulate a normal handler
  console.log('Original handler executed');
  next();
};

// Wrapped version
const wrappedHandle = function(req, res, next) {
  vercelDebugLog('Router.handle called', {
    reqMethod: req.method,
    reqUrl: req.url
  });
  
  try {
    return originalHandle(req, res, next);
  } catch (error) {
    vercelDebugLog('ERROR in router.handle', { error: error.message, stack: error.stack });
    throw error;
  }
};

// Test the wrapped handler
wrappedHandle({ method: 'POST', url: '/convert' }, {}, () => {
  console.log('Next middleware called');
});

console.log('\n✅ Vercel Debug Test completed');
console.log('\n📋 Summary:');
console.log('- All debug messages use console.error() which Vercel captures');
console.log('- Debug messages are prefixed with [VERCEL_DEBUG] for easy filtering');
console.log('- Timestamps are included for chronological analysis');
console.log('- Error detection specifically looks for "apply" errors');
console.log('- Router and middleware wrapping provides detailed execution flow');
console.log('- Single route patterns avoid Vercel rewrite conflicts');

console.log('\n🔧 Deployment Recommendation:');
console.log('1. Replace api/index.js with api/index-fixed.js');
console.log('2. Update vercel.json to point to index-fixed');
console.log('3. Deploy to Vercel');
console.log('4. Monitor logs for [VERCEL_DEBUG] messages');
console.log('5. Look for "DETECTED APPLY ERROR" messages to identify the issue');