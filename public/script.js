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
const downloadBtn = document.getElementById('downloadBtn');
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

downloadBtn.addEventListener('click', downloadPDF);

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

function downloadPDF() {
    if (!pixelMap || !greyscaleImageData) {
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
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .page {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    page-break-after: always;
                }
                .page:last-child {
                    page-break-after: avoid;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                canvas {
                    image-rendering: pixelated;
                    image-rendering: -moz-crisp-edges;
                    image-rendering: crisp-edges;
                    border: 1px solid #ccc;
                    width: 500px;
                    height: 700px;
                    max-width: 80%;
                    max-height: 60%;
                }
                .pixel-grid {
                    display: grid;
                    grid-template-columns: repeat(51, 1fr);
                    gap: 1px;
                    font-size: 6px;
                    max-width: 90%;
                    max-height: 70%;
                    overflow: hidden;
                    border: 1px solid #000;
                }
                .pixel-cell {
                    text-align: center;
                    padding: 1px;
                    border: 1px solid #ccc;
                }
                .header-cell {
                    background-color: #ddd;
                    font-weight: bold;
                }
                .row-header {
                    background-color: #eee;
                    font-weight: bold;
                }
                @media print {
                    body {
                        margin: 0;
                        font-size: 6px;
                    }
                    canvas {
                        width: 500px;
                        height: 700px;
                    }
                    .pixel-grid {
                        font-size: 5px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    <h1>Image en Pixels Gris</h1>
                    <p>Dimensions: 50x70 | Nuances: ${getSelectedShades()} | Date: ${new Date().toLocaleString('fr-FR')}</p>
                </div>
                <canvas id="pdfCanvas" width="50" height="70"></canvas>
            </div>
            <div class="page">
                <div class="header">
                    <h1>Carte de Pixels</h1>
                    <p>Dimensions: 50x70 | Nuances: ${getSelectedShades()} | Date: ${new Date().toLocaleString('fr-FR')}</p>
                </div>
                <div class="pixel-grid" id="pdfPixelGrid">
    `);
    
    // Add column headers (0-49)
    printWindow.document.write('<div class="pixel-cell header-cell"></div>'); // Top-left corner
    for (let x = 0; x < 50; x++) {
        printWindow.document.write(`<div class="pixel-cell header-cell">${x}</div>`);
    }
    
    // Add rows with row headers
    for (let y = 0; y < pixelMap.length; y++) {
        // Row header
        printWindow.document.write(`<div class="pixel-cell row-header">${y}</div>`);
        // Row cells
        for (let x = 0; x < pixelMap[y].length; x++) {
            printWindow.document.write(`<div class="pixel-cell">${pixelMap[y][x].toString().padStart(2, '0')}</div>`);
        }
    }
    
    printWindow.document.write(`
                </div>
            </div>
            <script>
                // Draw the greyscale image on the canvas
                const canvas = document.getElementById('pdfCanvas');
                const ctx = canvas.getContext('2d');
                const imageData = ctx.createImageData(50, 70);
                
                // Copy the image data
                const data = imageData.data;
                const sourceData = [${Array.from(greyscaleImageData.data)}];
                
                for (let i = 0; i < data.length; i++) {
                    data[i] = sourceData[i];
                }
                
                ctx.putImageData(imageData, 0, 0);
                
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

function printBoth() {
    if (!pixelMap || !greyscaleImageData) {
        alert('Aucune donnée à imprimer. Veuillez d\'abord convertir une image.');
        return;
    }
    
    downloadPDF();
}

// Initialize
convertBtn.disabled = true;