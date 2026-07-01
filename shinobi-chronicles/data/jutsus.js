// Jutsus de prueba - Datos de configuración
const JUTSUS = {
    // Taijutsu básico
    basic_punch: {
        id: 'basic_punch',
        name: 'Golpe Básico',
        rank: 'E',
        type: 'taijutsu',
        element: null,
        chakraCost: 0,
        baseDamage: 10,
        effects: [],
        description: 'Un golpe físico simple sin consumo de chakra',
        animation: 'punch'
    },
    
    // Ninjutsu de Fuego
    fireball: {
        id: 'fireball',
        name: 'Bola de Fuego',
        rank: 'C',
        type: 'ninjutsu',
        element: 'fire',
        chakraCost: 15,
        baseDamage: 25,
        effects: [],
        description: 'Una poderosa bola de fuego que consume al enemigo',
        animation: 'fire'
    },
    
    // Ninjutsu de Agua
    water_bullet: {
        id: 'water_bullet',
        name: 'Bala de Agua',
        rank: 'C',
        type: 'ninjutsu',
        element: 'water',
        chakraCost: 15,
        baseDamage: 25,
        effects: [],
        description: 'Un proyectil de agua a alta presión',
        animation: 'water'
    },
    
    // Ninjutsu de Viento
    wind_blade: {
        id: 'wind_blade',
        name: 'Hoja de Viento',
        rank: 'C',
        type: 'ninjutsu',
        element: 'wind',
        chakraCost: 15,
        baseDamage: 25,
        effects: [],
        description: 'Cuchillas de viento que cortan al enemigo',
        animation: 'wind'
    },
    
    // Jutsu de curación
    healing_jutsu: {
        id: 'healing_jutsu',
        name: 'Jutsu Curativo',
        rank: 'D',
        type: 'ninjutsu',
        element: null,
        chakraCost: 20,
        baseDamage: 0,
        healAmount: 30,
        effects: ['heal'],
        description: 'Recupera salud del usuario',
        animation: 'heal'
    },
    
    // Genjutsu básico
    illusion_basic: {
        id: 'illusion_basic',
        name: 'Ilusión Básica',
        rank: 'D',
        type: 'genjutsu',
        element: null,
        chakraCost: 12,
        baseDamage: 5,
        effects: ['confuse'],
        description: 'Confunde al enemigo reduciendo su precisión',
        animation: 'illusion'
    },
    
    // Clon de Sombra (desbloqueable nivel 4)
    shadow_clone: {
        id: 'shadow_clone',
        name: 'Clon de Sombra',
        rank: 'B',
        type: 'ninjutsu',
        element: null,
        chakraCost: 25,
        baseDamage: 15,
        effects: ['multi_hit'],
        description: 'Crea clones que atacan simultáneamente',
        animation: 'clone'
    },
    
    // Rasengan (desbloqueable nivel 5)
    rasengan: {
        id: 'rasengan',
        name: 'Rasengan',
        rank: 'A',
        type: 'ninjutsu',
        element: null,
        chakraCost: 35,
        baseDamage: 45,
        effects: ['ignore_defense'],
        description: 'Esfera de chakra giratoria de alto poder',
        animation: 'rasengan'
    },
    
    // Chidori (desbloqueable nivel 6)
    chidori: {
        id: 'chidori',
        name: 'Chidori',
        rank: 'A',
        type: 'ninjutsu',
        element: 'lightning',
        chakraCost: 40,
        baseDamage: 50,
        effects: ['crit_boost'],
        description: 'Mil pájaros: ataque de rayo perforante',
        animation: 'chidori'
    },
    
    // Modo Sabio (desbloqueable nivel 7)
    sage_mode: {
        id: 'sage_mode',
        name: 'Modo Sabio',
        rank: 'S',
        type: 'ninjutsu',
        element: null,
        chakraCost: 50,
        baseDamage: 0,
        effects: ['buff_all_stats'],
        buffDuration: 3,
        description: 'Aumenta todas las estadísticas temporalmente',
        animation: 'sage'
    },
    
    // Chakra del Nueve Colas (desbloqueable nivel 8)
    nine_tails_chakra: {
        id: 'nine_tails_chakra',
        name: 'Manto Kyubi',
        rank: 'S',
        type: 'ninjutsu',
        element: null,
        chakraCost: 60,
        baseDamage: 30,
        effects: ['damage_aura', 'regen'],
        description: 'Libera el poder del Zorro de Nueve Colas',
        animation: 'kyubi'
    },
    
    // Sabio de los Seis Caminos (desbloqueable nivel 9)
    six_paths_sage: {
        id: 'six_paths_sage',
        name: 'Sabio Seis Caminos',
        rank: 'S',
        type: 'ninjutsu',
        element: null,
        chakraCost: 80,
        baseDamage: 70,
        effects: ['god_mode', 'fly'],
        description: 'Poder divino del Sabio de los Seis Caminos',
        animation: 'six_paths'
    },
    
    // Bomba Bestia con Cola (desbloqueable nivel 10)
    bijuu_bomb: {
        id: 'bijuu_bomb',
        name: 'Bomba Bijuu',
        rank: 'S',
        type: 'ninjutsu',
        element: null,
        chakraCost: 100,
        baseDamage: 100,
        effects: ['massive_aoe'],
        description: 'Ataque masivo de energía concentrada',
        animation: 'bijuu_bomb'
    }
};

