"""
agente_roblox.py — Integración con Roblox Studio para Susan v3.
Abre Studio, genera scripts Luau con IA, los inserta automáticamente
y asiste al usuario mientras programa en Roblox.
"""

import os, re, subprocess, time, threading, webbrowser
import pyperclip
import pyautogui
from typing import Optional, List, Tuple, Dict
from logger import logger

try:
    import customtkinter as ctk
    from tkinter import END
    HAS_CTK = True
except ImportError:
    HAS_CTK = False


# ── Generación de código Luau ─────────────────────────────────────────────────
SYSTEM_LUAU = """Eres un experto programador de Roblox con dominio avanzado de Luau.
Reglas:
1. Escribe código Luau limpio, eficiente y bien comentado.
2. Usa servicios de Roblox correctamente (game:GetService, RunService, Players, etc).
3. Distingue entre LocalScript (cliente) y Script/ModuleScript (servidor).
4. Sigue las mejores prácticas: no usar deprecated APIs, manejar errores con pcall.
5. Devuelve SOLO el código Luau sin explicaciones adicionales, dentro de ```luau bloques.
6. El código debe ser funcional y completo, listo para copiar en Roblox Studio."""


PLANTILLAS_LUAU: Dict[str, str] = {
    "movimiento_basico": """-- Sistema de movimiento básico para el personaje
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local rootPart = character:WaitForChild("HumanoidRootPart")

-- Velocidad base del personaje
humanoid.WalkSpeed = 16
humanoid.JumpPower = 50

-- Control de movimiento
RunService.RenderStepped:Connect(function(dt)
    -- Detectar teclas
    if UserInputService:IsKeyDown(Enum.KeyCode.LeftShift) then
        humanoid.WalkSpeed = 32 -- Sprint
    else
        humanoid.WalkSpeed = 16 -- Normal
    end
end)""",

    "gui_basica": """-- GUI básica con botón
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Crear ScreenGui
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "MiGui"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Frame principal
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 200, 0, 100)
frame.Position = UDim2.new(0.5, -100, 0.5, -50)
frame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
frame.BorderSizePixel = 0
frame.Parent = screenGui

-- Borde redondeado
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 8)
corner.Parent = frame

-- Botón
local button = Instance.new("TextButton")
button.Size = UDim2.new(0.8, 0, 0, 36)
button.Position = UDim2.new(0.1, 0, 0.5, -18)
button.BackgroundColor3 = Color3.fromRGB(0, 150, 255)
button.Text = "¡Haz clic!"
button.TextColor3 = Color3.new(1, 1, 1)
button.TextSize = 16
button.Parent = frame

local btnCorner = Instance.new("UICorner")
btnCorner.CornerRadius = UDim.new(0, 6)
btnCorner.Parent = button

button.MouseButton1Click:Connect(function()
    print("Botón presionado!")
    button.Text = "¡Clickeado!"
end)""",

    "datastore": """-- Sistema de guardado con DataStore
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local playerData = DataStoreService:GetDataStore("PlayerData_v1")

local DEFAULT_DATA = {
    coins = 0,
    level = 1,
    xp = 0,
    items = {}
}

local function cargarDatos(player)
    local userId = player.UserId
    local success, data = pcall(function()
        return playerData:GetAsync(userId)
    end)
    
    if success then
        return data or DEFAULT_DATA
    else
        warn("Error cargando datos de " .. player.Name .. ": " .. tostring(data))
        return DEFAULT_DATA
    end
end

local function guardarDatos(player, data)
    local userId = player.UserId
    local success, err = pcall(function()
        playerData:SetAsync(userId, data)
    end)
    
    if not success then
        warn("Error guardando datos de " .. player.Name .. ": " .. tostring(err))
    end
end

-- Cuando el jugador entra
Players.PlayerAdded:Connect(function(player)
    local data = cargarDatos(player)
    print(player.Name .. " cargado. Monedas: " .. data.coins)
    -- Aquí puedes aplicar los datos al personaje
end)

-- Cuando el jugador sale
Players.PlayerRemoving:Connect(function(player)
    -- Aquí guarda los datos actuales del jugador
    local data = DEFAULT_DATA -- Reemplaza con los datos reales
    guardarDatos(player, data)
end)""",

    "sistema_puntos": """-- Sistema de puntos/monedas con GUI
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- RemoteEvent para actualizar puntos (crea en ReplicatedStorage)
local actualizarPuntos = ReplicatedStorage:FindFirstChild("ActualizarPuntos")
    or Instance.new("RemoteEvent", ReplicatedStorage)
actualizarPuntos.Name = "ActualizarPuntos"

-- Tabla de puntos de jugadores
local puntosJugadores = {}

Players.PlayerAdded:Connect(function(player)
    puntosJugadores[player] = 0
    
    -- Dar puntos cada 10 segundos
    task.spawn(function()
        while player.Parent do
            task.wait(10)
            if puntosJugadores[player] then
                puntosJugadores[player] += 5
                actualizarPuntos:FireClient(player, puntosJugadores[player])
            end
        end
    end)
end)

Players.PlayerRemoving:Connect(function(player)
    puntosJugadores[player] = nil
end)

-- Función para dar puntos manualmente
local function darPuntos(player, cantidad)
    if puntosJugadores[player] then
        puntosJugadores[player] += cantidad
        actualizarPuntos:FireClient(player, puntosJugadores[player])
    end
end""",
}


