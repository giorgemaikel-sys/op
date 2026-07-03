"""
agentes_utiles.py — Agentes de utilidad para Susan v3:
  - Clima, Noticias, Traducción, OCR de pantalla
  - Sistema, Archivos, WhatsApp, YouTube
Todos en un solo archivo para mayor organización.
"""

import os, re, sys, subprocess, webbrowser, glob, json
import time, threading
from typing import Optional, Tuple, List
from logger import logger

# ══════════════════════════════════════════════════════════════════════════════
# AGENTE CLIMA
# ══════════════════════════════════════════════════════════════════════════════
class AgenteClima:
    def buscar(self, ciudad: str) -> str:
        """Obtiene el pronóstico del clima para una ciudad."""
        import requests
        # 1. Intentar wttr.in primero (API simple sin clave, no depende de DDG)
        try:
            resp = requests.get(
                f"https://wttr.in/{ciudad.replace(' ', '+')}?format=4",
                timeout=8
            )
            if resp.status_code == 200 and resp.text.strip():
                return f"🌤️ **Clima en {ciudad}:**\n{resp.text.strip()}"
        except Exception as exc:
            logger.warning(f"[Clima] wttr.in: {exc}")

        # 2. Fallback: DuckDuckGo (puede fallar por rate limit, no es crítico)
        try:
            from duckduckgo_search import DDGS
            query = f"clima hoy en {ciudad} temperatura pronóstico"
            with DDGS() as d:
                resultados = list(d.text(query, max_results=3))
            if resultados:
                info = resultados[0].get("body", "")
                return f"🌤️ **Clima en {ciudad}:**\n{info[:400]}"
        except Exception as exc:
            logger.warning(f"[Clima] DDG: {exc}")

        return (
            f"No pude obtener el clima de '{ciudad}' en este momento. "
            f"Si es un país en vez de una ciudad, intenta con una ciudad específica, "
            f"por ejemplo 'clima en La Habana' en vez de 'clima en Cuba'."
        )

    def manejar(self, entrada: str) -> str:
        e = entrada.lower()
        ciudad = re.sub(
            r'.*(clima|temperatura|pronóstico|tiempo)\s*(en|de|para)?\s*', '', e
        ).strip().title()
        if not ciudad or len(ciudad) < 2:
            ciudad = "mi ciudad"
        return self.buscar(ciudad)


# ══════════════════════════════════════════════════════════════════════════════
# AGENTE NOTICIAS
# ══════════════════════════════════════════════════════════════════════════════
class AgenteNoticias:
    CATEGORIAS = {
        "tecnología": "noticias tecnología hoy",
        "deportes":   "noticias deportes hoy",
        "política":   "noticias política hoy",
        "economía":   "noticias economía finanzas hoy",
        "mundo":      "noticias internacionales hoy",
        "ciencia":    "noticias ciencia investigación hoy",
        "general":    "noticias principales hoy",
    }

    def buscar(self, tema: str = "general", max_res: int = 5) -> str:
        try:
            from duckduckgo_search import DDGS
            query = self.CATEGORIAS.get(tema.lower(), f"noticias {tema} hoy")
            with DDGS() as d:
                resultados = list(d.news(query, max_results=max_res))
            if not resultados:
                return f"No encontré noticias sobre '{tema}'."

            lineas = [f"📰 **Noticias: {tema.title()}**\n"]
            for i, n in enumerate(resultados, 1):
                titulo  = n.get("title", "")
                fuente  = n.get("source", "")
                fecha   = n.get("date", "")[:10]
                url     = n.get("url", "")
                cuerpo  = n.get("body", "")[:150]
                lineas.append(
                    f"{i}. **{titulo}**\n"
                    f"   {cuerpo}{'…' if len(cuerpo)>=150 else ''}\n"
                    f"   📍 {fuente} | {fecha} | {url[:60]}"
                )
            return "\n\n".join(lineas)
        except Exception as exc:
            logger.warning(f"[Noticias] {exc}")
            return "No pude obtener noticias en este momento."

    def manejar(self, entrada: str) -> str:
        e = entrada.lower()
        for cat in self.CATEGORIAS:
            if cat in e:
                return self.buscar(cat)
        tema = re.sub(r'.*(noticias?|novedades?|titulares?|qué pasó)\s*(sobre|de)?\s*', '', e).strip()
        return self.buscar(tema or "general")


