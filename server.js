const express = require('express');
const path = require('path');
const convertApi = require('./api/convert');

// Create express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Check if running on Vercel
const isVercel = !!process.env.VERCEL || !!process.env.NOW_REGION;

// API routes - always mount at /api
// Vercel's rewrites will forward /api/* requests to this app with the full path
app.use('/api', convertApi);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local development
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;