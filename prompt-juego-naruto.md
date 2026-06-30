# PROMPT MAESTRO — Desarrollo de "Shinobi Chronicles": RPG completo del universo Naruto

> **Cómo usar este documento:** esto es un prompt de diseño técnico, no una orden de "hazlo todo de una vez". Pégalo completo al inicio de una conversación con una IA de código (o dáselo a un desarrollador) y luego pide que se ejecute **fase por fase**, siguiendo el roadmap de la sección 11. Si pides "hazlo todo" en un solo mensaje, cualquier IA va a recortar alcance sin avisarte; pidiendo fase por fase, no se pierde nada de lo que está descrito aquí.

---

## 0. ROL Y CONTEXTO GENERAL

Actúa como un equipo de desarrollo de videojuegos senior, compuesto por: game designer, narrative designer, combat systems engineer, y full-stack web developer. Tu tarea es diseñar y construir, de forma iterativa, un RPG narrativo 2D ambientado en el universo de Naruto, titulado **"Shinobi Chronicles"**, que cubra la historia completa desde la Academia Ninja hasta el arranque de Naruto Shippuden (con posibilidad de expansión posterior).

**Stack tecnológico recomendado:**
- Frontend: HTML5 + JavaScript (vanilla o con un framework ligero tipo Phaser.js para el motor 2D, manejo de sprites, colisiones y cámaras)
- Renderizado: Canvas API o WebGL vía Phaser
- Persistencia: localStorage / IndexedDB para guardado de partida (o backend simple en Node.js + JSON/SQLite si se requiere multiplataforma)
- Estructura de datos: JSON para definir personajes, jutsus, misiones, diálogos y mapas, de forma que el contenido narrativo esté separado del código (facilita añadir capítulos sin tocar el motor)
- Arquitectura: separar en módulos independientes — Motor de Combate, Motor de Diálogo/Historia, Motor de Mundo/Exploración, Motor de Progresión (chakra/jutsus/niveles), Motor de Misiones — comunicados por un Game State central

**Principio de diseño no negociable:** todo el contenido (capítulos, diálogos, jutsus, misiones) debe vivir en archivos de datos editables (JSON/JS de configuración), nunca hardcodeado dentro de la lógica del motor. Esto permite ir agregando "Saga 1", "Saga 2", etc. sin reescribir sistemas.

---

## 1. NARRATIVA — Historia capítulo por capítulo

Estructura la historia en **sagas**, cada una dividida en **capítulos jugables**, replicando el arco narrativo original pero adaptado a formato de juego (no se trata de transcribir diálogos textuales del anime/manga, sino de recrear las escenas, decisiones y combates clave con texto original).

### Sagas a implementar (en orden):

1. **Saga de la Academia** — introducción de Naruto, Sasuke, Sakura; graduación; formación del Equipo 7; prueba de Kakashi de los cascabeles (tutorial de combate y trabajo en equipo)
2. **Saga de la Tierra de las Olas** — Zabuza y Haku; primer arco de combate serio; introducción al concepto de "shinobi que protege a otros"; primer jutsu elemental relevante
3. **Saga de los Exámenes Chunin** — Examen escrito (minijuego de decisiones/infiltración), Bosque de la Muerte (survival/exploración con enemigos), preliminares (combates 1v1 contra NPCs con IA), torneo final
4. **Saga de la Invasión de Konoha** — Orochimaru, muerte del Tercer Hokage (escena narrativa de alto impacto), introducción del Sello Maldito en Sasuke
5. **Saga de la Búsqueda de Tsunade** — viaje por el mundo exterior, introducción de Tsunade y su sistema de Ninjutsu Médico, enfrentamientos contra Akatsuki (Itachi y Kisame, presentación, no combate completo)
6. **Saga del Rescate de Sasuke** — defección de Sasuke, batalla final Naruto vs Sasuke (combate de jefe con mecánicas únicas: forma 1 del Zorro de las Nueve Colas)
7. **Transición/Salto temporal** — entrenamiento con Jiraiya (montaje narrativo + desbloqueo de nuevas mecánicas)
8. **Inicio de Shippuden** — regreso de Naruto, rescate de Gaara, introducción formal del **Modo Sabio** y la nueva energía natural (ver sección 4)

### Requisitos narrativos por capítulo:

