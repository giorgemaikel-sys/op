"""
agente_claude.py — Integración con Claude AI para Susan v3.
Permite conectar con modelos de Anthropic para respuestas avanzadas.
"""

import os, re, json, time
from typing import Optional, Dict, Any, Callable
from logger import logger

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


# ── Agente Claude ─────────────────────────────────────────────────────────────
class AgenteClaude:
    """Conecta con Claude AI de Anthropic para respuestas avanzadas."""

    MODELOS = {
        "opus": "claude-3-opus-20240229",
        "sonnet": "claude-3-5-sonnet-20241022",
        "haiku": "claude-3-5-haiku-20241022"
    }

    def __init__(self, config: Dict = None):
        cfg = config.get("claude", {}) if config else {}
        self.api_key = cfg.get("api_key", "") or os.getenv("ANTHROPIC_API_KEY", "")
        self.modelo_defecto = cfg.get("modelo", "claude-3-5-sonnet-20241022")
        self.max_tokens = cfg.get("max_tokens", 2048)
        self._historial = []

    def _headers(self) -> Dict:
        return {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }

    def disponible(self) -> bool:
        return bool(self.api_key and self.api_key.startswith("sk-ant-"))

    def conversar(self, mensaje: str, modelo: str = None, system: str = None, historial: list = None) -> str:
        if not self.disponible():
            return ("No has configurado tu API key de Anthropic.\n\n"
                    "Para obtener una:\n"
                    "1. Ve a https://console.anthropic.com\n"
                    "2. Crea una cuenta o inicia sesión\n"
                    "3. Genera una API key en Settings > API Keys\n"
                    "4. Añádela al config.json: {claude: {api_key: sk-ant-...}}\n\n"
                    "O usa la variable de entorno: ANTHROPIC_API_KEY")

        if not HAS_REQUESTS:
            return "Instala requests: pip install requests"

        modelo_nombre = self.MODELOS.get(modelo.lower(), modelo) if modelo else self.modelo_defecto
        messages = (historial or []) + [{"role": "user", "content": mensaje}]

        payload = {"model": modelo_nombre, "max_tokens": self.max_tokens, "messages": messages}
        if system:
            payload["system"] = system

        try:
            logger.info(f"[Claude] Enviando a {modelo_nombre}")
            response = requests.post("https://api.anthropic.com/v1/messages", headers=self._headers(), json=payload, timeout=60)

            if response.status_code == 401:
                return "API key inválida."
            elif response.status_code == 429:
                return "Límite de rate alcanzado. Espera unos segundos."
            elif response.status_code >= 400:
                return f"Error {response.status_code}: {response.text[:200]}"

            data = response.json()
            contenido = data.get("content", [{}])[0].get("text", "Sin respuesta")
            self._historial.extend([{"role": "user", "content": mensaje}, {"role": "assistant", "content": contenido}])
            return contenido

        except requests.Timeout:
            return "La solicitud tardó demasiado."
        except Exception as exc:
            logger.error(f"[Claude] Error: {exc}")
            return f"Error: {exc}"

    def analizar_codigo(self, codigo: str, lenguaje: str = None) -> str:
        system = "Eres un experto programador que analiza código. Explica qué hace, bugs, y sugerencias de mejora."
        return self.conversar(f"Código:\n```{lenguaje or ''}\n{codigo}\n```", system=system, modelo="sonnet")

    def manejar(self, entrada: str, on_token=None) -> str:
        e = entrada.lower()

        if not self.disponible():
            return self.conversar("test")

        if any(t in e for t in ["pregunta a claude", "consulta claude", "usa claude", "habla con claude"]):
            mensaje = re.sub(r'.*(pregunta|consulta|usa|habla)\s+(a\s+)?claude\s*', '', e).strip()
            if not mensaje:
                mensaje = entrada.split("claude", 1)[1].strip() if "claude" in entrada else entrada
            return self.conversar(mensaje)

        if any(t in e for t in ["analiza este código", "analizar código"]):
            match = re.search(r'```[\w]*\n([\s\S]+?)```', entrada)
            if match:
                return self.analizar_codigo(match.group(1))
            return "Proporciona el código entre ``` bloques."

        if any(t in e for t in ["limpiar historial", "borrar conversación"]):
            self._historial = []
            return "Historial limpiado."

        return self.conversar(entrada)


# ── Instancia global ──────────────────────────────────────────────────────────
_claude: Optional[AgenteClaude] = None

def get_claude(config: Dict = None) -> AgenteClaude:
    global _claude
    if _claude is None:
        _claude = AgenteClaude(config or {})
    return _claude
