"""
cerebros.py — Consejo de Cerebros (Multi-Cerebro x15) para Susan v3.

Un consejo de 15 cerebros especializados que colaboran para responder preguntas
difíciles, orquestando los modelos reales instalados en Ollama:
  · rápido   → llama3.2:3b
  · código   → qwen2.5-coder:7b
  · profundo → claude-3-5-sonnet-latest

Pipeline (preguntas difíciles):
  🧭 Planificador descompone y elige 2-4 especialistas relevantes
  🧠 Especialistas piensan EN PARALELO (hilos + timeout)
  🔎 Crítico revisa errores y contradicciones
  🧩 Sintetizador funde todo en UNA respuesta final (se transmite token a token)

Preguntas fáciles (saludo, hora, ≤3 palabras): un solo cerebro rápido, instantáneo.

Diseño seguro: timeout por cerebro + tope total, acumulación protegida con Lock,
y si algo falla → vuelve automáticamente a IA.generar_respuesta (comportamiento actual).
"""

import re
import json
import time
import threading
from dataclasses import dataclass, field
from typing import Optional, Callable, List, Dict

from logger import logger
import ia as IA


# ── Niveles de modelo (tier) ──────────────────────────────────────────────────
TIER_FAST = "fast"   # → llama3.2:3b
TIER_CODE = "code"   # → qwen2.5-coder:7b
TIER_DEEP = "deep"   # → claude-3-5-sonnet-latest (potente; degrada si no está)


# ── Modelos de datos ──────────────────────────────────────────────────────────
@dataclass
class Cerebro:
    id: str
    nombre: str
    emoji: str
    system: str
    tier: str = TIER_FAST
    etiquetas: List[str] = field(default_factory=list)


@dataclass
class AporteCerebro:
    cerebro_id: str
    nombre: str
    texto: str
    ok: bool
    ms: int


class ConsejoVacioError(Exception):
    """Ningún cerebro produjo un aporte utilizable."""


# Coletilla común para todos los especialistas: su salida alimenta al Sintetizador.
_COLETILLA = (
    " Responde en español, breve y al grano. Tu salida NO va directa al usuario: "
    "alimenta a un Sintetizador, así que no saludes ni te despidas, solo aporta tu parte."
)


