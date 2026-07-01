# 🍥 NARUTO: THE COMPLETE SHINOBI EXPERIENCE - GUÍA DE EJECUCIÓN

## 📁 Estructura del Proyecto Creada
```
NarutoShinobiExperience/
├── NarutoShinobiExperience.uproject    # Archivo principal del proyecto UE5
├── Config/
│   ├── DefaultEngine.ini               # Configuración del motor
│   └── DefaultGame.ini                 # Configuración del juego
├── Content/                            # Assets (Blueprints, mapas, modelos)
├── Source/
│   └── NarutoGame/
│       ├── NarutoGame.h/.cpp           # Módulo principal
│       ├── NarutoGame.Build.cs         # Configuración de compilación
│       ├── Public/
│       │   ├── NarutoCombatTypes.h     # Enums y structs
│       │   ├── ChakraSystemComponent.h # Componente de chakra
│       │   └── NarutoCharacter.h       # Clase del personaje
│       └── Private/
│           ├── NarutoCombatLibrary.cpp # Fórmulas de combate
│           ├── ChakraSystemComponent.cpp
│           └── NarutoCharacter.cpp
└── GUIA_EJECUCION.md                   # Este archivo
```

## ⚙️ REQUISITOS PREVIOS

### 1. Unreal Engine 5.3+ Instalado
- Descarga desde [Epic Games Launcher](https://www.unrealengine.com/)
- Versión mínima: **5.3** (recomendado 5.4+)
- Espacio en disco: ~100 GB para el motor + proyecto

### 2. Visual Studio 2022 (Windows) o Xcode (Mac)
- **Windows**: Visual Studio 2022 con "Desarrollo para juegos con C++"
- **Mac**: Xcode 14+ con Command Line Tools
- **Linux**: Clang 10+, CMake 3.20+

## 🚀 PASOS PARA EJECUTAR EL JUEGO

### Opción A: Windows (Recomendado)

#### Paso 1: Abrir el proyecto
```bash
# Método 1: Doble clic en el archivo .uproject
cd /workspace/NarutoShinobiExperience
"NARUTO-SHINOBI-2025.uproject"

# Método 2: Desde Epic Games Launcher
# File → Open Project → Seleccionar NarutoShinobiExperience.uproject
```

#### Paso 2: Generar archivos de Visual Studio
```bash
# Click derecho en NarutoShinobiExperience.uproject
# → Generate Visual Studio project files
```

#### Paso 3: Compilar el código C++
```bash
# En Visual Studio 2022:
# 1. Abrir NarutoShinobiExperience.sln
# 2. Cambiar configuración a "Development Editor"
# 3. Build → Build Solution (Ctrl+Shift+B)
```

#### Paso 4: Ejecutar desde el Editor
```bash
# En el Editor de Unreal:
# 1. Ir a Content Browser
# 2. Crear mapa nuevo (File → New Level → Default)
# 3. Arrastrar BP_NarutoCharacter al nivel
# 4. Presionar "Play" (F8)
```

### Opción B: Línea de Comandos (Windows)

```powershell
# Navegar al directorio del proyecto
cd C:\Workspace\NarutoShinobiExperience

# Compilar el proyecto
"C:\Program Files\Epic Games\UE_5.3\Engine\Build\BatchFiles\Build.bat" NarutoGame Win64 Development -Project="C:\Workspace\NarutoShinobiExperience\NarutoShinobiExperience.uproject"

# Ejecutar el editor
"C:\Program Files\Epic Games\UE_5.3\Engine\Binaries\Win64\UnrealEditor.exe" "C:\Workspace\NarutoShinobiExperience\NarutoShinobiExperience.uproject"
```

### Opción C: Linux

```bash
# Compilar el proyecto
~/UnrealEngine/Engine/Build/BatchFiles/Build.sh NarutoGame Linux Development -Project=/workspace/NarutoShinobiExperience/NarutoShinobiExperience.uproject

# Ejecutar el editor
~/UnrealEngine/Engine/Binaries/Linux/UnrealEditor /workspace/NarutoShinobiExperience/NarutoShinobiExperience.uproject
```

### Opción D: Mac

```bash
# Compilar el proyecto
~/UnrealEngine/Engine/Build/BatchFiles/Mac/Build.sh NarutoGame Mac Development -Project=/workspace/NarutoShinobiExperience/NarutoShinobiExperience.uproject

# Ejecutar el editor
~/UnrealEngine/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor /workspace/NarutoShinobiExperience/NarutoShinobiExperience.uproject
```

## 🎮 CONTROLES POR DEFECTO (Una vez en el juego)

| Acción | Tecla/Mando |
|--------|-------------|
| Moverse | WASD / Joystick Izq |
| Saltar | Espacio / A |
| Dash (I-Frames) | Shift / B |
| Ataque Básico (Taijutsu) | Click Izq / X |
| Jutsu 1 | Q / RB |
| Jutsu 2 | E / RT |
| Sellos Manuales | Combinación Q-E-R / Gatillos |
| Modo Sabio | Mantener T / Back + Y |
| Parry | Click Der en timing preciso / LB |
| Kawarimi (Sustitución) | F al recibir daño / A + B |

## 📋 PRÓXIMOS PASOS DENTRO DEL EDITOR

### 1. Crear el Personaje Principal (Blueprint)
```
Content Browser → Right Click → Blueprint Class → Character
Nombre: BP_NarutoCharacter
Añadir componente: ChakraSystemComponent
Configurar variables: MaxChakraPhysical, MaxChakraSpiritual, etc.
```

### 2. Crear Mapa de Prueba
```
File → New Level → Default
Guardar como: /Game/Maps/TestArena
Añadir:
- Floor (plano)
- Directional Light
- Sky Atmosphere
- Exponential Height Fog
- BP_NarutoCharacter (desde Content Browser)
```

### 3. Configurar Input Mapping
```
Edit → Project Settings → Input
Action Mappings:
- Jump (Space)
- Dash (LeftShift)
- Attack (LeftMouseButton)
- Jutsu1 (Q)
- Jutsu2 (E)
- SageMode (T)
```

### 4. Probar Sistemas
```
- Presiona Play (F8)
- Prueba movimiento y dash
- Verifica barras de chakra (UI pendiente)
- Prueba activación de Modo Sabio (permanecer quieto 5 segundos)
```

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Module NarutoGame could not be loaded"
```bash
# Solución: Recompile el módulo
# En Visual Studio: Rebuild Solution
# O desde línea de comandos:
RunUAT.bat BuildPlugin -Plugin="NarutoGame.uplugin" -Package="Output/" -TargetPlatforms=Win64
```

### Error: "Shader compilation failed"
```bash
# Solución: Esperar a que compile shaders (puede tardar 10-30 min)
# O limpiar caché:
Delete: %LocalAppData%\UnrealEngine\5.3\Saved\ShaderCache
```

### Error: "Blueprint compilation failed"
```bash
# Solución: 
# 1. Hot Reload desde File → Refresh Visual Studio Project
# 2. Recompile C++ primero
# 3. Luego abra el Blueprint
```

## 📦 EMPAQUETADO PARA DISTRIBUCIÓN

### Windows (Build final)
```bash
# Desde el Editor:
File → Package Project → Windows (64-bit)

# O línea de comandos:
"C:\Program Files\Epic Games\UE_5.3\Engine\Build\BatchFiles\RunUAT.bat" \
  BuildCookRun \
  -project="C:\Workspace\NarutoShinobiExperience\NarutoShinobiExperience.uproject" \
  -noP4 \
  -platform=Win64 \
  -clientconfig=Shipping \
  -serverconfig=Shipping \
  -cook \
  -allmaps \
  -build \
  -stage \
  -pak \
  -archive \
  -archivedirectory="C:\Builds\NarutoShinobi"
```

## 🎯 ESTADO ACTUAL DEL PROYECTO

| Sistema | Estado | Completado |
|---------|--------|------------|
| Núcleo C++ Chakra | ✅ Listo | 100% |
| Sistema de 3 Energías | ✅ Listo | 100% |
| Modo Sabio (Regla Tercios) | ✅ Listo | 100% |
| Fórmulas de Combate | ✅ Listo | 100% |
| Controles Personaje | ✅ Listo | 100% |
| Blueprints Visuales | ⏳ Pendiente | 0% |
| Mapas y Niveles | ⏳ Pendiente | 0% |
| Modelos 3D/Animaciones | ⏳ Pendiente | 0% |
| UI/HUD | ⏳ Pendiente | 0% |
| Sistema de Misiones | ⏳ Pendiente | 0% |
| IA Enemigos | ⏳ Pendiente | 0% |

## 📞 SOPORTE

Para más detalles sobre la arquitectura técnica, consulta:
- `/workspace/README_TECHNICAL.md` - Documentación técnica completa
- `/workspace/fase-*.md` - Guías de implementación por fases

---

**¡Listo para comenzar tu aventura shinobi! 🍥**
