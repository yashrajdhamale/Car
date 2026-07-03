const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Remove .env file temporarily if it exists
const envPath = path.join(__dirname, '.env');
let envExists = false;
let envContent = '';

if (fs.existsSync(envPath)) {
  envExists = true;
  envContent = fs.readFileSync(envPath, 'utf8');
  fs.unlinkSync(envPath);
  console.log('Temporarily removed .env file for deployment');
}

try {
  console.log('Starting deployment...');
  execSync('firebase deploy --only functions:onBookingCreated', { stdio: 'inherit' });
  console.log('Deployment completed successfully!');
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
} finally {
  // Restore .env file if it existed
  if (envExists) {
    fs.writeFileSync(envPath, envContent);
    console.log('Restored .env file after deployment');
  }
}
