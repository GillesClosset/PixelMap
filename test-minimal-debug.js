#!/usr/bin/env node

/**
 * Minimal Debug Test for Vercel Logs
 * 
 * This test creates the most basic debugging statements that will definitely appear in Vercel logs
 */

// Use console.error to ensure logs appear in Vercel
console.error('[VERCEL_DEBUG] MINIMAL TEST: Starting execution');
console.error('[VERCEL_DEBUG] MINIMAL TEST: This should definitely appear in Vercel logs');

// Simulate a simple function with debug output
function testFunction() {
  console.error('[VERCEL_DEBUG] MINIMAL TEST: Inside test function');
  return "test result";
}

const result = testFunction();
console.error('[VERCEL_DEBUG] MINIMAL TEST: Function result:', result);

// Simulate the specific error we're debugging
try {
  console.error('[VERCEL_DEBUG] MINIMAL TEST: About to simulate apply error');
  let undefinedHandler;
  undefinedHandler.apply(); // This will throw the "apply" error
} catch (error) {
  console.error('[VERCEL_DEBUG] MINIMAL TEST: Caught apply error:', error.message);
}

console.error('[VERCEL_DEBUG] MINIMAL TEST: Execution completed');