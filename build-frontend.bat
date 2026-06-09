@echo off
REM ============================================================
REM  MVP v2.2 — React Frontend Build Script
REM
REM  Builds the React app and outputs directly to Spring Boot's
REM  static resource folder so each node serves the React UI.
REM
REM  Usage: .\build-frontend.bat
REM
REM  After build:
REM    .\start-web.bat manufacturer  →  http://localhost:8081
REM    .\start-web.bat distributor   →  http://localhost:8082
REM    .\start-web.bat pharmacy      →  http://localhost:8083
REM ============================================================

echo [INFO] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Download from: https://nodejs.org
    exit /b 1
)

echo [INFO] Installing dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed.
    cd ..
    exit /b 1
)

echo [INFO] Building React app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] React build failed.
    cd ..
    exit /b 1
)

cd ..
echo.
echo [SUCCESS] React app built and deployed to clients/src/main/resources/static/
echo [INFO] Now rebuild the JAR: .\gradlew.bat :clients:build -x test
echo [INFO] Then start web:      .\start-web.bat manufacturer
