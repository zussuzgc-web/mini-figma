@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [Ошибка] Node.js не найден. Установите Node.js 18+ и повторите.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Устанавливаю зависимости...
  call npm install
  if errorlevel 1 (
    echo [Ошибка] Не удалось установить зависимости.
    pause
    exit /b 1
  )
)

call npm run dev
if errorlevel 1 (
  echo [Ошибка] Запуск dev-сервера завершился с ошибкой.
  pause
)