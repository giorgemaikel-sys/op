// Personajes del juego - Datos de configuración
const CHARACTERS = {
    // Personaje jugable principal
    naruto: {
        id: 'naruto',
        name: 'Naruto Uzumaki',
        sprite: '🍥',
        stats: {
            hp: 100,
            maxHp: 100,
            chakra: 50,
            maxChakra: 50,
            strength: 15,      // Daño Taijutsu
            ninjutsu: 12,      // Daño/efectividad jutsus
            genjutsu: 5,       // Poder y resistencia a ilusiones
            speed: 14,         // Orden de turno y evasión
            defense: 10        // Reducción de daño
        },
        element: 'wind',       // Afinidad elemental principal
        secondaryElement: null,
        level: 1,
        exp: 0,
        isPlayer: true
    },
    
    // Enemigos de prueba
    enemy_ninja: {
        id: 'enemy_ninja',
        name: 'Ninja Renegado',
        sprite: '⚔️',
        stats: {
            hp: 80,
            maxHp: 80,
            chakra: 40,
            maxChakra: 40,
            strength: 12,
            ninjutsu: 10,
            genjutsu: 8,
            speed: 11,
            defense: 8
        },
        element: 'fire',
        secondaryElement: null,
        level: 1,
        exp: 50,
        isPlayer: false
    },
    
    enemy_bandit: {
        id: 'enemy_bandit',
        name: 'Bandido',
        sprite: '🗡️',
        stats: {
            hp: 60,
            maxHp: 60,
            chakra: 20,
            maxChakra: 20,
            strength: 14,
            ninjutsu: 5,
            genjutsu: 3,
            speed: 9,
            defense: 6
        },
        element: null,
        secondaryElement: null,
        level: 1,
        exp: 30,
        isPlayer: false
    }
};

// Elementos y sus ventajas
const ELEMENTS = {
    fire: { name: 'Fuego', icon: '🔥', strongAgainst: 'wind', weakAgainst: 'water' },
    water: { name: 'Agua', icon: '💧', strongAgainst: 'fire', weakAgainst: 'earth' },
    wind: { name: 'Viento', icon: '💨', strongAgainst: 'lightning', weakAgainst: 'fire' },
    lightning: { name: 'Rayo', icon: '⚡', strongAgainst: 'earth', weakAgainst: 'wind' },
    earth: { name: 'Tierra', icon: '🪨', strongAgainst: 'water', weakAgainst: 'lightning' }
};

// Función para crear una copia profunda de un personaje
function createCharacterCopy(characterId) {
    const original = CHARACTERS[characterId];
    if (!original) return null;
    
    return JSON.parse(JSON.stringify(original));
}
