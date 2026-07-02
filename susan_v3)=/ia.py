"""
ia.py — Motor de inteligencia artificial de Susan v3.
Soporta Ollama con streaming, fallback y gestión de contexto avanzada.
"""

import subprocess, json, re, time, threading
from typing import Optional, Callable, List, Dict
from datetime import datetime
from logger import logger

try:
    import requests as _req
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

OLLAMA_BASE = "http://localhost:11434"
_config_cache: Optional[Dict] = None

# ── Configuración ─────────────────────────────────────────────────────────────
def _cfg() -> Dict:
    global _config_cache
    if _config_cache:
        return _config_cache
    try:
        import os
        cfg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
        with open(cfg_path, "r", encoding="utf-8") as f:
            _config_cache = json.load(f).get("ia", {})
    except Exception:
        _config_cache = {}
    return _config_cache


# ── Detección de modelos instalados ───────────────────────────────────────────
_modelos_cache: Optional[List[str]] = None
_modelos_cache_ts: float = 0.0

# Preferencias rol/tier → modelos reales (en orden de preferencia).
# Si ninguno está instalado, se degrada al primer modelo disponible o a llama3.2:3b.
_PREFERENCIAS_MODELO: Dict[str, List[str]] = {
    "fast":   ["llama3.2:3b", "qwen2.5-coder:7b", "qwen2.5:7b"],
    "code":   ["qwen2.5-coder:7b", "deepseek-coder:6.7b", "llama3.2:3b"],
    "deep":   ["claude-3-5-sonnet-latest", "claude-3-5-sonnet-20241022",
               "qwen2.5-coder:7b", "qwen2.5:7b", "llama3.2:3b"],
    "vision": ["llava:latest", "llava"],
}


def modelos_disponibles(forzar: bool = False) -> List[str]:
    """Lista de nombres de modelos instalados en Ollama (GET /api/tags).
    Cacheada 60 s. Nunca lanza excepción (devuelve [] si Ollama no responde)."""
    global _modelos_cache, _modelos_cache_ts
    if _modelos_cache is not None and not forzar and (time.time() - _modelos_cache_ts) < 60:
        return _modelos_cache
    nombres: List[str] = []
    if HAS_REQUESTS:
        try:
            r = _req.get(f"{OLLAMA_BASE}/api/tags", timeout=4)
            if r.status_code == 200:
                nombres = [m.get("name", "") for m in r.json().get("models", []) if m.get("name")]
        except Exception as exc:
            logger.warning(f"modelos_disponibles: {exc}")
    _modelos_cache, _modelos_cache_ts = nombres, time.time()
    return nombres


# Rol/tier → clave de config.json que permite fijar el modelo a mano.
_ROL_A_CONFIG = {
    "fast":   "modelo",
    "code":   "modelo_codigo",
    "deep":   "modelo_profundo",
    "vision": "modelo_vision",
}


def resolver_modelo(rol: str = "fast", defecto: str = "") -> str:
    """Devuelve el mejor modelo instalado para un rol/tier.
    rol: 'fast' | 'code' | 'deep' | 'vision'. Degrada con elegancia.
    Prioridad: modelo fijado en config.json → preferencias → cualquiera instalado."""
    disponibles = modelos_disponibles()

    # 0) Override explícito en config.json (p. ej. ia.modelo_profundo) si está instalado.
    override = (_cfg().get(_ROL_A_CONFIG.get(rol, ""), "") or "").strip()
    if override:
        if not disponibles or override in disponibles:
            return override
        base_o = override.split(":")[0]
        for d in disponibles:
            if d.split(":")[0] == base_o:
                return d

    preferencias = _PREFERENCIAS_MODELO.get(rol, [])
    if disponibles:
        # 1) Coincidencia exacta de nombre completo
        for cand in preferencias:
            if cand in disponibles:
                return cand
        # 2) Coincidencia por familia (ignorando el tag ':latest', ':7b', etc.)
        for cand in preferencias:
            base = cand.split(":")[0]
            for d in disponibles:
                if d.split(":")[0] == base:
                    return d
        # 3) Cualquier modelo instalado antes que inventar uno
        if defecto and defecto in disponibles:
            return defecto
        return disponibles[0]

    # Ollama no respondió: usar la preferencia o el defecto declarado
    return defecto or (preferencias[0] if preferencias else "llama3.2:3b")


def ollama_disponible() -> bool:
    """True si el servidor de Ollama responde y tiene al menos un modelo."""
    return bool(modelos_disponibles())

# ── Limpieza de texto ─────────────────────────────────────────────────────────
_RE_ANSI = re.compile(r'\x1b\[[0-9;]*[a-zA-Z]')
_RE_CTRL = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')

