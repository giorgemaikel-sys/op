"""
agente_vision.py — Visión avanzada para Susan v3.
Cámara, detección de objetos, OCR visual y escaneo para búsqueda en tiendas.
"""

import cv2, os, base64, glob, time, threading
from datetime import datetime
from typing import Optional, Tuple, Callable
from logger import logger

try:
    import requests as _req
    HAS_REQ = True
except ImportError:
    HAS_REQ = False

CAPTURAS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "capturas")
OLLAMA_URL   = "http://localhost:11434/api/generate"
LLAVA_MODEL  = "llava:latest"


class AgenteVision:
    """Gestiona la cámara y el análisis visual con LLaVA."""

    def __init__(self):
        self.cap: Optional[cv2.VideoCapture] = None
        self.activa = False
        self.cam_index = -1
        self._ultima_foto: Optional[str] = None
        self._ultimo_objeto: Optional[str] = None
        os.makedirs(CAPTURAS_DIR, exist_ok=True)

    # ── Cámara ────────────────────────────────────────────────────────────────
    def _detectar_camara(self) -> int:
        for i in range(5):
            cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
            if cap.isOpened():
                ret, _ = cap.read()
                cap.release()
                if ret:
                    logger.debug(f"Cámara en índice {i}")
                    return i
        return -1

    def iniciar(self) -> str:
        if self.activa:
            return "La cámara ya está activa."
        self.cam_index = self._detectar_camara()
        if self.cam_index == -1:
            return "No se encontró ninguna cámara."
        self.cap = cv2.VideoCapture(self.cam_index, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            return "No se pudo abrir la cámara."
        ret, _ = self.cap.read()
        if not ret:
            self.cap.release()
            return "La cámara no captura imágenes."
        self.activa = True
        logger.info(f"Cámara iniciada (índice {self.cam_index})")
        return "Cámara iniciada correctamente."

    def detener(self) -> str:
        self.activa = False
        if self.cap:
            self.cap.release()
            self.cap = None
        return "Cámara detenida."

    def tomar_foto(self) -> Tuple[Optional[str], Optional[str]]:
        if not self.activa or not self.cap:
            return None, "La cámara no está activa."
        ret, frame = self.cap.read()
        if not ret:
            return None, "No se pudo capturar la imagen."
        ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        ruta = os.path.join(CAPTURAS_DIR, f"captura_{ts}.jpg")
        cv2.imwrite(ruta, frame)
        time.sleep(0.1)
        if not os.path.exists(ruta):
            return None, "Error guardando imagen."
        self._ultima_foto = ruta
        logger.info(f"Foto: {ruta}")
        return ruta, None

    def _ultima_captura(self) -> Optional[str]:
        if self._ultima_foto and os.path.exists(self._ultima_foto):
            return self._ultima_foto
        archivos = glob.glob(os.path.join(CAPTURAS_DIR, "captura_*.jpg"))
        if archivos:
            return max(archivos, key=os.path.getctime)
        return None

    def _imagen_a_b64(self, ruta: str) -> Optional[str]:
        try:
            with open(ruta, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        except OSError:
            return None

    def _llamar_llava(self, imagen_b64: str, pregunta: str) -> str:
        if not HAS_REQ:
            return "La librería 'requests' no está instalada."
        try:
            resp = _req.post(
                OLLAMA_URL,
                json={
                    "model": LLAVA_MODEL,
                    "prompt": f"Responde en español: {pregunta}",
                    "images": [imagen_b64],
                    "stream": False,
                },
                timeout=45,
            )
            if resp.status_code == 200:
                return resp.json().get("response", "").strip()
            return f"Error LLaVA HTTP {resp.status_code}"
        except Exception as exc:
            logger.error(f"LLaVA: {exc}")
            return f"Error: {exc}"

    # ── Descripciones ─────────────────────────────────────────────────────────
    def describir_ultima(self, pregunta: str = "Describe esta imagen con detalle.") -> str:
        ruta = self._ultima_captura()
        if not ruta:
            return "No hay fotos disponibles. Di 'activa la cámara' y 'toma una foto'."
        img_b64 = self._imagen_a_b64(ruta)
        if not img_b64:
            return "Error leyendo la imagen."
        return self._llamar_llava(img_b64, pregunta)

    def describir_foto(self, ruta: str, pregunta: str = "Describe esta imagen.") -> str:
        img_b64 = self._imagen_a_b64(ruta)
        if not img_b64:
            return "Error leyendo la imagen."
        return self._llamar_llava(img_b64, pregunta)

    # ── Escaneo de objeto para compras ────────────────────────────────────────
    def escanear_objeto_para_compra(self) -> Optional[str]:
        """
        Toma una foto, identifica el objeto principal y retorna
        una descripción/nombre del producto para buscar en tiendas.
        """
        # Verificar si hay cámara activa, si no, intentar iniciarla temporalmente
        inicio_temp = False
        if not self.activa:
            resultado = self.iniciar()
            if "correctamente" not in resultado:
                return None
            inicio_temp = True

        # Tomar foto
        ruta, error = self.tomar_foto()
        if error or not ruta:
            if inicio_temp:
                self.detener()
            return None

        # Identificar objeto
        img_b64 = self._imagen_a_b64(ruta)
        if not img_b64:
            if inicio_temp:
                self.detener()
            return None

        pregunta = (
            "¿Qué producto o objeto principal aparece en esta imagen? "
            "Responde con el nombre del producto de forma concisa y específica "
            "(máximo 10 palabras), como si fuera una búsqueda de Amazon. "
            "Ejemplo: 'auriculares inalámbricos Sony', 'camiseta azul de hombre', "
            "'zapatos deportivos Nike'. Solo el nombre del producto:"
        )
        descripcion = self._llamar_llava(img_b64, pregunta)

        if inicio_temp:
            self.detener()

        # Limpiar la respuesta
        if descripcion and len(descripcion) > 3:
            # Quitar prefijos de cortesía
            for prefijo in ["el objeto es", "el producto es", "se trata de", "es un", "es una", "veo"]:
                if descripcion.lower().startswith(prefijo):
                    descripcion = descripcion[len(prefijo):].strip()

            self._ultimo_objeto = descripcion.strip('."\'').strip()
            logger.info(f"Objeto identificado: {self._ultimo_objeto}")
            return self._ultimo_objeto
        return None

    def ultimo_objeto_identificado(self) -> Optional[str]:
        return self._ultimo_objeto

    # ── Procesar entrada del usuario ──────────────────────────────────────────
    def manejar(self, entrada: str) -> str:
        e = entrada.lower()

        if any(t in e for t in ["activa", "enciende", "inicia", "abre", "conecta"]) and "cámara" in e:
            return self.iniciar()

        if any(t in e for t in ["apaga", "cierra", "detén", "para", "desconecta"]) and "cámara" in e:
            return self.detener()

        if any(t in e for t in ["toma una foto", "captura", "fotografía", "saca foto"]):
            ruta, err = self.tomar_foto()
            return err or "Foto tomada. Di 'qué ves' para que la describa."

        if any(t in e for t in ["qué ves", "que ves", "describe", "qué hay", "analiza"]):
            return self.describir_ultima()

        if any(t in e for t in ["escanea", "identifica esto"]):
            obj = self.escanear_objeto_para_compra()
            if obj:
                return f"Identifiqué: **{obj}**. ¿Quieres que lo busque en Amazon, Temu u otra tienda?"
            return "No pude identificar el objeto. Asegúrate de que esté bien iluminado."

        return self.describir_ultima(entrada)


# ── Instancia global ──────────────────────────────────────────────────────────
_vision: Optional[AgenteVision] = None

def get_vision() -> AgenteVision:
    global _vision
    if _vision is None:
        _vision = AgenteVision()
    return _vision
