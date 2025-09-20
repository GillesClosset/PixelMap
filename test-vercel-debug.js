#!/usr/bin/env node

/**
 * Test Vercel Debug Output
 * 
 * This script simulates making a request to the Vercel API to see what debug output we get
 */

// Import required modules
const http = require('http');

// Simulate the vercelDebugLog function
function vercelDebugLog(message, data = {}) {
  console.error(`[VERCEL_DEBUG] ${new Date().toISOString()} ${message}`, JSON.stringify(data, null, 2));
}

console.log('🔍 Starting Vercel Debug Test');

// Test the debug logging at the beginning
vercelDebugLog('TEST: Starting test execution');

// Simulate importing modules
vercelDebugLog('TEST: Importing express module');
const express = require('express');

vercelDebugLog('TEST: Creating express app');
const app = express();

// Simulate middleware registration
vercelDebugLog('TEST: Registering JSON middleware');
app.use(express.json({ limit: '10mb' }));

// Simulate route registration
vercelDebugLog('TEST: Registering health check route');
app.get('/health', (req, res) => {
  vercelDebugLog('TEST: Health check endpoint called');
  res.status(200).json({ success: true });
});

vercelDebugLog('TEST: Registering convert route');
app.post('/convert', (req, res) => {
  vercelDebugLog('TEST: Convert endpoint called', {
    url: req.url,
    method: req.method
  });
  res.status(200).json({ success: true });
});

// Simulate an error scenario
vercelDebugLog('TEST: Simulating error scenario');
try {
  let undefinedHandler;
  undefinedHandler.apply(); // This will throw
} catch (error) {
  vercelDebugLog('TEST: Caught apply error', { 
    error: error.message,
    stack: error.stack
  });
  
  // Check specifically for the apply error we're debugging
  if (error.message.includes('apply')) {
    vercelDebugLog('TEST: DETECTED APPLY ERROR - TARGET ERROR FOUND', {
      errorMessage: error.message
    });
  }
}

vercelDebugLog('TEST: Test execution completed');

console.log('✅ Vercel Debug Test completed');
console.log('📋 Check the console.error output above for [VERCEL_DEBUG] messages');
console.log('📋 These messages should appear in Vercel logs when deployed');