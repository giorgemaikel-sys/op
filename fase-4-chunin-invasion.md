# FASE 4 — Exámenes Chunin + Invasión — "Shinobi Chronicles" (RPG de Naruto)

> Esta es la Fase 4 de 7. Requiere que las Fases 1, 2 y 3 ya estén construidas (núcleo técnico, progresión, y sistema narrativo/de misiones funcionando con las primeras dos sagas). Aquí se expanden los combates grupales, el genjutsu como mecánica real, y el sistema de misiones secundarias por rango.

---

## 0. CONTEXTO GENERAL (recordatorio del proyecto completo)

Estás trabajando sobre "Shinobi Chronicles", un RPG narrativo 2D del universo Naruto. Stack: HTML5 + JavaScript (Phaser.js recomendado), Canvas/WebGL, persistencia en localStorage/IndexedDB, contenido en JSON separado de la lógica del motor.

---

## OBJETIVO DE ESTA FASE

Construir la Saga de los Exámenes Chunin y la Saga de la Invasión de Konoha, expandiendo el motor de combate con genjutsu real (estados alterados) y combates grupales más complejos, además del sistema completo de misiones por rango.

---

## 1. SISTEMA DE GENJUTSU (construcción completa — antes solo existía la estadística)

- Mecánica especial: un Genjutsu exitoso no hace daño directo, sino que aplica un estado alterado:
  - **Confusión**: el personaje ataca a un aliado aleatorio
  - **Parálisis**: pierde un turno
  - **Ilusión de daño**: ve HP reducido visualmente pero es reversible si se rompe el genjutsu con una acción específica de "liberar chakra"
- Esta mecánica se valida en el Bosque de la Muerte y en las preliminares de los Exámenes Chunin, donde varios enemigos NPC usarán Genjutsu activamente

---

## 2. SAGA 3 — Saga de los Exámenes Chunin

Contenido a implementar:
- **Examen escrito**: minijuego de decisiones/infiltración (no necesariamente un combate, sino un desafío de habilidad distinto, en línea con los minijuegos ya construidos en Fase 2 para control de chakra)
- **Bosque de la Muerte**: survival/exploración con enemigos, usando el mapa de exploración del motor base, con encuentros diseñados (no aleatorios) contra equipos rivales
- **Preliminares**: combates 1v1 contra NPCs con IA — aquí es donde se valida la IA de combate por primera vez de forma seria; los NPCs deben usar Taijutsu, Ninjutsu y Genjutsu de forma variada según el personaje
- **Torneo final**: combates de mayor dificultad, escalando estadísticas y jutsus de los oponentes

---

## 3. SAGA 4 — Saga de la Invasión de Konoha

Contenido a implementar:
- Orochimaru como personaje narrativo de alto impacto
- Muerte del Tercer Hokage (escena narrativa de alto impacto, usando el sistema de cinemática simplificada construido en Fase 3)
- Introducción del Sello Maldito en Sasuke como flag de historia persistente (`flag_sasuke_sello_maldito = true`) que deberá afectar diálogos y posiblemente estadísticas de Sasuke en sagas futuras

---

## 4. COMBATES GRUPALES EXPANDIDOS

- Validar combates de hasta 3v3 con compañeros de IA controlados parcialmente por el jugador (alternando entre personajes del equipo en el mismo combate)
- Los equipos genin rivales (de otras aldeas) deben tener su propio set de jutsus y comportamiento de IA distinto, no ser clones de las mismas estadísticas con nombre cambiado

---

## 5. SISTEMA DE MISIONES (expansión — secundarias por rango)

### 5.1 Tipos de misión añadidos en esta fase
- **Misiones secundarias D-rank, C-rank, B-rank, A-rank**: replicando el sistema de rangos de misión del lore — recolección de ítems, escolta de NPC, combate contra enemigos menores, exploración de zona — desbloqueadas progresivamente según el rango ninja del jugador
- **Misiones de entrenamiento**: ligadas directamente a desbloquear jutsus del árbol construido en Fase 2 (el Modo Sabio llega en Fase 6, todavía no aplica aquí)

Estas misiones secundarias deben poder completarse en Konoha y alrededores entre los eventos principales de las sagas 3 y 4, dando contenido opcional al jugador sin bloquear el avance narrativo.

---

## ENTREGABLE DE ESTA FASE

Al terminar, deberías tener: la saga completa de los Exámenes Chunin jugable (examen escrito, Bosque de la Muerte, preliminares con IA variada, torneo), la saga de la Invasión con sus momentos narrativos de alto impacto, genjutsu funcionando como mecánica real de estado alterado en combate, combates grupales 3v3 validados, y un sistema de misiones secundarias por rango disponible como contenido opcional en Konoha.

Cuando esto funcione, continúa con el archivo de **Fase 5 — Búsqueda de Tsunade + Rescate de Sasuke**.
