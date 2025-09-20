/**
 * Vercel serverless function handler with debugging for 'apply' error
 * 
 * Adding detailed logging to identify the undefined handler causing:
 * "TypeError: Cannot read properties of undefined (reading 'apply')"
 */

const express = require('express');
const { Jimp } = require('jimp');
const { convertToPixelMap, pixelMapToCSV, validatePixelMap, pixelMapToText } = require('../utils/imageProcessor');

// Debug logging function
function debugLog(message, data = {}) {
  console.log(`[DEBUG] ${new Date().toISOString()} ${message}`, JSON.stringify(data, null, 2));
}

debugLog('Starting API handler initialization');

// Enhanced debugging for route registration
function debugRouteRegistration(method, path, handlers) {
  debugLog(`Registering route`, {
    method,
    path,
    handlerCount: handlers.length,
    handlerTypes: handlers.map((h, i) => `handler[${i}]: ${typeof h}`),
    hasUndefinedHandler: handlers.some(h => h === undefined),
    hasNullHandler: handlers.some(h => h === null)
  });
  
  // Check each handler
  handlers.forEach((handler, index) => {
    if (handler === undefined) {
      debugLog(`ERROR: Handler ${index} is undefined for ${method} ${path}`);
    } else if (handler === null) {
      debugLog(`ERROR: Handler ${index} is null for ${method} ${path}`);
    } else if (typeof handler !== 'function') {
      debugLog(`WARNING: Handler ${index} is not a function for ${method} ${path}`, {
        type: typeof handler,
        value: handler
      });
    }
  });
  
  return handlers;
}

// Create Express app for Vercel with debugging
debugLog('Creating Express app...');
const app = express();

// Debug middleware registration
const originalUse = app.use;
app.use = function(...args) {
  debugLog('Registering middleware', {
    argCount: args.length,
    argTypes: args.map((arg, i) => `arg[${i}]: ${typeof arg}`),
    hasUndefinedArg: args.some(arg => arg === undefined),
    hasNullArg: args.some(arg => arg === null),
    path: typeof args[0] === 'string' ? args[0] : 'no-path'
  });
  
  // Check for undefined args
  args.forEach((arg, index) => {
    if (arg === undefined) {
      debugLog(`ERROR: Middleware arg ${index} is undefined`);
    } else if (arg === null) {
      debugLog(`ERROR: Middleware arg ${index} is null`);
    }
  });
  
  return originalUse.apply(this, args);
};

// Debug route method registration
['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
  const originalMethod = app[method];
  app[method] = function(path, ...handlers) {
    // Debug the route registration
    debugRouteRegistration(method.toUpperCase(), path, handlers);
    return originalMethod.apply(this, [path, ...handlers]);
  };
});

// Basic middleware with error handling
try {
  debugLog('Adding JSON middleware...');
  app.use(express.json({ limit: '10mb' }));
  debugLog('JSON middleware added successfully');
} catch (error) {
  debugLog('ERROR adding JSON middleware', { error: error.message, stack: error.stack });
  throw error;
}

// CORS middleware with debugging
app.use((req, res, next) => {
  debugLog('CORS middleware executing', {
    method: req.method,
    url: req.url
  });
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      debugLog('Handling OPTIONS request');
      return res.status(200).end();
    }
    next();
  } catch (error) {
    debugLog('ERROR in CORS middleware', { error: error.message, stack: error.stack });
    next(error);
  }
});

// Base64 to ImageData conversion
async function base64ToImageData(base64Data, width, height) {
  try {
    debugLog('base64ToImageData called', { width, height, base64DataLength: base64Data ? base64Data.length : 0 });
    
    if (!base64Data) {
      throw new Error('Base64 data is required');
    }
    
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    if (base64Image.length === 0) {
      throw new Error('Invalid base64 image data');
    }
    
    debugLog('Loading image with Jimp...');
    const buffer = Buffer.from(base64Image, 'base64');
    const image = await Jimp.read(buffer);
    debugLog('Image loaded successfully', { width: image.bitmap.width, height: image.bitmap.height });
    
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid dimensions provided');
    }
    
    debugLog('Resizing image...');
    image.resize({ w: width, h: height });
    
    const imageData = {
      width: image.bitmap.width,
      height: image.bitmap.height,
      data: image.bitmap.data
    };
    
    debugLog('base64ToImageData completed successfully');
    return imageData;
  } catch (error) {
    debugLog('ERROR in base64ToImageData', { error: error.message, stack: error.stack });
    throw new Error(`Failed to process image data: ${error.message}`);
  }
}

