# FASE 5 — Búsqueda de Tsunade + Rescate de Sasuke — "Shinobi Chronicles" (RPG de Naruto)

> Esta es la Fase 5 de 7. Requiere que las Fases 1 a 4 ya estén construidas. Aquí se cierra la Parte 1 de la historia con el combate de jefe final Naruto vs Sasuke, y se introduce el concepto de Ninjutsu Médico.

---

## 0. CONTEXTO GENERAL (recordatorio del proyecto completo)

Estás trabajando sobre "Shinobi Chronicles", un RPG narrativo 2D del universo Naruto. Stack: HTML5 + JavaScript (Phaser.js recomendado), Canvas/WebGL, persistencia en localStorage/IndexedDB, contenido en JSON separado de la lógica del motor.

---

## OBJETIVO DE ESTA FASE

Construir las dos sagas que cierran la Parte 1 de la historia: la Búsqueda de Tsunade y el Rescate de Sasuke, culminando en el combate de jefe más importante hasta este punto del juego (Naruto vs Sasuke en el Valle del Fin).

---

## 1. SAGA 5 — Saga de la Búsqueda de Tsunade

Contenido a implementar:
- Viaje por el mundo exterior (nuevos mapas de exploración fuera de Konoha, usando el motor de exploración base)
- Introducción de Tsunade y su sistema de **Ninjutsu Médico**: este es un nuevo subtipo de jutsu (dentro de la categoría Ninjutsu ya existente desde Fase 1-2) enfocado en curación y revitalización, que debe añadirse al árbol de jutsus como una rama disponible para personajes con afinidad médica (Sakura es la candidata narrativa natural para empezar a aprender esta rama, sembrando su progresión futura)
- Enfrentamientos contra Akatsuki (Itachi y Kisame): tratar como **presentación narrativa de alto impacto**, no como combate completo de jefe — pueden ser combates de "huida" o de derrota intencional narrativa (el jugador no está destinado a ganar este encuentro, similar al anime), usando el sistema de cinemática simplificada ya construido

---

## 2. SAGA 6 — Saga del Rescate de Sasuke

Contenido a implementar:
- Defección de Sasuke como evento narrativo de alto impacto, conectado al flag `flag_sasuke_sello_maldito` establecido en la Fase 4
- Formación del equipo de rescate (combates grupales adicionales contra el Sonido de los Cuatro, reutilizando y expandiendo el sistema de combates 3v3 de la Fase 4)
- **Batalla final Naruto vs Sasuke** en el Valle del Fin: combate de jefe con mecánicas únicas
  - Debe introducirse aquí la **forma 1 del Zorro de las Nueve Colas** como transformación temporal de combate para Naruto: un estado especial (similar en estructura al futuro Modo Sabio de Fase 6, pero conceptualmente distinto) que aumenta temporalmente estadísticas de Naruto a cambio de algún costo o riesgo narrativo (ej. drenaje de HP propio, o un temporizador de duración), reforzando la idea de que es un poder peligroso e inestable, no una mejora gratuita
  - Sasuke como jefe debe usar el Sello Maldito (Nivel 2 si se desea profundidad) con jutsus propios de su árbol (Chidori como técnica central de este combate)

---

## 3. PROGRESIÓN — Rama de Ninjutsu Médico

- Definir formalmente en el árbol de jutsus (estructura ya existente desde Fase 2) jutsus médicos: técnicas de curación de HP en combate, remoción de estados alterados (sinergiza con el sistema de Genjutsu de Fase 4 — un jutsu médico podría servir para "liberar chakra" y romper un genjutsu en un aliado), y reanimación de aliados caídos en combates grupales

---

## ENTREGABLE DE ESTA FASE

Al terminar, deberías tener: las dos sagas jugables completas, con el viaje de búsqueda de Tsunade y la presentación de Akatsuki como momentos narrativos memorables (sin ser combates ganables), la rama de Ninjutsu Médico disponible en el árbol de jutsus, el evento de defección de Sasuke conectado correctamente al flag de historia previo, y el combate de jefe final Naruto vs Sasuke en el Valle del Fin funcionando con la transformación especial del Zorro de las Nueve Colas y el Sello Maldito de Sasuke.

Cuando esto funcione, continúa con el archivo de **Fase 6 — Transición y Shippuden**, donde se construye el sistema de Energía Natural y el Modo Sabio.
