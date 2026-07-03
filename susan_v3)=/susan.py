"""
susan.py — Orquestador principal de Susan v3.
Conecta todos los agentes, gestiona el estado y genera respuestas.
"""

import json, os, threading, re, time
from typing import List, Optional, Callable, Dict
from logger import logger
from memoria import (
    agregar_mensaje, cargar_memoria_texto,
    guardar_conocimiento, buscar_conocimiento,
    guardar_historial_compras,
)
import ia as IA

# ── Cargar configuración ──────────────────────────────────────────────────────
_cfg_cache: Optional[Dict] = None

def _cfg() -> Dict:
    global _cfg_cache
    if _cfg_cache:
        return _cfg_cache
    try:
        ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
        with open(ruta, "r", encoding="utf-8") as f:
            _cfg_cache = json.load(f)
    except Exception:
        _cfg_cache = {}
    return _cfg_cache

def _agente_activo(nombre: str) -> bool:
    return _cfg().get("agentes", {}).get(nombre, True)


# ── Estado global de conversación ─────────────────────────────────────────────
class Estado:
    """Estado mutable compartido entre turnos de conversación."""
    yt_pendiente:    bool             = False
    yt_titulo:       str              = ""
    yt_url:          str              = ""
    sys_pendiente:   Optional[Callable] = None
    esperando_confirm: str            = ""  # "youtube" | "sistema" | "compra_camara" | "email_envio"
    objeto_escaneado: str             = ""
    ultimo_contenido_creativo: str    = ""

_estado = Estado()


# ── Instancias de agentes (lazy) ──────────────────────────────────────────────
_agentes: Dict = {}

def _get(nombre: str):
    if nombre not in _agentes:
        config = _cfg()
        if nombre == "vision":
            from agentes.agente_vision   import get_vision;    _agentes[nombre] = get_vision()
        elif nombre == "compras":
            from agentes.agente_compras  import get_compras;   _agentes[nombre] = get_compras()
        elif nombre == "email":
            from agentes.agente_email    import get_email;     _agentes[nombre] = get_email(config)
        elif nombre == "roblox":
            from agentes.agente_roblox   import get_roblox;    _agentes[nombre] = get_roblox(config)
        elif nombre == "viajes":
            from agentes.agente_viajes   import get_viajes;    _agentes[nombre] = get_viajes()
        elif nombre == "auto":
            from agentes.agente_auto     import get_auto;      _agentes[nombre] = get_auto()
        elif nombre == "clima":
            from agentes.agentes_utiles  import get_clima;     _agentes[nombre] = get_clima()
        elif nombre == "noticias":
            from agentes.agentes_utiles  import get_noticias;  _agentes[nombre] = get_noticias()
        elif nombre == "traductor":
            from agentes.agentes_utiles  import get_traductor; _agentes[nombre] = get_traductor()
        elif nombre == "pantalla":
            from agentes.agentes_utiles  import get_pantalla;  _agentes[nombre] = get_pantalla()
        elif nombre == "sistema":
            from agentes.agentes_utiles  import get_sistema;   _agentes[nombre] = get_sistema()
        elif nombre == "archivos":
            from agentes.agentes_utiles  import get_archivos;  _agentes[nombre] = get_archivos()
        elif nombre == "whatsapp":
            from agentes.agentes_utiles  import get_whatsapp;  _agentes[nombre] = get_whatsapp()
        elif nombre == "youtube":
            from agentes.agentes_utiles  import get_youtube;   _agentes[nombre] = get_youtube()
        elif nombre == "lanzador":
            from agentes.agentes_utiles  import get_lanzador;  _agentes[nombre] = get_lanzador()
        elif nombre == "axiom":
            from agentes.agente_axiom    import get_axiom;     _agentes[nombre] = get_axiom(config)
        elif nombre == "creativo":
            from agentes.agente_creativo import get_creativo;  _agentes[nombre] = get_creativo(config)
        elif nombre == "vscode":
            from agentes.agente_vscode   import get_vscode;    _agentes[nombre] = get_vscode(config)
        elif nombre == "claude":
            from agentes.agente_claude   import get_claude;    _agentes[nombre] = get_claude(config)
    return _agentes.get(nombre)