# ══════════════════════════════════════════════════════════════════════════════
# AGENTE TRADUCTOR
# ══════════════════════════════════════════════════════════════════════════════
class AgenteTraductor:
    IDIOMAS = {
        "inglés": "en",  "ingles": "en",
        "español": "es", "espanol": "es",
        "francés": "fr", "frances": "fr",
        "alemán": "de",  "aleman": "de",
        "italiano": "it",
        "portugués": "pt", "portugues": "pt",
        "ruso": "ru",
        "chino": "zh-CN",
        "japonés": "ja", "japones": "ja",
        "árabe": "ar",   "arabe": "ar",
        "coreano": "ko",
        "holandés": "nl",
    }

    def traducir(self, texto: str, idioma_destino: str = "en") -> str:
        try:
            from deep_translator import GoogleTranslator
            t = GoogleTranslator(source="auto", target=idioma_destino)
            resultado = t.translate(texto)
            return resultado or texto
        except Exception:
            pass

        # Fallback: usar IA local
        try:
            from ia import llamar_ollama_stream
            nombres = {v: k for k, v in self.IDIOMAS.items()}
            idioma_nombre = nombres.get(idioma_destino, idioma_destino)
            prompt = (
                f"Traduce el siguiente texto al {idioma_nombre}. "
                f"Devuelve SOLO la traducción:\n\n{texto}"
            )
            return llamar_ollama_stream(prompt) or texto
        except Exception as exc:
            logger.error(f"[Traductor] {exc}")
            return f"Error al traducir: {exc}"

    def manejar(self, entrada: str) -> str:
        e = entrada.lower()

        # Detectar idioma destino
        idioma_code = "en"
        for nombre, code in self.IDIOMAS.items():
            if nombre in e:
                idioma_code = code
                break

        # Extraer texto a traducir
        texto = re.sub(
            r'(?:traduce?|traducir?|cómo se dice|al?\s+\w+|en\s+\w+)\s*',
            '', entrada, flags=re.IGNORECASE
        ).strip().strip('"\'')

        if not texto or len(texto) < 2:
            return "¿Qué quieres que traduzca? Di: 'Traduce hola mundo al inglés'"

        resultado = self.traducir(texto, idioma_code)
        idioma_nombre = {v: k for k, v in self.IDIOMAS.items()}.get(idioma_code, idioma_code)
        return f"🌐 **Traducción al {idioma_nombre.title()}:**\n\n{resultado}"


# ══════════════════════════════════════════════════════════════════════════════
# AGENTE PANTALLA / OCR
# ══════════════════════════════════════════════════════════════════════════════
class AgentePantalla:
    def captura_y_ocr(self) -> str:
        """Toma captura de pantalla y ejecuta OCR."""
        try:
            import mss
            from PIL import Image
            import pytesseract

            with mss.mss() as sct:
                screenshot = sct.grab(sct.monitors[0])
                img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")

            texto = pytesseract.image_to_string(img, lang="spa+eng")
            if texto.strip():
                return f"📄 **Texto detectado en pantalla:**\n\n{texto.strip()[:1500]}"
            return "No detecté texto legible en la pantalla."
        except ImportError:
            return ("Para OCR necesitas instalar:\n"
                    "  pip install pytesseract mss\n"
                    "  Y Tesseract-OCR desde: https://github.com/UB-Mannheim/tesseract/wiki")
        except Exception as exc:
            logger.error(f"[OCR] {exc}")
            return f"Error al leer pantalla: {exc}"

    def captura_region(self, x: int, y: int, ancho: int, alto: int) -> str:
        """OCR de una región específica de la pantalla."""
        try:
            import mss
            from PIL import Image
            import pytesseract

            region = {"top": y, "left": x, "width": ancho, "height": alto}
            with mss.mss() as sct:
                screenshot = sct.grab(region)
                img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")

            texto = pytesseract.image_to_string(img, lang="spa+eng")
            return f"📄 Texto en región:\n\n{texto.strip()}" if texto.strip() \
                   else "No hay texto en esa región."
        except Exception as exc:
            return f"Error: {exc}"

    def manejar(self, entrada: str) -> str:
        e = entrada.lower()
        if any(t in e for t in ["lee la pantalla", "ocr", "qué dice la pantalla",
                                  "lee el texto de la pantalla", "captura y lee"]):
            return self.captura_y_ocr()

        m = re.search(r'(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', e)
        if m:
            x, y, w, h = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
            return self.captura_region(x, y, w, h)

        return self.captura_y_ocr()


