"""
agente_github.py — Agente AVANZADO de GitHub para Susan v3.
Busca repositorios, analiza código, clona proyectos y gestiona issues.
"""

import os, re, json, time, threading
from typing import Optional, List, Dict, Any
from logger import logger

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    from github import Github
    HAS_PYGithub = True
except ImportError:
    HAS_PYGithub = False


# ── Agente GitHub ─────────────────────────────────────────────────────────────
class AgenteGitHub:
    """
    Asistente avanzado para GitHub.
    Busca repositorios, analiza trending, clona proyectos y más.
    """

    def __init__(self, config: Dict):
        cfg = config.get("github", {})
        self.token = cfg.get("token", "")
        self.username = cfg.get("username", "")
        self._ultimos_resultados: List[Dict] = []
        
        if HAS_PYGithub and self.token:
            try:
                self.gh = Github(self.token)
                self.user = self.gh.get_user()
            except Exception as exc:
                logger.error(f"[GitHub] Error auth: {exc}")
                self.gh = None
                self.user = None
        else:
            self.gh = None
            self.user = None

    # ── Buscar repositorios ───────────────────────────────────────────────────
    def buscar_repos(self, consulta: str, limit: int = 10) -> str:
        """Busca repositorios en GitHub."""
        if not HAS_REQUESTS:
            return "⚠️ Instala requests: `pip install requests`"
        
        try:
            url = f"https://api.github.com/search/repositories?q={consulta}&sort=stars&order=desc&per_page={min(limit, 100)}"
            headers = {}
            if self.token:
                headers["Authorization"] = f"token {self.token}"
            
            response = requests.get(url, headers=headers, timeout=10)
            data = response.json()
            
            resultados = []
            for item in data.get("items", [])[:limit]:
                resultados.append({
                    "nombre": item["full_name"],
                    "descripcion": item["description"] or "Sin descripción",
                    "estrellas": item["stargazers_count"],
                    "forks": item["forks_count"],
                    "lenguaje": item["language"] or "N/A",
                    "url": item["html_url"],
                    "topics": item.get("topics", [])[:5]
                })
            
            self._ultimos_resultados = resultados
            return self._formatear_repos(resultados)
        except Exception as exc:
            logger.error(f"[GitHub] Buscar: {exc}")
            return f"Error buscando repositorios: {exc}"

    def _formatear_repos(self, repos: List[Dict]) -> str:
        """Formatea lista de repositorios."""
        if not repos:
            return "No se encontraron repositorios."
        
        lines = [f"🔍 **Encontrados {len(repos)} repositorios:**\n"]
        for i, repo in enumerate(repos[:7], 1):
            stars = f"{repo['estrellas']:,}" if repo['estrellas'] >= 1000 else str(repo['estrellas'])
            lines.append(f"{i}. **{repo['nombre']}** ⭐ {stars}")
            lines.append(f"   📝 {repo['descripcion'][:80]}")
            lines.append(f"   💻 {repo['lenguaje']} • 🔗 {repo['url']}\n")
        
        return "\n".join(lines)

    # ── Trending repositories ─────────────────────────────────────────────────
    def trending(self, lenguaje: str = None) -> str:
        """Obtiene repositorios trending de GitHub."""
        today = time.strftime("%Y-%m-%d")
        
        if lenguaje:
            return self.buscar_repos(f"language:{lenguaje} stars:>1000", 10)
        
        # Fallback: buscar repos populares generales
        return self.buscar_repos("stars:>10000", 10)

    # ── Información de repositorio ────────────────────────────────────────────
    def info_repo(self, repo_nombre: str) -> str:
        """Obtiene información detallada de un repositorio."""
        if not HAS_REQUESTS:
            return "⚠️ Instala requests."
        
        try:
            # Extraer owner/repo de URL o nombre completo
            match = re.search(r'github\.com/([^/]+/[^/]+)', repo_nombre)
            if match:
                repo_full = match.group(1)
            elif '/' in repo_nombre:
                repo_full = repo_nombre
            else:
                return "Proporciona el nombre completo (owner/repo) o URL del repositorio."
            
            url = f"https://api.github.com/repos/{repo_full}"
            headers = {"Authorization": f"token {self.token}"} if self.token else {}
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 404:
                return f"❌ Repositorio no encontrado: {repo_full}"
            
            data = response.json()
            
            info = (
                f"📦 **{data['full_name']}**\n\n"
                f"📝 {data['description'] or 'Sin descripción'}\n"
                f"⭐ Estrellas: {data['stargazers_count']:,}\n"
                f"🍴 Forks: {data['forks_count']:,}\n"
                f"👁️ Watchers: {data['watchers_count']:,}\n"
                f"💻 Lenguaje: {data['language'] or 'N/A'}\n"
                f"📅 Creado: {data['created_at'][:10]}\n"
                f"🔄 Última actualización: {data['updated_at'][:10]}\n"
                f"🏠 Homepage: {data['homepage'] or 'N/A'}\n"
                f"📄 Licencia: {data['license']['name'] if data.get('license') else 'N/A'}\n"
                f"🔗 {data['html_url']}"
            )
            return info
        except Exception as exc:
            logger.error(f"[GitHub] Info: {exc}")
            return f"Error: {exc}"

    # ── Clonar repositorio ────────────────────────────────────────────────────
    def clonar(self, repo_url: str, carpeta: str = None) -> str:
        """Clona un repositorio usando git."""
        carpeta = carpeta or os.path.join(os.getcwd(), "github_clones")
        os.makedirs(carpeta, exist_ok=True)
        
        try:
            # Extraer nombre del repo
            match = re.search(r'github\.com/([^/]+/[^/.]+)', repo_url)
            if not match:
                return "URL inválida. Usa formato: https://github.com/owner/repo"
            
            repo_name = match.group(1).replace('/', '_')
            ruta_destino = os.path.join(carpeta, repo_name)
            
            cmd = f'git clone "{repo_url}" "{ruta_destino}"'
            resultado = os.system(cmd)
            
            if resultado == 0:
                return f"✔ Repositorio clonado en:\n`{ruta_destino}`"
            else:
                return "❌ Error al clonar. Asegúrate de tener git instalado."
        except Exception as exc:
            logger.error(f"[GitHub] Clonar: {exc}")
            return f"Error: {exc}"

    # ── Mis repositorios ──────────────────────────────────────────────────────
    def mis_repos(self) -> str:
        """Lista los repositorios del usuario autenticado."""
        if not self.user:
            return "⚠️ No has configurado tu token de GitHub.\nConfigura `github.token` en config.json"
        
        try:
            repos = self.user.get_repos(type="owner", sort="updated", per_page=10)
            resultados = []
            
            for repo in repos:
                resultados.append({
                    "nombre": repo.full_name,
                    "descripcion": repo.description or "Sin descripción",
                    "estrellas": repo.stargazers_count,
                    "lenguaje": repo.language or "N/A",
                    "url": repo.html_url
                })
            
            return self._formatear_repos(resultados)
        except Exception as exc:
            logger.error(f"[GitHub] Mis repos: {exc}")
            return f"Error: {exc}"

    # ── Manejar entrada ───────────────────────────────────────────────────────
    def manejar(self, entrada: str, on_token=None) -> str:
        e = entrada.lower()
        import webbrowser

        # Buscar repositorios
        if any(t in e for t in ["busca en github", "buscar repo", "buscar repositorio",
                                 "github busca", "encuentra repositorio"]):
            consulta = re.sub(
                r'.*(busca|buscar|encuentra)\s+(en\s+)?(github\s+)?(repo(sitorio)?\s+)?(de\s+)?',
                '', e, flags=re.IGNORECASE
            ).strip()
            if not consulta:
                consulta = "python projects"
            return self.buscar_repos(consulta)

        # Trending
        if any(t in e for t in ["trending", "tendencias", "repos populares"]):
            match = re.search(r'(javascript|python|typescript|rust|go|java|cpp)', e)
            lenguaje = match.group(1) if match else None
            return self.trending(lenguaje)

        # Info de repositorio
        if any(t in e for t in ["info de repo", "información del repositorio", "datos del repo"]):
            match = re.search(r'(github\.com/[^/\s]+/[^/\s]+)', entrada)
            if match:
                return self.info_repo(match.group(1))
            # Intentar extraer owner/repo directamente
            match = re.search(r'(\w+/[\w\-]+)', e)
            if match and '/' in match.group(1):
                return self.info_repo(match.group(1))
            return "Proporciona una URL o nombre de repositorio (owner/repo)."

        # Clonar repositorio
        if any(t in e for t in ["clonar repo", "clonar repositorio", "haz clone", "git clone"]):
            match = re.search(r'(github\.com/[^/\s]+/[^/\s]+)', entrada)
            if match:
                url = f"https://{match.group(1)}"
                return self.clonar(url)
            return "Proporciona la URL del repositorio a clonar."

        # Mis repositorios
        if any(t in e for t in ["mis repos", "mis repositorios", "my repos"]):
            return self.mis_repos()

        # Abrir GitHub
        if "abrir github" in e:
            webbrowser.open("https://github.com")
            return "✔ Abriendo GitHub…"

        return "🐙 **Comandos de GitHub disponibles:**\n" \
               "• `busca en github [tema]` - Buscar repositorios\n" \
               "• `trending [lenguaje]` - Ver tendencias\n" \
               "• `info de repo [URL/owner/repo]` - Información del repo\n" \
               "• `clonar repo [URL]` - Clonar repositorio\n" \
               "• `mis repos` - Tus repositorios (requiere token)"


# ── Instancia global ──────────────────────────────────────────────────────────
_github: Optional[AgenteGitHub] = None

def get_github(config: Dict = None) -> AgenteGitHub:
    global _github
    if _github is None:
        _github = AgenteGitHub(config or {})
    return _github
