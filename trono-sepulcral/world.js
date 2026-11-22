/* Crónicas del Trono Sepulcral — datos del universo.
   Nada aquí es estado de partida: son las definiciones fijas del mundo.
   El estado vivo (poblaciones, tesorerías, guerras, opiniones) nace de aquí
   en engine.js y evoluciona día a día. */
(function () {
  var W = {};

  /* ───────────────────────── CALENDARIO ───────────────────────── */
  W.cal = {
    diasMes: 30, meses: 12, diasSemana: 6, horasDia: 24,
    eraNombre: 'Era de las Cenizas',
    nombresMes: ['Grisalba', 'Vendaval', 'Siembra Pálida', 'Verdeluz', 'Solfuego', 'Altosol',
      'Cosecha Roja', 'Mustiar', 'Hojaseca', 'Velonegro', 'Hieloquedo', 'Nochelarga'],
    nombresDia: ['Álbor', 'Yunque', 'Vigilia', 'Feria', 'Umbral', 'Sosiego'],
    estaciones: [
      { n: 'Deshielo', meses: [1, 2, 3], clima: 'lluvias frías, barro, ríos crecidos' },
      { n: 'Estío', meses: [4, 5, 6], clima: 'calor seco, caminos firmes, tormentas secas' },
      { n: 'Declive', meses: [7, 8, 9], clima: 'cosecha, nieblas al alba, vientos' },
      { n: 'Mortaja', meses: [10, 11, 12], clima: 'escarcha, noches largas, hambre' }
    ],
    // Ciclos mágicos: periodo en días, efecto sobre regeneración y riesgo
    ciclos: [
      { id: 'marea', n: 'Marea de Maná', periodo: 18, fases: ['Flujo Alto', 'Flujo', 'Medio', 'Reflujo', 'Reflujo Bajo', 'Medio'] },
      { id: 'velo', n: 'Espesor del Velo', periodo: 40, fases: ['Velo Delgado', 'Velo Tenso', 'Velo Normal', 'Velo Normal', 'Velo Espeso'] },
      { id: 'hespera', n: 'Hespera (luna pálida)', periodo: 24, fases: ['Nueva', 'Creciente', 'Llena', 'Menguante'] },
      { id: 'mor', n: 'Mor (luna roja)', periodo: 90, fases: ['Oculta', 'Oculta', 'Ojo Rojo', 'Oculta', 'Oculta'] }
    ],
    festividades: [
      { m: 10, d: 10, n: 'Noche de las Lámparas', desc: 'Se alumbra a los muertos durante una noche. Los nigromantes son cazados con especial celo en la semana siguiente.' },
      { m: 1, d: 1, n: 'Ayuno de Hierro', desc: 'Nueve días sin carne ni fuego en Caldraeth. Los graneros se abren o estalla el descontento.' },
      { m: 7, d: 15, n: 'Feria de la Sal', desc: 'Grandes mercados en toda la Marca. Precios bajos, ladrones abundantes.' },
      { m: 4, d: 3, n: 'Verdeluz', desc: 'Siembra bendecida por los Cantones. Buen momento para contratar jornaleros.' },
      { m: 12, d: 28, n: 'Vigilia Larga', desc: 'La noche más larga. Se sellan puertas. Las criaturas del Velo cruzan con facilidad.' },
      { m: 6, d: 9, n: 'Día de la Llama Sellada', desc: 'La Orden del Sello Blanco hace públicas sus condenas del año.' }
    ]
  };

  /* ───────────────────────── RANGOS Y PROGRESIÓN ───────────────────────── */
  W.rangos = [
    { i: 0, n: 'Aprendiz', min: 1, max: 10, prueba: { n: 'Umbral del Primer Velo', desc: 'Sostener contacto consciente con un espíritu sin perder la voluntad.', req: 'Nigromancia ≥ 20 · Voluntad ≥ 14 · un rito de contacto completado' } },
    { i: 1, n: 'Adepto', min: 11, max: 20, prueba: { n: 'Prueba de la Mano Firme', desc: 'Mantener tres tejidos activos a la vez durante una hora sin colapso.', req: 'Control ≥ 20 · 3 hechizos propios de nivel 2 · Nigromancia ≥ 40' } },
    { i: 2, n: 'Experto', min: 21, max: 30, prueba: { n: 'Censo de los Muertos', desc: 'Catalogar y someter a once no-muertos de rango distinto.', req: 'Nigromancia ≥ 55 · 2 ramas ≥ 40 · una criatura propia de rango Experto' } },
    { i: 3, n: 'Especialista', min: 31, max: 40, prueba: { n: 'Rito del Nombre Propio', desc: 'Inscribir un principio mágico original y defenderlo ante quien pueda refutarlo.', req: 'un principio mágico descubierto · Investigación mayor completada' } },
    { i: 4, n: 'Maestro', min: 41, max: 50, prueba: { n: 'Dominio de Umbra', desc: 'Fundar y sostener un dominio espiritual propio durante un ciclo de Mor.', req: 'dominio necromántico activo · Voluntad ≥ 30' } },
    { i: 5, n: 'Gran Maestro', min: 51, max: 60, prueba: { n: 'Concilio de Pares', desc: 'Ser reconocido —o temido— por tres poderes mágicos del mundo.', req: 'reputación arcana ≥ 60 · un linaje propio establecido' } },
    { i: 6, n: 'Archimago', min: 61, max: 70, prueba: { n: 'Lectura de la Novena Mortaja', desc: 'Comprender un texto que mata a quien lo comprende a medias.', req: 'Códice descifrado ≥ mortaja VIII · Inteligencia ≥ 40' } },
    { i: 7, n: 'Trascendente', min: 71, max: 80, prueba: { n: 'Muerte Elegida', desc: 'Atravesar la propia muerte con la identidad intacta.', req: 'ancla espiritual verdadera · pacto o técnica legendaria' } },
    { i: 8, n: 'Legendario', min: 81, max: 90, prueba: { n: 'Peso en la Historia', desc: 'Cambiar el destino de una civilización de forma que se escriba.', req: 'un reino o imperio bajo influencia directa' } },
    { i: 9, n: 'Mítico', min: 91, max: 100, prueba: { n: 'El Trono Sepulcral', desc: 'Ocupar lo que nunca estuvo vacío.', req: 'desconocido' } }
  ];

  W.stats = [
    { id: 'vit', n: 'Vitalidad', f: 'Capacidad para soportar daño', tipo: 'fis' },
    { id: 'man', n: 'Maná', f: 'Energía mágica disponible', tipo: 'mag' },
    { id: 'mrg', n: 'Regeneración de maná', f: 'Recuperación de maná por hora', tipo: 'mag' },
    { id: 'fue', n: 'Fuerza', f: 'Capacidad física', tipo: 'fis' },
    { id: 'vel', n: 'Velocidad', f: 'Movimiento y reacción', tipo: 'fis' },
    { id: 'res', n: 'Resistencia', f: 'Soportar esfuerzo y privación', tipo: 'fis' },
    { id: 'int', n: 'Inteligencia', f: 'Aprendizaje y razonamiento', tipo: 'men' },
    { id: 'vol', n: 'Voluntad', f: 'Resistencia mental y espiritual', tipo: 'men' },
    { id: 'per', n: 'Percepción', f: 'Detectar información', tipo: 'men' },
    { id: 'ctl', n: 'Control mágico', f: 'Precisión al tejer magia', tipo: 'mag' },
    { id: 'afi', n: 'Afinidad mágica', f: 'Compatibilidad con escuelas', tipo: 'mag' },
    { id: 'car', n: 'Carisma', f: 'Influencia social', tipo: 'soc' },
    { id: 'sue', n: 'Suerte', f: 'Influencia limitada en probabilidades', tipo: 'soc' }
  ];

  /* ───────────────────────── ESCUELAS MÁGICAS ───────────────────────── */
  // cat: elemental | espiritual | avanzada ; dif: dificultad base de aprendizaje
  W.escuelas = [
    { id: 'fuego', n: 'Fuego', cat: 'elemental', dif: 3, desc: 'Combustión y calor. Barata, ruidosa, difícil de controlar.' },
    { id: 'agua', n: 'Agua', cat: 'elemental', dif: 3, desc: 'Presión, flujo y pureza.' },
    { id: 'aire', n: 'Aire', cat: 'elemental', dif: 3, desc: 'Presión, voz y asfixia.' },
    { id: 'tierra', n: 'Tierra', cat: 'elemental', dif: 3, desc: 'Peso, cimiento, sepultura.' },
    { id: 'hielo', n: 'Hielo', cat: 'elemental', dif: 4, desc: 'Lentitud y conservación. Afín a la nigromancia por la conservación del cuerpo.' },
    { id: 'rayo', n: 'Electricidad', cat: 'elemental', dif: 5, desc: 'Impulso nervioso. Afín a la animación de cadáveres.' },
    { id: 'lava', n: 'Lava', cat: 'elemental', dif: 6, desc: 'Fusión de fuego y tierra. Requiere ambas.' },
    { id: 'natura', n: 'Naturaleza', cat: 'elemental', dif: 4, desc: 'Crecimiento y putrefacción. Los Cantones la guardan con celo.' },
    { id: 'metal', n: 'Metal', cat: 'elemental', dif: 5, desc: 'Forja, filo y conducción. Base de los gólems de Dûm Varag.' },
    { id: 'nigro', n: 'Nigromancia', cat: 'espiritual', dif: 7, desc: 'La frontera entre lo que fue y lo que aún obedece.' },
    { id: 'espiritu', n: 'Magia espiritual', cat: 'espiritual', dif: 6, desc: 'Trato con lo que no tiene cuerpo.' },
    { id: 'almas', n: 'Magia de almas', cat: 'espiritual', dif: 9, desc: 'Lo que la mayoría de reinos castiga con la hoguera.' },
    { id: 'sombra', n: 'Sombras', cat: 'espiritual', dif: 5, desc: 'Ocultación, filo y frío.' },
    { id: 'luz', n: 'Luz', cat: 'espiritual', dif: 5, desc: 'Revelación y quemadura. Opuesta operativa de la sombra.' },
    { id: 'demon', n: 'Magia demoníaca', cat: 'espiritual', dif: 8, desc: 'Poder prestado. Siempre hay contrato.' },
    { id: 'sagrada', n: 'Magia sagrada', cat: 'espiritual', dif: 7, desc: 'Préstamo de una voluntad mayor. Incompatible con robar almas.' },
    { id: 'maldi', n: 'Maldiciones', cat: 'espiritual', dif: 6, desc: 'Daño diferido, causalidad torcida.' },
    { id: 'sello', n: 'Sellado', cat: 'espiritual', dif: 7, desc: 'Encerrar lo que no se puede destruir.' },
    { id: 'espacio', n: 'Magia espacial', cat: 'avanzada', dif: 8, desc: 'Distancia como material maleable.' },
    { id: 'tiempo', n: 'Magia temporal', cat: 'avanzada', dif: 10, desc: 'Prohibida en todas partes por buenas razones.' },
    { id: 'dimension', n: 'Magia dimensional', cat: 'avanzada', dif: 9, desc: 'Puertas. Lo difícil es cerrarlas.' },
    { id: 'runa', n: 'Magia rúnica', cat: 'avanzada', dif: 5, desc: 'Magia escrita que no necesita mago presente.' },
    { id: 'invoca', n: 'Invocación', cat: 'avanzada', dif: 6, desc: 'Traer y sostener lo que no pertenece aquí.' },
    { id: 'barrera', n: 'Barreras', cat: 'avanzada', dif: 5, desc: 'Negar el paso. La escuela que salva vidas.' },
    { id: 'ilusion', n: 'Ilusión', cat: 'avanzada', dif: 4, desc: 'Administrar lo que otros creen percibir.' },
    { id: 'transmu', n: 'Transmutación', cat: 'avanzada', dif: 7, desc: 'Cambiar lo que una cosa es.' },
    { id: 'encanta', n: 'Encantamiento', cat: 'avanzada', dif: 5, desc: 'Fijar magia en materia. Oficio rentable.' },
    { id: 'creacion', n: 'Creación', cat: 'avanzada', dif: 9, desc: 'Hacer existir. Casi nadie lo logra limpiamente.' },
    { id: 'destruc', n: 'Destrucción', cat: 'avanzada', dif: 8, desc: 'Deshacer sin residuo.' },
    { id: 'gravedad', n: 'Gravedad', cat: 'avanzada', dif: 8, desc: 'Peso como orden negociable.' },
    { id: 'causal', n: 'Causalidad', cat: 'avanzada', dif: 10, desc: 'Se dice que tres personas la entendieron. Ninguna sigue viva.' },
    { id: 'osteo', n: 'Osteotecnia', cat: 'avanzada', dif: 6, desc: 'Escuela original de Dûm Varag: ingeniería aplicada al hueso y al armazón.', oculta: true },
    { id: 'memoria', n: 'Magia de memoria', cat: 'avanzada', dif: 8, desc: 'Lo que se recuerda sostiene lo que existe. Los Velnari la usan como moneda.', oculta: true }
  ];

  /* ───────────────────────── RAMAS DE NIGROMANCIA ───────────────────────── */
  W.ramas = [
    { id: 'invo_nm', n: 'Invocación de no-muertos', req: 0, desc: 'Levantar lo que ya está muerto. La puerta de entrada.' },
    { id: 'ctrl_nm', n: 'Control de no-muertos', req: 8, desc: 'Que obedezcan sin consumir tu atención entera.' },
    { id: 'comando', n: 'Comandancia de ejércitos', req: 30, desc: 'Mandar decenas sin que se deshagan en el camino.' },
    { id: 'almas_m', n: 'Manipulación de almas', req: 25, desc: 'Lo que convierte a un nigromante en un problema político.' },
    { id: 'esp_nm', n: 'Nigromancia espiritual', req: 12, desc: 'Tratar con lo incorpóreo sin cuerpo que lo ancle.' },
    { id: 'maldi_nm', n: 'Maldiciones necrománticas', req: 15, desc: 'Daño que camina solo.' },
    { id: 'sello_nm', n: 'Sellado de espíritus', req: 20, desc: 'Encerrar sin destruir. Técnica defensiva esencial.' },
    { id: 'guard', n: 'Construcción de guardianes', req: 18, desc: 'Centinelas que no duermen ni piden paga.' },
    { id: 'elem_nm', n: 'Nigromancia elemental', req: 28, desc: 'Injertar elemento en materia muerta.' },
    { id: 'dim_nm', n: 'Nigromancia dimensional', req: 45, desc: 'Mover muertos por donde los vivos no pasan.' },
    { id: 'thanat', n: 'Investigación de la muerte', req: 5, desc: 'Entender el proceso, no solo usarlo. La rama que hace avanzar todas las demás.' },
    { id: 'crea_cr', n: 'Creación de criaturas', req: 20, desc: 'Construir un ser desde piezas y principios.' },
    { id: 'mod_cr', n: 'Modificación de criaturas', req: 26, desc: 'Reescribir lo ya creado sin matarlo.' },
    { id: 'evo_cr', n: 'Evolución de criaturas', req: 35, desc: 'Permitir que una creación crezca más allá de su diseño.' },
    { id: 'fusion', n: 'Fusión de especies', req: 40, desc: 'Híbridos estables. La mayoría no lo son.' },
    { id: 'linaje', n: 'Creación de linajes', req: 50, desc: 'Especies que se reproducen sin ti.' },
    { id: 'terr_esp', n: 'Dominio de territorios espirituales', req: 42, desc: 'Reclamar suelo en el otro lado.' },
    { id: 'dominio', n: 'Construcción de dominios necrománticos', req: 55, desc: 'Un lugar donde tus reglas pesan más que las del mundo.' },
    { id: 'resurr', n: 'Resurrección', req: 60, desc: 'Traer de vuelta algo que siga siendo quien era. Casi nunca funciona.' },
    { id: 'transf', n: 'Transferencia espiritual', req: 48, desc: 'Cambiar de recipiente. La base de toda forma de no morir.' },
    { id: 'artef', n: 'Artefactos necrománticos', req: 22, desc: 'Fijar muerte en objeto.' }
  ];

  /* ───────────────────────── CONTINENTES Y DIMENSIONES ───────────────────────── */
  W.continentes = [
    { id: 'val', n: 'Valdrath', desc: 'Llanuras y bosques templados, reinos feudales en decadencia, catedrales y deudas.', conocido: true },
    { id: 'kal', n: 'Kaldrun', desc: 'Fiordos, tundra y túmulos. Los clanes entierran a sus reyes de pie.', conocido: true },
    { id: 'sar', n: 'Sarmeth', desc: 'Desierto de vidrio y ciudades-oasis. La muerte se administra, no se esconde.', conocido: true },
    { id: 'ixt', n: 'Ixtal', desc: 'Selva, pirámides y un imperio que paga su magia con sangre contada.', conocido: false },
    { id: 'oru', n: 'Oruva', desc: 'Archipiélago de niebla. Nadie gobierna el agua.', conocido: false },
    { id: 'ajh', n: "Aj'Harath", desc: 'Nombre que aparece en mapas rotos. El mar que lo rodea devuelve los barcos vacíos.', conocido: false },
    { id: 'dum', n: 'Dûm Varag', desc: 'Reinos bajo la montaña. Forjan armazones que caminan.', conocido: false },
    { id: 'sim', n: 'Las Simas Lívidas', desc: 'Profundidad sin fondo conocido. Allí la memoria se compra.', conocido: false }
  ];

  W.dimensiones = [
    { id: 'velo', n: 'El Velo', desc: 'Membrana entre vivos y muertos. Se espesa y se adelgaza con un ciclo de cuarenta días.', conocido: true, acceso: 'Nigromancia espiritual ≥ 15' },
    { id: 'marchas', n: 'Las Marchas Grises', desc: 'Llanura sin horizonte por donde caminan las almas que todavía recuerdan su nombre.', conocido: false, acceso: 'Proyección espiritual o muerte' },
    { id: 'hornos', n: 'Los Hornos Pálidos', desc: 'Plano de contratos. El fuego es un detalle administrativo.', conocido: false, acceso: 'Pacto demoníaco' },
    { id: 'jardin', n: 'El Jardín Invertido', desc: 'Reino feérico corrompido. Las raíces crecen hacia el cielo.', conocido: false, acceso: 'Puertas estacionales' },
    { id: 'osario_p', n: 'El Osario Profundo', desc: 'Ciudad que no está del todo en este mundo ni en el otro.', conocido: false, acceso: 'desconocido' },
    { id: 'el_fuego', n: 'Plano Elemental del Fuego', desc: 'Mar de combustión. Allí el aire arde por costumbre.', conocido: false, acceso: 'Magia dimensional ≥ 40' },
    { id: 'el_tierra', n: 'Plano Elemental de la Piedra', desc: 'Sólido infinito con galerías que nadie cavó.', conocido: false, acceso: 'Magia dimensional ≥ 40' },
    { id: 'el_agua', n: 'Plano Elemental del Agua', desc: 'Profundidad sin superficie.', conocido: false, acceso: 'Magia dimensional ≥ 40' },
    { id: 'el_aire', n: 'Plano Elemental del Viento', desc: 'Caída perpetua entre islas de nube petrificada.', conocido: false, acceso: 'Magia dimensional ≥ 40' },
    { id: 'afuera', n: 'El Afuera', desc: 'No es un lugar. Es lo que hay cuando quitas el lugar.', conocido: false, acceso: 'No recomendado' }
  ];

  /* ───────────────────────── POTENCIAS POLÍTICAS ───────────────────────── */
  // pob: población inicial; tes: tesorería (coronas de oro); est: estabilidad 0-100;
  // mil: fuerza militar; act: actitud hacia la nigromancia (-100 persecución / +100 institución)
  W.polities = [
    {
      id: 'cal', n: 'Reino de Caldraeth', cont: 'val', tipo: 'Monarquía feudal', pob: 2850000, tes: 41000, est: 54, mil: 62, act: -70,
      cap: 'Thornhal', conocido: true, lider: 'npc_aldric',
      desc: 'Un reino viejo con buenos caminos y malas cuentas. El rey Aldric IV lleva dos años enfermo y sus barones ya cuentan votos.',
      metas: ['Cobrar los atrasos de la Marca de Grisbrial', 'Evitar la guerra abierta con Mornavar', 'Resolver la sucesión sin sangre'],
      recursos: { grano: 70, hierro: 55, madera: 60, mana: 25 }
    },
    {
      id: 'mor', n: 'Principado de Mornavar', cont: 'val', tipo: 'Principado militarista', pob: 1620000, tes: 73000, est: 71, mil: 88, act: -40,
      cap: 'Hagenmarch', conocido: true, lider: 'npc_hagen',
      desc: 'Infantería profesional pagada a tiempo. Eso lo explica casi todo.',
      metas: ['Anexionar la Marca de Grisbrial', 'Comprar la neutralidad de Fonteclara', 'Modernizar la artillería rúnica'],
      recursos: { grano: 45, hierro: 85, madera: 40, mana: 35 }
    },
    {
      id: 'fon', n: 'República Letrada de Fonteclara', cont: 'val', tipo: 'Oligarquía académica', pob: 410000, tes: 96000, est: 66, mil: 30, act: -25,
      cap: 'Fonteclara', conocido: true, lider: 'npc_volz',
      desc: 'Una ciudad que vende conocimiento y compra tranquilidad. Su Academia decide qué magia es respetable.',
      metas: ['Mantener el monopolio de la certificación mágica', 'Recuperar textos de la Ruina de Ranhollow', 'No elegir bando en la guerra que viene'],
      recursos: { grano: 20, hierro: 25, madera: 30, mana: 80 }
    },
    {
      id: 'ash', n: 'Ducado de Cenizahonda', cont: 'val', tipo: 'Ducado minero', pob: 740000, tes: -9000, est: 38, mil: 41, act: -55,
      cap: 'Cenizahonda', conocido: true, lider: 'npc_duque',
      desc: 'Vetas agotándose, deuda con Fonteclara y mineros que ya no creen en promesas.',
      metas: ['Renegociar la deuda', 'Abrir vetas en el Páramo de los Siete Túmulos', 'Sofocar el sindicato de las galerías'],
      recursos: { grano: 25, hierro: 90, madera: 35, mana: 20 }
    },
    {
      id: 'llb', n: 'Sede de la Llama Blanca', cont: 'val', tipo: 'Teocracia', pob: 520000, tes: 58000, est: 80, mil: 55, act: -100,
      cap: 'Alvermont', conocido: true, lider: 'npc_kant',
      desc: 'No es el reino más grande ni el más rico, pero su Orden del Sello Blanco tiene jurisdicción en seis fronteras.',
      metas: ['Erradicar la nigromancia en Valdrath', 'Recuperar el Códice de las Nueve Mortajas', 'Canonizar la Ruina como castigo divino'],
      recursos: { grano: 40, hierro: 45, madera: 30, mana: 50 }
    },
    {
      id: 'ver', n: 'Confederación de los Verdes Cantones', cont: 'val', tipo: 'Confederación rural', pob: 680000, tes: 12000, est: 62, mil: 35, act: -30,
      cap: 'Asamblea de Rodal', conocido: true, lider: 'npc_rodal',
      desc: 'Catorce cantones que se reúnen dos veces al año y discuten el resto del tiempo.',
      metas: ['Impedir las talas de Mornavar', 'Mantener los pactos con el bosque', 'Evitar un rey'],
      recursos: { grano: 80, hierro: 15, madera: 95, mana: 40 }
    },
    {
      id: 'kjl', n: 'Clanes del Jarl Pálido', cont: 'kal', tipo: 'Confederación de clanes', pob: 390000, tes: 7000, est: 45, mil: 70, act: 20,
      cap: 'Hrafnvik', conocido: true, lider: 'npc_jarl',
      desc: 'Entierran a sus reyes de pie y con arma. Alguien se da cuenta, cada tantas generaciones, de que siguen de pie.',
      metas: ['Unificar los clanes bajo un solo Jarl', 'Saquear las costas de Caldraeth antes del invierno', 'Impedir que se abran los túmulos del norte'],
      recursos: { grano: 20, hierro: 50, madera: 55, mana: 30 }
    },
    {
      id: 'hra', n: 'Las Cumbres de Hraun', cont: 'kal', tipo: 'Desconocido', pob: 4000, tes: 0, est: 90, mil: 95, act: 0,
      cap: '—', conocido: false, lider: null,
      desc: 'Gigantes de piedra que no han bajado de las cumbres en seiscientos años. Nadie sabe por qué subieron.',
      metas: ['desconocidas'], recursos: { grano: 5, hierro: 60, madera: 10, mana: 70 }
    },
    {
      id: 'nvd', n: 'Califato de los Nueve Vidrios', cont: 'sar', tipo: 'Imperio mercantil-mago', pob: 3400000, tes: 210000, est: 74, mil: 72, act: 60,
      cap: 'Qalat Sihr', conocido: true, lider: 'npc_califa',
      desc: 'Aquí la nigromancia tiene licencia, impuesto y colegio profesional. Se llama Custodia de Ancestros y pagar por ella es más barato que la hoguera.',
      metas: ['Controlar la ruta de componentes del norte', 'Censar a todo custodio no registrado', 'Comprar la Academia de Fonteclara pieza a pieza'],
      recursos: { grano: 50, hierro: 40, madera: 15, mana: 90 }
    },
    {
      id: 'sal', n: 'Ciudades Libres de la Sal', cont: 'sar', tipo: 'Liga comercial', pob: 880000, tes: 134000, est: 58, mil: 38, act: 10,
      cap: 'Mar Tashid', conocido: false, lider: null,
      desc: 'Nueve puertos que votan con monedas.',
      metas: ['Romper el monopolio del Califato', 'Financiar cualquier guerra ajena'], recursos: { grano: 35, hierro: 30, madera: 20, mana: 45 }
    },
    {
      id: 'ixm', n: 'Imperio de Ixtalan', cont: 'ixt', tipo: 'Imperio teocrático', pob: 4100000, tes: 88000, est: 69, mil: 85, act: 40,
      cap: 'Tlacan Xi', conocido: false, lider: null,
      desc: 'Cuentan la sangre con exactitud de contables. Su magia funciona.',
      metas: ['Expandirse al sur de Kuayan', 'Abrir la Séptima Puerta', 'Impedir el regreso de los Reyes de Hueso'],
      recursos: { grano: 75, hierro: 35, madera: 85, mana: 85 }
    },
    {
      id: 'kua', n: 'Reinos Selváticos de Kuayan', cont: 'ixt', tipo: 'Reinos fragmentados', pob: 1200000, tes: 9000, est: 33, mil: 40, act: 15,
      cap: '—', conocido: false, lider: null, desc: 'Once coronas pequeñas que se alían contra Ixtalan y se traicionan entre sí.',
      metas: ['Sobrevivir al próximo ciclo de tributos'], recursos: { grano: 60, hierro: 10, madera: 90, mana: 50 }
    },
    {
      id: 'orv', n: 'Hermandad de las Mareas', cont: 'oru', tipo: 'Talasocracia pirata', pob: 230000, tes: 31000, est: 40, mil: 52, act: 25,
      cap: 'Fondeadero Negro', conocido: false, lider: null, desc: 'Reparten el botín en asamblea y rezan a algo que vive abajo.',
      metas: ['Hundir la flota de la Sal', 'Encontrar la isla que se mueve'], recursos: { grano: 25, hierro: 20, madera: 45, mana: 35 }
    },
    {
      id: 'dvg', n: 'Reinos Forjaprofunda de Dûm Varag', cont: 'dum', tipo: 'Monarquías gremiales', pob: 620000, tes: 175000, est: 77, mil: 68, act: -10,
      cap: 'Khadr Dûm', conocido: false, lider: null,
      desc: 'Perfeccionaron el armazón que camina sin alma dentro. Niegan que sea nigromancia y técnicamente tienen razón.',
      metas: ['Reabrir la Vía Undécima', 'Vender gólems a los dos bandos de la guerra que viene'],
      recursos: { grano: 10, hierro: 100, madera: 5, mana: 60 }
    },
    {
      id: 'vln', n: 'Dominio Velnari', cont: 'sim', tipo: 'Aristocracia esclavista', pob: 310000, tes: 64000, est: 61, mil: 66, act: 70,
      cap: 'Thal Veln', conocido: false, lider: null,
      desc: 'Compran y venden recuerdos. Un siervo sin pasado no se escapa, porque no sabe a dónde volvería.',
      metas: ['Abrir una ruta a la superficie de Valdrath', 'Capturar magos de memoria vivos'],
      recursos: { grano: 20, hierro: 45, madera: 0, mana: 95 }
    },
    {
      id: 'osp', n: 'El Osario Profundo', cont: 'sim', tipo: 'Concilio no-muerto', pob: 0, tes: 0, est: 95, mil: 90, act: 100,
      cap: 'Las Siete Coronas', conocido: false, lider: 'npc_sexto',
      desc: 'Siete tronos. Seis ocupados. La ciudad no come, no duerme y no tiene prisa.',
      metas: ['Esperar', 'Recuperar la Quinta Corona', 'Que nadie abra la Novena Mortaja antes de tiempo'],
      recursos: { grano: 0, hierro: 30, madera: 0, mana: 100 }
    }
  ];

  /* ───────────────────────── ORGANIZACIONES ───────────────────────── */
  W.orgs = [
    { id: 'osb', n: 'Orden del Sello Blanco', pol: 'llb', ideo: 'La muerte es una frontera y las fronteras se vigilan.', poder: 72, inf: 80, conocido: true, lider: 'npc_kant', metas: ['Localizar el Códice de las Nueve Mortajas', 'Mantener la red de prioratos', 'Reclutar informantes en cada villa'], desc: 'Inquisición especializada. No queman a todos: primero preguntan, y preguntan muy bien.' },
    { id: 'cmt', n: 'Compañía de la Mano Tasada', pol: null, ideo: 'Todo trabajo tiene precio y el precio se escribe antes.', poder: 44, inf: 55, conocido: true, lider: 'npc_tasada', metas: ['Monopolizar los contratos de escolta en la Marca', 'Abrir casa en Grisbrial'], desc: 'Gremio de aventureros con contabilidad seria. Aceptan a cualquiera que sobreviva al examen.' },
    { id: 'aca', n: 'Academia de Fonteclara', pol: 'fon', ideo: 'La magia sin registro es un accidente esperando ocurrir.', poder: 66, inf: 74, conocido: true, lider: 'npc_volz', metas: ['Certificar toda práctica mágica de Valdrath', 'Excavar Ranhollow antes que la Llama Blanca'], desc: 'Nueve facultades. Ninguna admite enseñar nigromancia, y tres la investigan.' },
    { id: 'ccn', n: 'Círculo de la Ceniza Nueve', pol: null, ideo: 'El Quinto Rey volverá y conviene estar en la lista correcta.', poder: 23, inf: 18, conocido: false, lider: 'npc_kesla', metas: ['Reunir las nueve llaves del Códice', 'Infiltrar el Priorato de la Llama Sellada', 'Encontrar al portador del Códice'], desc: 'Secta nigromántica clandestina, fragmentada en células que no se conocen entre sí.' },
    { id: 'grh', n: 'Gremio de Rastreadores de Huesos', pol: null, ideo: 'Lo enterrado no reclama propiedad.', poder: 31, inf: 26, conocido: true, lider: 'npc_rastro', metas: ['Vaciar el Páramo de los Siete Túmulos antes del invierno', 'Sobornar al alguacil de la Marca'], desc: 'Saqueadores de túmulos semitolerados. Venden a quien paga, incluida la Academia.' },
    { id: 'vmc', n: 'Velo y Moneda', pol: null, ideo: 'Todo componente tiene mercado.', poder: 37, inf: 48, conocido: false, lider: null, metas: ['Controlar el contrabando de esencias por el Vado del Grial', 'Comprar la deuda de Cenizahonda'], desc: 'Red de contrabando de componentes mágicos. Discreta, puntual, implacable con los morosos.' },
    { id: 'hmd', n: 'Hijas de la Mortaja', pol: null, ideo: 'Los muertos se cuidan. No se usan.', poder: 29, inf: 41, conocido: true, lider: 'npc_ismelda', metas: ['Mantener el monopolio funerario legal', 'Registrar toda tumba abierta de la Marca'], desc: 'Orden funeraria legal: embalsaman, sellan y llevan registros meticulosos. Saben de huesos más que nadie.' },
    { id: 'cfs', n: 'Cofradía del Sello', pol: null, ideo: 'Encerrar es más limpio que destruir.', poder: 48, inf: 39, conocido: false, lider: null, metas: ['Revisar los sellos de la Ruina de Ranhollow', 'Reclutar talento joven antes que la Academia'], desc: 'Magos de sellado, neutrales por doctrina. Trabajan para quien amenace menos el mundo.' },
    { id: 'tej', n: 'Los Tejedores de Gris', pol: null, ideo: 'Cada alma tiene un camino y alguien debe barrerlo.', poder: 52, inf: 22, conocido: false, lider: 'npc_vaelis', metas: ['Reparar las rutas de las Marchas Grises', 'Cobrar las almas retenidas por nigromantes'], desc: 'Psicopompos. No odian a los nigromantes: les cobran.' },
    { id: 'lnc', n: 'Los Nueve Coros', pol: null, ideo: 'Lo de afuera canta y conviene aprenderse la letra.', poder: 26, inf: 14, conocido: false, lider: null, metas: ['Abrir una brecha estable al Afuera', 'Encontrar un portador con voluntad suficiente'], desc: 'Culto a entidades del Afuera. Sus miembros rara vez duran dos años.' },
    { id: 'sbl', n: 'Los Sabuesos de Llama', pol: 'llb', ideo: 'Cazar magos es un oficio como otro.', poder: 34, inf: 30, conocido: true, lider: null, metas: ['Cobrar las recompensas abiertas de la Marca', 'Conseguir contrato permanente con la Orden'], desc: 'Mercenarios contratados por la Llama Blanca cuando la Orden no quiere firmar.' },
    { id: 'cnc', n: 'Concilio de las Siete Coronas', pol: 'osp', ideo: 'El tiempo trabaja para nosotros.', poder: 94, inf: 12, conocido: false, lider: 'npc_sexto', metas: ['Impedir la restauración de la Quinta Corona', 'Observar al portador del Códice'], desc: 'Seis muertos coronados que gobiernan una ciudad sin vivos.' }
  ];

  window.TS = window.TS || {};
  window.TS.W = W;
})();

