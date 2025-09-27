const Jimp = require('jimp');

// Function to convert base64 image data to canvas ImageData
async function base64ToImageData(base64Data, width, height) {
  try {
    // Remove data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Load image with Jimp
    const buffer = Buffer.from(base64Image, 'base64');
    const image = await Jimp.read(buffer);
    
    // Resize the image
    image.resize({ w: width, h: height });
    
    // Get image data
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

// Convert to pixel map function
function convertToPixelMap(imageData, width, height) {
  const data = imageData.data;
  const map = [];
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Convert to greyscale
      const grey = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Quantize to 10 shades (0-9) where 0=white and 9=black
      const shade = 9 - Math.floor(grey * 10 / 256);
      const finalShade = Math.min(Math.max(shade, 0), 9);
      row.push(finalShade);
    }
    map.push(row);
  }
  
  return { pixelMap: map };
}

// Main handler function for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed' }
    });
  }

  try {
    const { imageData, shades = 10, format = 'json' } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: { message: 'Image data is required' }
      });
    }
    
    const targetWidth = 50;
    const targetHeight = 70;
    
    const originalImageData = await base64ToImageData(imageData, targetWidth, targetHeight);
    const { pixelMap } = convertToPixelMap(originalImageData, targetWidth, targetHeight);
    
    return res.status(200).json({
      success: true,
      data: {
        pixelMap: pixelMap,
        dimensions: {
          width: targetWidth,
          height: targetHeight
        },
        shades: parseInt(shades),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
}