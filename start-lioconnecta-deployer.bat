@echo off
setlocal

set "ROOT_DIR=%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  cd /d "%ROOT_DIR%"
  py -3 -m tools.lioconnecta_deployer.main
  exit /b %errorlevel%
)

where python >nul 2>nul
if %errorlevel%==0 (
  cd /d "%ROOT_DIR%"
  python -m tools.lioconnecta_deployer.main
  exit /b %errorlevel%
)

echo.
echo Python 3 nao foi encontrado nesta maquina.
echo Instale o Python e tente novamente.
echo.
pause
exit /b 1
