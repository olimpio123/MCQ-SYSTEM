@echo off
title Iniciar Sistema MCQS
echo ===================================================
echo             INICIANDO SISTEMA MCQS
echo ===================================================
echo.

echo Iniciando Backend (Node.js Express en puerto 3000)...
start "MCQS - Backend" cmd /k "cd /d "%~dp0mcqs-backend" && npm start"

echo Esperando que el backend inicie...
timeout /t 3 >nul

echo Iniciando Frontend (Vite React en puerto 5173)...
start "MCQS - Frontend" cmd /k "cd /d "%~dp0mcqs-sistema" && npm run dev"

echo.
echo ===================================================
echo  Sistema iniciado correctamente:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3000
echo   - Usuario:  admin@mcqs.com
echo   - Clave:    admin
echo ===================================================
pause