def limpiar(texto: str) -> str:
    texto = _RE_ANSI.sub('', texto)
    texto = _RE_CTRL.sub('', texto)
    return texto.strip()

# ── Fecha/hora ────────────────────────────────────────────────────────────────
def fecha_hora_actual() -> str:
    ahora = datetime.now()
    dias   = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"]
    meses  = ["enero","febrero","marzo","abril","mayo","junio",
              "julio","agosto","septiembre","octubre","noviembre","diciembre"]
    return (f"{dias[ahora.weekday()]}, {ahora.day} de {meses[ahora.month-1]} "
            f"de {ahora.year}, {ahora.strftime('%H:%M:%S')}")

# ── Llamada a Ollama con streaming ────────────────────────────────────────────
def llamar_ollama_stream(
    prompt: str,
    modelo: Optional[str] = None,
    timeout: int = 90,
    on_token: Optional[Callable[[str], None]] = None,
    system: str = "",
    keep_alive: Optional[str] = None,
) -> str:
    # Resolver el modelo: respetar el explícito; si no, usar el de config solo si
    # está instalado; si no, auto-detectar el mejor disponible (arregla el bug de
    # apuntar a modelos inexistentes como 'qwen2.5:7b').
    if not modelo:
        cfg_modelo = _cfg().get("modelo", "")
        disp = modelos_disponibles()
        if cfg_modelo and (not disp or cfg_modelo in disp):
            modelo = cfg_modelo
        else:
            modelo = resolver_modelo("fast")
    timeout = timeout or _cfg().get("timeout", 60)

    if HAS_REQUESTS:
        result = _stream_api(prompt, modelo, timeout, on_token, system, keep_alive)
        if result:
            return result

    return _subprocess_call(prompt, modelo, timeout)


def _stream_api(
    prompt: str,
    modelo: str,
    timeout: int,
    on_token: Optional[Callable[[str], None]],
    system: str,
    keep_alive: Optional[str] = None,
) -> str:
    try:
        payload = {
            "model": modelo,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": float(_cfg().get("temperatura", 0.7)),
                "num_predict": 2048,
            },
        }
        if system:
            payload["system"] = system
        if keep_alive:
            payload["keep_alive"] = keep_alive

        r = _req.post(
            f"{OLLAMA_BASE}/api/generate",
            json=payload,
            stream=True,
            timeout=(10, timeout),
        )
        if r.status_code != 200:
            logger.warning(f"Ollama HTTP {r.status_code}")
            return ""

        texto = ""
        for line in r.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue
            tok = data.get("response", "")
            if tok:
                texto += tok
                if on_token:
                    on_token(tok)
            if data.get("done"):
                break
        return limpiar(texto)
    except Exception as exc:
        logger.warning(f"Ollama stream: {exc}")
        return ""


