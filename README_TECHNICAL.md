# Naruto: The Complete Shinobi Experience
## Documentación Técnica del Sistema de Chakra y Combate

### Visión General
Este documento describe la arquitectura C++ implementada para Unreal Engine 5 del sistema central de chakra, combate y progresión para el juego "Naruto: The Complete Shinobi Experience".

---

## 📁 Estructura de Archivos

```
Source/NarutoGame/
├── Public/
│   ├── NarutoCombatTypes.h       # Enumeraciones y estructuras base
│   ├── ChakraSystemComponent.h   # Componente de gestión de chakra
│   └── NarutoCharacter.h         # Clase base del personaje
└── Private/
    ├── NarutoCombatLibrary.cpp   # Funciones de cálculo de combate
    ├── ChakraSystemComponent.cpp # Implementación del sistema de chakra
    └── NarutoCharacter.cpp       # Implementación del personaje
```

---

## 🔧 Módulo 1: Tipos de Combate (NarutoCombatTypes.h)

### Enumeraciones Principales

#### `EChakraNature` - Naturalezas de Chakra
- **Básicas**: Fire, Wind, Lightning, Earth, Water
- **Avanzadas**: Yin, Yang
- **Kekkei Genkai**: Ice (Water+Wind), Wood (Water+Earth), Lava (Fire+Earth)

#### `EHandSeal` - Sellos Manuales
12 sellos tradicionales del universo Naruto para input de combos:
Rat, Ox, Tiger, Hare, Dragon, Snake, Bird, Horse, Monkey, Boar, Dog

#### `EJutsuRank` - Rangos de Jutsu
- **E-Rank**: Académico (multiplicador 0.5x)
- **D-Rank**: Genin (0.7x)
- **C-Rank**: Chunin (1.0x)
- **B-Rank**: Jonin (1.3x)
- **A-Rank**: Alto Nivel (1.6x)
- **S-Rank**: Legendario/Kage (2.0x)

#### `ESageModeState` - Estados del Modo Sabio
- `Inactive`: Sin energía natural
- `Gathering`: Recolectando energía
- `Active`: Equilibrio perfecto (33.3% cada tipo)
- `Unstable_Low`: Muy poca energía natural
- `Unstable_High`: Exceso peligroso de energía natural
- `Petrified`: Game Over (petrificación completa)

### Estructuras de Datos

#### `FChakraLevels`
Gestiona los 3 tipos de energía:
```cpp
float Physical;    // Stamina/HP related
float Spiritual;   // Maná para Jutsus
float Natural;     // Energía Natural (Modo Sabio)
float ControlPercentage; // 0-100%, afecta éxito de jutsus
```

**Función clave**: `GetSageBalance()`
- Calcula qué tan cerca está el equilibrio de tercios perfectos (33.3% cada uno)
- Retorna 0-100% donde 100% = equilibrio perfecto

#### `FJutsuData`
Define un Jutsu completo:
```cpp
FName JutsuName;
EChakraNature PrimaryNature;
EJutsuRank Rank;
TArray<EHandSeal> SealSequence;
float BaseDamage;
float ChakraCost;
bool bIsSpecialChakra; // Para Amaterasu, Six Paths, etc.
int32 SusanooStage;    // 1-5 para Susanoo
```

---

## ⚔️ Módulo 2: Biblioteca de Combate (NarutoCombatLibrary.cpp)

### Sistema Elemental Piedra-Papel-Tijera

```
Fuego > Viento > Rayo > Tierra > Agua > Fuego
```

**Multiplicadores**:
- Ventaja elemental: **2.0x** daño
- Desventaja elemental: **0.5x** daño
- Mismo elemento: **1.0x** daño
- Kekkei Genkai tienen modificadores especiales

**Excepción para Chakra Especial** (Amaterasu, Six Paths):
- Ignoran parcialmente las desventajas elementales
- Ejemplo: Amaterasu vs Agua = 0.75x en lugar de 0.5x

### Fórmula de Daño Final

```cpp
FinalDamage = BaseDamage 
            * RankMultiplier 
            * ControlMultiplier 
            * SageMultiplier 
            * ElementalMultiplier 
            * (1 - DefenderResistance)
            * SusanooBonus
```

**Ejemplo práctico - Amaterasu vs Jutsu de Agua Rango B**:

Supongamos:
- Amaterasu: BaseDamage=80, S-Rank (2.0x), bIsSpecialChakra=true
- Atacante: Control=90%, en Modo Sabio (1.5x)
- Defensor: Jutsu Agua Rango B, Resistance=20%

