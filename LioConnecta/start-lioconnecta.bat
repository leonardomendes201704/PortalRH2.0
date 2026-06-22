@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "PORT=3020"
set "URL=http://127.0.0.1:%PORT%/"
set "FRONT_COMMAND="
set "FRONT_MODE="

cd /d "%ROOT_DIR%"

where node >nul 2>nul
if %errorlevel%==0 (
  set "FRONT_COMMAND=node dev-static-server.js"
  set "FRONT_MODE=node"
)

if not defined FRONT_COMMAND (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set "FRONT_COMMAND=python -m http.server %PORT%"
    set "FRONT_MODE=python"
  )
)

if not defined FRONT_COMMAND (
  where py >nul 2>nul
  if %errorlevel%==0 (
    set "FRONT_COMMAND=py -3 -m http.server %PORT%"
    set "FRONT_MODE=python-launcher"
  )
)

if not defined FRONT_COMMAND (
  echo.
  echo Nenhum runtime compativel foi encontrado.
  echo Instale Node.js ou Python 3 e tente novamente.
  echo.
  pause
  exit /b 1
)

echo Iniciando servidor local da LIOCONNECTA em %URL%
echo Runtime frontend: %FRONT_MODE%
echo.
echo Nao feche a janela do servidor enquanto estiver usando o prototipo.
echo.

start "LIOCONNECTA Server" cmd /k "cd /d ""%ROOT_DIR%"" && %FRONT_COMMAND%"

timeout /t 2 /nobreak >nul
start "" "%URL%"

echo Navegador aberto em %URL%
echo.
echo Se precisar encerrar, feche a janela chamada "LIOCONNECTA Server".
echo.

endlocal
