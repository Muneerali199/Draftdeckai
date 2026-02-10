// Build script for DraftDeckAI Extension
// Validates manifest and prepares for packaging

const fs = require('fs');
const path = require('path');

console.log('🔨 Building DraftDeckAI Extension...\n');

// Define extension root
const extensionRoot = path.join(__dirname, '..');

// Validate manifest.json
console.log('📋 Validating manifest.json...');
const manifestPath = path.join(extensionRoot, 'manifest.json');
try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields.join(', '));
        process.exit(1);
    }
    
    console.log(`✅ Manifest valid (v${manifest.version})`);
} catch (error) {
    console.error('❌ Invalid manifest.json:', error.message);
    process.exit(1);
}

// Check required files
console.log('\n📂 Checking required files...');
const requiredFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js',
    'settings.html',
    'settings.js',
    'styles.css',
    'content.css',
    'icons/icon16.png',
    'icons/icon48.png',
    'icons/icon128.png'
];

let allFilesPresent = true;
requiredFiles.forEach(file => {
    const filePath = path.join(extensionRoot, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesPresent = false;
    }
});

if (!allFilesPresent) {
    console.error('\n❌ Build failed: Missing required files');
    process.exit(1);
}

// Check for sensitive data
console.log('\n🔒 Checking for sensitive data...');
const jsFiles = [
    'background.js',
    'content.js',
    'popup.js',
    'settings.js'
];

let foundSensitiveData = false;
const sensitivePatterns = [
    /AIzaSy[A-Za-z0-9_-]{33}/g,  // Google API keys
    /sk-[A-Za-z0-9]{48}/g,        // OpenAI keys
    /sk-ant-[A-Za-z0-9-_]{95}/g,  // Claude keys
];

jsFiles.forEach(file => {
    const filePath = path.join(extensionRoot, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        sensitivePatterns.forEach(pattern => {
            if (pattern.test(content)) {
                console.warn(`⚠️  Potential API key found in ${file}`);
                foundSensitiveData = true;
            }
        });
    }
});

if (foundSensitiveData) {
    console.log('⚠️  Warning: Potential sensitive data detected. Please review before releasing.');
} else {
    console.log('✅ No sensitive data detected');
}

console.log('\n✨ Build completed successfully!');
console.log('\n📦 Ready to package. Run:');
console.log('   npm run package:zip  - Create ZIP file');
console.log('   npm run package:tar  - Create TAR.GZ file');
console.log('   npm run package:all  - Create both formats');