Cálculo:
1. RankMultiplier = 2.0 (S-Rank)
2. ControlMultiplier = 0.9 (90/100)
3. SageMultiplier = 1.5 (Modo Sabio activo)
4. ElementalMultiplier = 0.75 (Amaterasu especial vs Agua)
5. SusanooBonus = 1.0 (no es Susanoo)

```
Daño = 80 * 2.0 * 0.9 * 1.5 * 0.75 * (1 - 0.2) * 1.0
     = 80 * 2.0 * 0.9 * 1.5 * 0.75 * 0.8
     = 80 * 1.62
     = 129.6 puntos de daño
```

**Sin Modo Sabio**:
```
Daño = 80 * 2.0 * 0.9 * 1.0 * 0.75 * 0.8
     = 86.4 puntos de daño
```

**El Modo Sabio aumenta el daño en ~50%** en este escenario.

---

## 🔵 Módulo 3: Componente de Chakra (ChakraSystemComponent)

### Características Principales

#### Gestión de los 3 Tipos de Energía
- **Physical**: Regenera 5 pts/s base, afectado por Control
- **Spiritual**: Regenera 3 pts/s base, afectado por Control
- **Natural**: Solo se obtiene estando INMÓVIL (MinGatheringTime = 3s)

#### Sistema de Modo Sabio - La Regla de los Tercios

**Equilibrio Perfecto**:
```
Physical ≈ Spiritual ≈ Natural ≈ 33.3% del total
```

**Estados**:
1. **Gathering**: El jugador está inmóvil acumulando energía natural
2. **Active**: Balance ≥ 90%, bonuses activos (regen x2, daño +50%, reducción de daño 30%)
3. **Unstable_Low**: Muy poca energía natural, no puede activar Modo Sabio
4. **Unstable_High**: Peligro de petrificación (>60% energía natural sin equilibrio)
5. **Petrified**: >95% energía natural sin control = Game Over instantáneo

**Mecánica de Riesgo**:
```cpp
// Check continuo en Tick()
if (NaturalPercentage > 60% && !IsPerfectSageMode()) {
    if (NaturalPercentage > 85%) → Estado Crítico
    if (NaturalPercentage > 95%) → Petrificación (Game Over)
}
```

#### Sistema de Control de Chakra

**Probabilidad de Éxito de Jutsu**:
```cpp
Probability = Control% + NatureBonus + SageBonus - RankDifficulty
```

| Rango | Dificultad |
|-------|-----------|
| E | 0 |
| D | 5 |
| C | 10 |
| B | 20 |
| A | 35 |
| S | 50 |

**Bonuses**:
- Naturaleza adecuada: +10%
- Modo Sabio activo: +15%

**Retroceso por Fallo** (Backlash):
```cpp
BacklashDamage = ChakraCost * RankMultiplier * 0.5
```
- S-Rank fallido = 150% del costo como daño al HP

#### Sistema de Sellos Manuales

**Flujo**:
1. Jugador ingresa secuencia de botones → `PerformHandSeal()`
2. Al intentar ejecutar → `ExecuteJutsuIfSequenceMatches()`
3. Verifica:
   - Secuencia coincide exactamente
   - Probabilidad de éxito (roll aleatorio)
4. Resultado:
   - **Éxito**: Consume chakra, ejecuta jutsu
   - **Fallo**: Pierde chakra + recibe backlash damage

---

## 🥷 Módulo 4: Personaje (ANarutoCharacter)

### Sistema de Movimiento y Defensa

#### Dash con I-Frames
- **Duración**: 0.3s
- **Distancia**: 800 unidades
- **Invulnerabilidad**: 0.25s
- **Costo**: 10 Spiritual + 5 Physical Chakra
- **Evento**: `OnDashCompleted` notifica éxito/fracaso

#### Parry System (Just Frame)
- **Ventana Perfecta**: 100ms (1.0x timing quality)
- **Ventana Normal**: 300ms (0.33x timing quality)
- **Mecánica**: Timer verifica si ataque enemigo ocurrió durante ventana
- **Recompensa**: Contraataque garantizado o stun al enemigo

#### Kawarimi no Jutsu (Sustitución)
- **Costo**: 50 Spiritual + 20 Physical Chakra
- **Efecto**: Teletransporta a ubicación objetivo, deja tronco en posición original
- **Uso táctico**: Escape de combos, reposicionamiento

### Sistema de Ocho Puertas Internas (Hachimon Tonkou)

**Mecánica de Riesgo/Recompensa**:

