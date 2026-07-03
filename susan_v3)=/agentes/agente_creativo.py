"""
agente_creativo.py — Agente creativo unificado para Susan v3.
Integra: Ryan (escritura), Sussy (revisión social), Pablo (ortografía),
Nova (imágenes) y Vega (video). Pipeline fluido y automático.
"""

import subprocess, re, os, threading, tempfile, webbrowser
from typing import Optional, Callable, Dict, List, Tuple
from datetime import datetime
from logger import logger

# ── Tipos de contenido ────────────────────────────────────────────────────────
TIPOS_CONTENIDO = {
    "historia":  "Escribe una historia corta con inicio, nudo y desenlace.",
    "hook":      "Escribe un hook viral (1-2 oraciones impactantes) para redes sociales.",
    "carrusel":  "Crea un carrusel de 5 diapositivas para Instagram con texto llamativo.",
    "caption":   "Escribe un caption para Instagram con emojis y 3 hashtags relevantes.",
    "reseña":    "Escribe una reseña honesta en primera persona con pros y contras.",
    "guión":     "Escribe un guión corto (30-60 segundos) con escenas y diálogos.",
    "email":     "Redacta un email profesional y amable.",
    "post":      "Escribe un post para LinkedIn o blog profesional.",
    "hilo":      "Crea un hilo de Twitter/X (5-7 tweets) sobre el tema.",
    "script_yt": "Escribe un guión de YouTube con introducción gancho, desarrollo y CTA.",
}

TONOS = ["Directo", "Emocional", "Educativo", "Humorístico", "Inspiracional", "Profesional"]


# ── Utilidades ────────────────────────────────────────────────────────────────
def _limpiar(t: str) -> str:
    t = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', t)
    t = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', t)
    t = re.sub(r'(\w{2,})\s*\n\s*\1(\w*)', r'\1\2', t)
    return t.strip()

