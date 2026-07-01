# Shinobi Chronicles - RPG de Naruto

## Fase 1: Núcleo Técnico ✅

¡El núcleo técnico del juego ha sido implementado exitosamente!

### 🎮 Cómo Jugar

1. **Abrir el juego**: Abre el archivo `index.html` en tu navegador web moderno (Chrome, Firefox, Edge).

2. **Exploración**:
   - Usa **WASD** o las **Flechas del teclado** para mover a Naruto
   - Acércate a los enemigos (Ninja Renegado o Bandido)
   - Presiona **E** cuando estés cerca para iniciar combate

3. **Combate por Turnos**:
   - **Tecla 1**: Ataque básico (Taijutsu) - sin costo de chakra
   - **Tecla 2**: Abrir menú de Jutsus
     - Navega con **Flechas Arriba/Abajo** o **W/S**
     - Selecciona con **Enter** o **Espacio**
     - Vuelve con **ESC**
   - **Tecla 3**: Defender (recupera chakra)
   - **Tecla 4**: Intentar huir

### 📁 Estructura del Proyecto

```
shinobi-chronicles/
├── index.html              # Archivo principal del juego
├── data/
│   ├── characters.js       # Datos de personajes y elementos
│   └── jutsus.js           # Datos de técnicas ninja (jutsus)
├── js/
│   ├── utils.js            # Funciones utilitarias
│   ├── combat.js           # Sistema de combate por turnos
│   ├── exploration.js      # Sistema de exploración
│   └── game.js             # Game loop y gestión de estados
└── assets/                 # (Para sprites futuros)
```

### ✨ Características Implementadas

#### Sistema de Chakra
- ✅ Barra de Chakra (CHK) separada de Vida (HP)
- ✅ Consumo de chakra al usar jutsus
- ✅ Visualización en HUD de combate y exploración

#### Sistema de Combate por Turnos
- ✅ Combates 1v1 activados al interactuar con enemigos
- ✅ Orden de turnos basado en Velocidad
- ✅ Acciones: Atacar, Usar Jutsu, Defender, Huir
- ✅ Sistema de ventajas elementales (Fuego > Viento > Rayo > Tierra > Agua > Fuego)

#### Estadísticas de Personajes
- ✅ HP, Chakra, Fuerza, Ninjutsu, Genjutsu, Velocidad, Defensa
- ✅ Afinidades elementales

#### Jutsus de Prueba (5 técnicas)
1. **Golpe Básico** (Taijutsu, Rango E) - Sin costo
2. **Bola de Fuego** (Ninjutsu, Fuego, Rango C) - 15 CHK
3. **Bala de Agua** (Ninjutsu, Agua, Rango C) - 15 CHK
4. **Hoja de Viento** (Ninjutsu, Viento, Rango C) - 15 CHK
5. **Jutsu Curativo** (Ninjutsu, Rango D) - 20 CHK, cura 30 HP
6. **Ilusión Básica** (Genjutsu, Rango D) - 12 CHK

#### Exploración Básica
- ✅ Mapa 2D top-down de prueba
- ✅ Movimiento de personaje con colisiones
- ✅ Obstáculos (árboles, rocas)
- ✅ Enemigos visibles en el mapa
- ✅ Interacción para iniciar combate

### 🎯 Estado Actual

El juego cumple con todos los requisitos de la **Fase 1**:
- [x] Personaje moviéndose en mapa de prueba
- [x] Enemigos interactivos en el mapa
- [x] Transición a pantalla de combate
- [x] Combate por turnos funcional
- [x] Sistema de chakra operativo
- [x] 4-5 jutsus de prueba implementados
- [x] Victoria/derrota con pantalla de resultado
- [x] Contenido separado en archivos JSON/JS editables

### 🚀 Próximos Pasos

Cuando quieras continuar, el siguiente paso es implementar la **Fase 2: Sistema de Progresión**, que añadirá:
- Árbol de habilidades/jutsus
- Sistema de niveles y experiencia
- Minijuegos de control de chakra
- Sellos de manos para jutsus
- Más personajes jugables

### 🛠️ Desarrollo Futuro

El código está estructurado para facilitar la expansión:
- Los datos de personajes y jutsus están en archivos separados
- El motor de combate es independiente del de exploración
- Fácil agregar nuevos mapas, enemigos y técnicas
- Listo para integrar narrativa en la Fase 3

---

**¡Disfruta probando el núcleo de Shinobi Chronicles! 🍥**