| Puerta | Multiplicador Daño | HP Drain/s | HP Mínimo Requerido |
|--------|-------------------|------------|---------------------|
| 1ª | x2 | 4.5 | 90% |
| 2ª | x4 | 13.5 | 80% |
| 3ª | x8 | 40.5 | 70% |
| 4ª | x16 | 121.5 | 60% |
| 5ª | x32 | 364.5 | 50% |
| 6ª | x64 | 1093.5 | 40% |
| 7ª | x128 | 3280.5 | 30% |
| 8ª | x256 | 9841.5 | 20% |

**Fórmulas**:
```cpp
DamageMultiplier = 2^PuertasAbiertas
HPDrainPerSecond = 3^PuertasAbiertas * 1.5
```

**Estrategia**: Usar puertas superiores solo al final de combates cuando el HP bajo no importa.

### Sistema de Sharingan

**Niveles**:
- 0: Sin Sharingan
- 1-3: Tomoe (10-30% reducción de daño)
- 4+: Mangekyou (habilidades especiales: Amaterasu, Tsukuyomi, Susanoo)

**Mecánicas**:
- Activación manual → `ActivateSharingan()`
- Bonus pasivo: Reducción de daño basada en nivel
- Futuro: Bullet Time en esquivas, copia de jutsus enemigos

---

## 🎮 Integración con Blueprints

Todos los sistemas están diseñados para exposición completa a Blueprints:

### Eventos (Delegados Dinámicos)
```cpp
// En Blueprint, conectar a:
OnPhysicalChakraChanged(float Current, float Max)
OnSpiritualChakraChanged(float Current, float Max)
OnNaturalEnergyChanged(float Current, float Max)
OnSageModeStateChanged(ESageModeState NewState)
OnPetrified() // Game Over
OnDashCompleted(bool Successful)
OnParryAttempt(bool Successful, float TimingQuality)
```

### Funciones Accesibles desde Blueprint
- Toda función marcada con `UFUNCTION(BlueprintCallable)`
- Todas las propiedades marcadas con `UPROPERTY(BlueprintReadWrite)`
- Enumeraciones y estructuras visibles en editor

---

## 📊 Métricas de Rendimiento y Balance

### Valores Base Recomendados

| Stat | Valor Base | Crecimiento por Nivel |
|------|-----------|---------------------|
| MaxHP | 1000 | +50/nivel |
| MaxPhysical | 100 | +5/nivel |
| MaxSpiritual | 100 | +5/nivel |
| MaxNatural | 100 | Fijo (solo Modo Sabio) |
| Control | 50% | +2/nivel, +5 en entrenamiento |

### Costos de Jutsus por Rango

| Rango | Costo Spiritual | Costo Physical | Daño Base |
|-------|----------------|---------------|-----------|
| E | 10 | 5 | 20 |
| D | 20 | 10 | 40 |
| C | 35 | 15 | 60 |
| B | 50 | 25 | 80 |
| A | 75 | 40 | 120 |
| S | 100+ | 50+ | 200+ |

---

## 🔮 Próximos Módulos a Implementar

1. **Sistema de Misiones** (Rangos D-S, recompensas, reputación)
2. **IA de Enemigos Shinobi** (Kawarimi automático, gestión de chakra, trampas)
3. **Árbol de Habilidades** (Desbloqueo de Jutsus, maestros, pergaminos)
4. **Sistema de Compañeros** (Órdenes de squad, Team Ultimate Jutsus)
5. **Bestias con Cola** (Modo Jinchuriki, lucha mental, Bijudama)
6. **Dojutsus Avanzados** (Mangekyou, Rinnegan, habilidades únicas)
7. **Director de Historia** (Sistema de nodos, eventos globales, transiciones entre arcos)

---

## 🛠️ Instrucciones de Compilación

1. Copiar archivos a `Source/NarutoGame/Public/` y `Source/NarutoGame/Private/`
2. Actualizar `[NombreDelProyecto].Build.cs`:
```csharp
PublicDependencyModuleNames.AddRange(new string[] { 
    "Core", 
    "CoreUObject", 
    "Engine", 
    "InputCore",
    "GameplayTags" // Opcional, para sistemas avanzados
});
```
3. Compilar proyecto en Visual Studio o Rider
4. Abrir en Unreal Engine 5.3+
5. Crear Blueprint hijo de `ANarutoCharacter` para personalización visual

---

**Estado del Proyecto**: ✅ Núcleo de Chakra y Combate Completado  
**Próximo Sprint**: Sistema de Misiones y IA de Enemigos