def _subprocess_call(prompt: str, modelo: str, timeout: int) -> str:
    try:
        proc = subprocess.Popen(
            ["ollama", "run", modelo, "--nowordwrap"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", errors="ignore",
        )
        out, _ = proc.communicate(input=prompt, timeout=timeout)
        return limpiar(out)
    except subprocess.TimeoutExpired:
        proc.kill()
        logger.warning("Ollama timeout.")
        return ""
    except Exception as exc:
        logger.error(f"Ollama subprocess: {exc}")
        return ""


# ── Generar respuesta conversacional ─────────────────────────────────────────
def generar_respuesta(
    entrada: str,
    historial: List[str],
    contexto_extra: str = "",
    on_token: Optional[Callable[[str], None]] = None,
) -> str:
    """Genera una respuesta conversacional con contexto."""

    # Contexto de fecha/hora si se pregunta
    info_temporal = ""
    if any(p in entrada.lower() for p in ["hora", "fecha", "día", "hoy", "tiempo", "cuándo"]):
        info_temporal = f"[Fecha y hora: {fecha_hora_actual()}]\n"

    historial_texto = "\n".join(historial[-10:]) if historial else ""

    system = (
        "Eres Susan, una asistente virtual inteligente, proactiva y amigable. "
        "Siempre respondes en español. Eres directa, útil y concisa. "
        "Tienes múltiples agentes especializados para ayudar al usuario con compras, "
        "emails, Roblox, viajes, automatización del PC y mucho más."
    )

    prompt = ""
    if info_temporal:
        prompt += info_temporal
    if contexto_extra:
        prompt += f"{contexto_extra}\n"
    if historial_texto:
        prompt += f"Historial reciente:\n{historial_texto}\n"
    prompt += f"\nUsuario: {entrada}\nSusan:"

    respuesta = llamar_ollama_stream(prompt, system=system, on_token=on_token)

    # Quitar prefijo si el modelo lo incluye
    if respuesta.lower().startswith("susan:"):
        respuesta = respuesta[6:].strip()

    if not respuesta:
        respuesta = "Lo siento, no pude generar una respuesta ahora mismo."

    return respuesta


# ── Corrección ortográfica rápida ─────────────────────────────────────────────
def corregir_texto(texto: str) -> str:
    """Corrige ortografía y gramática de un texto corto."""
    prompt = (
        f"Corrige los errores ortográficos y gramaticales del siguiente texto en español. "
        f"Devuelve ÚNICAMENTE el texto corregido, sin explicaciones:\n\n{texto}"
    )
    resultado = llamar_ollama_stream(prompt)
    if resultado and len(resultado) >= len(texto) * 0.5:
        return resultado
    return texto


# ── Análisis de intención ─────────────────────────────────────────────────────
# Tabla de señales por intención: (frase, peso). Las frases largas y específicas
# pesan más que las palabras sueltas. Gana la intención con mayor puntuación, lo
# que evita los choques del antiguo if/elif (p. ej. "ponme un recordatorio" caía
# en YouTube por "pon"). En empate decide el orden de PRIORIDAD_INTENCION.
_SENALES_INTENCION: Dict[str, List] = {
    "vision_compra": [
        ("escanea y busca", 8), ("escanear y buscar", 8), ("fotografía y busca", 8),
        ("toma foto y busca", 8), ("busca lo que ves", 7), ("escanea el producto", 7),
    ],
    "compras": [
        ("busca en amazon", 6), ("buscar en amazon", 6), ("busca en temu", 6),
        ("busca en ebay", 6), ("en amazon", 4), ("en temu", 4), ("en ebay", 4),
        ("en aliexpress", 4), ("en mercadolibre", 4), ("precio de", 4),
        ("cuánto cuesta", 5), ("cuanto cuesta", 5), ("dónde comprar", 5),
        ("donde comprar", 5), ("busca el producto", 6), ("buscar producto", 5),
        ("más barato", 2), ("mas barato", 2), ("más caro", 2), ("comprar", 2),
        ("audífonos", 2), ("audifonos", 2),
    ],
    "email": [
        ("revisar email", 7), ("revisar correo", 7), ("leer correo", 6),
        ("leer email", 6), ("enviar correo", 6), ("enviar email", 6),
        ("correos sin leer", 6), ("envía email", 6), ("envía un correo", 6),
        ("responde al correo", 6), ("email", 4), ("correo", 4), ("gmail", 5),
        ("outlook", 4), ("bandeja", 5), ("inbox", 5), ("resume el correo", 6),
        ("responde al", 3),
    ],
    "roblox": [
        ("roblox studio", 8), ("roblox", 6), ("luau", 6), ("script de roblox", 8),
        ("juego de roblox", 7), ("abrir studio", 6), ("abre studio", 6),
        ("inserta el código", 5), ("datastore", 4),
    ],
    "viajes": [
        ("busca hotel", 7), ("busca hoteles", 7), ("reservar hotel", 7),
        ("vuelos baratos", 7), ("hoteles en", 6), ("hotel", 4), ("hoteles", 4),
        ("vuelo", 4), ("vuelos", 4), ("hospedaje", 5), ("airbnb", 6),
        ("booking", 6), ("skyscanner", 6), ("hostal", 5), ("alojamiento", 5),
        ("viaje a", 4),
    ],
    "automatizacion": [
        ("recuérdame", 8), ("recuerdame", 8), ("recordatorio", 7), ("avísame", 6),
        ("avisame", 6), ("programa una tarea", 7), ("programa un recordatorio", 8),
        ("mis tareas", 6), ("tareas programadas", 7), ("cancela la tarea", 7),
        ("repite cada", 5), ("agenda", 4), ("automatiza", 5),
        ("ventanas abiertas", 6), ("activa la ventana", 6), ("sube el volumen", 6),
        ("baja el volumen", 6), ("procesos pesados", 6), ("portapapeles", 5),
    ],
    "pantalla": [
        ("lee la pantalla", 8), ("qué dice la pantalla", 8), ("que dice la pantalla", 8),
        ("lee el texto de la pantalla", 8), ("captura y lee", 7), ("ocr", 5),
    ],
    "clima": [
        ("clima en", 7), ("clima", 5), ("temperatura", 5), ("lluvia", 5),
        ("pronóstico", 5), ("pronostico", 5), ("tiempo en", 5), ("qué tiempo hace", 6),
    ],
    "noticias": [
        ("últimas noticias", 7), ("ultimas noticias", 7), ("noticias", 5),
        ("titulares", 6), ("novedades", 4), ("qué pasó", 4), ("que paso", 4),
    ],
    "traductor": [
        ("traduce", 6), ("traducir", 6), ("tradúceme", 7), ("traduceme", 7),
        ("cómo se dice", 7), ("como se dice", 7), ("al inglés", 4), ("al ingles", 4),
        ("al español", 4), ("al francés", 4), ("al alemán", 4), ("en japonés", 4),
    ],
    "whatsapp": [
        ("whatsapp", 7), ("whatsap", 7), ("whatssap", 7), ("wasap", 6), ("wassap", 6),
        ("por whatsapp", 8), ("por whatsap", 8), ("manda un whatsapp", 8),
        ("envía un whatsapp", 8), ("enviar whatsapp", 8), ("envía un mensaje", 5),
        ("manda mensaje", 5), ("manda un mensaje", 5), ("envíale", 4), ("mándale", 4),
        ("llama a", 5), ("videollamada", 6), ("videollama a", 7),
    ],
    "youtube": [
        ("busca en youtube", 8), ("reproduce en youtube", 8), ("en youtube", 6),
        ("youtube", 6), ("reproduce", 5), ("reproducir", 5), ("pon música", 6),
        ("pon musica", 6), ("ponme", 2), ("pon ", 1),
    ],
    "vision": [
        ("activa la cámara", 8), ("activa la camara", 8), ("enciende la cámara", 8),
        ("toma una foto", 7), ("toma foto", 6), ("qué ves", 6), ("que ves", 6),
        ("describe la imagen", 7), ("foto y dime", 6),
    ],
    "sistema": [
        ("apaga el pc", 8), ("apaga la pc", 8), ("apagar", 5), ("reinicia", 6),
        ("reiniciar", 6), ("suspende", 6), ("bloquea la pantalla", 8),
        ("bloquea", 5), ("cierra sesión", 7), ("cerrar sesión", 7),
    ],
    "archivos": [
        ("abre la carpeta", 8), ("abrir carpeta", 7), ("abre carpeta", 7),
        ("abre el archivo", 8), ("abrir archivo", 7), ("carpeta de", 4),
        ("explorador de archivos", 7),
    ],
    "axiom": [
        ("axiom", 7), ("crea un programa", 7), ("genera código", 7),
        ("genera codigo", 7), ("escribe un script", 6), ("programa en python", 7),
        ("crea una aplicación", 7), ("crea una app", 6), ("haz un juego", 6),
        ("crea un juego", 6), ("api rest", 6), ("bot de discord", 6),
        ("web scraper", 6), ("pipeline de ml", 6),
    ],
    "creativo": [
        ("escribe una historia", 8), ("genera un caption", 8), ("hook para", 7),
        ("hook viral", 7), ("reseña de", 6), ("guión", 5), ("guion", 5),
        ("carrusel", 6), ("hilo de twitter", 7), ("caption", 5),
        ("escribe un post", 6), ("escribe un hilo", 6),
    ],
}

# En caso de empate de puntuación, las intenciones más específicas/críticas ganan.
_PRIORIDAD_INTENCION = [
    "vision_compra", "compras", "roblox", "axiom", "creativo", "viajes",
    "email", "whatsapp", "automatizacion", "pantalla", "vision", "sistema",
    "archivos", "traductor", "clima", "noticias", "youtube",
]

_CONFIRMACIONES = {"sí", "si", "dale", "claro", "ok", "adelante", "yes", "yep",
                   "reproducir ahora", "sí dale", "no", "cancelar"}


def detectar_intencion(entrada: str) -> str:
    """Detecta la intención principal del usuario mediante puntuación de señales."""
    e = " " + entrada.lower().strip() + " "
    e_strip = entrada.lower().strip()

    # Confirmaciones cortas y sueltas (sí/no/dale…) → el router decide el contexto.
    if e_strip in _CONFIRMACIONES:
        return "confirmar"

    # Puntuar cada intención.
    puntajes: Dict[str, int] = {}
    for intencion, senales in _SENALES_INTENCION.items():
        total = 0
        for frase, peso in senales:
            # Frases con espacios: coincidencia directa. Palabras sueltas: con bordes.
            if " " in frase:
                if frase in e:
                    total += peso
            elif (" " + frase + " ") in e or e.endswith(frase + " ") or e.startswith(" " + frase):
                total += peso
        if total:
            puntajes[intencion] = total

    if puntajes:
        mejor = max(puntajes.values())
        candidatas = [i for i, p in puntajes.items() if p == mejor]
        if len(candidatas) == 1:
            return candidatas[0]
        # Empate → desempatar por prioridad.
        for intencion in _PRIORIDAD_INTENCION:
            if intencion in candidatas:
                return intencion
        return candidatas[0]

    # Escritura automática (solo si no hubo otra señal creativa/axiom).
    if e_strip.startswith(("escribe ", "escribir ")):
        return "escribir"

    return "conversacion"
