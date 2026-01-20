#!/bin/bash
echo "Starting local server to test the generated site..."
cd public
python3 -m http.server 8000 2>/dev/null || python -m SimpleHTTPServer 8000 2>/dev/null || echo "Please start a server manually to view the site"