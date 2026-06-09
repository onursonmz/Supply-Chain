@echo off
REM ============================================================
REM  Supply Chain CorDapp - Start Nodes
REM
REM  Fixes Turkish locale bug: Corda's AMQP serializer calls
REM  String.toUpperCase() without Locale, so on Turkish systems
REM  "is" -> "İS" which breaks MethodClassifier enum lookup.
REM  JAVA_TOOL_OPTIONS is inherited by ALL child JVM processes.
REM ============================================================

if "%JAVA_HOME%"=="" (
    echo ERROR: JAVA_HOME is not set. Please set JAVA_HOME to JDK 17.
    exit /b 1
)

REM Force Java 17 for this process and all children (runnodes.jar + node JVMs)
set PATH=%JAVA_HOME%\bin;%PATH%
set JAVA_TOOL_OPTIONS=-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8

echo [INFO] Using Java: %JAVA_HOME%\bin\java.exe
echo [INFO] Starting nodes with English locale fix...
echo [INFO] JAVA_TOOL_OPTIONS=%JAVA_TOOL_OPTIONS%
echo.

call D:\supply-chain-nodes\runnodes.bat
