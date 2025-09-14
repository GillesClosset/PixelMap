const express = require('express');
const router = express.Router();
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');
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
        format: 'Format de sortie (json, csv, pdf, défaut: json)'
      }
    }
  });
});

// Function to convert base64 image data to canvas ImageData
async function base64ToImageData(base64Data, width, height) {
  // Remove data URL prefix if present
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
  
  // Load image
  const img = await loadImage(Buffer.from(base64Image, 'base64'));
  
  // Create canvas and context
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Set image rendering to pixelated for crisp pixels
  ctx.imageSmoothingEnabled = false;
  
  // Draw and resize the image on the canvas
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  console.log('base64ToImageData returning:', { width: imageData.width, height: imageData.height, dataLength: imageData.data.length });
  console.log('imageData type:', typeof imageData);
  console.log('imageData keys:', Object.keys(imageData));
  console.log('imageData.data type:', typeof imageData.data);
  console.log('imageData.data length:', imageData.data.length);
  console.log('Expected data length:', width * height * 4);
  return imageData;
}

// Function to generate PDF with two pages
function generatePDF(originalImageData, pixelMap) {
  console.log('Entering generatePDF function');
  console.log('Arguments:', { originalImageData, pixelMap });
  console.log('originalImageData type:', typeof originalImageData);
  console.log('originalImageData keys:', Object.keys(originalImageData));
  console.log('originalImageData.data type:', typeof originalImageData.data);
  console.log('originalImageData.data length:', originalImageData.data.length);
  return new Promise((resolve, reject) => {
    try {
      console.log('generatePDF called with:', { originalImageData, pixelMap });
      // Create a new PDF document
      console.log('Creating PDFDocument');
      const pdfDoc = new PDFDocument({
        size: 'A4'
      });
      console.log('PDFDocument created successfully');
      
      // Add more debug information
      console.log('PDFDocument type:', typeof pdfDoc);
      console.log('PDFDocument keys:', Object.keys(pdfDoc));
      
      
      const chunks = [];
      
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      
      // Page 1: Original image
      pdfDoc.fontSize(16).text('Image Originale', { align: 'center' });
      pdfDoc.moveDown(1);
      // Draw the original image data on a canvas
      // Handle both proper ImageData objects and plain objects with data, width, height properties
      let width, height, data;
      // Handle both proper ImageData objects and plain objects with data, width, height properties
      if (originalImageData && typeof originalImageData === 'object') {
        if (originalImageData.width && originalImageData.height) {
          // This is likely a proper ImageData object or a plain object with the right structure
          width = originalImageData.width;
          height = originalImageData.height;
          // For plain objects, data might be an array or Uint8ClampedArray
          data = Array.isArray(originalImageData.data) ?
                 new Uint8ClampedArray(originalImageData.data) :
                 originalImageData.data;
          
          // Debug information
          console.log('Width:', width, 'Height:', height, 'Data length:', data.length);
          console.log('Expected data length:', width * height * 4);
          
          // Check if data length matches expected length for ImageData
          if (data.length !== width * height * 4) {
            throw new Error(`Invalid data length. Expected ${width * height * 4}, got ${data.length}`);
          }
        } else {
          throw new Error('Invalid image data provided: missing width or height');
        }
      } else {
        throw new Error('Invalid image data provided: not an object');
      }
      
      // Create canvas and context to generate a proper ImageData object
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Create proper ImageData object
      let imageData;
      try {
        imageData = ctx.createImageData(width, height);
        imageData.data.set(data);
      } catch (error) {
        console.error('Error creating ImageData:', error);
        throw new Error('Failed to create ImageData: ' + error.message);
      }
      
      // Now we can safely use putImageData
      try {
        ctx.putImageData(imageData, 0, 0);
      } catch (error) {
        console.error('Error putting ImageData:', error);
        throw new Error('Failed to put ImageData: ' + error.message);
      }
      
      // Convert canvas to buffer
      const imgBuffer = canvas.toBuffer('image/png');
      
      // Add image to PDF
      // Calculate dimensions for full-page display
      const pageWidth = pdfDoc.page.width;
      const pageHeight = pdfDoc.page.height;
      const imageAspectRatio = width / height;
      const pageAspectRatio = pageWidth / pageHeight;
      
      let drawWidth, drawHeight;
      if (imageAspectRatio > pageAspectRatio) {
        // Image is wider than page, fit to width
        drawWidth = pageWidth;
        drawHeight = pageWidth / imageAspectRatio;
      } else {
        // Image is taller than page, fit to height
        drawHeight = pageHeight;
        drawWidth = pageHeight * imageAspectRatio;
      }
      
      // Center the image on the page
      const xPos = (pageWidth - drawWidth) / 2;
      const yPos = (pageHeight - drawHeight) / 2;
      
      // Add image to PDF with full-page scaling
      pdfDoc.image(imgBuffer, xPos, yPos, {
        width: drawWidth,
        height: drawHeight
      });
      
      // Add new page for pixel map
      pdfDoc.addPage();
      
      // Page 2: Pixel map
      pdfDoc.fontSize(16).text('Carte de Pixels', { align: 'center' });
      pdfDoc.moveDown(1);
      
      // Add pixel map as text grid taking full page
      const pageWidth2 = pdfDoc.page.width;
      const pageHeight2 = pdfDoc.page.height;
      
      // Calculate grid dimensions for full-page display
      const margin = 30;
      const gridWidth = pageWidth2 - 2 * margin;
      const gridHeight = pageHeight2 - 100; // Leave space for title and margins
      
      // Calculate cell size
      const cellWidth = gridWidth / pixelMap[0].length;
      const cellHeight = gridHeight / pixelMap.length;
      
      // Starting position
      const startX = margin;
      const startY = 80; // Leave space for title
      
      // Adjust font size based on cell size for better visibility
      const fontSize = Math.min(cellWidth, cellHeight) * 0.4;
      pdfDoc.fontSize(fontSize);
      
      // Draw grid lines and numbers
      for (let y = 0; y < pixelMap.length; y++) {
        for (let x = 0; x < pixelMap[y].length; x++) {
          // Draw cell border
          pdfDoc.rect(startX + x * cellWidth, startY + y * cellHeight, cellWidth, cellHeight).stroke();
          
          // Draw pixel value
          pdfDoc.text(
            pixelMap[y][x].toString(),
            startX + x * cellWidth + cellWidth/2,
            startY + y * cellHeight + cellHeight/2 - fontSize/2,
            {
              width: cellWidth,
              align: 'center'
            }
          );
        }
      }
      
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
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
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Le format doit être "json", "csv" ou "pdf"'
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
    } else if (format === 'pdf') {
      // Generate PDF content
      console.log('About to call generatePDF with greyscaleImageData:', greyscaleImageData);
      console.log('pixelMap:', pixelMap);
      const pdfBuffer = await generatePDF(greyscaleImageData, pixelMap);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="carte-pixels.pdf"');
      return res.status(200).send(pdfBuffer);
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