/* ─────────── Lugares, habitantes, bestiario, materiales, objetos, saber ─────────── */
(function () {
  var W = window.TS.W;

  // LUGARES. x/y son coordenadas de mapa (0-1000). 'con' = conocido al empezar.
  // 'rum' = rumores que pueden oírse allí. 'desc_oculto' = lo que solo se sabe explorando.
  W.lugares = [
    { id: 'vad', n: 'Vadosombrío', tipo: 'Villa', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 455, y: 390, pob: 1842, con: true,
      clima: 'Húmedo y frío; niebla del río nueve meses al año', rec: ['madera', 'pescado', 'turba', 'hierro pobre'],
      desc: 'Villa de tablones y piedra gris en el Vado del Grial. Vive del vado, de la mina y de los entierros ajenos: aquí traen a sus muertos tres aldeas sin osario propio.',
      peligros: ['Patrullas del Priorato', 'Rastreadores de huesos borrachos'],
      servicios: ['posada', 'herrero', 'boticaria', 'osario', 'mercado menor'],
      rum: ['La Mina Ahogada se derrumbó en la galería cuarta y hay cuatro cuerpos sin sacar.', 'Lady Renwyn ha subido la leva de grano un tercio.', 'Un erudito de Fonteclara duerme en el Clavo Torcido y paga en plata.', 'La niña de los Vehn no ha vuelto del bosque.'] },
    { id: 'osa', n: 'Osario de Vadosombrío', tipo: 'Osario', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 452, y: 386, pob: 2, con: true,
      clima: 'Frío constante, seco bajo tierra', rec: ['hueso', 'sal de osario', 'mortajas'],
      desc: 'Una casa baja de piedra con dos sótanos. Arriba se lavan y cosen los cuerpos; abajo se apilan los huesos por décadas, ordenados por Odolan con una obsesión que nadie le ha pedido.',
      peligros: ['Inspección del Priorato', 'Residuos de muerte acumulados'], servicios: ['taller improvisado', 'componentes óseos'],
      rum: ['Odolan lleva tres semanas tosiendo sangre y no quiere a la boticaria.'],
      oculto: 'El sótano inferior tiene un muro con juntas distintas al resto. Alguien tapió algo hace mucho.' },
    { id: 'pos', n: 'Posada del Clavo Torcido', tipo: 'Posada', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 458, y: 392, pob: 11, con: true,
      clima: 'Humo de turba', rec: [], desc: 'Dos plantas, una chimenea que tira mal y la mejor fuente de información de la Marca: Mirna Sal escucha más de lo que sirve.',
      peligros: ['Oídos ajenos'], servicios: ['cama', 'comida', 'rumores', 'cambio de moneda'], rum: [] },
    { id: 'pri', n: 'Priorato de la Llama Sellada', tipo: 'Fortín religioso', cont: 'val', pol: 'llb', reg: 'Marca de Grisbrial', x: 430, y: 360, pob: 34, con: true,
      clima: 'Viento de colina', rec: ['plata consagrada'], desc: 'Nueve hermanos, dos sabuesos y un archivo de condenas. Tienen jurisdicción sobre la Marca por un acuerdo que Caldraeth firmó hace ochenta años y lamenta desde entonces.',
      peligros: ['Interrogatorio', 'Detección de residuo necromántico'], servicios: ['archivo (restringido)'],
      rum: ['El hermano Breviar pide refuerzos a Alvermont por carta cada mes.'],
      oculto: 'En el archivo hay un expediente abierto sobre el osario de Vadosombrío desde hace seis años.' },
    { id: 'min', n: 'La Mina Ahogada', tipo: 'Mina', cont: 'val', pol: 'ash', reg: 'Marca de Grisbrial', x: 490, y: 345, pob: 87, con: true,
      clima: 'Agua filtrada, aire viciado', rec: ['hierro', 'carbón', 'cristal de maná (raro)'],
      desc: 'Cuatro galerías, dos inundadas. Cenizahonda la explota con concesión vieja y seguridad peor.',
      peligros: ['Derrumbes', 'Gas', 'Algo en la galería cuarta'], servicios: ['capataz', 'trabajo pagado'],
      rum: ['Los que sacaron los cuerpos dicen que estaban colocados, no caídos.'],
      oculto: 'La galería cuarta atravesó una cámara que no es natural: paredes talladas con una escritura anterior a Caldraeth.' },
    { id: 'tum', n: 'Páramo de los Siete Túmulos', tipo: 'Campo de túmulos', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 520, y: 420, pob: 0, con: true,
      clima: 'Viento constante, escarcha temprana', rec: ['hueso antiguo', 'bronce de túmulo', 'esencias'],
      desc: 'Siete montículos alineados con precisión que nadie explica. Seis están abiertos y saqueados. El séptimo no.',
      peligros: ['Rastreadores armados', 'Guardianes de túmulo', 'Residuo necromántico alto'], servicios: [],
      rum: ['Los rastreadores no entran al séptimo. Dicen que el que lo intentó salió hablando en otro idioma.'],
      oculto: 'Los siete túmulos no son tumbas: son clavos. Sostienen un sello que alguien plantó encima de algo.' },
    { id: 'sau', n: 'Saucedo', tipo: 'Aldea', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 420, y: 430, pob: 310, con: true,
      clima: 'Vega húmeda', rec: ['grano', 'lino'], desc: 'Aldea de labranza sin osario y sin cura. Traen sus muertos a Vadosombrío envueltos en lino barato.',
      peligros: ['Hambre si falla la cosecha'], servicios: ['grano', 'jornaleros'], rum: ['Dos familias se van al sur. Dicen que la leva es imposible de pagar.'] },
    { id: 'bos', n: 'Bosque de Vigías Torcidos', tipo: 'Bosque', cont: 'val', pol: 'ver', reg: 'Marca de Grisbrial', x: 400, y: 400, pob: 0, con: true,
      clima: 'Sombrío, húmedo, silencioso de más', rec: ['madera', 'hierbas', 'colmillo de huargo', 'agalla de roble'],
      desc: 'Robles viejos inclinados todos en la misma dirección, hacia el páramo. Los Cantones tienen pactos con algo de dentro y no explican con quién.',
      peligros: ['Huargos', 'Perderse', 'Lo que los Cantones no nombran'], servicios: [],
      rum: ['La niña de los Vehn entró a buscar leña y no salió. Nadie del Cantón quiere ir a buscarla.'] },
    { id: 'gri', n: 'Grisbrial', tipo: 'Ciudad', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 380, y: 330, pob: 11300, con: true,
      clima: 'Templado ventoso', rec: ['mercado', 'hierro trabajado', 'paño'],
      desc: 'Capital de la Marca. Muralla a medio reparar, un castillo donde gobierna la margravina Renwyn y un mercado donde se consigue casi cualquier cosa si no preguntas el precio dos veces.',
      peligros: ['Guardia urbana', 'Hijas de la Mortaja (registran tumbas abiertas)'],
      servicios: ['mercado mayor', 'biblioteca menor', 'gremios', 'banca', 'Hijas de la Mortaja', 'Mano Tasada'],
      rum: ['Mornavar ha movido dos mil lanzas al otro lado del río Grial.', 'La margravina pide a Thornhal una guarnición que Thornhal no tiene.', 'Hay recompensa de nueve coronas por información sobre un libro robado.'] },
    { id: 'vgr', n: 'Vado del Grial', tipo: 'Vado', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 468, y: 400, pob: 0, con: true,
      clima: 'Niebla matinal', rec: ['pesca', 'juncos'], desc: 'El único paso de carros en treinta leguas. Quien lo controla, controla la Marca.',
      peligros: ['Peaje armado', 'Contrabandistas'], servicios: ['peaje'], rum: [] },
    // No conocidos al empezar
    { id: 'cue', n: 'Cuevas del Lamento', tipo: 'Cuevas', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 540, y: 380, pob: 0, con: false,
      clima: 'Corrientes de aire que suenan a voz', rec: ['cristal de maná', 'hongos pálidos', 'esencia de pena'],
      desc: 'Red de cuevas de caliza donde el viento produce un sonido que los lugareños evitan nombrar. El Velo es delgado aquí.',
      peligros: ['Espíritus errantes', 'Derrumbes', 'Pérdida de orientación'], servicios: [], rum: [],
      oculto: 'Es una vía natural hacia las Marchas Grises, abierta tres días cada ciclo de Velo Delgado.' },
    { id: 'cri', n: 'Cripta de Hervast el Cojo', tipo: 'Cripta', cont: 'val', pol: 'cal', reg: 'Marca de Grisbrial', x: 505, y: 445, pob: 0, con: false,
      clima: 'Seco, sellado', rec: ['bronce', 'grimorio menor', 'hueso noble'],
      desc: 'Un caballero menor del siglo pasado, enterrado con más cuidado del que merecía un caballero menor.',
      peligros: ['Guardián de túmulo', 'Trampa de sellado'], servicios: [], rum: [],
      oculto: 'Hervast no era un caballero. Era el carcelero del séptimo túmulo, y su tumba contiene el registro de lo que vigilaba.' },
    { id: 'ran', n: 'Ruinas de Ranhollow', tipo: 'Ruina mayor', cont: 'val', pol: null, reg: 'Fronteras de Fonteclara', x: 300, y: 300, pob: 0, con: false,
      clima: 'Ceniza suspendida que no se asienta', rec: ['textos', 'cristal quemado', 'aleaciones perdidas'],
      desc: 'Fue una ciudad universitaria de cuarenta mil habitantes. En 1019 dejó de serlo en una tarde.',
      peligros: ['Residuo mágico activo', 'Cosas que la Ruina dejó despiertas', 'Patrullas rivales'], servicios: [], rum: [],
      oculto: 'La Ruina no fue un accidente de laboratorio. Fue un sellado de emergencia, y funcionó solo en parte.' },
    { id: 'fcl', n: 'Fonteclara', tipo: 'Ciudad-estado', cont: 'val', pol: 'fon', reg: 'Fonteclara', x: 250, y: 345, pob: 68000, con: false,
      clima: 'Templado, lluvias de otoño', rec: ['conocimiento', 'cristal de maná refinado', 'tinta'],
      desc: 'Nueve facultades, cuarenta bibliotecas y una ley que exige registrar todo hechizo que se lance dentro de la muralla.',
      peligros: ['Certificadores', 'Política académica'], servicios: ['Academia', 'biblioteca mayor', 'maestros', 'mercado de componentes'], rum: [] },
    { id: 'thr', n: 'Thornhal', tipo: 'Capital', cont: 'val', pol: 'cal', reg: 'Corazón de Caldraeth', x: 330, y: 230, pob: 92000, con: false,
      clima: 'Frío seco', rec: ['corte', 'arsenal'], desc: 'La capital de un reino que ya no puede pagar sus murallas.', peligros: ['Corte'], servicios: ['corte', 'arsenal', 'banca'], rum: [] },
    { id: 'alv', n: 'Alvermont', tipo: 'Sede teocrática', cont: 'val', pol: 'llb', reg: 'Llama Blanca', x: 290, y: 420, pob: 41000, con: false,
      clima: 'Seco, campanas cada hora', rec: ['plata consagrada', 'archivos'], desc: 'La Sede. Su archivo de condenas tiene nueve mil nombres y tres salas cerradas.', peligros: ['Todo'], servicios: ['archivo mayor'], rum: [] },
    { id: 'hrk', n: 'Hrafnvik', tipo: 'Puerto de clanes', cont: 'kal', pol: 'kjl', reg: 'Fiordos Pálidos', x: 470, y: 120, pob: 9000, con: false,
      clima: 'Glacial, noche de cuatro meses', rec: ['pieles', 'ámbar', 'hueso de ballena'], desc: 'Casas de madera negra y un túmulo en cada colina.', peligros: ['Duelos', 'Invierno'], servicios: ['barcos', 'mercenarios'], rum: [] },
    { id: 'tmn', n: 'Túmulos de los Reyes de Hueso', tipo: 'Necrópolis', cont: 'kal', pol: 'kjl', reg: 'Tundra de Hraun', x: 520, y: 90, pob: 0, con: false,
      clima: 'Ventisca permanente', rec: ['hueso real', 'corona menor', 'esencia de mando'],
      desc: 'Nueve reyes enterrados de pie. Cinco túmulos están vacíos, y los clanes insisten en que nunca se abrieron.',
      peligros: ['Guardia de clan', 'Reyes'], servicios: [], rum: [], oculto: 'El quinto está vacío porque su ocupante se fue caminando. Dejó el Códice.' },
    { id: 'qal', n: 'Qalat Sihr', tipo: 'Capital imperial', cont: 'sar', pol: 'nvd', reg: 'Nueve Vidrios', x: 300, y: 620, pob: 310000, con: false,
      clima: 'Árido, noches frías', rec: ['cristal de maná', 'componentes', 'licencias'],
      desc: 'La única ciudad del mundo conocido donde un nigromante puede tener placa en la puerta. Cuesta ciento veinte coronas al año y un censo de tus muertos.',
      peligros: ['Burocracia', 'Competencia profesional'], servicios: ['Colegio de Custodia de Ancestros', 'mercado de almas registradas', 'maestros'], rum: [] },
    { id: 'khd', n: 'Khadr Dûm', tipo: 'Ciudad-forja', cont: 'dum', pol: 'dvg', reg: 'Vías Profundas', x: 600, y: 480, pob: 54000, con: false,
      clima: 'Calor de forja, sin estaciones', rec: ['hierro-tumba', 'armazones', 'osteotecnia'],
      desc: 'Doce niveles de forja. Venden armazones que caminan y niegan que eso tenga algo que ver con la nigromancia.',
      peligros: ['Gremios celosos'], servicios: ['armazones', 'osteotecnia', 'metal'], rum: [] },
    { id: 'thv', n: 'Thal Veln', tipo: 'Ciudad de la sima', cont: 'sim', pol: 'vln', reg: 'Simas Lívidas', x: 650, y: 560, pob: 70000, con: false,
      clima: 'Oscuridad, hongos luminosos', rec: ['memoria embotellada', 'esclavos', 'veneno'],
      desc: 'Aquí la memoria es moneda. Hay mendigos que no recuerdan haber sido ricos.', peligros: ['Esclavistas', 'Contratos'], servicios: ['mercado de memoria'], rum: [] },
    { id: 'osp_c', n: 'Las Siete Coronas', tipo: 'Ciudad no-muerta', cont: 'sim', pol: 'osp', reg: 'Osario Profundo', x: 700, y: 640, pob: 0, con: false,
      clima: 'Sin viento, sin polvo, sin tiempo', rec: ['saber antiguo', 'coronas'],
      desc: 'Calles limpias, ventanas iluminadas, nadie respirando.', peligros: ['El Concilio'], servicios: [], rum: [] }
  ];

  // CONEXIONES: viajes conocidos (h = horas a pie, r = riesgo 0-100)
  W.rutas = [
    { a: 'vad', b: 'osa', h: 0.2, r: 0 }, { a: 'vad', b: 'pos', h: 0.1, r: 0 },
    { a: 'vad', b: 'vgr', h: 0.6, r: 5 }, { a: 'vad', b: 'pri', h: 2.5, r: 10 },
    { a: 'vad', b: 'min', h: 4, r: 20 }, { a: 'vad', b: 'sau', h: 5, r: 12 },
    { a: 'vad', b: 'bos', h: 3, r: 30 }, { a: 'vad', b: 'tum', h: 7, r: 40 },
    { a: 'vgr', b: 'gri', h: 28, r: 18 }, { a: 'sau', b: 'bos', h: 3, r: 28 },
    { a: 'min', b: 'tum', h: 5, r: 35 }, { a: 'tum', b: 'cri', h: 3, r: 35 },
    { a: 'min', b: 'cue', h: 4, r: 45 }, { a: 'gri', b: 'fcl', h: 70, r: 22 },
    { a: 'gri', b: 'thr', h: 110, r: 20 }, { a: 'fcl', b: 'ran', h: 30, r: 55 },
    { a: 'gri', b: 'alv', h: 95, r: 25 }
  ];

  /* ───────────────────────── HABITANTES ───────────────────────── */
  // op: opinión inicial sobre Maikel (-100..100). con: conocido al empezar.
  // pot: potencia (nivel aproximado). ag: agenda diaria.
  W.npcs = [
    { id: 'npc_odolan', n: 'Odolan Verch', edad: 57, esp: 'Humano', ocu: 'Sepulturero mayor del osario', loc: 'osa', con: true, op: 25, pot: 4,
      pers: 'Seco, ordenado, incapaz de mentir bien. Lleva veinte años lavando muertos y los trata mejor que a los vivos.',
      hist: 'Fue lancero en la leva del 19. Volvió con una rodilla mala y el oficio que nadie quería.',
      metas: ['Morir sin deudas', 'Que el osario quede en manos que lo respeten'],
      rel: ['Patrón y casi tutor de Maikel', 'Desconfía del hermano Breviar'],
      hab: ['Anatomía práctica', 'Conocimiento de huesos', 'Resistencia al asco'], rec: ['Llave del osario', 'Herramientas de sepulturero'],
      sec: 'Sabe que el muro del sótano inferior fue tapiado por el sepulturero anterior, y no quiere averiguar por qué.', salud: 38 },
    { id: 'npc_mirna', n: 'Mirna Sal', edad: 34, esp: 'Humana', ocu: 'Posadera del Clavo Torcido', loc: 'pos', con: true, op: 10, pot: 3,
      pers: 'Cordial por oficio, calculadora por costumbre. Cobra la información como cobra la cerveza.',
      hist: 'Heredó la posada de un marido que no llora.', metas: ['Comprar el granero de al lado', 'No tener problemas con el Priorato'],
      rel: ['Trata con contrabandistas de Velo y Moneda'], hab: ['Red de rumores', 'Regateo'], rec: ['Posada', '140 coronas escondidas'],
      sec: 'Cobra una comisión a Velo y Moneda por cada partida que pasa el vado.', salud: 85 },
    { id: 'npc_breviar', n: 'Hermano Breviar Tolm', edad: 41, esp: 'Humano', ocu: 'Inquisidor menor del Priorato', loc: 'pri', con: true, op: -12, pot: 11,
      pers: 'Metódico, insomne, convencido. No disfruta su trabajo, lo que lo hace peor.',
      hist: 'Vio morir a su hermana en la epidemia del 32 y creyó la explicación que le dieron.',
      metas: ['Cerrar el expediente abierto del osario de Vadosombrío', 'Conseguir refuerzos de Alvermont'],
      rel: ['Enemistado con el alguacil Havel por jurisdicción'], hab: ['Detección de residuo necromántico', 'Interrogatorio', 'Luz menor'],
      rec: ['Sello de la Orden', 'Dos sabuesos', 'Archivo del priorato'],
      sec: 'Lleva seis años sin cerrar el expediente porque su predecesor desapareció al investigarlo.', salud: 70 },
    { id: 'npc_selka', n: 'Selka Ún', edad: 19, esp: 'Humana', ocu: 'Trampera', loc: 'vad', con: true, op: 15, pot: 5,
      pers: 'Directa, impaciente, leal cuando decide serlo. No le importa de dónde viene la carne.',
      hist: 'Creció en el borde del bosque. Conoce los Vigías Torcidos mejor que los Cantones.',
      metas: ['Juntar para un arco de Mornavar', 'Encontrar a la niña de los Vehn'],
      rel: ['Amiga de infancia de Maikel', 'Debe dinero a la posadera'], hab: ['Rastreo', 'Arco corto', 'Trampas'], rec: ['Arco', 'Cuchillo', 'Cabaña'],
      sec: 'Ya entró al bosque a buscar a la niña y vio algo que no ha contado a nadie.', salud: 92 },
    { id: 'npc_havel', n: 'Havel Drun', edad: 46, esp: 'Humano', ocu: 'Alguacil de la Marca', loc: 'vad', con: true, op: 0, pot: 9,
      pers: 'Pragmático hasta la corrupción. Cobra a los rastreadores y duerme bien.',
      hist: 'Veinte años de servicio y ningún ascenso.', metas: ['Jubilarse con tierra', 'Que el Priorato no mire sus cuentas'],
      rel: ['Soborno mensual del Gremio de Rastreadores'], hab: ['Espada', 'Autoridad', 'Lectura de gente'], rec: ['Cuatro hombres', 'Calabozo'], salud: 75 },
    { id: 'npc_yeora', n: 'Yeora Vint', edad: 63, esp: 'Humana', ocu: 'Boticaria', loc: 'vad', con: true, op: 5, pot: 8,
      pers: 'Ácida, paciente, observadora. Sabe mucho más de lo que su licencia permite.',
      hist: 'Estudió dos años en Fonteclara y la expulsaron por un motivo que no cuenta.',
      metas: ['Que su conocimiento no muera con ella', 'Evitar que el Priorato registre su trastienda'],
      rel: ['Rivalidad vieja con las Hijas de la Mortaja'], hab: ['Alquimia básica', 'Herbolaria', 'Anatomía'], rec: ['Botica', 'Alambique', 'Herbario'],
      sec: 'Puede enseñar alquimia y los primeros principios de transmutación, si alguien le da una razón.', salud: 60, maestro: { escuela: 'transmu', max: 18, precio: 25 } },
    { id: 'npc_tomir', n: 'Tomir', edad: 12, esp: 'Humano', ocu: 'Mensajero huérfano', loc: 'vad', con: true, op: 20, pot: 1,
      pers: 'Rápido, hablador, incapaz de guardar un secreto más de dos días.', hist: 'Sus padres están en el osario. Maikel los cosió.',
      metas: ['Comer dos veces al día', 'Ser aprendiz de alguien'], rel: ['Admira a Maikel'], hab: ['Correr', 'Pasar desapercibido'], rec: ['Nada'], salud: 70 },
    { id: 'npc_casiel', n: 'Casiel Mord', edad: 29, esp: 'Humano', ocu: 'Erudito viajero de Fonteclara', loc: 'pos', con: true, op: 8, pot: 14,
      pers: 'Entusiasta, indiscreto, ambicioso de una forma inofensiva por ahora.',
      hist: 'Tercer ayudante de una cátedra que no lo cita. Vino a la Marca a copiar inscripciones de túmulos.',
      metas: ['Publicar algo propio antes de los treinta', 'Entrar al séptimo túmulo'],
      rel: ['Informa a la Academia de todo lo que encuentra'], hab: ['Thanel Antiguo (lectura)', 'Epigrafía', 'Luz menor', 'Barrera menor'],
      rec: ['Dos libros', 'Cuaderno de calcos', 'Carta de la Academia'],
      sec: 'La Academia le pidió localizar el Códice de las Nueve Mortajas, no copiar inscripciones.',
      salud: 88, maestro: { escuela: null, idioma: 'thanel', max: 45, precio: 0 } },
    { id: 'npc_garrek', n: 'Garrek Hollin', edad: 38, esp: 'Humano', ocu: 'Capataz de la Mina Ahogada', loc: 'min', con: true, op: -5, pot: 7,
      pers: 'Duro, cansado, honesto a su manera: paga lo que promete y nada más.',
      hist: 'Lleva once años en la mina. Ha enterrado a diecinueve hombres.', metas: ['Reabrir la galería cuarta', 'Sacar los cuatro cuerpos'],
      rel: ['Odia a los contables de Cenizahonda'], hab: ['Minería', 'Mando', 'Pico'], rec: ['Mina', 'Cuadrilla de 40'], salud: 72 },
    { id: 'npc_ismelda', n: 'Ismelda Corvo', edad: 44, esp: 'Humana', ocu: 'Priora de las Hijas de la Mortaja', loc: 'gri', con: true, op: -10, pot: 16,
      pers: 'Cortés, implacable, enciclopédica. Nunca levanta la voz.',
      hist: 'Treinta años embalsamando. Ha visto cuatro nigromantes y ha enterrado a los cuatro.',
      metas: ['Registrar toda tumba abierta de la Marca', 'Que ningún muerto de su registro se levante'],
      rel: ['Colabora selectivamente con el Priorato'], hab: ['Embalsamado maestro', 'Sellado menor', 'Anatomía comparada', 'Archivo'],
      rec: ['Casa de la Mortaja', 'Registro completo de entierros', 'Doce hermanas'], salud: 80 },
    // Actores lejanos que mueven el mundo (desconocidos al empezar)
    { id: 'npc_kesla', n: 'Kesla Virn', edad: 26, esp: 'Humana', ocu: 'Nigromante clandestina', loc: 'gri', con: false, op: 0, pot: 22,
      pers: 'Encantadora, impaciente, dispuesta a quemar puentes ajenos.', hist: 'Aprendiz expulsada de la Academia. Dirige una célula del Círculo de la Ceniza Nueve.',
      metas: ['Localizar el Códice de las Nueve Mortajas', 'Reunir las nueve llaves', 'No acabar como su maestro'],
      rel: ['Célula de siete miembros', 'Debe un favor a Velo y Moneda'],
      hab: ['Nigromancia (invocación, control)', 'Maldiciones', 'Ilusión menor'], rec: ['Cuatro no-muertos', 'Red de informantes'], salud: 90, rival: true },
    { id: 'npc_kant', n: 'Inquisidor Mayor Aurel Kant', edad: 58, esp: 'Humano', ocu: 'Cabeza de la Orden del Sello Blanco', loc: 'alv', con: false, op: 0, pot: 44,
      pers: 'Tranquilo, erudito, absolutamente convencido.', hist: 'Cerró la brecha de Ranhollow en el 1041 y lo que vio allí define su doctrina.',
      metas: ['Erradicar la nigromancia en Valdrath', 'Encontrar el Códice antes del Círculo'],
      rel: ['Mano derecha del Sumo Lector'], hab: ['Magia sagrada', 'Sellado maestro', 'Detección'], rec: ['La Orden entera'], salud: 76 },
    { id: 'npc_volz', n: 'Archimago Taren Volz', edad: 71, esp: 'Humano', ocu: 'Primer Lector de la Academia de Fonteclara', loc: 'fcl', con: false, op: 0, pot: 61,
      pers: 'Curioso sin escrúpulos, políticamente intocable.', hist: 'Cuatro escuelas a nivel maestro. Investiga la nigromancia a través de intermediarios desechables.',
      metas: ['Excavar Ranhollow', 'Obtener el Códice para la Academia', 'No ser el que firme nada'],
      rel: ['Casiel Mord es uno de sus muchos intermediarios'], hab: ['Sellado', 'Transmutación', 'Espacial', 'Barreras'], rec: ['Academia'], salud: 65 },
    { id: 'npc_aldric', n: 'Rey Aldric IV', edad: 63, esp: 'Humano', ocu: 'Rey de Caldraeth', loc: 'thr', con: false, op: 0, pot: 12,
      pers: 'Agotado, lúcido a ratos.', hist: 'Treinta y un años de reinado y una enfermedad que ningún sanador nombra igual.',
      metas: ['Dejar un heredero reconocido', 'Pagar la guarnición del norte'], rel: ['Dos hijos, tres facciones'], hab: ['Política'], rec: ['Caldraeth'], salud: 22 },
    { id: 'npc_hagen', n: 'Príncipe Hagen de Mornavar', edad: 39, esp: 'Humano', ocu: 'Príncipe de Mornavar', loc: null, con: false, op: 0, pot: 18,
      pers: 'Frío, competente, sin prisa.', hist: 'Reorganizó el ejército en seis años.', metas: ['Anexionar la Marca de Grisbrial', 'Esperar la muerte de Aldric'],
      rel: [], hab: ['Mando', 'Estrategia'], rec: ['Ejército de Mornavar'], salud: 90 },
    { id: 'npc_renwyn', n: 'Margravina Renwyn de Grisbrial', edad: 51, esp: 'Humana', ocu: 'Margravina de la Marca', loc: 'gri', con: true, op: 0, pot: 13,
      pers: 'Exigente, aislada, consciente de que la están vendiendo.', hist: 'Gobierna una frontera que la corona no puede defender.',
      metas: ['Conseguir una guarnición', 'Recaudar la leva de grano', 'No caer ante Mornavar'],
      rel: ['Desprecia al alguacil Havel'], hab: ['Administración', 'Espada'], rec: ['Castillo', '300 hombres'], salud: 78 },
    { id: 'npc_vaelis', n: 'Vaelis el Gris', edad: null, esp: 'Tejedor de Gris', ocu: 'Psicopompo', loc: null, con: false, op: 0, pot: 38,
      pers: 'Paciente, formal, extrañamente amable. Trata la muerte como un trámite mal llevado.',
      hist: 'No recuerda haber sido vivo.', metas: ['Reparar las rutas de las Marchas Grises', 'Cobrar las almas retenidas'],
      rel: [], hab: ['Magia espiritual maestra', 'Viaje entre planos'], rec: ['Su oficio'], salud: 100 },
    { id: 'npc_sexto', n: 'El Coronado Sexto', edad: null, esp: 'No-muerto antiguo', ocu: 'Miembro del Concilio de las Siete Coronas', loc: 'osp_c', con: false, op: 0, pot: 88,
      pers: 'Cortés, lentísimo, absolutamente despiadado.', hist: 'Fue rey cuando Caldraeth no existía.',
      metas: ['Impedir la restauración de la Quinta Corona', 'Observar al portador del Códice'],
      rel: ['Cinco pares'], hab: ['Casi todo'], rec: ['Una ciudad'], salud: 100 },
    { id: 'npc_vharnos', n: 'Vharnos Sel', edad: null, esp: 'Desconocido', ocu: 'El Quinto Rey de Hueso', loc: null, con: false, op: 0, pot: 92,
      pers: 'Desconocida.', hist: 'Su túmulo está vacío. Escribió el Códice de las Nueve Mortajas y después se fue caminando.',
      metas: ['desconocidas'], rel: [], hab: ['desconocidas'], rec: ['desconocidos'], salud: 100 },
    { id: 'npc_shaltreth', n: 'Shaltreth, el Que Cuenta Dientes', edad: null, esp: 'Demonio menor', ocu: 'Prestamista de los Hornos Pálidos', loc: null, con: false, op: 0, pot: 47,
      pers: 'Jovial, puntilloso con los plazos.', hist: 'Lleva nueve mil contratos y ha perdido dos.',
      metas: ['Firmar con un nigromante joven y prometedor'], rel: [], hab: ['Contratos vinculantes', 'Fuego pálido'], rec: ['Deudas de medio mundo'], salud: 100 },
    { id: 'npc_rastro', n: 'Bram Rastro', edad: 43, esp: 'Humano', ocu: 'Cabecilla del Gremio de Rastreadores de Huesos', loc: 'tum', con: true, op: -8, pot: 10,
      pers: 'Ruidoso, violento, buen negociador cuando le conviene.', hist: 'Lleva nueve años vaciando túmulos y no ha abierto el séptimo.',
      metas: ['Vaciar el páramo antes del invierno', 'Que nadie más venda huesos en la Marca'],
      rel: ['Soborna a Havel'], hab: ['Saqueo', 'Pelea sucia'], rec: ['Doce hombres', 'Carros'], salud: 80 },
    { id: 'npc_tasada', n: 'Factora Olvenne Dask', edad: 48, esp: 'Humana', ocu: 'Factora de la Compañía de la Mano Tasada', loc: 'gri', con: true, op: 0, pot: 12,
      pers: 'Profesional absoluta. Todo cabe en un contrato bien escrito.', hist: 'Treinta años en el gremio.',
      metas: ['Abrir casa en Vadosombrío', 'Monopolizar escoltas de la Marca'], rel: [], hab: ['Contratos', 'Evaluación de talento'], rec: ['Gremio'], salud: 82 }
  ];

  window.TS.W = W;
})();

