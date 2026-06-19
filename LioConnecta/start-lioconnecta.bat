@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "PORT=4173"
set "URL=http://127.0.0.1:%PORT%/"

cd /d "%ROOT_DIR%"

where py >nul 2>nul
if %errorlevel%==0 (
  set "PY_CMD=py -3"
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set "PY_CMD=python"
  ) else (
    echo.
    echo Python nao foi encontrado.
    echo Instale o Python 3 e tente novamente.
    echo.
    pause
    exit /b 1
  )
)

echo Iniciando servidor local da LIOCONNECTA em %URL%
echo.
echo Nao feche a janela do servidor enquanto estiver usando o prototipo.
echo.

start "LIOCONNECTA Server" cmd /k "cd /d ""%ROOT_DIR%"" && %PY_CMD% -m http.server %PORT%"

timeout /t 2 /nobreak >nul
start "" "%URL%"

echo Navegador aberto em %URL%
echo.
echo Se precisar encerrar, feche a janela chamada "LIOCONNECTA Server".
echo.

endlocal
