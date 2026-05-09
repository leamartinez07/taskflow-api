@echo off
title TaskFlow API
echo Instalando dependencias...
call npm install
echo.
echo Iniciando TaskFlow API en http://localhost:3000
call npm run dev
pause