def _llamar_ollama(prompt: str, modelo: str = "qwen2.5:7b", timeout: int = 60,
                   on_token: Optional[Callable] = None) -> str:
    try:
        import requests as _req
        import json
        r = _req.post(
            "http://localhost:11434/api/generate",
            json={"model": modelo, "prompt": prompt, "stream": True,
                  "options": {"temperature": 0.8, "num_predict": 2048}},
            stream=True, timeout=(8, timeout),
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
    except Exception:
        pass

    try:
        proc = subprocess.Popen(
            ["ollama", "run", modelo],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", errors="ignore",
        )
        out, _ = proc.communicate(input=prompt, timeout=timeout)
        return _limpiar(out)
    except Exception as exc:
        logger.error(f"[Creativo] Ollama: {exc}")
        return ""


# ── Clase principal ───────────────────────────────────────────────────────────
class AgenteCreativo:
    """
    Pipeline creativo completo:
    Ryan (generar) → Sussy (revisar tono) → Pablo (corregir) → Guardar/Compartir
    """

    CARPETAS_GUARDADO = {
        "historia": "contenido/historias",
        "hook":     "contenido/hooks",
        "carrusel": "contenido/carruseles",
        "caption":  "contenido/captions",
        "reseña":   "contenido/resenas",
        "guión":    "contenido/guiones",
        "script_yt":"contenido/scripts_yt",
        "hilo":     "contenido/hilos",
        "email":    "contenido/emails",
        "post":     "contenido/posts",
    }

    def __init__(self, config: Dict = None):
        cfg = (config or {}).get("ia", {})
        self.modelo = cfg.get("modelo", "qwen2.5:7b")
        self._ultimo_contenido: str = ""
        self._tipo_actual: str = ""

    # ── Ryan: generación ─────────────────────────────────────────────────────
    def generar(
        self,
        tema: str,
        tipo: str = "historia",
        tono: str = "Directo",
        on_token: Optional[Callable] = None,
    ) -> str:
        instruccion_tipo = TIPOS_CONTENIDO.get(tipo.lower(), TIPOS_CONTENIDO["historia"])

        prompt = (
            f"Eres Ryan, un escritor creativo experto en redes sociales y marketing.\n"
            f"TAREA: {instruccion_tipo}\n"
            f"TONO: {tono}\n"
            f"TEMA: {tema}\n\n"
            f"REGLAS:\n"
            f"- Escribe DIRECTAMENTE el contenido sin preámbulos ni explicaciones.\n"
            f"- Usa el idioma español.\n"
            f"- El contenido debe ser atractivo, original y listo para publicar.\n\n"
            f"Contenido:"
        )

        logger.info(f"[Ryan] Generando {tipo} sobre: {tema[:50]}")
        resultado = _llamar_ollama(prompt, self.modelo, on_token=on_token)
        self._ultimo_contenido = resultado
        self._tipo_actual = tipo
        return resultado

    # ── Sussy: revisión social ────────────────────────────────────────────────
    def revisar_social(
        self,
        contenido: str,
        tipo: str = "historia",
        tono: str = "Directo",
        on_token: Optional[Callable] = None,
    ) -> str:
        if not contenido:
            return ""

        claridad = {"hook": "Muy alta", "caption": "Alta"}.get(tipo.lower(), "Normal")

        if tipo.lower() == "reseña":
            prompt = (
                f"Eres Sussy, revisora de contenido. Reescribe esta reseña de forma "
                f"honesta, personal y natural. Primera persona. Sin marketing.\n\n"
                f"Reseña original:\n{contenido}\n\nReseña revisada:"
            )
        else:
            prompt = (
                f"Eres Sussy, revisora de contenido social. "
                f"El texto tiene tono '{tono}' y necesita claridad '{claridad}'.\n"
                f"Mejora el gancho inicial, los llamados a la acción y el impacto emocional.\n"
                f"Mantén el mensaje pero hazlo más viral y atractivo.\n"
                f"Devuelve SOLO el texto mejorado, sin comentarios:\n\n"
                f"{contenido}\n\nTexto revisado:"
            )

        resultado = _llamar_ollama(prompt, self.modelo, on_token=on_token)
        if resultado and len(resultado) >= len(contenido) * 0.5:
            return resultado
        return contenido  # Usar original si la revisión falla

    # ── Pablo: corrección ortográfica ─────────────────────────────────────────
    def corregir(
        self,
        contenido: str,
        on_token: Optional[Callable] = None,
    ) -> str:
        if not contenido:
            return ""

        prompt = (
            f"Eres Pablo, corrector ortográfico y gramatical experto en español.\n"
            f"Corrige TODOS los errores del texto sin cambiar el significado.\n"
            f"Devuelve ÚNICAMENTE el texto corregido, sin explicaciones:\n\n"
            f"Texto:\n{contenido}"
        )

        resultado = _llamar_ollama(prompt, self.modelo, on_token=on_token)
        if resultado and len(resultado) >= len(contenido) * 0.5:
            return resultado
        return contenido

    # ── Pipeline completo ─────────────────────────────────────────────────────
    def pipeline_completo(
        self,
        tema: str,
        tipo: str = "historia",
        tono: str = "Directo",
        auto_revisar: bool = True,
        auto_corregir: bool = True,
        on_progreso: Optional[Callable[[str], None]] = None,
        on_token: Optional[Callable] = None,
    ) -> Dict[str, str]:
        """
        Ejecuta el pipeline Ryan → Sussy → Pablo.
        Retorna dict con 'original', 'revisado', 'final'.
        """
        resultados = {}

        # 1. Ryan genera
        if on_progreso: on_progreso("✏️ Ryan generando contenido…")
        contenido_original = self.generar(tema, tipo, tono, on_token)
        resultados["original"] = contenido_original

        if not contenido_original:
            return resultados

        contenido = contenido_original

        # 2. Sussy revisa
        if auto_revisar:
            if on_progreso: on_progreso("🌸 Sussy revisando tono y engagement…")
            revisado = self.revisar_social(contenido, tipo, tono)
            resultados["revisado"] = revisado
            if revisado:
                contenido = revisado

        # 3. Pablo corrige
        if auto_corregir:
            if on_progreso: on_progreso("✔️ Pablo corrigiendo ortografía…")
            final = self.corregir(contenido)
            resultados["final"] = final
            if final:
                contenido = final

        self._ultimo_contenido = contenido
        resultados["contenido"] = contenido
        return resultados

    # ── Generación de imagen con Nova ─────────────────────────────────────────
    def generar_imagen(self, descripcion: str) -> Optional[str]:
        """Genera una imagen usando el modelo de difusión."""
        try:
            import torch
            from diffusers import AutoPipelineForText2Image

            logger.info(f"[Nova] Generando imagen: {descripcion[:50]}")
            pipe = AutoPipelineForText2Image.from_pretrained(
                "stabilityai/sd-turbo",
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            )
            if torch.cuda.is_available():
                pipe.to("cuda")

            result = pipe(
                prompt=f"{descripcion}, high quality, detailed, 4k",
                num_inference_steps=6,
                guidance_scale=0.0,
            )
            img = result.images[0]

            carpeta = os.path.join(os.path.dirname(os.path.dirname(__file__)), "imagenes")
            os.makedirs(carpeta, exist_ok=True)
            ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
            ruta = os.path.join(carpeta, f"nova_{ts}.png")
            img.save(ruta)
            logger.info(f"[Nova] Imagen guardada: {ruta}")
            return ruta
        except Exception as exc:
            logger.error(f"[Nova] {exc}")
            return None

    # ── Guardar contenido ─────────────────────────────────────────────────────
    def guardar(self, contenido: str = "", tipo: str = "") -> str:
        contenido = contenido or self._ultimo_contenido
        tipo      = tipo or self._tipo_actual or "contenido"

        if not contenido:
            return "No hay contenido para guardar."

        carpeta_rel = self.CARPETAS_GUARDADO.get(tipo.lower(), "contenido/varios")
        carpeta     = os.path.join(os.path.dirname(os.path.dirname(__file__)), carpeta_rel)
        os.makedirs(carpeta, exist_ok=True)

        ts       = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(carpeta, f"{tipo}_{ts}.txt")

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(contenido)
            return f"✔ Guardado en: {filepath}"
        except OSError as exc:
            return f"✗ Error guardando: {exc}"

    def copiar_portapapeles(self, contenido: str = "") -> str:
        contenido = contenido or self._ultimo_contenido
        if not contenido:
            return "No hay contenido que copiar."
        try:
            import pyperclip
            pyperclip.copy(contenido)
            return "✔ Contenido copiado al portapapeles."
        except Exception as exc:
            return f"✗ Error: {exc}"

    # ── Manejar entrada ───────────────────────────────────────────────────────
    def manejar(
        self,
        entrada: str,
        on_progreso: Optional[Callable[[str], None]] = None,
        on_resultado: Optional[Callable[[str, str], None]] = None,
    ) -> str:
        e = entrada.lower()

        # Guardar/copiar último contenido
        if any(t in e for t in ["guarda el contenido", "guardar contenido"]):
            return self.guardar()
        if any(t in e for t in ["copia el contenido", "copiar al portapapeles"]):
            return self.copiar_portapapeles()

        # Detectar tipo de contenido
        tipo = "historia"
        for t in TIPOS_CONTENIDO:
            if t in e:
                tipo = t
                break

        # Detectar tono
        tono = "Directo"
        for t in TONOS:
            if t.lower() in e:
                tono = t
                break

        # Extraer tema
        tema = self._extraer_tema(entrada, tipo, tono)
        if not tema or len(tema) < 3:
            return (
                "✏️ **Agente Creativo** (Ryan + Sussy + Pablo)\n\n"
                "Tipos disponibles: " + ", ".join(TIPOS_CONTENIDO.keys()) + "\n\n"
                "Ejemplos:\n"
                "• 'Escribe una historia de terror para Instagram'\n"
                "• 'Genera un hook viral sobre emprendimiento'\n"
                "• 'Crea un carrusel sobre hábitos saludables'\n"
                "• 'Escribe un guión de YouTube sobre viajes'"
            )

        # Ejecutar pipeline en hilo separado
        def _run():
            resultados = self.pipeline_completo(
                tema, tipo, tono,
                on_progreso=on_progreso,
            )
            contenido_final = resultados.get("contenido", "")
            if on_resultado:
                on_resultado(tipo, contenido_final)

        threading.Thread(target=_run, daemon=True).start()

        return (
            f"✏️ **{tipo.title()}** sobre *'{tema[:60]}'* (Tono: {tono})\n"
            "Pipeline: Ryan → Sussy → Pablo\n\n"
            "Generando… espera un momento."
        )

    def _extraer_tema(self, entrada: str, tipo: str, tono: str) -> str:
        """Extrae el tema de la entrada del usuario."""
        texto = entrada
        for eliminar in [
            "escribe", "genera", "crea", "haz", "redacta",
            "una historia", "un hook", "un carrusel", "una caption", "una reseña",
            "un guión", "un email", "un post", "un hilo",
            "de", "sobre", "acerca de", "para", "con tono",
            tipo, tono.lower(),
        ] + [t.lower() for t in TONOS]:
            texto = re.sub(re.escape(eliminar), '', texto, flags=re.IGNORECASE)
        return texto.strip().strip('.,;:').strip()

    @property
    def ultimo_contenido(self) -> str:
        return self._ultimo_contenido


# ── Instancia global ──────────────────────────────────────────────────────────
_creativo: Optional[AgenteCreativo] = None

def get_creativo(config: Dict = None) -> AgenteCreativo:
    global _creativo
    if _creativo is None:
        _creativo = AgenteCreativo(config or {})
    return _creativo
