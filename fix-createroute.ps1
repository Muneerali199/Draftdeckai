# Script to add await to all createRoute() calls in API routes
$files = @(
    "app\api\user\route.ts",
    "app\api\templates\route.ts",
    "app\api\stripe\webhook\route.ts",
    "app\api\stripe\create-portal-session\route.ts",
    "app\api\stripe\create-portal\route.ts",
    "app\api\stripe\create-checkout-session\route.ts",
    "app\api\stripe\create-payment-intent\route.ts",
    "app\api\stripe\create-checkout\route.ts",
    "app\api\stripe\check-subscription\route.ts",
    "app\api\presentations\regenerate-image\route.ts",
    "app\api\generate\website\route.ts",
    "app\api\documents\create-from-template\route.ts",
    "app\api\documents\[id]\route.ts",
    "app\api\auth\register\route.ts"
)

$rootPath = "C:\Users\Muneer Ali Subzwari\Desktop\draftdeckai\DraftDeckAI"

foreach ($file in $files) {
    $fullPath = Join-Path $rootPath $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $updatedContent = $content -replace 'const supabase = createRoute\(\);', 'const supabase = await createRoute();'
        Set-Content -Path $fullPath -Value $updatedContent -NoNewline
        Write-Host "Updated: $file" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nAll files updated successfully!" -ForegroundColor Cyan
