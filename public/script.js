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

function getSelectedShades() {
    const selected = document.querySelector('input[name="shades"]:checked');
    return selected ? parseInt(selected.value) : 12;
}

function convertImage() {
    if (!currentImage) {
        alert('Veuillez d\'abord télécharger une image.');
        return;
    }
    
    // Show progress bar
    progressBar.style.display = 'block';
    convertBtn.disabled = true;
    
    // Simulate processing delay for UI feedback
    setTimeout(() => {
        try {
            // Process the image
            const result = processImageToPixelMap(currentImage, 50, 70, getSelectedShades());
            pixelMap = result.pixelMap;
            greyscaleImageData = result.greyscaleImageData;
            
            // Update progress
            progressFill.style.width = '100%';
            
            // Display the results
            displayGreyscaleImage(greyscaleImageData);
            displayPixelMap(pixelMap);
            
            // Show output section
            outputSection.style.display = 'block';
            
            // Scroll to output
            outputSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Une erreur s\'est produite lors du traitement de l\'image. Veuillez réessayer.');
            convertBtn.disabled = false;
        } finally {
            // Hide progress bar after a short delay
            setTimeout(() => {
                progressBar.style.display = 'none';
                progressFill.style.width = '0%';
                convertBtn.disabled = false;
            }, 500);
        }
    }, 300);
}

function processImageToPixelMap(image, width, height, shades) {
    // Create a canvas to process the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Draw and resize the image on the canvas
    ctx.drawImage(image, 0, 0, width, height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create pixel map array
    const map = [];
    
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
            cell.textContent = map[y][x].toString().padStart(2, '0');
            pixelMapContainer.appendChild(cell);
        }
    }
}

// Store original image data for PDF generation
let originalImageData = null;

function downloadPDF() {
    if (!pixelMap || !greyscaleImageData || !currentImage) {
        alert('Aucune donnée à télécharger. Veuillez d\'abord convertir une image.');
        return;
    }
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Carte de Pixels - PDF</title>
            <style>
                @page {
                    margin: 10px;
                    size: A4;
                }
                
                @media print {
                    html, body {
                        margin: 10px;
                        padding: 0;
                        width: calc(100% - 20px);
                        height: calc(100% - 20px);
                    }
                }
                
                body {
                    font-family: Arial, sans-serif;
                    margin: 10px;
                    padding: 0;
                    width: calc(100% - 20px);
                    height: calc(100% - 20px);
                }
                
                .page {
                    width: 100%;
                    height: 100vh;
                    page-break-after: always;
                    position: relative;
                    overflow: hidden;
                }
                
                .page:last-child {
                    page-break-after: avoid;
                }
                
                .page:first-child {
                    page-break-after: always;
                }
                
                .page:nth-child(2) {
                    page-break-after: avoid;
                }
                
                .page img, .page canvas {
                    width: 98%;
                    height: 98%;
                    object-fit: fill;
                    display: block;
                    margin: 1%;
                    padding: 0;
                }
                
                .pixel-grid {
                    display: grid;
                    grid-template-columns: repeat(${pixelMap[0].length}, 1fr);
                    grid-template-rows: repeat(${pixelMap.length}, 1fr);
                    gap: 0;
                    width: 98%;
                    height: 98%;
                    font-size: 8px;
                    overflow: hidden;
                    box-sizing: border-box;
                    margin: 1%;
                }
                
                .pixel-cell {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin: 0;
                    padding: 0;
                    border: none;
                    box-sizing: border-box;
                }
                
                @media print {
                    body {
                        margin: 0;
                        font-size: 6px;
                    }
                    
                    .pixel-grid {
                        font-size: 5px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <canvas id="pdfCanvas" width="${pixelMap[0].length}" height="${pixelMap.length}"></canvas>
            </div>
            <div class="page">
                <div class="pixel-grid" id="pdfPixelGrid">
    `);
    
    // Add pixel map cells without headers
    for (let y = 0; y < pixelMap.length; y++) {
        for (let x = 0; x < pixelMap[y].length; x++) {
            printWindow.document.write(`<div class="pixel-cell">${pixelMap[y][x].toString().padStart(2, '0')}</div>`);
        }
    }
    
    printWindow.document.write(`
                </div>
            </div>
            <script>
                // Draw the greyscale image on the canvas
                window.onload = function() {
                    const canvas = document.getElementById('pdfCanvas');
                    const ctx = canvas.getContext('2d');
                    const imageData = ctx.createImageData(${pixelMap[0].length}, ${pixelMap.length});
                    
                    // Copy the image data
                    const data = imageData.data;
                    const sourceData = [${Array.from(greyscaleImageData.data)}];
                    
                    for (let i = 0; i < data.length; i++) {
                        data[i] = sourceData[i];
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                    
                    // Apply pixelated rendering
                    ctx.imageSmoothingEnabled = false;
                    canvas.style.imageRendering = 'pixelated';
                    canvas.style.imageRendering = '-moz-crisp-edges';
                    canvas.style.imageRendering = 'crisp-edges';
                    
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

function printBoth() {
    if (!pixelMap || !greyscaleImageData) {
        alert('Aucune donnée à imprimer. Veuillez d\'abord convertir une image.');
        return;
    }
    
    downloadPDF();
}

// Initialize
convertBtn.disabled = true;