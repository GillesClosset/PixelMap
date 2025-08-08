/**
 * Image processing utilities for pixel map conversion
 */

/**
 * Converts an image to a pixel map with specified dimensions and shades
 * @param {ImageData} imageData - The image data to process
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @param {number} shades - Number of grayscale shades (9-12)
 * @returns {object} Object containing pixelMap and greyscaleImageData
 */
function convertToPixelMap(imageData, width, height, shades) {
  // Clone the image data to avoid modifying the original
  const data = new Uint8ClampedArray(imageData.data);
  const pixelMap = [];
  
  // Process each pixel
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Get pixel index
      const idx = (y * width + x) * 4;
      
      // Get RGB values
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Convert to greyscale using luminance formula
      const grey = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Quantize to selected number of shades
      const shade = Math.floor(grey * shades / 256);
      
      // Ensure shade is within valid range
      const finalShade = Math.min(shade, shades - 1);
      row.push(finalShade);
      
      // Update the greyscale image data
      data[idx] = finalShade * (255 / (shades - 1));     // R
      data[idx + 1] = finalShade * (255 / (shades - 1)); // G
      data[idx + 2] = finalShade * (255 / (shades - 1)); // B
      data[idx + 3] = 255;                               // A
    }
    pixelMap.push(row);
  }
  
  // Create new ImageData with the modified data
  const greyscaleImageData = new ImageData(data, width, height);
  
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
 * @param {number} shades - Number of grayscale shades
 * @returns {boolean} Whether the pixel map is valid
 */
function validatePixelMap(pixelMap, expectedWidth, expectedHeight, shades) {
  // Check dimensions
  if (!Array.isArray(pixelMap) || pixelMap.length !== expectedHeight) {
    return false;
  }
  
  for (let y = 0; y < pixelMap.length; y++) {
    const row = pixelMap[y];
    if (!Array.isArray(row) || row.length !== expectedWidth) {
      return false;
    }
    
    // Check each pixel value
    for (let x = 0; x < row.length; x++) {
      const value = row[x];
      if (typeof value !== 'number' || value < 0 || value >= shades || !Number.isInteger(value)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Converts pixel map to CSV format
 * @param {number[][]} pixelMap - The pixel map to convert
 * @param {number} shades - Number of grayscale shades
 * @returns {string} CSV representation of the pixel map
 */
function pixelMapToCSV(pixelMap, shades) {
  let csvContent = 'Carte de Pixels\n';
  csvContent += `Dimensions: ${pixelMap[0].length}x${pixelMap.length}\n`;
  csvContent += `Nuances: ${shades}\n`;
  csvContent += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`;
  
  for (let y = 0; y < pixelMap.length; y++) {
    csvContent += pixelMap[y].join(',') + '\n';
  }
  
  return csvContent;
}

/**
 * Converts pixel map to printable text format
 * @param {number[][]} pixelMap - The pixel map to convert
 * @param {number} shades - Number of grayscale shades
 * @returns {string} Text representation of the pixel map
 */
function pixelMapToText(pixelMap, shades) {
  let textContent = `Carte de Pixels (${pixelMap[0].length}x${pixelMap.length}) - ${shades} Nuances\n`;
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
  pixelMapToText
};