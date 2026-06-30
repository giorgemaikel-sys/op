# FASE 1 — Núcleo técnico — "Shinobi Chronicles" (RPG de Naruto)

> Esta es la Fase 1 de 7 de un proyecto mayor. En esta fase NO se construye narrativa, jutsus avanzados, ni Modo Sabio — solo el motor base que todo lo demás usará después. Si terminas esta fase y quieres seguir, la Fase 2 construye el sistema de progresión sobre esto.

---

## 0. ROL Y CONTEXTO GENERAL

Actúa como un equipo de desarrollo de videojuegos senior, compuesto por: game designer, combat systems engineer, y full-stack web developer. Tu tarea es construir el núcleo técnico de un RPG narrativo 2D ambientado en el universo de Naruto, titulado **"Shinobi Chronicles"**.

**Stack tecnológico recomendado:**
- Frontend: HTML5 + JavaScript (vanilla o con un framework ligero tipo Phaser.js para el motor 2D, manejo de sprites, colisiones y cámaras)
- Renderizado: Canvas API o WebGL vía Phaser
- Persistencia: localStorage / IndexedDB para guardado de partida (o backend simple en Node.js + JSON/SQLite si se requiere multiplataforma)
- Estructura de datos: JSON para definir personajes, jutsus, misiones, diálogos y mapas, de forma que el contenido narrativo esté separado del código (facilita añadir capítulos sin tocar el motor)
- Arquitectura: separar en módulos independientes — Motor de Combate, Motor de Diálogo/Historia, Motor de Mundo/Exploración, Motor de Progresión (chakra/jutsus/niveles), Motor de Misiones — comunicados por un Game State central

**Principio de diseño no negociable:** todo el contenido (capítulos, diálogos, jutsus, misiones) debe vivir en archivos de datos editables (JSON/JS de configuración), nunca hardcodeado dentro de la lógica del motor. Esto permite ir agregando "Saga 1", "Saga 2", etc. en fases futuras sin reescribir sistemas.

---

## OBJETIVO DE ESTA FASE

Construir y validar el loop jugable mínimo: exploración básica + combate por turnos funcional, con 2-3 personajes de prueba y 4-5 jutsus de prueba. Sin narrativa todavía — eso llega en la Fase 3.

---

## 1. SISTEMA DE CHAKRA (versión base — solo 2.1, sin minijuegos todavía)

### 1.1 Chakra como recurso de combate
- Barra de Chakra (CHK) separada de la barra de Vida (HP), visible en HUD de combate
- El chakra se consume al usar jutsus (cada jutsu tiene un costo definido)
- El chakra se regenera lentamente fuera de combate y mínimamente dentro de combate (o no regenera en combate, a definir por balance)
- Naturalezas de chakra elementales: Fuego, Agua, Viento, Rayo, Tierra — cada personaje tiene una o dos afinidades naturales que determinan qué jutsus puede aprender y con qué bonus de daño/eficiencia

> Nota: los minijuegos de control de chakra ("subir el árbol", "caminar sobre el agua") y el sistema de sellos de manos se construyen en la Fase 2. Aquí solo necesitas que el recurso funcione mecánicamente.

---

## 2. SISTEMA DE COMBATE POR TURNOS (versión completa de esta fase)

### 2.1 Combate por turnos
- Combates 1v1 o grupales (hasta 3v3) activados al interactuar con un enemigo en el mapa de exploración (no combate aleatorio tipo "random encounter", sino encuentros diseñados y visibles)
- Orden de turnos basado en estadística de Velocidad/Agilidad de cada personaje
- Acciones disponibles por turno: Atacar (Taijutsu básico), Usar Jutsu (consume chakra, abre submenú de jutsus disponibles), Usar Ítem, Defender (reduce daño recibido, recupera algo de chakra), Huir (si aplica)
- Sistema de ventajas elementales: Fuego > Viento > Rayo > Tierra > Agua > Fuego (ciclo de counters, replicando las relaciones elementales reales del lore) que modifica daño al usar jutsus elementales contra cierto tipo de enemigo

### 2.2 Estadísticas por personaje
Mínimo: HP, Chakra, Fuerza (daño Taijutsu), Ninjutsu (daño/efectividad de jutsus), Genjutsu (poder y resistencia a ilusiones), Velocidad (orden de turno y evasión), Defensa

> Nota: el sistema de Genjutsu como mecánica de estado alterado se expande en la Fase 4. En esta fase basta con que la estadística exista y se pueda usar para un jutsu de prueba simple.

---

## 3. JUTSUS DE PRUEBA (solo para validar el motor, no el árbol completo)

Define 4-5 jutsus de prueba como objetos de datos, con esta estructura mínima (la estructura completa con árbol de habilidades llega en Fase 2):
- Nombre, rango (E, D, C, B, A, S), tipo (Ninjutsu, Genjutsu, Taijutsu), naturaleza elemental (si aplica)
- Costo de chakra, daño base, efectos secundarios (aturdir, envenenar, reducir defensa, curar, etc.)
- Animación/efecto visual asociado en combate (puede ser un placeholder simple en esta fase)

Sugerencia de jutsus de prueba: un ataque Taijutsu básico, un jutsu elemental de Fuego, un jutsu elemental de Agua, un jutsu de curación simple, y un jutsu de Genjutsu básico (para validar que la mecánica de estadística Genjutsu responde, aunque el sistema de estados alterados completo no se construya aún).

---

## 4. EXPLORACIÓN BÁSICA

- Un mapa 2D top-down o de plataformas laterales de prueba (a decidir en este prototipo, y mantener consistente en fases futuras) — no necesita ser una locación final del juego, puede ser un mapa de prueba genérico
- Movimiento de personaje, colisiones básicas, y un enemigo interactuable en el mapa que dispare el combate por turnos al tocarlo

---

## ENTREGABLE DE ESTA FASE

Al terminar, deberías tener: un personaje moviéndose en un mapa de prueba, que al chocar con un enemigo entra a una pantalla de combate por turnos funcional, donde puede atacar, usar al menos uno de los 4-5 jutsus de prueba (gastando chakra correctamente), defenderse, y ganar o perder el combate con una pantalla de resultado. Sin narrativa, sin árbol de jutsus, sin Modo Sabio — eso viene después.

Cuando esto funcione, continúa con el archivo de **Fase 2 — Sistema de progresión**.
