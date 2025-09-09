// Test Discord URL mapping
console.log('🧪 Testing Discord URL mapping...');

// Test the mapping
fetch('/api/discord-test')
  .then(response => {
    console.log('✅ Discord URL mapping test - Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Discord URL mapping working!', data);
  })
  .catch(error => {
    console.log('❌ Discord URL mapping failed:', error.message);
  });

// Test health endpoint
fetch('/api/health')
  .then(response => {
    console.log('✅ Health endpoint - Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Health endpoint working!', data);
  })
  .catch(error => {
    console.log('❌ Health endpoint failed:', error.message);
  });
