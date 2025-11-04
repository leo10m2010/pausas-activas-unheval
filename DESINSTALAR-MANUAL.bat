@echo off
chcp 65001 > nul
echo ═══════════════════════════════════════════════════════════
echo   DESINSTALADOR - Pausas Activas UNHEVAL
echo ═══════════════════════════════════════════════════════════
echo.
echo Este script te ayudará a desinstalar Pausas Activas UNHEVAL
echo.
echo Presiona Ctrl+C para cancelar o cualquier tecla para continuar...
pause > nul
echo.

REM Buscar el desinstalador en las ubicaciones comunes
echo Buscando instalación...
echo.

set UNINSTALL_PATH=""
set FOUND=0

REM Ubicación 1: AppData Local del usuario actual
if exist "%LOCALAPPDATA%\Programs\Pausas Activas UNHEVAL\Uninstall Pausas Activas UNHEVAL.exe" (
    set UNINSTALL_PATH="%LOCALAPPDATA%\Programs\Pausas Activas UNHEVAL\Uninstall Pausas Activas UNHEVAL.exe"
    set FOUND=1
    echo [✓] Encontrado en: %LOCALAPPDATA%\Programs\Pausas Activas UNHEVAL
)

REM Ubicación 2: Program Files
if exist "%ProgramFiles%\Pausas Activas UNHEVAL\Uninstall Pausas Activas UNHEVAL.exe" (
    set UNINSTALL_PATH="%ProgramFiles%\Pausas Activas UNHEVAL\Uninstall Pausas Activas UNHEVAL.exe"
    set FOUND=1
    echo [✓] Encontrado en: %ProgramFiles%\Pausas Activas UNHEVAL
)

REM Ubicación 3: Program Files (x86)
if exist "%ProgramFiles(x86)%\Pausas Activas UNHEVAL\Uninstall Pausas Activas UNHEVAL.exe" (
    set UNINSTALL_PATH="%ProgramFiles(x86)%\Pausas Activas UNHEVAL\Uninstall Pausas Activas UNHEVAL.exe"
    set FOUND=1
    echo [✓] Encontrado en: %ProgramFiles(x86)%\Pausas Activas UNHEVAL
)

REM Ubicación 4: AppData Roaming
if exist "%APPDATA%\Pausas Activas UNHEVAL\Uninstall Pausas Activas UNHEVAL.exe" (
    set UNINSTALL_PATH="%APPDATA%\Pausas Activas UNHEVAL\Uninstall Pausas Activas UNHEVAL.exe"
    set FOUND=1
    echo [✓] Encontrado en: %APPDATA%\Pausas Activas UNHEVAL
)

echo.

if %FOUND%==1 (
    echo ───────────────────────────────────────────────────────────
    echo Ejecutando desinstalador oficial...
    echo ───────────────────────────────────────────────────────────
    echo.
    start "" %UNINSTALL_PATH%
    timeout /t 2 > nul
    echo.
    echo El desinstalador se ha iniciado.
    echo Sigue las instrucciones en pantalla.
    echo.
) else (
    echo [✗] No se encontró la instalación en las ubicaciones comunes.
    echo.
    echo Por favor, desinstala manualmente desde:
    echo.
    echo   Opción 1: Panel de Control
    echo   1. Abre Panel de Control
    echo   2. Ve a "Programas y características"
    echo   3. Busca "Pausas Activas UNHEVAL"
    echo   4. Haz clic derecho y selecciona "Desinstalar"
    echo.
    echo   Opción 2: Configuración de Windows 10/11
    echo   1. Abre Configuración (Win + I)
    echo   2. Ve a "Aplicaciones"
    echo   3. Busca "Pausas Activas UNHEVAL"
    echo   4. Haz clic y selecciona "Desinstalar"
    echo.
    echo   Opción 3: Buscar manualmente
    echo   Busca en estas carpetas:
    echo   - %LOCALAPPDATA%\Programs\
    echo   - %ProgramFiles%\
    echo   - %ProgramFiles(x86)%\
    echo   - %APPDATA%\
    echo.
)

echo ═══════════════════════════════════════════════════════════
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
