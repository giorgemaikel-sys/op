"""
agente_compras.py — Agente de búsqueda de productos y comparación de precios.
Busca en Amazon, Temu, eBay, AliExpress, Google Shopping y más.
También integra la visión para escanear objetos y buscarlos automáticamente.
"""

import re, json, time, threading, webbrowser
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Callable
from logger import logger

try:
    import requests as _req
    HAS_REQ = True
except ImportError:
    HAS_REQ = False

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

try:
    from duckduckgo_search import DDGS
    HAS_DDG = True
except ImportError:
    HAS_DDG = False


# ── Modelos de datos ──────────────────────────────────────────────────────────
@dataclass
class Producto:
    nombre: str
    precio: float
    moneda: str = "USD"
    url: str = ""
    tienda: str = ""
    imagen: str = ""
    calificacion: float = 0.0
    resenas: int = 0
    disponible: bool = True

    def precio_str(self) -> str:
        return f"${self.precio:.2f} {self.moneda}" if self.precio > 0 else "Precio no disponible"

    def resumen(self) -> str:
        estrellas = "⭐" * int(self.calificacion) if self.calificacion > 0 else ""
        return (
            f"• **{self.nombre[:80]}**\n"
            f"  💰 {self.precio_str()}  🏪 {self.tienda}  {estrellas}\n"
            f"  🔗 {self.url[:80]}{'...' if len(self.url) > 80 else ''}"
        )


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}


