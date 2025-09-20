const fs = require('fs');
const path = require('path');

// Read the base64 file for JPEG image
const base64Data = fs.readFileSync('messi.b64', 'utf8');

// Create the request payload
const payload = {
  imageData: base64Data,
  shades: 10,
  format: 'json'
};

console.log('Sending request with JPEG image, payload size:', base64Data.length);

// Send the request
fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response data length:', data.length);
  // Try to parse JSON response
  try {
    const jsonData = JSON.parse(data);
    console.log('Success:', jsonData.success);
    if (jsonData.success) {
      console.log('Pixel map dimensions:', jsonData.data.dimensions);
      console.log('First few pixel values:', jsonData.data.pixelMap[0].slice(0, 10));
    } else {
      console.log('Error:', jsonData.error);
    }
  } catch (e) {
    console.log('Non-JSON response:', data.substring(0, 200) + '...');
  }
})
.catch(error => {
  console.error('Error:', error);
});