- Cada capítulo debe tener: objetivo claro, al menos un combate o desafío de habilidad, al menos una escena de diálogo con elección del jugador (aunque no cambie el final, debe afectar diálogo posterior o relación con personajes), y un cierre que conecte con el capítulo siguiente
- Sistema de diálogos con retrato de personaje, nombre, texto, y opciones de respuesta (estilo visual novel dentro del RPG)
- Sistema de "flashback" o cinemática simplificada (secuencia de imágenes/texto sin input del jugador) para escenas de alto impacto emocional (ej. pasado de Haku, pasado de Itachi)
- Variables de historia persistentes (flags) que el motor de diálogo pueda consultar: ej. `flag_rescato_a_sasuke = true`, usadas para desbloquear diálogos opcionales más adelante

---

## 2. SISTEMA DE CHAKRA

Diseña un sistema de chakra con las siguientes capas:

### 2.1 Chakra como recurso de combate
- Barra de Chakra (CHK) separada de la barra de Vida (HP), visible en HUD de combate
- El chakra se consume al usar jutsus (cada jutsu tiene un costo definido)
- El chakra se regenera lentamente fuera de combate y mínimamente dentro de combate (o no regenera en combate, a definir por balance)
- Naturalezas de chakra elementales: Fuego, Agua, Viento, Rayo, Tierra — cada personaje tiene una o dos afinidades naturales que determinan qué jutsus puede aprender y con qué bonus de daño/eficiencia

### 2.2 Control de chakra (mecánica de progresión, no solo combate)
- Ejercicios de control de chakra como minijuegos de habilidad fuera de combate: "subir el árbol" (timing/balance), "caminar sobre el agua" (timing/balance con dificultad creciente), que sirven como gating de progresión (no avanzas de nivel narrativo sin completarlos, replicando el anime)
- Estos minijuegos otorgan recompensas permanentes: aumento de chakra máximo, reducción de costo de jutsus, desbloqueo de técnicas avanzadas

### 2.3 Sellos de manos (hand seals)
- Sistema opcional pero recomendado: al ejecutar un jutsu en combate, mostrar la secuencia de sellos de mano (Rata, Buey, Tigre, etc.) como un mini quick-time-event o simplemente como animación/flavor visual, para reforzar la fantasía temática sin necesariamente añadir dificultad extra (esto puede ser un toggle de dificultad: "modo simplificado" vs "modo sellos")

---

## 3. SISTEMA DE JUTSUS — Aprendizaje y progresión

### 3.1 Estructura de datos de un Jutsu
Cada jutsu debe definirse como un objeto de datos con, como mínimo:
- Nombre, rango (E, D, C, B, A, S), tipo (Ninjutsu, Genjutsu, Taijutsu), naturaleza elemental (si aplica)
- Costo de chakra, daño base, efectos secundarios (aturdir, envenenar, reducir defensa, curar, etc.)
- Requisitos para aprenderlo: nivel mínimo, afinidad elemental, jutsus previos como prerequisito (árbol de habilidades), o evento narrativo específico (ej. el Rasengan solo se desbloquea tras la saga de entrenamiento con Jiraiya)
- Animación/efecto visual asociado en combate

### 3.2 Árbol de jutsus por personaje
- Cada personaje jugable (Naruto, Sasuke, Sakura como mínimo; idealmente extensible a Kakashi, Shikamaru, Hinata, etc. en formación de equipo) tiene su propio árbol de progresión de jutsus, no uno genérico compartido
- Puntos de habilidad otorgados al subir de nivel o completar misiones/capítulos, que se invierten en el árbol
- Jutsus icónicos obligatorios a implementar como mínimo: Henge no Jutsu, Kawarimi, Bunshin no Jutsu / Kage Bunshin no Jutsu (clones, con mecánica especial: invocar clones como aliados temporales en combate), Rasengan, Chidori, técnicas de invocación (Kuchiyose) para Naruto (sapos) y Sasuke/Kakashi (si aplica)

### 3.3 Sistema de aprendizaje activo
- No todos los jutsus se aprenden automáticamente al subir de nivel: algunos requieren un "evento de entrenamiento" jugable (minijuego de precisión, resistencia, o puzzle de timing) que simula el proceso de dominar la técnica, igual que el control de chakra de la sección 2.2
- Sistema de "pergaminos de jutsu" como ítems coleccionables/de recompensa de misión que desbloquean nuevas entradas en el árbol de habilidades

---

## 4. SISTEMA DE ENERGÍA NATURAL Y MODO SABIO (Shippuden)

Este sistema se activa narrativamente al llegar a la saga de Shippuden y debe construirse como una capa adicional sobre el sistema de chakra existente, no un reemplazo.

