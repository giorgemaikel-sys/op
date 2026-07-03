"""
agente_email.py — Gestión de correo electrónico para Susan v3.
Soporta Gmail y Outlook via IMAP/SMTP. Lee, envía, busca y resume emails.
"""

import imaplib, smtplib, email, re, ssl, json, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from typing import List, Optional, Tuple, Dict
from datetime import datetime
from logger import logger

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# ── Modelo de datos ───────────────────────────────────────────────────────────
class Correo:
    def __init__(self):
        self.uid:    str = ""
        self.de:     str = ""
        self.para:   str = ""
        self.asunto: str = ""
        self.fecha:  str = ""
        self.cuerpo: str = ""
        self.leido:  bool = True

    def resumen_corto(self) -> str:
        icono = "📬" if not self.leido else "📧"
        fecha = self.fecha[:16] if self.fecha else ""
        return f"{icono} {self.de[:35]:<35} | {self.asunto[:45]:<45} | {fecha}"

    def completo(self) -> str:
        return (
            f"{'─'*60}\n"
            f"📧  De:     {self.de}\n"
            f"    Para:   {self.para}\n"
            f"    Asunto: {self.asunto}\n"
            f"    Fecha:  {self.fecha}\n"
            f"{'─'*60}\n\n"
            f"{self.cuerpo[:1200]}{'…' if len(self.cuerpo) > 1200 else ''}"
        )


