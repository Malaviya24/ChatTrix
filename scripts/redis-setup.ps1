# Redis Setup Script for Windows
# This script helps you set up Redis on Windows

Write-Host "Redis Setup for Windows" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Red

Write-Host "`nOptions:" -ForegroundColor Yellow
Write-Host "1. Install Redis using Chocolatey (requires admin)" -ForegroundColor White
Write-Host "2. Download Redis from official website" -ForegroundColor White
Write-Host "3. Use Redis Cloud (free online service)" -ForegroundColor White
Write-Host "4. Disable Redis and use memory fallback" -ForegroundColor White

Write-Host "`nRecommendation:" -ForegroundColor Green
Write-Host "For development, option 4 (disable Redis) is the quickest solution." -ForegroundColor Green
Write-Host "For production, use option 3 (Redis Cloud) or option 1 (local Redis)." -ForegroundColor Green

Write-Host "`nQuick Start (Option 4):" -ForegroundColor Cyan
Write-Host "Run: npm run dev:no-redis" -ForegroundColor White
Write-Host "This will start your app without Redis connection errors." -ForegroundColor White

Write-Host "`nFor more details, see REDIS_SETUP.md" -ForegroundColor Blue
