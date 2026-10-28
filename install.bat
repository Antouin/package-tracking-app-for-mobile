@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est introuvable. Installez Node.js depuis https://nodejs.org/ puis relancez ce script.
  pause
  exit /b 1
)
where npx >nul 2>nul
if errorlevel 1 (
  echo npx est introuvable. Reinstallez Node.js (npm/npx inclus) depuis https://nodejs.org/ puis relancez ce script.
  pause
  exit /b 1
)
echo L'application sera disponible sur http://localhost:3000
start "" http://localhost:3000
npx serve public
