// Personajes de la Fase 5: Búsqueda de Tsunade + Rescate de Sasuke

const phase5Characters = {
    // Aliados
    tsunade: {
        id: 'tsunade',
        name: 'Tsunade',
        title: 'La Quinta Hokage',
        hp: 1800,
        maxHp: 1800,
        chakra: 1200,
        maxChakra: 1200,
        strength: 130,
        ninjutsu: 95,
        genjutsu: 70,
        speed: 75,
        defense: 85,
        element: 'tierra',
        isAlly: true,
        description: 'La legendaria Sannin y nueva Hokage de Konoha'
    },
    shizune: {
        id: 'shizune',
        name: 'Shizune',
        title: 'Discípula de Tsunade',
        hp: 900,
        maxHp: 900,
        chakra: 700,
        maxChakra: 700,
        strength: 45,
        ninjutsu: 65,
        genjutsu: 70,
        speed: 60,
        defense: 50,
        element: 'agua',
        isAlly: true,
        description: 'Leal asistente de Tsunade y ninja médico'
    },
    jiraiyaF5: {
        id: 'jiraiya_f5',
        name: 'Jiraiya',
        title: 'El Sannin Ero-Sennin',
        hp: 1600,
        maxHp: 1600,
        chakra: 1400,
        maxChakra: 1400,
        strength: 85,
        ninjutsu: 110,
        genjutsu: 80,
        speed: 70,
        defense: 75,
        element: 'fuego',
        isAlly: true,
        description: 'Maestro de Naruto y uno de los Legendarios Sannin'
    },
    
    // Enemigos - Akatsuki
    itachi: {
        id: 'itachi',
        name: 'Itachi Uchiha',
        title: 'El Genio del Clan Uchiha',
        hp: 1400,
        maxHp: 1400,
        chakra: 1300,
        maxChakra: 1300,
        strength: 75,
        ninjutsu: 120,
        genjutsu: 130,
        speed: 95,
        defense: 70,
        element: 'fuego',
        isAlly: false,
        description: 'Miembro de Akatsuki, hermano de Sasuke'
    },
    kisame: {
        id: 'kisame',
        name: 'Kisame Hoshigaki',
        title: 'La Bestia sin Cola',
        hp: 1700,
        maxHp: 1700,
        chakra: 1100,
        maxChakra: 1100,
        strength: 110,
        ninjutsu: 85,
        genjutsu: 60,
        speed: 70,
        defense: 90,
        element: 'agua',
        isAlly: false,
        description: 'Espadachín de Akatsuki con Samehada'
    },
    deidara: {
        id: 'deidara',
        name: 'Deidara',
        title: 'El Artista Explosivo',
        hp: 1200,
        maxHp: 1200,
        chakra: 1000,
        maxChakra: 1000,
        strength: 60,
        ninjutsu: 105,
        genjutsu: 50,
        speed: 85,
        defense: 55,
        element: 'tierra',
        isAlly: false,
        description: 'Miembro de Akatsuki experto en explosivos'
    },
    sasori: {
        id: 'sasori',
        name: 'Sasori',
        title: 'Sasori de la Arena Roja',
        hp: 1100,
        maxHp: 1100,
        chakra: 950,
        maxChakra: 950,
        strength: 70,
        ninjutsu: 100,
        genjutsu: 85,
        speed: 65,
        defense: 80,
        element: 'viento',
        isAlly: false,
        description: 'Maestro de marionetas de Akatsuki'
    },
    
    // Orochimaru y secuaces
    orochimaruF5: {
        id: 'orochimaru_f5',
        name: 'Orochimaru',
        title: 'La Serpiente Inmortal',
        hp: 1500,
        maxHp: 1500,
        chakra: 1400,
        maxChakra: 1400,
        strength: 70,
        ninjutsu: 125,
        genjutsu: 95,
        speed: 80,
        defense: 65,
        element: 'viento',
        isAlly: false,
        description: 'Ex-Sannin buscando el poder absoluto'
    },
    kabuto: {
        id: 'kabuto',
        name: 'Kabuto Yakushi',
        title: 'La Mano Derecha de Orochimaru',
        hp: 1000,
        maxHp: 1000,
        chakra: 900,
        maxChakra: 900,
        strength: 55,
        ninjutsu: 85,
        genjutsu: 90,
        speed: 75,
        defense: 60,
        element: 'agua',
        isAlly: false,
        description: 'Ninja médico leal a Orochimaru'
    },
    kimimaro: {
        id: 'kimimaro',
        name: 'Kimimaro',
        title: 'El Último del Clan Kaguya',
        hp: 1300,
        maxHp: 1300,
        chakra: 800,
        maxChakra: 800,
        strength: 95,
        ninjutsu: 70,
        genjutsu: 40,
        speed: 90,
        defense: 75,
        element: 'tierra',
        isAlly: false,
        description: 'Portador del Kekkei Genkai Shikotsumyaku'
    },
    jirobo: {
        id: 'jirobo',
        name: 'Jirobo',
        title: 'El Gigante de los Cuatro Sonidos',
        hp: 1400,
        maxHp: 1400,
        chakra: 700,
        maxChakra: 700,
        strength: 100,
        ninjutsu: 65,
        genjutsu: 50,
        speed: 50,
        defense: 95,
        element: 'tierra',
        isAlly: false,
        description: 'Miembro más fuerte físicamente de los Cuatro Sonidos'
    },
    kidomaru: {
        id: 'kidomaru',
        name: 'Kidomaru',
        title: 'El Arquero de los Cuatro Sonidos',
        hp: 1100,
        maxHp: 1100,
        chakra: 850,
        maxChakra: 850,
        strength: 60,
        ninjutsu: 80,
        genjutsu: 70,
        speed: 85,
        defense: 55,
        element: 'rayo',
        isAlly: false,
        description: 'Experto en ataques a distancia con su arco'
    },
    tayuya: {
        id: 'tayuya',
        name: 'Tayuya',
        title: 'La Flautista de los Cuatro Sonidos',
        hp: 950,
        maxHp: 950,
        chakra: 900,
        maxChakra: 900,
        strength: 45,
        ninjutsu: 75,
        genjutsu: 95,
        speed: 70,
        defense: 50,
        element: 'viento',
        isAlly: false,
        description: 'Maestra del genjutsu musical'
    },
    sakonUkon: {
        id: 'sakon_ukon',
        name: 'Sakon & Ukon',
        title: 'Los Hermanos Simbióticos',
        hp: 1150,
        maxHp: 1150,
        chakra: 800,
        maxChakra: 800,
        strength: 75,
        ninjutsu: 70,
        genjutsu: 60,
        speed: 80,
        defense: 65,
        element: 'fuego',
        isAlly: false,
        description: 'Hermanos que comparten un mismo cuerpo'
    }
};

