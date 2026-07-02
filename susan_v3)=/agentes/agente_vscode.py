"""
agente_vscode.py — Integración avanzada con Visual Studio Code para Susan v3.
Abre VS Code, crea archivos, ejecuta comandos, gestiona proyectos y trabaja con el editor.
"""

import os, re, subprocess, time, threading, json, webbrowser
from typing import Optional, List, Dict, Any
from logger import logger

try:
    import pygetwindow as gw
    HAS_GW = True
except ImportError:
    HAS_GW = False

try:
    import pyautogui
    HAS_AUTO = True
except ImportError:
    HAS_AUTO = False


# ── Plantillas de proyectos ───────────────────────────────────────────────────
PLANTILLAS_PROYECTO = {
    "python": {
        "estructura": ["main.py", "utils/", "tests/", "requirements.txt", "README.md"],
        "main.py": '''"""Proyecto Python creado por Susan v3"""

def main():
    print("Hola desde Susan v3!")

if __name__ == "__main__":
    main()
''',
        "requirements.txt": "# Dependencias del proyecto\n"
    },
    "web": {
        "estructura": ["index.html", "styles.css", "script.js", "assets/"],
        "index.html": '''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Proyecto Web - Susan v3</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Proyecto Web creado por Susan v3</h1>
    <script src="script.js"></script>
</body>
</html>
''',
        "styles.css": '''body { font-family: sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; }
h1 { color: white; }
''',
        "script.js": "// Proyecto JavaScript creado por Susan v3\nconsole.log('Proyecto listo!');\n"
    },
    "nodejs": {
        "estructura": ["index.js", "package.json", "routes/", "controllers/", ".env"],
        "index.js": '''// Servidor Node.js creado por Susan v3
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Servidor corriendo con Susan v3');
});

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
''',
        "package.json": '''{
  "name": "proyecto-susan",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {"start": "node index.js", "dev": "nodemon index.js"},
  "dependencies": {"express": "^4.18.0"}
}
'''
    }
}


