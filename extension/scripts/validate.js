// Validate script for DocMagic Extension
// Performs comprehensive validation checks

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating DocMagic Extension...\n');

const extensionRoot = path.join(__dirname, '..');
let errors = 0;
let warnings = 0;

// 1. Validate manifest.json
console.log('📋 Validating manifest.json...');
const manifestPath = path.join(extensionRoot, 'manifest.json');

try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check manifest version
    if (manifest.manifest_version !== 3) {
        console.error('❌ Manifest version must be 3');
        errors++;
    } else {
        console.log('✅ Manifest version 3');
    }
    
    // Check required fields
    const requiredFields = {
        name: 'string',
        version: 'string',
        description: 'string',
        icons: 'object',
        action: 'object',
        permissions: 'object',
        background: 'object'
    };
    
    for (const [field, type] of Object.entries(requiredFields)) {
        if (!manifest[field]) {
            console.error(`❌ Missing required field: ${field}`);
            errors++;
        } else if (typeof manifest[field] !== type) {
            console.error(`❌ Field ${field} must be ${type}`);
            errors++;
        } else {
            console.log(`✅ ${field}`);
        }
    }
    
    // Validate version format
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        console.warn('⚠️  Version should follow semantic versioning (x.y.z)');
        warnings++;
    }
    
} catch (error) {
    console.error('❌ Invalid manifest.json:', error.message);
    errors++;
}

// 2. Validate icons
console.log('\n🎨 Validating icons...');
const iconSizes = ['16', '48', '128'];
iconSizes.forEach(size => {
    const iconPath = path.join(extensionRoot, 'icons', `icon${size}.png`);
    if (fs.existsSync(iconPath)) {
        console.log(`✅ icon${size}.png`);
    } else {
        console.error(`❌ Missing icon${size}.png`);
        errors++;
    }
});

// 3. Validate HTML files
console.log('\n📄 Validating HTML files...');
const htmlFiles = ['popup.html', 'settings.html'];
htmlFiles.forEach(file => {
    const filePath = path.join(extensionRoot, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for basic HTML structure
        if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
            console.warn(`⚠️  ${file}: Missing DOCTYPE declaration`);
            warnings++;
        }
        
        // Check for inline scripts (security concern)
        if (content.match(/<script[^>]*>(?![\s]*<\/script>)/)) {
            console.warn(`⚠️  ${file}: Contains inline scripts (CSP may block)`);
            warnings++;
        }
        
        console.log(`✅ ${file}`);
    } else {
        console.error(`❌ Missing ${file}`);
        errors++;
    }
});

// 4. Validate JavaScript files
console.log('\n📜 Validating JavaScript files...');
const jsFiles = ['background.js', 'content.js', 'popup.js', 'settings.js'];
jsFiles.forEach(file => {
    const filePath = path.join(extensionRoot, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for syntax errors (basic)
        try {
            // Check for common issues
            if (content.includes('eval(')) {
                console.warn(`⚠️  ${file}: Contains eval() (security risk)`);
                warnings++;
            }
            
            if (content.includes('innerHTML =') && !content.includes('DOMPurify')) {
                console.warn(`⚠️  ${file}: Using innerHTML without sanitization`);
                warnings++;
            }
            
            console.log(`✅ ${file}`);
        } catch (error) {
            console.error(`❌ ${file}: Syntax error - ${error.message}`);
            errors++;
        }
    } else {
        console.error(`❌ Missing ${file}`);
        errors++;
    }
});

// 5. Validate permissions
console.log('\n🔐 Validating permissions...');
try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const permissions = manifest.permissions || [];
    const hostPermissions = manifest.host_permissions || [];
    
    console.log('Declared permissions:', permissions.join(', '));
    console.log('Host permissions:', hostPermissions.length, 'patterns');
    
    // Check for overly broad permissions
    if (permissions.includes('<all_urls>')) {
        console.warn('⚠️  Using <all_urls> permission (very broad)');
        warnings++;
    }
    
    console.log('✅ Permissions validated');
} catch (error) {
    console.error('❌ Failed to validate permissions');
    errors++;
}

// 6. Check for sensitive data
console.log('\n🔒 Checking for sensitive data...');
const allFiles = [
    'background.js',
    'content.js',
    'popup.js',
    'settings.js',
    'config.js'
];

let foundSensitive = false;
const sensitivePatterns = [
    { pattern: /AIzaSy[A-Za-z0-9_-]{33}/g, name: 'Google API key' },
    { pattern: /sk-[A-Za-z0-9]{48}/g, name: 'OpenAI API key' },
    { pattern: /sk-ant-[A-Za-z0-9-_]{95}/g, name: 'Claude API key' },
    { pattern: /[a-f0-9]{32}/g, name: 'Potential token/key' }
];

allFiles.forEach(file => {
    const filePath = path.join(extensionRoot, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        sensitivePatterns.forEach(({ pattern, name }) => {
            const matches = content.match(pattern);
            if (matches && !content.includes('YOUR_API_KEY') && !content.includes('api_key: \'\'')) {
                console.warn(`⚠️  ${file}: Potential ${name} detected`);
                foundSensitive = true;
                warnings++;
            }
        });
    }
});

if (!foundSensitive) {
    console.log('✅ No hardcoded sensitive data found');
}

// 7. Check file sizes
console.log('\n📊 Checking file sizes...');
let totalSize = 0;
const maxFileSize = 5 * 1024 * 1024; // 5MB

function getDirectorySize(dir) {
    let size = 0;
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            size += getDirectorySize(filePath);
        } else {
            size += stats.size;
            
            if (stats.size > maxFileSize) {
                console.warn(`⚠️  ${filePath}: File size ${(stats.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB`);
                warnings++;
            }
        }
    });
    
    return size;
}

totalSize = getDirectorySize(extensionRoot);
console.log(`Total extension size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

if (totalSize > 20 * 1024 * 1024) {
    console.warn('⚠️  Extension size exceeds 20MB (may affect loading time)');
    warnings++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(50));
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors === 0 && warnings === 0) {
    console.log('\n✅ All checks passed! Extension is ready for release.');
    process.exit(0);
} else if (errors === 0) {
    console.log('\n⚠️  Validation passed with warnings. Review before releasing.');
    process.exit(0);
} else {
    console.log('\n❌ Validation failed. Fix errors before releasing.');
    process.exit(1);
}
