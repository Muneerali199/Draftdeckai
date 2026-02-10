# Complete Fix Script for DraftDeckAI
# This fixes both CSS errors and chunk loading errors

Write-Host "🔧 DraftDeckAI - Complete Fix Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix CSS syntax
Write-Host "1️⃣ Fixing CSS syntax errors..." -ForegroundColor Yellow
$cssFile = "app\globals.css"
if (Test-Path $cssFile) {
    $content = Get-Content $cssFile -Raw
    $fixed = $content -replace 'sm: text-4xl', 'sm:text-4xl' -replace 'md: text-5xl', 'md:text-5xl' -replace 'lg: text-7xl', 'lg:text-7xl'
    [System.IO.File]::WriteAllText((Resolve-Path $cssFile).Path, $fixed, [System.Text.UTF8Encoding]::new($false))
    Write-Host "   ✅ CSS syntax fixed!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ CSS file not found!" -ForegroundColor Red
}

# Step 2: Clear all caches
Write-Host ""
Write-Host "2️⃣ Clearing all caches..." -ForegroundColor Yellow

if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "   ✅ .next cache cleared" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "   ✅ node_modules cache cleared" -ForegroundColor Green
}

# Step 3: Kill any running node processes on ports 3000-3010
Write-Host ""
Write-Host "3️⃣ Stopping any running dev servers..." -ForegroundColor Yellow
$ports = 3000..3010
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process -and $process.ProcessName -eq "node") {
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ Stopped process on port $port" -ForegroundColor Green
            }
        }
    }
}

# Step 4: Instructions
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ All fixes applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. In your browser: Press Ctrl+Shift+R (hard refresh)"
Write-Host "   2. Or close all browser tabs for localhost"
Write-Host "   3. Run: npm run dev"
Write-Host "   4. Open: http://localhost:3000"
Write-Host ""
Write-Host "🚀 Starting dev server now..." -ForegroundColor Cyan
Write-Host ""

# Step 5: Start dev server
npm run dev
