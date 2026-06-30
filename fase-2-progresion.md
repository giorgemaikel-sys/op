# FASE 2 — Sistema de progresión — "Shinobi Chronicles" (RPG de Naruto)

> Esta es la Fase 2 de 7. Requiere que la Fase 1 (núcleo técnico: exploración + combate por turnos funcional) ya esté construida. Aquí se añade profundidad: árbol de jutsus real, minijuegos de control de chakra, niveles y equipamiento. Todavía sin narrativa — eso llega en la Fase 3.

---

## 0. CONTEXTO GENERAL (recordatorio del proyecto completo)

Estás trabajando sobre "Shinobi Chronicles", un RPG narrativo 2D del universo Naruto. Stack: HTML5 + JavaScript (Phaser.js recomendado), Canvas/WebGL, persistencia en localStorage/IndexedDB, contenido en JSON separado de la lógica del motor (jutsus, personajes, misiones como datos editables, nunca hardcodeados).

---

## OBJETIVO DE ESTA FASE

Construir el sistema de progresión que dará profundidad a los combates: árbol de jutsus por personaje, minijuegos de control de chakra como gating de progreso, sistema de niveles/experiencia, y equipamiento básico. Al terminar esta fase, el jugador debería poder progresar un personaje de forma significativa fuera de la narrativa.

---

## 1. CONTROL DE CHAKRA (minijuegos de progresión)

- Ejercicios de control de chakra como minijuegos de habilidad fuera de combate: "subir el árbol" (timing/balance), "caminar sobre el agua" (timing/balance con dificultad creciente), que sirven como gating de progresión (no se avanza de nivel narrativo sin completarlos, replicando el anime — esto se conectará a la narrativa en Fase 3, pero el minijuego en sí se construye aquí)
- Estos minijuegos otorgan recompensas permanentes: aumento de chakra máximo, reducción de costo de jutsus, desbloqueo de técnicas avanzadas

## 2. SELLOS DE MANOS (hand seals)

- Sistema opcional pero recomendado: al ejecutar un jutsu en combate, mostrar la secuencia de sellos de mano (Rata, Buey, Tigre, etc.) como un mini quick-time-event o simplemente como animación/flavor visual, para reforzar la fantasía temática sin necesariamente añadir dificultad extra (esto puede ser un toggle de dificultad: "modo simplificado" vs "modo sellos")

---

## 3. SISTEMA DE JUTSUS — Aprendizaje y progresión (versión completa)

### 3.1 Estructura de datos de un Jutsu
Cada jutsu debe definirse como un objeto de datos con, como mínimo:
- Nombre, rango (E, D, C, B, A, S), tipo (Ninjutsu, Genjutsu, Taijutsu), naturaleza elemental (si aplica)
- Costo de chakra, daño base, efectos secundarios (aturdir, envenenar, reducir defensa, curar, etc.)
- Requisitos para aprenderlo: nivel mínimo, afinidad elemental, jutsus previos como prerequisito (árbol de habilidades), o evento narrativo específico (ej. el Rasengan solo se desbloquea tras la saga de entrenamiento con Jiraiya — ese evento narrativo se conecta en Fase 6, pero el jutsu como dato debe poder definirse desde ahora)
- Animación/efecto visual asociado en combate

### 3.2 Árbol de jutsus por personaje
- Cada personaje jugable (Naruto, Sasuke, Sakura como mínimo; idealmente extensible a Kakashi, Shikamaru, Hinata, etc. en formación de equipo) tiene su propio árbol de progresión de jutsus, no uno genérico compartido
- Puntos de habilidad otorgados al subir de nivel o completar misiones/capítulos, que se invierten en el árbol
- Jutsus icónicos obligatorios a implementar como mínimo: Henge no Jutsu, Kawarimi, Bunshin no Jutsu / Kage Bunshin no Jutsu (clones, con mecánica especial: invocar clones como aliados temporales en combate), Rasengan, Chidori, técnicas de invocación (Kuchiyose) para Naruto (sapos) y Sasuke/Kakashi (si aplica)

### 3.3 Sistema de aprendizaje activo
- No todos los jutsus se aprenden automáticamente al subir de nivel: algunos requieren un "evento de entrenamiento" jugable (minijuego de precisión, resistencia, o puzzle de timing) que simula el proceso de dominar la técnica, igual que el control de chakra de la sección 1
- Sistema de "pergaminos de jutsu" como ítems coleccionables/de recompensa de misión que desbloquean nuevas entradas en el árbol de habilidades (el sistema de misiones completo llega en Fase 4, pero el ítem "pergamino" como concepto de datos se define aquí)

---

## 4. PROGRESIÓN DE PERSONAJE Y EQUIPO

- Sistema de niveles con experiencia ganada en combate (la experiencia ganada por misiones se conecta en Fase 4)
- Sistema de equipamiento: armas (kunai, shuriken, espadas para Sasuke), pergaminos, accesorios (bandas ninja con bonus, chalecos con defensa) que modifican estadísticas
- Sistema de formación de equipo (party): el jugador controla activamente a un personaje principal pero puede tener compañeros de IA o controlables en combates grupales
- Inventario básico (la tienda de Konoha conectada al mundo se construye en Fase 3, pero el sistema de inventario y los ítems consumibles como datos —píldoras de soldado para chakra, ungüentos de curación— se definen aquí)

---

## ENTREGABLE DE ESTA FASE

Al terminar, deberías tener: un menú de personaje funcional donde se puede ver el árbol de jutsus de al menos Naruto, Sasuke y Sakura, invertir puntos de habilidad ganados al subir de nivel, completar el minijuego de control de chakra para obtener una mejora permanente, equipar un ítem que modifique estadísticas, y ver esos cambios reflejados en el combate por turnos de la Fase 1.

Cuando esto funcione, continúa con el archivo de **Fase 3 — Saga de la Academia + Tierra de las Olas**.
