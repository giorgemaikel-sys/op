# FASE 3 — Saga de la Academia + Tierra de las Olas — "Shinobi Chronicles" (RPG de Naruto)

> Esta es la Fase 3 de 7. Requiere que las Fases 1 (núcleo técnico) y 2 (progresión) ya estén construidas. Aquí entra la narrativa por primera vez, junto con el sistema de diálogo y las primeras misiones.

---

## 0. CONTEXTO GENERAL (recordatorio del proyecto completo)

Estás trabajando sobre "Shinobi Chronicles", un RPG narrativo 2D del universo Naruto. Stack: HTML5 + JavaScript (Phaser.js recomendado), Canvas/WebGL, persistencia en localStorage/IndexedDB, contenido en JSON separado de la lógica del motor.

**Principio de diseño no negociable:** todo el contenido narrativo (capítulos, diálogos) debe vivir en archivos de datos editables (JSON/JS de configuración), nunca hardcodeado dentro de la lógica del motor de diálogo. Esto permite ir agregando sagas futuras sin reescribir el sistema.

---

## OBJETIVO DE ESTA FASE

Construir el sistema de diálogo/narrativa y las dos primeras sagas jugables completas: la Saga de la Academia y la Saga de la Tierra de las Olas. Esto incluye el sistema de misiones en su versión inicial (principales) y el hub de Konoha como mapa explorable.

---

## 1. NARRATIVA — Sistema de diálogo (construir desde cero en esta fase)

- Sistema de diálogos con retrato de personaje, nombre, texto, y opciones de respuesta (estilo visual novel dentro del RPG)
- Sistema de "flashback" o cinemática simplificada (secuencia de imágenes/texto sin input del jugador) para escenas de alto impacto emocional (ej. pasado de Haku, que aparece en esta misma saga)
- Variables de historia persistentes (flags) que el motor de diálogo pueda consultar: ej. `flag_completo_prueba_cascabeles = true`, usadas para desbloquear diálogos opcionales más adelante

### Requisitos narrativos por capítulo (aplican a ambas sagas de esta fase):
- Cada capítulo debe tener: objetivo claro, al menos un combate o desafío de habilidad, al menos una escena de diálogo con elección del jugador (aunque no cambie el final, debe afectar diálogo posterior o relación con personajes), y un cierre que conecte con el capítulo siguiente

---

## 2. SAGA 1 — Saga de la Academia

Contenido a implementar: introducción de Naruto, Sasuke, Sakura; graduación; formación del Equipo 7; prueba de Kakashi de los cascabeles (tutorial de combate y trabajo en equipo usando el motor de combate de la Fase 1, y el control de chakra de la Fase 2 como parte del entrenamiento previo a la prueba)

No se trata de transcribir diálogos textuales del anime/manga, sino de recrear las escenas, decisiones y combates clave con texto original.

---

## 3. SAGA 2 — Saga de la Tierra de las Olas

Contenido a implementar: Zabuza y Haku; primer arco de combate serio; introducción al concepto de "shinobi que protege a otros"; primer jutsu elemental relevante para el jugador (conectado al árbol de jutsus de la Fase 2). Incluir el flashback del pasado de Haku como cinemática simplificada (ver sección 1).

Esta saga debe incluir al menos un combate de jefe (Zabuza o Haku) con mecánicas ligeramente superiores a los enemigos de prueba de fases anteriores, para validar que el motor de combate escala bien narrativamente.

---

## 4. SISTEMA DE MISIONES (versión inicial — solo principales)

### 4.1 Tipos de misión en esta fase
- **Misiones principales**: avanzan la historia, ligadas a los capítulos de las dos sagas de esta fase, no opcionales

> Nota: las misiones secundarias por rango (D, C, B, A) y las misiones de entrenamiento ligadas a jutsus avanzados se añaden en la Fase 4. Aquí solo necesitas que el sistema funcione con las misiones principales de estas dos sagas.

### 4.2 Estructura de datos de una misión
Cada misión definida como objeto con: id, tipo/rango, descripción, objetivos (lista de sub-tareas con estado completado/pendiente), recompensas (experiencia, dinero/ryo, ítems, pergaminos de jutsu), NPC que la otorga, requisitos previos (nivel, misión anterior completada, flag de historia)

### 4.3 Diario de misiones (UI)
- Pantalla de registro de misiones activas y completadas, con seguimiento de objetivos en tiempo real, accesible desde el menú principal del juego

---

## 5. EXPLORACIÓN — Mapas de esta fase

- **Konoha** como hub central: NPCs, tiendas (conectando el inventario de la Fase 2 a una tienda real comprable/vendible), casas de personajes
- **País de las Olas**: mapa de la Saga 2, con el puente como locación clave para el combate final de esta saga

Interacción con NPCs para diálogos secundarios, misiones, lore opcional, usando el sistema de diálogo construido en la sección 1.

---

## ENTREGABLE DE ESTA FASE

Al terminar, deberías tener un inicio de juego jugable de principio a fin: el jugador crea o controla a Naruto, pasa por la Academia y la prueba de los cascabeles con diálogos y elecciones reales, viaja a Konoha como hub explorable con NPCs y tienda funcional, recibe y completa misiones principales en su diario de misiones, viaja al País de las Olas, y resuelve el arco de Zabuza/Haku con un combate de jefe.

Cuando esto funcione, continúa con el archivo de **Fase 4 — Exámenes Chunin + Invasión**.
