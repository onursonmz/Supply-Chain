@echo off
REM ============================================================
REM  Supply Chain CorDapp - Start Nodes
REM
REM  Fixes Turkish locale bug: Corda's AMQP serializer calls
REM  String.toUpperCase() without Locale, so on Turkish systems
REM  "is" -> "İS" which breaks MethodClassifier enum lookup.
REM  JAVA_TOOL_OPTIONS is inherited by ALL child JVM processes.
REM ============================================================

set JAVA_TOOL_OPTIONS=-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8

echo [INFO] Starting nodes with English locale fix...
echo [INFO] JAVA_TOOL_OPTIONS=%JAVA_TOOL_OPTIONS%
echo.

call build\nodes\runnodes.bat
