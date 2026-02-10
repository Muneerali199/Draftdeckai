#!/bin/bash

# PWA Feature Test Script for DraftDeckAI
# This script helps verify PWA implementation

echo "🚀 DraftDeckAI PWA Feature Test"
echo "============================="

# Check if required files exist
echo "📁 Checking PWA Files..."

FILES=(
    "public/manifest.json"
    "public/sw.js" 
    "public/offline.html"
    "public/browserconfig.xml"
    "hooks/use-pwa-install.ts"
    "components/pwa-install-button.tsx"
    "components/pwa-banner.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "📋 Manifest.json Validation..."

# Check if manifest.json is valid JSON
if command -v jq &> /dev/null; then
    if jq empty public/manifest.json 2>/dev/null; then
        echo "✅ manifest.json is valid JSON"
        
        # Check required manifest fields
        REQUIRED_FIELDS=("name" "short_name" "start_url" "display" "icons")
        
        for field in "${REQUIRED_FIELDS[@]}"; do
            if jq -e ".$field" public/manifest.json > /dev/null 2>&1; then
                echo "✅ Manifest has required field: $field"
            else
                echo "❌ Manifest missing required field: $field"
            fi
        done
    else
        echo "❌ manifest.json is invalid JSON"
    fi
else
    echo "⚠️  jq not installed, skipping JSON validation"
fi

echo ""
echo "🔧 Next.js Configuration..."

# Check if next-pwa is configured
if grep -q "withPWA" next.config.js; then
    echo "✅ next-pwa configured in next.config.js"
else
    echo "❌ next-pwa not found in next.config.js"
fi

echo ""
echo "📦 Dependencies..."

# Check if next-pwa is installed
if npm list next-pwa &> /dev/null; then
    echo "✅ next-pwa is installed"
else
    echo "❌ next-pwa is not installed"
fi

echo ""
echo "🌐 Build Check..."

# Check if build files exist (after npm run build)
if [ -f "public/sw.js" ]; then
    echo "✅ Service worker generated"
else
    echo "⚠️  Service worker not found (run 'npm run build' first)"
fi

if [ -f "public/workbox-"*.js ]; then
    echo "✅ Workbox files generated"
else
    echo "⚠️  Workbox files not found (run 'npm run build' first)"
fi

echo ""
echo "📱 PWA Components..."

# Check if PWA components are imported in layout
if grep -q "PWABanner" app/layout.tsx; then
    echo "✅ PWABanner imported in layout"
else
    echo "❌ PWABanner not imported in layout"
fi

if grep -q "PWAInstallButton" components/site-header.tsx; then
    echo "✅ PWAInstallButton imported in header"
else
    echo "❌ PWAInstallButton not imported in header"
fi

echo ""
echo "🔍 Manual Testing Instructions:"
echo "1. Run 'npm run build && npm start'"
echo "2. Open http://localhost:3000 in Chrome"
echo "3. Open DevTools > Application tab"
echo "4. Check Manifest and Service Workers sections"
echo "5. Look for install button in header"
echo "6. Test offline functionality by disabling network"
echo ""
echo "🏆 PWA Audit:"
echo "1. Open DevTools > Lighthouse tab"
echo "2. Select 'Progressive Web App' category"
echo "3. Run audit to check PWA compliance"
echo ""
echo "✅ PWA Feature Test Complete!"
