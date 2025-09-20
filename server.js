const express = require('express');
const path = require('path');

// Create express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Check if running on Vercel
const isVercel = !!process.env.VERCEL || !!process.env.NOW_REGION;

// For local development, import the api logic directly to avoid routing conflicts
if (!isVercel) {
  // Import the same self-contained API handler used by Vercel
  const apiHandler = require('./api/index');
  app.use('/api', apiHandler);
}

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