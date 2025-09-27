/**
 * Image processing utilities for pixel map conversion
 */

/**
* Checks if an image is already greyscale
 * @param {ImageData} imageData - The image data to check
 * @returns {boolean} Whether the image is greyscale
 */
function isGreyscale(imageData) {
  // Ensure we're working with a Uint8ClampedArray
  const data = Array.isArray(imageData.data) || imageData.data instanceof Uint8ClampedArray
    ? imageData.data
    : new Uint8ClampedArray(imageData.data);
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
  console.log('convertToPixelMap called with:', { width, height, imageDataWidth: imageData.width, imageDataHeight: imageData.height });
  console.log('imageData type:', typeof imageData);
  console.log('imageData keys:', Object.keys(imageData));
  console.log('imageData.data type:', typeof imageData.data);
  console.log('imageData.data length:', imageData.data.length);
  console.log('Expected data length:', width * height * 4);
  
  // Validate input
  if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
    console.error('Invalid imageData provided to convertToPixelMap');
    return { pixelMap: [], greyscaleImageData: null };
  }
  
  // Check if dimensions match
  if (imageData.width !== width || imageData.height !== height) {
    console.warn('Dimension mismatch: imageData dimensions differ from provided dimensions', {
      providedWidth: width,
      providedHeight: height,
      imageDataWidth: imageData.width,
      imageDataHeight: imageData.height
    });
  }
  
  // Clone the image data to avoid modifying the original
  // Jimp uses a Buffer, so we need to convert it to Uint8ClampedArray
  const data = new Uint8ClampedArray(imageData.data);
  const pixelMap = [];
  
 // According to requirements, the image is always greyscale with 10 tones
 // So we can skip the greyscale check and directly process the pixel values
  
  // Create a separate array for the greyscale image data that preserves original values
 const greyscaleData = new Uint8ClampedArray(imageData.data);
  
  // Process each pixel
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Get pixel index
      const idx = (y * width + x) * 4;
      
      // Safety check to prevent accessing out of bounds
      if (idx + 3 >= data.length) {
        console.warn('Pixel index out of bounds:', { x, y, idx, dataLength: data.length });
        row.push(9); // Default to black if out of bounds
        continue;
      }
      
      // Since the image is always greyscale as per requirements, use the red channel value directly
      // All RGB values should be the same in a greyscale image
      const grey = data[idx];
      
      // Log some sample grey values
      if (y < 5 && x < 5) {
        console.log(`Grey value at (${x},${y}): ${grey}`);
      }
      
      // Map the greyscale value (0-255) directly to 10 shades (0-9) where 0=white and 9=black
      // We map the full range of greyscale values to our 10-tone scale
      const shade = 9 - Math.floor(grey * 10 / 256);
      
      // Log some sample shade values
      if (y < 5 && x < 5) {
        console.log(`Shade at (${x},${y}): ${shade}`);
      }
      
      // Ensure shade is within valid range
      const finalShade = Math.min(Math.max(shade, 0), 9);
      row.push(finalShade);
      
      // Keep original pixel value for the greyscale image data to match original upload
      // We'll only modify the data for the greyscaleImageData if needed for display
      // For now, preserve original values to match uploaded image
    }
    pixelMap.push(row);
  }
  
  // Create new ImageData with the original data to match the uploaded image
  // Return the data and dimensions so the calling function can create a proper ImageData object
  // if needed with access to canvas context
  const greyscaleImageData = {
    data: greyscaleData,
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