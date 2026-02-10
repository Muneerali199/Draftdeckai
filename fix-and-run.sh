#!/bin/bash
# Fix CSS Syntax Error Script

echo "Fixing CSS syntax error..."

# Navigate to project directory
cd "C:\Users\Muneer Ali Subzwari\Desktop\draftdeckai\DraftDeckAI"

# Fix the CSS file using PowerShell
powershell -Command "(Get-Content 'app\globals.css') -replace '@apply text-2xl sm: text-4xl md: text-5xl lg: text-7xl', '@apply text-2xl sm:text-4xl md:text-5xl lg:text-7xl' | Set-Content 'app\globals.css'"

echo "CSS fixed! Clearing cache..."

# Clear Next.js cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

echo "Cache cleared! Starting dev server..."

# Start dev server
npm run dev
