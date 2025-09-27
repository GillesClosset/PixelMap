const { convertToPixelMap } = require('./utils/imageProcessor');

// Create a mock greyscale image for testing with specific values
function createMockGreyscaleImage(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  
  // Fill with a recognizable pattern to verify exact matching
 for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Create a pattern where each pixel has a unique greyscale value
      const greyValue = (y * width + x) % 256; // Cycle through 0-255 values
      data[idx] = greyValue;       // R
      data[idx + 1] = greyValue;   // G
      data[idx + 2] = greyValue;   // B
      data[idx + 3] = 25;         // A
    }
  }
  
  return {
    width: width,
    height: height,
    data: data
 };
}

// Test that the preview image matches the uploaded image exactly
console.log('Testing that preview image matches uploaded image exactly...');
const mockImage = createMockGreyscaleImage(50, 70);

// Store original image data for comparison
const originalData = new Uint8ClampedArray(mockImage.data);

const { pixelMap, greyscaleImageData } = convertToPixelMap(mockImage, 50, 70);

// Check if the greyscaleImageData matches the original
let dataMatches = true;
for (let i = 0; i < originalData.length; i++) {
  if (originalData[i] !== greyscaleImageData.data[i]) {
    dataMatches = false;
    console.log(`Data mismatch at index ${i}: original=${originalData[i]}, processed=${greyscaleImageData.data[i]}`);
    break;
  }
}

console.log(`Generated pixel map with dimensions: ${pixelMap[0].length}x${pixelMap.length}`);
console.log(`Original image data matches processed image data: ${dataMatches}`);

if (dataMatches) {
  console.log('SUCCESS: Preview image will match uploaded image exactly!');
} else {
  console.log('FAILURE: Preview image does not match uploaded image');
}

// Verify a few sample values to ensure pixel mapping still works correctly
console.log('\nSample pixel mapping verification:');
for (let y = 0; y < 3; y++) {
  for (let x = 0; x < 3; x++) {
    const originalGrey = originalData[(y * 50 + x) * 4];
    const pixelValue = pixelMap[y][x];
    console.log(`Position (${x},${y}): Original grey=${originalGrey}, Mapped to pixel=${pixelValue}`);
  }
}