# ══════════════════════════════════════════════════════════════════════════════
# AGENTE SISTEMA
# ══════════════════════════════════════════════════════════════════════════════
class AgenteSistema:
    _accion_pendiente = None

    def _cmd(self, comando: str, desc: str = "") -> bool:
        try:
            subprocess.run(comando, shell=True, check=False)
            logger.info(f"[Sistema] {desc or comando}")
            return True
        except Exception as exc:
            logger.error(f"[Sistema] {exc}")
            return False

    def apagar(self)     -> bool: return self._cmd("shutdown /s /t 0", "Apagar")
    def reiniciar(self)  -> bool: return self._cmd("shutdown /r /t 0", "Reiniciar")
    def suspender(self)  -> bool:
        return self._cmd("rundll32.exe powrprof.dll,SetSuspendState 0,1,0", "Suspender")
    def cerrar_sesion(self) -> bool: return self._cmd("shutdown /l", "Cerrar sesión")
    def bloquear(self)   -> bool:
        return self._cmd("rundll32.exe user32.dll,LockWorkStation", "Bloquear")

    def manejar(self, entrada: str) -> str:
        e = entrada.lower()

        # Confirmación de acción pendiente
        if self._accion_pendiente:
            if e in {"sí", "si", "dale", "confirmar", "ok", "adelante", "yes"}:
                self._accion_pendiente()
                self.__class__._accion_pendiente = None
                return "✔ Ejecutando…"
            elif e in {"no", "cancelar", "para", "detente"}:
                self.__class__._accion_pendiente = None
                return "✔ Cancelado."

        cmds = {
            "apagar":        (["apagar", "shutdown", "apaga el pc", "apaga la pc"],
                              self.apagar, "⚠ ¿Apagar el PC? (sí/no)"),
            "reiniciar":     (["reiniciar", "restart", "reinicia"],
                              self.reiniciar, "⚠ ¿Reiniciar? (sí/no)"),
            "suspender":     (["suspender", "sleep", "dormir", "suspende"],
                              self.suspender, "⚠ ¿Suspender? (sí/no)"),
            "cerrar sesión": (["cerrar sesión", "logout", "cierra sesión"],
                              self.cerrar_sesion, "⚠ ¿Cerrar sesión? (sí/no)"),
        }

        for _, (frases, accion, pregunta) in cmds.items():
            if any(f in e for f in frases):
                self.__class__._accion_pendiente = accion
                return pregunta

        if any(t in e for t in ["bloquear", "lock", "bloquea"]):
            self.bloquear()
            return "✔ Pantalla bloqueada."

        return "¿Qué quieres hacer con el sistema? (apagar, reiniciar, suspender, bloquear)"


