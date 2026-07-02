@echo off
chcp 65001 > nul
title Susan v3 — Instalador

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║          SUSAN v3 — Instalador Windows           ║
echo  ║     Asistente Virtual con IA Local (Ollama)      ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: Verificar Python
python --version > nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python no está instalado o no está en el PATH.
    echo  Descárgalo de: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo  [OK] Python encontrado.

:: Verificar pip
pip --version > nul 2>&1
if errorlevel 1 (
    echo  [ERROR] pip no encontrado. Reinstala Python marcando "Add to PATH".
    pause
    exit /b 1
)
echo  [OK] pip encontrado.

echo.
echo  Instalando dependencias de Python...
echo  (Esto puede tardar varios minutos la primera vez)
echo.

pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo  [AVISO] Algunos paquetes fallaron. Intentando uno a uno...
    pip install customtkinter Pillow pygame edge-tts
    pip install sounddevice numpy SpeechRecognition
    pip install opencv-python requests beautifulsoup4
    pip install duckduckgo-search httpx lxml
    pip install pyautogui pygetwindow pyperclip psutil
    pip install deep-translator yt-dlp mss
    pip install pystray pywin32
)

echo.
echo  ─────────────────────────────────────────────────
echo  Verificando Ollama...
ollama --version > nul 2>&1
if errorlevel 1 (
    echo  [AVISO] Ollama no está instalado.
    echo  Descárgalo de: https://ollama.com/download
    echo  Luego ejecuta:
    echo    ollama pull qwen2.5:7b
    echo    ollama pull deepseek-coder:6.7b
    echo    ollama pull llava:latest
) else (
    echo  [OK] Ollama encontrado.
    echo.
    echo  Descargando modelos de IA (puede tardar según tu internet)...
    echo  Modelo conversacional:
    ollama pull qwen2.5:7b
    echo  Modelo de código:
    ollama pull deepseek-coder:6.7b
    echo  Modelo de visión:
    ollama pull llava:latest
)

echo.
echo  ─────────────────────────────────────────────────
echo  Creando carpetas necesarias...
if not exist "capturas"    mkdir capturas
if not exist "imagenes"    mkdir imagenes
if not exist "videos"      mkdir videos
if not exist "contenido"   mkdir contenido
if not exist "borradores"  mkdir borradores
if not exist "conocimiento" mkdir conocimiento
if not exist "assets\audio" mkdir assets\audio

echo.
echo  ─────────────────────────────────────────────────
echo  Instalación completada.
echo.
echo  PASOS SIGUIENTES:
echo  1. Edita config.json con tu email y preferencias.
echo  2. Para reconocimiento de voz, descarga el modelo Vosk:
echo     https://alphacephei.com/vosk/models
echo     Extrae el modelo en la carpeta 'modelo_es'
echo  3. Para OCR, instala Tesseract:
echo     https://github.com/UB-Mannheim/tesseract/wiki
echo.
echo  Para iniciar Susan:
echo    python lanzador.py
echo.
echo  Modo texto (sin GUI):
echo    python lanzador.py --consola
echo  ─────────────────────────────────────────────────
pause