# ── Función principal ─────────────────────────────────────────────────────────
def responder(
    entrada: str,
    on_token:    Optional[Callable[[str], None]] = None,
    on_progreso: Optional[Callable[[str], None]] = None,
    on_resultado: Optional[Callable[[str, str], None]] = None,
    on_alarma:   Optional[Callable[[str], None]] = None,
    on_cerebro:  Optional[Callable[[str, str], None]] = None,
) -> str:
    """
    Genera una respuesta completa para la entrada del usuario.
    on_token    → callback para streaming de tokens
    on_progreso → callback para mensajes de progreso
    on_resultado → callback para resultados especiales (tipo, contenido)
    on_alarma   → callback para recordatorios/alarmas
    on_cerebro  → callback (estado, nombre) del Consejo de Cerebros
    """
    global _estado

    entrada  = IA.limpiar(entrada).strip()
    e_lower  = entrada.lower()
    historial = cargar_memoria_texto(10)

    if not entrada:
        return ""

    logger.info(f"[Susan] Entrada: {entrada[:80]}")

    # ── 1. Confirmaciones pendientes ──────────────────────────────────────────
    if _estado.esperando_confirm:
        return _procesar_confirmacion(entrada, e_lower, on_progreso)

    # ── 2. Detectar intención ─────────────────────────────────────────────────
    intencion = IA.detectar_intencion(entrada)
    logger.info(f"[Susan] Intención: {intencion}")

    # ── 3. Router de agentes ──────────────────────────────────────────────────
    respuesta = _router(intencion, entrada, e_lower, historial,
                        on_token, on_progreso, on_resultado, on_alarma, on_cerebro)

    # ── 4. Guardar en memoria ─────────────────────────────────────────────────
    agregar_mensaje("usuario", entrada)
    agregar_mensaje("susan",   respuesta)
    guardar_conocimiento(f"Usuario: {entrada}\nSusan: {respuesta}", fuente="conversacion")

    return respuesta


