@echo off
setlocal

echo.
echo Encerrando LIOCONNECTA completa...
echo.

taskkill /FI "WINDOWTITLE eq LIOCONNECTA API" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq LIOCONNECTA Frontend" /T /F >nul 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$targets = Get-CimInstance Win32_Process | Where-Object { " ^
  "($_.Name -match 'dotnet|python|py') -and ($_.CommandLine -match 'PortalRH\.Api\.csproj|http\.server 4173') }; " ^
  "if ($targets) { $targets | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } }"

echo Processos da LIOCONNECTA finalizados.
echo.

endlocal
