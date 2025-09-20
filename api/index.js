const serverlessExpress = require('@codegenie/serverless-express');
const app = require('../server');

// Create and cache the serverless Express instance
const serverlessExpressInstance = serverlessExpress({ app });

// Export the Vercel serverless function handler
module.exports = serverlessExpressInstance;