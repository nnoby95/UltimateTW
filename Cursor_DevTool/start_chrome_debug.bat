@echo off
echo 🚀 Starting Chrome with remote debugging...

REM Kill any existing Chrome processes
taskkill /f /im chrome.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Chrome with remote debugging
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug" --no-first-run --no-default-browser-check

echo ✅ Chrome started with remote debugging on port 9222
echo 🌐 You can now open TribalWars in this Chrome instance
echo 🔗 DevTools will be available at: http://localhost:9222
echo.
echo 💡 Next steps:
echo    1. Open TribalWars in the new Chrome window
echo    2. Run: node quick_start.js
echo    3. Or run: npm start
pause 