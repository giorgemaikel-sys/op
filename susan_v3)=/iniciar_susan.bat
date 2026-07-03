@echo off
chcp 65001 > nul
title Susan v3
cd /d "%~dp0"
python lanzador.py
if errorlevel 1 (
    echo.
    echo Error al iniciar Susan. Prueba: python lanzador.py --consola
    pause
)
