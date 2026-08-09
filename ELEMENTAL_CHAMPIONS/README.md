# README - Elemental Champions Mod

## 🎮 ¿Qué es Elemental Champions?

**Elemental Champions** es un mod completo para WorldBox que añade 5 clanes elementales únicos con campeones legendarios, un sistema de afinidad elemental estratégico y habilidades especiales inspiradas en los elementos clásicos.

## ✨ Características Principales

### 🔥 5 Clanes Elementales
- **Fuego** - Poder destructivo y ataques en área
- **Agua** - Curación y adaptabilidad
- **Tierra** - Defensas impenetrables
- **Aire** - Velocidad y evasión
- **Rayo** - Ataques críticos rápidos

### 🏆 5 Campeones Legendarios
Cada clan tiene un campeón único con estadísticas épicas:
- **Ignis** (Fuego) - 500 HP, 80 ATK, 40 DEF
- **Aqualon** (Agua) - 550 HP, 60 ATK, 50 DEF
- **Terramax** (Tierra) - 700 HP, 70 ATK, 60 DEF
- **Zephyros** (Aire) - 450 HP, 75 ATK, 35 DEF
- **Fulminax** (Rayo) - 480 HP, 85 ATK, 30 DEF

### ⚔️ Sistema de Afinidad Elemental
Un ciclo estratégico de fortalezas y debilidades:
```
Fuego > Aire > Tierra > Rayo > Agua > Fuego
```
- **Ventaja:** 1.5x daño
- **Desventaja:** 0.7x daño

### 🎯 15+ Traits Únicos
- Almas elementales (inmunidades)
- Magos elementales (habilidades especiales)
- Traits de campeón (únicos por elemento)

### 💥 15+ Efectos Especiales
- Dañinos: Quemadura, Electrocutado, Tsunami...
- Beneficiosos: Curación, Vuelo, Piel de Piedra...
- Habilidades de campeón devastadoras

## 📁 Estructura del Mod

```
ELEMENTAL_CHAMPIONS/
├── mod.json                    # Configuración
├── DESIGN.md                   # Documentación completa
├── README.md                   # Este archivo
├── Code/
│   ├── Main.cs                # Punto de entrada
│   ├── Core/
│   │   └── ECRegistry.cs      # Registro centralizado
│   ├── Content/
│   │   ├── ECTraits.cs        # Traits
│   │   ├── ECEffects.cs       # Efectos
│   │   └── ECActors.cs        # Unidades
│   └── Systems/
│       ├── ElementalAffinitySystem.cs  # Afinidades
│       └── ChampionSpawner.cs          # Campeones
└── GameResources/             # Sprites e iconos (pendientes)
    ├── actors/
    ├── clans/
    ├── icons/
    │   ├── items/
    │   └── traits/
    └── world/
```

## 🚀 Instalación

