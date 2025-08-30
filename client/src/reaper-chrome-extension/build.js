const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create Chrome extension directory
const chromeDir = 'chrome-extension';
const sourceDir = '.';

  // Files to include in Chrome extension
  const includeFiles = [
    'manifest-chrome.json',
    'cookie-reaper-service-worker.js',
    'interface/',
    'icons/'
  ];

  // Files to exclude
  const excludeFiles = [
    'manifest.json',
    'cookie-editor.js',
    'manifest-chrome.json',
    'cookie-reaper-service-worker.js',
    'package.json',
    'build.js',
    'chrome-extension/',
    'node_modules/'
  ];

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildChromeExtension() {
  console.log('Building Chrome extension...');
  
  // Clean and create chrome extension directory
  if (fs.existsSync(chromeDir)) {
    fs.rmSync(chromeDir, { recursive: true, force: true });
  }
  fs.mkdirSync(chromeDir);
  
  // Copy manifest and rename it
  fs.copyFileSync('manifest-chrome.json', path.join(chromeDir, 'manifest.json'));
  
  // Copy main service worker
  fs.copyFileSync('cookie-reaper-service-worker.js', path.join(chromeDir, 'cookie-reaper-service-worker.js'));
  
  // Copy interface directory
  copyDirectory('interface', path.join(chromeDir, 'interface'));
  
  // Ensure first launch popup is copied
  if (!fs.existsSync(path.join(chromeDir, 'interface', 'popup'))) {
    fs.mkdirSync(path.join(chromeDir, 'interface', 'popup'), { recursive: true });
  }
  
  // Copy icons directory
  copyDirectory('icons', path.join(chromeDir, 'icons'));
  
  console.log('Chrome extension built successfully in:', chromeDir);
}

function packageChromeExtension() {
  console.log('Packaging Chrome extension...');
  
  const output = fs.createWriteStream('cookie-reaper-chrome.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });
  
  output.on('close', () => {
    console.log('Chrome extension packaged successfully: cookie-reaper-chrome.zip');
    console.log('Total size:', (archive.pointer() / 1024 / 1024).toFixed(2), 'MB');
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory(chromeDir, false);
  archive.finalize();
}

// Main execution
const args = process.argv.slice(2);
const shouldPackage = args.includes('--package');

try {
  buildChromeExtension();
  
  if (shouldPackage) {
    packageChromeExtension();
  }
  
  console.log('\nTo install in Chrome:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked" and select the "chrome-extension" folder');
  console.log('\nTo create a CRX file:');
  console.log('1. Load the extension as above');
  console.log('2. Click "Pack extension"');
  console.log('3. Select the "chrome-extension" folder as the root directory');
  
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
