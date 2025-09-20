#!/usr/bin/env node

/**
 * Detailed middleware stack analysis
 */

console.log('🔍 Analyzing Express middleware stack in detail...\n');

try {
  // Clear require cache first
  delete require.cache[require.resolve('./server')];
  
  const app = require('./server');
  
  console.log('📊 Detailed Middleware Stack Analysis:');
  console.log(`Total layers: ${app._router.stack.length}\n`);
  
  app._router.stack.forEach((layer, index) => {
    console.log(`Layer ${index + 1}:`);
    console.log(`  - Pattern: ${layer.regexp.source}`);
    console.log(`  - Fast slash: ${layer.regexp.fast_slash}`);
    console.log(`  - Keys: ${JSON.stringify(layer.keys)}`);
    
    if (layer.route) {
      console.log(`  - Route path: ${layer.route.path}`);
      console.log(`  - Methods: ${Object.keys(layer.route.methods).join(', ')}`);
      console.log(`  - Stack length: ${layer.route.stack.length}`);
    } else {
      console.log(`  - Middleware name: ${layer.handle.name || 'anonymous'}`);
      console.log(`  - Handle type: ${typeof layer.handle}`);
      
      // Check if it's a router
      if (layer.handle.stack) {
        console.log(`  - Sub-router with ${layer.handle.stack.length} layers`);
        layer.handle.stack.forEach((subLayer, subIndex) => {
          if (subLayer.route) {
            console.log(`    ${subIndex + 1}. ${subLayer.route.path} (${Object.keys(subLayer.route.methods).join(', ')})`);
          }
        });
      }
    }
    console.log('');
  });
  
  // Test if this is a fresh import vs cached
  console.log('🔄 Testing module caching behavior:');
  const app2 = require('./server');
  console.log(`Same instance: ${app === app2}`);
  console.log(`App2 layers: ${app2._router.stack.length}`);
  
} catch (error) {
  console.error('❌ Error analyzing middleware stack:', error.message);
}