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
