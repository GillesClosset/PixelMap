/**
 * FIXED Vercel serverless function handler with enhanced debugging
 * 
 * Root cause: Array route patterns ['/convert', '/api/convert'] conflict with 
 * Vercel's rewrite rules in serverless environment, causing 'apply' error.
 * 
 * Solution: Use single route patterns compatible with Vercel's routing system.
 * Enhanced with comprehensive debugging to identify the undefined handler.
 */

// Enhanced debug logging function that will definitely appear in Vercel logs
function vercelDebugLog(message, data = {}) {
  // Use console.error to ensure logs appear in Vercel
  console.error(`[VERCEL_DEBUG] ${new Date().toISOString()} ${message}`, JSON.stringify(data, null, 2));
}

vercelDebugLog('Starting API handler initialization');

try {
  vercelDebugLog('Testing utility imports...');
  const utils = require('../utils/imageProcessor');
  vercelDebugLog('Utility imports successful', {
    availableExports: Object.keys(utils),
    convertToPixelMapType: typeof utils.convertToPixelMap,
    pixelMapToCSVType: typeof utils.pixelMapToCSV,
    validatePixelMapType: typeof utils.validatePixelMap,
    pixelMapToTextType: typeof utils.pixelMapToText
  });
  
  const { convertToPixelMap, pixelMapToCSV, validatePixelMap, pixelMapToText } = utils;
  
  vercelDebugLog('Testing Jimp import...');
  const { Jimp } = require('jimp');
  vercelDebugLog('Jimp import successful', { JimpType: typeof Jimp });
  
} catch (error) {
  vercelDebugLog('ERROR during imports', { error: error.message, stack: error.stack });
  throw error;
}

// Create Express app for Vercel with enhanced debugging
vercelDebugLog('Creating Express app...');
const express = require('express');
const app = express();

// Wrap the Express router to catch undefined handlers
vercelDebugLog('Wrapping Express router for debugging...');
const originalRouter = express.Router;
express.Router = function(options) {
  vercelDebugLog('Creating new Router instance', { options });
  const router = originalRouter.call(this, options);
  
  // Wrap the handle function to catch undefined handlers
  const originalHandle = router.handle;
  router.handle = function(req, res, next) {
    vercelDebugLog('Router.handle called', {
      reqMethod: req.method,
      reqUrl: req.url,
      reqOriginalUrl: req.originalUrl,
      nextType: typeof next,
      nextExists: !!next
    });
    
    try {
      return originalHandle.call(this, req, res, next);
    } catch (error) {
      vercelDebugLog('ERROR in router.handle', { error: error.message, stack: error.stack });
      throw error;
    }
  };
  
  return router;
};

// Enhanced middleware registration with debugging
vercelDebugLog('Enhancing app.use with debugging...');
const originalUse = app.use;
app.use = function(...args) {
  vercelDebugLog('Registering middleware', {
    argCount: args.length,
    argTypes: args.map((arg, i) => `arg[${i}]: ${typeof arg}`),
    hasUndefinedArg: args.some(arg => arg === undefined),
    hasNullArg: args.some(arg => arg === null),
    path: typeof args[0] === 'string' ? args[0] : 'no-path'
  });
  
  // Check for undefined args
  args.forEach((arg, index) => {
    if (arg === undefined) {
      vercelDebugLog(`ERROR: Middleware arg ${index} is undefined`);
    } else if (arg === null) {
      vercelDebugLog(`ERROR: Middleware arg ${index} is null`);
    }
  });
  
  try {
    const result = originalUse.apply(this, args);
    vercelDebugLog('Middleware registered successfully');
    return result;
  } catch (error) {
    vercelDebugLog('ERROR registering middleware', { error: error.message, stack: error.stack });
    throw error;
  }
};