// Tipos de jutsus
const JUTSU_TYPES = {
    ninjutsu: { name: 'Ninjutsu', icon: '🌀', description: 'Técnicas ninja que manipulan elementos o energía' },
    genjutsu: { name: 'Genjutsu', icon: '👁️', description: 'Técnicas de ilusión que afectan la mente' },
    taijutsu: { name: 'Taijutsu', icon: '👊', description: 'Técnicas de combate cuerpo a cuerpo' }
};

// Rangos de jutsus
const JUTSU_RANKS = {
    E: { name: 'Rango E', multiplier: 0.5, description: 'Técnicas básicas de academia' },
    D: { name: 'Rango D', multiplier: 0.75, description: 'Técnicas de nivel genin' },
    C: { name: 'Rango C', multiplier: 1.0, description: 'Técnicas de nivel chunin' },
    B: { name: 'Rango B', multiplier: 1.25, description: 'Técnicas de nivel jonin' },
    A: { name: 'Rango A', multiplier: 1.5, description: 'Técnicas de nivel elite' },
    S: { name: 'Rango S', multiplier: 2.0, description: 'Técnicas secretas y prohibidas' }
};

// Función para obtener un jutsu por ID
function getJutsu(jutsuId) {
    return JUTSUS[jutsuId] || null;
}

// Función para obtener todos los jutsus disponibles
function getAllJutsus() {
    return Object.values(JUTSUS);
}

// Función para calcular el daño real de un jutsu considerando ventajas elementales
function calculateJutsuDamage(jutsu, attacker, defender) {
    let damage = jutsu.baseDamage;
    
    // Aplicar bonificación de estadística Ninjutsu
    if (jutsu.type === 'ninjutsu' || jutsu.type === 'genjutsu') {
        damage += attacker.stats.ninjutsu * 0.5;
    }
    
    // Verificar ventajas elementales
    if (jutsu.element && defender.element) {
        const elementData = ELEMENTS[jutsu.element];
        if (elementData && elementData.strongAgainst === defender.element) {
            damage *= 1.5; // Super efectivo
        } else if (elementData && elementData.weakAgainst === defender.element) {
            damage *= 0.75; // No muy efectivo
        }
    }
    
    // Reducir por defensa del objetivo
    const defenseReduction = defender.stats.defense * 0.3;
    damage = Math.max(1, damage - defenseReduction);
    
    return Math.floor(damage);
}
