"""
agente_auto.py — Automatización avanzada del PC para Susan v3.
Tareas programadas, recordatorios, portapapeles, gestión de ventanas,
escritura automática y macros de teclado/ratón.
"""

import re, time, threading, subprocess, os, json
import pyautogui
import pyperclip
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Callable, Tuple
from logger import logger

try:
    import pygetwindow as gw
    HAS_GW = True
except ImportError:
    HAS_GW = False

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False


# ── Modelo de tarea ───────────────────────────────────────────────────────────
class Tarea:
    def __init__(self, descripcion: str, accion: Callable, hora: datetime,
                 repetir: str = "", activa: bool = True):
        self.id          = int(time.time() * 1000) % 100000
        self.descripcion = descripcion
        self.accion      = accion
        self.hora        = hora
        self.repetir     = repetir   # "diario", "semanal", "cada N min"
        self.activa      = activa
        self.disparada   = False

    def resumen(self) -> str:
        estado = "✅" if self.activa else "⏸"
        rep    = f" ({self.repetir})" if self.repetir else ""
        return f"{estado} [{self.id}] {self.descripcion} — {self.hora.strftime('%H:%M %d/%m')}{rep}"


# ── Agente de automatización ──────────────────────────────────────────────────
class AgenteAutomatizacion:
    """
    Automatiza tareas del PC:
    - Recordatorios y tareas programadas
    - Escritura automática con corrección
    - Portapapeles inteligente
    - Gestión de ventanas
    - Macros de teclado/ratón
    - Control del volumen y brillo
    """

    def __init__(self, on_alarma: Optional[Callable[[str], None]] = None):
        self._tareas:    List[Tarea]  = []
        self._historial_clipboard: List[str] = []
        self._lock       = threading.Lock()
        self._on_alarma  = on_alarma
        self._hilo_tareas = threading.Thread(target=self._loop_tareas, daemon=True)
        self._hilo_tareas.start()
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE    = 0.05
        logger.info("[Auto] Agente de automatización iniciado.")

    # ── Loop de tareas programadas ────────────────────────────────────────────
    def _loop_tareas(self) -> None:
        while True:
            ahora = datetime.now()
            with self._lock:
                for tarea in self._tareas[:]:
                    if not tarea.activa:
                        continue
                    if ahora >= tarea.hora and not tarea.disparada:
                        tarea.disparada = True
                        threading.Thread(target=self._disparar_tarea,
                                         args=(tarea,), daemon=True).start()
            time.sleep(15)  # Verificar cada 15 segundos

    def _disparar_tarea(self, tarea: Tarea) -> None:
        logger.info(f"[Auto] Disparando tarea: {tarea.descripcion}")
        try:
            tarea.accion()
        except Exception as exc:
            logger.error(f"[Auto] Error en tarea {tarea.id}: {exc}")

        # Reprogramar si es repetitiva
        if tarea.repetir == "diario":
            tarea.hora    = tarea.hora + timedelta(days=1)
            tarea.disparada = False
        elif tarea.repetir == "semanal":
            tarea.hora    = tarea.hora + timedelta(weeks=1)
            tarea.disparada = False
        elif "min" in tarea.repetir:
            m = re.search(r'(\d+)', tarea.repetir)
            if m:
                tarea.hora    = datetime.now() + timedelta(minutes=int(m.group(1)))
                tarea.disparada = False

        if self._on_alarma:
            self._on_alarma(f"⏰ {tarea.descripcion}")

    # ── Recordatorios ─────────────────────────────────────────────────────────
    def agregar_recordatorio(
        self,
        descripcion: str,
        hora: datetime,
        repetir: str = "",
        on_alarma: Optional[Callable] = None,
    ) -> str:
        def accion():
            msg = f"⏰ Recordatorio: {descripcion}"
            if on_alarma:
                on_alarma(msg)
            elif self._on_alarma:
                self._on_alarma(msg)
            # Notificación de Windows
            try:
                subprocess.Popen([
                    "powershell", "-Command",
                    f'[System.Windows.Forms.MessageBox]::Show("{descripcion}", "Susan - Recordatorio")'
                ], shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
            except Exception:
                pass

        tarea = Tarea(descripcion, accion, hora, repetir)
        with self._lock:
            self._tareas.append(tarea)
        logger.info(f"[Auto] Recordatorio [{tarea.id}]: {descripcion} @ {hora.strftime('%H:%M %d/%m')}")
        rep_txt = f" (se repite {repetir})" if repetir else ""
        return f"✔ Recordatorio **[{tarea.id}]** configurado: **{descripcion}** a las **{hora.strftime('%H:%M')}** del {hora.strftime('%d/%m/%Y')}{rep_txt}"

    def listar_tareas(self) -> str:
        with self._lock:
            activas = [t for t in self._tareas if t.activa]
        if not activas:
            return "No tienes tareas programadas."
        lineas = [f"📅 **{len(activas)} tarea(s) programada(s):**\n"]
        for t in activas:
            lineas.append(t.resumen())
        return "\n".join(lineas)

    def cancelar_tarea(self, id_tarea: int) -> str:
        with self._lock:
            for t in self._tareas:
                if t.id == id_tarea:
                    t.activa = False
                    return f"✔ Tarea [{id_tarea}] cancelada."
        return f"No encontré la tarea [{id_tarea}]."

    # ── Escritura automática ──────────────────────────────────────────────────
    def escribir_texto(self, texto: str, velocidad: float = 0.03) -> str:
        """Escribe texto en el campo activo de cualquier aplicación."""
        try:
            time.sleep(0.4)
            pyperclip.copy(texto)
            pyautogui.hotkey("ctrl", "v")
            logger.info(f"[Auto] Texto escrito ({len(texto)} chars)")
            return f"✔ Texto escrito: '{texto[:50]}{'…' if len(texto)>50 else ''}'"
        except Exception as exc:
            logger.error(f"[Auto] escribir_texto: {exc}")
            return f"✗ Error al escribir: {exc}"

    def escribir_con_correccion(self, texto: str, callback: Callable) -> None:
        """Corrige el texto con IA y luego lo escribe."""
        from ia import corregir_texto

        def _run():
            texto_corregido = corregir_texto(texto)
            def _escribir():
                self.escribir_texto(texto_corregido)
                callback(texto_corregido)
            threading.Thread(target=_escribir, daemon=True).start()

        threading.Thread(target=_run, daemon=True).start()

    # ── Portapapeles ──────────────────────────────────────────────────────────
    def copiar_al_portapapeles(self, texto: str) -> str:
        pyperclip.copy(texto)
        self._historial_clipboard.append(texto)
        if len(self._historial_clipboard) > 20:
            self._historial_clipboard.pop(0)
        return f"✔ Copiado al portapapeles: '{texto[:60]}…'"

    def pegar_portapapeles(self) -> str:
        try:
            contenido = pyperclip.paste()
            return f"📋 Portapapeles: '{contenido[:200]}'"
        except Exception:
            return "No hay nada en el portapapeles."

    def historial_portapapeles(self) -> str:
        if not self._historial_clipboard:
            return "El historial del portapapeles está vacío."
        lineas = ["📋 **Historial del portapapeles:**\n"]
        for i, item in enumerate(reversed(self._historial_clipboard[-10:]), 1):
            lineas.append(f"{i}. {item[:80]}{'…' if len(item)>80 else ''}")
        return "\n".join(lineas)

    # ── Gestión de ventanas ───────────────────────────────────────────────────
    def listar_ventanas(self) -> str:
        if not HAS_GW:
            return "pygetwindow no está instalado."
        try:
            ventanas = [w for w in gw.getAllWindows()
                       if w.visible and w.title and len(w.title) > 1]
            if not ventanas:
                return "No hay ventanas visibles."
            lineas = [f"🪟 **{len(ventanas)} ventana(s) abiertas:**\n"]
            for i, w in enumerate(ventanas[:15], 1):
                lineas.append(f"{i}. {w.title[:60]}")
            return "\n".join(lineas)
        except Exception as exc:
            return f"Error listando ventanas: {exc}"

    def activar_ventana(self, nombre: str) -> str:
        if not HAS_GW:
            return "pygetwindow no está instalado."
        try:
            ventanas = gw.getWindowsWithTitle(nombre)
            if not ventanas:
                # Búsqueda parcial
                todas = [w for w in gw.getAllWindows()
                        if w.visible and nombre.lower() in w.title.lower()]
                if not todas:
                    return f"No encontré la ventana '{nombre}'."
                ventanas = todas

            ventana = ventanas[0]
            ventana.activate()
            ventana.maximize()
            return f"✔ Ventana activada: {ventana.title}"
        except Exception as exc:
            return f"Error activando ventana: {exc}"

    def minimizar_ventana(self, nombre: str = "") -> str:
        if not HAS_GW:
            return "pygetwindow no está instalado."
        try:
            if nombre:
                ventanas = gw.getWindowsWithTitle(nombre)
                if ventanas:
                    ventanas[0].minimize()
                    return f"✔ Minimizada: {ventanas[0].title}"
            else:
                # Minimizar ventana activa
                pyautogui.hotkey("win", "down")
                return "✔ Ventana minimizada."
        except Exception as exc:
            return f"Error: {exc}"

    def cerrar_ventana(self, nombre: str) -> str:
        if not HAS_GW:
            return "pygetwindow no está instalado."
        try:
            ventanas = gw.getWindowsWithTitle(nombre)
            if ventanas:
                ventanas[0].close()
                return f"✔ Ventana cerrada: {ventanas[0].title}"
            return f"No encontré la ventana '{nombre}'."
        except Exception as exc:
            return f"Error cerrando ventana: {exc}"

    # ── Macros de teclado ─────────────────────────────────────────────────────
    def ejecutar_atajo(self, atajo: str) -> str:
        """Ejecuta un atajo de teclado. Ejemplo: 'ctrl+c', 'win+d', 'alt+f4'"""
        try:
            teclas = [t.strip() for t in atajo.lower().split("+")]
            pyautogui.hotkey(*teclas)
            return f"✔ Atajo ejecutado: {atajo}"
        except Exception as exc:
            return f"Error ejecutando atajo: {exc}"

    def tomar_captura(self, nombre: str = "") -> str:
        """Toma una captura de pantalla."""
        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            ruta = os.path.join(os.path.expanduser("~/Desktop"), f"captura_{ts}.png")
            if nombre:
                ruta = nombre if os.path.isabs(nombre) else \
                       os.path.join(os.path.expanduser("~/Desktop"), nombre)
            screenshot = pyautogui.screenshot()
            screenshot.save(ruta)
            logger.info(f"[Auto] Captura: {ruta}")
            return f"✔ Captura guardada en: {ruta}"
        except Exception as exc:
            return f"Error tomando captura: {exc}"

    # ── Control de volumen ────────────────────────────────────────────────────
    def cambiar_volumen(self, valor: int) -> str:
        """Sube o baja el volumen del sistema (0–100)."""
        try:
            import ctypes
            if valor < 0:
                for _ in range(abs(valor) // 5):
                    pyautogui.press("volumedown")
                return f"✔ Volumen bajado ({abs(valor)}%)"
            elif valor > 0:
                for _ in range(valor // 5):
                    pyautogui.press("volumeup")
                return f"✔ Volumen subido ({valor}%)"
            else:
                pyautogui.press("volumemute")
                return "✔ Volumen silenciado/activado."
        except Exception as exc:
            return f"Error controlando volumen: {exc}"

    # ── Procesos ──────────────────────────────────────────────────────────────
    def listar_procesos_pesados(self, top: int = 5) -> str:
        if not HAS_PSUTIL:
            return "psutil no está instalado."
        try:
            procs = []
            for p in psutil.process_iter(["name", "cpu_percent", "memory_percent"]):
                try:
                    procs.append(p.info)
                except Exception:
                    continue
            procs.sort(key=lambda p: p["cpu_percent"] or 0, reverse=True)
            lineas = [f"⚡ **Top {top} procesos por CPU:**\n"]
            for p in procs[:top]:
                lineas.append(
                    f"• {p['name'][:30]:<30} "
                    f"CPU: {p['cpu_percent']:.1f}%  "
                    f"RAM: {p['memory_percent']:.1f}%"
                )
            return "\n".join(lineas)
        except Exception as exc:
            return f"Error listando procesos: {exc}"

    def matar_proceso(self, nombre: str) -> str:
        if not HAS_PSUTIL:
            return "psutil no está instalado."
        try:
            killed = 0
            for p in psutil.process_iter(["name", "pid"]):
                if nombre.lower() in p.info["name"].lower():
                    p.kill()
                    killed += 1
            return f"✔ {killed} proceso(s) '{nombre}' terminado(s)." if killed \
                   else f"No encontré el proceso '{nombre}'."
        except Exception as exc:
            return f"Error: {exc}"

    # ── Manejar entrada ───────────────────────────────────────────────────────
    def manejar(self, entrada: str, on_alarma: Optional[Callable] = None) -> str:
        e = entrada.lower()

        # Recordatorio
        if any(t in e for t in ["recuérdame", "recordatorio", "alarma", "avísame",
                                  "programa un recordatorio", "recuerda"]):
            return self._procesar_recordatorio(entrada, on_alarma)

        # Listar tareas
        if any(t in e for t in ["mis tareas", "tareas programadas", "recordatorios",
                                  "qué tengo programado"]):
            return self.listar_tareas()

        # Cancelar tarea
        if any(t in e for t in ["cancela la tarea", "eliminar tarea", "borrar recordatorio"]):
            m = re.search(r'\b(\d+)\b', e)
            if m:
                return self.cancelar_tarea(int(m.group(1)))

        # Escribir texto
        if e.startswith(("escribe ", "escribir ", "escrib")):
            texto = re.sub(r'^(escrib[ei]r?\s+)', '', entrada, flags=re.IGNORECASE).strip()
            return self.escribir_texto(texto)

        # Portapapeles
        if any(t in e for t in ["qué hay en el portapapeles", "mostrar portapapeles", "pegar portapapeles"]):
            return self.pegar_portapapeles()
        if "historial del portapapeles" in e:
            return self.historial_portapapeles()
        if any(t in e for t in ["copia ", "copiar "]):
            texto = re.sub(r'^(copia[r]?\s+)', '', entrada, flags=re.IGNORECASE).strip()
            return self.copiar_al_portapapeles(texto)

        # Ventanas
        if any(t in e for t in ["ventanas abiertas", "qué ventanas", "listar ventanas"]):
            return self.listar_ventanas()
        if any(t in e for t in ["activa la ventana", "cambia a", "muestra la ventana"]):
            nombre = re.sub(r'.*(activa la ventana|cambia a|muestra la ventana)\s*', '', e).strip()
            return self.activar_ventana(nombre)
        if "cierra la ventana" in e:
            nombre = e.replace("cierra la ventana", "").strip()
            return self.cerrar_ventana(nombre)
        if "minimiza" in e:
            nombre = e.replace("minimiza", "").strip()
            return self.minimizar_ventana(nombre)

        # Captura de pantalla
        if any(t in e for t in ["captura de pantalla", "screenshot", "toma captura"]):
            return self.tomar_captura()

        # Volumen
        if any(t in e for t in ["sube el volumen", "subir volumen"]):
            m = re.search(r'(\d+)', e)
            return self.cambiar_volumen(int(m.group(1)) if m else 20)
        if any(t in e for t in ["baja el volumen", "bajar volumen"]):
            m = re.search(r'(\d+)', e)
            return self.cambiar_volumen(-int(m.group(1)) if m else -20)
        if any(t in e for t in ["silencia", "mute", "silenciar"]):
            return self.cambiar_volumen(0)

        # Procesos
        if any(t in e for t in ["procesos pesados", "qué consume más", "cpu alto"]):
            return self.listar_procesos_pesados()
        if any(t in e for t in ["mata el proceso", "cerrar proceso", "kill"]):
            nombre = re.sub(r'.*(mata el proceso|cerrar proceso|kill)\s*', '', e).strip()
            return self.matar_proceso(nombre)

        # Atajo de teclado
        if any(t in e for t in ["ejecuta el atajo", "presiona", "atajo de teclado"]):
            atajo = re.sub(r'.*(ejecuta el atajo|presiona|atajo de teclado)\s*', '', e).strip()
            return self.ejecutar_atajo(atajo)

        return (
            "Puedo automatizar:\n"
            "• 'Recuérdame a las 3pm hacer ejercicio'\n"
            "• 'Escribe Hola mundo'\n"
            "• 'Ventanas abiertas'\n"
            "• 'Activa la ventana Chrome'\n"
            "• 'Captura de pantalla'\n"
            "• 'Sube el volumen 20%'\n"
            "• 'Procesos pesados'\n"
            "• 'Mis tareas programadas'"
        )

    # ── Parsing de recordatorios ──────────────────────────────────────────────
    def _procesar_recordatorio(self, entrada: str, on_alarma: Optional[Callable] = None) -> str:
        ahora = datetime.now()

        # Extraer hora
        hora_obj = self._extraer_hora(entrada, ahora)
        if not hora_obj:
            return "¿A qué hora? Di: 'Recuérdame a las 3:30 pm hacer ejercicio'"

        # Extraer descripción
        desc = self._extraer_descripcion_recordatorio(entrada)
        if not desc:
            desc = "Recordatorio"

        # Extraer repetición
        repetir = ""
        e = entrada.lower()
        if "todos los días" in e or "cada día" in e or "diario" in e:
            repetir = "diario"
        elif "cada semana" in e or "semanal" in e:
            repetir = "semanal"
        elif "cada" in e:
            m = re.search(r'cada\s+(\d+)\s+min', e)
            if m:
                repetir = f"cada {m.group(1)} min"

        return self.agregar_recordatorio(desc, hora_obj, repetir, on_alarma)

    def _extraer_hora(self, texto: str, base: datetime) -> Optional[datetime]:
        e = texto.lower()

        # "en X minutos/horas"
        m = re.search(r'en\s+(\d+)\s+(minuto|hora)', e)
        if m:
            n, unidad = int(m.group(1)), m.group(2)
            if "hora" in unidad:
                return base + timedelta(hours=n)
            return base + timedelta(minutes=n)

        # "a las HH:MM" o "a las H pm/am"
        m = re.search(r'a las?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', e)
        if m:
            h  = int(m.group(1))
            mi = int(m.group(2)) if m.group(2) else 0
            ap = m.group(3)
            if ap == "pm" and h < 12:
                h += 12
            elif ap == "am" and h == 12:
                h = 0
            objetivo = base.replace(hour=h, minute=mi, second=0, microsecond=0)
            if objetivo < base:
                objetivo += timedelta(days=1)
            return objetivo

        # "mañana a las HH"
        if "mañana" in e:
            m = re.search(r'(\d{1,2})(?::(\d{2}))?', e)
            if m:
                h  = int(m.group(1))
                mi = int(m.group(2)) if m.group(2) else 0
                return (base + timedelta(days=1)).replace(hour=h, minute=mi, second=0)

        return None

    def _extraer_descripcion_recordatorio(self, texto: str) -> str:
        """Extrae la descripción del recordatorio eliminando palabras de comando."""
        desc = re.sub(
            r'(?:recuérdame|recuerda|recordatorio|alarma|avísame|programa un recordatorio|'
            r'a las?\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|'
            r'en\s+\d+\s+(?:minutos?|horas?)|'
            r'todos los días|cada día|diario|cada semana|semanal|'
            r'mañana|hoy)',
            '', texto, flags=re.IGNORECASE
        ).strip().strip('.,;:')
        return desc[:100] if desc else "Recordatorio"


# ── Instancia global ──────────────────────────────────────────────────────────
_auto: Optional[AgenteAutomatizacion] = None

def get_auto(on_alarma: Optional[Callable] = None) -> AgenteAutomatizacion:
    global _auto
    if _auto is None:
        _auto = AgenteAutomatizacion(on_alarma)
    elif on_alarma and not _auto._on_alarma:
        _auto._on_alarma = on_alarma
    return _auto
