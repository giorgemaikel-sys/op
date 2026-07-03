# Modern Browser - Navegador Web Moderno en C++

Un navegador web moderno construido con C++20 y Qt6, con características avanzadas y una interfaz elegante.

## Características Principales

### 🌐 Soporte Web Moderno
- **HTML5, CSS3, JavaScript ES6+** completo
- **WebGL** para gráficos 3D acelerados por hardware
- **WebAssembly** support
- **CSS Grid Layout** y Flexbox
- **Animaciones CSS** y transiciones
- **APIs modernas** (LocalStorage, SessionStorage, IndexedDB)

### 🎨 Interfaz Moderna
- **Tema oscuro** elegante y personalizable
- **Navegación por pestañas** con cierre individual
- **Barra de direcciones inteligente** con autocompletado
- **Pantalla completa** con un solo clic
- **Diseño responsive** que se adapta a diferentes resoluciones
- **Soporte HiDPI** para pantallas de alta resolución

### ⚡ Funcionalidades Avanzadas
- **Gestor de descargas** con progreso en tiempo real
- **Historial de navegación** integrado
- **Atajos de teclado** intuitivos
- **Zoom** de página web
- **Carga progresiva** con indicador de progreso
- **Soporte multimedia** completo (audio/video HTML5)

### 🔒 Seguridad y Privacidad
- **Navegación segura** con HTTPS
- **Control de cookies** granular
- **Bloqueo de pop-ups** no deseados
- **Aislamiento de procesos** por pestaña

## Requisitos del Sistema

### Dependencias
- **Compilador**: GCC 9+ o Clang 10+ con soporte C++20
- **Qt Framework**: Qt 6.x con los siguientes módulos:
  - Qt Core
  - Qt GUI
  - Qt Widgets
  - Qt WebEngine
  - Qt Network
- **CMake**: 3.16 o superior

### Instalación de Dependencias

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install build-essential cmake qt6-base-dev qt6-webengine-dev libqt6webenginewidgets6
```

#### Fedora
```bash
sudo dnf install gcc-c++ cmake qt6-qtbase-devel qt6-qtwebengine-devel
```

#### Arch Linux
```bash
sudo pacman -S base-devel cmake qt6-base qt6-webengine
```

#### macOS (con Homebrew)
```bash
brew install cmake qt@6
```

## Compilación

### 1. Clonar el repositorio
```bash
cd /workspace/modern-browser
```

### 2. Crear directorio de build
```bash
mkdir build && cd build
```

### 3. Configurar con CMake
```bash
cmake .. -DCMAKE_BUILD_TYPE=Release
```

### 4. Compilar
```bash
make -j$(nproc)
```

### 5. Ejecutar
```bash
./ModernBrowser
```

## Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Ctrl+T` | Nueva pestaña |
| `Ctrl+W` | Cerrar pestaña |
| `Ctrl+L` | Enfocar barra de direcciones |
| `Ctrl+R` o `F5` | Recargar página |
| `Ctrl+Tab` | Siguiente pestaña |
| `Ctrl+Shift+Tab` | Pestaña anterior |
| `Alt+←` | Atrás |
| `Alt+→` | Adelante |
| `F11` | Pantalla completa |
| `Ctrl++` | Acercar zoom |
| `Ctrl+-` | Alejar zoom |
| `Ctrl+0` | Resetear zoom |
| `Ctrl+J` | Mostrar descargas |
| `Ctrl+H` | Mostrar historial |
| `Ctrl+D` | Añadir marcador |

## Estructura del Proyecto

```
modern-browser/
├── CMakeLists.txt          # Configuración de compilación
├── include/
│   ├── browser.h           # Clase principal del navegador
│   ├── tabwidget.h         # Widget de pestañas
│   ├── addressbar.h        # Barra de direcciones
│   └── downloadmanager.h   # Gestor de descargas
├── src/
│   ├── main.cpp            # Punto de entrada
│   ├── browser.cpp         # Implementación del navegador
│   ├── tabwidget.cpp       # Implementación de pestañas
│   ├── addressbar.cpp      # Implementación de barra de direcciones
│   └── downloadmanager.cpp # Implementación del gestor de descargas
└── resources/              # Recursos (iconos, estilos, etc.)
```

## Tecnologías Utilizadas

- **C++20**: Últimas características del estándar C++
  - Conceptos y ranges
  - Corrutinas (para operaciones asíncronas)
  - Modules (en desarrollo)
  
- **Qt6 Framework**: 
  - Qt WebEngine (basado en Chromium)
  - Qt Widgets para la interfaz
  - Qt Network para comunicaciones
  
- **Arquitectura MVC**: Separación clara entre lógica y presentación

## Personalización

### Cambiar el Tema

Puedes modificar el archivo `src/browser.cpp` en la función `loadStyleSheet()` para cambiar los colores del tema.

### Página de Inicio

Edita la línea en `src/browser.cpp`:
```cpp
webView->setUrl(QUrl("https://www.google.com"));
```

### User Agent

Personaliza el user agent en `src/main.cpp`.

## Roadmap - Próximas Características

- [ ] Marcadores/guardar favoritos
- [ ] Historial de navegación completo
- [ ] Modo incógnito/privado
- [ ] Extensiones y plugins
- [ ] Sincronización en la nube
- [ ] Traducción integrada
- [ ] Lector de PDF
- [ ] Capturas de pantalla
- [ ] Modo lectura
- [ ] Bloqueador de anuncios integrado

## Licencia

Este proyecto es de código abierto bajo la licencia MIT.

## Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de enviar pull requests o reportar issues.

## Créditos

Desarrollado con ❤️ utilizando C++ moderno y Qt Framework.

---

**Nota**: Este navegador utiliza Qt WebEngine, que está basado en Chromium, por lo que ofrece compatibilidad casi total con los estándares web modernos.
