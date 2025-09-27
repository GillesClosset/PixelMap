const { convertToPixelMap } = require('./utils/imageProcessor');
const { Jimp } = require('jimp');
const fs = require('fs');

async function analyzeGreyTones(imagePath) {
  try {
    console.log(`\nAnalyzing ${imagePath}...`);
    
    // Check if file exists first
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File does not exist: ${imagePath}`);
    }
    
    // Load the image
    const image = await Jimp.read(imagePath);
    console.log(`Image dimensions: ${image.bitmap.width}x${image.bitmap.height}`);
    
    // Get image data
    const imageData = {
      width: image.bitmap.width,
      height: image.bitmap.height,
      data: image.bitmap.data
    };
    
    // Collect unique grey values
    const greyValues = new Set();
    const data = imageData.data;
    let isGrayscale = true;
    
    // Sample all pixels to find unique grey values (for smaller images)
    // For larger images, we might want to sample strategically
    for (let i = 0; i < data.length; i += 4) { // Process RGBA quads
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Check if it's actually grayscale (R=G=B)
      if (r !== g || g !== b) {
        // If this is the first non-gray pixel, report it but continue
        if (isGrayscale) {
          console.log(`Warning: Image is not purely grayscale. Found first non-gray pixel at index ${i/4}. R=${r}, G=${g}, B=${b}`);
          isGrayscale = false;
        }
      }
      
      // For grayscale analysis, we'll collect all R values (or average RGB for color images)
      // Since we expect grayscale images, we'll use R value as the gray value
      greyValues.add(r);
    }
    
    console.log(`Number of unique grey tones found: ${greyValues.size}`);
    console.log(`Grey values range: ${Math.min(...greyValues)} to ${Math.max(...greyValues)}`);
    console.log(`Is image purely grayscale: ${isGrayscale}`);
    
    // Show some sample values if there are not too many
    if (greyValues.size <= 20) {
      console.log(`Unique grey values: ${Array.from(greyValues).sort((a, b) => a - b)}`);
    } else {
      console.log(`First 20 unique grey values: ${Array.from(greyValues).sort((a, b) => a - b).slice(0, 20)}`);
    }
    
    return {
      imageData: imageData,
      greyTonesCount: greyValues.size,
      greyValues: Array.from(greyValues).sort((a, b) => a - b),
      isGrayscale: isGrayscale
    };
  } catch (error) {
    console.error(`Error analyzing ${imagePath}:`, error.message);
    throw error;
  }
}

async function processImageWithWorkflow(imageData, filename) {
  console.log(`\nProcessing ${filename} with updated workflow...`);
  
  // Resize image to 50x70 as required by the workflow
  const resizedImageData = await resizeImageData(imageData, 50, 70);
  
  // Process with our updated workflow
  const { pixelMap, greyscaleImageData } = convertToPixelMap(
    resizedImageData,
    50,
    70
  );
  
  console.log(`Generated pixel map with dimensions: ${pixelMap[0].length}x${pixelMap.length}`);
  
  // Check the distribution of pixel values in the resulting map
  const valueCounts = {};
  for (let y = 0; y < pixelMap.length; y++) {
    for (let x = 0; x < pixelMap[y].length; x++) {
      const value = pixelMap[y][x];
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    }
  }
  
  console.log('Distribution of pixel values in the resulting map:');
  for (let i = 0; i <= 9; i++) {
    if (valueCounts[i]) {
      console.log(`  Value ${i}: ${valueCounts[i]} pixels`);
    } else {
      console.log(`  Value ${i}: 0 pixels`);
    }
  }
  
  // Verify first few pixels to ensure mapping is working
  console.log('\nSample of first few pixels in the map:');
  for (let y = 0; y < 3; y++) {
    console.log(`Row ${y}: [${pixelMap[y].slice(0, 10).join(', ')} ...]`);
  }
  
  return { pixelMap, greyscaleImageData };
}

async function resizeImageData(imageData, targetWidth, targetHeight) {
  // Create a temporary Jimp image to resize
  const image = new Jimp({
    width: imageData.width,
    height: imageData.height,
    data: Buffer.from(imageData.data)
  });
  
  // Resize the image
 image.resize(targetWidth, targetHeight);
  
  // Return the resized image data
  return {
    width: targetWidth,
    height: targetHeight,
    data: new Uint8ClampedArray(image.bitmap.data)
  };
}

async function runAnalysis() {
  console.log('Starting analysis of image files...');
  
  try {
    // Analyze image0000001.png first
    console.log("Analyzing image000001.png:");
    const image1Data = await analyzeGreyTones('./image000001.png');
    await processImageWithWorkflow(image1Data.imageData, 'image000001.png');
    
    console.log("\n" + "=".repeat(50));
    
    // Analyze image000002.png
    console.log("Analyzing image00002.png:");
    const image2Data = await analyzeGreyTones('./image000002.png');
    await processImageWithWorkflow(image2Data.imageData, 'image0000002.png');
    
    console.log('\nAnalysis complete! Both images have been processed with the updated workflow.');
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the analysis
runAnalysis();