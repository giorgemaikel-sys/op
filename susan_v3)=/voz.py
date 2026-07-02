"""
voz.py — Sistema de reconocimiento de voz continuo para Susan v3.

Arquitectura de stream único con máquina de estados:
  IDLE → detecta "Susan" → ACTIVO (captura comando) → PROCESANDO → IDLE

SIN reinicio de stream entre wake word y comando → respuesta instantánea.
"""

import os, re, time, json, threading, collections
from typing import Callable, Optional
from logger import logger

try:
    import numpy as np
    import sounddevice as sd
    HAS_AUDIO = True
except ImportError:
    HAS_AUDIO = False

try:
    import vosk
    HAS_VOSK = True
except ImportError:
    HAS_VOSK = False


# ── Estados ───────────────────────────────────────────────────────────────────
IDLE      = "idle"       # esperando wake word
ACTIVO    = "activo"     # capturando comando del usuario
PAUSADO   = "pausado"    # mic desactivado temporalmente (TTS hablando)


class SistemaVoz:
    """
    Escucha continua de audio con un ÚNICO InputStream de sounddevice.
    Cambia entre modos sin reiniciar nada → cero lag tras decir "Susan".

    Parámetros
    ----------
    on_wakeword : callable()
        Se llama cuando se detecta la palabra clave.
    on_comando  : callable(texto: str)
        Se llama con el texto final del comando.
    on_mic_level: callable(nivel: float)
        Callback para animar el visualizador (0.0–1.0).
    """

    # Wake words aceptadas (cualquier variante)
    WAKE_WORDS = {"susan", "susana", "hola susan", "hey susan",
                  "oye susan", "sus", "suzan"}

    # Parámetros de captura
    SAMPLE_RATE  = 16000   # Hz — requerido por Vosk
    BLOCK_SIZE   = 512     # muestras por bloque (≈32 ms) — más pequeño = menos lag
    SILENCIO_MAX = 2.2     # segundos de silencio para cerrar el turno
    TIMEOUT_MAX  = 12.0    # segundos máximos de escucha activa
    RMS_UMBRAL   = 0.012   # nivel mínimo para considerar voz (ajusta según micrófono)

    def __init__(
        self,
        on_wakeword:  Callable,
        on_comando:   Callable[[str], None],
        on_mic_level: Optional[Callable[[float], None]] = None,
        modelo_path:  str = "",
    ):
        self.on_wakeword   = on_wakeword
        self.on_comando    = on_comando
        self.on_mic_level  = on_mic_level
        self.modelo_path   = modelo_path or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "modelo_es"
        )

        self._estado       = IDLE
        self._running      = False
        self._hilo: Optional[threading.Thread] = None
        self._lock         = threading.Lock()

        # Buffers
        self._ultimo_audio  = 0.0     # timestamp del último bloque con voz
        self._inicio_activo = 0.0     # cuándo empezó el modo activo
        self._texto_parcial = ""      # acumulación de texto parcial

        # Nivel del micrófono (para animación)
        self.mic_level     = 0.0

    # ── API pública ───────────────────────────────────────────────────────────
    @property
    def estado(self) -> str:
        return self._estado

    @property
    def disponible(self) -> bool:
        return HAS_AUDIO and HAS_VOSK and os.path.isdir(self.modelo_path)

    def iniciar(self) -> bool:
        if not self.disponible:
            logger.warning("[Voz] No disponible. Verifica sounddevice, vosk y modelo_es/")
            return False
        if self._running:
            return True
        self._running = True
        self._hilo = threading.Thread(target=self._loop_principal, daemon=True)
        self._hilo.start()
        logger.info("[Voz] Sistema de voz iniciado (stream único)")
        return True

    def detener(self):
        self._running = False
        logger.info("[Voz] Sistema de voz detenido")

    def activar_manualmente(self):
        """Simula la detección del wake word (botón de micrófono)."""
        with self._lock:
            if self._estado != PAUSADO:
                self._cambiar_a_activo()

    def desactivar(self):
        """Vuelve a modo idle (p.ej. cuando el usuario cancela)."""
        with self._lock:
            self._estado = IDLE
            self._texto_parcial = ""

    def pausar(self):
        """Pausa la escucha mientras Susan habla (evita eco)."""
        with self._lock:
            self._estado = PAUSADO

    def reanudar(self):
        """Reanuda la escucha después de que Susan termina de hablar."""
        with self._lock:
            if self._estado == PAUSADO:
                self._estado = IDLE

    # ── Loop principal (corre en su propio hilo) ──────────────────────────────
    def _loop_principal(self):
        """Carga el modelo una vez y mantiene vivo el stream de audio con
        reconexión automática: si PortAudio falla (p. ej. cambio de micrófono),
        reinicia el stream con backoff en vez de morir para siempre."""
        try:
            modelo = vosk.Model(self.modelo_path)
        except Exception as exc:
            logger.error(f"[Voz] No se pudo cargar el modelo Vosk: {exc}")
            self._running = False
            return

        logger.info("[Voz] Modelo Vosk cargado. Escuchando…")

        backoff = 1.0
        while self._running:
            try:
                self._bucle_audio(modelo)
                # Salida limpia (self._running == False) → terminar el hilo.
            except Exception as exc:
                if not self._running:
                    break
                logger.error(f"[Voz] Stream de audio falló: {exc}. "
                             f"Reintentando en {backoff:.0f}s…")
                self._estado = IDLE
                # Forzar un reinicio limpio de PortAudio antes de reintentar.
                try: sd.stop()
                except Exception: pass
                try:
                    sd._terminate(); sd._initialize()
                except Exception: pass
                time.sleep(backoff)
                backoff = min(backoff * 2, 15.0)   # backoff exponencial con tope
            else:
                backoff = 1.0
        logger.info("[Voz] Loop de voz finalizado.")

    def _bucle_audio(self, modelo):
        """Abre un InputStream y procesa el audio hasta que falle o se detenga.
        Cualquier excepción se propaga a _loop_principal para reconectar."""
        # Un reconocedor para wake word y otro para comandos (mismo audio → sin lag)
        rec_wake = vosk.KaldiRecognizer(modelo, self.SAMPLE_RATE)
        rec_cmd  = vosk.KaldiRecognizer(modelo, self.SAMPLE_RATE)
        rec_cmd.SetWords(True)

        with sd.InputStream(
            samplerate=self.SAMPLE_RATE,
            channels=1,
            dtype="int16",
            blocksize=self.BLOCK_SIZE,
        ) as stream:
            while self._running:
                datos, _ = stream.read(self.BLOCK_SIZE)

                # ── Nivel de audio para animación ─────────────────────────────
                rms = float(np.sqrt(np.mean(datos.astype(np.float64) ** 2))) / 32768.0
                self.mic_level = min(rms * 6.0, 1.0)
                if self.on_mic_level:
                    self.on_mic_level(self.mic_level)

                estado = self._estado   # snapshot sin lock

                # ── PAUSADO: descartar audio ──────────────────────────────────
                if estado == PAUSADO:
                    continue

                # ── IDLE: detectar wake word ──────────────────────────────────
                if estado == IDLE:
                    if rec_wake.AcceptWaveform(datos.tobytes()):
                        txt = json.loads(rec_wake.Result()).get("text", "").lower()
                    else:
                        txt = json.loads(rec_wake.PartialResult()).get("partial", "").lower()

                    if self._es_wake_word(txt):
                        logger.info(f"[Voz] Wake word detectado: '{txt}'")
                        with self._lock:
                            # Reiniciar el reconocedor de comandos
                            # para limpiar cualquier audio anterior
                            rec_cmd = vosk.KaldiRecognizer(modelo, self.SAMPLE_RATE)
                            rec_cmd.SetWords(True)
                            self._cambiar_a_activo()
                        # Notificar UI (sin esperar audio extra)
                        self.on_wakeword()

                # ── ACTIVO: capturar el comando ───────────────────────────────
                elif estado == ACTIVO:
                    # Actualizar timestamp si hay voz real
                    if rms > self.RMS_UMBRAL:
                        self._ultimo_audio = time.time()

                    if rec_cmd.AcceptWaveform(datos.tobytes()):
                        resultado = json.loads(rec_cmd.Result())
                        txt = resultado.get("text", "").strip()
                        if txt and len(txt) > 2:
                            # Frase completa detectada → procesar
                            logger.info(f"[Voz] Comando: '{txt}'")
                            with self._lock:
                                self._estado = IDLE
                            self._enviar_comando(txt)
                            # Reiniciar reconocedor wake word
                            rec_wake = vosk.KaldiRecognizer(modelo, self.SAMPLE_RATE)
                    else:
                        parcial = json.loads(rec_cmd.PartialResult()).get("partial","")
                        if parcial:
                            self._texto_parcial = parcial

                    # Verificar timeout por silencio o tiempo máximo
                    silencio = time.time() - self._ultimo_audio
                    total    = time.time() - self._inicio_activo

                    if silencio > self.SILENCIO_MAX or total > self.TIMEOUT_MAX:
                        # Extraer lo que haya acumulado
                        final = json.loads(rec_cmd.FinalResult()).get("text","").strip()
                        with self._lock:
                            self._estado = IDLE
                        if final and len(final) > 2:
                            logger.info(f"[Voz] Comando (timeout): '{final}'")
                            self._enviar_comando(final)
                        elif self._texto_parcial and len(self._texto_parcial) > 2:
                            logger.info(f"[Voz] Comando (parcial): '{self._texto_parcial}'")
                            self._enviar_comando(self._texto_parcial)
                        # Reiniciar
                        rec_wake = vosk.KaldiRecognizer(modelo, self.SAMPLE_RATE)
                        rec_cmd  = vosk.KaldiRecognizer(modelo, self.SAMPLE_RATE)
                        rec_cmd.SetWords(True)
                        self._texto_parcial = ""

    # ── Helpers internos ──────────────────────────────────────────────────────
    def _cambiar_a_activo(self):
        """Transición a modo activo. Llamar con el lock tomado."""
        self._estado        = ACTIVO
        self._inicio_activo = time.time()
        self._ultimo_audio  = time.time()
        self._texto_parcial = ""

    def _es_wake_word(self, texto: str) -> bool:
        """Devuelve True si el texto contiene alguna wake word."""
        return any(ww in texto for ww in self.WAKE_WORDS)

    def _enviar_comando(self, texto: str):
        """Limpia el texto y llama al callback en un hilo separado."""
        texto = texto.strip().rstrip(".").strip()
        # Quitar la wake word si quedó al inicio
        for ww in sorted(self.WAKE_WORDS, key=len, reverse=True):
            if texto.lower().startswith(ww):
                texto = texto[len(ww):].strip()
                break
        if texto:
            threading.Thread(target=self.on_comando, args=(texto,), daemon=True).start()


