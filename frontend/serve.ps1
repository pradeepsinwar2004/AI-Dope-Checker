Write-Host "Starting AI Dope Checker Frontend..." -ForegroundColor Green
Write-Host ""
Write-Host "Starting HTTP server on http://localhost:3000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Check if Python is available
$pythonCmd = $null
if (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
}

if ($pythonCmd) {
    Write-Host "Using $pythonCmd to serve the application..." -ForegroundColor Green
    Start-Process $pythonCmd -ArgumentList "-m", "http.server", "3000" -NoNewWindow -Wait
} else {
    Write-Host "Python not found. Please install Python to run the HTTP server." -ForegroundColor Red
    Write-Host "Or open index.html directly in your browser." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening index.html in default browser..." -ForegroundColor Green
    Start-Process "index.html"
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
