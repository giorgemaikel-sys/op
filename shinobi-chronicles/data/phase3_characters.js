/**
 * Personajes de la Fase 3 - Academia y Tierra de las Olas
 */

// NPCs aliados
const allies = {
    iruka: {
        id: 'iruka',
        name: 'Iruka Umino',
        role: 'Sensei de Academia',
        description: 'Tu primer maestro y mentor. Siempre ha creído en ti.',
        relationship: 100,
        dialogues: ['iruka_intro']
    },
    
    hokage: {
        id: 'hokage',
        name: 'Tercer Hokage',
        role: 'Líder de Konoha',
        description: 'El Profesor. Sabio y poderoso, te ve como un nieto.',
        relationship: 80,
        dialogues: ['hokage_graduation']
    },
    
    kakashi: {
        id: 'kakashi',
        name: 'Kakashi Hatake',
        role: 'Jonin Sensei',
        description: 'Tu líder de equipo. El ninja copia con Sharingan.',
        relationship: 60,
        dialogues: []
    },
    
    sasuke: {
        id: 'sasuke',
        name: 'Sasuke Uchiha',
        role: 'Compañero de Equipo',
        description: 'El último Uchiha. Talentoso pero distante.',
        relationship: 40,
        dialogues: []
    },
    
    sakura: {
        id: 'sakura',
        name: 'Sakura Haruno',
        role: 'Compañera de Equipo',
        description: 'Una kunoichi inteligente con gran control de chakra.',
        relationship: 50,
        dialogues: []
    },
    
    tazuna: {
        id: 'tazuna',
        name: 'Tazuna',
        role: 'Constructor de Puentes',
        description: 'El cliente de tu primera misión rango C... o eso creías.',
        relationship: 70,
        dialogues: ['tazuna_meeting', 'bridge_completion']
    }
};

// Enemigos de la Saga de la Academia
const academyEnemies = [
    {
        id: 'mizuki_1',
        name: 'Mizuki',
        title: 'El Traidor',
        level: 3,
        hp: 150,
        chakra: 80,
        stats: {
            strength: 12,
            ninjutsu: 10,
            genjutsu: 8,
            speed: 11,
            defense: 9
        },
        element: 'wind',
        jutsus: ['wind_blade', 'clone_jutsu', 'shuriken_shadow'],
        dialogue: 'mizuki_betrayal',
        rewards: { xp: 500, ryo: 1000, items: ['Pergamino Prohibido (Falso)'] }
    },
    {
        id: 'mizuki_clone',
        name: 'Clon de Mizuki',
        title: 'Ilusión del Traidor',
        level: 2,
        hp: 60,
        chakra: 40,
        stats: {
            strength: 8,
            ninjutsu: 6,
            genjutsu: 10,
            speed: 10,
            defense: 5
        },
        element: 'wind',
        jutsus: ['clone_jutsu', 'transform_jutsu'],
        rewards: { xp: 100, ryo: 200 }
    }
];

// Enemigos de la Tierra de las Olas
const waveEnemies = [
    {
        id: 'bandit',
        name: 'Bandido',
        title: 'Mercenario de Gato',
        level: 4,
        hp: 80,
        chakra: 30,
        stats: {
            strength: 10,
            ninjutsu: 3,
            genjutsu: 2,
            speed: 8,
            defense: 7
        },
        element: 'none',
        jutsus: ['basic_attack', 'throw_kunai'],
        rewards: { xp: 150, ryo: 300 }
    },
    
    {
        id: 'demon_brother_1',
        name: 'Demonio Hermano 1',
        title: 'Asesino de la Niebla',
        level: 6,
        hp: 200,
        chakra: 100,
        stats: {
            strength: 15,
            ninjutsu: 12,
            genjutsu: 8,
            speed: 14,
            defense: 11
        },
        element: 'water',
        jutsus: ['water_clone', 'demon_shuriken', 'chain_attack'],
        rewards: { xp: 600, ryo: 1200 }
    },
    
    {
        id: 'demon_brother_2',
        name: 'Demonio Hermano 2',
        title: 'Asesino de la Niebla',
        level: 6,
        hp: 200,
        chakra: 100,
        stats: {
            strength: 15,
            ninjutsu: 12,
            genjutsu: 8,
            speed: 14,
            defense: 11
        },
        element: 'water',
        jutsus: ['water_clone', 'demon_shuriken', 'chain_attack'],
        rewards: { xp: 600, ryo: 1200 }
    },
    
    {
        id: 'zabuza_1',
        name: 'Zabuza Momochi',
        title: 'El Demonio Oculto en la Niebla',
        level: 10,
        hp: 500,
        chakra: 300,
        stats: {
            strength: 25,
            ninjutsu: 22,
            genjutsu: 15,
            speed: 20,
            defense: 18
        },
        element: 'water',
        jutsus: ['water_clone', 'water_prison', 'hidden_mist', 'water_shark', 'executioner_blade'],
        dialogue: 'zabuza_first_fight',
        boss: true,
        rewards: { xp: 2500, ryo: 5000, items: ['Espada de Zabuza (Rota)'] }
    },
    
    {
        id: 'haku',
        name: 'Haku',
        title: 'La Herramienta Ninja',
        level: 11,
        hp: 400,
        chakra: 350,
        stats: {
            strength: 18,
            ninjutsu: 24,
            genjutsu: 20,
            speed: 26,
            defense: 14
        },
        element: 'water',
        jutsus: ['ice_needles', 'ice_mirrors', 'water_clone', 'demonic_ice_crystals'],
        dialogue: 'haku_truth',
        boss: true,
        rewards: { xp: 3000, ryo: 6000, items: ['Máscara de Haku'] }
    },
    
    {
        id: 'zabuza_2',
        name: 'Zabuza Momochi',
        title: 'El Demonio Liberado',
        level: 12,
        hp: 600,
        chakra: 400,
        stats: {
            strength: 28,
            ninjutsu: 25,
            genjutsu: 15,
            speed: 22,
            defense: 20
        },
        element: 'water',
        jutsus: ['water_clone', 'water_prison', 'water_shark', 'water_dragon', 'executioner_blade'],
        boss: true,
        rewards: { xp: 4000, ryo: 8000 }
    },
    
    {
        id: 'gato',
        name: 'Gato',
        title: 'El Tirano',
        level: 5,
        hp: 100,
        chakra: 20,
        stats: {
            strength: 5,
            ninjutsu: 2,
            genjutsu: 3,
            speed: 6,
            defense: 8
        },
        element: 'none',
        jutsus: ['basic_attack', 'order_thugs'],
        dialogue: null,
        boss: true,
        rewards: { xp: 1000, ryo: 10000, items: ['Contrato de Gato'] }
    }
];

