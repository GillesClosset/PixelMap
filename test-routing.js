const express = require('express');
const { spawn } = require('child_process');
const fetch = require('node-fetch');

// Function to test routing in local environment
async function testLocalRouting() {
  console.log('Testing local routing...');
  
  // Start the server
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: '3001' }
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('Local /api/health response:', healthData);
    
    // Test info endpoint
    const infoResponse = await fetch('http://localhost:3001/api/info');
    const infoData = await infoResponse.json();
    console.log('Local /api/info response:', infoData);
    
    console.log('Local routing test completed successfully');
    return true;
  } catch (error) {
    console.error('Local routing test failed:', error.message);
    return false;
  } finally {
    // Kill the server process
    serverProcess.kill();
  }
}

// Function to analyze server.js routing configuration
function analyzeRoutingConfiguration() {
  console.log('\n=== Routing Configuration Analysis ===');
  
  // Simulate the Vercel environment detection
  const isVercelEnv = !!process.env.VERCEL || !!process.env.NOW_REGION;
  console.log('Running in Vercel environment:', isVercelEnv);
  
  // Show what the routing would be in each environment
  if (isVercelEnv) {
    console.log('In Vercel environment, convertApi router is mounted at: /');
    console.log('Expected API endpoints: /convert, /health, /info');
  } else {
    console.log('In local environment, convertApi router is mounted at: /api');
    console.log('Expected API endpoints: /api/convert, /api/health, /api/info');
  }
  
  console.log('\n=== Vercel.json Rewrites ===');
  console.log('Rewrite rule: /api/(.*) -> /api/index');
  console.log('This means Vercel routes /api/* requests to the Express app');
  console.log('But the Express app needs to handle the /api prefix when running on Vercel');
}

// Run the analysis
analyzeRoutingConfiguration();

// Run local routing test (this would be run separately in a real test)
console.log('\nTo test local routing, run: node test-routing.js');