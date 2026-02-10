# Quick script to commit and push to GitHub

Write-Host "🚀 Pushing DraftDeckAI to GitHub" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check git status
Write-Host "📝 Current Git Status:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Add all files
Write-Host "📦 Adding all files..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green
Write-Host ""

# Commit
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
$commitMessage = "Production ready: Fixed resume generation, PDF export, LinkedIn import message, and added admin panel"
git commit -m "$commitMessage"
Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your code is now on GitHub!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Go to GitHub and verify your code" -ForegroundColor White
    Write-Host "2. Deploy to Vercel: vercel --prod" -ForegroundColor White
    Write-Host "3. Set environment variables in Vercel" -ForegroundColor White
    Write-Host "4. Test your production deployment" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Not connected to internet" -ForegroundColor White
    Write-Host "2. Git remote not configured" -ForegroundColor White
    Write-Host "3. Authentication required" -ForegroundColor White
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "git remote -v  # Check remote" -ForegroundColor White
    Write-Host "git push origin main  # Push manually" -ForegroundColor White
}

Write-Host ""