# ── Roster de 15 cerebros ─────────────────────────────────────────────────────
CEREBROS: List[Cerebro] = [
    Cerebro("planificador", "Planificador", "🧭",
            system=("Eres el Planificador de un consejo de cerebros de IA. "
                    "Eliges qué especialistas deben responder. NO respondas la pregunta."),
            tier=TIER_FAST),
    Cerebro("logico", "Lógico", "🧠",
            system=("Eres el Lógico/Razonador. Razona paso a paso: identifica premisas, "
                    "deduce conclusiones y marca los supuestos." + _COLETILLA),
            tier=TIER_DEEP),
    Cerebro("investigador", "Investigador", "🔬",
            system=("Eres el Investigador. Aporta hechos, datos y contexto relevante. "
                    "Indica con certeza lo que sabes y señala lo incierto." + _COLETILLA),
            tier=TIER_FAST,
            etiquetas=["qué es", "quién", "cuándo", "dónde", "historia", "dato", "explica"]),
    Cerebro("critico", "Crítico", "🔎",
            system=("Eres el Crítico/Verificador. Revisa los aportes en busca de errores, "
                    "contradicciones y afirmaciones dudosas. Devuelve correcciones breves "
                    "en viñetas. Si todo es correcto, di 'Sin observaciones'."),
            tier=TIER_DEEP),
    Cerebro("sintetizador", "Sintetizador", "🧩",
            system=("Eres el Sintetizador. Integras los aportes de los especialistas en UNA "
                    "respuesta final para el usuario: en español, clara, directa y útil. "
                    "No menciones a los especialistas ni el proceso interno. Sin preámbulos."),
            tier=TIER_DEEP),
    Cerebro("tecnico", "Técnico", "💻",
            system=("Eres el Técnico/Programador. Da código correcto, idiomático y mínimo, "
                    "con una explicación breve." + _COLETILLA),
            tier=TIER_CODE,
            etiquetas=["código", "codigo", "programa", "función", "funcion", "python",
                       "javascript", "script", "bug", "error", "api", "clase", "algoritmo"]),
    Cerebro("matematico", "Matemático", "📐",
            system=("Eres el Matemático. Resuelve con rigor numérico, muestra el cálculo y "
                    "verifica el resultado." + _COLETILLA),
            tier=TIER_CODE,
            etiquetas=["calcula", "cuánto es", "cuanto es", "ecuación", "ecuacion", "número",
                       "numero", "matemática", "matematica", "derivada", "integral",
                       "porcentaje", "raíz", "suma", "multiplica"]),
    Cerebro("creativo", "Creativo", "🎨",
            system=("Eres el Creativo. Aporta ideas originales, analogías y enfoques "
                    "alternativos." + _COLETILLA),
            tier=TIER_FAST,
            etiquetas=["idea", "ideas", "imagina", "creativo", "original", "inventa",
                       "nombre para", "historia", "diseña"]),
    Cerebro("estratega", "Estratega", "♟️",
            system=("Eres el Estratega. Evalúa opciones, trade-offs y riesgos, y recomienda "
                    "un plan de acción priorizado." + _COLETILLA),
            tier=TIER_DEEP,
            etiquetas=["plan", "estrategia", "compara", "opciones", "decisión", "decision",
                       "mejor opción", "ventajas", "desventajas", "pros", "contras",
                       "cómo lograr", "como lograr", "pasos"]),
    Cerebro("empatico", "Empático", "💗",
            system=("Eres el Empático. Considera el lado humano y emocional, con tono cálido "
                    "y consejos prácticos y sensibles." + _COLETILLA),
            tier=TIER_FAST,
            etiquetas=["me siento", "consejo", "ayuda con", "triste", "ansiedad", "relación",
                       "relacion", "miedo", "motiva", "ánimo", "animo"]),
    Cerebro("linguista", "Lingüista", "🗣️",
            system=("Eres el Lingüista/Traductor. Experto en idiomas y traducción precisa; "
                    "preserva matices y explica el lenguaje." + _COLETILLA),
            tier=TIER_FAST,
            etiquetas=["idioma", "gramática", "gramatica", "significa", "palabra", "frase",
                       "cómo se dice", "como se dice", "traduce"]),
    Cerebro("memorioso", "Memorioso", "📒",
            system=("Eres el Memorioso. Usas el historial reciente de la conversación para "
                    "mantener continuidad y recordar lo ya dicho." + _COLETILLA),
            tier=TIER_FAST),
    Cerebro("etico", "Ético", "⚖️",
            system=("Eres el Ético. Señala implicaciones éticas, riesgos y límites, y mantén "
                    "las respuestas seguras y responsables." + _COLETILLA),
            tier=TIER_FAST,
            etiquetas=["ético", "etico", "moral", "debería", "deberia", "correcto", "legal",
                       "peligro", "riesgo", "seguro"]),
    Cerebro("veloz", "Veloz", "⚡",
            system=("Eres el Veloz. Da una respuesta directa y breve de inmediato." + _COLETILLA),
            tier=TIER_FAST),
    Cerebro("visionario", "Visionario", "🔭",
            system=("Eres el Visionario. Proyecta tendencias, escenarios futuros e "
                    "implicaciones a largo plazo." + _COLETILLA),
            tier=TIER_DEEP,
            etiquetas=["futuro", "tendencia", "predice", "dentro de", "en el futuro",
                       "evolución", "evolucion", "qué pasará", "que pasara", "largo plazo"]),
]

CEREBROS_POR_ID: Dict[str, Cerebro] = {c.id: c for c in CEREBROS}

# Especialistas que pueden seleccionarse para el fan-out paralelo
# (excluye las etapas fijas del pipeline).
_ETAPAS_FIJAS = {"planificador", "critico", "sintetizador"}
_ESPECIALISTAS = [c.id for c in CEREBROS if c.id not in _ETAPAS_FIJAS]


