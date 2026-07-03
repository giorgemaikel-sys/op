"""
ui.py — Interfaz gráfica principal de Susan v3.
Diseño: Panel lateral con agentes + Núcleo animado central + Chat flotante.
Paleta: #07070f (fondo) · #00e5ff (cyan) · #7b2fff (violeta) · #ff2d78 (rosa)
"""

import os, sys, re, math, time, json, random, threading, tempfile, collections
import customtkinter as ctk
from tkinter import Canvas, END
import pygame
from PIL import Image, ImageDraw, ImageTk
import psutil
import pystray
import sounddevice as sd
import numpy as np
import edge_tts

from logger  import logger
from memoria import cargar_memoria_texto
import susan as SUSAN
import ia as IA
from voz import SistemaVoz, diagnosticar as diagnosticar_voz, hablar_offline

# ── Vosk (opcional) ──────────────────────────────────────────────────────────
try:
    import vosk; VOSK_OK = True
except ImportError:
    VOSK_OK = False

# ── Paleta ────────────────────────────────────────────────────────────────────
BG       = "#07070f"
PANEL    = "#0f0f1e"
CARD     = "#151528"
ENTRY_BG = "#0d0d1a"
CYAN     = "#00e5ff"
VIOLET   = "#7b2fff"
PINK     = "#ff2d78"
GREEN    = "#00ff9d"
AMBER    = "#ffd740"
TEXT     = "#e8eaf6"
DIM      = "#7986cb"
MUTED    = "#3d405b"
SUCCESS  = "#00e676"
ERROR    = "#ff1744"
FONT     = "Segoe UI"
MONO     = "Consolas"

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")