1. **Descargar** la carpeta `ELEMENTAL_CHAMPIONS`
2. **Copiar** en la carpeta `Mods/` de WorldBox
   - Windows: `C:\Users\[Usuario]\AppData\LocalLow\karunator\WorldBox\Mods\`
   - Linux: `~/.config/unity3d/karunator/WorldBox/Mods/`
   - Mac: `~/Library/Application Support/karunator/WorldBox/Mods/`
3. **Activar** el mod en el menú de mods de WorldBox
4. **Reiniciar** el juego (recomendado)

## 🎯 Cómo Jugar

### Spawnear Unidades
1. Usar la herramienta de spawn del juego
2. Seleccionar unidades del clan elemental deseado
3. Los campeones aparecen automáticamente cuando el clan crece

### Estrategias por Elemento

#### 🔥 Fuego
- **Fortalezas:** Daño explosivo, efectivo contra Aire
- **Debilidades:** Vulnerable al Agua
- **Estrategia:** Ataque temprano agresivo, evitar agua

#### 💧 Agua
- **Fortalezas:** Regeneración, efectivo contra Fuego
- **Debilidades:** Vulnerable al Rayo
- **Estrategia:** Defensivo, controlar territorios acuáticos

#### 🌍 Tierra
- **Fortalezas:** Defensa máxima, efectivo contra Rayo
- **Debilidades:** Vulnerable al Aire
- **Estrategia:** Fortificaciones, guerras de desgaste

#### 💨 Aire
- **Fortalezas:** Velocidad, efectivo contra Tierra
- **Debilidades:** Vulnerable al Fuego
- **Estrategia:** Guerrilla, terreno elevado

#### ⚡ Rayo
- **Fortalezas:** Críticos, efectivo contra Agua
- **Debilidades:** Vulnerable a Tierra
- **Estrategia:** Ataques sorpresa, objetivos prioritarios

## 📊 Balance de Juego

### Matriz de Efectividad Completa

| Atacante → | Fuego | Agua | Tierra | Aire | Rayo |
|------------|-------|------|--------|------|------|
| **Fuego**  | 1.0x  | 0.7x | 1.0x   | 1.5x | 1.0x |
| **Agua**   | 1.5x  | 1.0x | 0.8x   | 1.0x | 0.7x |
| **Tierra** | 1.0x  | 1.2x | 1.0x   | 0.8x | 1.5x |
| **Aire**   | 0.7x  | 1.0x | 1.5x   | 1.0x | 0.9x |
| **Rayo**   | 1.0x  | 1.5x | 0.7x   | 1.1x | 1.0x |

## 🛠️ Para Desarrolladores

### Agregar Nuevos Elementos
1. Editar `ECRegistry.cs` - Añadir al enum `Element`
2. Actualizar matriz de afinidad en `ElementalAffinitySystem.cs`
3. Crear traits en `ECTraits.cs`
4. Crear actores en `ECActors.cs`

### Convenciones de Nomenclatura
- Prefijo obligatorio: `ec_`
- Formato: `ec_tipo_nombre`
- Ejemplos: `ec_clan_fire`, `ec_trait_pyromancer`

### Sprites Requeridos
Todos los sprites deben ser 16x16 o 32x32 PNG con transparencia:
- Actores: `GameResources/actors/ec_actor_[nombre].png`
- Traits: `GameResources/icons/traits/ec_trait_[nombre].png`
- Clanes: `GameResources/clans/ec_clan_[elemento].png`

## ⚠️ Notas Importantes

1. **Compatibilidad:** Versión 0.24.0 de WorldBox
2. **Idioma:** Español (traducible vía localization)
3. **Rendimiento:** Mínimo impacto en FPS
4. **Guardado:** Compatible con partidas existentes

## 🐛 Solución de Problemas

### El mod no aparece
- Verificar que `mod.json` esté en la raíz de la carpeta
- Revisar logs de errores en `WorldBox/Logs/`

### Los campeones no spawnean
- Verificar que no haya otro campeón del mismo elemento
- Reiniciar el mundo

### Errores de carga
- Asegurar que todos los archivos `.cs` estén en `Code/`
- Verificar sintaxis C# correcta

## 📝 Changelog

### v1.0.0 (Inicial)
- ✅ 5 clanes elementales implementados
- ✅ 5 campeones únicos
- ✅ Sistema de afinidad elemental
- ✅ 15+ traits
- ✅ 15+ efectos especiales
- ✅ Documentación completa

## 🙏 Créditos

- **Autor:** AI Mod Creator
- **Inspiración:** Seven Deadly Sins Mod (arquitectura)
- **Juego Base:** WorldBox por karunator
- **Licencia:** Creative Commons BY-NC-SA

## 📞 Soporte

Para bugs, sugerencias o preguntas:
- Revisar `DESIGN.md` para documentación técnica
- Reportar issues en el repositorio
- Comunidad de mods de WorldBox

---

**¡Que comience la guerra elemental!** ⚔️🔥💧🌍💨⚡
