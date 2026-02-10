// Package script for DraftDeckAI Extension
// Creates ZIP and TAR.GZ releases

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'zip';

console.log('📦 Packaging DraftDeckAI Extension...\n');

// Get version from manifest
const extensionRoot = path.join(__dirname, '..');
const manifestPath = path.join(extensionRoot, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

console.log(`Version: ${version}`);
console.log(`Format: ${format}\n`);

// Create dist directory
const distDir = path.join(extensionRoot, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Files and directories to include
const includePatterns = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js',
    'settings.html',
    'settings.js',
    'styles.css',
    'content.css',
    'settings.css',
    'config.js',
    'voice-handler.js',
    'voice-interview.js',
    'interviewer-mode.js',
    'mcp-server.js',
    'mcp-config.json',
    'snippet-library.js',
    'company-prep.js',
    'job-hunter.js',
    'analytics-dashboard.js',
    'icons/',
    'README.md',
    'LICENSE'
];

// Files and directories to exclude
const excludePatterns = [
    'node_modules',
    'dist',
    'scripts',
    '.git',
    '.gitignore',
    'package.json',
    'package-lock.json',
    '.DS_Store',
    '*.md',  // Exclude other markdown files except README
    'test-*.js',
    'debug.html',
    'test-page.html',
    '*FIX*.md',
    '*TEST*.md',
    '*GUIDE*.md',
    '*UPDATES*.md',
    '*SUMMARY*.md',
    'TROUBLESHOOTING.md',
    'ENHANCED_README.md'
];

// Build file list
function shouldIncludeFile(filePath) {
    const relativePath = path.relative(extensionRoot, filePath);
    
    // Check excludes
    for (const pattern of excludePatterns) {
        if (relativePath.includes(pattern) || relativePath.match(pattern.replace('*', '.*'))) {
            return false;
        }
    }
    
    // Keep only specified files
    for (const pattern of includePatterns) {
        if (pattern.endsWith('/')) {
            if (relativePath.startsWith(pattern)) return true;
        } else {
            if (relativePath === pattern) return true;
        }
    }
    
    return false;
}

// Create archive name
const archiveName = `draftdeckai-extension-v${version}`;

// Package function
function createZip() {
    console.log('📦 Creating ZIP archive...');
    const zipFile = path.join(distDir, `${archiveName}.zip`);
    
    try {
        // Create a temporary directory for packaging
        const tempDir = path.join(distDir, 'temp');
        const packageDir = path.join(tempDir, 'extension');
        
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
        fs.mkdirSync(packageDir, { recursive: true });
        
        // Copy files
        copyDirectory(extensionRoot, packageDir);
        
        // Create ZIP using PowerShell
        const command = `powershell Compress-Archive -Path "${packageDir}\\*" -DestinationPath "${zipFile}" -Force`;
        execSync(command, { stdio: 'inherit' });
        
        // Cleanup temp directory
        fs.rmSync(tempDir, { recursive: true });
        
        const stats = fs.statSync(zipFile);
        console.log(`✅ Created: ${zipFile}`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
    } catch (error) {
        console.error('❌ Failed to create ZIP:', error.message);
        process.exit(1);
    }
}

function createTar() {
    console.log('📦 Creating TAR.GZ archive...');
    const tarFile = path.join(distDir, `${archiveName}.tar.gz`);
    
    try {
        // Create a temporary directory for packaging
        const tempDir = path.join(distDir, 'temp');
        const packageDir = path.join(tempDir, 'extension');
        
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
        fs.mkdirSync(packageDir, { recursive: true });
        
        // Copy files
        copyDirectory(extensionRoot, packageDir);
        
        // Create TAR.GZ using tar command (requires Git Bash or WSL on Windows)
        // For Windows without tar, we'll create a note
        try {
            const command = `tar -czf "${tarFile}" -C "${tempDir}" extension`;
            execSync(command, { stdio: 'inherit' });
            
            const stats = fs.statSync(tarFile);
            console.log(`✅ Created: ${tarFile}`);
            console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
        } catch (tarError) {
            console.log('⚠️  tar command not found. TAR.GZ creation skipped.');
            console.log('   Install Git Bash or WSL to create .tar.gz files.');
        }
        
        // Cleanup temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
    } catch (error) {
        console.error('❌ Failed to create TAR.GZ:', error.message);
    }
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (!shouldIncludeFile(srcPath)) {
            continue;
        }
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Execute packaging
if (format === 'zip' || format === 'all') {
    createZip();
}

if (format === 'tar' || format === 'all') {
    createTar();
}

console.log('✨ Packaging complete!');
console.log(`\n📁 Output directory: ${distDir}`);
console.log('\n🚀 Ready to release! Upload to GitHub:');
console.log('   1. Go to https://github.com/YOUR_USERNAME/draftdeckai-extension/releases/new');
console.log(`   2. Tag version: v${version}`);
console.log('   3. Upload the archive(s) from dist/');
console.log('   4. Publish release');
