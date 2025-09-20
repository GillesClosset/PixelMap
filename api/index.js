const serverlessExpress = require('@codegenie/serverless-express');
const app = require('../server');

// Ensure the app is properly initialized
if (!app || typeof app !== 'function') {
  throw new Error('Failed to load Express app');
}

// Create and cache the serverless Express instance
const serverlessExpressInstance = serverlessExpress({
  app: app,
  // Add error handling
  onError: (err) => {
    console.error('Serverless Express error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error'
      })
    };
  }
});

// Export the Vercel serverless function handler
module.exports = serverlessExpressInstance;