// Test error handling with invalid inputs
const fs = require('fs');
const path = require('path');

console.log('Testing error handling with invalid inputs...');

// Test 1: Missing imageData
console.log('\nTest 1: Missing imageData');
fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    shades: 10,
    format: 'json'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data);
  console.log('Success:', data.success);
  if (!data.success) {
    console.log('Error code:', data.error.code);
    console.log('Error message:', data.error.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});

// Test 2: Invalid shades value
console.log('\nTest 2: Invalid shades value');
fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageData: 'invalid_base64_data',
    shades: 5, // Invalid value, should be between 9-12
    format: 'json'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data);
  console.log('Success:', data.success);
  if (!data.success) {
    console.log('Error code:', data.error.code);
    console.log('Error message:', data.error.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});

// Test 3: Invalid format
console.log('\nTest 3: Invalid format');
fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageData: 'invalid_base64_data',
    shades: 10,
    format: 'xml' // Invalid format, should be json or csv
  })
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data);
  console.log('Success:', data.success);
  if (!data.success) {
    console.log('Error code:', data.error.code);
    console.log('Error message:', data.error.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});

// Test 4: Invalid base64 data
console.log('\nTest 4: Invalid base64 data');
fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageData: 'invalid_base64_data',
    shades: 10,
    format: 'json'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data);
  console.log('Success:', data.success);
  if (!data.success) {
    console.log('Error code:', data.error.code);
    console.log('Error message:', data.error.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});