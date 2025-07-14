@echo off
echo 🚀 Setting up Cursor Chrome DevTools Integration for TribalWars...

echo 📦 Installing dependencies...
cd /d "%~dp0"
npm install

echo 🔧 Starting Chrome with remote debugging...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug"

echo ⏳ Waiting for Chrome to start...
timeout /t 3 /nobreak >nul

echo 🔗 Starting Cursor DevTools integration...
node Cursor_Chrome_DevTools_Integration.js

echo ✅ Setup complete! You can now debug TribalWars in Cursor.
pause 