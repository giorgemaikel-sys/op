# Elemental Champions - Documentación de Diseño

## Visión General
**Elemental Champions** es un mod para WorldBox que introduce 5 clanes elementales mutuamente excluyentes, cada uno con campeones únicos, habilidades especiales y un sistema de afinidad elemental estratégico.

## Elementos y Clanes

### 1. 🔥 FUEGO (Fire)
- **Color:** #FF4500 (Naranja rojizo)
- **Filosofía:** Poder destructivo y pasión
- **Fortalezas:** Daño alto, ataques en área
- **Debilidades:** Agua
- **Unidades:**
  - Guerrero de Fuego (120 HP, 25 ATK, 15 DEF)
  - Mago de Fuego (80 HP, 35 ATK, 10 DEF)
  - **Ignis** - Campeón del Fuego (500 HP, 80 ATK, 40 DEF)

### 2. 💧 AGUA (Water)
- **Color:** #1E90FF (Azul brillante)
- **Filosofía:** Adaptabilidad y curación
- **Fortalezas:** Fuego, regeneración
- **Debilidades:** Rayo
- **Unidades:**
  - Guerrero de Agua (130 HP, 20 ATK, 20 DEF)
  - Sanador de Agua (90 HP, 15 ATK, 15 DEF)
  - **Aqualon** - Campeón del Agua (550 HP, 60 ATK, 50 DEF)

### 3. 🌍 TIERRA (Earth)
- **Color:** #8B4513 (Marrón tierra)
- **Filosofía:** Defensa y resistencia
- **Fortalezas:** Rayo, defensas altas
- **Debilidades:** Aire
- **Unidades:**
  - Guardián de Tierra (150 HP, 22 ATK, 30 DEF)
  - Modelador de Tierra (110 HP, 28 ATK, 25 DEF)
  - **Terramax** - Campeón de la Tierra (700 HP, 70 ATK, 60 DEF)

### 4. 💨 AIRE (Air)
- **Color:** #87CEEB (Azul cielo)
- **Filosofía:** Velocidad y evasión
- **Fortalezas:** Tierra, movilidad
- **Debilidades:** Fuego
- **Unidades:**
  - Explorador de Aire (100 HP, 28 ATK, 12 DEF)
  - Bailarín de Aire (95 HP, 30 ATK, 14 DEF)
  - **Zephyros** - Campeón del Aire (450 HP, 75 ATK, 35 DEF)

### 5. ⚡ RAYO (Lightning)
- **Color:** #FFD700 (Dorado)
- **Filosofía:** Velocidad y poder crítico
- **Fortalezas:** Agua, ataques rápidos
- **Debilidades:** Tierra
- **Unidades:**
  - Atacante de Rayo (110 HP, 32 ATK, 13 DEF)
  - Invocador de Rayo (85 HP, 40 ATK, 10 DEF)
  - **Fulminax** - Campeón del Rayo (480 HP, 85 ATK, 30 DEF)

## Sistema de Afinidad Elemental

### Matriz de Efectividad
```
FUEGO > AIRE (1.5x)    | FUEGO < AGUA (0.7x)
AGUA > FUEGO (1.5x)    | AGUA < RAYO (0.7x)
TIERRA > RAYO (1.5x)   | TIERRA < AIRE (0.8x)
AIRE > TIERRA (1.5x)   | AIRE < FUEGO (0.7x)
RAYO > AGUA (1.5x)     | RAYO < TIERRA (0.7x)
```

### Ciclo Elemental
```
        FUEGO
         / \
        /   \
       /     \
     AIRE --- AGUA
      |       |
      |       |
      TIERRA <-+
         \
          \
           RAYO
```

**Ciclo principal:** Fuego → Aire → Tierra → Rayo → Agua → Fuego

## Traits (Rasgos)

### Por Elemento
- **Alma Elemental:** Inmunidad a efectos negativos del propio elemento
- **Mago Elemental:** Capacidad de lanzar hechizos del elemento (+25-30% stats)

### De Campeón (Únicos)
- **Campeón del [Elemento]:** Líder legendario con habilidades devastadoras
- Solo puede existir uno por elemento en el mundo

