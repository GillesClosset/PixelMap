const fs = require('fs');
const axios = require('axios');

// Read the image file
const imageData = fs.readFileSync('image0000001.png');

// Convert to base64
const base64Image = imageData.toString('base64');

// Send request to the API
axios.post('http://localhost:3000/api/convert', {
  imageData: base64Image,
  format: 'pdf'
}, {
  responseType: 'arraybuffer'
})
.then(response => {
  // Save the PDF
  fs.writeFileSync('test_output.pdf', response.data);
  console.log('PDF generated successfully!');
})
.catch(error => {
  console.error('Error generating PDF:', error.message);
  if (error.response) {
    console.error('Response data:', error.response.data.toString());
  }
});