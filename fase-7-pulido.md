# FASE 7 — Pulido — "Shinobi Chronicles" (RPG de Naruto)

> Esta es la Fase 7 de 7, la última del roadmap original. Requiere que las Fases 1 a 6 ya estén construidas. Aquí no se añade contenido narrativo nuevo, sino que se completa la interfaz de usuario, se balancea el combate de todo el juego, y se deja especificado el audio para una futura fase de implementación.

---

## 0. CONTEXTO GENERAL (recordatorio del proyecto completo)

Estás trabajando sobre "Shinobi Chronicles", un RPG narrativo 2D del universo Naruto. Stack: HTML5 + JavaScript (Phaser.js recomendado), Canvas/WebGL, persistencia en localStorage/IndexedDB, contenido en JSON separado de la lógica del motor.

---

## OBJETIVO DE ESTA FASE

Completar todas las pantallas de interfaz que hayan quedado como placeholders en fases anteriores, revisar el balance general de combate a través de las 8 sagas implementadas, y producir una especificación de audio detallada para que pueda añadirse en una fase de implementación de assets separada.

---

## 1. INTERFAZ DE USUARIO (UI/UX) COMPLETA

Revisar y pulir cada una de estas pantallas, construidas parcialmente en fases anteriores:
- **Menú principal**: Nueva Partida / Continuar / Configuración
- **HUD de exploración**: retrato de personaje, HP, Chakra, minimapa o indicador de objetivo de misión activa
- **HUD de combate**: barras de HP/Chakra/Energía Natural de todos los combatientes (la barra de Energía Natural se añade aquí si no se integró visualmente en la Fase 6), menú de acciones, log de combate (texto descriptivo de lo que ocurre turno a turno)
- **Menú de personaje**: estadísticas, árbol de jutsus, equipamiento
- **Diario de misiones**: revisar que refleje correctamente las misiones principales y secundarias de todas las sagas implementadas
- **Pantalla de diálogo narrativo**: revisar consistencia visual a través de las 8 sagas
- **Sistema de guardado/carga de partida**: validar que el guardado persiste correctamente todos los sistemas — flags de historia, árbol de jutsus, Energía Natural acumulada, inventario, misiones activas

---

## 2. BALANCE GENERAL DE COMBATE

- Revisar la curva de dificultad a través de las 8 sagas: ¿los combates de jefe (Zabuza/Haku en Fase 3, preliminares y torneo en Fase 4, Naruto vs Sasuke en Fase 5, sapo sabio y arco de Gaara en Fase 6) escalan de forma coherente con el nivel esperado del jugador en cada punto?
- Revisar el costo y daño de los jutsus del árbol completo (Fase 2 en adelante) para que ninguna rama sea claramente superior o inferior sin razón narrativa
- Revisar específicamente el balance del Modo Sabio (Fase 6): ¿la duración limitada por Energía Natural lo hace sentir como una decisión táctica, o se vuelve trivial/inútil en la práctica? Ajustar costos de turno en el estado de Modo Sabio si es necesario
- Revisar el balance de Genjutsu (Fase 4): ¿los estados alterados (confusión, parálisis, ilusión de daño) son lo suficientemente impactantes sin volverse frustrantes o injustos para el jugador?

---

## 3. AUDIO (especificación, no asset final)

Especificar qué tipo de música/sonido correspondería a cada momento del juego, para que pueda añadirse en una fase posterior de implementación de assets, aunque el prototipo funcione sin audio final:
- Tema de exploración de Konoha (hub principal)
- Temas de exploración por locación (País de las Olas, Bosque de la Muerte, Monte Myoboku, etc.)
- Tema de combate estándar
- Tema de combate de jefe (posiblemente distinto para cada jefe narrativo importante: Zabuza/Haku, Sasuke en el Valle del Fin, el sapo sabio tutorial)
- Stings de victoria/derrota
- Sonido de jutsu elemental según tipo (Fuego, Agua, Viento, Rayo, Tierra)
- Sonido distintivo para la activación del Modo Sabio (Fase 6), dado su peso narrativo

---

## 4. CONSIDERACIONES DE PROPIEDAD INTELECTUAL (revisión final)

Este proyecto usa personajes, técnicas y terminología propiedad de Masashi Kishimoto / Shueisha / Studio Pierrot. Antes de considerar el proyecto "terminado":
- Confirmar que se mantiene como proyecto personal/no comercial de aprendizaje o fan-game
- Confirmar que no se reutilizaron assets visuales, música o texto literal extraído del anime/manga; toda narrativa de diálogo escrita a través de las 8 sagas debe ser original recreando las escenas, no transcribiendo
- Si en algún momento se piensa en publicar o monetizar, ese es un paso totalmente separado que requiere asesoría legal aparte; este roadmap solo cubrió el diseño técnico/creativo del prototipo

---

## ENTREGABLE DE ESTA FASE (y del roadmap completo)

Al terminar esta fase, el roadmap original de 7 fases está completo: un prototipo jugable de "Shinobi Chronicles" que cubre desde la Academia Ninja hasta el inicio de Shippuden, con todos los sistemas descritos (chakra, árbol de jutsus, combate por turnos con genjutsu y elementales, Energía Natural y Modo Sabio, misiones por rango, equipo y progresión) funcionando de forma coherente, con interfaz completa y especificación de audio lista para una fase futura de producción de assets.

A partir de aquí, cualquier expansión (más sagas de Shippuden, más personajes jugables, multijugador, etc.) debería tratarse como una "Fase 8" nueva, siguiendo el mismo principio: contenido como datos separados de la lógica, y construcción fase por fase en lugar de pedir todo de una vez.