# ── Agente Roblox ─────────────────────────────────────────────────────────────
class AgenteRoblox:
    """
    Asistente de programación para Roblox Studio.
    Genera código Luau, lo inserta en Studio y ayuda a depurar scripts.
    """

    def __init__(self, config: Dict):
        cfg = config.get("roblox", {})
        self.ruta_studio = os.path.expandvars(
            cfg.get("ruta_studio", r"%LOCALAPPDATA%\Roblox\Studio\RobloxStudioBeta.exe")
        )
        self.auto_insertar = cfg.get("auto_insertar", True)
        self._ultimo_script: str = ""
        self._historial: List[Dict] = []

    # ── Abrir Studio ──────────────────────────────────────────────────────────
    def abrir_studio(self) -> str:
        rutas_alternativas = [
            self.ruta_studio,
            os.path.expandvars(r"%LOCALAPPDATA%\Roblox\Studio\RobloxStudioBeta.exe"),
            os.path.expandvars(r"%PROGRAMFILES(X86)%\Roblox\Studio\RobloxStudioBeta.exe"),
            r"C:\Program Files (x86)\Roblox\Studio\RobloxStudioBeta.exe",
        ]
        for ruta in rutas_alternativas:
            if os.path.isfile(ruta):
                try:
                    subprocess.Popen([ruta])
                    logger.info(f"[Roblox] Studio abierto: {ruta}")
                    return "✔ Abriendo Roblox Studio…"
                except Exception as exc:
                    logger.error(f"[Roblox] Error abriendo Studio: {exc}")

        # Intentar abrir por protocolo
        try:
            os.startfile("roblox-studio:")
            return "✔ Abriendo Roblox Studio…"
        except Exception:
            pass

        return ("✗ No encontré Roblox Studio instalado.\n"
                "Descárgalo en https://www.roblox.com/create")

    # ── Generación de código Luau ─────────────────────────────────────────────
    def generar_script(
        self,
        descripcion: str,
        tipo: str = "Script",
        on_token=None,
    ) -> str:
        """
        Genera un script Luau con IA.
        tipo: 'Script' | 'LocalScript' | 'ModuleScript'
        """
        from ia import llamar_ollama_stream, _cfg

        modelo = _cfg().get("modelo_codigo", "qwen2.5:7b")

        prompt = (
            f"Crea un {tipo} de Roblox en Luau para: {descripcion}\n\n"
            f"Tipo: {tipo}\n"
            f"Responde SOLO con el código Luau dentro de un bloque ```luau"
        )

        logger.info(f"[Roblox] Generando {tipo}: {descripcion[:60]}")
        respuesta = llamar_ollama_stream(
            prompt, modelo=modelo, system=SYSTEM_LUAU, on_token=on_token
        )

        # Extraer código del bloque
        codigo = self._extraer_codigo_luau(respuesta)
        if not codigo:
            codigo = respuesta  # Fallback: usar respuesta completa

        self._ultimo_script = codigo
        self._historial.append({
            "descripcion": descripcion,
            "tipo": tipo,
            "codigo": codigo,
        })
        return codigo

    def _extraer_codigo_luau(self, texto: str) -> str:
        """Extrae el código de bloques ```luau o ``` """
        for patron in [r"```luau\s*\n([\s\S]+?)```", r"```\s*\n([\s\S]+?)```"]:
            m = re.search(patron, texto, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return texto.strip()

    def usar_plantilla(self, nombre: str) -> str:
        """Usa una plantilla predefinida de código Luau."""
        codigo = PLANTILLAS_LUAU.get(nombre.lower().replace(" ", "_"), "")
        if codigo:
            self._ultimo_script = codigo
            return codigo
        nombres = ", ".join(PLANTILLAS_LUAU.keys())
        return f"Plantilla no encontrada. Disponibles: {nombres}"

    # ── Insertar en Studio ────────────────────────────────────────────────────
    def insertar_en_studio(self, codigo: str = "") -> str:
        """
        Inserta el código en Roblox Studio via portapapeles.
        El usuario debe tener el Script Editor abierto.
        """
        codigo = codigo or self._ultimo_script
        if not codigo:
            return "No hay código para insertar."

        try:
            pyperclip.copy(codigo)
            time.sleep(0.3)

            # Intentar encontrar ventana de Studio
            import pygetwindow as gw
            ventanas = gw.getWindowsWithTitle("Roblox Studio")
            if not ventanas:
                ventanas = [w for w in gw.getAllWindows()
                           if "roblox" in w.title.lower() and w.visible]

            if ventanas:
                ventanas[0].activate()
                time.sleep(0.5)
                # Seleccionar todo y pegar
                pyautogui.hotkey("ctrl", "a")
                time.sleep(0.1)
                pyautogui.hotkey("ctrl", "v")
                logger.info("[Roblox] Código insertado en Studio")
                return (
                    "✔ Código copiado al portapapeles e insertado en Studio.\n"
                    "Si no se insertó, haz clic en el Script Editor y presiona Ctrl+V."
                )
            else:
                return (
                    "✔ Código copiado al portapapeles.\n"
                    "Abre el Script Editor en Studio y presiona **Ctrl+V** para insertarlo."
                )
        except Exception as exc:
            logger.error(f"[Roblox] insertar: {exc}")
            pyperclip.copy(codigo)
            return "✔ Código copiado al portapapeles. Pégalo con Ctrl+V en Studio."

    # ── Depuración con IA ─────────────────────────────────────────────────────
    def depurar_error(self, error: str, codigo: str = "") -> str:
        """Analiza un error de Roblox y sugiere la solución."""
        from ia import llamar_ollama_stream, _cfg
        modelo = _cfg().get("modelo_codigo", "qwen2.5:7b")

        ctx_codigo = f"\nCódigo:\n```luau\n{codigo[:800]}\n```" if codigo else ""

        prompt = (
            f"Error en Roblox Studio:\n{error}\n"
            f"{ctx_codigo}\n\n"
            f"Explica el error y proporciona el código corregido en Luau."
        )
        return llamar_ollama_stream(prompt, modelo=modelo, system=SYSTEM_LUAU)

    # ── Abrir documentación ───────────────────────────────────────────────────
    def abrir_docs(self, tema: str = "") -> str:
        if tema:
            url = f"https://create.roblox.com/docs/search?q={tema.replace(' ', '+')}"
        else:
            url = "https://create.roblox.com/docs"
        webbrowser.open(url)
        return f"✔ Abriendo documentación de Roblox{(' sobre ' + tema) if tema else ''}…"

    # ── Manejar entrada ───────────────────────────────────────────────────────
    def manejar(self, entrada: str, on_token=None) -> str:
        e = entrada.lower()

        # Abrir Studio
        if any(t in e for t in ["abrir studio", "abre studio", "abre roblox studio",
                                  "iniciar studio", "abrir roblox"]):
            return self.abrir_studio()

        # Insertar código
        if any(t in e for t in ["inserta el código", "insertar código", "pegar en studio",
                                  "insertar en studio", "pega el código"]):
            return self.insertar_en_studio()

        # Depurar error
        if any(t in e for t in ["error", "bug", "falla", "no funciona", "depurar"]):
            # El error viene en la entrada
            codigo_extra = self._ultimo_script
            return self.depurar_error(entrada, codigo_extra)

        # Usar plantilla
        for nombre_plantilla in PLANTILLAS_LUAU.keys():
            if nombre_plantilla.replace("_", " ") in e:
                codigo = self.usar_plantilla(nombre_plantilla)
                if self.auto_insertar:
                    self.insertar_en_studio(codigo)
                return f"✔ Plantilla **{nombre_plantilla}** lista:\n\n```luau\n{codigo[:600]}\n```"

        # Documentación
        if any(t in e for t in ["documentación", "docs", "ayuda de roblox", "cómo funciona"]):
            tema = re.sub(r'.*(documentación|docs|ayuda de roblox|cómo funciona)\s*', '', e).strip()
            return self.abrir_docs(tema)

        # Determinar tipo de script
        tipo = "LocalScript"
        if any(t in e for t in ["script del servidor", "server script", "script normal"]):
            tipo = "Script"
        elif any(t in e for t in ["module", "módulo"]):
            tipo = "ModuleScript"

        # Generar script personalizado
        descripcion = re.sub(
            r'.*(crea|genera|haz|escribe|programa)\s+(un\s+)?(script|luau|código)?\s*(de|para|que|en)?\s*',
            '', e, flags=re.IGNORECASE
        ).strip()

        if not descripcion:
            descripcion = entrada  # Usar toda la entrada como descripción

        codigo = self.generar_script(descripcion, tipo, on_token=on_token)

        respuesta = (
            f"🎮 **Script Roblox ({tipo}) generado:**\n\n"
            f"```luau\n{codigo[:1200]}{'…' if len(codigo) > 1200 else ''}\n```\n\n"
        )
        if self.auto_insertar:
            res_insert = self.insertar_en_studio(codigo)
            respuesta += f"\n{res_insert}"
        else:
            respuesta += "Di **'inserta el código'** para pegarlo en Studio."

        return respuesta

    def ultimo_script(self) -> str:
        return self._ultimo_script

    def historial(self) -> List[Dict]:
        return self._historial


# ── Instancia global ──────────────────────────────────────────────────────────
_roblox: Optional[AgenteRoblox] = None

def get_roblox(config: Dict = None) -> AgenteRoblox:
    global _roblox
    if _roblox is None:
        _roblox = AgenteRoblox(config or {})
    return _roblox