# ── TTS offline (respaldo sin internet) ───────────────────────────────────────
def hablar_offline(texto: str, velocidad: int = 180) -> bool:
    """Habla usando la voz local de Windows (SAPI5) vía pyttsx3, SIN internet.
    Pensado como respaldo de edge-tts (que requiere conexión). Bloquea hasta
    terminar de hablar; llámalo en un hilo. Devuelve True si reprodujo audio."""
    if not texto or not texto.strip():
        return False
    try:
        import pyttsx3
    except ImportError:
        logger.warning("[TTS] pyttsx3 no instalado; TTS offline no disponible "
                       "(pip install pyttsx3).")
        return False
    try:
        engine = pyttsx3.init()
        engine.setProperty("rate", velocidad)
        # Intentar elegir una voz en español si existe.
        try:
            for v in engine.getProperty("voices"):
                desc = f"{getattr(v, 'name', '')} {getattr(v, 'id', '')}".lower()
                if any(k in desc for k in ["spanish", "español", "espanol",
                                            "helena", "sabina", "laura", "es-", "es_"]):
                    engine.setProperty("voice", v.id)
                    break
        except Exception:
            pass
        engine.say(texto)
        engine.runAndWait()
        try: engine.stop()
        except Exception: pass
        return True
    except Exception as exc:
        logger.error(f"[TTS] offline falló: {exc}")
        return False


# ── Diagnóstico ───────────────────────────────────────────────────────────────
def diagnosticar() -> dict:
    """Devuelve un dict con el estado de cada dependencia de voz."""
    resultado = {
        "sounddevice": HAS_AUDIO,
        "vosk":        HAS_VOSK,
        "modelo_es":   os.path.isdir(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "modelo_es")
        ),
        "microfono":   False,
    }
    if HAS_AUDIO:
        try:
            devices = sd.query_devices()
            resultado["microfono"] = any(
                d["max_input_channels"] > 0 for d in devices
            )
        except Exception:
            pass
    resultado["listo"] = all(resultado.values())
    return resultado
