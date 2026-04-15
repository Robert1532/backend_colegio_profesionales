#!/usr/bin/env node

// Test script to verify all fixes are working

const http = require('http');
const ApiConfig = {
  BASE_URL: 'http://192.168.56.1:3000'
};

const tests = [];

// Test 1: Check if server is running
tests.push({
  name: 'Server Health',
  fn: () => testEndpoint('/api/profesionales', 'GET')
});

// Test 2: Check notificaciones table exists
tests.push({
  name: 'Notificaciones Endpoint',
  fn: () => testEndpoint('/api/notificaciones/1', 'GET')
});

// Test 3: Check file path fixing (historial endpoint)
tests.push({
  name: 'Historial con file paths',
  fn: () => testEndpoint('/api/historiales/profesional/34', 'GET')
});

// Test 4: Check pagos endpoint
tests.push({
  name: 'Pagos Endpoint',
  fn: () => testEndpoint('/api/pagos', 'GET')
});

function testEndpoint(path, method) {
  return new Promise((resolve) => {
    const url = new URL(path, ApiConfig.BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        success: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 RUNNING TESTS\n');
  
  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    try {
      const result = await test.fn();
      if (result.success) {
        console.log('✅ PASS');
      } else {
        console.log(`❌ FAIL (${result.status})`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
    }
  }
  
  console.log('\n✅ Tests complete!\n');
}

runTests();
