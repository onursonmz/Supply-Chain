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

if "%JAVA_HOME%"=="" (
    echo ERROR: JAVA_HOME is not set. Please set JAVA_HOME to JDK 17.
    exit /b 1
)

REM Force Java 17 for Gradle and all child processes
set PATH=%JAVA_HOME%\bin;%PATH%
set JAVA_TOOL_OPTIONS=-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8

echo [INFO] Using Java: %JAVA_HOME%\bin\java.exe

REM Stop any existing Gradle daemon so it restarts with the locale env vars above.
REM A pre-existing daemon keeps its original environment and won't have JAVA_TOOL_OPTIONS,
REM which means the node-info generation subprocesses it spawns will run with Turkish locale.
echo [INFO] Stopping Gradle daemon (ensures fresh start with locale fix)...
call gradlew.bat --stop

echo [INFO] Deploying nodes with English locale fix...
call gradlew.bat clean deployNodes

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] deployNodes failed. Check the logs above.
    exit /b 1
)

echo.
echo [SUCCESS] Nodes deployed. Run: build\nodes\runnodes.bat