// Enhanced route method registration with debugging
['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
  vercelDebugLog(`Enhancing app.${method} with debugging...`);
  const originalMethod = app[method];
  app[method] = function(path, ...handlers) {
    vercelDebugLog(`Registering ${method.toUpperCase()} route`, {
      path,
      handlerCount: handlers.length,
      handlerTypes: handlers.map((h, i) => `handler[${i}]: ${typeof h}`),
      hasUndefinedHandler: handlers.some(h => h === undefined),
      hasNullHandler: handlers.some(h => h === null)
    });
    
    // Check each handler
    handlers.forEach((handler, index) => {
      if (handler === undefined) {
        vercelDebugLog(`ERROR: Handler ${index} is undefined for ${method} ${path}`);
      } else if (handler === null) {
        vercelDebugLog(`ERROR: Handler ${index} is null for ${method} ${path}`);
      } else if (typeof handler !== 'function') {
        vercelDebugLog(`WARNING: Handler ${index} is not a function for ${method} ${path}`, {
          type: typeof handler,
          value: handler
        });
      }
    });
    
    try {
      const result = originalMethod.apply(this, [path, ...handlers]);
      vercelDebugLog(`${method.toUpperCase()} route registered successfully`);
      return result;
    } catch (error) {
      vercelDebugLog(`ERROR registering ${method.toUpperCase()} route`, { error: error.message, stack: error.stack });
      throw error;
    }
  };
});

// Enhanced request logging middleware
vercelDebugLog('Adding request logging middleware...');
app.use((req, res, next) => {
  vercelDebugLog('Incoming request', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  // Debug middleware chain
  vercelDebugLog('Middleware chain state', {
    nextType: typeof next,
    nextExists: !!next
  });
  
  try {
    next();
  } catch (error) {
    vercelDebugLog('ERROR in middleware next()', { error: error.message, stack: error.stack });
    throw error;
  }
});

// Basic middleware with error handling
try {
  vercelDebugLog('Adding JSON middleware...');
  app.use(express.json({ limit: '10mb' }));
  vercelDebugLog('JSON middleware added successfully');
} catch (error) {
  vercelDebugLog('ERROR adding JSON middleware', { error: error.message, stack: error.stack });
  throw error;
}

// CORS middleware with debugging
vercelDebugLog('Adding CORS middleware...');
app.use((req, res, next) => {
  vercelDebugLog('CORS middleware executing');
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      vercelDebugLog('Handling OPTIONS request');
      return res.status(200).end();
    }
    next();
  } catch (error) {
    vercelDebugLog('ERROR in CORS middleware', { error: error.message, stack: error.stack });
    next(error);
  }
});

// Base64 to ImageData conversion with enhanced debugging
async function base64ToImageData(base64Data, width, height) {
  try {
    vercelDebugLog('base64ToImageData called', { width, height, base64DataLength: base64Data ? base64Data.length : 0 });
    
    if (!base64Data) {
      throw new Error('Base64 data is required');
    }
    
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    if (base64Image.length === 0) {
      throw new Error('Invalid base64 image data');
    }
    
    vercelDebugLog('Loading image with Jimp...');
    const { Jimp: JimpClass } = require('jimp');
    const image = await JimpClass.read(Buffer.from(base64Image, 'base64'));
    vercelDebugLog('Image loaded successfully', { width: image.bitmap.width, height: image.bitmap.height });
    
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid dimensions provided');
    }
    
    vercelDebugLog('Resizing image...');
    image.resize({ w: width, h: height });
    
    const imageData = {
      width: image.bitmap.width,
      height: image.bitmap.height,
      data: image.bitmap.data
    };
    
    vercelDebugLog('base64ToImageData completed successfully');
    return imageData;
  } catch (error) {
    vercelDebugLog('ERROR in base64ToImageData', { error: error.message, stack: error.stack });
    throw new Error(`Failed to process image data: ${error.message}`);
  }
}

// FIXED: Single route patterns only (no arrays to avoid Vercel conflicts)

// Health check - single pattern
vercelDebugLog('Defining health check route...');
try {
  app.get('/health', (req, res) => {
    vercelDebugLog('Health check endpoint called');
    res.status(200).json({
      success: true,
      message: 'Service en ligne',
      timestamp: new Date().toISOString(),
      environment: 'Vercel Serverless',
      version: 'fixed-with-debug'
    });
  });
  vercelDebugLog('Health check route defined successfully');
} catch (error) {
  vercelDebugLog('ERROR defining health route', { error: error.message, stack: error.stack });
  throw error;
}

