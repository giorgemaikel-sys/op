"""
agente_axiom.py — Axiom v5: Generador de proyectos de código para Susan v3.
Genera proyectos completos desde cero, con validación, reintentos y streaming.
"""

import re, os, ast, json, zipfile, threading
import subprocess
from datetime import datetime
from typing import Optional, List, Dict, Callable, Tuple
from logger import logger

try:
    import requests as _req
    HAS_REQ = True
except ImportError:
    HAS_REQ = False

try:
    import customtkinter as ctk
    from tkinter import END, filedialog
    HAS_CTK = True
except ImportError:
    HAS_CTK = False

OLLAMA_BASE = "http://localhost:11434"

# ── Constantes ────────────────────────────────────────────────────────────────
EXT_LANG = {
    ".py": "python", ".js": "javascript", ".ts": "typescript",
    ".html": "html", ".css": "css", ".json": "json",
    ".yaml": "yaml", ".yml": "yaml", ".md": "markdown",
    ".sh": "bash", ".txt": "text", ".rs": "rust",
    ".go": "go", ".java": "java", ".cpp": "cpp",
}

PLANTILLAS = {
    "Python App":    ["main.py","utils.py","config.py","tests/test_main.py","README.md","requirements.txt"],
    "API REST":      ["app.py","routes/api.py","models/schemas.py","auth/middleware.py","config.py","requirements.txt","README.md"],
    "Bot Discord":   ["bot.py","cogs/commands.py","cogs/events.py","database/db.py","config.py","requirements.txt"],
    "Web Scraper":   ["scraper.py","parsers/parser.py","storage/exporter.py","utils/helpers.py","config.py","requirements.txt"],
    "Juego Pygame":  ["main.py","game/engine.py","game/sprites.py","game/physics.py","game/ui.py","assets/README.md","requirements.txt"],
    "CLI Tool":      ["cli.py","commands/base.py","commands/run.py","utils/formatter.py","config.py","requirements.txt"],
    "ML Pipeline":   ["train.py","predict.py","models/model.py","data/preprocessor.py","utils/metrics.py","config.yaml","requirements.txt"],
    "Custom":        [],
}

AUTONOMIA = (
    "REGLAS ABSOLUTAS:\n"
    "1. Escribe TODO el código tú mismo desde cero.\n"
    "2. NUNCA menciones GitHub, GitLab ni repos externos.\n"
    "3. NUNCA uses 'git clone' ni 'pip install git+URL'.\n"
    "4. Código COMPLETO y funcional, sin stubs ni '# TODO'.\n"
    "5. Sin instrucciones de instalación fuera de requirements.txt.\n"
)

# ── Utilidades ────────────────────────────────────────────────────────────────
def _limpiar(t: str) -> str:
    t = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', t)
    t = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', t)
    return t.strip()

def _extraer_codigo(respuesta: str, ext: str = ".py") -> str:
    lang = EXT_LANG.get(ext, "")
    txt  = _limpiar(respuesta)
    # Con lenguaje explícito
    if lang:
        for v in [lang, lang.upper()]:
            m = re.search(rf"```{re.escape(v)}\s*\n([\s\S]*?)```", txt, re.IGNORECASE)
            if m and len(m.group(1).strip()) > 20:
                return m.group(1).strip()
    # Cualquier bloque
    m = re.search(r"```\w*\s*\n([\s\S]*?)```", txt)
    if m and len(m.group(1).strip()) > 20:
        return m.group(1).strip()
    return txt

def _validar_python(codigo: str) -> Tuple[bool, str]:
    if not codigo or len(codigo.strip()) < 5:
        return False, "Vacío"
    try:
        ast.parse(codigo)
        return True, "OK"
    except SyntaxError as e:
        return False, f"Línea {e.lineno}: {e.msg}"

def _sugiere_externo(txt: str) -> bool:
    sin_bloques = re.sub(r"```[\s\S]*?```", "", txt)
    return bool(re.search(
        r"(git\s+clone|github\.com/|gitlab\.com/|pip\s+install\s+git\+)",
        sin_bloques, re.IGNORECASE
    ))

