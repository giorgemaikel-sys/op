"""
agente_viajes.py — Agente de búsqueda de hoteles, vuelos y viajes para Susan v3.
Usa DuckDuckGo y scraping para comparar precios de múltiples plataformas.
"""

import re, webbrowser, json, threading
from typing import List, Optional, Dict, Tuple, Callable
from dataclasses import dataclass
from datetime import datetime, date
from logger import logger

try:
    from duckduckgo_search import DDGS
    HAS_DDG = True
except ImportError:
    HAS_DDG = False

try:
    import requests as _req
    from bs4 import BeautifulSoup
    HAS_SCRAPE = True
except ImportError:
    HAS_SCRAPE = False


# ── Modelos de datos ──────────────────────────────────────────────────────────
@dataclass
class Hotel:
    nombre:        str
    precio_noche:  float
    moneda:        str = "USD"
    estrellas:     float = 0.0
    calificacion:  float = 0.0
    ubicacion:     str = ""
    url:           str = ""
    plataforma:    str = ""
    desayuno:      bool = False
    cancelacion:   str = ""

    def resumen(self) -> str:
        estrs = "⭐" * int(self.estrellas) if self.estrellas else ""
        precio_str = f"${self.precio_noche:.0f}/noche" if self.precio_noche > 0 else "Precio var."
        return (
            f"🏨 **{self.nombre}** {estrs}\n"
            f"   💰 {precio_str}  |  📍 {self.ubicacion[:40]}\n"
            f"   {'⭐ ' + str(self.calificacion) + '/10' if self.calificacion else ''}  "
            f"| 🌐 {self.plataforma}\n"
            f"   🔗 {self.url[:70]}{'…' if len(self.url) > 70 else ''}"
        )


@dataclass
class Vuelo:
    aerolinea:  str
    origen:     str
    destino:    str
    precio:     float
    moneda:     str = "USD"
    duracion:   str = ""
    escalas:    int = 0
    fecha_ida:  str = ""
    url:        str = ""
    plataforma: str = ""

    def resumen(self) -> str:
        precio_str = f"${self.precio:.0f}" if self.precio > 0 else "Ver precio"
        return (
            f"✈️ **{self.aerolinea}** — {self.origen} → {self.destino}\n"
            f"   💰 {precio_str}  |  ⏱ {self.duracion}  |  "
            f"{'Directo' if self.escalas == 0 else str(self.escalas) + ' escala(s)'}\n"
            f"   🔗 {self.url[:70]}{'…' if len(self.url) > 70 else ''}"
        )