# ── Agente ────────────────────────────────────────────────────────────────────
class AgenteEmail:
    """Gestión completa de correo: leer, enviar, buscar y resumir."""

    SERVIDORES_IMAP = {
        "gmail":   ("imap.gmail.com",  993),
        "outlook": ("outlook.office365.com", 993),
        "hotmail": ("outlook.office365.com", 993),
        "yahoo":   ("imap.mail.yahoo.com", 993),
        "icloud":  ("imap.mail.me.com", 993),
    }
    SERVIDORES_SMTP = {
        "gmail":   ("smtp.gmail.com",  587),
        "outlook": ("smtp.office365.com", 587),
        "hotmail": ("smtp.office365.com", 587),
        "yahoo":   ("smtp.mail.yahoo.com", 587),
        "icloud":  ("smtp.mail.me.com", 587),
    }

    def __init__(self, config: Dict):
        cfg = config.get("email", {})
        # Prioridad: variables de entorno (.env) > config.json (compatibilidad antigua)
        self.usuario  = os.getenv("EMAIL_USUARIO", "")  or cfg.get("usuario", "")
        self.password = os.getenv("EMAIL_PASSWORD", "") or cfg.get("password", "")
        self.max_correos = int(cfg.get("max_correos", 10))
        self._tipo    = self._detectar_tipo()
        self._imap: Optional[imaplib.IMAP4_SSL] = None
        self._conectado = False
        self._cache: List[Correo] = []
        # Borrador de respuesta IA esperando confirmación: (para, asunto, cuerpo)
        self._borrador_pendiente: Optional[Tuple[str, str, str]] = None

    def _detectar_tipo(self) -> str:
        if not self.usuario:
            return "gmail"
        u = self.usuario.lower()
        if "gmail" in u:    return "gmail"
        if "outlook" in u or "hotmail" in u: return "outlook"
        if "yahoo" in u:    return "yahoo"
        if "icloud" in u:   return "icloud"
        return "gmail"

    def esta_configurado(self) -> bool:
        return bool(self.usuario and self.password)

    def recargar_config(self, config: Dict) -> None:
        """Recarga la configuración (por si el usuario la editó)."""
        cfg = config.get("email", {})
        self.usuario  = os.getenv("EMAIL_USUARIO", "")  or cfg.get("usuario", "")
        self.password = os.getenv("EMAIL_PASSWORD", "") or cfg.get("password", "")
        self._tipo    = self._detectar_tipo()
        if self._conectado:
            self.desconectar()

    # ── Conexión ──────────────────────────────────────────────────────────────
    def conectar(self) -> Tuple[bool, str]:
        if not self.esta_configurado():
            return False, (
                "⚠ Aún no has configurado tu email.\n"
                "Crea un archivo **.env** en la carpeta de Susan (copia .env.example) y rellena:\n"
                "  EMAIL_USUARIO=tu@gmail.com\n"
                "  EMAIL_PASSWORD=tu_contraseña_de_app\n\n"
                "Para Gmail: crea una contraseña de aplicación en\n"
                "myaccount.google.com → Seguridad → Contraseñas de aplicación"
            )

        srv, port = self.SERVIDORES_IMAP.get(self._tipo, ("imap.gmail.com", 993))
        try:
            context = ssl.create_default_context()
            self._imap = imaplib.IMAP4_SSL(srv, port, ssl_context=context)
            self._imap.login(self.usuario, self.password)
            self._conectado = True
            logger.info(f"[Email] Conectado: {self.usuario}")
            return True, f"✔ Conectado a {self.usuario}"
        except imaplib.IMAP4.error as e:
            return False, f"✗ Error de autenticación: {e}\n(Verifica usuario/contraseña de app)"
        except Exception as e:
            return False, f"✗ Error de conexión: {e}"

    def desconectar(self) -> None:
        if self._imap:
            try:
                self._imap.logout()
            except Exception:
                pass
        self._conectado = False
        self._imap = None

    def _asegurar_conexion(self) -> Tuple[bool, str]:
        if not self._conectado:
            return self.conectar()
        try:
            self._imap.noop()
            return True, "ok"
        except Exception:
            return self.conectar()

    # ── Decodificación ────────────────────────────────────────────────────────
    @staticmethod
    def _dec(cabecera: str) -> str:
        if not cabecera:
            return ""
        partes = decode_header(cabecera)
        res = ""
        for parte, enc in partes:
            if isinstance(parte, bytes):
                res += parte.decode(enc or "utf-8", errors="replace")
            else:
                res += str(parte)
        return res.strip()

    @staticmethod
    def _extraer_texto(msg) -> str:
        if msg.is_multipart():
            for parte in msg.walk():
                ct = parte.get_content_type()
                if ct == "text/plain":
                    try:
                        raw = parte.get_payload(decode=True)
                        enc = parte.get_content_charset() or "utf-8"
                        return raw.decode(enc, errors="replace")[:3000]
                    except Exception:
                        continue
        else:
            try:
                raw = msg.get_payload(decode=True)
                if raw:
                    enc = msg.get_content_charset() or "utf-8"
                    return raw.decode(enc, errors="replace")[:3000]
            except Exception:
                pass
        return ""

    # ── Lectura ───────────────────────────────────────────────────────────────
    def no_leidos(self, carpeta: str = "INBOX") -> List[Correo]:
        ok, err = self._asegurar_conexion()
        if not ok:
            return []
        try:
            self._imap.select(carpeta)
            _, data = self._imap.search(None, "UNSEEN")
            ids = data[0].split()
            return self._fetch_correos(list(reversed(ids[-self.max_correos:])))
        except Exception as e:
            logger.error(f"[Email] no_leidos: {e}")
            return []

    def recientes(self, n: int = 10, carpeta: str = "INBOX") -> List[Correo]:
        ok, err = self._asegurar_conexion()
        if not ok:
            return []
        try:
            self._imap.select(carpeta)
            _, data = self._imap.search(None, "ALL")
            ids = data[0].split()
            return self._fetch_correos(list(reversed(ids[-n:])))
        except Exception as e:
            logger.error(f"[Email] recientes: {e}")
            return []

    def _fetch_correos(self, uids: list) -> List[Correo]:
        correos = []
        for uid in uids:
            try:
                _, msg_data = self._imap.fetch(uid, "(RFC822)")
                if not msg_data or not msg_data[0]:
                    continue
                raw = msg_data[0][1]
                msg = email.message_from_bytes(raw)

                c = Correo()
                c.uid    = uid.decode() if isinstance(uid, bytes) else str(uid)
                c.de     = self._dec(msg.get("From", ""))
                c.para   = self._dec(msg.get("To", ""))
                c.asunto = self._dec(msg.get("Subject", "(sin asunto)"))
                c.fecha  = msg.get("Date", "")[:30]
                c.cuerpo = self._extraer_texto(msg)
                correos.append(c)
            except Exception as e:
                logger.warning(f"[Email] fetch {uid}: {e}")
        self._cache = correos
        return correos

    def buscar(self, termino: str, max_res: int = 5) -> List[Correo]:
        ok, _ = self._asegurar_conexion()
        if not ok:
            return []
        try:
            self._imap.select("INBOX")
            _, data = self._imap.search(
                None, f'(OR SUBJECT "{termino}" FROM "{termino}")'
            )
            ids = data[0].split()
            return self._fetch_correos(list(reversed(ids[-max_res:])))
        except Exception as e:
            logger.error(f"[Email] buscar: {e}")
            return []

    def correo_por_indice(self, idx: int) -> Optional[Correo]:
        if 1 <= idx <= len(self._cache):
            return self._cache[idx - 1]
        return None

    # ── Envío ─────────────────────────────────────────────────────────────────
    def enviar(self, para: str, asunto: str, cuerpo: str) -> Tuple[bool, str]:
        if not self.esta_configurado():
            return False, "Configura tu email en el archivo .env primero (EMAIL_USUARIO y EMAIL_PASSWORD)."

        srv, port = self.SERVIDORES_SMTP.get(self._tipo, ("smtp.gmail.com", 587))
        try:
            msg = MIMEMultipart("alternative")
            msg["From"]    = self.usuario
            msg["To"]      = para
            msg["Subject"] = asunto
            msg.attach(MIMEText(cuerpo, "plain", "utf-8"))

            with smtplib.SMTP(srv, port) as s:
                s.ehlo()
                s.starttls(context=ssl.create_default_context())
                s.login(self.usuario, self.password)
                s.sendmail(self.usuario, [para], msg.as_string())

            logger.info(f"[Email] Enviado → {para}")
            return True, f"✔ Email enviado a **{para}**."
        except smtplib.SMTPAuthenticationError:
            return False, "✗ Credenciales incorrectas. Usa una contraseña de aplicación."
        except Exception as e:
            logger.error(f"[Email] enviar: {e}")
            return False, f"✗ Error al enviar: {e}"

    def responder(self, indice: int, respuesta: str) -> Tuple[bool, str]:
        """Responde al correo número N de la caché."""
        c = self.correo_por_indice(indice)
        if not c:
            return False, f"No encontré el correo número {indice}."

        # Extraer email del campo "De"
        m = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', c.de)
        if not m:
            return False, f"No pude extraer la dirección de '{c.de}'."

        asunto = f"Re: {c.asunto}" if not c.asunto.startswith("Re:") else c.asunto
        cuerpo_completo = (
            f"{respuesta}\n\n"
            f"—— Mensaje original ——\n"
            f"De: {c.de}\nFecha: {c.fecha}\n\n{c.cuerpo[:500]}"
        )
        return self.enviar(m.group(0), asunto, cuerpo_completo)

    # ── Borrador pendiente de confirmación ────────────────────────────────────
    def hay_borrador_pendiente(self) -> bool:
        return self._borrador_pendiente is not None

    def cancelar_borrador(self) -> None:
        self._borrador_pendiente = None

    def enviar_borrador_pendiente(self) -> Tuple[bool, str]:
        """Envía el borrador de respuesta que quedó esperando confirmación."""
        if not self._borrador_pendiente:
            return False, "No hay ningún borrador pendiente."
        para, asunto, cuerpo = self._borrador_pendiente
        self._borrador_pendiente = None
        return self.enviar(para, asunto, cuerpo)

    # ── Resumir con IA ────────────────────────────────────────────────────────
    def resumir_correo(self, correo: Correo) -> str:
        """Genera un resumen del correo usando la IA."""
        from ia import llamar_ollama_stream
        prompt = (
            f"Resume este correo electrónico en 3 líneas en español. "
            f"Incluye: quién lo envió, de qué trata y qué acción requiere (si alguna).\n\n"
            f"De: {correo.de}\nAsunto: {correo.asunto}\n\n{correo.cuerpo[:800]}"
        )
        return llamar_ollama_stream(prompt) or correo.cuerpo[:200]

    def generar_respuesta_ia(self, correo: Correo, instruccion: str = "") -> str:
        """Genera un borrador de respuesta con IA."""
        from ia import llamar_ollama_stream
        prompt = (
            f"Genera una respuesta profesional y amable en español para este email.\n"
            f"{'Instrucción adicional: ' + instruccion if instruccion else ''}\n\n"
            f"De: {correo.de}\nAsunto: {correo.asunto}\n\n{correo.cuerpo[:600]}\n\n"
            f"Respuesta:"
        )
        return llamar_ollama_stream(prompt) or "Hola,\n\nGracias por tu mensaje.\n\nSaludos"

    # ── Manejar entrada ───────────────────────────────────────────────────────
    def manejar(self, entrada: str) -> str:
        e = entrada.lower()

        if not self.esta_configurado():
            return (
                "⚙ El email no está configurado aún.\n"
                "Crea un archivo **.env** (copia .env.example) y añade:\n"
                "  EMAIL_USUARIO=tu@gmail.com\n"
                "  EMAIL_PASSWORD=contraseña_de_app\n\n"
                "Para Gmail ve a myaccount.google.com → Seguridad → Contraseñas de aplicación"
            )

        # Listar no leídos
        if any(t in e for t in ["no leídos", "sin leer", "bandeja", "inbox", "nuevos",
                                  "revisar", "leer correo", "leer email", "correos"]):
            correos = self.no_leidos()
            if not correos:
                return "✔ No tienes correos sin leer."
            lineas = [f"📬 **{len(correos)} correo(s) sin leer:**\n"]
            for i, c in enumerate(correos, 1):
                lineas.append(f"{i}. {c.resumen_corto()}")
            lineas.append("\nDi 'lee el correo 1' para leerlo o 'resume el 2' para resumirlo.")
            return "\n".join(lineas)

        # Leer correo específico
        m_num = re.search(r'\b(\d+)\b', e)
        if any(t in e for t in ["lee el", "leer el", "abre el", "muéstrame el", "ver el"]):
            if m_num:
                c = self.correo_por_indice(int(m_num.group(1)))
                if c:
                    return c.completo()
                return "No encontré ese correo. Primero di 'revisar email'."

        # Resumir
        if any(t in e for t in ["resume", "resumir", "de qué trata"]):
            if m_num:
                c = self.correo_por_indice(int(m_num.group(1)))
                if c:
                    resumen = self.resumir_correo(c)
                    return f"📋 **Resumen del correo {m_num.group(1)}:**\n\n{resumen}"
                return "No encontré ese correo."

        # Generar respuesta (borrador) y dejarlo pendiente de confirmación
        if any(t in e for t in ["responde al", "responder al", "genera respuesta"]):
            if m_num:
                c = self.correo_por_indice(int(m_num.group(1)))
                if c:
                    cuerpo_ia = self.generar_respuesta_ia(c)
                    m = re.search(r'[\w\.\-]+@[\w\.\-]+\.\w+', c.de)
                    if not m:
                        return f"Generé un borrador pero no pude extraer la dirección de '{c.de}'."
                    asunto = f"Re: {c.asunto}" if not c.asunto.startswith("Re:") else c.asunto
                    cuerpo_completo = (
                        f"{cuerpo_ia}\n\n—— Mensaje original ——\n"
                        f"De: {c.de}\nFecha: {c.fecha}\n\n{c.cuerpo[:500]}"
                    )
                    self._borrador_pendiente = (m.group(0), asunto, cuerpo_completo)
                    return (
                        f"✍ **Borrador de respuesta para {m.group(0)}:**\n\n{cuerpo_ia}\n\n"
                        f"¿La envío? Di 'sí envía' o 'no'."
                    )
                return "No encontré ese correo."

        # Enviar email
        if any(t in e for t in ["envía", "enviar", "manda", "escribe un email", "escribe un correo"]):
            para  = self._extraer_para(entrada)
            if not para:
                return "¿A quién envío? Di: 'envía email a nombre@ejemplo.com asunto [tema] mensaje [texto]'"
            asunto, cuerpo = self._extraer_asunto_cuerpo(entrada)
            ok, msg = self.enviar(para, asunto, cuerpo)
            return msg

        # Buscar email
        if any(t in e for t in ["busca", "buscar", "encuentra"]):
            termino = re.sub(r'.*(busca|buscar|encuentra)\s*', '', e).strip()
            if termino:
                correos = self.buscar(termino)
                if not correos:
                    return f"No encontré emails sobre '{termino}'."
                lineas = [f"🔍 **Resultados para '{termino}':**\n"]
                for i, c in enumerate(correos, 1):
                    lineas.append(f"{i}. {c.resumen_corto()}")
                return "\n".join(lineas)

        return ("Con el email puedo:\n"
                "• 'revisar email' — ver no leídos\n"
                "• 'lee el correo 1' — leer uno\n"
                "• 'resume el 2' — resumir con IA\n"
                "• 'responde al 1' — borrador de respuesta\n"
                "• 'envía email a x@y.com asunto Hola mensaje Buenos días'\n"
                "• 'busca email de Juan'")

    def _extraer_para(self, texto: str) -> str:
        m = re.search(r'[\w\.\-]+@[\w\.\-]+\.\w+', texto)
        return m.group(0) if m else ""

    def _extraer_asunto_cuerpo(self, texto: str) -> Tuple[str, str]:
        m_a = re.search(r'asunto\s+(.+?)(?:\s+mensaje\s+|$)', texto, re.IGNORECASE)
        m_c = re.search(r'mensaje\s+(.+)$', texto, re.IGNORECASE | re.DOTALL)
        asunto = m_a.group(1).strip() if m_a else "Mensaje"
        cuerpo  = m_c.group(1).strip() if m_c else texto
        return asunto, cuerpo


# ── Instancia global ──────────────────────────────────────────────────────────
_email_agent: Optional[AgenteEmail] = None

def get_email(config: Dict = None) -> AgenteEmail:
    global _email_agent
    if _email_agent is None:
        _email_agent = AgenteEmail(config or {})
    return _email_agent
