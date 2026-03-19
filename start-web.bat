@echo off
REM ============================================================
REM  Supply Chain CorDapp — Web Backend Starter
REM
REM  Usage:
REM    start-web.bat manufacturer   → port 8081
REM    start-web.bat distributor    → port 8082
REM    start-web.bat retailer       → port 8083
REM
REM  Make sure the Corda nodes are running first (start-nodes.bat)
REM ============================================================

set PROFILE=%1

if "%PROFILE%"=="" (
    echo Usage: start-web.bat [manufacturer^|distributor^|retailer]
    echo.
    echo Example: start-web.bat manufacturer
    exit /b 1
)

set JAR=clients\build\libs\supply-chain-client.jar

if not exist "%JAR%" (
    echo ERROR: JAR not found. Run: gradlew :clients:build
    exit /b 1
)

echo [INFO] Starting Supply Chain Web App for: %PROFILE%
java "-Duser.language=en" "-Duser.country=US" "-Dfile.encoding=UTF-8" "-Dspring.profiles.active=%PROFILE%" -jar %JAR%