# ── Agente ────────────────────────────────────────────────────────────────────
class AgenteViajes:
    """Busca y compara hoteles, vuelos y paquetes de viaje."""

    PLATAFORMAS_HOTEL   = ["booking", "airbnb", "expedia", "trivago", "agoda"]
    PLATAFORMAS_VUELO   = ["kayak", "skyscanner", "google flights", "despegar", "vivaaerobus"]

    def __init__(self):
        self._ultimo_destino: str = ""
        self._hoteles_cache: List[Hotel] = []
        self._vuelos_cache:  List[Vuelo] = []

    # ── Búsqueda de hoteles ───────────────────────────────────────────────────
    def buscar_hoteles(
        self,
        destino: str,
        checkin: str = "",
        checkout: str = "",
        personas: int = 2,
        orden: str = "precio_asc",
        max_res: int = 8,
        on_progreso: Optional[Callable[[str], None]] = None,
    ) -> List[Hotel]:
        self._ultimo_destino = destino
        logger.info(f"[Viajes] Buscando hoteles en {destino}")

        hoteles: List[Hotel] = []
        lock = threading.Lock()

        def _buscar_plataforma(plat: str):
            if on_progreso:
                on_progreso(f"🔍 Buscando en {plat.title()}…")
            h = self._hoteles_ddg(destino, checkin, checkout, personas, plat, max_res // 2)
            with lock:
                hoteles.extend(h)

        hilos = [threading.Thread(target=_buscar_plataforma, args=(p,), daemon=True)
                 for p in ["booking", "airbnb", "trivago"]]
        for t in hilos: t.start()
        for t in hilos: t.join(timeout=20)

        # Ordenar
        if orden == "precio_asc":
            hoteles.sort(key=lambda h: h.precio_noche if h.precio_noche > 0 else float('inf'))
        elif orden == "precio_desc":
            hoteles.sort(key=lambda h: h.precio_noche, reverse=True)
        elif orden == "calificacion":
            hoteles.sort(key=lambda h: h.calificacion, reverse=True)

        self._hoteles_cache = hoteles[:max_res]
        return self._hoteles_cache

    def _hoteles_ddg(
        self,
        destino: str,
        checkin: str,
        checkout: str,
        personas: int,
        plataforma: str,
        max_res: int,
    ) -> List[Hotel]:
        if not HAS_DDG:
            return []

        query = f"hoteles baratos {destino} {plataforma} {checkin} precio por noche"
        try:
            with DDGS() as ddgs:
                resultados = list(ddgs.text(query, max_results=max_res))

            hoteles = []
            for res in resultados:
                titulo  = res.get("title", "")
                snippet = res.get("body", "")
                url     = res.get("href", "")

                if not titulo or "hotel" not in (titulo + snippet).lower():
                    continue

                # Extraer precio
                precio = 0.0
                m = re.search(r'[\$\€\£]\s*([\d,]+)', snippet.replace(',', ''))
                if m:
                    try:
                        p = float(m.group(1))
                        if 10 < p < 10000:
                            precio = p
                    except ValueError:
                        pass

                # Extraer calificación
                calificacion = 0.0
                m_cal = re.search(r'(\d+\.?\d*)\s*(?:\/10|de 10|puntos|out of 10)', snippet)
                if m_cal:
                    try:
                        calificacion = float(m_cal.group(1))
                    except ValueError:
                        pass

                # Estrellas
                estrellas = 0.0
                m_est = re.search(r'(\d+)\s*estrell', snippet, re.IGNORECASE)
                if m_est:
                    try:
                        estrellas = float(m_est.group(1))
                    except ValueError:
                        pass

                hoteles.append(Hotel(
                    nombre=titulo[:80],
                    precio_noche=precio,
                    ubicacion=destino,
                    url=url,
                    plataforma=plataforma.title(),
                    calificacion=calificacion,
                    estrellas=min(estrellas, 5),
                ))
            return hoteles
        except Exception as exc:
            logger.warning(f"[Viajes] DDG hoteles {plataforma}: {exc}")
            return []

    # ── Búsqueda de vuelos ────────────────────────────────────────────────────
    def buscar_vuelos(
        self,
        origen: str,
        destino: str,
        fecha: str = "",
        vuelta: str = "",
        pasajeros: int = 1,
        on_progreso: Optional[Callable[[str], None]] = None,
    ) -> List[Vuelo]:
        logger.info(f"[Viajes] Buscando vuelos {origen} → {destino}")
        if on_progreso:
            on_progreso(f"✈️ Buscando vuelos {origen} → {destino}…")

        vuelos: List[Vuelo] = []
        if not HAS_DDG:
            return vuelos

        query = (
            f"vuelos baratos {origen} a {destino} "
            f"{fecha} precio pasaje aerolínea"
        )
        try:
            with DDGS() as ddgs:
                resultados = list(ddgs.text(query, max_results=8))

            for res in resultados:
                titulo  = res.get("title", "")
                snippet = res.get("body", "")
                url     = res.get("href", "")

                precio = 0.0
                m = re.search(r'[\$\€\£]\s*([\d,]+)', snippet.replace(',', ''))
                if m:
                    try:
                        p = float(m.group(1))
                        if 50 < p < 50000:
                            precio = p
                    except ValueError:
                        pass

                # Detectar aerolínea del título
                aerolineas = [
                    "Volaris", "Interjet", "Aeromexico", "VivaAerobus", "United",
                    "American", "Delta", "Latam", "Avianca", "Copa", "Spirit",
                ]
                aerolinea = "Aerolínea"
                for a in aerolineas:
                    if a.lower() in titulo.lower() or a.lower() in snippet.lower():
                        aerolinea = a
                        break

                # Duracion
                dur_m = re.search(r'(\d+h?\s*\d*m?)\s*(horas?|h\b)', snippet)
                duracion = dur_m.group(0) if dur_m else ""

                plataforma = ""
                for p in ["kayak", "skyscanner", "despegar", "expedia", "trivago"]:
                    if p in url.lower():
                        plataforma = p.title()
                        break

                vuelos.append(Vuelo(
                    aerolinea=aerolinea,
                    origen=origen,
                    destino=destino,
                    precio=precio,
                    duracion=duracion,
                    url=url,
                    fecha_ida=fecha,
                    plataforma=plataforma or "Comparador",
                ))

            vuelos.sort(key=lambda v: v.precio if v.precio > 0 else float('inf'))
            self._vuelos_cache = vuelos[:8]
            return self._vuelos_cache
        except Exception as exc:
            logger.warning(f"[Viajes] vuelos DDG: {exc}")
            return []

    # ── Abrir en sitio ────────────────────────────────────────────────────────
    def abrir_booking(self, destino: str, checkin: str = "", checkout: str = "") -> str:
        url = f"https://www.booking.com/search.html?ss={destino.replace(' ', '+')}"
        if checkin:
            url += f"&checkin={checkin}"
        if checkout:
            url += f"&checkout={checkout}"
        webbrowser.open(url)
        return f"✔ Abriendo Booking.com para '{destino}'…"

    def abrir_airbnb(self, destino: str) -> str:
        url = f"https://www.airbnb.com/s/{destino.replace(' ', '-')}/homes"
        webbrowser.open(url)
        return f"✔ Abriendo Airbnb para '{destino}'…"

    def abrir_skyscanner_vuelos(self, origen: str, destino: str, fecha: str = "") -> str:
        url = f"https://www.skyscanner.com/transport/flights/{origen}/{destino}/"
        if fecha:
            url += fecha.replace("-", "") + "/"
        webbrowser.open(url)
        return f"✔ Abriendo Skyscanner: {origen} → {destino}…"

    def abrir_google_flights(self, origen: str, destino: str, fecha: str = "") -> str:
        url = f"https://www.google.com/travel/flights/search?tfs=CBwQAhojEgoyMDI0LTEyLTAxagcIARIDTVhKcgcIARIDSkZLSAFoAXABggELCP___________wESAggB"
        # Usar URL más simple
        url = (f"https://www.google.com/travel/flights?q=vuelos+de+"
               f"{origen.replace(' ', '+')}+a+{destino.replace(' ', '+')}")
        webbrowser.open(url)
        return f"✔ Abriendo Google Flights: {origen} → {destino}…"

    def abrir_resultado(self, tipo: str, indice: int) -> str:
        cache = self._hoteles_cache if tipo == "hotel" else self._vuelos_cache
        if 1 <= indice <= len(cache):
            item = cache[indice - 1]
            url = item.url
            if url:
                webbrowser.open(url)
                nombre = item.nombre if hasattr(item, 'nombre') else str(item)
                return f"✔ Abriendo {nombre[:50]} en el navegador…"
        return f"No encontré el resultado número {indice}."

    # ── Formatear resultados ──────────────────────────────────────────────────
    def formatear_hoteles(self, hoteles: List[Hotel], destino: str) -> str:
        if not hoteles:
            return f"No encontré hoteles disponibles en '{destino}'."

        con_precio = [h for h in hoteles if h.precio_noche > 0]

        lineas = [f"🏨 **Hoteles en {destino}** ({len(hoteles)} encontrados)\n"]

        if con_precio:
            mas_barato = min(con_precio, key=lambda h: h.precio_noche)
            lineas.append(f"💚 Más barato: {mas_barato.nombre[:50]} — ${mas_barato.precio_noche:.0f}/noche ({mas_barato.plataforma})\n")

        for i, h in enumerate(hoteles[:6], 1):
            lineas.append(f"{i}. {h.resumen()}\n")

        lineas.append("\nDi **'abre el hotel 1'** para verlo, o **'abre booking'** / **'abre airbnb'** para buscar directamente.")
        return "\n".join(lineas)

    def formatear_vuelos(self, vuelos: List[Vuelo]) -> str:
        if not vuelos:
            return "No encontré vuelos para esa ruta."

        con_precio = [v for v in vuelos if v.precio > 0]
        lineas = [f"✈️ **Vuelos** ({len(vuelos)} encontrados)\n"]

        if con_precio:
            mas_barato = min(con_precio, key=lambda v: v.precio)
            lineas.append(f"💚 Más barato: {mas_barato.aerolinea} — ${mas_barato.precio:.0f}\n")

        for i, v in enumerate(vuelos[:6], 1):
            lineas.append(f"{i}. {v.resumen()}\n")

        lineas.append("\nDi **'abre el vuelo 1'** para ver más detalles.")
        return "\n".join(lineas)

    # ── Manejar entrada ───────────────────────────────────────────────────────
    def manejar(self, entrada: str, on_progreso: Optional[Callable] = None) -> str:
        e = entrada.lower()

        # Abrir booking directamente
        if "booking" in e and any(t in e for t in ["abre", "abrir", "ir a"]):
            destino = self._extraer_destino(e) or self._ultimo_destino
            return self.abrir_booking(destino)

        if "airbnb" in e and any(t in e for t in ["abre", "abrir", "ir a"]):
            destino = self._extraer_destino(e) or self._ultimo_destino
            return self.abrir_airbnb(destino)

        if "skyscanner" in e or "google flights" in e:
            origen, destino = self._extraer_origen_destino(e)
            return self.abrir_skyscanner_vuelos(origen, destino) if "skyscanner" in e \
                else self.abrir_google_flights(origen, destino)

        # Abrir resultado específico
        m_num = re.search(r'\b(\d+)\b', e)
        if any(t in e for t in ["abre el hotel", "ver hotel", "abrir hotel"]):
            if m_num:
                return self.abrir_resultado("hotel", int(m_num.group(1)))

        if any(t in e for t in ["abre el vuelo", "ver vuelo", "abrir vuelo"]):
            if m_num:
                return self.abrir_resultado("vuelo", int(m_num.group(1)))

        # Buscar vuelos
        if any(t in e for t in ["vuelo", "vuelos", "volar", "boleto de avión"]):
            origen, destino = self._extraer_origen_destino(e)
            fecha = self._extraer_fecha(e)
            if not destino:
                return "¿A qué destino? Di: 'busca vuelos de México a Madrid en diciembre'"
            vuelos = self.buscar_vuelos(origen or "México", destino, fecha, on_progreso=on_progreso)
            return self.formatear_vuelos(vuelos)

        # Buscar hoteles
        destino = self._extraer_destino(e)
        if not destino:
            return (
                "¿Dónde quieres buscar? Ejemplos:\n"
                "• 'busca hoteles baratos en Cancún'\n"
                "• 'vuelos de Madrid a Nueva York'\n"
                "• 'abre Booking para París'"
            )

        checkin  = self._extraer_fecha(e, "entrada")
        checkout = self._extraer_fecha(e, "salida")
        orden    = self._extraer_orden(e)
        hoteles  = self.buscar_hoteles(destino, checkin, checkout, orden=orden, on_progreso=on_progreso)
        return self.formatear_hoteles(hoteles, destino)

    # ── Helpers de extracción ─────────────────────────────────────────────────
    def _extraer_destino(self, texto: str) -> str:
        patrones = [
            r'(?:en|a|para|cerca de)\s+([a-záéíóúñ\s]+?)(?:\s+(?:barato|caro|para|el|la|en)|$)',
            r'hoteles?\s+(?:en\s+)?([a-záéíóúñ\s]+?)(?:\s+|$)',
        ]
        for p in patrones:
            m = re.search(p, texto, re.IGNORECASE)
            if m:
                dest = m.group(1).strip().title()
                if len(dest) > 2:
                    return dest
        return ""

    def _extraer_origen_destino(self, texto: str) -> Tuple[str, str]:
        m = re.search(
            r'(?:de|desde)\s+([a-záéíóúñ\s]+?)\s+(?:a|hacia|para)\s+([a-záéíóúñ\s]+?)(?:\s+|$)',
            texto, re.IGNORECASE
        )
        if m:
            return m.group(1).strip().title(), m.group(2).strip().title()
        m2 = re.search(r'(?:a|hacia|para)\s+([a-záéíóúñ\s]+?)(?:\s+|$)', texto, re.IGNORECASE)
        if m2:
            return "", m2.group(1).strip().title()
        return "", ""

    def _extraer_fecha(self, texto: str, tipo: str = "") -> str:
        meses = {
            "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
            "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
            "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12",
        }
        for mes, num in meses.items():
            if mes in texto:
                año = datetime.now().year
                return f"{año}-{num}-01"

        m = re.search(r'(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?', texto)
        if m:
            d, mo, y = m.group(1), m.group(2), m.group(3) or str(datetime.now().year)
            if len(y) == 2:
                y = "20" + y
            return f"{y}-{mo.zfill(2)}-{d.zfill(2)}"
        return ""

    def _extraer_orden(self, texto: str) -> str:
        if any(t in texto for t in ["más barato", "barato", "económico", "precio más bajo"]):
            return "precio_asc"
        if any(t in texto for t in ["más caro", "caro", "lujoso", "premium"]):
            return "precio_desc"
        if any(t in texto for t in ["mejor calificado", "más valorado", "rating"]):
            return "calificacion"
        return "precio_asc"


# ── Instancia global ──────────────────────────────────────────────────────────
_viajes: Optional[AgenteViajes] = None

def get_viajes() -> AgenteViajes:
    global _viajes
    if _viajes is None:
        _viajes = AgenteViajes()
    return _viajes
