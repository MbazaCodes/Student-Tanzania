// vercel-build.js
// Debug script for Vercel builds
const { execSync } = require('child_process');

console.log('Starting Vercel build process...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

try {
    console.log('Running npm install...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('Running build...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('Build completed successfully!');
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}
