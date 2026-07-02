# Susan v3 — Asistente Virtual con IA Local

> Asistente de escritorio completo con IA, voz, visión y más de 15 agentes especializados.

---

## ✨ Qué hay de nuevo en v3

| Característica | Descripción |
|---|---|
| 🧠 **Cerebro x15 (Consejo de Cerebros)** | Un consejo de 15 cerebros especializados (Planificador, Lógico, Investigador, Crítico, Sintetizador, Técnico, Estratega…) que colaboran orquestando varios modelos locales. Profundo en preguntas difíciles, instantáneo en las fáciles. |
| 🛍️ **Agente de Compras** | Escanea un objeto con la cámara → busca automáticamente en Amazon, Temu, eBay. Compara precios al instante. |
| 📧 **Agente de Email** | Lee, resume, responde y envía correos de Gmail / Outlook con IA. |
| 🎮 **Roblox Studio** | Genera scripts Luau con IA, los inserta directo en Studio. Depura errores. |
| ✈️ **Viajes y Hoteles** | Busca y compara hoteles/vuelos en Booking, Airbnb, Skyscanner y más. |
| ⚙️ **Automatización** | Recordatorios, escritura automática, gestión de ventanas, control de volumen, macros. |
| 🖥️ **OCR de Pantalla** | Lee el texto de cualquier ventana abierta sin copiar y pegar. |
| 🌐 **Traductor** | Traduce a más de 15 idiomas sin API de pago. |
| 📰 **Noticias** | Titulares en tiempo real por categoría. |
| 🌤️ **Clima** | Pronóstico sin clave de API (usa wttr.in). |
| ⬡ **Axiom v5** | Genera proyectos completos de código: Pygame, FastAPI, Discord bot, ML pipeline y más. |
| ✏️ **Agente Creativo** | Pipeline Ryan → Sussy → Pablo: genera contenido, lo revisa y corrige. |
| 🧠 **Memoria SQLite** | Historial de conversaciones, historial de compras, preferencias y conocimiento local. |
| 📡 **Streaming** | Las respuestas de la IA se muestran token a token en tiempo real. |

---

## 📋 Requisitos del sistema