# ══════════════════════════════════════════════════════════════════════════════
# AGENTE ARCHIVOS
# ══════════════════════════════════════════════════════════════════════════════
class AgenteArchivos:
    ESPECIALES = {
        "escritorio": "shell:Desktop",  "desktop": "shell:Desktop",
        "documentos": "shell:Personal", "documents": "shell:Personal",
        "descargas":  "shell:Downloads","downloads": "shell:Downloads",
        "imágenes":   "shell:My Pictures",
        "música":     "shell:My Music",  "videos": "shell:My Video",
        "inicio":     os.path.expanduser("~"),
    }

    def abrir_carpeta(self, nombre: str) -> str:
        n = nombre.lower().strip()
        if n in self.ESPECIALES:
            ruta = self.ESPECIALES[n]
            subprocess.Popen(f'explorer "{ruta}"', shell=True)
            return f"✔ Abriendo {nombre}…"
        ruta = os.path.expandvars(os.path.expanduser(nombre))
        if os.path.isdir(ruta):
            subprocess.Popen(f'explorer "{ruta}"', shell=True)
            return f"✔ Abriendo {ruta}"
        return f"No encontré la carpeta '{nombre}'."

    def abrir_archivo(self, ruta: str) -> str:
        ruta_exp = os.path.expandvars(os.path.expanduser(ruta))
        if os.path.isfile(ruta_exp):
            os.startfile(ruta_exp)
            return f"✔ Abriendo {os.path.basename(ruta_exp)}"
        return f"No encontré el archivo '{ruta}'."

    def manejar(self, entrada: str) -> str:
        e = entrada.lower()
        for t in ["abre la carpeta ", "abrir carpeta ", "abre carpeta "]:
            if t in e:
                nombre = e.split(t, 1)[1].strip()
                return self.abrir_carpeta(nombre)
        for t in ["abre el archivo ", "abrir archivo "]:
            if t in e:
                nombre = e.split(t, 1)[1].strip()
                return self.abrir_archivo(nombre)
        return "Di: 'abre la carpeta Descargas' o 'abre el archivo nombre.pdf'"