# ── Detección de complejidad ──────────────────────────────────────────────────
_SALUDOS = {
    "hola", "buenas", "hey", "qué tal", "que tal", "gracias", "ok", "vale",
    "adiós", "adios", "chau", "buenos días", "buenas tardes", "buenas noches",
    "cómo estás", "como estas", "test", "prueba",
}

_GATILLOS_DIFICIL = [
    "explica", "explícame", "explicame", "compara", "analiza", "analízame",
    "diseña", "por qué", "porqué", "por que", "cómo funciona", "como funciona",
    "cómo puedo", "como puedo", "ventajas y desventajas", "pros y contras",
    "paso a paso", "estrategia", "plan para", "demuestra", "calcula",
    "optimiza", "arquitectura", "algoritmo", "diferencia entre", "evalúa",
    "evalua", "justifica", "resume", "desarrolla", "profundiza", "razona",
    "qué opinas", "que opinas", "ayúdame a", "ayudame a",
]


def es_pregunta_dificil(entrada: str, umbral_palabras: int = 25) -> bool:
    """Heurística pura (sin I/O): True → convocar al consejo; False → cerebro rápido."""
    e = entrada.lower().strip()
    n_pal = len(e.split())

    # 1. Trivial → fácil
    if not e or e in _SALUDOS or n_pal <= 3:
        return False
    if any(t in e for t in ["qué hora", "que hora", "qué día", "que dia", "fecha de hoy"]):
        return False

    # 2. Verbos de razonamiento explícitos → difícil
    if any(g in e for g in _GATILLOS_DIFICIL):
        return True

    # 3. Señales estructurales
    if (e.count("?") + e.count("¿")) >= 2:        # pregunta multi-parte
        return True
    if n_pal >= umbral_palabras:                  # pregunta larga
        return True
    if (" y " in e or "," in e) and n_pal >= 15:  # compuesta + longitud media
        return True

    return False