# ── Agente VS Code ────────────────────────────────────────────────────────────
class AgenteVSCode:
    """Asistente avanzado para Visual Studio Code."""

    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.rutas_vscode = [
            r"C:\Program Files\Microsoft VS Code\Code.exe",
            r"/usr/bin/code",
            r"/snap/bin/code",
            r"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
        ]
        self._ultimo_proyecto = None
        self._archivos_abiertos = []

    def _encontrar_vscode(self) -> Optional[str]:
        """Encuentra la ruta de VS Code."""
        for ruta in self.rutas_vscode:
            if os.path.isfile(ruta):
                return ruta
        
        # Intentar encontrar 'code' en PATH
        try:
            resultado = subprocess.run(['which', 'code'], capture_output=True, text=True)
            if resultado.returncode == 0:
                return resultado.stdout.strip()
        except Exception:
            pass
        
        return None

    def abrir_vscode(self, ruta: str = None) -> str:
        """Abre Visual Studio Code."""
        vscode_path = self._encontrar_vscode()
        
        if not vscode_path:
            try:
                if ruta and os.path.exists(ruta):
                    webbrowser.open(ruta)
                else:
                    webbrowser.open('vscode://')
                return "Intentando abrir VS Code..."
            except Exception:
                pass
            return "No encontré VS Code instalado. Descárgalo en https://code.visualstudio.com/"

        try:
            cmd = [vscode_path]
            if ruta and os.path.exists(ruta):
                cmd.append(ruta)
            subprocess.Popen(cmd)
            logger.info(f"[VSCode] Abierto: {vscode_path}")
            return f"VS Code abriendo{' en: ' + ruta if ruta else ''}..."
        except Exception as exc:
            logger.error(f"[VSCode] Error: {exc}")
            return f"Error abriendo VS Code: {exc}"

    def crear_archivo(self, nombre: str, contenido: str = "", ruta: str = None) -> str:
        """Crea un archivo con contenido opcional."""
        try:
            dir_trabajo = ruta or os.getcwd()
            ruta_completa = os.path.join(dir_trabajo, nombre)
            
            dir_name = os.path.dirname(ruta_completa)
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)
            
            with open(ruta_completa, 'w', encoding='utf-8') as f:
                f.write(contenido)
            
            self._archivos_abiertos.append(ruta_completa)
            logger.info(f"[VSCode] Archivo creado: {ruta_completa}")
            return f"Archivo creado: `{nombre}`\nRuta: `{ruta_completa}`"
        except Exception as exc:
            logger.error(f"[VSCode] Crear archivo: {exc}")
            return f"Error creando archivo: {exc}"

    def crear_proyecto(self, tipo: str, nombre: str = "mi_proyecto", ruta_base: str = None) -> str:
        """Crea un proyecto completo con estructura de carpetas."""
        tipo_lower = tipo.lower()
        if tipo_lower not in PLANTILLAS_PROYECTO:
            tipos_disponibles = ", ".join(PLANTILLAS_PROYECTO.keys())
            return f"Tipo no reconocido. Disponibles: {tipos_disponibles}"

        plantilla = PLANTILLAS_PROYECTO[tipo_lower]
        ruta_base = ruta_base or os.path.join(os.getcwd(), nombre)
        
        try:
            os.makedirs(ruta_base, exist_ok=True)
            
            for item in plantilla["estructura"]:
                item_path = os.path.join(ruta_base, item)
                if item.endswith('/'):
                    os.makedirs(item_path, exist_ok=True)
                elif '.' in item:
                    contenido = plantilla.get(item, "")
                    item_dir = os.path.dirname(item_path)
                    if item_dir:
                        os.makedirs(item_dir, exist_ok=True)
                    with open(item_path, 'w', encoding='utf-8') as f:
                        f.write(contenido)
            
            self._ultimo_proyecto = ruta_base
            logger.info(f"[VSCode] Proyecto {tipo} creado: {ruta_base}")
            
            return (f"Proyecto **{tipo}** creado exitosamente!\n"
                    f"Ruta: `{ruta_base}`\n"
                    f"Archivos creados: {len(plantilla['estructura'])}\n\n"
                    f"Di 'abre en VS Code' para editarlo.")
        except Exception as exc:
            logger.error(f"[VSCode] Crear proyecto: {exc}")
            return f"Error creando proyecto: {exc}"

    def ejecutar_comando(self, comando: str) -> str:
        """Ejecuta un comando en la terminal."""
        try:
            resultado = subprocess.run(comando, shell=True, capture_output=True, text=True, timeout=30)
            salida = resultado.stdout or resultado.stderr or "Comando ejecutado (sin salida)"
            logger.info(f"[VSCode] Comando: {comando[:50]}...")
            return f"```\n{salida[:2000]}\n```"
        except subprocess.TimeoutExpired:
            return "El comando tardó demasiado (>30s)."
        except Exception as exc:
            logger.error(f"[VSCode] Comando: {exc}")
            return f"Error: {exc}"

    def listar_archivos(self, ruta: str = None) -> str:
        """Lista archivos en un directorio."""
        ruta = ruta or os.getcwd()
        
        try:
            if not os.path.exists(ruta):
                return f"La ruta no existe: {ruta}"
            
            items = os.listdir(ruta)
            dirs = sorted([d for d in items if os.path.isdir(os.path.join(ruta, d))])
            files = sorted([f for f in items if os.path.isfile(os.path.join(ruta, f))])
            
            salida = f"**Contenido de:** `{ruta}`\n\n"
            if dirs:
                salida += "**Carpetas:**\n" + "\n".join(f"  {d}" for d in dirs[:20]) + "\n"
            if files:
                salida += "\n**Archivos:**\n" + "\n".join(f"  {f}" for f in files[:30])
            
            return salida
        except Exception as exc:
            logger.error(f"[VSCode] Listar: {exc}")
            return f"Error: {exc}"

    def manejar(self, entrada: str, on_token=None) -> str:
        e = entrada.lower()

        if any(t in e for t in ["abrir vs code", "abre vscode", "abrir visual studio", "lanzar vs code"]):
            match = re.search(r'(?:en|desde|carpeta|proyecto)\s+([^\n]+)', e)
            ruta = match.group(1).strip() if match and os.path.exists(match.group(1).strip()) else None
            return self.abrir_vscode(ruta)

        if any(t in e for t in ["crear proyecto", "nuevo proyecto", "crea un proyecto"]):
            match = re.search(r'(python|web|nodejs|react|flask|django)', e)
            tipo = match.group(1) if match else "python"
            match_nombre = re.search(r'(?:llamado|nombre)\s+[\'"]?([^\'"\s]+)[\'"]?', e)
            nombre = match_nombre.group(1) if match_nombre else "mi_proyecto"
            return self.crear_proyecto(tipo, nombre)

        if any(t in e for t in ["crear archivo", "nuevo archivo", "crea un archivo"]):
            match = re.search(r'(?:llamado|nombre)\s+[\'"]?([^\'"\s]+\.[\w]+)[\'"]?', e)
            if match:
                return self.crear_archivo(match.group(1))
            return "Especifica el nombre, ej: 'crea un archivo llamado main.py'"

        if any(t in e for t in ["listar archivos", "ver archivos", "mostrar archivos", "qué hay en"]):
            match = re.search(r'(?:en|de|carpeta)\s+([^\n]+)', e)
            ruta = match.group(1).strip() if match else None
            return self.listar_archivos(ruta)

        if any(t in e for t in ["ejecutar comando", "run comando", "ejecuta", "corre"]):
            comando = re.sub(r'.*(ejecutar|ejecuta|run|corre)\s+(comando\s+)?', '', e).strip()
            if comando:
                return self.ejecutar_comando(comando)
            return "Especifica el comando."

        if any(t in e for t in ["ayuda vscode", "comandos vscode", "qué puedes hacer"]):
            return ("**Comandos de VS Code:**\n\n"
                    "• `abrir VS Code [ruta]` - Abrir VS Code\n"
                    "• `crear proyecto [tipo]` - Crear proyecto (python, web, nodejs)\n"
                    "• `crear archivo [nombre]` - Crear archivo\n"
                    "• `listar archivos [ruta]` - Ver carpeta\n"
                    "• `ejecutar comando [cmd]` - Ejecutar comando\n")

        return "Di algo como:\n• 'Abre VS Code'\n• 'Crea un proyecto python'\n• 'Lista los archivos'"


# ── Instancia global ──────────────────────────────────────────────────────────
_vscode: Optional[AgenteVSCode] = None

def get_vscode(config: Dict = None) -> AgenteVSCode:
    global _vscode
    if _vscode is None:
        _vscode = AgenteVSCode(config or {})
    return _vscode