# ══════════════════════════════════════════════════════════════════════════════
# AGENTE WHATSAPP
# ══════════════════════════════════════════════════════════════════════════════
class AgenteWhatsApp:
    # Rutas habituales donde Windows instala la app nativa de WhatsApp (MSIX/UWP)
    RUTAS_APP_NATIVA = [
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WindowsApps\WhatsApp.exe"),
        os.path.expandvars(
            r"%LOCALAPPDATA%\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\WhatsApp.exe"
        ),
    ]

    def __init__(self):
        self._wa_abierto = False
        self._usando_app_nativa = False

    def _buscar_ventana_wa(self):
        try:
            import pygetwindow as gw
            for titulo in ["WhatsApp", "WhatsApp Web"]:
                vs = gw.getWindowsWithTitle(titulo)
                for v in vs:
                    if v.visible and v.width > 300:
                        return v
        except Exception:
            pass
        return None

    def _lanzar_app_nativa(self) -> bool:
        """
        Intenta abrir la app nativa de WhatsApp para Windows (no el navegador).
        Es la única que completa llamadas de voz/video de forma confiable;
        WhatsApp Web solo redirige a "usa la app de escritorio" al llamar.
        Devuelve True si algún método de lanzamiento se ejecutó sin error
        (no garantiza que la ventana ya esté visible, por eso se espera después).
        """
        # 1. Protocolo URI registrado por la app nativa al instalarse
        try:
            os.startfile("whatsapp://")
            logger.info("[WA] Lanzada app nativa vía protocolo whatsapp://")
            return True
        except Exception as exc:
            logger.debug(f"[WA] protocolo whatsapp:// no disponible: {exc}")

        # 2. Rutas conocidas del ejecutable instalado
        for ruta in self.RUTAS_APP_NATIVA:
            if os.path.isfile(ruta):
                try:
                    subprocess.Popen([ruta])
                    logger.info(f"[WA] Lanzada app nativa: {ruta}")
                    return True
                except Exception as exc:
                    logger.debug(f"[WA] no se pudo lanzar {ruta}: {exc}")

        # 3. Comando "start" genérico de Windows con el alias registrado
        try:
            subprocess.Popen(["start", "", "whatsapp:"], shell=True)
            logger.info("[WA] Lanzada app nativa vía 'start whatsapp:'")
            return True
        except Exception as exc:
            logger.debug(f"[WA] 'start whatsapp:' falló: {exc}")

        return False

    def _es_app_nativa(self, ventana) -> bool:
        """
        Determina si la ventana encontrada corresponde al proceso de la app
        nativa de WhatsApp (WhatsApp.exe) o al navegador (WhatsApp Web).
        No se basa en el título de la ventana porque puede incluir el nombre
        del contacto o un contador de no leídos y variar entre versiones;
        en su lugar identifica el proceso real dueño de la ventana.
        Si algo falla (p. ej. no es Windows, o falta pywin32), asume que no
        es la app nativa, para no dar una falsa sensación de fiabilidad.
        """
        try:
            import win32process
            import psutil
            _, pid = win32process.GetWindowThreadProcessId(ventana._hWnd)
            proceso = psutil.Process(pid)
            nombre = proceso.name().lower()
            return "whatsapp" in nombre and "chrome" not in nombre and "edge" not in nombre \
                and "firefox" not in nombre and "msedge" not in nombre
        except Exception as exc:
            logger.debug(f"[WA] No se pudo determinar el proceso de la ventana: {exc}")
            return False

    def _asegurar_wa_abierto(self) -> bool:
        """
        Asegura que WhatsApp esté abierto, priorizando la app nativa.
        Devuelve True si ya había una ventana abierta (no hace falta esperar tanto),
        False si tuvo que abrir algo nuevo (conviene esperar más).
        """
        ventana = self._buscar_ventana_wa()
        if ventana:
            try:
                ventana.activate()
                ventana.maximize()
                time.sleep(1)
            except Exception:
                pass
            self._usando_app_nativa = self._es_app_nativa(ventana)
            return True

        # No hay ventana abierta: intentar la app nativa primero
        if self._lanzar_app_nativa():
            time.sleep(6)
            ventana = self._buscar_ventana_wa()
            if ventana:
                try:
                    ventana.activate()
                    ventana.maximize()
                    time.sleep(1)
                except Exception:
                    pass
                # Verificar DE VERDAD si es la app nativa (antes se asumía True).
                self._usando_app_nativa = self._es_app_nativa(ventana)
            else:
                # Ventana aún no visible; la lanzamos nosotros, así que asumimos
                # nativa pero sin garantía (se confirmará en la captura).
                self._usando_app_nativa = True
            logger.info(f"[WA] App nativa lanzada (nativa={self._usando_app_nativa}).")
            return False

        # Respaldo: WhatsApp Web (solo fiable para enviar mensajes, no llamadas)
        logger.warning(
            "[WA] No se encontró la app nativa de WhatsApp; usando WhatsApp Web "
            "como respaldo. Las llamadas no se completarán desde ahí."
        )
        webbrowser.open("https://web.whatsapp.com")
        time.sleep(6)
        self._usando_app_nativa = False
        logger.info("[WA] WhatsApp Web abierto (respaldo).")
        return False

    def _abrir_chat(self, contacto: str) -> object:
        """
        Abre WhatsApp (si no está abierto), busca el contacto y lo abre.
        Devuelve el objeto de ventana (o None si no se pudo detectar) para que
        el método llamante pueda calcular posiciones relativas adicionales.
        """
        import pyautogui, pyperclip
        ya_abierto = self._asegurar_wa_abierto()
        time.sleep(1 if ya_abierto else 3)

        ventana = self._buscar_ventana_wa()
        if ventana:
            try:
                ventana.activate()
            except Exception:
                pass
            sx = ventana.left + int(ventana.width * 0.2)
            sy = ventana.top  + int(ventana.height * 0.12)
        else:
            sx, sy = 200, 80

        # Enfocar y limpiar el cuadro de búsqueda
        pyautogui.click(sx, sy)
        time.sleep(0.4)
        pyautogui.hotkey("ctrl", "a")
        pyautogui.press("backspace")
        time.sleep(0.2)
        # Escribir el contacto vía portapapeles (soporta acentos y emojis,
        # que pyautogui.write no maneja bien)
        pyperclip.copy(contacto)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(2.0)            # esperar a que carguen los resultados de búsqueda
        pyautogui.press("enter")  # abrir el primer resultado
        time.sleep(1.0)
        return ventana

    def enviar(self, contacto: str, mensaje: str) -> str:
        import pyautogui, pyperclip
        ventana = self._abrir_chat(contacto)
        if not ventana:
            ventana = self._buscar_ventana_wa()
        if not ventana:
            return ("No pude encontrar la ventana de WhatsApp para enviar el mensaje. "
                    "Ábrela manualmente (app de escritorio o web.whatsapp.com) e "
                    "inténtalo de nuevo.")

        # Caja de mensaje: parte inferior central de la ventana del chat.
        mx = ventana.left + int(ventana.width * 0.5)
        my = ventana.top  + int(ventana.height * 0.93)

        pyautogui.click(mx, my)
        time.sleep(0.4)
        pyperclip.copy(mensaje)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(0.4)
        pyautogui.press("enter")
        time.sleep(0.3)
        logger.info(f"[WA] Mensaje enviado a {contacto}")
        return (f"✔ Mensaje de WhatsApp enviado a **{contacto}**.\n"
                f"Si no aparece, abre el chat de {contacto} y verifica que se escribió.")

    # ── Llamadas (voz / video) ────────────────────────────────────────────────
    def llamar(self, contacto: str, tipo: str = "voz") -> str:
        """
        Intenta iniciar una llamada de voz o video con un contacto, abriendo
        primero su chat (priorizando la app nativa de WhatsApp para Windows,
        ya que WhatsApp Web no completa llamadas: solo redirige a "usa la
        app de escritorio") y haciendo clic en el ícono correspondiente.

        ⚠ Limitación importante: WhatsApp no ofrece atajo de teclado ni API
        para iniciar llamadas, así que esto depende de hacer clic en la
        posición donde habitualmente está el ícono. No hay forma de confirmar
        desde el código si la llamada realmente se conectó del otro lado —
        por eso se toma una captura de pantalla inmediatamente después, para
        que puedas verificar visualmente el resultado.
        """
        import pyautogui

        ventana = self._abrir_chat(contacto)
        cayo_en_navegador = not self._usando_app_nativa

        # Posición aproximada de los íconos de llamada en el header del chat.
        # Estas proporciones se calibraron mirando el layout de WhatsApp Web;
        # la app nativa de Windows puede ubicar los íconos en una posición
        # ligeramente distinta — si fallan, ajusta estos valores comparando
        # con una captura de tu propia ventana.
        if ventana:
            video_x = ventana.left + int(ventana.width * 0.90)
            voz_x   = ventana.left + int(ventana.width * 0.94)
            icon_y  = ventana.top  + int(ventana.height * 0.19)
        else:
            video_x, voz_x, icon_y = 870, 920, 80

        x = voz_x if tipo == "voz" else video_x

        pyautogui.click(x, icon_y)
        time.sleep(2.5)  # dar tiempo a que la interfaz de llamada cargue, si lo hizo

        ruta_captura = self._capturar_verificacion(contacto, tipo)
        logger.info(f"[WA] Intento de llamada ({tipo}) a {contacto} | app_nativa={self._usando_app_nativa}")

        etiqueta = "videollamada" if tipo == "video" else "llamada de voz"
        partes = [f"📞 Intenté iniciar una {etiqueta} con **{contacto}**."]

        if cayo_en_navegador:
            partes.append(
                "⚠ No encontré la app nativa de WhatsApp para Windows abierta ni "
                "pude lanzarla, así que esto se intentó desde WhatsApp Web. "
                "WhatsApp Web normalmente NO completa llamadas (solo te pedirá "
                "usar la app de escritorio), así que es muy probable que esto "
                "no haya funcionado. Abre la app nativa de WhatsApp manualmente "
                "antes de pedir una llamada, o dime y reviso por qué no se lanzó sola."
            )
        else:
            partes.append(
                "⚠ No puedo confirmar si la llamada se conectó del otro lado: "
                "WhatsApp no expone esa información a la automatización."
            )

        if ruta_captura:
            partes.append(f"Revisa la captura para verificar:\n🖼️ {ruta_captura}")
        else:
            partes.append("No pude guardar la captura de verificación; revisa la pantalla manualmente.")

        return "\n".join(partes)

    def _capturar_verificacion(self, contacto: str, tipo: str) -> Optional[str]:
        """Guarda una captura de pantalla tras el intento de llamada, para que
        el usuario pueda confirmar visualmente si se inició correctamente."""
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            carpeta  = os.path.join(base_dir, "capturas", "whatsapp_llamadas")
            os.makedirs(carpeta, exist_ok=True)
            ts = time.strftime("%Y%m%d_%H%M%S")
            contacto_safe = re.sub(r'[^\w\-]', '_', contacto)[:30]
            ruta = os.path.join(carpeta, f"llamada_{tipo}_{contacto_safe}_{ts}.png")
            import pyautogui
            pyautogui.screenshot().save(ruta)
            return ruta
        except Exception as exc:
            logger.warning(f"[WA] No se pudo guardar captura de verificación: {exc}")
            return None

    def manejar(self, entrada: str, on_progreso=None) -> str:
        e = entrada.lower()

        # Detectar intención de llamada (antes de la de envío de mensaje)
        if any(t in e for t in ["llama a", "llámale a", "hacer una llamada a",
                                  "haz una llamada a", "videollama a", "videollamada a"]):
            tipo = "video" if any(t in e for t in ["video", "videollama"]) else "voz"
            idx_a = e.find(" a ")
            if idx_a == -1:
                return "¿A quién quieres llamar? Di: 'llama a mamá por WhatsApp' o 'haz una videollamada a mamá'"
            contacto = e[idx_a + 3:].strip()
            # Quitar coletillas como "por whatsapp" si quedaron al final
            contacto = re.sub(r'\s*(por\s+)?(whatsapp|whatsap|wasap)\s*$', '', contacto).strip()
            if not contacto:
                return "¿A quién quieres llamar? Di: 'llama a mamá por WhatsApp'"
            if on_progreso:
                etiqueta = "videollamada" if tipo == "video" else "llamada"
                on_progreso(f"📞 Iniciando {etiqueta} a {contacto}…")
            return self.llamar(contacto, tipo)

        sep = [" diciendo ", " que diga ", " con mensaje ", " di "]
        idx_a = e.find(" a ")
        if idx_a == -1:
            return "¿A quién? Di: 'envía WhatsApp a mamá diciendo hola'"
        resto = e[idx_a + 3:]
        for s in sep:
            if s in resto:
                contacto, msg = resto.split(s, 1)
                if on_progreso:
                    on_progreso(f"📱 Enviando WhatsApp a {contacto.strip()}…")
                return self.enviar(contacto.strip(), msg.strip())
        return "¿Qué mensaje? Di: 'envía WhatsApp a mamá diciendo hola'"