### 4.1 Energía Natural (Senjutsu) como tercer recurso
- Nueva barra: Energía Natural (EN), independiente de Chakra (CHK) y Vida (HP)
- La Energía Natural NO se regenera de forma pasiva como el chakra: se "absorbe" del entorno mediante un minijuego de meditación/quietud (replicando la mecánica de "estar completamente quieto para no ser detectado por los sapos sabios o por la naturaleza"), con riesgo de "transformación en piedra/sapo" si se falla el balance (mecánica de fallo cómica/temática del propio anime)

### 4.2 Desbloqueo del Modo Sabio
- Requiere una secuencia narrativa de entrenamiento específica (entrenamiento en el Monte Myoboku) como prerequisito obligatorio, con múltiples etapas:
  1. Tutorial de absorción de energía natural (minijuego de balance/timing, dificultad progresiva)
  2. Prueba de combinar Chakra + Energía Natural sin desbalancear la mezcla (minijuego de gestión de dos recursos simultáneos)
  3. Combate de prueba contra un sapo sabio como jefe tutorial
- Una vez desbloqueado, el Modo Sabio es un **estado de transformación temporal en combate**, activable consumiendo una cantidad fija de Energía Natural acumulada previamente fuera de combate (no se genera en tiempo real durante el combate, replicando la lógica del anime)

### 4.3 Efectos del Modo Sabio en combate
- Aumento de daño físico y de jutsus
- Aumento de velocidad/turnos extra (si el combate es por turnos, otorgar una ventaja de iniciativa o turno adicional)
- Percepción aumentada: revela debilidades o patrones de ataque del enemigo en la UI de combate (sinergia con el lore de "sentir el chakra y las emociones del entorno")
- Duración limitada por la reserva de Energía Natural, que se agota con cada turno/acción usada en ese estado, forzando al jugador a decidir cuándo activarlo estratégicamente

---

## 5. SISTEMA DE COMBATE (mezcla exploración + turnos)

### 5.1 Combate por turnos
- Combates 1v1 o grupales (hasta 3v3) activados al interactuar con un enemigo en el mapa de exploración (no combate aleatorio tipo "random encounter", sino encuentros diseñados y visibles)
- Orden de turnos basado en estadística de Velocidad/Agilidad de cada personaje
- Acciones disponibles por turno: Atacar (Taijutsu básico), Usar Jutsu (consume chakra, abre submenú de jutsus disponibles), Usar Ítem, Defender (reduce daño recibido, recupera algo de chakra), Huir (si aplica)
- Sistema de ventajas elementales: Fuego > Viento > Rayo > Tierra > Agua > Fuego (ciclo de counters, replicando las relaciones elementales reales del lore) que modifica daño al usar jutsus elementales contra cierto tipo de enemigo

### 5.2 Estadísticas por personaje
Mínimo: HP, Chakra, Fuerza (daño Taijutsu), Ninjutsu (daño/efectividad de jutsus), Genjutsu (poder y resistencia a ilusiones), Velocidad (orden de turno y evasión), Defensa

### 5.3 Sistema de Genjutsu
- Mecánica especial: un Genjutsu exitoso no hace daño directo, sino que aplica un estado alterado (confusión: el personaje ataca a un aliado aleatorio; parálisis: pierde un turno; ilusión de daño: ve HP reducido visualmente pero es reversible si se rompe el genjutsu con una acción específica de "liberar chakra")

### 5.4 Exploración (entre combates)
- Mapas 2D top-down o de plataformas laterales (a decidir en fase de prototipo) por cada locación: Konoha (hub central con NPCs, tiendas, casas de personajes), Bosque de la Muerte, País de las Olas, Valle del Fin, Monte Myoboku, etc.
- Interacción con NPCs para diálogos secundarios, misiones, lore opcional
- Puntos de entrenamiento visitables en el mapa (ligados a los sistemas de las secciones 2 y 4)

---

## 6. SISTEMA DE MISIONES

### 6.1 Tipos de misión
- **Misiones principales**: avanzan la historia, ligadas a los capítulos de la sección 1, no opcionales
- **Misiones secundarias/D-rank, C-rank, B-rank, A-rank**: replicando el sistema de rangos de misión del lore — recolección de ítems, escolta de NPC, combate contra enemigos menores, exploración de zona — desbloqueadas progresivamente según el rango ninja del jugador
- **Misiones de entrenamiento**: ligadas directamente a desbloquear jutsus o el Modo Sabio (secciones 3 y 4)