// Jutsus especiales de la Tierra de las Olas
const waveJutsus = {
    water_clone: {
        id: 'water_clone',
        name: 'Clon de Agua',
        rank: 'C',
        type: 'ninjutsu',
        element: 'water',
        power: 35,
        chakraCost: 25,
        accuracy: 85,
        description: 'Crea un clon hecho de agua que puede atacar físicamente.'
    },
    
    water_prison: {
        id: 'water_prison',
        name: 'Prisión de Agua',
        rank: 'C',
        type: 'ninjutsu',
        element: 'water',
        power: 20,
        chakraCost: 30,
        accuracy: 75,
        effect: 'immobilize',
        description: 'Atrapa al enemigo en una esfera de agua. Reduce velocidad.'
    },
    
    hidden_mist: {
        id: 'hidden_mist',
        name: 'Técnica de Niebla Oculta',
        rank: 'D',
        type: 'ninjutsu',
        element: 'water',
        power: 0,
        chakraCost: 40,
        accuracy: 100,
        effect: 'blind',
        description: 'Crea una niebla espesa. Reduce precisión enemiga.'
    },
    
    water_shark: {
        id: 'water_shark',
        name: 'Misil de Tiburón de Agua',
        rank: 'B',
        type: 'ninjutsu',
        element: 'water',
        power: 55,
        chakraCost: 45,
        accuracy: 80,
        description: 'Invoca un tiburón hecho de agua que ataca al enemigo.'
    },
    
    executioner_blade: {
        id: 'executioner_blade',
        name: 'Corte de la Espada Ejecutora',
        rank: 'B',
        type: 'taijutsu',
        element: 'none',
        power: 60,
        chakraCost: 35,
        accuracy: 85,
        description: 'Un devastador corte con la espada gigante de Zabuza.'
    },
    
    ice_needles: {
        id: 'ice_needles',
        name: 'Senbon de Hielo',
        rank: 'C',
        type: 'ninjutsu',
        element: 'ice',
        power: 30,
        chakraCost: 20,
        accuracy: 90,
        description: 'Dispara agujas de hielo extremadamente precisas.'
    },
    
    ice_mirrors: {
        id: 'ice_mirrors',
        name: 'Espejos de Cristal de Hielo',
        rank: 'B',
        type: 'ninjutsu',
        element: 'ice',
        power: 40,
        chakraCost: 50,
        accuracy: 95,
        effect: 'multi_hit',
        description: 'Atrapa al enemigo en una prisión de espejos y ataca desde todos los ángulos.'
    },
    
    demonic_ice_crystals: {
        id: 'demonic_ice_crystals',
        name: 'Cristales de Hielo Demoníacos',
        rank: 'A',
        type: 'ninjutsu',
        element: 'ice',
        power: 70,
        chakraCost: 60,
        accuracy: 85,
        description: 'Crea cristales de hielo afilados que emergen del suelo.'
    },
    
    chain_attack: {
        id: 'chain_attack',
        name: 'Ataque de Cadena',
        rank: 'C',
        type: 'taijutsu',
        element: 'none',
        power: 35,
        chakraCost: 15,
        accuracy: 80,
        description: 'Ataque con garras envenenadas conectadas por cadena.'
    },
    
    demon_shuriken: {
        id: 'demon_shuriken',
        name: 'Shuriken Gigante',
        rank: 'C',
        type: 'taijutsu',
        element: 'none',
        power: 40,
        chakraCost: 20,
        accuracy: 75,
        description: 'Lanza un shuriken gigante con sierras.'
    },
    
    water_dragon: {
        id: 'water_dragon',
        name: 'Dragón de Agua',
        rank: 'A',
        type: 'ninjutsu',
        element: 'water',
        power: 65,
        chakraCost: 55,
        accuracy: 80,
        description: 'Invoca un dragón masivo de agua que aplasta al enemigo.'
    },
    
    order_thugs: {
        id: 'order_thugs',
        name: 'Ordenar a Matones',
        rank: 'E',
        type: 'special',
        element: 'none',
        power: 10,
        chakraCost: 5,
        accuracy: 100,
        description: 'Gato ordena a sus matones atacar. Daño mínimo.'
    }
};

// Exportar todo para navegador
window.allies = allies;
window.academyEnemies = academyEnemies;
window.waveEnemies = waveEnemies;
window.waveJutsus = waveJutsus;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { allies, academyEnemies, waveEnemies, waveJutsus };
}
