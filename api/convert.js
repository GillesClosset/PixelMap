const express = require('express');
const router = express.Router();
const { createCanvas, loadImage } = require('canvas');
const { convertToPixelMap, pixelMapToCSV, validatePixelMap, pixelMapToText } = require('../utils/imageProcessor');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service en ligne',
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Convertisseur de Carte de Pixels',
      description: 'API pour convertir des images en cartes de pixels',
      version: '1.0.0',
      endpoints: {
        'POST /api/convert': 'Convertit une image en carte de pixels',
        'GET /api/health': 'Vérifie l\'état du service',
        'GET /api/info': 'Informations sur l\'API'
      },
      parameters: {
        shades: 'Nombre de nuances de gris (9-12, défaut: 12)',
        format: 'Format de sortie (json, csv, défaut: json)'
      }
    }
  });
});

// Function to convert base64 image data to canvas ImageData
async function base64ToImageData(base64Data, width, height) {
  console.log('base64ToImageData called with:', { width, height, base64DataLength: base64Data.length });
  
  // Remove data URL prefix if present
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
  console.log('Base64 image data length after prefix removal:', base64Image.length);
  
  // Load image
  const img = await loadImage(Buffer.from(base64Image, 'base64'));
  console.log('Loaded image dimensions:', { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
  
  // Create canvas and context
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Set image rendering to pixelated for crisp pixels
  ctx.imageSmoothingEnabled = false;
  
  // Draw and resize the image on the canvas
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  console.log('base64ToImageData returning:', {
    width: imageData.width,
    height: imageData.height,
    dataLength: imageData.data.length,
    samplePixels: [
      imageData.data[0], imageData.data[1], imageData.data[2], imageData.data[3], // First pixel
      imageData.data[4], imageData.data[5], imageData.data[6], imageData.data[7]  // Second pixel
    ]
  });
  console.log('imageData type:', typeof imageData);
  console.log('imageData keys:', Object.keys(imageData));
  console.log('imageData.data type:', typeof imageData.data);
  console.log('imageData.data length:', imageData.data.length);
  console.log('Expected data length:', width * height * 4);
  return imageData;
}


// Image conversion endpoint
router.post('/convert', async (req, res) => {
  try {
    // Extract data from request
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
    
    // Convert base64 image data to ImageData
    console.log('About to call base64ToImageData with imageData:', imageData);
    const originalImageData = await base64ToImageData(imageData, targetWidth, targetHeight);
    console.log('base64ToImageData returned:', originalImageData);
    console.log('originalImageData type:', typeof originalImageData);
    console.log('originalImageData keys:', Object.keys(originalImageData));
    console.log('originalImageData.data type:', typeof originalImageData.data);
    console.log('originalImageData.data length:', originalImageData.data.length);
    console.log('Expected data length:', targetWidth * targetHeight * 4);
    
    // Process image to pixel map using the shared utility function
    console.log('About to call convertToPixelMap with originalImageData:', originalImageData);
    console.log('originalImageData type:', typeof originalImageData);
    console.log('originalImageData keys:', Object.keys(originalImageData));
    console.log('originalImageData.data type:', typeof originalImageData.data);
    console.log('originalImageData.data length:', originalImageData.data.length);
    console.log('Expected data length:', targetWidth * targetHeight * 4);
    const { pixelMap, greyscaleImageData } = convertToPixelMap(
      originalImageData,
      targetWidth,
      targetHeight
    );
    console.log('convertToPixelMap returned:', { pixelMap, greyscaleImageData });
    
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
      // Generate CSV content using utility function
      const csvContent = pixelMapToCSV(pixelMap);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="carte-pixels.csv"');
      return res.status(200).send(csvContent);
    } else {
      // JSON format
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

// Handle OPTIONS requests for CORS
router.options('/convert', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).send();
});

module.exports = router;