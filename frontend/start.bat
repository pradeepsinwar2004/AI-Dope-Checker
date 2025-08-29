@echo off
echo Starting AI Dope Checker Frontend...
echo.
echo Opening in default browser...
start "" "index.html"
echo.
echo If the page doesn't open, manually navigate to:
echo file:///%~dp0index.html
echo.
echo You can also use a simple HTTP server:
echo python -m http.server 3000
echo.
pause