# ═════════════════════════════════════════════════════════════════════════════
class SusanUI(ctk.CTk):

    def __init__(self):
        super().__init__()
        logger.info("Iniciando Susan v3 UI")

        # ── Config ────────────────────────────────────────────────────────────
        self._cfg = self._load_cfg()
        self.configure(fg_color=BG)
        self.overrideredirect(True)
        w, h = self._cfg.get("ui", {}).get("window_w", 1280), \
               self._cfg.get("ui", {}).get("window_h", 780)
        sw, sh = self.winfo_screenwidth(), self.winfo_screenheight()
        self.geometry(f"{w}x{h}+{(sw-w)//2}+{(sh-h)//2}")
        self.title("Susan v3")

        # ── Estado ────────────────────────────────────────────────────────────
        self.tts_activo         = False
        self.escuchando         = False
        self.procesando         = False
        self.voz_habilitada     = True
        self.fullscreen         = False
        self.mic_level          = 0.0
        self.angulo             = 0.0
        self.particulas         = []
        self.viz_bars           = []
        self.log_queue          = collections.deque(maxlen=80)
        self.metrics            = {"cpu": 0.0, "ram": 0.0, "disk": 0.0}
        self.ollama_ok          = False
        self.ollama_modelo      = ""
        self._drag_x = self._drag_y = 0
        self._tts_level         = 0.0
        self._token_buffer      = ""

        pygame.mixer.init()
        SUSAN.configurar_alarma_auto(self._on_alarma)

        # ── Sistema de voz único (sin lag) ────────────────────────────────────
        self._voz = SistemaVoz(
            on_wakeword  = self._on_wakeword,
            on_comando   = self._on_comando_voz,
            on_mic_level = lambda lvl: setattr(self, "mic_level", lvl),
        )

        # ── UI ────────────────────────────────────────────────────────────────
        self._build_titlebar()
        self._build_body()

        # ── Bindings ──────────────────────────────────────────────────────────
        self.bind("<F11>",    lambda e: self._toggle_fullscreen())
        self.bind("<Escape>", lambda e: self._ocultar_bandeja())
        self.canvas.bind("<Configure>", self._on_resize)

        # ── Animación y hilos ─────────────────────────────────────────────────
        self._dibujar_nucleo()
        self._crear_particulas(60)
        self._crear_viz()
        self._animar()
        threading.Thread(target=self._loop_metricas, daemon=True).start()
        threading.Thread(target=self._saludar,        daemon=True).start()
        self._voz.iniciar()   # ← stream único, sin lag
        self._update_sidebar()
        self._crear_bandeja()
        self._set_icono()

    # ── Config ────────────────────────────────────────────────────────────────
    def _load_cfg(self) -> dict:
        try:
            p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    # ── Barra de título ───────────────────────────────────────────────────────
    def _build_titlebar(self):
        bar = ctk.CTkFrame(self, height=40, fg_color=PANEL, corner_radius=0)
        bar.pack(fill="x")
        bar.pack_propagate(False)

        for w in [bar]:
            w.bind("<Button-1>",       self._drag_start)
            w.bind("<B1-Motion>",      self._drag_move)
            w.bind("<ButtonRelease-1>",lambda e: None)

        lbl = ctk.CTkLabel(bar, text="◈  SUSAN  v3",
                           font=ctk.CTkFont(FONT, 14, "bold"), text_color=CYAN)
        lbl.pack(side="left", padx=14)
        for w in [lbl]:
            w.bind("<Button-1>", self._drag_start)
            w.bind("<B1-Motion>", self._drag_move)

        btn = dict(width=28, height=28, corner_radius=6,
                   fg_color="transparent", font=ctk.CTkFont(size=12))
        ctk.CTkButton(bar, text="✕", hover_color=ERROR, text_color=DIM,
                      command=self._ocultar_bandeja, **btn).pack(side="right", padx=4)
        ctk.CTkButton(bar, text="⛶", hover_color=CARD, text_color=DIM,
                      command=self._toggle_fullscreen, **btn).pack(side="right")
        ctk.CTkButton(bar, text="–", hover_color=CARD, text_color=DIM,
                      command=self._ocultar_bandeja, **btn).pack(side="right")

        self.status_dot = ctk.CTkLabel(bar, text="●", font=ctk.CTkFont(10), text_color=SUCCESS)
        self.status_dot.pack(side="right", padx=10)

        # Estado del motor de IA (Ollama)
        self.ollama_lbl = ctk.CTkLabel(bar, text="⬤ Ollama…",
                                       font=ctk.CTkFont(FONT, 9), text_color=DIM)
        self.ollama_lbl.pack(side="right", padx=6)

    # ── Cuerpo principal ──────────────────────────────────────────────────────
    def _build_body(self):
        body = ctk.CTkFrame(self, fg_color="transparent")
        body.pack(fill="both", expand=True)
        self._build_sidebar(body)
        self._build_main(body)

    # ── Sidebar ───────────────────────────────────────────────────────────────
    def _build_sidebar(self, parent):
        self.sidebar = ctk.CTkFrame(parent, width=270, fg_color=PANEL, corner_radius=0)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        scroll = ctk.CTkScrollableFrame(self.sidebar, fg_color="transparent",
                                        scrollbar_button_color=CARD)
        scroll.pack(fill="both", expand=True, padx=2)

        # Logo
        ctk.CTkLabel(scroll, text="SUSAN", text_color=CYAN,
                     font=ctk.CTkFont(FONT, 24, "bold")).pack(anchor="w", padx=14, pady=(14,0))
        ctk.CTkLabel(scroll, text="Asistente v3.0 · IA Local",
                     text_color=MUTED, font=ctk.CTkFont(FONT, 9)).pack(anchor="w", padx=14, pady=(0,8))
        self._sep(scroll)

        # Métricas
        self._slbl(scroll, "Sistema")
        mf = ctk.CTkFrame(scroll, fg_color=CARD, corner_radius=10)
        mf.pack(fill="x", padx=8, pady=4)
        self._met_widgets = {}
        for nombre, key, color in [("CPU", "cpu", CYAN), ("RAM", "ram", VIOLET), ("Disco", "disk", GREEN)]:
            row = ctk.CTkFrame(mf, fg_color="transparent")
            row.pack(fill="x", padx=10, pady=3)
            ctk.CTkLabel(row, text=nombre, width=38, font=ctk.CTkFont(10), text_color=DIM).pack(side="left")
            bar2 = ctk.CTkProgressBar(row, height=5, progress_color=color, fg_color=BG, corner_radius=3)
            bar2.set(0); bar2.pack(side="left", fill="x", expand=True, padx=4)
            lbl = ctk.CTkLabel(row, text="0%", width=30, font=ctk.CTkFont(MONO, 9), text_color=DIM)
            lbl.pack(side="right")
            self._met_widgets[key] = (bar2, lbl)
        ctk.CTkLabel(mf, text=f"Modelo: {self._cfg.get('ia',{}).get('modelo','qwen2.5:7b')}",
                     font=ctk.CTkFont(9), text_color=GREEN).pack(anchor="w", padx=10, pady=(2,8))
        self._sep(scroll)

        # Agentes
        self._slbl(scroll, "Agentes")
        AGENTES = [
            ("🛍️  Compras & Precios",  "compras",       CYAN,   self._abrir_compras),
            ("📧  Email",              "email",          VIOLET, self._abrir_email),
            ("🎮  Roblox Studio",      "roblox",         GREEN,  self._abrir_roblox),
            ("✈️   Viajes & Hoteles",   "viajes",         AMBER,  self._abrir_viajes),
            ("⚙️   Automatización",     "automatizacion", CYAN,   self._abrir_auto),
            ("📷  Visión",             "vision",         PINK,   self._abrir_vision),
            ("🖥️   OCR Pantalla",       "pantalla_ocr",   GREEN,  self._abrir_ocr),
            ("🌤️   Clima",             "clima",          CYAN,   self._abrir_clima),
            ("📰  Noticias",           "noticias",       AMBER,  self._abrir_noticias),
            ("🌐  Traductor",          "traductor",      VIOLET, self._abrir_traductor),
            ("⬡   Axiom (Código)",     "axiom",          GREEN,  self._abrir_axiom),
            ("✏️   Creativo",           "creativo",       PINK,   self._abrir_creativo),
        ]
        self._agente_btns = {}
        af = ctk.CTkFrame(scroll, fg_color=CARD, corner_radius=10)
        af.pack(fill="x", padx=8, pady=4)
        for texto, key, color, cmd in AGENTES:
            btn = ctk.CTkButton(
                af, text=texto, command=cmd, height=28, corner_radius=6,
                font=ctk.CTkFont(FONT, 10),
                fg_color=BG, hover_color=PANEL,
                text_color=color, border_color=color, border_width=1,
            )
            btn.pack(fill="x", padx=8, pady=2)
            self._agente_btns[key] = btn
        self._sep(scroll)

        # Consejo de Cerebros (x15)
        self._slbl(scroll, "Cerebro x15")
        cf = ctk.CTkFrame(scroll, fg_color=CARD, corner_radius=10)
        cf.pack(fill="x", padx=8, pady=4)
        ctk.CTkLabel(cf, text="🧠 Consejo de Cerebros", font=ctk.CTkFont(FONT, 10, "bold"),
                     text_color=VIOLET).pack(anchor="w", padx=10, pady=(8, 1))
        ctk.CTkLabel(cf, text="auto · profundo en preguntas difíciles",
                     font=ctk.CTkFont(FONT, 8), text_color=MUTED).pack(anchor="w", padx=10)
        modo_actual = self._cfg.get("cerebros", {}).get("modo", "auto")
        self.cerebros_seg = ctk.CTkSegmentedButton(
            cf, values=["auto", "siempre", "off"], command=self._set_modo_cerebros,
            fg_color=BG, selected_color=VIOLET, selected_hover_color="#5a00cc",
            text_color=TEXT, font=ctk.CTkFont(9))
        self.cerebros_seg.set(modo_actual)
        self.cerebros_seg.pack(fill="x", padx=10, pady=(4, 8))
        self._sep(scroll)

        # Laboratorio rápido
        self._slbl(scroll, "Laboratorio")
        lf = ctk.CTkFrame(scroll, fg_color=CARD, corner_radius=10)
        lf.pack(fill="x", padx=8, pady=4)
        lrow = ctk.CTkFrame(lf, fg_color="transparent")
        lrow.pack(fill="x", padx=8, pady=(8,2))
        self.lab_entry = ctk.CTkEntry(lrow, placeholder_text="Prueba…",
                                       font=ctk.CTkFont(10), fg_color=BG,
                                       text_color=CYAN, border_color=MUTED, corner_radius=5)
        self.lab_entry.pack(side="left", fill="x", expand=True)
        self.lab_entry.bind("<Return>", lambda e: self._lab_run())
        ctk.CTkButton(lrow, text="▶", width=26, height=26, corner_radius=5,
                      fg_color=VIOLET, hover_color="#5a00cc",
                      command=self._lab_run).pack(side="left", padx=(4,0))
        self.lab_out = ctk.CTkTextbox(lf, height=70, fg_color=BG, text_color=CYAN,
                                       font=ctk.CTkFont(MONO, 8), corner_radius=6, wrap="word")
        self.lab_out.pack(fill="x", padx=8, pady=(2,8))
        self._sep(scroll)

        # Log
        self._slbl(scroll, "Log")
        self.obs_text = ctk.CTkTextbox(scroll, height=90, fg_color=CARD, text_color=DIM,
                                        font=ctk.CTkFont(MONO, 8), wrap="word", corner_radius=8)
        self.obs_text.pack(fill="x", padx=8, pady=4)

    # ── Panel principal ───────────────────────────────────────────────────────
    def _build_main(self, parent):
        self.right = ctk.CTkFrame(parent, fg_color=BG, corner_radius=0)
        self.right.pack(side="right", fill="both", expand=True)

        # Indicador del Consejo de Cerebros (franja superior; oculta por defecto)
        self.consejo_lbl = ctk.CTkLabel(
            self.right, text="", font=ctk.CTkFont(FONT, 11, "bold"),
            text_color=VIOLET, fg_color=PANEL, anchor="w", height=26,
        )

        # Canvas animado
        self.canvas = Canvas(self.right, bg=BG, highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)

        self.update_idletasks()
        cw = self.right.winfo_width() or 900
        ch = self.right.winfo_height() or 650
        self.cx, self.cy, self.radius = cw // 2, ch // 2 - 60, 115

        # Chat
        self.chat_frame = ctk.CTkScrollableFrame(
            self.right, fg_color="transparent",
            scrollbar_button_color=CARD, height=210,
        )
        self.chat_frame.pack(side="bottom", fill="x", padx=16, pady=(0,2))

        # Barra de entrada
        self._build_input_bar()

    def _build_input_bar(self):
        bar = ctk.CTkFrame(self.right, fg_color=PANEL, corner_radius=18, height=58)
        bar.pack(side="bottom", fill="x", padx=18, pady=10)
        bar.pack_propagate(False)

        self.mic_btn = ctk.CTkButton(
            bar, text="🎙", width=38, height=38, corner_radius=12,
            fg_color=CARD, hover_color=VIOLET, font=ctk.CTkFont(16),
            text_color=DIM, command=self._toggle_mic,
        )
        self.mic_btn.pack(side="left", padx=(10,6), pady=10)

        self.entry = ctk.CTkEntry(
            bar, placeholder_text="Escribe o di «Susan»…",
            font=ctk.CTkFont(FONT, 13), fg_color="transparent",
            text_color=TEXT, placeholder_text_color=MUTED, border_width=0,
        )
        self.entry.pack(side="left", fill="x", expand=True, pady=10)
        self.entry.bind("<Return>", self._enviar)

        self.btn_send = ctk.CTkButton(
            bar, text="Enviar →", height=38, width=96, corner_radius=12,
            font=ctk.CTkFont(FONT, 12, "bold"),
            fg_color=VIOLET, hover_color="#5a00cc", text_color="white",
            command=self._enviar,
        )
        self.btn_send.pack(side="right", padx=(6,10), pady=10)

        # Chips de acciones rápidas
        chips_bar = ctk.CTkFrame(self.right, fg_color="transparent", height=26)
        chips_bar.pack(side="bottom", fill="x", padx=20, pady=(0,2))
        chips_bar.pack_propagate(False)
        for texto, cmd in [
            ("🛍 Buscar producto", lambda: self._set_entry("busca el precio de ")),
            ("📷 Escanear y buscar", lambda: self._enviar_cmd("escanea y busca el producto")),
            ("✈ Buscar hotel",   lambda: self._set_entry("busca hoteles en ")),
            ("📧 Ver email",     lambda: self._enviar_cmd("revisar email")),
            ("🌤 Clima",         lambda: self._set_entry("clima en ")),
            ("⬡ Nuevo proyecto", lambda: self._abrir_axiom()),
        ]:
            ctk.CTkButton(chips_bar, text=texto, height=22, width=0, corner_radius=6,
                          font=ctk.CTkFont(8), fg_color=CARD, hover_color=PANEL,
                          text_color=DIM, border_color=MUTED, border_width=1,
                          command=cmd).pack(side="left", padx=2)

    # ── Helpers sidebar ───────────────────────────────────────────────────────
    def _sep(self, p): ctk.CTkFrame(p, height=1, fg_color=MUTED, corner_radius=0).pack(fill="x", padx=10, pady=3)
    def _slbl(self, p, t): ctk.CTkLabel(p, text=t.upper(), font=ctk.CTkFont(FONT,8,"bold"), text_color=MUTED).pack(anchor="w", padx=14, pady=(8,2))

    # ── Núcleo animado ────────────────────────────────────────────────────────
    def _dibujar_nucleo(self):
        r, cx, cy = self.radius, self.cx, self.cy
        for off, col in [(55,"#060615"),(35,"#0a0a20"),(15,"#0f0f30")]:
            self.canvas.create_oval(cx-r-off,cy-r-off,cx+r+off,cy+r+off, outline=col,width=1,tags="nucleo")
        self.segs = []
        for i in range(20):
            arc = self.canvas.create_arc(cx-r,cy-r,cx+r,cy+r, start=i*18,extent=12,
                                          style="arc",outline=CYAN,width=2,tags="nucleo")
            self.segs.append(arc)
        self.canvas.create_oval(cx-r//2,cy-r//2,cx+r//2,cy+r//2,
                                 outline=VIOLET,width=1,dash=(4,6),tags="nucleo")
        self.canvas.create_oval(cx-r//3,cy-r//3,cx+r//3,cy+r//3,
                                 outline=PINK,width=1,dash=(3,8),tags="nucleo")
        for sz, col in [(18,"#001020"),(10,"#003060"),(4,CYAN)]:
            self.canvas.create_oval(cx-sz,cy-sz,cx+sz,cy+sz,fill=col,outline="",tags="nucleo")
        self.canvas.create_text(cx,cy+r+22,text="S U S A N",fill=CYAN,
                                 font=(FONT,14,"bold"),tags="nucleo")
        self.canvas.create_text(cx,cy+r+38,text="Asistente Virtual v3.0",fill=MUTED,
                                 font=(FONT,9),tags="nucleo")
        self.viz_y = cy + r + 65

    def _crear_particulas(self, n):
        for _ in range(n):
            ang   = random.uniform(0, 2*math.pi)
            radio = random.uniform(self.radius+6, self.radius+60)
            speed = random.uniform(0.005, 0.03)
            col   = random.choice([CYAN, VIOLET, PINK, GREEN, "#ffffff"])
            sz    = random.uniform(1.0, 2.8)
            x = self.cx + radio*math.cos(ang)
            y = self.cy + radio*math.sin(ang)
            item = self.canvas.create_oval(x-sz,y-sz,x+sz,y+sz,fill=col,outline="",tags="part")
            self.particulas.append({"ang":ang,"rad":radio,"spd":speed,"col":col,"sz":sz,"item":item})

    def _crear_viz(self):
        n, bw, gap = 48, 3, 5
        total = n*(bw+gap)-gap
        sx = self.cx - total//2
        self.viz_bars = []
        for i in range(n):
            x = sx + i*(bw+gap)
            rect = self.canvas.create_rectangle(x,self.viz_y,x+bw,self.viz_y,
                                                 fill=CYAN,outline="",tags="viz")
            self.viz_bars.append(rect)

    def _animar(self):
        if self.escuchando:           vel, col_arc, col_dot = 7.0, PINK, PINK
        elif self.procesando or self.tts_activo: vel, col_arc, col_dot = 5.0, VIOLET, VIOLET
        else:                         vel, col_arc, col_dot = 1.8, CYAN, CYAN

        self.angulo = (self.angulo + vel) % 360
        for i, arc in enumerate(self.segs):
            self.canvas.itemconfig(arc, start=(i*18+self.angulo)%360, outline=col_arc)

        pulse = 5 + 4*abs(math.sin(time.time()*2.5))
        cx, cy = self.cx, self.cy
        self.canvas.delete("pulse")
        self.canvas.create_oval(cx-pulse,cy-pulse,cx+pulse,cy+pulse,
                                 fill=col_dot,outline="",tags="pulse")

        for p in self.particulas:
            p["ang"] = (p["ang"]+p["spd"]) % (2*math.pi)
            x = cx + p["rad"]*math.cos(p["ang"])
            y = cy + p["rad"]*math.sin(p["ang"])
            s = p["sz"]
            self.canvas.coords(p["item"],x-s,y-s,x+s,y+s)

        # Visualizador
        t = time.time()
        if self.escuchando:   lvl, col = self.mic_level, PINK
        elif self.tts_activo: self._tts_level = (self._tts_level+0.05)%1.0; lvl, col = abs(math.sin(self._tts_level*math.pi)), VIOLET
        else:                 lvl, col = 0.04, MUTED
        mh = 48
        for i, rect in enumerate(self.viz_bars):
            h = max(2, lvl*mh*(0.3+0.7*abs(math.sin(i*0.35+t*3.5))))
            c = self.canvas.coords(rect)
            if len(c)==4:
                self.canvas.coords(rect, c[0], self.viz_y-h, c[2], self.viz_y)
            self.canvas.itemconfig(rect, fill=col)

        self.after(24, self._animar)

    def _on_resize(self, _=None):
        w, h = self.canvas.winfo_width(), self.canvas.winfo_height()
        if w < 10: return
        self.cx, self.cy = w//2, h//2-60
        self.canvas.delete("nucleo","part","viz","pulse")
        self.particulas.clear(); self.viz_bars.clear()
        self._dibujar_nucleo()
        self._crear_particulas(60)
        self._crear_viz()

    # ── Arrastre de ventana ───────────────────────────────────────────────────
    def _drag_start(self, e): self._drag_x, self._drag_y = e.x, e.y
    def _drag_move(self, e):
        self.geometry(f"+{self.winfo_pointerx()-self._drag_x}+{self.winfo_pointery()-self._drag_y}")

    # ── Fullscreen ────────────────────────────────────────────────────────────
    def _toggle_fullscreen(self):
        self.fullscreen = not self.fullscreen
        if self.fullscreen:
            self.overrideredirect(False); self.attributes("-fullscreen",True)
        else:
            self.attributes("-fullscreen",False); self.overrideredirect(True)
        self.after(100, self._on_resize)

    # ── Métricas ──────────────────────────────────────────────────────────────
    def _loop_metricas(self):
        ciclo = 0
        while True:
            try:
                self.metrics = {
                    "cpu":  psutil.cpu_percent(interval=1),
                    "ram":  psutil.virtual_memory().percent,
                    "disk": psutil.disk_usage("/").percent,
                }
            except Exception: pass
            # Estado de Ollama cada ~6 s (la consulta está cacheada en ia.py)
            if ciclo % 3 == 0:
                try:
                    mods = IA.modelos_disponibles()
                    self.ollama_ok = bool(mods)
                    self.ollama_modelo = IA.resolver_modelo("fast") if mods else ""
                except Exception:
                    self.ollama_ok = False
            ciclo += 1
            time.sleep(2)

    def _update_sidebar(self):
        if not self.winfo_exists(): return
        # Métricas
        for key, (bar2, lbl) in self._met_widgets.items():
            v = self.metrics.get(key, 0)
            bar2.set(v/100)
            col = SUCCESS if v < 60 else (AMBER if v < 85 else ERROR)
            bar2.configure(progress_color=col)
            lbl.configure(text=f"{v:.0f}%")
        # Estado de Ollama
        if hasattr(self, "ollama_lbl"):
            if self.ollama_ok:
                modelo = (self.ollama_modelo or "").split(":")[0]
                self.ollama_lbl.configure(text=f"⬤ Ollama · {modelo}", text_color=SUCCESS)
            else:
                self.ollama_lbl.configure(text="⬤ Ollama offline", text_color=ERROR)
        # Log
        if hasattr(self, "obs_text"):
            self.obs_text.configure(state="normal")
            self.obs_text.delete("1.0", END)
            for ln in list(self.log_queue)[-8:]:
                self.obs_text.insert(END, ln+"\n")
            self.obs_text.configure(state="disabled")
        self.after(1000, self._update_sidebar)

    def _log(self, msg: str):
        ts = time.strftime("%H:%M:%S")
        self.log_queue.append(f"[{ts}] {msg}")
        logger.info(msg)

    # ── Indicador del Consejo de Cerebros ─────────────────────────────────────
    def _set_consejo(self, txt: str):
        """Muestra/oculta la franja del Consejo de Cerebros encima del canvas."""
        if not hasattr(self, "consejo_lbl"):
            return
        if txt:
            self.consejo_lbl.configure(text=f"  {txt}")
            try:
                if not self.consejo_lbl.winfo_ismapped():
                    self.consejo_lbl.pack(side="top", fill="x", before=self.canvas)
            except Exception:
                pass
        else:
            self.consejo_lbl.configure(text="")
            try:
                self.consejo_lbl.pack_forget()
            except Exception:
                pass

    def _copiar_texto(self, texto: str):
        """Copia texto al portapapeles (botón ⧉ de las burbujas)."""
        texto = (texto or "").strip()
        if not texto:
            return
        try:
            import pyperclip
            pyperclip.copy(texto)
        except Exception:
            try:
                self.clipboard_clear(); self.clipboard_append(texto)
            except Exception:
                pass
        self._log("📋 Copiado al portapapeles")

    # ── TTS ───────────────────────────────────────────────────────────────────
    def _hablar(self, texto: str):
        if not self.voz_habilitada or not texto.strip():
            self.tts_activo = False; return
        texto = re.sub(r'[\*\#\_\`]', '', texto).strip()[:600]
        voz   = self._cfg.get("tts", {}).get("voz", "es-MX-DaliaNeural")
        ruta  = None
        exito = False
        self._voz.pausar()   # ← pausar mic mientras habla Susan
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as t:
                ruta = t.name
            comm = edge_tts.Communicate(texto, voz)
            comm.save_sync(ruta)
            pygame.mixer.music.load(ruta)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                time.sleep(0.1)
            pygame.mixer.music.stop()
            pygame.mixer.music.unload()
            exito = True
        except Exception as exc:
            logger.warning(f"TTS online (edge-tts) falló: {exc}. Probando voz offline…")
        finally:
            if ruta and os.path.exists(ruta):
                try: time.sleep(0.2); os.remove(ruta)
                except Exception: pass

        # Respaldo offline (voz de Windows) si edge-tts no funcionó, p. ej. sin internet
        if not exito:
            try:
                hablar_offline(texto)
            except Exception as exc:
                logger.error(f"TTS offline: {exc}")

        self.tts_activo = False
        self._voz.reanudar()   # ← volver a escuchar

    def _saludar(self):
        self.tts_activo = True
        self._hablar("Hola, soy Susan v3. ¿En qué puedo ayudarte hoy?")

    # ── Chat ──────────────────────────────────────────────────────────────────
    def _add_bubble(self, rol: str, texto: str):
        es_usr  = rol == "usuario"
        bg_col  = CARD if es_usr else PANEL
        txt_col = TEXT if es_usr else CYAN
        anchor_ = "e" if es_usr else "w"
        prefix  = "Tú" if es_usr else "Susan"

        row = ctk.CTkFrame(self.chat_frame, fg_color="transparent")
        row.pack(fill="x", pady=2, padx=4)

        buble = ctk.CTkFrame(row, fg_color=bg_col, corner_radius=14)
        buble.pack(anchor=anchor_, padx=4)

        ctk.CTkLabel(
            buble,
            text=f"{prefix}: {texto}",
            font=ctk.CTkFont(FONT, 11), text_color=txt_col,
            wraplength=440, justify="left",
        ).pack(padx=12, pady=(7,2))

        # Botón copiar (discreto)
        ctk.CTkButton(buble, text="⧉", width=20, height=16, corner_radius=4,
                      font=ctk.CTkFont(9), fg_color="transparent", hover_color=CARD,
                      text_color=MUTED, command=lambda t=texto: self._copiar_texto(t)
                      ).pack(anchor="e", padx=8, pady=(0,4))

        self.after(50, lambda: self.chat_frame._parent_canvas.yview_moveto(1.0))

    def _add_streaming_bubble(self) -> ctk.CTkLabel:
        """Crea una burbuja de Susan que se actualiza con los tokens."""
        row   = ctk.CTkFrame(self.chat_frame, fg_color="transparent")
        row.pack(fill="x", pady=2, padx=4)
        buble = ctk.CTkFrame(row, fg_color=PANEL, corner_radius=14)
        buble.pack(anchor="w", padx=4)
        lbl = ctk.CTkLabel(buble, text="Susan: …", font=ctk.CTkFont(FONT,11),
                           text_color=CYAN, wraplength=440, justify="left")
        lbl.pack(padx=12, pady=(7,2))
        ctk.CTkButton(buble, text="⧉ copiar", width=58, height=16, corner_radius=4,
                      font=ctk.CTkFont(8), fg_color="transparent", hover_color=CARD,
                      text_color=MUTED,
                      command=lambda: self._copiar_texto(
                          re.sub(r'^Susan:\s*', '', lbl.cget("text")))
                      ).pack(anchor="e", padx=8, pady=(0,5))
        self.after(50, lambda: self.chat_frame._parent_canvas.yview_moveto(1.0))
        return lbl

    # ── Envío de mensajes ─────────────────────────────────────────────────────
    def _set_entry(self, texto: str):
        self.entry.delete(0, END)
        self.entry.insert(0, texto)
        self.entry.focus_set()

    def _enviar_cmd(self, cmd: str):
        self.entry.delete(0, END)
        self.entry.insert(0, cmd)
        self._enviar()

    def _enviar(self, _=None):
        texto = self.entry.get().strip()
        if not texto or self.procesando: return
        self.entry.delete(0, END)
        self._add_bubble("usuario", texto)
        self._log(f"Usuario: {texto[:60]}")

        self.procesando = True
        self.status_dot.configure(text_color=AMBER)
        self.btn_send.configure(state="disabled", text="…")

        # Burbuja de respuesta con streaming
        lbl_respuesta = self._add_streaming_bubble()
        self._token_buffer = "Susan: "

        def _on_token(tok: str):
            self._token_buffer += tok
            buf = self._token_buffer
            self.after(0, lambda b=buf: lbl_respuesta.configure(text=b))
            self.after(0, lambda: self.chat_frame._parent_canvas.yview_moveto(1.0))

        def _on_progreso(msg: str):
            self.after(0, lambda: lbl_respuesta.configure(text=f"⏳ {msg}"))
            # Las etapas del Consejo de Cerebros van a su propia franja.
            if any(msg.startswith(p) for p in ("🧠", "🧭", "🔎", "🧩")):
                self.after(0, lambda m=msg: self._set_consejo(m))
            self._log(msg)

        def _on_cerebro(estado: str, nombre: str):
            etiqueta = {"inicio": f"🧠 {nombre} pensando…",
                        "fin":    f"✅ {nombre} listo",
                        "error":  f"⚠ {nombre} sin respuesta"}.get(estado, nombre)
            self.after(0, lambda e=etiqueta: self._set_consejo(e))

        def _on_resultado(tipo: str, contenido: str):
            if contenido:
                self.after(0, lambda: self._mostrar_resultado_creativo(tipo, contenido))

        def _run():
            try:
                respuesta = SUSAN.responder(
                    texto,
                    on_token    = _on_token,
                    on_progreso = _on_progreso,
                    on_resultado = _on_resultado,
                    on_alarma   = self._on_alarma,
                    on_cerebro  = _on_cerebro,
                )
            except Exception as exc:
                logger.error(f"Susan error: {exc}", exc_info=True)
                respuesta = "Lo siento, ocurrió un error. Inténtalo de nuevo."

            def _finalizar():
                # Actualizar burbuja con la respuesta completa
                lbl_respuesta.configure(text=f"Susan: {respuesta}")
                self.chat_frame._parent_canvas.yview_moveto(1.0)
                self._set_consejo("")   # ocultar franja de cerebros
                self.procesando = False
                self.btn_send.configure(state="normal", text="Enviar →")
                self.status_dot.configure(text_color=SUCCESS)
                self._log(f"Susan: {respuesta[:60]}…")
                # TTS
                if self.voz_habilitada:
                    self.tts_activo = True
                    threading.Thread(target=self._hablar, args=(respuesta,), daemon=True).start()

            self.after(0, _finalizar)

        threading.Thread(target=_run, daemon=True).start()

    # ── Laboratorio ───────────────────────────────────────────────────────────
    def _lab_run(self):
        cmd = self.lab_entry.get().strip()
        if not cmd: return
        self.lab_out.configure(state="normal")
        self.lab_out.insert(END, f"▶ {cmd}\n")
        self.lab_out.configure(state="disabled")
        self.lab_entry.delete(0, END)

        def _r():
            resp = SUSAN.responder(cmd)
            def _u():
                self.lab_out.configure(state="normal")
                self.lab_out.insert(END, f"  {resp[:200]}\n\n")
                self.lab_out.configure(state="disabled")
                self.lab_out.see(END)
            self.after(0, _u)
        threading.Thread(target=_r, daemon=True).start()

    # ── Modo del Consejo de Cerebros ──────────────────────────────────────────
    def _set_modo_cerebros(self, modo: str):
        """Cambia en caliente el modo del Consejo (auto/siempre/off)."""
        try:
            cer = SUSAN._cfg().setdefault("cerebros", {})
            cer["modo"]   = modo
            cer["activo"] = (modo != "off")
            self._cfg.setdefault("cerebros", {})["modo"]   = modo
            self._cfg["cerebros"]["activo"] = (modo != "off")
            self._log(f"🧠 Consejo de Cerebros → {modo}")
        except Exception as exc:
            logger.warning(f"No se pudo cambiar el modo de cerebros: {exc}")

    # ── Alarmas ───────────────────────────────────────────────────────────────
    def _on_alarma(self, mensaje: str):
        self.after(0, lambda: self._add_bubble("susan", mensaje))
        self.after(0, lambda: self._log(mensaje))
        if self.voz_habilitada:
            self.tts_activo = True
            threading.Thread(target=self._hablar, args=(mensaje,), daemon=True).start()

    # ── Botones de agentes ────────────────────────────────────────────────────
    def _abrir_compras(self):
        self._set_entry("busca el precio de ")
        self._log("Agente Compras activado")

    def _abrir_email(self):
        self._enviar_cmd("revisar email")

    def _abrir_roblox(self):
        win = self._popup("🎮  Roblox Studio", 700, 500)
        self._build_roblox_panel(win)

    def _abrir_viajes(self):
        self._set_entry("busca hoteles en ")
        self._log("Agente Viajes activado")

    def _abrir_auto(self):
        self._set_entry("recuérdame a las ")

    def _abrir_vision(self):
        self._enviar_cmd("activa la cámara")

    def _abrir_ocr(self):
        self._enviar_cmd("lee la pantalla")

    def _abrir_clima(self):
        self._set_entry("clima en ")

    def _abrir_noticias(self):
        self._enviar_cmd("noticias de tecnología")

    def _abrir_traductor(self):
        self._set_entry("traduce ")

    def _abrir_axiom(self):
        win = self._popup("⬡  Axiom v5 — Generador de Código", 900, 680)
        self._build_axiom_panel(win)

    def _abrir_creativo(self):
        win = self._popup("✏️  Agente Creativo", 700, 560)
        self._build_creativo_panel(win)

    # ── Popup genérico ────────────────────────────────────────────────────────
    def _popup(self, titulo: str, w: int, h: int) -> ctk.CTkToplevel:
        win = ctk.CTkToplevel(self)
        win.title(titulo)
        win.geometry(f"{w}x{h}")
        win.configure(fg_color=BG)
        win.transient(self)
        hdr = ctk.CTkFrame(win, height=40, fg_color=PANEL, corner_radius=0)
        hdr.pack(fill="x")
        ctk.CTkLabel(hdr, text=titulo, font=ctk.CTkFont(FONT,13,"bold"), text_color=CYAN).pack(side="left", padx=12, pady=8)
        ctk.CTkButton(hdr, text="✕", width=28, height=28, corner_radius=6,
                      fg_color="transparent", hover_color=ERROR, text_color=DIM,
                      command=win.destroy).pack(side="right", padx=8)
        return win

    # ── Panel Axiom ───────────────────────────────────────────────────────────
    def _build_axiom_panel(self, win):
        body = ctk.CTkFrame(win, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=14, pady=10)

        # Descripción
        ctk.CTkLabel(body, text="DESCRIPCIÓN DEL PROYECTO", font=ctk.CTkFont(FONT,9,"bold"), text_color=MUTED).pack(anchor="w")
        desc_box = ctk.CTkTextbox(body, height=70, fg_color=CARD, text_color=TEXT,
                                   font=ctk.CTkFont(FONT,11), corner_radius=8, wrap="word")
        desc_box.pack(fill="x", pady=4)

        # Opciones
        opt_row = ctk.CTkFrame(body, fg_color="transparent")
        opt_row.pack(fill="x", pady=4)
        ctk.CTkLabel(opt_row, text="Plantilla:", text_color=DIM, font=ctk.CTkFont(10)).pack(side="left")
        from agentes.agente_axiom import PLANTILLAS
        plantilla_var = ctk.StringVar(value="Python App")
        ctk.CTkOptionMenu(opt_row, values=list(PLANTILLAS.keys()), variable=plantilla_var,
                          fg_color=CARD, text_color=CYAN, button_color=VIOLET,
                          font=ctk.CTkFont(10), width=160).pack(side="left", padx=6)
        ctk.CTkLabel(opt_row, text="Mín. líneas:", text_color=DIM, font=ctk.CTkFont(10)).pack(side="left", padx=(10,0))
        lineas_var = ctk.StringVar(value="80")
        ctk.CTkEntry(opt_row, textvariable=lineas_var, width=50,
                     fg_color=CARD, text_color=CYAN, border_color=VIOLET).pack(side="left", padx=4)

        # Log
        ctk.CTkLabel(body, text="CONSOLA", font=ctk.CTkFont(FONT,9,"bold"), text_color=MUTED).pack(anchor="w", pady=(8,2))
        log_box = ctk.CTkTextbox(body, height=200, fg_color=CARD, text_color=GREEN,
                                  font=ctk.CTkFont(MONO,9), corner_radius=8, wrap="word")
        log_box.pack(fill="both", expand=True)

        def _log_axiom(msg: str):
            def _u():
                log_box.configure(state="normal")
                log_box.insert(END, msg+"\n")
                log_box.configure(state="disabled")
                log_box.see(END)
            win.after(0, _u)

        def _generar():
            desc = desc_box.get("1.0", END).strip()
            if not desc:
                _log_axiom("⚠ Escribe una descripción primero.")
                return
            try: lin = max(30, int(lineas_var.get()))
            except: lin = 80
            plnt = plantilla_var.get()
            btn_gen.configure(state="disabled", text="Generando…")

            def _run():
                from agentes.agente_axiom import get_axiom
                axiom = get_axiom(self._cfg)
                axiom.generar_proyecto(desc, plnt, lineas_min=lin, on_log=_log_axiom)
                win.after(0, lambda: btn_gen.configure(state="normal", text="⬡ Generar Proyecto"))

            threading.Thread(target=_run, daemon=True).start()

        # Botones
        btn_row = ctk.CTkFrame(body, fg_color="transparent")
        btn_row.pack(fill="x", pady=6)
        btn_gen = ctk.CTkButton(btn_row, text="⬡ Generar Proyecto", command=_generar,
                                 fg_color=GREEN, hover_color="#00cc7a", text_color=BG,
                                 height=36, corner_radius=8, font=ctk.CTkFont(FONT,12,"bold"))
        btn_gen.pack(side="left", fill="x", expand=True, padx=(0,4))

        def _guardar():
            from tkinter import filedialog
            d = filedialog.askdirectory(title="Carpeta destino")
            if d:
                from agentes.agente_axiom import get_axiom
                msg = get_axiom().guardar(d)
                _log_axiom(msg)

        ctk.CTkButton(btn_row, text="💾 Guardar", command=_guardar,
                      fg_color=CARD, text_color=CYAN, border_color=CYAN, border_width=1,
                      height=36, corner_radius=8).pack(side="left")

    # ── Panel Creativo ────────────────────────────────────────────────────────
    def _build_creativo_panel(self, win):
        body = ctk.CTkScrollableFrame(win, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=14, pady=10)

        ctk.CTkLabel(body, text="TIPO", font=ctk.CTkFont(FONT,9,"bold"), text_color=MUTED).pack(anchor="w")
        from agentes.agente_creativo import TIPOS_CONTENIDO, TONOS
        tipo_var = ctk.StringVar(value="historia")
        tipo_row = ctk.CTkFrame(body, fg_color=CARD, corner_radius=8)
        tipo_row.pack(fill="x", pady=4)
        for t in TIPOS_CONTENIDO:
            ctk.CTkRadioButton(tipo_row, text=t.title(), variable=tipo_var, value=t,
                               fg_color=VIOLET, text_color=TEXT, font=ctk.CTkFont(10)
                               ).pack(side="left", padx=6, pady=6)

        ctk.CTkLabel(body, text="TONO", font=ctk.CTkFont(FONT,9,"bold"), text_color=MUTED).pack(anchor="w", pady=(6,0))
        tono_var = ctk.StringVar(value="Directo")
        tono_row = ctk.CTkFrame(body, fg_color=CARD, corner_radius=8)
        tono_row.pack(fill="x", pady=4)
        for t in TONOS:
            ctk.CTkRadioButton(tono_row, text=t, variable=tono_var, value=t,
                               fg_color=PINK, text_color=TEXT, font=ctk.CTkFont(10)
                               ).pack(side="left", padx=6, pady=6)

        ctk.CTkLabel(body, text="TEMA", font=ctk.CTkFont(FONT,9,"bold"), text_color=MUTED).pack(anchor="w", pady=(6,0))
        tema_box = ctk.CTkTextbox(body, height=70, fg_color=CARD, text_color=TEXT,
                                   font=ctk.CTkFont(FONT,11), corner_radius=8, wrap="word")
        tema_box.pack(fill="x", pady=4)

        ctk.CTkLabel(body, text="RESULTADO", font=ctk.CTkFont(FONT,9,"bold"), text_color=MUTED).pack(anchor="w", pady=(6,0))
        result_box = ctk.CTkTextbox(body, height=200, fg_color=CARD, text_color=TEXT,
                                     font=ctk.CTkFont(MONO,10), corner_radius=8, wrap="word")
        result_box.pack(fill="both", expand=True, pady=4)

        status_lbl = ctk.CTkLabel(body, text="", font=ctk.CTkFont(9), text_color=DIM)
        status_lbl.pack(anchor="w")

        def _generar():
            tema = tema_box.get("1.0", END).strip()
            if not tema:
                status_lbl.configure(text="⚠ Escribe un tema primero.")
                return
            btn_gen.configure(state="disabled", text="Generando…")
            result_box.configure(state="normal")
            result_box.delete("1.0", END)
            result_box.configure(state="disabled")

            def _on_prog(msg): win.after(0, lambda: status_lbl.configure(text=msg))

            def _on_result(tipo, contenido):
                def _u():
                    result_box.configure(state="normal")
                    result_box.delete("1.0", END)
                    result_box.insert("1.0", contenido)
                    result_box.configure(state="disabled")
                    btn_gen.configure(state="normal", text="✏️ Generar")
                    status_lbl.configure(text="✔ Contenido listo.")
                win.after(0, _u)

            from agentes.agente_creativo import get_creativo
            creativo = get_creativo(self._cfg)
            def _run():
                creativo.pipeline_completo(tema, tipo_var.get(), tono_var.get(),
                                            on_progreso=_on_prog)
                _on_result(tipo_var.get(), creativo.ultimo_contenido)
            threading.Thread(target=_run, daemon=True).start()

        btn_row = ctk.CTkFrame(body, fg_color="transparent")
        btn_row.pack(fill="x", pady=6)
        btn_gen = ctk.CTkButton(btn_row, text="✏️ Generar", command=_generar,
                                 fg_color=PINK, hover_color="#cc1155", text_color="white",
                                 height=34, corner_radius=8, font=ctk.CTkFont(FONT,12,"bold"))
        btn_gen.pack(side="left", fill="x", expand=True, padx=(0,4))

        def _guardar_cont():
            from agentes.agente_creativo import get_creativo
            msg = get_creativo().guardar()
            status_lbl.configure(text=msg)

        def _copiar_cont():
            from agentes.agente_creativo import get_creativo
            msg = get_creativo().copiar_portapapeles()
            status_lbl.configure(text=msg)

        ctk.CTkButton(btn_row, text="💾 Guardar", command=_guardar_cont,
                      fg_color=CARD, text_color=GREEN, border_color=GREEN, border_width=1,
                      height=34, corner_radius=8).pack(side="left", padx=2)
        ctk.CTkButton(btn_row, text="📋 Copiar", command=_copiar_cont,
                      fg_color=CARD, text_color=CYAN, border_color=CYAN, border_width=1,
                      height=34, corner_radius=8).pack(side="left")

    def _mostrar_resultado_creativo(self, tipo: str, contenido: str):
        win = self._popup(f"✏️ {tipo.title()} — Resultado", 600, 450)
        box = ctk.CTkTextbox(win, fg_color=CARD, text_color=TEXT,
                              font=ctk.CTkFont(MONO,11), wrap="word", corner_radius=8)
        box.pack(fill="both", expand=True, padx=14, pady=10)
        box.insert("1.0", contenido)
        box.configure(state="disabled")

    # ── Reconocimiento de voz ─────────────────────────────────────────────────
    def _toggle_mic(self):
        if self.escuchando:
            self._voz.desactivar()
            self.escuchando = False
            self.mic_btn.configure(text_color=DIM)
        else:
            self._voz.activar_manualmente()
            # on_wakeword callback se encarga del resto

    # ── Callbacks del sistema de voz unificado ───────────────────────────────
    def _on_wakeword(self):
        """Llamado cuando se detecta 'Susan' — sin reiniciar stream."""
        def _ui():
            self.escuchando = True
            self.mic_btn.configure(text_color=PINK)
        self.after(0, _ui)

    def _on_comando_voz(self, texto: str):
        """Llamado con el texto del comando transcrito."""
        def _ui():
            self.escuchando = False
            self.mic_btn.configure(text_color=DIM)
            self.mic_level = 0.0
            self.entry.delete(0, END)
            self.entry.insert(0, texto)
            self._enviar()
        self.after(0, _ui)

    # ── Bandeja del sistema ───────────────────────────────────────────────────
    def _crear_bandeja(self):
        img  = Image.new("RGBA", (64,64),(0,0,0,0))
        d    = ImageDraw.Draw(img)
        d.ellipse((4,4,60,60), fill="#00e5ff", outline="#007799")
        d.text((20,16),"S3", fill="black")
        menu = pystray.Menu(
            pystray.MenuItem("Mostrar", self._mostrar, default=True),
            pystray.MenuItem("Salir",   self._salir),
        )
        self.tray = pystray.Icon("SusanV3", img, "Susan v3", menu)
        threading.Thread(target=self.tray.run, daemon=True).start()

    def _set_icono(self):
        img = Image.new("RGBA",(64,64),(0,0,0,0))
        d   = ImageDraw.Draw(img)
        d.ellipse((4,4,60,60),fill="#00e5ff",outline="#007799")
        d.text((20,16),"S3",fill="black")
        self._ico = ImageTk.PhotoImage(img)
        try: self.iconphoto(True, self._ico)
        except Exception: pass

    def _mostrar(self, *_):     self.after(0, self.deiconify); self.after(0, self.lift)
    def _ocultar_bandeja(self): self.withdraw(); self._log("Minimizada a bandeja")
    def _salir(self, *_):       self.tray.stop(); self.destroy()

    def _on_close(self): self._salir()


# ── Punto de entrada ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = SusanUI()
    app.mainloop()