def _router(
    intencion: str,
    entrada:   str,
    e_lower:   str,
    historial: List[str],
    on_token,
    on_progreso,
    on_resultado,
    on_alarma,
    on_cerebro=None,
) -> str:
    global _estado

    # ── Compras ───────────────────────────────────────────────────────────────
    if intencion == "compras" and _agente_activo("compras"):
        if on_progreso: on_progreso("🛍️ Iniciando búsqueda de productos…")
        return _get("compras").manejar(entrada, on_progreso=on_progreso)

    # ── Vision para compras ───────────────────────────────────────────────────
    if intencion == "vision_compra" and _agente_activo("vision") and _agente_activo("compras"):
        if on_progreso: on_progreso("📷 Activando cámara para escanear…")
        vision  = _get("vision")
        objeto  = vision.escanear_objeto_para_compra()
        if objeto:
            _estado.objeto_escaneado = objeto
            _estado.esperando_confirm = "compra_camara"
            return (
                f"📷 Identifiqué: **{objeto}**\n\n"
                f"¿En qué tiendas busco? Di 'Amazon', 'Temu', 'eBay' o cualquier combinación.\n"
                f"También puedes decir 'más barato' o 'mejor calificado'."
            )
        return "No pude identificar el objeto. Asegúrate de que esté bien iluminado y visible."

    # ── Email ─────────────────────────────────────────────────────────────────
    if intencion == "email" and _agente_activo("email"):
        email = _get("email")
        resp = email.manejar(entrada)
        # Si quedó un borrador de respuesta esperando confirmación, recordarlo.
        if getattr(email, "hay_borrador_pendiente", lambda: False)():
            _estado.esperando_confirm = "email_envio"
        return resp

    # ── Roblox ───────────────────────────────────────────────────────────────
    if intencion == "roblox" and _agente_activo("roblox"):
        if on_progreso: on_progreso("🎮 Procesando con Axiom Roblox…")
        return _get("roblox").manejar(entrada, on_token=on_token)

    # ── Viajes ────────────────────────────────────────────────────────────────
    if intencion == "viajes" and _agente_activo("viajes"):
        if on_progreso: on_progreso("✈️ Buscando opciones de viaje…")
        return _get("viajes").manejar(entrada, on_progreso=on_progreso)

    # ── Automatización ────────────────────────────────────────────────────────
    if intencion == "automatizacion" and _agente_activo("automatizacion"):
        auto = _get("auto")
        if not auto._on_alarma and on_alarma:
            auto._on_alarma = on_alarma
        return auto.manejar(entrada, on_alarma=on_alarma)

    # ── Pantalla OCR ──────────────────────────────────────────────────────────
    if intencion == "pantalla" and _agente_activo("pantalla_ocr"):
        if on_progreso: on_progreso("🖥️ Leyendo pantalla…")
        return _get("pantalla").manejar(entrada)

    # ── Clima ─────────────────────────────────────────────────────────────────
    if intencion == "clima":
        if on_progreso: on_progreso("🌤️ Consultando clima…")
        return _get("clima").manejar(entrada)

    # ── Noticias ─────────────────────────────────────────────────────────────
    if intencion == "noticias":
        if on_progreso: on_progreso("📰 Buscando noticias…")
        return _get("noticias").manejar(entrada)

    # ── Traducción ────────────────────────────────────────────────────────────
    if intencion == "traductor":
        if on_progreso: on_progreso("🌐 Traduciendo…")
        return _get("traductor").manejar(entrada)

    # ── WhatsApp ──────────────────────────────────────────────────────────────
    if intencion == "whatsapp" and _agente_activo("whatsapp"):
        if on_progreso: on_progreso("📱 Preparando WhatsApp…")
        return _get("whatsapp").manejar(entrada, on_progreso=on_progreso)

    # ── YouTube ───────────────────────────────────────────────────────────────
    if intencion == "youtube" and _agente_activo("youtube"):
        yt = _get("youtube")
        respuesta = yt.manejar(entrada)
        _estado.esperando_confirm = "youtube"
        return respuesta

    # ── Visión ────────────────────────────────────────────────────────────────
    if intencion == "vision" and _agente_activo("vision"):
        return _get("vision").manejar(entrada)

    # ── Sistema ───────────────────────────────────────────────────────────────
    if intencion == "sistema" and _agente_activo("sistema"):
        resp = _get("sistema").manejar(entrada)
        # Si pide confirmación, marcar estado
        if "(sí/no)" in resp:
            _estado.esperando_confirm = "sistema"
        return resp

    # ── Archivos ──────────────────────────────────────────────────────────────
    if intencion == "archivos" and _agente_activo("archivos"):
        return _get("archivos").manejar(entrada)

    # ── Axiom (código) ────────────────────────────────────────────────────────
    if intencion == "axiom" and _agente_activo("axiom"):
        return _get("axiom").manejar(entrada, on_log=on_progreso)

    # ── Creativo ──────────────────────────────────────────────────────────────
    if intencion == "creativo" and _agente_activo("creativo"):
        def _on_result(tipo: str, contenido: str):
            _estado.ultimo_contenido_creativo = contenido
            if on_resultado:
                on_resultado(tipo, contenido)
        return _get("creativo").manejar(
            entrada,
            on_progreso=on_progreso,
            on_resultado=_on_result,
        )

    # ── Escritura automática ──────────────────────────────────────────────────
    if intencion == "escribir":
        texto = re.sub(r'^(escrib[ei]r?\s+)', '', entrada, flags=re.IGNORECASE).strip()
        return _get("auto").escribir_texto(texto)

    # ── Abrir app ─────────────────────────────────────────────────────────────
    if e_lower.startswith(("abre ", "abrir ", "inicia ", "lanza ")):
        resto = re.sub(r'^(abre|abrir|inicia|lanza)\s+', '', e_lower).strip()
        # Intentar carpeta primero
        if _agente_activo("archivos"):
            r = _get("archivos").manejar(entrada)
            if not r.startswith("Di:"):
                return r
        # Luego app
        return _get("lanzador").abrir(resto)

    # ── Confirmaciones sueltas (sí/no) ────────────────────────────────────────
    if intencion == "confirmar":
        yt = _get("youtube")
        if yt and yt.hay_pendiente():
            yt.reproducir_pendiente()
            _estado.esperando_confirm = ""
            return "▶️ Reproduciendo ahora…"

    # ── Conversación general ──────────────────────────────────────────────────
    if on_progreso: on_progreso("💭 Pensando…")

    # Buscar contexto en conocimiento local
    conocimiento = buscar_conocimiento(entrada, max_resultados=2)
    contexto_extra = ""
    if conocimiento:
        contexto_extra = "Información relevante:\n" + "\n".join(conocimiento[:2]) + "\n\n"

    # Búsqueda en internet si no hay contexto
    if not contexto_extra and _agente_activo("conocimiento"):
        try:
            from duckduckgo_search import DDGS
            with DDGS() as d:
                res = list(d.text(entrada, max_results=2))
            if res:
                snips = " | ".join(r.get("body", "")[:200] for r in res)
                contexto_extra = f"Contexto web: {snips}\n\n"
                guardar_conocimiento(snips, fuente="internet")
        except Exception:
            pass

    # ── Consejo de Cerebros (x15) ─────────────────────────────────────────────
    # Si está activo y la pregunta es difícil (modo auto) o siempre (modo siempre),
    # el consejo orquesta varios cerebros. Ante cualquier fallo, vuelve al flujo normal.
    cer_cfg = _cfg().get("cerebros", {})
    modo    = cer_cfg.get("modo", "auto")
    if cer_cfg.get("activo", False) and modo != "off":
        convocar = False
        try:
            import cerebros
            convocar = (modo == "siempre") or (
                modo == "auto" and cerebros.es_pregunta_dificil(
                    entrada, int(cer_cfg.get("umbral_palabras", 25)))
            )
        except Exception as exc:
            logger.warning(f"[Consejo] no disponible: {exc}")
        if convocar:
            try:
                respuesta = cerebros.responder_consejo(
                    entrada, historial, contexto_extra=contexto_extra,
                    on_token=on_token, on_progreso=on_progreso,
                    on_cerebro=on_cerebro, config=_cfg(),
                )
                if respuesta and respuesta.strip():
                    return respuesta
            except Exception as exc:
                logger.warning(f"[Consejo] fallback a generar_respuesta: {exc}")

    respuesta = IA.generar_respuesta(
        entrada, historial,
        contexto_extra=contexto_extra,
        on_token=on_token,
    )
    return respuesta


