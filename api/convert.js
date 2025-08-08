const express = require('express');
const router = express.Router();
const { convertToPixelMap, pixelMapToCSV, validatePixelMap } = require('../utils/imageProcessor');

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
        format: 'Format de sortie (json, csv, pdf, défaut: json)'
      }
    }
  });
});

// Image conversion endpoint
router.post('/convert', (req, res) => {
  try {
    // Extract data from request
    const { imageData, shades = 12, format = 'json' } = req.body;
    
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
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Le format doit être "json", "csv" ou "pdf"'
        }
      });
    }
    
    // For now, we'll return a mock response since actual image processing
    // would require additional libraries in the serverless environment
    // In a real implementation, we would process the image here
    
    // Generate mock pixel map data
    const pixelMap = [];
    for (let y = 0; y < 70; y++) {
      const row = [];
      for (let x = 0; x < 50; x++) {
        // Generate random shade values for demonstration
        row.push(Math.floor(Math.random() * shadeCount));
      }
      pixelMap.push(row);
    }
    
    // Validate the generated pixel map
    if (!validatePixelMap(pixelMap, 50, 70, shadeCount)) {
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
      const csvContent = pixelMapToCSV(pixelMap, shadeCount);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="carte-pixels.csv"');
      return res.status(200).send(csvContent);
    } else if (format === 'pdf') {
      // Generate PDF content (mock implementation)
      const pdfContent = `Carte de Pixels (PDF)
Dimensions: 50x70
Nuances: ${shadeCount}
Date: ${new Date().toISOString()}

Page 1: Image en Pixels Gris
[Image data would be here in a real implementation]

Page 2: Carte de Pixels
${pixelMap.map(row => row.join(' ')).join('\n')}`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="carte-pixels.pdf"');
      return res.status(200).send(pdfContent);
    } else {
      // JSON format
      return res.status(200).json({
        success: true,
        data: {
          pixelMap: pixelMap,
          dimensions: {
            width: 50,
            height: 70
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
        message: 'Une erreur s\'est produite lors du traitement de l\'image'
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