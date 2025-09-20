// Test error handling with invalid inputs
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('Testing error handling with invalid inputs...');

  // Test 1: Missing imageData
  console.log('\nTest 1: Missing imageData');
  try {
    const response1 = await fetch('http://localhost:3000/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shades: 10,
        format: 'json'
      })
    });
    const data1 = await response1.json();
    console.log('Response:', data1);
    console.log('Success:', data1.success);
    if (!data1.success) {
      console.log('Error code:', data1.error.code);
      console.log('Error message:', data1.error.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 2: Invalid shades value
  console.log('\nTest 2: Invalid shades value');
  try {
    const response2 = await fetch('http://localhost:3000/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: 'invalid_base64_data',
        shades: 5, // Invalid value, should be between 9-12
        format: 'json'
      })
    });
    const data2 = await response2.json();
    console.log('Response:', data2);
    console.log('Success:', data2.success);
    if (!data2.success) {
      console.log('Error code:', data2.error.code);
      console.log('Error message:', data2.error.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 3: Invalid format
  console.log('\nTest 3: Invalid format');
  try {
    const response3 = await fetch('http://localhost:3000/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: 'invalid_base64_data',
        shades: 10,
        format: 'xml' // Invalid format, should be json or csv
      })
    });
    const data3 = await response3.json();
    console.log('Response:', data3);
    console.log('Success:', data3.success);
    if (!data3.success) {
      console.log('Error code:', data3.error.code);
      console.log('Error message:', data3.error.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 4: Invalid base64 data
  console.log('\nTest 4: Invalid base64 data');
  try {
    const response4 = await fetch('http://localhost:3000/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: 'invalid_base64_data',
        shades: 10,
        format: 'json'
      })
    });
    const data4 = await response4.json();
    console.log('Response:', data4);
    console.log('Success:', data4.success);
    if (!data4.success) {
      console.log('Error code:', data4.error.code);
      console.log('Error message:', data4.error.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Test 5: Valid request to confirm normal operation
  console.log('\nTest 5: Valid request to confirm normal operation');
  try {
    // Read the test image
    const base64Data = fs.readFileSync('test_image.b64', 'utf8');
    
    const response5 = await fetch('http://localhost:3000/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: base64Data,
        shades: 10,
        format: 'json'
      })
    });
    const data5 = await response5.json();
    console.log('Response status:', response5.status);
    console.log('Success:', data5.success);
    if (data5.success) {
      console.log('Pixel map dimensions:', data5.data.dimensions);
      console.log('First few pixel values:', data5.data.pixelMap[0].slice(0, 10));
    } else {
      console.log('Error code:', data5.error.code);
      console.log('Error message:', data5.error.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

runTests();