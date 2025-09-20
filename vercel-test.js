/**
 * Minimal Vercel serverless function test
 * This will help identify the exact compatibility issue
 */

// Test 1: Absolute minimal serverless function
exports.minimal = (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Minimal function works',
    method: req.method,
    url: req.url 
  });
};

// Test 2: Basic Express app (Vercel pattern)
const express = require('express');
const app = express();

app.use(express.json());

app.get('/test2', (req, res) => {
  res.json({ success: true, message: 'Basic Express works' });
});

exports.basic = app;

// Test 3: Our current approach (isolated)
const express3 = require('express');
const path = require('path');

const app3 = express3();
app3.use(express3.json({ limit: '10mb' }));

// Simple test route instead of our complex convert logic
app3.get('/api/simple', (req, res) => {
  res.json({ success: true, message: 'Simple API works' });
});

app3.post('/api/simple', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Simple POST works',
    bodyReceived: !!req.body
  });
});

exports.current = app3;

// Test 4: Handler wrapper approach (recommended for Vercel)
const express4 = require('express');
const serverlessExpress = require('@vendia/serverless-express');

const app4 = express4();
app4.use(express4.json({ limit: '10mb' }));

app4.get('/api/wrapped', (req, res) => {
  res.json({ success: true, message: 'Wrapped function works' });
});

// Note: This requires installing @vendia/serverless-express
// exports.wrapped = serverlessExpress({ app: app4 });

// Test 5: Direct handler approach without Express layers
exports.direct = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method === 'GET' && req.url === '/api/health') {
      return res.status(200).json({
        success: true,
        message: 'Direct handler health check',
        timestamp: new Date().toISOString()
      });
    }
    
    if (req.method === 'POST' && req.url === '/api/convert') {
      // Basic convert simulation without full processing
      const body = req.body || {};
      return res.status(200).json({
        success: true,
        message: 'Direct handler convert simulation',
        receivedData: {
          hasImageData: !!body.imageData,
          shades: body.shades || 10,
          format: body.format || 'json'
        }
      });
    }
    
    return res.status(404).json({
      success: false,
      error: 'Route not found in direct handler'
    });
    
  } catch (error) {
    console.error('Direct handler error:', error);
    return res.status(500).json({
      success: false,
      error: `Direct handler error: ${error.message}`
    });
  }
};