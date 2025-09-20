const app = require('../server');

// Ensure the app is properly initialized
if (!app || typeof app !== 'function') {
  throw new Error('Failed to load Express app');
}

// Export the Vercel serverless function handler
// Vercel automatically handles Express apps without needing serverless-express
module.exports = app;