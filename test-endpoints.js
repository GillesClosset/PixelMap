const express = require('express');
const fetch = require('node-fetch');
const { spawn } = require('child_process');

// Function to test endpoints
async function testEndpoints(port) {
  const baseUrl = `http://localhost:${port}`;
  
  try {
    console.log(`Testing endpoints at ${baseUrl}`);
    
    // Test root endpoint
    try {
      const rootResponse = await fetch(`${baseUrl}/`);
      console.log('Root endpoint status:', rootResponse.status);
    } catch (error) {
      console.log('Root endpoint error:', error.message);
    }
    
    // Test /api/health endpoint
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`);
      const healthData = await healthResponse.json();
      console.log('/api/health status:', healthResponse.status);
      console.log('/api/health data:', healthData);
    } catch (error) {
      console.log('/api/health error:', error.message);
    }
    
    // Test /health endpoint
    try {
      const healthResponse2 = await fetch(`${baseUrl}/health`);
      const healthData2 = await healthResponse2.json();
      console.log('/health status:', healthResponse2.status);
      console.log('/health data:', healthData2);
    } catch (error) {
      console.log('/health error:', error.message);
    }
    
    // Test /api/info endpoint
    try {
      const infoResponse = await fetch(`${baseUrl}/api/info`);
      const infoData = await infoResponse.json();
      console.log('/api/info status:', infoResponse.status);
      console.log('/api/info data:', infoData);
    } catch (error) {
      console.log('/api/info error:', error.message);
    }
    
    // Test /info endpoint
    try {
      const infoResponse2 = await fetch(`${baseUrl}/info`);
      const infoData2 = await infoResponse2.json();
      console.log('/info status:', infoResponse2.status);
      console.log('/info data:', infoData2);
    } catch (error) {
      console.log('/info error:', error.message);
    }
    
    console.log('Endpoint testing completed\n');
  } catch (error) {
    console.error('Error during endpoint testing:', error.message);
  }
}

// Function to test local development server
async function testLocalServer() {
  console.log('=== Testing Local Development Server ===');
  
  // Start server on port 3002
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: '3002' },
    stdio: 'inherit'
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test endpoints
  await testEndpoints(3002);
  
  // Kill the server
  serverProcess.kill();
}

// Function to test Vercel-like environment
async function testVercelEnvironment() {
  console.log('=== Testing Vercel-like Environment ===');
  
  // Start server with Vercel environment variables
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: '3003', VERCEL: '1' },
    stdio: 'inherit'
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test endpoints
  await testEndpoints(3003);
  
  // Kill the server
  serverProcess.kill();
}

// Run tests
async function runTests() {
  try {
    await testLocalServer();
    await testVercelEnvironment();
  } catch (error) {
    console.error('Error during testing:', error.message);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testEndpoints, testLocalServer, testVercelEnvironment };