# ── Procesador de confirmaciones ──────────────────────────────────────────────
def _procesar_confirmacion(entrada: str, e_lower: str, on_progreso) -> str:
    global _estado
    si  = e_lower in {"sí", "si", "dale", "claro", "ok", "sí dale", "adelante", "yes", "yep"}
    no  = e_lower in {"no", "cancelar", "para", "detente", "nope", "nel"}
    tipo = _estado.esperando_confirm

    if tipo == "youtube":
        yt = _get("youtube")
        if si:
            _estado.esperando_confirm = ""
            if yt and yt.hay_pendiente():
                yt.reproducir_pendiente()
                return "▶️ Reproduciendo ahora…"
        elif no:
            _estado.esperando_confirm = ""
            if yt: yt.cancelar()
            return "✔ Cancelado."

    elif tipo == "sistema":
        sis = _get("sistema")
        if si and sis._accion_pendiente:
            _estado.esperando_confirm = ""
            sis._accion_pendiente()
            sis.__class__._accion_pendiente = None
            return "✔ Ejecutando…"
        elif no:
            _estado.esperando_confirm = ""
            sis.__class__._accion_pendiente = None
            return "✔ Cancelado."

    elif tipo == "compra_camara":
        if si or not no:
            # Interpretar qué tiendas quiere
            tiendas = []
            for t in ["amazon", "temu", "ebay", "aliexpress", "mercadolibre"]:
                if t in e_lower:
                    tiendas.append(t)
            if not tiendas:
                tiendas = ["amazon", "temu", "ebay"]

            orden = "precio_asc"
            if any(t in e_lower for t in ["más barato", "barato"]):
                orden = "precio_asc"
            elif any(t in e_lower for t in ["más caro", "caro"]):
                orden = "precio_desc"

            _estado.esperando_confirm = ""
            objeto = _estado.objeto_escaneado
            if on_progreso: on_progreso(f"🛍️ Buscando '{objeto}' en {tiendas}…")
            productos = _get("compras").buscar(objeto, tiendas, orden)
            return _get("compras").formatear_resultados(productos, objeto)
        elif no:
            _estado.esperando_confirm = ""
            return "✔ Búsqueda cancelada."

    elif tipo == "email_envio":
        email = _agentes.get("email")
        quiere_enviar = si or any(t in e_lower for t in [
            "envía", "envia", "enviar", "mándalo", "mandalo", "manda", "sí envía"])
        if email and quiere_enviar and getattr(email, "hay_borrador_pendiente", lambda: False)():
            _estado.esperando_confirm = ""
            if on_progreso: on_progreso("📧 Enviando respuesta…")
            ok, msg = email.enviar_borrador_pendiente()
            return msg
        elif no:
            _estado.esperando_confirm = ""
            if email and hasattr(email, "cancelar_borrador"):
                email.cancelar_borrador()
            return "✔ Borrador descartado, no se envió nada."

    # No reconocido → ignorar estado
    _estado.esperando_confirm = ""
    return IA.generar_respuesta(entrada, cargar_memoria_texto(8))


# ── Exponer estado ────────────────────────────────────────────────────────────
def hay_confirmacion_pendiente() -> bool:
    return bool(_estado.esperando_confirm)

def resetear_estado() -> None:
    _estado.esperando_confirm  = ""
    _estado.objeto_escaneado   = ""
    _estado.yt_pendiente       = False
    yt = _agentes.get("youtube")
    if yt: yt.cancelar()
    sis = _agentes.get("sistema")
    if sis: sis.__class__._accion_pendiente = None

def configurar_alarma_auto(callback: Callable) -> None:
    """Configura el callback de alarma para el agente de automatización."""
    auto = _get("auto")
    if auto:
        auto._on_alarma = callback

def get_agente(nombre: str):
    return _get(nombre)