// Jutsus exclusivos de la Fase 5
const phase5Jutsus = [
    // Jutsus de Tsunade
    {
        id: 'puño_caótico',
        name: 'Puño Caótico',
        type: 'taijutsu',
        rank: 'A',
        power: 140,
        chakraCost: 60,
        accuracy: 95,
        element: 'tierra',
        description: 'Devastador ataque físico que destruye el terreno',
        users: ['tsunade']
    },
    {
        id: 'palma_curativa',
        name: 'Palma Curativa',
        type: 'curacion',
        rank: 'B',
        power: 0,
        healPower: 400,
        chakraCost: 80,
        accuracy: 100,
        element: 'neutral',
        description: 'Cura heridas graves usando chakra médico',
        users: ['tsunade', 'shizune']
    },
    {
        id: 'creacion_renacimiento',
        name: 'Creación Renacimiento',
        type: 'curacion',
        rank: 'S',
        power: 0,
        healPower: 800,
        chakraCost: 150,
        accuracy: 100,
        element: 'neutral',
        description: 'Técnica prohibida que cura cualquier herida instantáneamente',
        users: ['tsunade']
    },
    
    // Jutsus de Itachi
    {
        id: 'tsukuyomi',
        name: 'Tsukuyomi',
        type: 'genjutsu',
        rank: 'S',
        power: 130,
        chakraCost: 100,
        accuracy: 90,
        element: 'ilusion',
        description: 'Genjutsu supremo que controla el tiempo en la mente del oponente',
        users: ['itachi']
    },
    {
        id: 'amaterasu',
        name: 'Amaterasu',
        type: 'ninjutsu',
        rank: 'S',
        power: 150,
        chakraCost: 120,
        accuracy: 85,
        element: 'fuego',
        description: 'Llamas negras que nunca se apagan hasta consumir todo',
        users: ['itachi']
    },
    {
        id: 'susano_itachi',
        name: 'Susanoo',
        type: 'ninjutsu',
        rank: 'S',
        power: 160,
        chakraCost: 140,
        accuracy: 80,
        element: 'ilusion',
        description: 'Avatar de chakra que protege y ataca con poder devastador',
        users: ['itachi']
    },
    
    // Jutsus de Kisame
    {
        id: 'danza_tiburón',
        name: 'Danza del Tiburón',
        type: 'taijutsu',
        rank: 'B',
        power: 100,
        chakraCost: 50,
        accuracy: 90,
        element: 'agua',
        description: 'Ataque giratorio imitando a un tiburón',
        users: ['kisame']
    },
    {
        id: 'prision_tiburón',
        name: 'Prisión de Tiburones',
        type: 'ninjutsu',
        rank: 'A',
        power: 120,
        chakraCost: 80,
        accuracy: 85,
        element: 'agua',
        description: 'Invoca tiburones para atrapar y devorar al enemigo',
        users: ['kisame']
    },
    
    // Jutsus de Deidara
    {
        id: 'arte_explosivo_pájaro',
        name: 'Arte Explosivo: Pájaro',
        type: 'ninjutsu',
        rank: 'B',
        power: 90,
        chakraCost: 55,
        accuracy: 90,
        element: 'tierra',
        description: 'Crea pájaros explosivos para atacar desde el aire',
        users: ['deidara']
    },
    {
        id: 'c2_dragon',
        name: 'C2: Dragón Explosivo',
        type: 'ninjutsu',
        rank: 'A',
        power: 130,
        chakraCost: 90,
        accuracy: 85,
        element: 'tierra',
        description: 'Dragón gigante que explota al contacto',
        users: ['deidara']
    },
    
    // Jutsus de Sasori
    {
        id: 'marioneta_hiruko',
        name: 'Marioneta: Hiruko',
        type: 'ninjutsu',
        rank: 'B',
        power: 85,
        chakraCost: 50,
        accuracy: 85,
        element: 'viento',
        description: 'Combate usando la marioneta Hiruko como defensa y ataque',
        users: ['sasori']
    },
    {
        id: 'mil_manos',
        name: 'Mil Manos de Hierro',
        type: 'ninjutsu',
        rank: 'A',
        power: 125,
        chakraCost: 85,
        accuracy: 80,
        element: 'viento',
        description: 'Lluvia de senbon envenenadas desde múltiples brazos',
        users: ['sasori']
    },
    
    // Jutsus de Orochimaru
    {
        id: 'mil_serpientes',
        name: 'Mil Años de Dolor (Serpientes)',
        type: 'ninjutsu',
        rank: 'A',
        power: 115,
        chakraCost: 75,
        accuracy: 90,
        element: 'viento',
        description: 'Invoca miles de serpientes para atacar',
        users: ['orochimaru_f5']
    },
    {
        id: 'espada_kusanagi',
        name: 'Espada Kusanagi',
        type: 'taijutsu',
        rank: 'A',
        power: 120,
        chakraCost: 65,
        accuracy: 95,
        element: 'viento',
        description: 'Ataque con la legendaria espada que se extiende',
        users: ['orochimaru_f5']
    },
    {
        id: 'invocacion_manda',
        name: 'Invocación: Manda',
        type: 'ninjutsu',
        rank: 'S',
        power: 155,
        chakraCost: 130,
        accuracy: 80,
        element: 'viento',
        description: 'Invoca a Manda, la serpiente gigante',
        users: ['orochimaru_f5']
    },
    
    // Jutsus de Kabuto
    {
        id: 'escalpelo_chakra',
        name: 'Escalpelo de Chakra',
        type: 'taijutsu',
        rank: 'B',
        power: 85,
        chakraCost: 45,
        accuracy: 95,
        element: 'neutral',
        description: 'Corta tejidos internos usando chakra preciso',
        users: ['kabuto']
    },
    {
        id: 'cura_kabuto',
        name: 'Curación de Kabuto',
        type: 'curacion',
        rank: 'B',
        power: 0,
        healPower: 300,
        chakraCost: 60,
        accuracy: 100,
        element: 'neutral',
        description: 'Cura heridas usando técnicas médicas avanzadas',
        users: ['kabuto']
    },
    
    // Jutsus de Kimimaro
    {
        id: 'danza_sauce',
        name: 'Danza del Sauce',
        type: 'taijutsu',
        rank: 'A',
        power: 110,
        chakraCost: 60,
        accuracy: 90,
        element: 'tierra',
        description: 'Ataque con huesos que emergen del cuerpo',
        users: ['kimimaro']
    },
    {
        id: 'danza_loto',
        name: 'Danza del Loto Primario',
        type: 'taijutsu',
        rank: 'S',
        power: 140,
        chakraCost: 95,
        accuracy: 85,
        element: 'tierra',
        description: 'Transformación completa en arma ósea letal',
        users: ['kimimaro']
    },
    
    // Jutsus de los Cuatro Sonidos
    {
        id: 'campo_barrera',
        name: 'Campo de Barrera de Sonido',
        type: 'ninjutsu',
        rank: 'B',
        power: 70,
        chakraCost: 55,
        accuracy: 85,
        element: 'tierra',
        description: 'Barrera que amplifica el poder del usuario',
        users: ['jirobo', 'kidomaru', 'tayuya', 'sakon_ukon']
    },
    {
        id: 'arco_demoníaco',
        name: 'Arco Demoníaco',
        type: 'ninjutsu',
        rank: 'A',
        power: 115,
        chakraCost: 70,
        accuracy: 90,
        element: 'rayo',
        description: 'Flecha de chakra puro con poder destructivo',
        users: ['kidomaru']
    },
    {
        id: 'flauta_demoníaca',
        name: 'Flauta Demoníaca',
        type: 'genjutsu',
        rank: 'A',
        power: 105,
        chakraCost: 75,
        accuracy: 85,
        element: 'ilusion',
        description: 'Melodía que controla la mente del oponente',
        users: ['tayuya']
    },
    {
        id: 'fusión_simbiótica',
        name: 'Fusión Simbiótica',
        type: 'ninjutsu',
        rank: 'A',
        power: 120,
        chakraCost: 80,
        accuracy: 85,
        element: 'fuego',
        description: 'Ukon emerge para atacar directamente',
        users: ['sakon_ukon']
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { phase5Characters, phase5Jutsus };
}