### 6.2 Estructura de datos de una misión
Cada misión definida como objeto con: id, tipo/rango, descripción, objetivos (lista de sub-tareas con estado completado/pendiente), recompensas (experiencia, dinero/ryo, ítems, pergaminos de jutsu), NPC que la otorga, requisitos previos (nivel, misión anterior completada, flag de historia)

### 6.3 Diario de misiones (UI)
- Pantalla de registro de misiones activas y completadas, con seguimiento de objetivos en tiempo real, accesible desde el menú principal del juego

---

## 7. PROGRESIÓN DE PERSONAJE Y EQUIPO

- Sistema de niveles con experiencia ganada en combate y al completar misiones
- Sistema de equipamiento: armas (kunai, shuriken, espadas para Sasuke), pergaminos, accesorios (bandas ninja con bonus, chalecos con defensa) que modifican estadísticas
- Sistema de formación de equipo (party): el jugador controla activamente a un personaje principal pero puede tener compañeros de IA o controlables en combates grupales (Sakura, Sasuke en el Equipo 7; otros equipos genin en el arco de Exámenes Chunin)
- Inventario y tienda en Konoha para comprar/vender ítems consumibles (píldoras de soldado para chakra, ungüentos de curación, etc.)

---

## 8. INTERFAZ DE USUARIO (UI/UX) REQUERIDA

- Menú principal: Nueva Partida / Continuar / Configuración
- HUD de exploración: retrato de personaje, HP, Chakra, minimapa o indicador de objetivo de misión activa
- HUD de combate: barras de HP/Chakra/Energía Natural de todos los combatientes, menú de acciones, log de combate (texto descriptivo de lo que ocurre turno a turno)
- Menú de personaje: estadísticas, árbol de jutsus, equipamiento
- Diario de misiones (sección 6.3)
- Pantalla de diálogo narrativo (sección 1)
- Sistema de guardado/carga de partida

---

## 9. AUDIO (especificación, no asset final)

- Especifica en el documento qué tipo de música/sonido correspondería a cada momento (tema de exploración de Konoha, tema de combate estándar, tema de combate de jefe, stings de victoria/derrota, sonido de jutsu elemental según tipo) para que pueda añadirse en una fase posterior, aunque el prototipo funcione sin audio final

---

## 10. CONSIDERACIONES DE PROPIEDAD INTELECTUAL

Este proyecto usa personajes, técnicas y terminología propiedad de Masashi Kishimoto / Shueisha / Studio Pierrot. Al construirlo:
- Mantenlo como proyecto personal/no comercial de aprendizaje o fan-game
- No reutilices assets visuales, música o texto literal extraído del anime/manga; toda narrativa de diálogo debe escribirse de forma original recreando las escenas, no transcribiendo
- Si en algún momento se piensa en publicar o monetizar, ese es un paso totalmente separado que requiere asesoría legal aparte; este documento solo cubre el diseño técnico/creativo del prototipo

---

## 11. ROADMAP DE DESARROLLO POR FASES (úsalo así, no todo de una vez)

**Fase 1 — Núcleo técnico:** motor de exploración básico + motor de combate por turnos funcional con 2-3 personajes y 4-5 jutsus de prueba, sin narrativa aún. Validar que el loop de combate y el sistema de chakra básico (sección 2.1) funcionan.

**Fase 2 — Sistema de progresión:** árbol de jutsus (sección 3), niveles y estadísticas (sección 7), minijuegos de control de chakra (sección 2.2).

**Fase 3 — Saga de la Academia + Tierra de las Olas:** primeras dos sagas narrativas completas (sección 1, puntos 1-2), con sistema de diálogo (sección 1) y primeras misiones (sección 6).

**Fase 4 — Exámenes Chunin + Invasión:** sagas 3-4, expandiendo combates grupales y genjutsu (secciones 5.3 y 5.1).

**Fase 5 — Búsqueda de Tsunade + Rescate de Sasuke:** sagas 5-6, combate de jefe final de Parte 1.

**Fase 6 — Transición y Shippuden:** entrenamiento con Jiraiya, y construcción completa del sistema de Energía Natural y Modo Sabio (sección 4), saga 8.

**Fase 7 — Pulido:** UI completa (sección 8), balance general de combate, especificación de audio (sección 9).

Pide explícitamente avanzar fase por fase: "implementemos la Fase 1" en lugar de "hazlo todo", para que cada parte se construya con la profundidad descrita arriba sin que el contexto se sature ni se recorten sistemas silenciosamente.
