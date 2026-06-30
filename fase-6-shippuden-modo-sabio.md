# FASE 6 — Transición y Shippuden: Energía Natural y Modo Sabio — "Shinobi Chronicles" (RPG de Naruto)

> Esta es la Fase 6 de 7. Requiere que las Fases 1 a 5 ya estén construidas, incluyendo el combate de jefe Naruto vs Sasuke que cierra la Parte 1. Esta es la fase que introduce formalmente Shippuden y el sistema de Energía Natural / Modo Sabio.

---

## 0. CONTEXTO GENERAL (recordatorio del proyecto completo)

Estás trabajando sobre "Shinobi Chronicles", un RPG narrativo 2D del universo Naruto. Stack: HTML5 + JavaScript (Phaser.js recomendado), Canvas/WebGL, persistencia en localStorage/IndexedDB, contenido en JSON separado de la lógica del motor.

**Importante:** el sistema de Energía Natural y Modo Sabio descrito abajo debe construirse como una **capa adicional** sobre el sistema de chakra ya existente desde la Fase 1, no como un reemplazo. El chakra (CHK) sigue funcionando exactamente igual; la Energía Natural (EN) es un recurso nuevo y separado.

---

## OBJETIVO DE ESTA FASE

Construir la transición narrativa (entrenamiento con Jiraiya) y el arranque formal de Shippuden, incluyendo el sistema completo de Energía Natural y Modo Sabio como nueva mecánica de combate.

---

## 1. SAGA 7 — Transición/Salto temporal

Contenido a implementar:
- Entrenamiento con Jiraiya como montaje narrativo (usando el sistema de cinemática simplificada ya construido en fases anteriores)
- Este es el momento narrativo correcto para desbloquear el **Rasengan** en el árbol de jutsus de Naruto si no se había desbloqueado antes (recordar el requisito definido desde la Fase 2: "el Rasengan solo se desbloquea tras la saga de entrenamiento con Jiraiya")
- Salto temporal: actualización visual/narrativa de los personajes (mayor edad), sin necesidad de rehacer sprites desde cero si el prototipo usa placeholders, pero debe quedar reflejado en el diálogo y en las estadísticas base (los personajes deberían tener un salto de nivel base apropiado para la transición a Shippuden)

---

## 2. SISTEMA DE ENERGÍA NATURAL Y MODO SABIO (construcción completa)

### 2.1 Energía Natural (Senjutsu) como tercer recurso
- Nueva barra: **Energía Natural (EN)**, independiente de Chakra (CHK) y Vida (HP)
- La Energía Natural NO se regenera de forma pasiva como el chakra: se "absorbe" del entorno mediante un minijuego de meditación/quietud (replicando la mecánica de "estar completamente quieto para no ser detectado por los sapos sabios o por la naturaleza"), con riesgo de "transformación en piedra/sapo" si se falla el balance (mecánica de fallo cómica/temática del propio anime)
- Este minijuego debe construirse con una estructura similar a los minijuegos de control de chakra de la Fase 2 (timing/balance), pero con su propia identidad visual y de dificultad — no debe sentirse como una copia literal del minijuego de "subir el árbol"

### 2.2 Desbloqueo del Modo Sabio
- Requiere una secuencia narrativa de entrenamiento específica (entrenamiento en el **Monte Myoboku**) como prerequisito obligatorio, con múltiples etapas:
  1. **Tutorial de absorción de energía natural** (minijuego de balance/timing, dificultad progresiva) — esta es la primera vez que el jugador interactúa con el minijuego de la sección 2.1
  2. **Prueba de combinar Chakra + Energía Natural** sin desbalancear la mezcla (minijuego de gestión de dos recursos simultáneos — el jugador debe demostrar que puede manejar CHK y EN a la vez sin que ninguno de los dos llegue a un estado de fallo)
  3. **Combate de prueba contra un sapo sabio** como jefe tutorial — este combate debe diseñarse específicamente para enseñar al jugador cuándo y cómo usar el Modo Sabio una vez desbloqueado, no solo como un combate más

### 2.3 Efectos del Modo Sabio en combate
Una vez desbloqueado, el Modo Sabio es un **estado de transformación temporal en combate**, activable consumiendo una cantidad fija de Energía Natural acumulada previamente fuera de combate (no se genera en tiempo real durante el combate, replicando la lógica del anime). Sus efectos:
- Aumento de daño físico y de jutsus
- Aumento de velocidad/turnos extra (otorgar una ventaja de iniciativa o turno adicional en el sistema de turnos ya existente desde la Fase 1)
- **Percepción aumentada**: revela debilidades o patrones de ataque del enemigo en la UI de combate (sinergia con el lore de "sentir el chakra y las emociones del entorno") — esto debe traducirse en una mejora de UI real, por ejemplo mostrando el próximo ataque del enemigo o su elemento débil mientras el Modo Sabio está activo
- Duración limitada por la reserva de Energía Natural, que se agota con cada turno/acción usada en ese estado, forzando al jugador a decidir cuándo activarlo estratégicamente (esto debe sentirse como una decisión táctica real, no un botón de "ganar automáticamente")

---

## 3. SAGA 8 — Inicio de Shippuden

Contenido a implementar:
- Regreso de Naruto a Konoha (reencuentro narrativo con Sakura, Tsunade, y otros personajes, reflejando los flags de historia acumulados en fases anteriores)
- **Rescate de Gaara**: nueva saga de combate ambientada fuera de Konoha, introduciendo a la Akatsuki como amenaza real esta vez (a diferencia de la presentación no combatible de la Fase 5)
- Este es el arco donde el Modo Sabio, una vez desbloqueado en la sección 2, debe tener su primera aplicación narrativa significativa en combate

---

## ENTREGABLE DE ESTA FASE

Al terminar, deberías tener: la transición de entrenamiento con Jiraiya completa (con el Rasengan correctamente desbloqueado si no lo estaba antes), el sistema de Energía Natural funcionando como recurso independiente con su minijuego de absorción, la secuencia completa de desbloqueo del Modo Sabio en el Monte Myoboku (las tres etapas descritas en 2.2), el Modo Sabio funcionando como transformación de combate temporal con sus tres efectos (daño, velocidad, percepción), y el inicio de la saga de Shippuden con el arco del rescate de Gaara donde esta nueva mecánica se pone a prueba narrativamente por primera vez.

Cuando esto funcione, continúa con el archivo de **Fase 7 — Pulido**, la última fase del roadmap.