# ══════════════════════════════════════════════════════════════════════════════
# AGENTE YOUTUBE
# ══════════════════════════════════════════════════════════════════════════════
class AgenteYouTube:
    def __init__(self):
        self._url_pendiente: Optional[str] = None
        self._titulo_pendiente: Optional[str] = None

    def buscar(self, consulta: str) -> Tuple[str, str]:
        try:
            import yt_dlp
            with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True,
                                    "socket_timeout": 10}) as ydl:
                info = ydl.extract_info(f"ytsearch:{consulta}", download=False)
                if info and info.get("entries"):
                    v = info["entries"][0]
                    url   = v["webpage_url"]
                    titulo = v.get("title", consulta)
                    self._url_pendiente   = url
                    self._titulo_pendiente = titulo
                    logger.info(f"[YouTube] Encontrado: {titulo!r}")
                    return url, titulo
        except ImportError:
            logger.warning("[YouTube] yt-dlp no instalado.")
        except Exception as exc:
            logger.warning(f"[YouTube] {exc}")

        import urllib.parse
        q = urllib.parse.quote(consulta)
        url = f"https://www.youtube.com/results?search_query={q}"
        self._url_pendiente   = url
        self._titulo_pendiente = consulta
        return url, consulta

    def reproducir_pendiente(self) -> bool:
        if self._url_pendiente:
            webbrowser.open(self._url_pendiente)
            logger.info(f"[YouTube] Reproduciendo: {self._titulo_pendiente!r}")
            self._url_pendiente = self._titulo_pendiente = None
            return True
        return False

    def hay_pendiente(self) -> bool:
        return bool(self._url_pendiente)

    def cancelar(self):
        self._url_pendiente = self._titulo_pendiente = None

    def manejar(self, entrada: str) -> str:
        e = entrada.lower()
        consulta = e
        for p in ["reproduce en youtube", "busca en youtube", "pon en youtube",
                  "reproduceme", "reproduce", "ponme", "pon ", "poner"]:
            consulta = consulta.replace(p, "")
        consulta = consulta.strip().strip("en la el una un ")
        if not consulta:
            return "¿Qué quieres reproducir? Di: 'reproduce Bad Bunny'"
        url, titulo = self.buscar(consulta)
        return f"🎵 ¿Reproduzco **'{titulo}'**? (responde sí o no)"


