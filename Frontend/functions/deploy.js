const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting deployment...');
  execSync('firebase deploy --only functions:onBookingCreated', { stdio: 'inherit' });
  console.log('Deployment completed successfully!');
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}
