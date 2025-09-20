/**
 * Fixed Vercel serverless function handler
 * 
 * The issue is likely that Vercel's rewrites + Express routing
 * is causing conflicts. This version handles it differently.
 */

const express = require('express');
const { Jimp } = require('jimp');
const { convertToPixelMap, pixelMapToCSV, validatePixelMap, pixelMapToText } = require('../utils/imageProcessor');

// Create a fresh Express app specifically for Vercel
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));

// Add debug logging for Vercel
app.use((req, res, next) => {
  console.log(`[Vercel] ${req.method} ${req.url} - Original URL: ${req.originalUrl}`);
  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check - handle both /health and /api/health
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service en ligne',
    timestamp: new Date().toISOString(),
    environment: 'Vercel',
    url: req.url,
    originalUrl: req.originalUrl
  });
});

// API info - handle both /info and /api/info  
app.get(['/info', '/api/info'], (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Convertisseur de Carte de Pixels',
      description: 'API pour convertir des images en cartes de pixels',
      version: '1.0.0',
      environment: 'Vercel Serverless',
      endpoints: {
        'POST /api/convert': 'Convertit une image en carte de pixels',
        'GET /api/health': 'Vérifie l\'état du service',
        'GET /api/info': 'Informations sur l\'API'
      }
    }
  });
});

// Base64 to ImageData conversion (same as before)
async function base64ToImageData(base64Data, width, height) {
  try {
    console.log('[Vercel] base64ToImageData called with:', { width, height, base64DataLength: base64Data.length });
    
    if (!base64Data) {
      throw new Error('Base64 data is required');
    }
    
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    if (base64Image.length === 0) {
      throw new Error('Invalid base64 image data');
    }
    
    const buffer = Buffer.from(base64Image, 'base64');
    const image = await Jimp.read(buffer);
    console.log('[Vercel] Loaded image dimensions:', { width: image.bitmap.width, height: image.bitmap.height });
    
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid dimensions provided');
    }
    
    image.resize({ w: width, h: height });
    
    const imageData = {
      width: image.bitmap.width,
      height: image.bitmap.height,
      data: image.bitmap.data
    };
    
    console.log('[Vercel] base64ToImageData success');
    return imageData;
  } catch (error) {
    console.error('[Vercel] Error in base64ToImageData:', error);
    throw new Error(`Failed to process image data: ${error.message}`);
  }
}

// Convert endpoint - handle both /convert and /api/convert
app.post(['/convert', '/api/convert'], async (req, res) => {
  try {
    console.log('[Vercel] Convert endpoint called:', { url: req.url, originalUrl: req.originalUrl });
    
    const { imageData, shades = 10, format = 'json' } = req.body;
    
    // Validate input
    if (!imageData) {
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
    
    console.log('[Vercel] About to call base64ToImageData');
    const originalImageData = await base64ToImageData(imageData, targetWidth, targetHeight);
    
    console.log('[Vercel] About to call convertToPixelMap');
    const { pixelMap, greyscaleImageData } = convertToPixelMap(
      originalImageData,
      targetWidth,
      targetHeight
    );
    
    // Validate the generated pixel map
    if (!validatePixelMap(pixelMap, targetWidth, targetHeight)) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'La carte de pixels générée est invalide'
        }
      });
    }
    
    console.log('[Vercel] Processing completed successfully');
    
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
    console.error('[Vercel] Error processing image:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Une erreur s\'est produite lors du traitement de l\'image: ' + error.message
      }
    });
  }
});

// Catch-all for debugging
app.use('*', (req, res) => {
  console.log(`[Vercel] Catch-all hit: ${req.method} ${req.url} (original: ${req.originalUrl})`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    debug: {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('[Vercel] Express error handler:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error',
      details: error.message
    }
  });
});

// Export the Express app directly for Vercel
module.exports = app;