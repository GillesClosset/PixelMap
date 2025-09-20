#!/usr/bin/env node

/**
 * Diagnostic script to identify Express/Vercel compatibility issues
 */

const express = require('express');
const path = require('path');

console.log('🔍 Starting Express/Vercel compatibility diagnosis...\n');

// Test 1: Basic Express app creation
console.log('📝 Test 1: Basic Express app creation');
try {
  const app = express();
  console.log('✅ Express app created successfully');
  console.log('   - App type:', typeof app);
  console.log('   - App constructor:', app.constructor.name);
} catch (error) {
  console.log('❌ Failed to create Express app:', error.message);
  process.exit(1);
}

// Test 2: Middleware registration
console.log('\n📝 Test 2: Middleware registration');
try {
  const app = express();
  
  // Test basic middleware
  app.use(express.json({ limit: '10mb' }));
  console.log('✅ JSON middleware registered successfully');
  
  app.use(express.static('public'));
  console.log('✅ Static middleware registered successfully');
  
} catch (error) {
  console.log('❌ Failed to register middleware:', error.message);
}

// Test 3: Router creation and mounting
console.log('\n📝 Test 3: Router creation and mounting');
try {
  const app = express();
  const router = express.Router();
  
  // Add a simple route to the router
  router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Router test successful' });
  });
  
  console.log('✅ Router created and route added successfully');
  
  // Test mounting the router
  app.use('/api', router);
  console.log('✅ Router mounted at /api successfully');
  
} catch (error) {
  console.log('❌ Failed to create/mount router:', error.message);
}

// Test 4: Import our convert router
console.log('\n📝 Test 4: Import convert router');
try {
  const convertRouter = require('./api/convert');
  console.log('✅ Convert router imported successfully');
  console.log('   - Router type:', typeof convertRouter);
  console.log('   - Router constructor:', convertRouter.constructor.name);
  
  // Check if it's a proper Express router
  if (typeof convertRouter === 'function' && convertRouter.stack) {
    console.log('   - Router stack length:', convertRouter.stack.length);
    console.log('   - Routes registered:');
    convertRouter.stack.forEach((layer, index) => {
      console.log(`     ${index + 1}. ${layer.route ? layer.route.path : 'middleware'} (${layer.route ? Object.keys(layer.route.methods).join(', ') : 'N/A'})`);
    });
  } else {
    console.log('⚠️  Convert router doesn\'t look like a standard Express router');
  }
  
} catch (error) {
  console.log('❌ Failed to import convert router:', error.message);
  console.log('   - Error stack:', error.stack);
}

// Test 5: Import utils/imageProcessor
console.log('\n📝 Test 5: Import imageProcessor utilities');
try {
  const imageProcessor = require('./utils/imageProcessor');
  console.log('✅ imageProcessor imported successfully');
  console.log('   - Exported functions:', Object.keys(imageProcessor));
  
  // Test each exported function exists and is callable
  Object.keys(imageProcessor).forEach(funcName => {
    const func = imageProcessor[funcName];
    if (typeof func === 'function') {
      console.log(`   ✅ ${funcName} is a function`);
    } else {
      console.log(`   ❌ ${funcName} is not a function (${typeof func})`);
    }
  });
  
} catch (error) {
  console.log('❌ Failed to import imageProcessor:', error.message);
}

// Test 6: Test our server.js structure
console.log('\n📝 Test 6: Server.js structure analysis');
try {
  const serverApp = require('./server');
  console.log('✅ Server.js imported successfully');
  console.log('   - Server type:', typeof serverApp);
  console.log('   - Server constructor:', serverApp.constructor.name);
  
  // Check for duplicate routes
  if (serverApp._router && serverApp._router.stack) {
    console.log('   - Total middleware/routes:', serverApp._router.stack.length);
    
    const routes = {};
    serverApp._router.stack.forEach((layer, index) => {
      const path = layer.route ? layer.route.path : (layer.regexp.source || 'middleware');
      const methods = layer.route ? Object.keys(layer.route.methods) : ['middleware'];
      
      methods.forEach(method => {
        const key = `${method.toUpperCase()} ${path}`;
        routes[key] = (routes[key] || 0) + 1;
        
        if (routes[key] > 1) {
          console.log(`   ⚠️  Duplicate route detected: ${key} (${routes[key]} times)`);
        }
      });
    });
  }
  
} catch (error) {
  console.log('❌ Failed to import server.js:', error.message);
}

// Test 7: Vercel deployment structure check
console.log('\n📝 Test 7: Vercel deployment structure');
try {
  const apiIndex = require('./api/index');
  console.log('✅ api/index.js imported successfully');
  console.log('   - API Index type:', typeof apiIndex);
  console.log('   - API Index constructor:', apiIndex.constructor.name);
  
  // Check if it's the same as the server
  const serverApp = require('./server');
  if (apiIndex === serverApp) {
    console.log('   ✅ api/index.js correctly exports the same app as server.js');
  } else {
    console.log('   ⚠️  api/index.js exports a different object than server.js');
  }
  
} catch (error) {
  console.log('❌ Failed to import api/index.js:', error.message);
}

// Test 8: Check for potential circular dependencies
console.log('\n📝 Test 8: Circular dependency check');
try {
  // Clear require cache to test fresh imports
  delete require.cache[require.resolve('./server')];
  delete require.cache[require.resolve('./api/index')];
  delete require.cache[require.resolve('./api/convert')];
  delete require.cache[require.resolve('./utils/imageProcessor')];
  
  console.log('✅ Require cache cleared');
  
  // Try importing in different orders
  const imageProcessor = require('./utils/imageProcessor');
  const convertRouter = require('./api/convert');
  const serverApp = require('./server');
  const apiIndex = require('./api/index');
  
  console.log('✅ All modules imported successfully in sequence');
  
} catch (error) {
  console.log('❌ Circular dependency or import issue detected:', error.message);
}

console.log('\n🏁 Diagnosis complete!');
console.log('\nRecommendations based on findings will be provided after running this script.');