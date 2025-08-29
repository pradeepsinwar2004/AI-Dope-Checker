#!/bin/bash
echo "Starting AI Dope Checker Frontend..."
echo ""
echo "Starting HTTP server on http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 3000
elif command -v python &> /dev/null; then
    python -m http.server 3000
else
    echo "Python not found. Please install Python to run the HTTP server."
    echo "Or open index.html directly in your browser."
fi
