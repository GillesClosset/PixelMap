/**
 * Simple script to verify routing works correctly in both local and Vercel environments
 * Usage: 
 *   node verify-routing.js          # Test local environment
 *   VERCEL=1 node verify-routing.js # Test Vercel-like environment
 */

const express = require('express');
const fetch = require('node-fetch');
const { spawn } = require('child_process');

async function testApiEndpoint(port, path) {
  try {
    const response = await fetch(`http://localhost:${port}${path}`);
    const data = await response.json();
    console.log(`✓ ${path} - Status: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    console.log(`✗ ${path} - Error: ${error.message}`);
    return false;
  }
}

async function verifyRouting() {
  // Determine if we're testing Vercel environment
  const isVercel = !!process.env.VERCEL;
  const port = isVercel ? 3005 : 3004;
  
  console.log(`Testing ${isVercel ? 'Vercel' : 'Local'} environment on port ${port}`);
  
  // Start the server
  const envVars = isVercel ? { ...process.env, PORT: port, VERCEL: '1' } : { ...process.env, PORT: port };
  const serverProcess = spawn('node', ['server.js'], {
    env: envVars,
    stdio: 'pipe'
  });
  
  // Capture server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data}`);
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Test API endpoints
    console.log('\nTesting API endpoints:');
    const healthOk = await testApiEndpoint(port, '/api/health');
    const infoOk = await testApiEndpoint(port, '/api/info');
    
    if (healthOk && infoOk) {
      console.log('\n✓ All API endpoints are working correctly!');
      console.log(`API endpoints are accessible at:`);
      console.log(`  - http://localhost:${port}/api/health`);
      console.log(`  - http://localhost:${port}/api/info`);
      console.log(`  - http://localhost:${port}/api/convert (POST)`);
    } else {
      console.log('\n✗ Some API endpoints are not working correctly.');
    }
    
    // Test root endpoint
    console.log('\nTesting root endpoint:');
    try {
      const rootResponse = await fetch(`http://localhost:${port}/`);
      console.log(`✓ Root endpoint - Status: ${rootResponse.status}`);
    } catch (error) {
      console.log(`✗ Root endpoint - Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  } finally {
    // Kill the server
    serverProcess.kill();
 }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyRouting();
}

module.exports = { verifyRouting };