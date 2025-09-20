/**
 * FIXED Vercel serverless function handler
 * 
 * Root cause: Array route patterns ['/convert', '/api/convert'] conflict with 
 * Vercel's rewrite rules in serverless environment, causing 'apply' error.
 * 
 * Solution: Use single route patterns compatible with Vercel's routing system.
 */

const express = require('express');
const { Jimp } = require('jimp');
const { convertToPixelMap, pixelMapToCSV, validatePixelMap, pixelMapToText } = require('../utils/imageProcessor');

// Create Express app for Vercel
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));

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

// Base64 to ImageData conversion
async function base64ToImageData(base64Data, width, height) {
  try {
    if (!base64Data) {
      throw new Error('Base64 data is required');
    }
    
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    if (base64Image.length === 0) {
      throw new Error('Invalid base64 image data');
    }
    
    const buffer = Buffer.from(base64Image, 'base64');
    const image = await Jimp.read(buffer);
    
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid dimensions provided');
    }
    
    image.resize({ w: width, h: height });
    
    const imageData = {
      width: image.bitmap.width,
      height: image.bitmap.height,
      data: image.bitmap.data
    };
    
    return imageData;
  } catch (error) {
    throw new Error(`Failed to process image data: ${error.message}`);
  }
}

// FIXED: Single route patterns only (no arrays to avoid Vercel conflicts)

// Health check - single pattern
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service en ligne',
    timestamp: new Date().toISOString(),
    environment: 'Vercel Serverless',
    version: 'fixed'
  });
});

// API info - single pattern
app.get('/info', (req, res) => {
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

// Convert endpoint - single pattern (Vercel rewrite handles /api/convert → /convert)
app.post('/convert', async (req, res) => {
  try {
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
    
    const originalImageData = await base64ToImageData(imageData, targetWidth, targetHeight);
    
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
    console.error('Error processing image:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Une erreur s\'est produite lors du traitement de l\'image: ' + error.message
      }
    });
  }
});

// Catch-all for 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    available: ['GET /health', 'GET /info', 'POST /convert']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error'
    }
  });
});

// Export for Vercel serverless
module.exports = app;