/* ─────────── Bestiario, materiales, objetos, saber, investigación ─────────── */
(function () {
  var W = window.TS.W;

  // BESTIARIO. drops = componentes obtenibles. int = inteligencia 0-100.
  W.bestiario = [
    { id: 'rata_osa', n: 'Rata de osario', nv: 1, rango: 'Aprendiz', vit: 6, fue: 3, vel: 14, def: 2, int: 5, hab: ['Mordisco infecto'], hab_t: 'Infección leve', loc: ['osa', 'min'], drops: ['hueso_peq', 'pelo'], desc: 'Gorda, lenta de día, insistente.' },
    { id: 'perro_fer', n: 'Perro asilvestrado', nv: 2, rango: 'Aprendiz', vit: 14, fue: 8, vel: 16, def: 4, int: 18, hab: ['Mordisco', 'Manada'], loc: ['vad', 'sau'], drops: ['hueso_peq', 'colmillo', 'cuero'], desc: 'Van en grupos de tres o cuatro.' },
    { id: 'cuervo_vel', n: 'Cuervo del Velo', nv: 3, rango: 'Aprendiz', vit: 9, fue: 4, vel: 22, def: 3, int: 34, hab: ['Vuelo', 'Vista del otro lado'], loc: ['osa', 'tum'], drops: ['pluma_velo', 'ojo_cuervo'], desc: 'Ve a los espíritus. Los nigromantes los usan de ojos.' },
    { id: 'saqueador', n: 'Saqueador de túmulos', nv: 4, rango: 'Aprendiz', vit: 20, fue: 12, vel: 11, def: 7, int: 45, hab: ['Pala', 'Cuchillo', 'Trampa'], loc: ['tum'], drops: ['hueso_hum', 'bronce_tum'], desc: 'Humano. Armado. Suele estar borracho.' },
    { id: 'huargo', n: 'Huargo de los Vigías', nv: 7, rango: 'Adepto', vit: 42, fue: 22, vel: 24, def: 11, int: 28, hab: ['Mordisco desgarrador', 'Acecho', 'Aullido'], loc: ['bos'], drops: ['colmillo_huargo', 'cuero_huargo', 'nucleo_hambre'], desc: 'Del tamaño de un poni. Caza en pareja.' },
    { id: 'esq_simple', n: 'Esqueleto animado', nv: 3, rango: 'Aprendiz', vit: 16, fue: 10, vel: 10, def: 6, int: 2, hab: ['Golpe'], loc: ['tum', 'cri'], drops: ['hueso_hum'], desc: 'Lo que casi todos creen que es la nigromancia.' },
    { id: 'ahogado', n: 'Ahogado de galería', nv: 5, rango: 'Aprendiz', vit: 30, fue: 15, vel: 7, def: 8, int: 9, hab: ['Agarre', 'Ahogo'], loc: ['min'], drops: ['hueso_hum', 'esencia_pena', 'agua_negra'], desc: 'No-muerto espontáneo de los pozos inundados. No obedece a nadie.' },
    { id: 'lamento', n: 'Lamento', nv: 8, rango: 'Adepto', vit: 24, fue: 0, vel: 20, def: 14, int: 30, hab: ['Grito de pena', 'Incorpóreo', 'Toque frío'], hab_t: 'Daño a voluntad', loc: ['cue', 'tum'], drops: ['esencia_pena', 'jirón_alma'], desc: 'Espíritu que repite su última hora. No se puede golpear con acero.' },
    { id: 'guardian_tum', n: 'Guardián de túmulo', nv: 12, rango: 'Adepto', vit: 70, fue: 30, vel: 12, def: 22, int: 25, hab: ['Hacha de bronce', 'No siente dolor', 'Juramento'], loc: ['tum', 'cri', 'tmn'], drops: ['hueso_noble', 'bronce_tum', 'esencia_juramento'], desc: 'Fue un guerrero al que enterraron con una orden. Sigue cumpliéndola.' },
    { id: 'carnero_hue', n: 'Carnero de hueso', nv: 10, rango: 'Adepto', vit: 55, fue: 28, vel: 18, def: 16, int: 6, hab: ['Carga'], loc: ['tum'], drops: ['hueso_bestia', 'cuerno'], desc: 'Construcción vieja, de las que se levantaron solas al absorber residuo.' },
    { id: 'tejedor_car', n: 'Tejedor de carne', nv: 15, rango: 'Experto', vit: 85, fue: 34, vel: 14, def: 18, int: 40, hab: ['Múltiples brazos', 'Injerto'], loc: ['ran'], drops: ['carne_viva', 'nucleo_injerto', 'esencia_dolor'], desc: 'Experimento de Ranhollow que sigue trabajando sin quien se lo mandara.' },
    { id: 'can_pal', n: 'Can pálido', nv: 9, rango: 'Adepto', vit: 38, fue: 20, vel: 26, def: 10, int: 22, hab: ['Rastreo de residuo', 'Mordisco'], loc: ['pri', 'alv'], drops: ['colmillo', 'olfato_sellado'], desc: 'Criados por la Orden del Sello Blanco para oler nigromancia.' },
    { id: 'segador', n: 'Segador del Velo', nv: 20, rango: 'Experto', vit: 120, fue: 44, vel: 30, def: 26, int: 55, hab: ['Guadaña espiritual', 'Paso entre planos'], loc: ['cue', 'velo'], drops: ['filo_velo', 'esencia_corte', 'alma_menor'], desc: 'Lo que viene cuando un alma se queda donde no debe demasiado tiempo.' },
    { id: 'golem_dum', n: 'Armazón de Dûm Varag', nv: 18, rango: 'Experto', vit: 140, fue: 50, vel: 9, def: 34, int: 12, hab: ['Puño de hierro-tumba', 'Sin fatiga'], loc: ['khd'], drops: ['hierro_tumba', 'nucleo_forja'], desc: 'Ingeniería, no nigromancia. Insisten mucho en eso.' },
    { id: 'rey_hueso', n: 'Rey de Hueso', nv: 55, rango: 'Gran Maestro', vit: 600, fue: 90, vel: 40, def: 60, int: 95, hab: ['Mando sobre muertos', 'Corona', 'Magia de almas'], loc: ['tmn'], drops: ['corona_menor', 'hueso_real', 'esencia_mando'], desc: 'Nueve fueron enterrados de pie. Cinco túmulos están vacíos.' },
    { id: 'dragon_cen', n: 'Dragón de ceniza', nv: 70, rango: 'Archimago', vit: 1100, fue: 130, vel: 55, def: 80, int: 90, hab: ['Aliento de ceniza', 'Vuelo', 'Magia innata'], loc: ['ran', 'ajh'], drops: ['escama_ceniza', 'nucleo_draconico', 'sangre_dragon'], desc: 'Tres se cuentan vivos en el mundo. Uno duerme bajo Ranhollow.' },
    { id: 'vehn_cosa', n: '—', nv: 11, rango: 'Adepto', vit: 48, fue: 24, vel: 19, def: 12, int: 60, hab: ['Imitación de voz', 'Acecho'], loc: ['bos'], drops: ['esencia_imitacion', 'hueso_torcido'], desc: 'Los Cantones tienen un pacto que incluye no nombrarlo.', oculto: true }
  ];

  // MATERIALES Y COMPONENTES (para hechizos, criaturas e investigación)
  // tipo: armazon | nucleo | esencia | alma | material | reactivo
  // ap: aportación a las estadísticas de una criatura construida
  W.comp = [
    { id: 'hueso_hum', n: 'Huesos humanos (juego)', tipo: 'armazon', rar: 'común', val: 2, ap: { vit: 12, fue: 8, vel: 8, def: 5 }, lim: { int: 40 }, desc: 'Lo que sobra tras dos décadas de osario.' },
    { id: 'hueso_bestia', n: 'Huesos de bestia grande', tipo: 'armazon', rar: 'común', val: 4, ap: { vit: 20, fue: 14, vel: 6, def: 8 }, lim: { int: 25 }, desc: 'Buey, carnero, caballo. Más masa, menos precisión.' },
    { id: 'hueso_noble', n: 'Hueso noble antiguo', tipo: 'armazon', rar: 'infrecuente', val: 22, ap: { vit: 30, fue: 20, vel: 10, def: 14, man: 10 }, lim: { int: 60 }, desc: 'Hueso de alguien que murió con juramento encima. Conduce maná.' },
    { id: 'hueso_real', n: 'Hueso de Rey de Hueso', tipo: 'armazon', rar: 'legendario', val: 900, ap: { vit: 120, fue: 60, vel: 30, def: 45, man: 60 }, lim: { int: 95 }, desc: 'Guarda mando. Lo que se construya con esto querrá mandar.' },
    { id: 'hierro_tumba', n: 'Hierro-tumba', tipo: 'armazon', rar: 'raro', val: 95, ap: { vit: 60, fue: 40, vel: -6, def: 40 }, lim: { int: 30 }, desc: 'Aleación de Dûm Varag forjada en atmósfera de osario. No se oxida.' },
    { id: 'quitina', n: 'Quitina de sima', tipo: 'armazon', rar: 'infrecuente', val: 30, ap: { vit: 22, fue: 10, vel: 18, def: 20 }, lim: { int: 35 }, desc: 'Ligera, dura, repelente a la vista.' },
    { id: 'carne_viva', n: 'Carne viva injertable', tipo: 'armazon', rar: 'raro', val: 60, ap: { vit: 45, fue: 25, vel: 14, def: 10 }, lim: { int: 70 }, desc: 'Sigue creciendo. Eso es la ventaja y el problema.' },
    { id: 'rescoldo', n: 'Rescoldo pálido', tipo: 'nucleo', rar: 'común', val: 6, ap: { man: 14, mant: 1 }, int_b: 4, desc: 'Residuo de muerte condensado en un carbón frío. Lo produce cualquier osario viejo.' },
    { id: 'cristal_man', n: 'Cristal de maná', tipo: 'nucleo', rar: 'infrecuente', val: 35, ap: { man: 40, mant: 2 }, int_b: 8, desc: 'Se extrae en vetas profundas. La Academia controla el comercio legal.' },
    { id: 'nucleo_hambre', n: 'Núcleo de hambre', tipo: 'nucleo', rar: 'infrecuente', val: 40, ap: { man: 25, fue: 12, mant: 3 }, int_b: 14, desc: 'Late. Lo que lo lleve dentro necesitará comer algo.' },
    { id: 'nucleo_forja', n: 'Núcleo de forja', tipo: 'nucleo', rar: 'raro', val: 120, ap: { man: 55, def: 10, mant: 2 }, int_b: 10, desc: 'Osteotecnia enana: no necesita alma para moverse.' },
    { id: 'nucleo_injerto', n: 'Núcleo de injerto', tipo: 'nucleo', rar: 'raro', val: 140, ap: { man: 45, vit: 25, mant: 4 }, int_b: 20, desc: 'Permite fusionar tejidos de especies distintas sin rechazo.' },
    { id: 'nucleo_draconico', n: 'Núcleo draconico', tipo: 'nucleo', rar: 'legendario', val: 2000, ap: { man: 220, fue: 50, mant: 14 }, int_b: 45, desc: 'Sigue caliente. Sigue enfadado.' },
    { id: 'esencia_pena', n: 'Esencia de pena', tipo: 'esencia', rar: 'común', val: 12, ap: { man: 8, vol: 6 }, pers: 'doliente', int_b: 10, desc: 'Destilada de un lugar donde alguien lloró mucho tiempo.' },
    { id: 'esencia_furia', n: 'Esencia de furia', tipo: 'esencia', rar: 'común', val: 14, ap: { fue: 14, vel: 8, def: -4 }, pers: 'furiosa', int_b: 6, desc: 'Barata y peligrosa: lo que la lleve atacará antes de pensar.' },
    { id: 'esencia_dolor', n: 'Esencia de dolor', tipo: 'esencia', rar: 'infrecuente', val: 34, ap: { vit: 18, res: 12 }, pers: 'insensible', int_b: 8, desc: 'Lo que la lleve no se detendrá por heridas.' },
    { id: 'esencia_juramento', n: 'Esencia de juramento', tipo: 'esencia', rar: 'raro', val: 110, ap: { vol: 25, def: 12 }, pers: 'leal', int_b: 25, lealtad: 25, desc: 'Lo más cercano a lealtad que se puede comprar.' },
    { id: 'esencia_mando', n: 'Esencia de mando', tipo: 'esencia', rar: 'legendario', val: 700, ap: { vol: 40, car: 30, man: 30 }, pers: 'autoritaria', int_b: 40, desc: 'Lo que la lleve dará órdenes. A alguien.' },
    { id: 'esencia_imitacion', n: 'Esencia de imitación', tipo: 'esencia', rar: 'raro', val: 160, ap: { per: 25, vel: 10 }, pers: 'mimética', int_b: 35, desc: 'Copia voces, gestos y a veces intenciones.' },
    { id: 'esencia_corte', n: 'Esencia de corte', tipo: 'esencia', rar: 'raro', val: 180, ap: { fue: 30, vel: 20 }, pers: 'fría', int_b: 15, desc: 'Separa. Es todo lo que sabe hacer y lo hace muy bien.' },
    { id: 'jiron_alma', n: 'Jirón de alma', tipo: 'alma', rar: 'infrecuente', val: 55, ap: { man: 15, vol: 8 }, int_b: 18, lealtad: -5, desc: 'Un fragmento. No recuerda nada entero, y eso lo hace inestable.' },
    { id: 'alma_bestia', n: 'Alma de bestia íntegra', tipo: 'alma', rar: 'infrecuente', val: 70, ap: { vel: 14, per: 14, man: 18 }, int_b: 30, lealtad: 10, desc: 'Obedece como obedecería el animal: por costumbre o por miedo.' },
    { id: 'alma_menor', n: 'Alma humana menor', tipo: 'alma', rar: 'raro', val: 240, ap: { int: 30, vol: 18, man: 35 }, int_b: 60, lealtad: -20, grave: true, desc: 'Recuerda que fue alguien. Eso tiene consecuencias legales, mágicas y de otra clase.' },
    { id: 'alma_intacta', n: 'Alma humana íntegra', tipo: 'alma', rar: 'muy raro', val: 900, ap: { int: 55, vol: 35, man: 70, car: 20 }, int_b: 90, lealtad: -45, grave: true, desc: 'Lo que convierte un crimen en una condena de por vida en nueve reinos. Y en una obra maestra.' },
    { id: 'sal_osa', n: 'Sal de osario', tipo: 'material', rar: 'común', val: 1, ap: { def: 4 }, desc: 'Conserva, purifica y marca círculos. El consumible básico.' },
    { id: 'tiza_osa', n: 'Tiza de hueso molido', tipo: 'material', rar: 'común', val: 1, ap: {}, desc: 'Para trazar. Se gasta rápido.' },
    { id: 'hilo_nervio', n: 'Hilo de nervio curado', tipo: 'material', rar: 'infrecuente', val: 18, ap: { vel: 14, fue: 6 }, desc: 'Transmite impulso. Lo que se cosa con esto se mueve rápido.' },
    { id: 'plata_lab', n: 'Plata labrada', tipo: 'material', rar: 'infrecuente', val: 25, ap: { def: 14, man: 10 }, desc: 'Conduce y protege. Caro para desperdiciar.' },
    { id: 'cuero_huargo', n: 'Cuero de huargo', tipo: 'material', rar: 'infrecuente', val: 20, ap: { def: 16, vit: 8 }, desc: 'Duro y correoso.' },
    { id: 'colmillo_huargo', n: 'Colmillo de huargo', tipo: 'material', rar: 'infrecuente', val: 15, ap: { fue: 12 }, desc: 'Buen filo natural.' },
    { id: 'bronce_tum', n: 'Bronce de túmulo', tipo: 'material', rar: 'infrecuente', val: 16, ap: { def: 12, fue: 6 }, desc: 'Metal viejo con inscripciones que conviene leer antes de fundir.' },
    { id: 'mortaja_vieja', n: 'Mortaja usada', tipo: 'material', rar: 'común', val: 1, ap: { def: 3 }, desc: 'Lino que envolvió a alguien. Guarda residuo.' },
    { id: 'hueso_peq', n: 'Huesos pequeños', tipo: 'material', rar: 'común', val: 1, ap: { vel: 4 }, desc: 'Rata, ave, gato.' },
    { id: 'colmillo', n: 'Colmillo animal', tipo: 'material', rar: 'común', val: 1, ap: { fue: 4 }, desc: '' },
    { id: 'cuero', n: 'Cuero curtido', tipo: 'material', rar: 'común', val: 2, ap: { def: 6 }, desc: '' },
    { id: 'pelo', n: 'Pelo y pelaje', tipo: 'material', rar: 'común', val: 0.2, ap: {}, desc: 'Útil para vínculos simpáticos.' },
    { id: 'pluma_velo', n: 'Pluma de cuervo del Velo', tipo: 'material', rar: 'infrecuente', val: 22, ap: { per: 18 }, desc: 'Lo que la lleve verá el otro lado.' },
    { id: 'ojo_cuervo', n: 'Ojo de cuervo del Velo', tipo: 'material', rar: 'infrecuente', val: 28, ap: { per: 25 }, desc: 'Sirve de ojo remoto si se cose bien.' },
    { id: 'agua_negra', n: 'Agua negra de galería', tipo: 'reactivo', rar: 'común', val: 3, ap: {}, desc: 'Reactivo para ritos de ahogamiento y conservación.' },
    { id: 'tinta_agalla', n: 'Tinta de agalla', tipo: 'reactivo', rar: 'común', val: 2, ap: {}, desc: 'Para escribir lo que no debe borrarse.' },
    { id: 'cuerno', n: 'Cuerno', tipo: 'material', rar: 'común', val: 3, ap: { fue: 6, def: 4 }, desc: '' },
    { id: 'escama_ceniza', n: 'Escama de dragón de ceniza', tipo: 'material', rar: 'legendario', val: 1500, ap: { def: 90, vit: 40 }, desc: 'No la atraviesa casi nada.' },
    { id: 'sangre_dragon', n: 'Sangre de dragón', tipo: 'reactivo', rar: 'legendario', val: 1800, ap: {}, desc: 'Reactivo de evolución. Un vial cambia una especie entera.' },
    { id: 'filo_velo', n: 'Filo del Velo', tipo: 'material', rar: 'muy raro', val: 650, ap: { fue: 45, vel: 25 }, desc: 'Corta lo incorpóreo.' },
    { id: 'corona_menor', n: 'Corona menor de hueso', tipo: 'material', rar: 'legendario', val: 1200, ap: { car: 40, vol: 30, man: 40 }, desc: 'Una de las siete. Nadie sabe cuántas faltan.' },
    { id: 'olfato_sellado', n: 'Glándula de can pálido', tipo: 'material', rar: 'infrecuente', val: 32, ap: { per: 20 }, desc: 'Huele residuo necromántico a cien pasos.' },
    { id: 'hueso_torcido', n: 'Hueso torcido', tipo: 'armazon', rar: 'raro', val: 130, ap: { vit: 28, vel: 24, def: 10, per: 15 }, lim: { int: 75 }, desc: 'No es de ninguna especie catalogada.' }
  ];

  // OBJETOS
  W.objetos = [
    { id: 'codice', n: 'Códice de las Nueve Mortajas', tipo: 'Grimorio', rar: 'único', peso: 3.2, val: null, unico: true,
      desc: 'Nueve cuadernillos cosidos con hilo de nervio dentro de una cubierta de piel sin curtir que todavía está fría. Ocho están sellados con mortajas que no son solo tela. El primero está abierto, y aun así ilegible en su mayor parte: Thanel Antiguo mezclado con una notación que no es escritura.',
      props: ['Escrito en Thanel Antiguo (legibilidad actual 12%)', 'Ocho mortajas selladas', 'Consume memoria y sueño de quien lo estudia', 'Localizable por quien sepa buscarlo'],
      efectos: ['Al estudiarlo: progreso en nigromancia, pérdida de descanso', 'Residuo necromántico detectable a corta distancia'] },
    { id: 'cuch_barb', n: 'Cuchillo de barbero-cirujano', tipo: 'Herramienta/Arma', rar: 'común', peso: 0.3, val: 4, dmg: 6, desc: 'Era de tu padre. Corta bien y asusta poco.', props: ['Daño 6', 'Sirve para disecar'] },
    { id: 'linterna', n: 'Linterna de aceite', tipo: 'Herramienta', rar: 'común', peso: 1.1, val: 3, desc: 'Ocho horas de aceite dentro.', props: ['Luz 6 pasos'] },
    { id: 'aguja_hilo', n: 'Aguja e hilo de cirujano', tipo: 'Herramienta', rar: 'común', peso: 0.1, val: 2, desc: 'Coser muertos es la mitad del oficio.', props: ['Necesario para construir criaturas'] },
    { id: 'libreta', n: 'Libreta y carboncillo', tipo: 'Herramienta', rar: 'común', peso: 0.4, val: 1, desc: 'Donde apuntas lo que el Códice te deja entender.', props: ['Necesario para investigar'] },
    { id: 'manta', n: 'Manta de lana basta', tipo: 'Ropa', rar: 'común', peso: 1.5, val: 2, desc: '' },
    { id: 'vela_sebo', n: 'Vela de sebo', tipo: 'Consumible', rar: 'común', peso: 0.1, val: 0.3, desc: 'Dos horas de luz pobre.' },
    { id: 'pan_duro', n: 'Pan duro', tipo: 'Comida', rar: 'común', peso: 0.5, val: 0.2, desc: 'Un día de comida pobre.' },
    { id: 'odre', n: 'Odre de agua', tipo: 'Contenedor', rar: 'común', peso: 1.2, val: 1, desc: '' },
    { id: 'poc_vigor', n: 'Pócima de vigor', tipo: 'Consumible', rar: 'común', peso: 0.3, val: 8, desc: 'Recupera 12 de vitalidad. Sabe a tierra.', efecto: { hp: 12 } },
    { id: 'poc_mana', n: 'Tónico de flujo', tipo: 'Consumible', rar: 'infrecuente', peso: 0.3, val: 22, desc: 'Recupera 15 de maná y deja temblor de manos una hora.', efecto: { mana: 15, debuff: 'temblor' } },
    { id: 'amuleto_sal', n: 'Amuleto de sal y plata', tipo: 'Amuleto', rar: 'infrecuente', peso: 0.2, val: 40, desc: 'Dificulta que te detecten los canes pálidos.', props: ['-20 a detección de residuo'] },
    { id: 'tratado_anat', n: 'Tratado de anatomía comparada', tipo: 'Libro', rar: 'infrecuente', peso: 2, val: 45, desc: 'Cuatrocientas páginas de láminas. Base de la creación de criaturas.', props: ['+15% progreso en Creación de criaturas'] },
    { id: 'lexico_thanel', n: 'Léxico de Thanel Antiguo', tipo: 'Libro', rar: 'raro', peso: 1.8, val: 180, desc: 'Incompleto, como todos.', props: ['+25 legibilidad del Códice'] }
  ];

  // MORTAJAS DEL CÓDICE: los sellos que hay que abrir, con requisitos reales
  W.mortajas = [
    { n: 1, titulo: 'Primera Mortaja — "Del rescoldo y la mano"', abierta: true, leg: 12,
      req: 'Abierta. Ilegible en su mayor parte.', contiene: ['Prender el Rescoldo Pálido (incompleta)', 'Nociones de residuo de muerte', 'Fragmento sobre la constitución del armazón'] },
    { n: 2, titulo: 'Segunda Mortaja — "De lo que obedece sin lengua"', abierta: false,
      req: 'Nigromancia ≥ 20 · Legibilidad ≥ 30 · una llave: hueso de alguien que murió sabiéndose observado',
      contiene: ['Control de no-muertos (completo)', 'Primer principio: la obediencia es un circuito'] },
    { n: 3, titulo: 'Tercera Mortaja — "Del hueso que no fue hueso"', abierta: false,
      req: 'Creación de criaturas ≥ 25 · Legibilidad ≥ 45 · una llave: armazón que haya sostenido maná un año',
      contiene: ['Construcción de guardianes (maestro)', 'Injerto de elemento en materia muerta'] },
    { n: 4, titulo: 'Cuarta Mortaja — "Del nombre que pesa"', abierta: false, req: 'Desconocido. La costura no cede.', contiene: ['?'] },
    { n: 5, titulo: 'Quinta Mortaja — "De la corona vacía"', abierta: false, req: 'Desconocido.', contiene: ['?'] },
    { n: 6, titulo: 'Sexta Mortaja — "Del territorio sin suelo"', abierta: false, req: 'Desconocido.', contiene: ['?'] },
    { n: 7, titulo: 'Séptima Mortaja — "De los clavos"', abierta: false, req: 'Desconocido.', contiene: ['?'] },
    { n: 8, titulo: 'Octava Mortaja — "Del recipiente"', abierta: false, req: 'Desconocido.', contiene: ['?'] },
    { n: 9, titulo: 'Novena Mortaja', abierta: false, req: 'La costura está hecha con algo que se mueve cuando la miras.', contiene: ['?'] }
  ];

  /* ───────────────────────── SABER E HISTORIA ───────────────────────── */
  // 'creencia' = lo que la gente cree. 'verdad' = lo que ocurrió (solo con descubrimiento).
  W.saber = [
    { id: 'l_ruina', t: 'La Ruina de Ranhollow (1019)', con: true,
      creencia: 'Un experimento de la universidad de Ranhollow salió mal y la ciudad se consumió en una tarde. Castigo divino, según la Llama Blanca.',
      verdad: 'Cuarenta mil personas murieron en un sellado de emergencia ejecutado por la Cofradía del Sello y la propia universidad, para encerrar algo que ya había cruzado. El sellado funcionó al 80%.' },
    { id: 'l_reyes', t: 'Los Nueve Reyes de Hueso', con: true,
      creencia: 'Nueve reyes guerreros de Kaldrun, enterrados de pie en la tundra hace mil cien años. Leyenda de clan, nada más.',
      verdad: 'Fueron nigromantes que pactaron con el Concilio de las Siete Coronas. Cinco túmulos están vacíos porque sus ocupantes se marcharon. El quinto, Vharnos Sel, escribió el Códice.' },
    { id: 'l_velo', t: 'El Velo', con: true,
      creencia: 'La frontera entre vivos y muertos se adelgaza cada cuarenta días. Los curas dicen que es la respiración de los dioses.',
      verdad: 'El ciclo no es natural. Es el latido de un sello enorme, y cada ciclo lo desgasta un poco.' },
    { id: 'l_codice', t: 'El Códice de las Nueve Mortajas', con: true,
      creencia: 'Un libro perdido que contiene toda la nigromancia. Tres órdenes lo buscan y cada una dice que es para destruirlo.',
      verdad: 'No contiene nigromancia: contiene instrucciones. Vharnos Sel lo escribió para que alguien terminara lo que él empezó, y el libro elige mal a propósito.' },
    { id: 'l_custodia', t: 'La Custodia de Ancestros', con: true,
      creencia: 'En Sarmeth la nigromancia es legal, con licencia e impuesto. Los reinos del norte lo consideran una barbaridad y un peligro.',
      verdad: 'Funciona. Llevan cuatrocientos años sin un incidente mayor, y eso incomoda a la Llama Blanca más que cualquier hereje.' },
    { id: 'l_siete_tum', t: 'Los Siete Túmulos de Grisbrial', con: true,
      creencia: 'Tumbas de jefes antiguos. Los rastreadores las han vaciado casi todas y no ha pasado nada.',
      verdad: 'No son tumbas. Son siete clavos de un sello y seis ya se han sacado.' },
    { id: 'l_tejedores', t: 'Los Tejedores de Gris', con: false,
      creencia: 'Supersticiones de barqueros: figuras grises que recogen a los muertos.',
      verdad: 'Existen, llevan un registro exacto y cobran. A un nigromante le cobran por cada alma retenida, con intereses.' },
    { id: 'l_osario', t: 'El Osario Profundo', con: false,
      creencia: 'Un cuento de enanos para asustar a los que cavan demasiado hondo.',
      verdad: 'Una ciudad de trescientos mil habitantes, ninguno vivo, gobernada por seis coronados que esperan algo.' },
    { id: 'l_quinta', t: 'La Quinta Corona', con: false,
      creencia: '—',
      verdad: 'El trono del Concilio que Vharnos Sel dejó vacío. Quien lo ocupe hereda el mando sobre todo lo que fue enterrado bajo juramento. El Concilio prefiere que siga vacío.' },
    { id: 'l_afuera', t: 'El Afuera', con: false,
      creencia: 'Herejía de los Nueve Coros.',
      verdad: 'Lo que el sello de la Ruina contiene al 80%.' }
  ];

  /* ───────── PLANTILLAS DE INVESTIGACIÓN ───────── */
  // dias = jornadas de trabajo base; req = requisitos; mat = materiales consumidos
  W.investigaciones = [
    { id: 'i_legibilidad', n: 'Descifrar la Primera Mortaja', rama: 'thanat', dias: 12, dif: 40,
      req: { int: 12 }, mat: [{ c: 'tinta_agalla', q: 1 }], desc: 'Comparar la notación del Códice con cualquier texto en Thanel que consigas.',
      premio: { legibilidad: 10, dominio: { nigro: 4 }, xp: 40 } },
    { id: 'i_residuo', n: 'Catalogar residuos de muerte del osario', rama: 'thanat', dias: 6, dif: 25,
      req: {}, mat: [{ c: 'sal_osa', q: 2 }], desc: 'Medir cómo se acumula y se disipa el residuo según el tiempo de enterramiento.',
      premio: { dominio: { nigro: 3, thanat: 6 }, xp: 25, comp: [{ c: 'rescoldo', q: 2 }] } },
    { id: 'i_rescoldo', n: 'Completar "Prender el Rescoldo Pálido"', rama: 'invo_nm', dias: 9, dif: 45,
      req: { nigro: 8 }, mat: [{ c: 'rescoldo', q: 1 }, { c: 'hueso_peq', q: 2 }], desc: 'Reconstruir la parte ilegible de la única técnica que el Códice te dejó ver.',
      premio: { hechizo: 'rescoldo_completo', dominio: { nigro: 5, invo_nm: 10 }, xp: 60 } },
    { id: 'i_anatomia', n: 'Estudio de anatomía comparada', rama: 'crea_cr', dias: 14, dif: 35,
      req: { int: 13 }, mat: [{ c: 'hueso_bestia', q: 1 }, { c: 'hueso_hum', q: 1 }], desc: 'Comparar estructuras para saber qué piezas encajan entre especies.',
      premio: { dominio: { crea_cr: 12, mod_cr: 5 }, xp: 55 } },
    { id: 'i_obediencia', n: 'El circuito de la obediencia', rama: 'ctrl_nm', dias: 18, dif: 55,
      req: { nigro: 15, invo_nm: 15 }, mat: [{ c: 'hilo_nervio', q: 1 }, { c: 'tiza_osa', q: 2 }], desc: 'Averiguar por qué un animado deja de obedecer a las ocho horas.',
      premio: { dominio: { ctrl_nm: 15, nigro: 5 }, xp: 80, principio: 'La obediencia es un circuito, no una orden' } },
    { id: 'i_sellos', n: 'Lectura de los sellos del páramo', rama: 'sello_nm', dias: 20, dif: 60,
      req: { nigro: 18, per: 12 }, mat: [{ c: 'tiza_osa', q: 3 }], desc: 'Copiar y comparar las inscripciones de los siete túmulos.',
      premio: { dominio: { sello_nm: 15 }, xp: 110, saber: 'l_siete_tum' } },
    { id: 'i_lamento', n: 'Naturaleza de los Lamentos', rama: 'esp_nm', dias: 16, dif: 50,
      req: { nigro: 12 }, mat: [{ c: 'esencia_pena', q: 1 }, { c: 'sal_osa', q: 3 }], desc: 'Determinar si un lamento conserva voluntad o solo repite.',
      premio: { dominio: { esp_nm: 14, almas_m: 4 }, xp: 85 } },
    { id: 'i_guardian', n: 'Diseño de guardián de umbral', rama: 'guard', dias: 22, dif: 58,
      req: { crea_cr: 20, nigro: 22 }, mat: [{ c: 'hueso_hum', q: 2 }, { c: 'plata_lab', q: 1 }, { c: 'sal_osa', q: 4 }], desc: 'Un centinela que distinga intrusos de habitantes sin que tengas que estar presente.',
      premio: { dominio: { guard: 18 }, xp: 140, receta: 'guardian_umbral' } },
    { id: 'i_mortaja2', n: 'Forzar la Segunda Mortaja', rama: 'thanat', dias: 25, dif: 70,
      req: { nigro: 20, legibilidad: 30 }, mat: [{ c: 'hueso_noble', q: 1 }, { c: 'sal_osa', q: 5 }], desc: 'La costura cede si se le ofrece lo que pide. Y pide una llave concreta.',
      premio: { mortaja: 2, xp: 220 }, riesgo: 35 },
    { id: 'i_transferencia', n: 'Primeros principios de transferencia espiritual', rama: 'transf', dias: 45, dif: 85,
      req: { nigro: 45, almas_m: 30 }, mat: [{ c: 'alma_bestia', q: 1 }, { c: 'cristal_man', q: 2 }], desc: 'Mover algo que no tiene masa de un recipiente a otro sin perderlo.',
      premio: { dominio: { transf: 20, almas_m: 10 }, xp: 400 }, riesgo: 55 }
  ];

  /* ───────── CATÁLOGO DE EFECTOS PARA CREAR HECHIZOS ───────── */
  // Cada efecto tiene coste base de maná, dificultad base y escuela natural
  W.efectos = [
    { id: 'daño', n: 'Daño directo', base: 4, dif: 20, esc: null, desc: 'Herir con la escuela elegida.' },
    { id: 'animar', n: 'Animar materia muerta', base: 6, dif: 30, esc: 'nigro', desc: 'Dar movimiento a un cuerpo o pieza sin vida.' },
    { id: 'controlar', n: 'Controlar / ordenar', base: 5, dif: 35, esc: 'nigro', desc: 'Imponer obediencia sobre algo ya animado.' },
    { id: 'percibir', n: 'Percibir / detectar', base: 2, dif: 15, esc: null, desc: 'Obtener información del entorno.' },
    { id: 'proteger', n: 'Proteger / barrera', base: 5, dif: 25, esc: 'barrera', desc: 'Interponer defensa.' },
    { id: 'maldecir', n: 'Maldecir / debilitar', base: 6, dif: 40, esc: 'maldi', desc: 'Degradar a un objetivo con efecto diferido.' },
    { id: 'sanar', n: 'Reparar / sostener', base: 7, dif: 35, esc: null, desc: 'Restaurar integridad (a los no-muertos, remendarlos).' },
    { id: 'ocultar', n: 'Ocultar / disimular', base: 4, dif: 25, esc: 'sombra', desc: 'Esconder algo de la percepción ajena.' },
    { id: 'invocar', n: 'Invocar / traer', base: 10, dif: 45, esc: 'invoca', desc: 'Traer una entidad y sostenerla.' },
    { id: 'sellar', n: 'Sellar / encerrar', base: 8, dif: 50, esc: 'sello', desc: 'Impedir que algo actúe o salga.' },
    { id: 'transformar', n: 'Transformar materia', base: 9, dif: 55, esc: 'transmu', desc: 'Cambiar lo que algo es.' },
    { id: 'mover', n: 'Mover / desplazar', base: 4, dif: 25, esc: null, desc: 'Fuerza a distancia, desplazamiento, salto.' },
    { id: 'vincular', n: 'Vincular', base: 6, dif: 40, esc: 'nigro', desc: 'Atar dos cosas para que compartan estado.' },
    { id: 'extraer', n: 'Extraer esencia o alma', base: 12, dif: 65, esc: 'almas', desc: 'Separar lo incorpóreo de su soporte. Crimen capital en Valdrath.' },
    { id: 'ritual', n: 'Rito permanente', base: 20, dif: 60, esc: null, desc: 'Efecto que se sostiene solo tras la consagración.' }
  ];

  W.escalas = [
    { id: 1, n: 'Ínfima', m: 0.5, dif: 0, desc: 'Una rata, un dedo, una chispa.' },
    { id: 2, n: 'Menor', m: 1, dif: 8, desc: 'Un animal pequeño, un cuchillo, una vela.' },
    { id: 3, n: 'Moderada', m: 2, dif: 20, desc: 'Un hombre, una puerta, una habitación.' },
    { id: 4, n: 'Considerable', m: 4, dif: 35, desc: 'Varios hombres, un carro, una casa.' },
    { id: 5, n: 'Grande', m: 8, dif: 50, desc: 'Una docena, un muro, un patio.' },
    { id: 6, n: 'Mayor', m: 16, dif: 68, desc: 'Un pelotón, un edificio, una plaza.' },
    { id: 7, n: 'Masiva', m: 32, dif: 85, desc: 'Un centenar, una calle entera.' },
    { id: 8, n: 'Catastrófica', m: 64, dif: 105, desc: 'Un barrio, una compañía militar.' },
    { id: 9, n: 'Territorial', m: 128, dif: 130, desc: 'Una ciudad, un valle.' },
    { id: 10, n: 'Mítica', m: 256, dif: 160, desc: 'Lo que entra en las crónicas.' }
  ];

  /* ───────── SUCESOS AUTÓNOMOS DEL MUNDO ───────── */
  // alc: alcance (local | regional | continental). p: peso de probabilidad.
  W.sucesos = [
    { id: 'e_leva', p: 8, alc: 'regional', t: 'Nueva leva de grano', txt: '{pol} ordena una leva extraordinaria de grano en {reg}.', ef: { est: -4, tes: 900 } },
    { id: 'e_bandidos', p: 10, alc: 'local', t: 'Bandidos en los caminos', txt: 'Una partida de desertores asalta carros en {reg}.', ef: { est: -3 } },
    { id: 'e_cosecha', p: 7, alc: 'regional', t: 'Cosecha desigual', txt: 'La cosecha de {reg} rinde menos de lo previsto.', ef: { grano: -8, est: -2 } },
    { id: 'e_peste', p: 3, alc: 'regional', t: 'Fiebre de las vegas', txt: 'Una fiebre se extiende por las aldeas de {reg}. Mueren sobre todo niños y viejos.', ef: { pob: -0.012, est: -6 } },
    { id: 'e_guerra_dec', p: 2, alc: 'continental', t: 'Declaración de guerra', txt: '{pol} declara la guerra a {pol2}.', ef: { est: -8 }, especial: 'guerra' },
    { id: 'e_alianza', p: 3, alc: 'continental', t: 'Pacto firmado', txt: '{pol} y {pol2} firman un pacto de no agresión.', especial: 'alianza' },
    { id: 'e_batalla', p: 5, alc: 'continental', t: 'Batalla', txt: 'Las fuerzas de {pol} y {pol2} chocan en campo abierto.', especial: 'batalla' },
    { id: 'e_sucesion', p: 2, alc: 'continental', t: 'Crisis de sucesión', txt: 'La corte de {pol} se divide en facciones.', ef: { est: -12 } },
    { id: 'e_impuesto', p: 6, alc: 'regional', t: 'Subida de impuestos', txt: '{pol} sube los impuestos para pagar sus guarniciones.', ef: { tes: 2200, est: -5 } },
    { id: 'e_motin', p: 4, alc: 'local', t: 'Motín', txt: 'Hay disturbios por el pan en {loc}.', ef: { est: -9, pob: -0.002 } },
    { id: 'e_caza', p: 7, alc: 'regional', t: 'Caza de herejes', txt: 'La Orden del Sello Blanco abre proceso contra tres personas en {reg}.', ef: { est: 2 }, especial: 'caza' },
    { id: 'e_criaturas', p: 6, alc: 'local', t: 'Avistamientos', txt: 'Los pastores de {reg} informan de criaturas que bajan del páramo.', especial: 'bestias' },
    { id: 'e_descubrimiento', p: 4, alc: 'continental', t: 'Hallazgo', txt: 'La Academia de Fonteclara anuncia un hallazgo en {loc}.', ef: { inf: 3 } },
    { id: 'e_mercado', p: 8, alc: 'regional', t: 'Movimiento de precios', txt: 'El precio de {rec} se mueve en los mercados de {reg}.', especial: 'precio' },
    { id: 'e_migracion', p: 5, alc: 'local', t: 'Migración', txt: 'Varias familias abandonan {loc} buscando trabajo.', ef: { pob: -0.008 } },
    { id: 'e_fundacion', p: 2, alc: 'regional', t: 'Nueva fundación', txt: '{pol} autoriza una nueva aldea en tierras de frontera.', ef: { est: 3 } },
    { id: 'e_tumulo', p: 4, alc: 'local', t: 'Túmulo abierto', txt: 'Los rastreadores abren otro túmulo en el Páramo de los Siete Túmulos.', especial: 'tumulo' },
    { id: 'e_velo', p: 5, alc: 'local', t: 'El Velo se adelgaza', txt: 'Las lámparas se apagan solas en {loc} durante la noche.', especial: 'velo' },
    { id: 'e_org', p: 9, alc: 'continental', t: 'Movimiento de organización', txt: '{org} avanza en sus objetivos.', especial: 'org' },
    { id: 'e_npc', p: 10, alc: 'local', t: 'Asunto personal', txt: '', especial: 'npc' }
  ];

  window.TS.W = W;
})();
