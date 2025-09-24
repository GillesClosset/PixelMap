// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileSelectBtn = document.getElementById('fileSelectBtn');
const previewImage = document.getElementById('previewImage');
const imagePreview = document.getElementById('imagePreview');
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
        currentImage.onload = () => {
            // Automatically convert the image when it's uploaded and fully loaded
            convertImageAutomatically();
        };
        currentImage.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
* Automatically converts the uploaded image to a pixel map
 */
async function convertImageAutomatically() {
    if (!currentImage) {
        alert('Veuillez d\'abord télécharger une image.');
        return;
    }
    
    try {
        // Convert image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 70;
        ctx.drawImage(currentImage, 0, 0, 50, 70);
        const imageData = canvas.toDataURL('image/png');
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        
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
    }
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

// Updated printBoth() using CSS aspect-ratio instead of padding-top to prevent spillover

function printBoth() {
    if (!pixelMap || !greyscaleImageData || !currentImage) {
        alert('Aucune donnée à imprimer. Veuillez d\'abord convertir une image.');
        return;
    }

    const pixelWidth = pixelMap[0].length;
    const pixelHeight = pixelMap.length;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Carte de Pixels - Impression</title>
            <style>
                @page { margin: 0.5in; size: A4; }
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .page { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
                .page + .page { page-break-before: always; }
                .ratio-box {
                    width: 95%;
                    aspect-ratio: ${pixelWidth} / ${pixelHeight};
                }
                .ratio-box > img,
                .ratio-box > .pixel-grid {
                    width: 100%;
                    height: 100%;
                    object-fit: fill;
                }
                .pixel-grid {
                    display: grid;
                    grid-template-columns: repeat(${pixelWidth}, 1fr);
                    grid-template-rows: repeat(${pixelHeight}, 1fr);
                }
                .pixel-cell {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    border: 0.25px solid #e0e0e0;
                }
                @media print {
                    .pixel-grid { font-size: 6px; }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="ratio-box">
                    <img src="${currentImage.src}" alt="Image Originale">
                </div>
            </div>
            <div class="page">
                <div class="ratio-box">
                    <div class="pixel-grid">
                        ${pixelMap.map(row => row.map(val => `<div class="pixel-cell">${val}</div>`).join('')).join('')}
                    </div>
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
