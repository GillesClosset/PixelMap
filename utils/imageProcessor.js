/**
 * Image processing utilities for pixel map conversion
 */

/**
 * Checks if an image is already greyscale
 * @param {ImageData} imageData - The image data to check
 * @returns {boolean} Whether the image is greyscale
 */
function isGreyscale(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // If RGB values are not equal, it's not greyscale
      if (r !== g || g !== b) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Converts an image to a pixel map with specified dimensions and shades
 * @param {ImageData} imageData - The image data to process
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {object} Object containing pixelMap and greyscaleImageData
 */
function convertToPixelMap(imageData, width, height) {
  console.log('convertToPixelMap called with:', { imageData, width, height });
  console.log('imageData type:', typeof imageData);
  console.log('imageData keys:', Object.keys(imageData));
  console.log('imageData.data type:', typeof imageData.data);
  console.log('imageData.data length:', imageData.data.length);
  console.log('Expected data length:', width * height * 4);
  // Clone the image data to avoid modifying the original
  const data = new Uint8ClampedArray(imageData.data);
  const pixelMap = [];
  
  // Check if image is already greyscale
  const alreadyGreyscale = isGreyscale(imageData);
  
  // Process each pixel
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Get pixel index
      const idx = (y * width + x) * 4;
      
      let grey;
      if (alreadyGreyscale) {
        // If already greyscale, use the existing value
        grey = data[idx];
      } else {
        // Get RGB values
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Convert to greyscale using luminance formula
        grey = 0.299 * r + 0.587 * g + 0.114 * b;
      }
      
      // Quantize to 10 shades (0-9) where 0=white and 9=black
      // Invert the scale so that 0=white and 9=black
      const shade = 9 - Math.floor(grey * 10 / 256);
      
      // Ensure shade is within valid range
      const finalShade = Math.min(Math.max(shade, 0), 9);
      row.push(finalShade);
      
      // Update the greyscale image data (convert back to normal scale for display)
      const displayGrey = 255 - (finalShade * 255 / 9);
      data[idx] = displayGrey;     // R
      data[idx + 1] = displayGrey; // G
      data[idx + 2] = displayGrey; // B
      data[idx + 3] = 255;         // A
    }
    pixelMap.push(row);
  }
  
  // Create new ImageData with the modified data
  // Return the data and dimensions so the calling function can create a proper ImageData object
  // if needed with access to canvas context
  const greyscaleImageData = {
    data: data,
    width: width,
    height: height
  };
  
  return {
    pixelMap: pixelMap,
    greyscaleImageData: greyscaleImageData
  };
}

/**
 * Validates the pixel map dimensions and values
 * @param {number[][]} pixelMap - The pixel map to validate
 * @param {number} expectedWidth - Expected width
 * @param {number} expectedHeight - Expected height
 * @returns {boolean} Whether the pixel map is valid
 */
function validatePixelMap(pixelMap, expectedWidth, expectedHeight) {
  // Check dimensions
  if (!Array.isArray(pixelMap) || pixelMap.length !== expectedHeight) {
    return false;
  }
  
  for (let y = 0; y < pixelMap.length; y++) {
    const row = pixelMap[y];
    if (!Array.isArray(row) || row.length !== expectedWidth) {
      return false;
    }
    
    // Check each pixel value (0-9 scale)
    for (let x = 0; x < row.length; x++) {
      const value = row[x];
      if (typeof value !== 'number' || value < 0 || value > 9 || !Number.isInteger(value)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Converts pixel map to CSV format
 * @param {number[][]} pixelMap - The pixel map to convert
 * @returns {string} CSV representation of the pixel map
 */
function pixelMapToCSV(pixelMap) {
  let csvContent = 'Carte de Pixels\n';
  csvContent += `Dimensions: ${pixelMap[0].length}x${pixelMap.length}\n`;
  csvContent += `Nuances: 10\n`;
  csvContent += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`;
  
  for (let y = 0; y < pixelMap.length; y++) {
    csvContent += pixelMap[y].join(',') + '\n';
  }
  
  return csvContent;
}

/**
 * Converts pixel map to printable text format
 * @param {number[][]} pixelMap - The pixel map to convert
 * @returns {string} Text representation of the pixel map
 */
function pixelMapToText(pixelMap) {
  let textContent = `Carte de Pixels (${pixelMap[0].length}x${pixelMap.length}) - 10 Nuances\n`;
 textContent += `Généré: ${new Date().toLocaleString('fr-FR')}\n\n`;
  
  for (let y = 0; y < pixelMap.length; y++) {
    const rowText = pixelMap[y].map(val => val.toString().padStart(2, '0')).join(' ');
    textContent += rowText + '\n';
  }
  
  return textContent;
}

module.exports = {
  convertToPixelMap,
  validatePixelMap,
  pixelMapToCSV,
  pixelMapToText,
  isGreyscale
};