# ── Consejo ───────────────────────────────────────────────────────────────────
class ConsejoCerebros:
    def __init__(self, config: Optional[Dict] = None):
        cer = (config or {}).get("cerebros", {})
        self.max_paralelo      = int(cer.get("max_paralelo", 4))
        self.timeout_cerebro_s = int(cer.get("timeout_cerebro_s", 35))
        self.cap_total_s       = int(cer.get("cap_total_s", 75))
        self.umbral_palabras   = int(cer.get("umbral_palabras", 25))
        self.usar_critico      = bool(cer.get("usar_critico", True))
        self.keep_alive_deep   = cer.get("keep_alive_deep", "2m")

    # ── Llamada a un cerebro (reusa el motor de ia.py) ────────────────────────
    def _llamar(self, tier: str, prompt: str, system: str,
                timeout: int, on_token: Optional[Callable] = None) -> str:
        modelo = IA.resolver_modelo(tier)
        ka = self.keep_alive_deep if tier == TIER_DEEP else None
        try:
            return IA.llamar_ollama_stream(
                prompt, modelo=modelo, timeout=timeout,
                on_token=on_token, system=system, keep_alive=ka,
            ) or ""
        except Exception as exc:
            logger.warning(f"[Cerebros] fallo en modelo {modelo}: {exc}")
            return ""

    # ── Selección de especialistas ────────────────────────────────────────────
    def _planificar(self, entrada: str) -> List[str]:
        ids_disponibles = ", ".join(
            f"{cid} ({CEREBROS_POR_ID[cid].nombre})" for cid in _ESPECIALISTAS
        )
        prompt = (
            f"Pregunta del usuario:\n{entrada}\n\n"
            f"Especialistas disponibles: {ids_disponibles}\n\n"
            f"Elige los 2 a 4 MÁS relevantes para esta pregunta. "
            f"Devuelve SOLO un objeto JSON: {{\"especialistas\": [\"id1\", \"id2\"]}}"
        )
        raw = self._llamar(TIER_FAST, prompt, CEREBROS_POR_ID["planificador"].system, 20)
        return self._parsear_ids(raw)

    def _parsear_ids(self, raw: str) -> List[str]:
        if not raw:
            return []
        ids: List[str] = []
        # 1) Extraer primer bloque {...} y parsear JSON
        m = re.search(r"\{[\s\S]*?\}", raw)
        if m:
            try:
                data = json.loads(m.group(0))
                lista = data.get("especialistas") or data.get("ids") or []
                ids = [str(x).strip().lower() for x in lista]
            except Exception:
                ids = []
        # 2) Fallback: buscar ids conocidos como subcadena
        if not ids:
            low = raw.lower()
            ids = [cid for cid in _ESPECIALISTAS if cid in low]
        # Filtrar a ids válidos de especialistas
        return [cid for cid in ids if cid in _ESPECIALISTAS]

    def _seleccionar_por_palabras(self, entrada: str) -> List[str]:
        e = entrada.lower()
        return [cid for cid in _ESPECIALISTAS
                if any(tag in e for tag in CEREBROS_POR_ID[cid].etiquetas)]

    def _seleccionar(self, entrada: str, historial: List[str]) -> List[str]:
        ids = self._planificar(entrada)
        if not ids:
            ids = self._seleccionar_por_palabras(entrada)

        # Núcleo siempre presente: Lógico + Investigador (baratos y útiles).
        base: List[str] = []
        for cid in ids + ["logico", "investigador"]:
            if cid in CEREBROS_POR_ID and cid not in base and cid in _ESPECIALISTAS:
                base.append(cid)

        # Memorioso solo si hay historial.
        if historial and "memorioso" not in base:
            base.append("memorioso")

        seleccion = base[:max(2, self.max_paralelo)]
        if "logico" not in seleccion:   # garantizar al menos el razonador
            seleccion = ["logico"] + seleccion[:self.max_paralelo - 1]
        return seleccion

    # ── Construcción de prompts ───────────────────────────────────────────────
    @staticmethod
    def _prompt_especialista(cer: Cerebro, entrada: str, historial: List[str],
                             contexto_extra: str) -> str:
        partes = []
        if contexto_extra:
            partes.append(contexto_extra.strip())
        if cer.id == "memorioso" and historial:
            partes.append("Historial reciente:\n" + "\n".join(historial[-8:]))
        partes.append(f"Pregunta del usuario:\n{entrada}")
        partes.append(f"Tu aporte como {cer.nombre}:")
        return "\n\n".join(partes)

    @staticmethod
    def _formatear_aportes(aportes: List[AporteCerebro]) -> str:
        return "\n".join(f"- [{a.nombre}]: {a.texto[:1200]}" for a in aportes)

    # ── Pipeline principal ────────────────────────────────────────────────────
    def responder(
        self,
        entrada: str,
        historial: Optional[List[str]] = None,
        contexto_extra: str = "",
        on_token: Optional[Callable[[str], None]] = None,
        on_progreso: Optional[Callable[[str], None]] = None,
        on_cerebro: Optional[Callable[[str, str], None]] = None,
    ) -> str:
        historial = historial or []
        t0 = time.monotonic()

        def prog(msg: str):
            if on_progreso:
                try: on_progreso(msg)
                except Exception: pass

        def señal(estado: str, nombre: str):
            if on_cerebro:
                try: on_cerebro(estado, nombre)
                except Exception: pass

        # ── Etapa 1: Planificador ─────────────────────────────────────────────
        prog("🧭 Planificador analizando la pregunta…")
        seleccion = self._seleccionar(entrada, historial)
        logger.info(f"[Cerebros] Especialistas: {seleccion}")

        # ── Etapa 2: Especialistas en paralelo ────────────────────────────────
        aportes: List[AporteCerebro] = []
        lock = threading.Lock()

        def _correr(cer: Cerebro):
            señal("inicio", cer.nombre)
            ti = time.monotonic()
            prompt = self._prompt_especialista(cer, entrada, historial, contexto_extra)
            txt = self._llamar(cer.tier, prompt, cer.system, self.timeout_cerebro_s)
            ok = bool(txt and txt.strip())
            if ok:
                with lock:
                    aportes.append(AporteCerebro(
                        cer.id, cer.nombre, txt.strip(), True,
                        int((time.monotonic() - ti) * 1000)))
            señal("fin" if ok else "error", cer.nombre)

        hilos = []
        for cid in seleccion:
            h = threading.Thread(target=_correr, args=(CEREBROS_POR_ID[cid],), daemon=True)
            hilos.append(h)
            h.start()

        # Tope total de tiempo: se abandona a los rezagados (hilos daemon).
        deadline = t0 + self.cap_total_s
        for h in hilos:
            h.join(timeout=max(0.1, deadline - time.monotonic()))

        with lock:
            aportes_final = list(aportes)

        if not aportes_final:
            raise ConsejoVacioError("ningún especialista respondió")

        logger.info(f"[Cerebros] {len(aportes_final)} aporte(s) en "
                    f"{int((time.monotonic()-t0)*1000)} ms")

        # ── Etapa 3: Crítico ──────────────────────────────────────────────────
        notas_critico = ""
        usado = time.monotonic() - t0
        if (self.usar_critico and len(aportes_final) >= 2
                and usado < self.cap_total_s * 0.7):
            prog("🔎 Crítico verificando los aportes…")
            señal("inicio", "Crítico")
            prompt_c = (
                f"Pregunta del usuario:\n{entrada}\n\n"
                f"Aportes de los especialistas:\n{self._formatear_aportes(aportes_final)}\n\n"
                f"Revisa y devuelve correcciones breves en viñetas."
            )
            notas_critico = self._llamar(
                TIER_DEEP, prompt_c, CEREBROS_POR_ID["critico"].system, 25)
            señal("fin", "Crítico")

        # ── Etapa 4: Sintetizador (transmite token a token) ───────────────────
        prog("🧩 Sintetizando la respuesta final…")
        señal("inicio", "Sintetizador")
        partes = []
        if contexto_extra:
            partes.append(contexto_extra.strip())
        partes.append(f"Pregunta del usuario:\n{entrada}")
        partes.append(f"Aportes de los especialistas:\n{self._formatear_aportes(aportes_final)}")
        partes.append(f"Notas del Crítico:\n{notas_critico.strip() or 'ninguna'}")
        partes.append("Integra TODO lo anterior en una sola respuesta final para el usuario.\n"
                      "Respuesta:")
        prompt_s = "\n\n".join(partes)

        final = self._llamar(TIER_DEEP, prompt_s, CEREBROS_POR_ID["sintetizador"].system,
                             40, on_token=on_token)
        if not final or not final.strip():
            # Último recurso: sintetizador rápido (sigue transmitiendo).
            final = self._llamar(TIER_FAST, prompt_s,
                                CEREBROS_POR_ID["sintetizador"].system, 30, on_token=on_token)
        señal("fin", "Sintetizador")

        if not final or not final.strip():
            raise ConsejoVacioError("el sintetizador no produjo respuesta")
        return final.strip()


# ── Singleton + wrapper funcional ─────────────────────────────────────────────
_consejo: Optional[ConsejoCerebros] = None


def get_consejo(config: Optional[Dict] = None) -> ConsejoCerebros:
    global _consejo
    if _consejo is None:
        _consejo = ConsejoCerebros(config or {})
    return _consejo


def responder_consejo(
    entrada: str,
    historial: Optional[List[str]] = None,
    contexto_extra: str = "",
    on_token: Optional[Callable[[str], None]] = None,
    on_progreso: Optional[Callable[[str], None]] = None,
    on_cerebro: Optional[Callable[[str, str], None]] = None,
    config: Optional[Dict] = None,
) -> str:
    """Punto de entrada: ejecuta el consejo y devuelve la respuesta final."""
    return get_consejo(config).responder(
        entrada, historial, contexto_extra=contexto_extra,
        on_token=on_token, on_progreso=on_progreso, on_cerebro=on_cerebro,
    )