// Health check - single pattern
debugLog('Defining health check route...');
const healthHandler = (req, res) => {
  debugLog('Health check endpoint called');
  res.status(200).json({
    success: true,
    message: 'Service en ligne',
    timestamp: new Date().toISOString(),
    environment: 'Vercel Serverless',
    version: 'debug'
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Convert endpoint - single pattern
debugLog('Defining convert route...');
const convertHandler = async (req, res) => {
  try {
    debugLog('Convert endpoint called', {
      url: req.url,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      hasImageData: !!(req.body && req.body.imageData)
    });
    
    const { imageData, shades = 10, format = 'json' } = req.body;
    
    // Validate input
    if (!imageData) {
      debugLog('Missing image data');
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGE_DATA',
          message: 'Les données de l\'image sont requises'
        }
      });
    }
    
    // Validate shades parameter
    const shadeCount = parseInt(shades);
    if (isNaN(shadeCount) || shadeCount < 9 || shadeCount > 12) {
      debugLog('Invalid shades parameter', { shades, shadeCount });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SHADES',
          message: 'Le nombre de nuances doit être entre 9 et 12'
        }
      });
    }
    
    // Validate format parameter
    if (!['json', 'csv'].includes(format)) {
      debugLog('Invalid format parameter', { format });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Le format doit être "json" ou "csv"'
        }
      });
    }
    
    // Process the image
    const targetWidth = 50;
    const targetHeight = 70;
    
    debugLog('Starting image processing...');
    const originalImageData = await base64ToImageData(imageData, targetWidth, targetHeight);
    debugLog('Image data processed successfully');
    
    debugLog('Starting pixel map conversion...');
    const { pixelMap, greyscaleImageData } = convertToPixelMap(
      originalImageData,
      targetWidth,
      targetHeight
    );
    debugLog('Pixel map conversion completed');
    
    // Validate the generated pixel map
    if (!validatePixelMap(pixelMap, targetWidth, targetHeight)) {
      debugLog('Invalid pixel map generated');
      return res.status(500).json({
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'La carte de pixels générée est invalide'
        }
      });
    }
    
    debugLog('Processing completed successfully');
    
    // Return response based on format
    if (format === 'csv') {
      const csvContent = pixelMapToCSV(pixelMap);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="carte-pixels.csv"');
      return res.status(200).send(csvContent);
    } else {
      return res.status(200).json({
        success: true,
        data: {
          pixelMap: pixelMap,
          dimensions: {
            width: targetWidth,
            height: targetHeight
          },
          shades: shadeCount,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    debugLog('ERROR in convert endpoint', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Une erreur s\'est produite lors du traitement de l\'image: ' + error.message
      }
    });
  }
};

app.post('/convert', convertHandler);
app.post('/api/convert', convertHandler);

// Catch-all for 404 with debugging
debugLog('Defining catch-all route...');
app.use('*', (req, res) => {
  debugLog('Catch-all route hit', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    available: ['GET /health', 'POST /convert', 'GET /api/health', 'POST /api/convert']
  });
});

// Error handler with debugging
debugLog('Defining error handler...');
app.use((error, req, res, next) => {
  debugLog('EXPRESS ERROR HANDLER TRIGGERED', { 
    error: error.message, 
    stack: error.stack,
    url: req ? req.url : 'unknown',
    method: req ? req.method : 'unknown'
  });
  
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

debugLog('API handler initialization completed');

// Export for Vercel serverless
module.exports = app;