# ── Llamada a Ollama ──────────────────────────────────────────────────────────
def _llamar_ollama(
    prompt: str,
    modelo: str = "qwen2.5:7b",
    timeout: int = 180,
    on_token: Optional[Callable[[str], None]] = None,
) -> str:
    if HAS_REQ:
        try:
            r = _req.post(
                f"{OLLAMA_BASE}/api/generate",
                json={"model": modelo, "prompt": prompt, "stream": True,
                      "options": {"temperature": 0.15, "num_predict": 8192}},
                stream=True, timeout=(12, timeout),
            )
            if r.status_code == 200:
                texto = ""
                for line in r.iter_lines():
                    if not line: continue
                    try:
                        d = json.loads(line)
                        tok = d.get("response", "")
                        if tok:
                            texto += tok
                            if on_token: on_token(tok)
                        if d.get("done"): break
                    except Exception: continue
                if texto: return _limpiar(texto)
        except Exception as exc:
            logger.warning(f"[Axiom] API: {exc}")

    try:
        proc = subprocess.Popen(
            ["ollama", "run", modelo, "--nowordwrap"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", errors="ignore",
        )
        out, _ = proc.communicate(input=prompt, timeout=timeout)
        return _limpiar(out)
    except Exception as exc:
        logger.error(f"[Axiom] subprocess: {exc}")
        return ""

# ── Clase principal ───────────────────────────────────────────────────────────
class AgenteAxiom:
    MAX_INTENTOS = 3

    def __init__(self, config: Dict = None):
        cfg = (config or {}).get("ia", {})
        self.modelo       = cfg.get("modelo_codigo", "deepseek-coder:6.7b")
        self.archivos_gen: Dict[str, str] = {}
        self.directorio:   Optional[str]  = None
        self._window       = None

    # ── Generación de un archivo ──────────────────────────────────────────────
    def _generar_archivo(
        self,
        descripcion: str,
        archivo: str,
        todos: List[str],
        contexto: str,
        lineas_min: int,
        intento: int = 0,
        on_token: Optional[Callable] = None,
    ) -> str:
        ext  = os.path.splitext(archivo)[1]
        lang = EXT_LANG.get(ext, "python")
        nombre = os.path.basename(archivo)

        fuerza = ""
        if intento == 1:
            fuerza = f"\n🔄 REINTENTO: escribe MÍNIMO {lineas_min} líneas funcionales.\n"
        elif intento >= 2:
            fuerza = f"\n🚨 ÚLTIMO INTENTO: archivo COMPLETO, {lineas_min}+ líneas, CERO stubs.\n"

        ctx_bloque = (f"\n# Archivos ya generados:\n{contexto}\n" if contexto else "")
        archivos_str = ", ".join(todos[:8])

        if ext == ".py":
            prompt = (
                f"Eres un programador Python experto. Genera el archivo `{archivo}` completo.\n\n"
                f"PROYECTO: {descripcion}\nARCHIVOS: {archivos_str}\n{fuerza}\n"
                f"{AUTONOMIA}\n{ctx_bloque}\n"
                f"REQUISITOS: mínimo {lineas_min} líneas, type hints, docstrings, "
                f"manejo de errores, logging.\n\n"
                f"Responde SOLO con el bloque ```python\n"
            )
        elif ext in (".md", ".txt"):
            prompt = (
                f"Genera el archivo `{archivo}` (documentación) para este proyecto.\n"
                f"PROYECTO: {descripcion}\n{fuerza}\n{AUTONOMIA}\n{ctx_bloque}\n"
                f"Mínimo 30 líneas descriptivas.\n\nResponde con bloque ```markdown\n"
            )
        elif "requirements" in nombre:
            prompt = (
                f"Genera requirements.txt completo para: {descripcion}\n"
                f"ARCHIVOS: {archivos_str}\n{fuerza}\n{AUTONOMIA}\n"
                f"Mínimo 8 paquetes reales de PyPI con versiones. "
                f"Agrupa con comentarios.\n\nResponde con bloque ```text\n"
            )
        else:
            prompt = (
                f"Genera el archivo `{archivo}` ({lang}) completo y funcional.\n"
                f"PROYECTO: {descripcion}\n{fuerza}\n{AUTONOMIA}\n{ctx_bloque}\n"
                f"Mínimo {lineas_min} líneas. Sin placeholders.\n\n"
                f"Responde con bloque ```{lang}\n"
            )

        return _llamar_ollama(prompt, self.modelo, on_token=on_token)

    # ── Proceso completo de generación ────────────────────────────────────────
    def generar_proyecto(
        self,
        descripcion: str,
        plantilla: str = "Python App",
        archivos_custom: Optional[List[str]] = None,
        lineas_min: int = 80,
        on_log: Optional[Callable[[str], None]] = None,
        on_token: Optional[Callable[[str], None]] = None,
        on_progreso: Optional[Callable[[float, str], None]] = None,
    ) -> Dict[str, str]:
        archivos = archivos_custom or PLANTILLAS.get(plantilla, PLANTILLAS["Python App"])
        if not archivos:
            archivos = ["main.py", "utils.py", "README.md", "requirements.txt"]

        self.archivos_gen.clear()
        generados: Dict[str, str] = {}
        n_total = len(archivos)

        def log(msg: str):
            if on_log: on_log(msg)
            logger.info(f"[Axiom] {msg}")

        log(f"⬡ Generando '{descripcion[:60]}…' | {n_total} archivos | {self.modelo}")
        log("─" * 60)

        for idx, archivo in enumerate(archivos):
            log(f"📄 [{idx+1}/{n_total}] {archivo}")
            if on_progreso:
                on_progreso(idx / n_total, f"{archivo} ({idx+1}/{n_total})")

            ext = os.path.splitext(archivo)[1]

            # Construir contexto con archivos ya generados
            ctx_partes = []
            chars_ctx  = 0
            for nom, cod in generados.items():
                snip = cod[:300]
                entrada = f"# ── {nom}\n{snip}\n"
                if chars_ctx + len(entrada) < 2500:
                    ctx_partes.append(entrada)
                    chars_ctx += len(entrada)
            contexto = "\n".join(ctx_partes)

            codigo = ""
            ok     = False
            razon  = "Sin respuesta"

            for intento in range(self.MAX_INTENTOS):
                if intento > 0:
                    log(f"  🔄 Reintento {intento}/{self.MAX_INTENTOS-1}: {razon}")

                respuesta = self._generar_archivo(
                    descripcion, archivo, archivos, contexto,
                    lineas_min, intento, on_token
                )

                if not respuesta:
                    razon = "Sin respuesta"; continue
                if _sugiere_externo(respuesta):
                    razon = "Sugirió repo externo → bloqueado"; continue

                candidato = _extraer_codigo(respuesta, ext)
                if len(candidato) < 50:
                    razon = f"Muy corto ({len(candidato)} chars)"; continue

                # Validar Python
                if ext == ".py":
                    valido, msg_val = _validar_python(candidato)
                    if not valido:
                        razon = f"Sintaxis: {msg_val}"; continue

                # Cantidad de líneas
                lineas_reales = [l for l in candidato.splitlines()
                                 if l.strip() and not l.strip().startswith("#")]
                if ext == ".py" and len(lineas_reales) < max(8, lineas_min // 8):
                    razon = f"Solo {len(lineas_reales)} líneas reales"
                    if len(candidato) > len(codigo):
                        codigo = candidato
                    continue

                codigo = candidato
                ok     = True
                break

            if not ok and len(codigo) < 50:
                codigo = f"# {archivo}\n# TODO: implementar\n# Descripción: {descripcion[:80]}\n"

            # Indicador de sintaxis
            if ext == ".py":
                v, m = _validar_python(codigo)
                sin_str = "✓" if v else f"✗ {m}"
            else:
                sin_str = ""

            nlin = len(codigo.splitlines())
            nch  = len(codigo)
            log(
                f"  {'✔' if ok else '⚠'} {archivo} → {nlin} líneas, {nch:,} chars"
                + (f"  [{sin_str}]" if sin_str else "")
            )

            generados[archivo] = codigo
            self.archivos_gen[archivo] = codigo

        tl = sum(len(c.splitlines()) for c in self.archivos_gen.values())
        tc = sum(len(c) for c in self.archivos_gen.values())
        n_err = sum(1 for f, c in self.archivos_gen.items()
                    if os.path.splitext(f)[1] == ".py" and not _validar_python(c)[0])

        log("─" * 60)
        log(
            f"✔ COMPLETO — {len(self.archivos_gen)} archivos, {tl:,} líneas, {tc:,} chars"
            + (f" | ✗ {n_err} error(es) Python" if n_err else " | ✓ Sin errores Python")
        )
        if on_progreso: on_progreso(1.0, "Completo ✔")
        return self.archivos_gen

    # ── Guardar en disco ──────────────────────────────────────────────────────
    def guardar(self, directorio: str) -> str:
        if not self.archivos_gen:
            return "No hay código generado."
        ok = err = 0
        for archivo, codigo in self.archivos_gen.items():
            ruta = os.path.join(directorio, archivo.replace("/", os.sep))
            try:
                os.makedirs(os.path.dirname(ruta) or directorio, exist_ok=True)
                with open(ruta, "w", encoding="utf-8") as f:
                    f.write(codigo)
                ok += 1
            except OSError as exc:
                logger.error(f"[Axiom] guardar {archivo}: {exc}")
                err += 1
        return (f"✔ {ok} archivo(s) guardado(s) en:\n{directorio}"
                + (f"\n⚠ {err} error(es)" if err else ""))

    def exportar_zip(self, ruta_zip: str) -> str:
        if not self.archivos_gen:
            return "No hay código para exportar."
        try:
            with zipfile.ZipFile(ruta_zip, "w", zipfile.ZIP_DEFLATED) as zf:
                for archivo, codigo in self.archivos_gen.items():
                    zf.writestr(archivo, codigo.encode("utf-8"))
            return f"✔ ZIP exportado: {ruta_zip}"
        except Exception as exc:
            return f"✗ Error: {exc}"

    # ── Corregir un archivo con IA ────────────────────────────────────────────
    def corregir_archivo(
        self,
        archivo: str,
        error: str,
        on_token: Optional[Callable] = None,
    ) -> Tuple[bool, str]:
        if archivo not in self.archivos_gen:
            return False, f"Archivo '{archivo}' no encontrado."

        codigo  = self.archivos_gen[archivo]
        ext     = os.path.splitext(archivo)[1]
        lang    = EXT_LANG.get(ext, "python")

        # Contexto del proyecto
        ctx = "\n".join(
            f"# {n}\n{c[:200]}" for n, c in self.archivos_gen.items()
            if n != archivo
        )[:2000]

        prompt = (
            f"Corrige el archivo `{archivo}` ({lang}). Devuelve el archivo COMPLETO corregido.\n\n"
            f"{AUTONOMIA}\n\n"
            f"ERROR:\n{error}\n\n"
            f"CONTEXTO DEL PROYECTO:\n{ctx}\n\n"
            f"CÓDIGO ACTUAL:\n```{lang}\n{codigo[:3000]}\n```\n\n"
            f"Devuelve SOLO el código corregido en bloque ```{lang}```:\n"
        )

        respuesta = _llamar_ollama(prompt, self.modelo, on_token=on_token)
        if not respuesta:
            return False, "No se obtuvo respuesta del modelo."

        candidato = _extraer_codigo(respuesta, ext)
        if len(candidato) < 30:
            return False, "Corrección demasiado corta."

        if ext == ".py":
            ok, msg = _validar_python(candidato)
            if not ok:
                return False, f"Código corregido tiene error: {msg}"

        self.archivos_gen[archivo] = candidato
        n_orig = len(codigo.splitlines())
        n_new  = len(candidato.splitlines())
        return True, (f"✔ '{archivo}' corregido: {n_orig} → {n_new} líneas"
                      + (f" | ✓ Sintaxis OK" if ext == ".py" else ""))

    # ── Manejar entrada ───────────────────────────────────────────────────────
    def manejar(self, entrada: str, on_log: Optional[Callable] = None) -> str:
        """Manejo desde la interfaz de chat de Susan."""
        e = entrada.lower()

        # Extraer descripción del proyecto
        desc = re.sub(
            r'^(crea?|genera?|haz|escribe?|construye?|programa?|axiom)\s+'
            r'(un?\s+)?(proyecto|programa|aplicación|app|juego|script|bot)?\s*'
            r'(de\s+|para\s+|con\s+|en\s+)?',
            '', entrada, flags=re.IGNORECASE
        ).strip()

        if not desc or len(desc) < 5:
            return (
                "⬡ **Axiom v5** — Generador de proyectos\n\n"
                "Dime qué quieres crear, por ejemplo:\n"
                "• 'Crea un juego de Flappy Bird con Pygame'\n"
                "• 'Genera una API REST con FastAPI'\n"
                "• 'Haz un bot de Discord con música'\n"
                "• 'Crea un web scraper de noticias'"
            )

        # Detectar plantilla
        plantilla = "Python App"
        if any(t in e for t in ["pygame", "juego", "game"]):
            plantilla = "Juego Pygame"
        elif any(t in e for t in ["api", "fastapi", "flask", "rest"]):
            plantilla = "API REST"
        elif any(t in e for t in ["discord", "bot de discord"]):
            plantilla = "Bot Discord"
        elif any(t in e for t in ["scraper", "scrapear", "crawl"]):
            plantilla = "Web Scraper"
        elif any(t in e for t in ["cli", "terminal", "comando"]):
            plantilla = "CLI Tool"
        elif any(t in e for t in ["ml", "machine learning", "ia", "modelo"]):
            plantilla = "ML Pipeline"

        # Generar en hilo, transmitiendo el progreso EN VIVO (antes se bufferizaba
        # y solo se mostraba al final).
        def _gen():
            try:
                self.generar_proyecto(
                    desc, plantilla,
                    lineas_min=80,
                    on_log=on_log,
                )
            except Exception as exc:
                logger.error(f"[Axiom] generación: {exc}")
                if on_log:
                    on_log(f"✗ Error generando el proyecto: {exc}")

        threading.Thread(target=_gen, daemon=True).start()

        return (
            f"⬡ **Axiom** generando: **{desc[:60]}**\n"
            f"Plantilla: {plantilla} | Modelo: {self.modelo}\n\n"
            "Mira el progreso en la consola de Axiom. "
            "Cuando termine di **'guarda el proyecto en [ruta]'** o abre Axiom para verlo."
        )


# ── Instancia global ──────────────────────────────────────────────────────────
_axiom: Optional[AgenteAxiom] = None

def get_axiom(config: Dict = None) -> AgenteAxiom:
    global _axiom
    if _axiom is None:
        _axiom = AgenteAxiom(config or {})
    return _axiom
