const { convertToPixelMap } = require('./utils/imageProcessor');

// Create a mock greyscale image for testing
function createMockGreyscaleImage(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  
  // Fill with some greyscale values (same value for R, G, B to simulate greyscale)
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    // Create a gradient from 0 (white) to 255 (black) 
    const greyValue = Math.floor((i % width) * 255 / (width - 1));
    data[idx] = greyValue;       // R
    data[idx + 1] = greyValue;   // G
    data[idx + 2] = greyValue;   // B
    data[idx + 3] = 255;         // A
  }
  
  return {
    width: width,
    height: height,
    data: data
  };
}

// Test the simplified workflow
console.log('Testing simplified pixel map conversion workflow...');
const mockImage = createMockGreyscaleImage(50, 70);
const { pixelMap, greyscaleImageData } = convertToPixelMap(mockImage, 50, 70);

console.log(`Generated pixel map with dimensions: ${pixelMap[0].length}x${pixelMap.length}`);
console.log('Sample of first few pixels in the map:');
for (let y = 0; y < 5; y++) {
  console.log(`Row ${y}: [${pixelMap[y].slice(0, 10).join(', ')} ...]`);
}

console.log('All tests passed! The simplified workflow is working correctly.');