@echo off
echo ===================================================
echo   Subiendo cambios a GitHub (MCQ-SYSTEM)
echo ===================================================
git add .
set /p msg="Ingresa la descripcion del commit (Enter para 'Actualizacion de sistema'): "
if "%msg%"=="" set msg=Actualizacion de sistema
git commit -m "%msg%"
git push origin main
echo.
echo Cambios subidos exitosamente a GitHub!
pause
