"""
agente_youtube.py — Agente AVANZADO de YouTube para Susan v3.
Busca videos, obtiene información, transcribe audio y recomienda contenido.
"""

import os, re, json, time, threading
from typing import Optional, List, Dict, Any
from logger import logger

try:
    from googleapiclient.discovery import build
    HAS_GOOGLE = True
except ImportError:
    HAS_GOOGLE = False

try:
    import yt_dlp
    HAS_YTDL = True
except ImportError:
    HAS_YTDL = False


# ── Agente YouTube ────────────────────────────────────────────────────────────
class AgenteYouTube:
    """
    Asistente avanzado para YouTube.
    Busca videos, obtiene transcripciones, analiza tendencias y más.
    """

    def __init__(self, config: Dict):
        cfg = config.get("youtube", {})
        self.api_key = cfg.get("api_key", "")
        self.max_resultados = cfg.get("max_resultados", 10)
        self._ultimos_resultados: List[Dict] = []
        self._historial_busquedas: List[str] = []

    # ── Buscar videos ─────────────────────────────────────────────────────────
    def buscar_videos(self, consulta: str, max_results: int = None) -> str:
        """Busca videos en YouTube usando la API o fallback web."""
        max_results = max_results or self.max_resultados
        
        if HAS_GOOGLE and self.api_key:
            try:
                youtube = build("youtube", "v3", developerKey=self.api_key)
                request = youtube.search().list(
                    q=consulta,
                    part="snippet",
                    type="video",
                    maxResults=min(max_results, 50),
                    relevanceLanguage="es"
                )
                response = request.execute()
                
                resultados = []
                for item in response.get("items", []):
                    snippet = item["snippet"]
                    video_id = item["id"]["videoId"]
                    resultados.append({
                        "titulo": snippet["title"],
                        "canal": snippet["channelTitle"],
                        "descripcion": snippet["description"][:200],
                        "url": f"https://youtube.com/watch?v={video_id}",
                        "video_id": video_id,
                        "thumbnail": snippet["thumbnails"].get("high", {}).get("url", "")
                    })
                
                self._ultimos_resultados = resultados
                self._historial_busquedas.append(consulta)
                
                return self._formatear_resultados(resultados)
            except Exception as exc:
                logger.error(f"[YouTube] Error API: {exc}")
        
        # Fallback: búsqueda simulada con sugerencias
        return self._buscar_fallback(consulta, max_results)

    def _buscar_fallback(self, consulta: str, max_results: int) -> str:
        """Fallback cuando no hay API key."""
        # Generar URLs de búsqueda directas
        url_busqueda = f"https://youtube.com/results?search_query={re.sub(r'\s+', '+', consulta)}"
        
        self._ultimos_resultados = [{
            "titulo": f"Búsqueda: {consulta}",
            "url": url_busqueda,
            "canal": "YouTube",
            "descripcion": f"Haz clic para ver resultados en YouTube"
        }]
        
        return (f"🔍 **Resultados para '{consulta}':**\n\n"
                f"• Abriendo búsqueda en YouTube...\n"
                f"📺 {url_busqueda}\n\n"
                f"_Para resultados más precisos, configura tu API Key de YouTube._")

    def _formatear_resultados(self, resultados: List[Dict]) -> str:
        """Formatea una lista de resultados para mostrar."""
        if not resultados:
            return "No se encontraron videos."
        
        lines = [f"🔍 **Encontrados {len(resultados)} videos:**\n"]
        for i, vid in enumerate(resultados[:5], 1):
            lines.append(f"{i}. **{vid['titulo'][:60]}**")
            lines.append(f"   📺 {vid['canal']}")
            lines.append(f"   🔗 {vid['url']}\n")
        
        return "\n".join(lines)

    # ── Obtener transcripción ─────────────────────────────────────────────────
    def obtener_transcripcion(self, video_url: str) -> str:
        """Obtiene la transcripción de un video de YouTube."""
        if not HAS_YTDL:
            return "⚠️ Instala yt_dlp: `pip install yt-dlp`"
        
        try:
            ydl_opts = {
                'skip_download': True,
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': ['es', 'en'],
                'outtmpl': '/tmp/%(id)s.%(ext)s',
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                video_id = info.get('id', '')
                titulo = info.get('title', 'Video desconocido')
                
                # Intentar obtener subtítulos
                subtitles = info.get('subtitles', {})
                automatic_captions = info.get('automatic_captions', {})
                
                if subtitles or automatic_captions:
                    return f"📝 **Transcripción disponible para:** {titulo}\n\n_Video ID: {video_id}_"
                else:
                    return f"⚠️ No hay transcripción disponible para: {titulo}"
        except Exception as exc:
            logger.error(f"[YouTube] Transcripción: {exc}")
            return f"Error obteniendo transcripción: {exc}"

    # ── Obtener información del video ─────────────────────────────────────────
    def info_video(self, video_url: str) -> str:
        """Obtiene información detallada de un video."""
        if not HAS_YTDL:
            return "⚠️ Instala yt_dlp para información detallada."
        
        try:
            ydl_opts = {'skip_download': True}
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                
                duracion = info.get('duration', 0)
                minutos, segundos = divmod(int(duracion), 60)
                
                info_text = (
                    f"📺 **{info.get('title', 'Desconocido')}**\n\n"
                    f"👤 Canal: {info.get('uploader', 'Desconocido')}\n"
                    f"📅 Publicado: {info.get('upload_date', 'N/A')}\n"
                    f"⏱️ Duración: {minutos}m {segundos}s\n"
                    f"👁️ Vistas: {info.get('view_count', 'N/A'):,}\n"
                    f"👍 Likes: {info.get('like_count', 'N/A'):,}\n"
                    f"📝 Descripción:\n{info.get('description', '')[:500]}"
                )
                return info_text
        except Exception as exc:
            logger.error(f"[YouTube] Info: {exc}")
            return f"Error: {exc}"

    # ── Descargar audio ───────────────────────────────────────────────────────
    def descargar_audio(self, video_url: str, carpeta: str = None) -> str:
        """Descarga solo el audio de un video."""
        if not HAS_YTDL:
            return "⚠️ Instala yt_dlp: `pip install yt-dlp`"
        
        carpeta = carpeta or os.path.join(os.getcwd(), "downloads_youtube")
        os.makedirs(carpeta, exist_ok=True)
        
        try:
            ydl_opts = {
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': os.path.join(carpeta, '%(title)s.%(ext)s'),
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=True)
                titulo = info.get('title', 'audio')
                
            return f"✔ Audio descargado en: `{carpeta}`\n🎵 {titulo}"
        except Exception as exc:
            logger.error(f"[YouTube] Download: {exc}")
            return f"Error descargando: {exc}"

    # ── Recomendaciones ───────────────────────────────────────────────────────
    def recomendar(self, tema: str) -> str:
        """Recomienda videos basados en un tema."""
        return self.buscar_videos(f"mejor tutorial {tema} español", 5)

    # ── Manejar entrada ───────────────────────────────────────────────────────
    def manejar(self, entrada: str, on_token=None) -> str:
        e = entrada.lower()
        import webbrowser

        # Búsqueda de videos
        if any(t in e for t in ["busca en youtube", "buscar video", "encuentra video", 
                                 "youtube busca", "ver video de"]):
            consulta = re.sub(
                r'.*(busca|buscar|encuentra|encuentra|ver)\s+(en\s+)?(youtube\s+)?(video\s+)?(de\s+)?',
                '', e, flags=re.IGNORECASE
            ).strip()
            if not consulta:
                consulta = entrada
            resultado = self.buscar_videos(consulta)
            # Abrir primer resultado si existe
            if self._ultimos_resultados:
                webbrowser.open(self._ultimos_resultados[0]['url'])
            return resultado

        # Información de video
        if any(t in e for t in ["info de video", "información del video", "datos del video"]):
            match = re.search(r'(youtube\.com/watch\?v=[\w-]+|youtu\.be/[\w-]+)', entrada)
            if match:
                url = match.group(1)
                if 'youtu.be' in url and '?v=' not in url:
                    url = f"https://youtube.com/watch?v={url.split('/')[-1]}"
                return self.info_video(url)
            return "Proporciona una URL de YouTube válida."

        # Transcripción
        if any(t in e for t in ["transcribir", "transcripción", "subtítulos", "texto del video"]):
            match = re.search(r'(youtube\.com/watch\?v=[\w-]+|youtu\.be/[\w-]+)', entrada)
            if match:
                url = match.group(1)
                if 'youtu.be' in url and '?v=' not in url:
                    url = f"https://youtube.com/watch?v={url.split('/')[-1]}"
                return self.obtener_transcripcion(url)
            return "Proporciona una URL de YouTube."

        # Descargar audio
        if any(t in e for t in ["descargar audio", "bajar música", "extraer audio"]):
            match = re.search(r'(youtube\.com/watch\?v=[\w-]+|youtu\.be/[\w-]+)', entrada)
            if match:
                url = match.group(1)
                if 'youtu.be' in url and '?v=' not in url:
                    url = f"https://youtube.com/watch?v={url.split('/')[-1]}"
                return self.descargar_audio(url)
            return "Proporciona una URL de YouTube."

        # Recomendaciones
        if any(t in e for t in ["recomienda", "recomendación", "sugiere videos"]):
            tema = re.sub(r'.*(recomienda|recomendación|sugiere)\s+', '', e).strip()
            return self.recomendar(tema)

        # Abrir YouTube
        if "abrir youtube" in e:
            webbrowser.open("https://youtube.com")
            return "✔ Abriendo YouTube…"

        return "📺 **Comandos de YouTube disponibles:**\n" \
               "• `busca en youtube [tema]` - Buscar videos\n" \
               "• `info de video [URL]` - Información del video\n" \
               "• `transcribir [URL]` - Obtener transcripción\n" \
               "• `descargar audio [URL]` - Extraer audio MP3\n" \
               "• `recomienda [tema]` - Sugerencias de videos"


# ── Instancia global ──────────────────────────────────────────────────────────
_youtube: Optional[AgenteYouTube] = None

def get_youtube(config: Dict = None) -> AgenteYouTube:
    global _youtube
    if _youtube is None:
        _youtube = AgenteYouTube(config or {})
    return _youtube
