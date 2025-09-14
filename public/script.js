// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileSelectBtn = document.getElementById('fileSelectBtn');
const previewImage = document.getElementById('previewImage');
const imagePreview = document.getElementById('imagePreview');
const convertBtn = document.getElementById('convertBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const outputSection = document.getElementById('outputSection');
const pixelMapContainer = document.getElementById('pixelMapContainer');
const greyscaleCanvas = document.getElementById('greyscaleCanvas');
const printBtn = document.getElementById('printBtn');
const downloadBtn = document.getElementById('downloadBtn');

// State
let currentImage = null;
let pixelMap = null;
let greyscaleImageData = null;

// Event Listeners
fileSelectBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '#d0d8e0';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.backgroundColor = '#f0f4f8';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '#f0f4f8';
    
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});


convertBtn.addEventListener('click', convertImage);

printBtn.addEventListener('click', printBoth);

downloadBtn.addEventListener('click', downloadPDF);
// Functions
function handleFileSelect() {
    const file = fileInput.files[0];
    
    if (!file || !file.type.match('image.*')) {
        alert('Veuillez sélectionner un fichier image valide.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        imagePreview.style.display = 'block';
        currentImage = new Image();
        currentImage.src = e.target.result;
        // Store original image data for PDF generation
        originalImageData = e.target.result;
        convertBtn.disabled = false;
    };
    
    reader.readAsDataURL(file);
}

/**
* Checks if image data is already greyscale
* @param {Uint8ClampedArray} data - Image data array
* @param {number} width - Image width
* @param {number} height - Image height
* @returns {boolean} True if image is greyscale
*/
function isGreyscale(data, width, height) {
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

async function convertImage() {
    if (!currentImage) {
        alert('Veuillez d\'abord télécharger une image.');
        return;
    }
    
    // Show progress bar
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    convertBtn.disabled = true;
    downloadBtn.disabled = true;
    
    try {
        // Update progress
        progressFill.style.width = '30%';
        
        // Convert image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 70;
        ctx.drawImage(currentImage, 0, 0, 50, 70);
        const imageData = canvas.toDataURL('image/png');
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        
        // Update progress
        progressFill.style.width = '60%';
        
        // Send request to API
        const response = await fetch('/api/convert', {
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
        
        // Update progress
        progressFill.style.width = '90%';
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error.message || 'Erreur de traitement');
        }
        // Store the pixel map data
        pixelMap = result.data.pixelMap;
        
        // Generate and store greyscale image data for printing
        const printCanvas = document.createElement('canvas');
        const printCtx = printCanvas.getContext('2d');
        const targetWidth = 50;
        const targetHeight = 70;
        printCanvas.width = targetWidth;
        printCanvas.height = targetHeight;
        
        // Create ImageData from pixelMap
        const printImageData = printCtx.createImageData(targetWidth, targetHeight);
        const printData = printImageData.data;
        
        // Fill image data from pixelMap
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const idx = (y * targetWidth + x) * 4;
                // Convert shade (0-9) back to greyscale value (0-255)
                const shadeValue = 255 - (pixelMap[y][x] * 255 / 9);
                
                printData[idx] = shadeValue;     // R
                printData[idx + 1] = shadeValue; // G
                printData[idx + 2] = shadeValue; // B
                printData[idx + 3] = 255;        // A
            }
        }
        
        greyscaleImageData = printImageData;
        
        // Update progress
        progressFill.style.width = '100%';
        
        
        // Display the results
        displayPixelMap(pixelMap);
        
        // Show output section
        outputSection.style.display = 'block';
        
        // Scroll to output
        outputSection.scrollIntoView({ behavior: 'smooth' });
        
        // Display the greyscale image
        displayGreyscaleImage(greyscaleImageData);
    } catch (error) {
        console.error('Error processing image:', error);
        alert(`Une erreur s'est produite lors du traitement de l'image: ${error.message}`);
    } finally {
        // Hide progress bar after a short delay
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
            convertBtn.disabled = false;
            downloadBtn.disabled = false;
        }, 500);
    }
}

function processImageToPixelMap(image, width, height) {
    // Create a canvas to process the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Set image rendering to pixelated for crisp pixels
    ctx.imageSmoothingEnabled = false;
    
    // Draw and resize the image on the canvas
    ctx.drawImage(image, 0, 0, width, height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Check if image is already greyscale
    const alreadyGreyscale = isGreyscale(data, width, height);
    
    // Create pixel map array
    const map = [];
    
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
        map.push(row);
    }
    
    return {
        pixelMap: map,
        greyscaleImageData: imageData
    };
}

