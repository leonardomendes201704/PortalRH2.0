@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "FRONT_DIR=%ROOT_DIR%LioConnecta"
set "API_PROJECT=%ROOT_DIR%src\PortalRH.Api\PortalRH.Api.csproj"
set "FRONT_PORT=4173"
set "FRONT_URL=http://127.0.0.1:%FRONT_PORT%/"
set "API_URL=http://localhost:5001"

if not exist "%FRONT_DIR%\index.html" (
  echo.
  echo Frontend da LIOCONNECTA nao encontrado em:
  echo %FRONT_DIR%
  echo.
  pause
  exit /b 1
)

if not exist "%API_PROJECT%" (
  echo.
  echo Projeto da API nao encontrado em:
  echo %API_PROJECT%
  echo.
  pause
  exit /b 1
)

where dotnet >nul 2>nul
if errorlevel 1 (
  echo.
  echo .NET SDK nao foi encontrado.
  echo Instale o .NET 8 SDK e tente novamente.
  echo.
  pause
  exit /b 1
)

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

echo.
echo Subindo LIOCONNECTA completa...
echo Frontend: %FRONT_URL%
echo API:      %API_URL%
echo.

start "LIOCONNECTA API" cmd /k "cd /d ""%ROOT_DIR%"" && set ASPNETCORE_ENVIRONMENT=Development && set DOTNET_ENVIRONMENT=Development && dotnet build ""%API_PROJECT%"" && dotnet run --no-build --no-restore --no-launch-profile --project ""%API_PROJECT%"" --urls %API_URL%"
start "LIOCONNECTA Frontend" cmd /k "cd /d ""%FRONT_DIR%"" && %PY_CMD% -m http.server %FRONT_PORT%"

timeout /t 4 /nobreak >nul
start "" "%FRONT_URL%"

echo Navegador aberto em %FRONT_URL%
echo.
echo Para encerrar:
echo - feche a janela "LIOCONNECTA API"
echo - feche a janela "LIOCONNECTA Frontend"
echo.

endlocal