# ══════════════════════════════════════════════════════════════════════════════
# AGENTE LANZADOR DE APLICACIONES
# ══════════════════════════════════════════════════════════════════════════════
class AgenteLanzador:
    APPS = {
        "bloc de notas": "notepad.exe", "notepad": "notepad.exe",
        "calculadora": "calc.exe",      "calculator": "calc.exe",
        "cmd": "cmd.exe",               "powershell": "powershell.exe",
        "explorador": "explorer.exe",   "paint": "mspaint.exe",
        "word": "winword.exe",          "excel": "excel.exe",
        "powerpoint": "powerpnt.exe",   "outlook": "outlook.exe",
        "chrome": "chrome.exe",         "google chrome": "chrome.exe",
        "firefox": "firefox.exe",       "edge": "msedge.exe",
        "vscode": "code.exe",           "code": "code.exe",
        "roblox studio": os.path.expandvars(r"%LOCALAPPDATA%\Roblox\Studio\RobloxStudioBeta.exe"),
        "configuración": "ms-settings:",
    }

    def abrir(self, nombre: str) -> str:
        n = nombre.lower().strip()
        for prefijo in ["el ", "la ", "los ", "un ", "app ", "programa "]:
            if n.startswith(prefijo):
                n = n[len(prefijo):]

        if n in self.APPS:
            cmd = self.APPS[n]
            if cmd.startswith("ms-settings:"):
                subprocess.Popen(["start", "", cmd], shell=True)
            else:
                subprocess.Popen(cmd, shell=True)
            logger.info(f"[Lanzador] {nombre}")
            return f"✔ Abriendo {nombre}…"

        # Búsqueda parcial
        for key, cmd in self.APPS.items():
            if key in n or n in key:
                subprocess.Popen(cmd, shell=True)
                return f"✔ Abriendo {key}…"

        try:
            subprocess.Popen(nombre, shell=True)
            return f"✔ Intentando abrir '{nombre}'…"
        except Exception:
            return f"No sé cómo abrir '{nombre}'."

    def manejar(self, entrada: str) -> str:
        e = entrada.lower()
        for t in ["abre ", "abrir ", "inicia ", "iniciar ", "lanza ", "lanzar "]:
            if e.startswith(t):
                return self.abrir(e[len(t):].strip())
        return self.abrir(e)


# ══════════════════════════════════════════════════════════════════════════════
# INSTANCIAS GLOBALES
# ══════════════════════════════════════════════════════════════════════════════
_clima      = AgenteClima()
_noticias   = AgenteNoticias()
_traductor  = AgenteTraductor()
_pantalla   = AgentePantalla()
_sistema    = AgenteSistema()
_archivos   = AgenteArchivos()
_whatsapp   = AgenteWhatsApp()
_youtube    = AgenteYouTube()
_lanzador   = AgenteLanzador()

def get_clima()    -> AgenteClima:    return _clima
def get_noticias() -> AgenteNoticias: return _noticias
def get_traductor() -> AgenteTraductor: return _traductor
def get_pantalla() -> AgentePantalla: return _pantalla
def get_sistema()  -> AgenteSistema:  return _sistema
def get_archivos() -> AgenteArchivos: return _archivos
def get_whatsapp() -> AgenteWhatsApp: return _whatsapp
def get_youtube()  -> AgenteYouTube:  return _youtube
def get_lanzador() -> AgenteLanzador: return _lanzador