function displayGreyscaleImage(imageData) {
    const ctx = greyscaleCanvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
}

function displayPixelMap(map) {
    // Clear previous content
    pixelMapContainer.innerHTML = '';
    
    // Create grid cells
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const cell = document.createElement('div');
            cell.className = 'pixel-cell';
            cell.textContent = map[y][x];
            pixelMapContainer.appendChild(cell);
        }
    }
}

// Store original image data for PDF generation
let originalImageData = null;

async function downloadPDF() {
    if (!currentImage) {
        alert('Aucune donnée à télécharger. Veuillez d\'abord convertir une image.');
        return;
    }
    
    try {
        // Show progress indicator
        progressBar.style.display = 'block';
        progressFill.style.width = '30%';
        downloadBtn.disabled = true;
        
        // Convert image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 70;
        ctx.drawImage(currentImage, 0, 0, 50, 70);
        const imageData = canvas.toDataURL('image/png');
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        
        // Update progress
        progressFill.style.width = '60%';
        
        // Send request to API for PDF generation
        const response = await fetch('/api/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageData: base64Data,
                shades: 10,
                format: 'pdf'
            })
        });
        
        // Update progress
        progressFill.style.width = '90%';
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Get the PDF blob
        const blob = await response.blob();
        
        // Update progress
        progressFill.style.width = '100%';
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'carte-pixels.pdf';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert(`Une erreur s'est produite lors du téléchargement du PDF: ${error.message}`);
    } finally {
        // Hide progress bar
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
            downloadBtn.disabled = false;
        }, 500);
    }
}

function printBoth() {
    if (!pixelMap || !greyscaleImageData) {
        alert('Aucune donnée à imprimer. Veuillez d\'abord convertir une image.');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Carte de Pixels - Impression</title>
            <style>
                @page {
                    margin: 0;
                    size: A4;
                }
                
                @media print {
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                    }
                }
                
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                }
                
                .page {
                    width: 100%;
                    height: 100vh;
                    page-break-after: always;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    box-sizing: border-box;
                }
                
                .page:last-child {
                    page-break-after: avoid;
                }
                
                .page-title {
                    position: absolute;
                    top: 10px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: #33;
                    margin-bottom: 20px;
                }
                
                .page-content {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                }
                
                .page img {
                    max-width: 90%;
                    max-height: 80%;
                    object-fit: contain;
                    border: 1px solid #ccc;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                
                .pixel-grid {
                    display: grid;
                    grid-template-columns: repeat(${pixelMap[0].length}, 1fr);
                    grid-template-rows: repeat(${pixelMap.length}, 1fr);
                    gap: 0;
                    width: 90%;
                    height: 80%;
                    font-size: 12px;
                    overflow: hidden;
                    box-sizing: border-box;
                    border: 1px solid #ccc;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                
                .pixel-cell {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin: 0;
                    padding: 0;
                    border: 0.5px solid #e0e0e0;
                    box-sizing: border-box;
                    font-size: 10px;
                    background-color: white;
                }
                
                @media print {
                    body {
                        margin: 0;
                        font-size: 10px;
                    }
                    
                    .pixel-grid {
                        font-size: 8px;
                    }
                    
                    .page-title {
                        font-size: 20px;
                    }
                }
                
                .legend {
                    position: absolute;
                    bottom: 20px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="page-title">Image Originale</div>
                <div class="page-content">
                    <img src="${originalImageData}" alt="Original Image">
                </div>
                <div class="legend">Page 1: Image originale</div>
            </div>
            <div class="page">
                <div class="page-title">Carte de Pixels</div>
                <div class="page-content">
                    <div class="pixel-grid" id="pdfPixelGrid">
    `);
    
    // Add pixel map cells without headers
    for (let y = 0; y < pixelMap.length; y++) {
        for (let x = 0; x < pixelMap[y].length; x++) {
            printWindow.document.write(`<div class="pixel-cell">${pixelMap[y][x]}</div>`);
        }
    }
    
    printWindow.document.write(`
                    </div>
                </div>
                <div class="legend">Page 2: Carte de pixels (0-9)</div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Initialize
convertBtn.disabled = true;