- **SO:** Windows 10/11 (64-bit)
- **Python:** 3.10 o superior
- **RAM:** Mínimo 8 GB (16 GB recomendado para modelos grandes)
- **Almacenamiento:** 15–30 GB (para modelos de Ollama)
- **GPU:** Opcional (mejora la velocidad de IA y generación de imágenes)
- **[Ollama](https://ollama.com/download):** Para ejecutar modelos de IA localmente

---

## 🚀 Instalación rápida

### 1. Instalar Ollama y modelos
```bash
# Instalar Ollama desde https://ollama.com/download
# Luego descargar los modelos:
ollama pull llama3.2:3b          # Cerebro rápido (conversación)
ollama pull qwen2.5-coder:7b     # Cerebro de código (Axiom + Roblox)
ollama pull llava:latest         # Cerebro de visión (cámara + compras)
```

> 🧠 **Detección automática de modelos:** Susan consulta qué modelos tienes
> instalados y asigna el mejor a cada cerebro. Si dispones de un modelo grande
> de razonamiento (p. ej. `claude-3-5-sonnet-latest`), el **Consejo de Cerebros**
> lo usará automáticamente para las respuestas profundas. Si falta alguno, degrada
> con elegancia al modelo disponible más cercano.

### 2. Instalar Susan v3
```bash
# Opción A — Script automático (Windows):
instalar.bat

# Opción B — Manual:
pip install -r requirements.txt
```

### 3. Iniciar Susan
```bash
# Doble clic en:
iniciar_susan.bat

# O desde terminal:
python lanzador.py

# Sin GUI (solo texto):
python lanzador.py --consola
```

---

## ⚙️ Configuración (`config.json`)

Edita `config.json` antes de iniciar:

```json
{
  "ia": {
    "modelo": "llama3.2:3b",
    "modelo_codigo": "qwen2.5-coder:7b",
    "modelo_vision": "llava:latest"
  },
  "cerebros": {
    "activo": true,
    "modo": "auto"
  }
}
```

> El correo ahora se configura en un archivo **`.env`** (copia `.env.example`),
> no en `config.json`. Así no expones tu contraseña en el repositorio.

### 🧠 Consejo de Cerebros (`config.json → cerebros`)

| Opción | Valores | Qué hace |
|---|---|---|
| `modo` | `auto` · `siempre` · `off` | `auto`: consejo solo en preguntas difíciles (recomendado). `siempre`: en todas. `off`: desactivado. |
| `max_paralelo` | número | Cuántos cerebros piensan a la vez (por defecto 4). |
| `cap_total_s` | segundos | Tope total de tiempo del consejo (por defecto 75). |

También puedes cambiar el modo en caliente desde la barra lateral (**🧠 Cerebro x15**).

### Email — Contraseña de aplicación (Gmail)
1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad → Verificación en dos pasos (actívala)
3. Seguridad → **Contraseñas de aplicación**
4. Genera una para "Correo" → "Windows"
5. Copia esa contraseña de 16 caracteres al campo `password`

---

## 🎤 Reconocimiento de voz (opcional)

Para usar el comando de voz **"Susan"**:

1. Descarga el modelo español de Vosk: [alphacephei.com/vosk/models](https://alphacephei.com/vosk/models)
   - Busca `vosk-model-es-0.42` o similar
2. Extrae la carpeta y renómbrala a `modelo_es`
3. Coloca `modelo_es/` dentro de la carpeta de Susan v3

---

## 🖥️ OCR (leer texto de pantalla, opcional)

```bash
# Instalar Tesseract-OCR para Windows:
# https://github.com/UB-Mannheim/tesseract/wiki
# Durante la instalación, marca el idioma "Spanish"
```

---

## 🛍️ Agente de Compras — Cómo usarlo

### Por texto:
```
"busca audífonos inalámbricos en Amazon más baratos"
"encuentra iPhone 15 en Temu y eBay"
"cuánto cuesta una silla gamer en Amazon"
```

### Por cámara (¡nuevo!):
```
"escanea y busca el producto"
→ Abre la cámara, identifica el objeto, busca en tiendas
```

### Tiendas disponibles:
`amazon`, `temu`, `ebay`, `aliexpress`, `mercadolibre`

---

## ✈️ Agente de Viajes

```
"busca hoteles baratos en Cancún"
"hoteles en París para 2 personas"
"vuelos de México a Madrid en diciembre"
"abre Booking para Miami"
"abre Airbnb para Barcelona"
```

---

## 📧 Agente de Email

```
"revisar email"               → lista correos sin leer
"lee el correo 1"             → lee el primero
"resume el 2"                 → IA resume el correo
"responde al 3"               → IA genera borrador de respuesta
"busca email de Juan"         → busca por remitente
"envía email a x@y.com asunto Hola mensaje ¿Cómo estás?"
```

---

## 🎮 Agente Roblox Studio

```
"abre Roblox Studio"
"crea un sistema de movimiento para Roblox"
"genera un script de tienda con monedas en Roblox"
"haz un sistema de guardado con DataStore para Roblox"
"crea una GUI básica para Roblox"
"inserta el código en Studio"
"corrige este error: [pega el error]"
"abre la documentación de Roblox"
```

---

## ⚙️ Automatización

```
"recuérdame a las 3pm hacer ejercicio"
"recuérdame en 30 minutos llamar a mamá"
"recuérdame todos los días a las 8am revisar el email"
"mis tareas programadas"
"cancela la tarea 12345"
"escribe Hola mundo"
"qué hay en el portapapeles"
"ventanas abiertas"
"activa la ventana Chrome"
"captura de pantalla"
"sube el volumen 20%"
"procesos pesados"
```

---

## ⬡ Axiom v5 — Generador de Código

```
"crea un juego de Snake con Pygame"
"genera una API REST con FastAPI y autenticación JWT"
"haz un bot de Discord con comandos de música"
"crea un web scraper de precios de Amazon"
"construye un pipeline de ML para clasificación"
```

También disponible desde el botón **⬡ Axiom** en la barra lateral.

---

## 🌐 Traducción

```
"traduce hello world al español"
"cómo se dice gracias en japonés"
"traduce este texto al francés: [texto]"
```

---

## 📁 Estructura del proyecto

```
susan_v3/
├── lanzador.py          ← INICIO AQUÍ
├── susan.py             ← Orquestador central
├── ui.py                ← Interfaz gráfica
├── ia.py                ← Motor de IA (Ollama)
├── memoria.py           ← Base de datos SQLite
├── logger.py            ← Registro de eventos
├── config.json          ← Configuración
├── requirements.txt     ← Dependencias Python
├── instalar.bat         ← Instalador Windows
├── iniciar_susan.bat    ← Inicio rápido
│
├── agentes/
│   ├── agente_vision.py     ← Cámara + LLaVA
│   ├── agente_compras.py    ← Amazon, Temu, eBay
│   ├── agente_email.py      ← Gmail, Outlook
│   ├── agente_roblox.py     ← Roblox Studio + Luau
│   ├── agente_viajes.py     ← Hoteles, vuelos
│   ├── agente_auto.py       ← Automatización PC
│   ├── agente_axiom.py      ← Generador de código
│   ├── agente_creativo.py   ← Ryan+Sussy+Pablo
│   └── agentes_utiles.py    ← Clima, Noticias, Traductor,
│                               OCR, Sistema, Archivos,
│                               WhatsApp, YouTube, Lanzador
│
├── capturas/            ← Fotos de la cámara
├── imagenes/            ← Imágenes de Nova
├── videos/              ← Videos de Vega
├── contenido/           ← Contenido del Agente Creativo
├── conocimiento/        ← Base de conocimiento local
├── modelo_es/           ← Modelo Vosk (voz)
└── susan_memoria.db     ← Base de datos SQLite (auto-creada)
```

---

## 🔊 Comandos de voz disponibles

Di **"Susan"** para activar la escucha, luego cualquier comando:

| Categoría | Ejemplos |
|---|---|
| Compras | "busca audífonos en Amazon más baratos" |
| Email | "revisar email", "lee el correo 1" |
| Roblox | "crea un sistema de puntos para Roblox" |
| Viajes | "hoteles baratos en Cancún" |
| Recordatorio | "recuérdame a las 5pm llamar al doctor" |
| Cámara | "activa la cámara", "toma una foto" |
| Escanear | "escanea y busca el producto" |
| YouTube | "reproduce Bad Bunny en YouTube" |
| WhatsApp | "envía WhatsApp a mamá diciendo hola" |
| Sistema | "apaga el PC", "bloquea la pantalla" |
| Clima | "clima en Madrid" |
| Traducir | "traduce hello al español" |

---

## 🛠️ Solución de problemas

### Ollama no responde
```bash
ollama serve   # Iniciar el servidor manualmente
```

### Error de importación
```bash
pip install -r requirements.txt --force-reinstall
```

### La voz no funciona
- Verifica que `modelo_es/` exista en la carpeta de Susan
- Instala Vosk: `pip install vosk`

### El email no conecta
- Usa una **contraseña de aplicación**, no tu contraseña normal
- Gmail: activa primero la verificación en dos pasos

### Roblox Studio no se abre
- Verifica la ruta en `config.json → roblox → ruta_studio`
- O abre Studio manualmente y di "inserta el código"

### OCR no funciona
- Instala Tesseract desde: https://github.com/UB-Mannheim/tesseract/wiki
- Asegúrate de que esté en el PATH del sistema

---

## 📝 Licencia

MIT — Uso personal y educativo libre.

---

*Susan v3 — Construida con Python, Ollama, CustomTkinter y mucho ❤️*
