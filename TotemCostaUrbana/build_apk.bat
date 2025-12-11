@echo off
REM ============================================
REM TotemCostaUrbana - Build Script (Windows)
REM ============================================

echo.
echo ==========================================
echo   TotemCostaUrbana - Build APK
echo ==========================================
echo.

REM Verificar se estamos na pasta correta
if not exist "gradlew.bat" (
    echo ERRO: Execute este script dentro da pasta TotemCostaUrbana
    echo.
    pause
    exit /b 1
)

echo [1/3] Limpando builds anteriores...
call gradlew.bat clean
if errorlevel 1 (
    echo ERRO: Falha ao limpar projeto
    pause
    exit /b 1
)

echo.
echo [2/3] Compilando APK Debug...
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo ERRO: Falha ao compilar APK
    pause
    exit /b 1
)

echo.
echo [3/3] Build concluido!
echo.
echo ==========================================
echo   APK GERADO COM SUCESSO!
echo ==========================================
echo.
echo   Localizacao do APK:
echo   app\build\outputs\apk\debug\app-debug.apk
echo.
echo ==========================================
echo.

REM Abrir pasta do APK
explorer app\build\outputs\apk\debug\

pause