## Efectos Especiales

### Dañinos
- **Quemadura:** -5 vida/seg (10s)
- **Infierno:** -20 vida/seg en área (5s)
- **Ahogamiento:** -8 vida/seg (8s)
- **Electrocutado:** Daño + parálisis (5s)
- **Impacto de Rayo:** -50 vida instantáneo

### Beneficiosos
- **Curación Acuática:** +10 vida/seg (15s)
- **Piel de Piedra:** +100% defensa (20s)
- **Vuelo:** Puede volar (30s)
- **Impulso de Viento:** +50% velocidad (15s)

### Habilidades de Campeones
- **Erupción Ígnea:** Daño masivo en área grande (3s)
- **Ola Tsunami:** Empuja y daña enemigos (5s)
- **Terremoto:** Daño + aturdimiento en área (4s)
- **Ciclón:** Levanta enemigos al aire (6s)
- **Tormenta Eléctrica:** Múltiples impactos de rayo (8s)

## Arquitectura Técnica

### Estructura de Archivos
```
ELEMENTAL_CHAMPIONS/
├── mod.json                 # Configuración del mod
├── Code/
│   ├── Main.cs             # Punto de entrada
│   ├── Core/
│   │   └── ECRegistry.cs   # Registro centralizado
│   ├── Content/
│   │   ├── ECTraits.cs     # Traits elementales
│   │   ├── ECEffects.cs    # Efectos especiales
│   │   └── ECActors.cs     # Actores/Unidades
│   └── Systems/
│       ├── ElementalAffinitySystem.cs  # Matriz de afinidad
│       └── ChampionSpawner.cs          # Aparición de campeones
└── GameResources/
    ├── actors/             # Sprites de actores (16x16)
    ├── clans/              # Iconos de clanes
    ├── icons/
    │   ├── items/          # Iconos de items
    │   └── traits/         # Iconos de traits
    └── world/              # Tiles especiales
```

### Convenciones de Nomenclatura
- **Prefijo:** `ec_` para todos los IDs
- **Clanes:** `ec_clan_fire`, `ec_clan_water`, etc.
- **Traits:** `ec_trait_[nombre]`
- **Efectos:** `ec_effect_[nombre]`
- **Actores:** `ec_actor_[nombre]`
- **Items:** `ec_item_[nombre]`

### Sistemas Principales
1. **ECRegistry:** Registro centralizado con prefijo único
2. **ElementalAffinitySystem:** Matriz de fortalezas/debilidades
3. **ChampionSpawner:** Gestión de aparición de campeones únicos

## Invariantes Críticas

1. **Exclusividad de Clanes:** Una unidad solo puede pertenecer a UN clan elemental
2. **Unicidad de Campeones:** Solo un campeón por elemento puede existir simultáneamente
3. **Consistencia de Afinidad:** La matriz de afinidad debe ser balanceada (suma de multiplicadores = constante)
4. **Persistencia de Datos:** Los campeones derrotados no pueden reaparecer hasta reset manual

## Instrucciones de Instalación

1. Extraer la carpeta `ELEMENTAL_CHAMPIONS` en `Mods/` de WorldBox
2. Activar el mod desde el menú de mods del juego
3. Reiniciar el juego si es necesario

## Uso en Juego

### Spawnear Campeones
Los campeones pueden aparecer:
- Automáticamente cuando un clan alcanza cierto tamaño poblacional
- Manualmente mediante herramientas de administrador
- Como evento aleatorio en batallas épicas

### Estrategias Recomendadas
- **Fuego:** Ataque agresivo temprano, evitar peleas cerca de agua
- **Agua:** Defensivo, aprovechar territorios acuáticos
- **Tierra:** Fortalezas impenetrables, guerras de desgaste
- **Aire:** Guerrilla, atacar y retirarse, controlar terreno elevado
- **Rayo:** Ataques sorpresa, eliminar objetivos prioritarios

## Créditos
- **Autor:** AI Mod Creator
- **Inspirado en:** Sistema de Seven Deadly Sins mod
- **Versión:** 1.0.0
- **Licencia:** Creative Commons
