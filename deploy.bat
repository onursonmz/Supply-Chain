@echo off
REM ============================================================
REM  Supply Chain CorDapp - Deploy Script
REM
REM  This script fixes the Turkish locale bug in Corda:
REM  Corda's AMQP serializer calls String.toUpperCase() on method
REM  names without specifying Locale. On Turkish systems "is" ->
REM  "İS" (dotless-I) which breaks MethodClassifier enum lookup.
REM  Setting JAVA_TOOL_OPTIONS overrides locale for all JVM processes.
REM ============================================================

set JAVA_TOOL_OPTIONS=-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8

echo [INFO] Deploying nodes with English locale fix...
call gradlew.bat clean deployNodes

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] deployNodes failed. Check the logs above.
    exit /b 1
)

echo.
echo [SUCCESS] Nodes deployed. Run: build\nodes\runnodes.bat