// API info - single pattern
vercelDebugLog('Defining info route...');
try {
  app.get('/info', (req, res) => {
    vercelDebugLog('Info endpoint called');
    res.status(200).json({
      success: true,
      data: {
        name: 'Convertisseur de Carte de Pixels',
        description: 'API pour convertir des images en cartes de pixels',
        version: '1.0.0',
        environment: 'Vercel Serverless Fixed',
        endpoints: {
          'POST /api/convert': 'Convertit une image en carte de pixels',
          'GET /api/health': 'Vérifie l\'état du service',
          'GET /api/info': 'Informations sur l\'API'
        }
      }
    });
  });
  vercelDebugLog('Info route defined successfully');
} catch (error) {
  vercelDebugLog('ERROR defining info route', { error: error.message, stack: error.stack });
  throw error;
}

// Convert endpoint - single pattern (Vercel rewrite handles /api/convert → /convert)
vercelDebugLog('Defining convert route...');
try {
  app.post('/convert', async (req, res) => {
    try {
      vercelDebugLog('Convert endpoint called', {
        url: req.url,
        originalUrl: req.originalUrl,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        hasImageData: !!(req.body && req.body.imageData)
      });
      
      const { imageData, shades = 10, format = 'json' } = req.body;
      
      // Validate input
      if (!imageData) {
        vercelDebugLog('Missing image data');
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
        vercelDebugLog('Invalid shades parameter', { shades, shadeCount });
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
        vercelDebugLog('Invalid format parameter', { format });
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
      
      vercelDebugLog('Starting image processing...');
      const originalImageData = await base64ToImageData(imageData, targetWidth, targetHeight);
      vercelDebugLog('Image data processed successfully');
      
      vercelDebugLog('Starting pixel map conversion...');
      const { pixelMap, greyscaleImageData } = convertToPixelMap(
        originalImageData,
        targetWidth,
        targetHeight
      );
      vercelDebugLog('Pixel map conversion completed');
      
      // Validate the generated pixel map
      if (!validatePixelMap(pixelMap, targetWidth, targetHeight)) {
        vercelDebugLog('Invalid pixel map generated');
        return res.status(500).json({
          success: false,
          error: {
            code: 'PROCESSING_ERROR',
            message: 'La carte de pixels générée est invalide'
          }
        });
      }
      
      vercelDebugLog('Processing completed successfully');
      
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
      vercelDebugLog('ERROR in convert endpoint', { error: error.message, stack: error.stack });
      return res.status(500).json({
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Une erreur s\'est produite lors du traitement de l\'image: ' + error.message
        }
      });
    }
  });
  vercelDebugLog('Convert route defined successfully');
} catch (error) {
  vercelDebugLog('ERROR defining convert route', { error: error.message, stack: error.stack });
  throw error;
}

// Catch-all for 404 with enhanced debugging
vercelDebugLog('Defining catch-all route...');
app.use('*', (req, res) => {
  vercelDebugLog('Catch-all route hit', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    available: ['GET /health', 'GET /info', 'POST /convert']
  });
});

// Enhanced error handler that will definitely log information
vercelDebugLog('Defining error handler...');
app.use((error, req, res, next) => {
  vercelDebugLog('EXPRESS ERROR HANDLER TRIGGERED', { 
    error: error.message, 
    stack: error.stack,
    url: req ? req.url : 'unknown',
    originalUrl: req ? req.originalUrl : 'unknown',
    method: req ? req.method : 'unknown'
  });
  
  // Additional debugging for the specific "apply" error
  if (error.message && error.message.includes('apply')) {
    vercelDebugLog('DETECTED APPLY ERROR - THIS IS THE TARGET ERROR', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      reqUrl: req ? req.url : 'unknown',
      reqMethod: req ? req.method : 'unknown',
      reqHeaders: req ? req.headers : 'unknown'
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

vercelDebugLog('API handler initialization completed');

// Export for Vercel serverless
module.exports = app;