class AgenteCompras:
    """
    Busca productos en múltiples tiendas online y compara precios.
    Integra con la visión de Susan para buscar objetos identificados por cámara.
    """

    TIENDAS_DISPONIBLES = ["amazon", "ebay", "temu", "aliexpress", "mercadolibre"]

    def __init__(self):
        self._ultimo_resultado: List[Producto] = []
        self._ultima_consulta: str = ""

    # ── Método principal de búsqueda ──────────────────────────────────────────
    def buscar(
        self,
        consulta: str,
        tiendas: Optional[List[str]] = None,
        orden: str = "precio_asc",
        max_por_tienda: int = 5,
        on_progreso: Optional[Callable[[str], None]] = None,
    ) -> List[Producto]:
        """
        Busca productos en las tiendas especificadas.
        orden: 'precio_asc' | 'precio_desc' | 'calificacion' | 'relevancia'
        """
        tiendas = tiendas or ["amazon", "ebay", "temu"]
        tiendas = [t.lower().strip() for t in tiendas]
        self._ultima_consulta = consulta
        logger.info(f"Buscando: '{consulta}' en {tiendas}")

        todos: List[Producto] = []
        resultados_lock = threading.Lock()
        hilos = []

        def _buscar_tienda(tienda: str):
            if on_progreso:
                on_progreso(f"🔍 Buscando en {tienda.title()}…")
            productos = self._buscar_en_tienda(tienda, consulta, max_por_tienda)
            with resultados_lock:
                todos.extend(productos)
            if on_progreso:
                on_progreso(f"✔ {tienda.title()}: {len(productos)} resultados")

        for tienda in tiendas:
            t = threading.Thread(target=_buscar_tienda, args=(tienda,), daemon=True)
            hilos.append(t)
            t.start()

        for t in hilos:
            t.join(timeout=20)

        # Ordenar
        if orden == "precio_asc":
            todos.sort(key=lambda p: p.precio if p.precio > 0 else float('inf'))
        elif orden == "precio_desc":
            todos.sort(key=lambda p: p.precio, reverse=True)
        elif orden == "calificacion":
            todos.sort(key=lambda p: p.calificacion, reverse=True)

        self._ultimo_resultado = todos
        return todos

    def _buscar_en_tienda(self, tienda: str, consulta: str, max_res: int) -> List[Producto]:
        metodos = {
            "amazon":       self._amazon,
            "ebay":         self._ebay,
            "temu":         self._temu_ddg,
            "aliexpress":   self._aliexpress_ddg,
            "mercadolibre": self._mercadolibre_ddg,
        }
        metodo = metodos.get(tienda, self._ddg_generico)
        try:
            return metodo(consulta, max_res)
        except Exception as exc:
            logger.warning(f"Error en {tienda}: {exc}")
            return self._ddg_generico(consulta, max_res, tienda)

    # ── Scrapers por tienda ────────────────────────────────────────────────────
    def _amazon(self, consulta: str, max_res: int) -> List[Producto]:
        if not (HAS_REQ and HAS_BS4):
            return self._ddg_generico(consulta, max_res, "amazon.com")

        url = f"https://www.amazon.com/s?k={consulta.replace(' ', '+')}&language=es"
        productos = []
        try:
            r = _req.get(url, headers=HEADERS, timeout=12)
            soup = BeautifulSoup(r.content, "lxml")

            for item in soup.select('[data-component-type="s-search-result"]')[:max_res]:
                try:
                    nombre_el = item.select_one("h2 span")
                    precio_ent = item.select_one(".a-price-whole")
                    precio_dec = item.select_one(".a-price-fraction")
                    enlace_el  = item.select_one("h2 a")
                    img_el     = item.select_one(".s-image")
                    calif_el   = item.select_one(".a-icon-alt")
                    res_el     = item.select_one('[class*="a-size-base"][class*="s-underline"]')

                    if not (nombre_el and precio_ent and enlace_el):
                        continue

                    p_str = precio_ent.text.replace(",", "").replace(".", "").strip()
                    d_str = precio_dec.text.strip() if precio_dec else "00"
                    try:
                        precio = float(f"{p_str}.{d_str}")
                    except ValueError:
                        continue

                    calificacion = 0.0
                    if calif_el:
                        m = re.search(r'([\d.]+)', calif_el.text)
                        if m:
                            calificacion = float(m.group(1))

                    resenas = 0
                    if res_el:
                        m = re.search(r'([\d,]+)', res_el.text.replace(",", ""))
                        if m:
                            try:
                                resenas = int(m.group(1))
                            except ValueError:
                                pass

                    productos.append(Producto(
                        nombre=nombre_el.text.strip()[:120],
                        precio=precio,
                        moneda="USD",
                        url="https://amazon.com" + enlace_el.get("href", ""),
                        tienda="Amazon",
                        imagen=img_el.get("src", "") if img_el else "",
                        calificacion=calificacion,
                        resenas=resenas,
                    ))
                except Exception:
                    continue
        except Exception as exc:
            logger.warning(f"Amazon scraping: {exc}")
            return self._ddg_generico(consulta, max_res, "amazon.com")

        return productos if productos else self._ddg_generico(consulta, max_res, "amazon.com")

    def _ebay(self, consulta: str, max_res: int) -> List[Producto]:
        if not (HAS_REQ and HAS_BS4):
            return self._ddg_generico(consulta, max_res, "ebay.com")

        url = f"https://www.ebay.com/sch/i.html?_nkw={consulta.replace(' ', '+')}&_sop=15"
        productos = []
        try:
            r = _req.get(url, headers=HEADERS, timeout=12)
            soup = BeautifulSoup(r.content, "lxml")

            for item in soup.select(".s-item")[:max_res + 2]:
                try:
                    nombre_el  = item.select_one(".s-item__title")
                    precio_el  = item.select_one(".s-item__price")
                    enlace_el  = item.select_one(".s-item__link")
                    img_el     = item.select_one(".s-item__image-img")

                    if not (nombre_el and precio_el and enlace_el):
                        continue

                    nombre = nombre_el.text.strip()
                    if "Tienes" in nombre or "Shop" in nombre:
                        continue

                    precio_text = precio_el.text.strip()
                    # Puede ser un rango "US $10.00 a US $20.00"
                    m = re.search(r'[\$\€\£]?\s*([\d,]+\.?\d*)', precio_text.replace(',', ''))
                    if not m:
                        continue
                    precio = float(m.group(1).replace(',', ''))

                    productos.append(Producto(
                        nombre=nombre[:120],
                        precio=precio,
                        moneda="USD",
                        url=enlace_el.get("href", ""),
                        tienda="eBay",
                        imagen=img_el.get("src", "") if img_el else "",
                    ))
                except Exception:
                    continue
        except Exception as exc:
            logger.warning(f"eBay scraping: {exc}")
            return self._ddg_generico(consulta, max_res, "ebay.com")

        return productos if productos else self._ddg_generico(consulta, max_res, "ebay.com")

    def _temu_ddg(self, consulta: str, max_res: int) -> List[Producto]:
        return self._ddg_generico(consulta, max_res, "temu.com")

    def _aliexpress_ddg(self, consulta: str, max_res: int) -> List[Producto]:
        return self._ddg_generico(consulta, max_res, "aliexpress.com")

    def _mercadolibre_ddg(self, consulta: str, max_res: int) -> List[Producto]:
        return self._ddg_generico(consulta, max_res, "mercadolibre.com")

    def _ddg_generico(self, consulta: str, max_res: int, sitio: str = "") -> List[Producto]:
        """Búsqueda via DuckDuckGo como fallback universal."""
        if not HAS_DDG:
            return []

        query = f"{consulta} {sitio} precio comprar" if sitio else f"{consulta} precio comprar online"
        try:
            with DDGS() as ddgs:
                resultados = list(ddgs.text(query, max_results=max_res))

            productos = []
            nombre_tienda = sitio.replace(".com", "").title() if sitio else "Tienda"

            for res in resultados:
                titulo = res.get("title", "")[:120]
                snippet = res.get("body", "")
                url = res.get("href", "")

                # Intentar extraer precio del snippet
                precio = 0.0
                m = re.search(r'[\$\€\£]?\s*([\d,]+\.?\d*)', snippet.replace(',', ''))
                if m:
                    try:
                        precio_raw = float(m.group(1).replace(',', ''))
                        if 0.5 < precio_raw < 100000:
                            precio = precio_raw
                    except ValueError:
                        pass

                # Determinar tienda por URL
                tienda = nombre_tienda
                for t in ["amazon", "temu", "ebay", "aliexpress", "mercadolibre"]:
                    if t in url.lower():
                        tienda = t.title()
                        break

                if titulo:
                    productos.append(Producto(
                        nombre=titulo,
                        precio=precio,
                        moneda="USD",
                        url=url,
                        tienda=tienda,
                    ))

            return productos
        except Exception as exc:
            logger.warning(f"DDG {sitio}: {exc}")
            return []

    # ── Búsqueda con imagen (desde visión) ────────────────────────────────────
    def buscar_desde_camara(
        self,
        tiendas: Optional[List[str]] = None,
        orden: str = "precio_asc",
        on_progreso: Optional[Callable[[str], None]] = None,
    ) -> tuple:
        """Activa la cámara, escanea el objeto y lo busca en tiendas."""
        from agentes.agente_vision import get_vision
        vision = get_vision()

        if on_progreso:
            on_progreso("📷 Activando cámara para escanear objeto…")

        objeto = vision.escanear_objeto_para_compra()
        if not objeto:
            return "No pude identificar ningún objeto en la imagen.", []

        if on_progreso:
            on_progreso(f"🔎 Objeto identificado: {objeto}")

        productos = self.buscar(objeto, tiendas, orden, on_progreso=on_progreso)
        return objeto, productos

    # ── Formatear resultados ──────────────────────────────────────────────────
    def formatear_resultados(self, productos: List[Producto], consulta: str = "") -> str:
        if not productos:
            return "No encontré productos para esa búsqueda."

        con_precio = [p for p in productos if p.precio > 0]
        sin_precio  = [p for p in productos if p.precio == 0]

        lineas = [f"🛍️ **Resultados para '{consulta or self._ultima_consulta}'** "
                  f"({len(productos)} productos encontrados)\n"]

        if con_precio:
            mas_barato  = min(con_precio, key=lambda p: p.precio)
            mas_caro    = max(con_precio, key=lambda p: p.precio)
            lineas.append(f"💚 Más barato: {mas_barato.nombre[:60]} — {mas_barato.precio_str()} ({mas_barato.tienda})")
            if mas_barato != mas_caro:
                lineas.append(f"💸 Más caro: {mas_caro.nombre[:60]} — {mas_caro.precio_str()} ({mas_caro.tienda})")
            lineas.append("")

        for i, p in enumerate(productos[:8], 1):
            lineas.append(f"{i}. {p.nombre[:80]}")
            lineas.append(f"   💰 {p.precio_str()} | 🏪 {p.tienda}"
                          + (f" | ⭐{p.calificacion:.1f}" if p.calificacion else ""))
            if p.url:
                lineas.append(f"   🔗 {p.url[:80]}{'…' if len(p.url) > 80 else ''}")
            lineas.append("")

        return "\n".join(lineas)

    def abrir_producto(self, indice: int) -> str:
        """Abre el producto número N en el navegador."""
        if not self._ultimo_resultado:
            return "No hay búsquedas recientes."
        idx = indice - 1
        if 0 <= idx < len(self._ultimo_resultado):
            p = self._ultimo_resultado[idx]
            if p.url:
                webbrowser.open(p.url)
                return f"Abriendo {p.nombre[:50]} en el navegador…"
        return f"No hay un producto número {indice}."

    def abrir_busqueda_manual(self, consulta: str, tienda: str = "amazon") -> str:
        """Abre una búsqueda directamente en la tienda especificada."""
        urls = {
            "amazon":       f"https://www.amazon.com/s?k={consulta.replace(' ', '+')}",
            "temu":         f"https://www.temu.com/search_result.html?search_key={consulta.replace(' ', '+')}",
            "ebay":         f"https://www.ebay.com/sch/i.html?_nkw={consulta.replace(' ', '+')}",
            "aliexpress":   f"https://www.aliexpress.com/wholesale?SearchText={consulta.replace(' ', '+')}",
            "mercadolibre": f"https://www.mercadolibre.com/jm/search?as_word={consulta.replace(' ', '+')}",
            "google":       f"https://www.google.com/search?q={consulta.replace(' ', '+')}+precio",
        }
        url = urls.get(tienda.lower(), urls["amazon"])
        webbrowser.open(url)
        return f"Abriendo búsqueda de '{consulta}' en {tienda.title()}…"

    # ── Manejar entrada del usuario ────────────────────────────────────────────
    def manejar(self, entrada: str, on_progreso: Optional[Callable[[str], None]] = None) -> str:
        e = entrada.lower()

        # Escanear objeto con cámara y buscar
        if any(t in e for t in ["escanea y busca", "escanear y buscar", "busca esto que te muestro",
                                 "fotografía y busca", "toma foto y busca"]):
            tiendas = self._extraer_tiendas(e) or ["amazon", "temu", "ebay"]
            orden   = self._extraer_orden(e)
            objeto, productos = self.buscar_desde_camara(tiendas, orden, on_progreso)
            if not productos:
                return f"No encontré productos para '{objeto}'."
            return f"📷 Objeto: **{objeto}**\n\n" + self.formatear_resultados(productos, objeto)

        # Abrir producto específico
        if any(t in e for t in ["abre el", "abrir el", "abre producto", "ver producto"]):
            m = re.search(r'\b(\d+)\b', e)
            if m:
                return self.abrir_producto(int(m.group(1)))

        # Buscar en tiendas específicas
        consulta = self._extraer_consulta(entrada)
        tiendas  = self._extraer_tiendas(e)
        orden    = self._extraer_orden(e)

        if not consulta:
            return "¿Qué producto quieres que busque? Di por ejemplo: 'busca audífonos en Amazon más barato'."

        if not tiendas:
            # Detectar tiendas mencionadas
            for t in self.TIENDAS_DISPONIBLES:
                if t in e:
                    tiendas.append(t)
            if not tiendas:
                tiendas = ["amazon", "temu", "ebay"]

        productos = self.buscar(consulta, tiendas, orden, on_progreso=on_progreso)
        return self.formatear_resultados(productos, consulta)

    # ── Helpers de parsing ────────────────────────────────────────────────────
    def _extraer_consulta(self, entrada: str) -> str:
        """Extrae el nombre del producto de la entrada del usuario."""
        e = entrada
        # Quitar frases de comando
        for p in [
            "busca en amazon", "buscar en amazon", "busca en temu", "buscar en temu",
            "busca en ebay", "busca en aliexpress", "busca en mercadolibre",
            "busca ", "buscar ", "encuentra ", "dónde comprar ", "donde comprar ",
            "cuánto cuesta ", "cuanto cuesta ", "precio de ", "busca el precio de ",
            "más barato", "mas barato", "más caro", "mas caro", "barato", "caro",
            "en amazon", "en temu", "en ebay", "en aliexpress",
        ]:
            e = re.sub(re.escape(p), "", e, flags=re.IGNORECASE)
        return e.strip().strip('"\'').strip()

    def _extraer_tiendas(self, entrada: str) -> List[str]:
        tiendas = []
        mapa = {
            "amazon": "amazon", "temu": "temu", "ebay": "ebay",
            "aliexpress": "aliexpress", "mercadolibre": "mercadolibre", "alibaba": "aliexpress",
        }
        for clave, tienda in mapa.items():
            if clave in entrada:
                if tienda not in tiendas:
                    tiendas.append(tienda)
        return tiendas

    def _extraer_orden(self, entrada: str) -> str:
        if any(t in entrada for t in ["más barato", "mas barato", "baratos", "precio más bajo", "económico"]):
            return "precio_asc"
        if any(t in entrada for t in ["más caro", "mas caro", "caros", "precio más alto", "premium"]):
            return "precio_desc"
        if any(t in entrada for t in ["mejor calificado", "mejor valorado", "más popular"]):
            return "calificacion"
        return "precio_asc"  # Default: más barato primero


# ── Instancia global ──────────────────────────────────────────────────────────
_compras: Optional[AgenteCompras] = None

def get_compras() -> AgenteCompras:
    global _compras
    if _compras is None:
        _compras = AgenteCompras()
    return _compras
