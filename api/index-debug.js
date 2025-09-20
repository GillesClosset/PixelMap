/**
 * Debug version of Vercel serverless function handler
 * Enhanced with detailed logging to identify the 'apply' error source
 */

const express = require('express');

// Debug logging function
function debugLog(message, data = {}) {
  console.log(`[DEBUG] ${message}`, JSON.stringify(data, null, 2));
}

debugLog('Starting API handler initialization');

try {
  // Test utility imports first
  debugLog('Testing utility imports...');
  const utils = require('../utils/imageProcessor');
  debugLog('Utility imports successful', {
    availableExports: Object.keys(utils),
    convertToPixelMapType: typeof utils.convertToPixelMap,
    pixelMapToCSVType: typeof utils.pixelMapToCSV,
    validatePixelMapType: typeof utils.validatePixelMap,
    pixelMapToTextType: typeof utils.pixelMapToText
  });
  
  const { convertToPixelMap, pixelMapToCSV, validatePixelMap, pixelMapToText } = utils;
  
  // Test Jimp import
  debugLog('Testing Jimp import...');
  const { Jimp } = require('jimp');
  debugLog('Jimp import successful', { JimpType: typeof Jimp });
  
} catch (error) {
  debugLog('ERROR during imports', { error: error.message, stack: error.stack });
  throw error;
}

// Create Express app with enhanced debugging
debugLog('Creating Express app...');
const app = express();

// Enhanced request logging middleware
app.use((req, res, next) => {
  debugLog('Incoming request', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  // Debug middleware chain
  debugLog('Middleware chain state', {
    nextType: typeof next,
    nextExists: !!next
  });
  
  try {
    next();
  } catch (error) {
    debugLog('ERROR in middleware next()', { error: error.message, stack: error.stack });
    throw error;
  }
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
  debugLog('CORS middleware executing');
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

// Base64 to ImageData conversion function with enhanced debugging
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
    const { Jimp: JimpClass } = require('jimp');
    const image = await JimpClass.read(buffer);
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

// Health check endpoint - SINGLE route pattern
debugLog('Defining health check route...');
try {
  app.get('/health', (req, res) => {
    debugLog('Health check endpoint called');
    res.status(200).json({
      success: true,
      message: 'Service en ligne - Debug Version',
      timestamp: new Date().toISOString(),
      environment: 'Vercel Debug',
      url: req.url,
      originalUrl: req.originalUrl,
      debug: true
    });
  });
  debugLog('Health check route defined successfully');
} catch (error) {
  debugLog('ERROR defining health route', { error: error.message, stack: error.stack });
  throw error;
}

// Convert endpoint - SINGLE route pattern to avoid conflicts
debugLog('Defining convert route...');
try {
  app.post('/convert', async (req, res) => {
    try {
      debugLog('Convert endpoint called', { 
        url: req.url, 
        originalUrl: req.originalUrl,
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
            timestamp: new Date().toISOString(),
            debug: true
          }
        });
      }
    } catch (error) {
      debugLog('ERROR in convert endpoint', { error: error.message, stack: error.stack });
      return res.status(500).json({
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Une erreur s\'est produite lors du traitement de l\'image: ' + error.message,
          debug: {
            error: error.message,
            stack: error.stack
          }
        }
      });
    }
  });
  debugLog('Convert route defined successfully');
} catch (error) {
  debugLog('ERROR defining convert route', { error: error.message, stack: error.stack });
  throw error;
}

// Catch-all for debugging with enhanced logging
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
    debug: {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      availableRoutes: ['GET /health', 'POST /convert']
    }
  });
});

// Enhanced error handler
app.use((error, req, res, next) => {
  debugLog('EXPRESS ERROR HANDLER TRIGGERED', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error',
      details: error.message,
      debug: {
        stack: error.stack,
        url: req.url,
        method: req.method
      }
    }
  });
});

debugLog('API handler initialization completed');

// Export both as Express app and as Vercel function
module.exports = app;

// Also export as serverless function for Vercel compatibility
module.exports.default = app;