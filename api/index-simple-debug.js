/**
 * SIMPLE DEBUG Vercel serverless function handler
 * 
 * This is a minimal version with the most basic debugging that will definitely appear in Vercel logs
 */

// Enhanced debug logging function that will definitely appear in Vercel logs
function vercelDebugLog(message, data = {}) {
  // Use console.error to ensure logs appear in Vercel
  console.error(`[VERCEL_DEBUG] ${new Date().toISOString()} ${message}`, JSON.stringify(data, null, 2));
}

vercelDebugLog('SIMPLE DEBUG: Starting API handler initialization');

const express = require('express');
const app = express();

// Basic middleware with error handling
vercelDebugLog('SIMPLE DEBUG: Adding JSON middleware...');
app.use(express.json({ limit: '10mb' }));
vercelDebugLog('SIMPLE DEBUG: JSON middleware added successfully');

// CORS middleware
app.use((req, res, next) => {
  vercelDebugLog('SIMPLE DEBUG: CORS middleware executing');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
 if (req.method === 'OPTIONS') {
    vercelDebugLog('SIMPLE DEBUG: Handling OPTIONS request');
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
vercelDebugLog('SIMPLE DEBUG: Defining health check route...');
app.get('/health', (req, res) => {
  vercelDebugLog('SIMPLE DEBUG: Health check endpoint called');
  res.status(200).json({
    success: true,
    message: 'Service en ligne',
    timestamp: new Date().toISOString(),
    environment: 'Vercel Serverless',
    version: 'simple-debug'
  });
});

// Convert endpoint
vercelDebugLog('SIMPLE DEBUG: Defining convert route...');
app.post('/convert', async (req, res) => {
  try {
    vercelDebugLog('SIMPLE DEBUG: Convert endpoint called', {
      url: req.url,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      hasImageData: !!(req.body && req.body.imageData)
    });
    
    // Always return success for debugging purposes
    vercelDebugLog('SIMPLE DEBUG: Returning success response');
    return res.status(200).json({
      success: true,
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    vercelDebugLog('SIMPLE DEBUG: ERROR in convert endpoint', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Une erreur s\'est produite: ' + error.message
      }
    });
  }
});

// Catch-all for 404
vercelDebugLog('SIMPLE DEBUG: Defining catch-all route...');
app.use('*', (req, res) => {
  vercelDebugLog('SIMPLE DEBUG: Catch-all route hit', {
    method: req.method,
    url: req.url
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
vercelDebugLog('SIMPLE DEBUG: Defining error handler...');
app.use((error, req, res, next) => {
  vercelDebugLog('SIMPLE DEBUG: EXPRESS ERROR HANDLER TRIGGERED', { 
    error: error.message, 
    stack: error.stack,
    url: req ? req.url : 'unknown',
    method: req ? req.method : 'unknown'
  });
  
  // Additional debugging for the specific "apply" error
  if (error.message && error.message.includes('apply')) {
    vercelDebugLog('SIMPLE DEBUG: DETECTED APPLY ERROR - THIS IS THE TARGET ERROR', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
  }
  
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }
  });
});

vercelDebugLog('SIMPLE DEBUG: API handler initialization completed');

// Export for Vercel serverless
module.exports = app;