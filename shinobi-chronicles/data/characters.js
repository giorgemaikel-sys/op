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
        expToNextLevel: 100,
        isPlayer: true,
        knownJutsus: ['basic_punch'], // Jutsus conocidos inicialmente
        jutsuSlots: 4, // Cantidad máxima de jutsus equipados
        skillPoints: 0 // Puntos para mejorar estadísticas
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
        isPlayer: false,
        knownJutsus: ['basic_punch', 'fireball']
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
        isPlayer: false,
        knownJutsus: ['basic_punch']
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

// Árbol de habilidades por nivel
const LEVEL_PROGRESSION = {
    1: { expRequired: 0, statIncrease: { hp: 10, chakra: 5, strength: 2, ninjutsu: 2, speed: 1 } },
    2: { expRequired: 100, statIncrease: { hp: 12, chakra: 6, strength: 2, ninjutsu: 3, speed: 2 } },
    3: { expRequired: 250, statIncrease: { hp: 14, chakra: 7, strength: 3, ninjutsu: 3, speed: 2 } },
    4: { expRequired: 450, statIncrease: { hp: 16, chakra: 8, strength: 3, ninjutsu: 4, speed: 3 } },
    5: { expRequired: 700, statIncrease: { hp: 18, chakra: 10, strength: 4, ninjutsu: 5, speed: 3 } },
    6: { expRequired: 1000, statIncrease: { hp: 20, chakra: 12, strength: 4, ninjutsu: 5, speed: 4 } },
    7: { expRequired: 1400, statIncrease: { hp: 22, chakra: 14, strength: 5, ninjutsu: 6, speed: 4 } },
    8: { expRequired: 1900, statIncrease: { hp: 25, chakra: 16, strength: 5, ninjutsu: 7, speed: 5 } },
    9: { expRequired: 2500, statIncrease: { hp: 28, chakra: 18, strength: 6, ninjutsu: 8, speed: 5 } },
    10: { expRequired: 3200, statIncrease: { hp: 30, chakra: 20, strength: 7, ninjutsu: 9, speed: 6 } }
};

// Jutsus desbloqueables por nivel
const JUTSU_UNLOCK_LEVELS = {
    2: ['wind_blade'],
    3: ['healing_jutsu'],
    4: ['shadow_clone'],
    5: ['rasengan'],
    6: ['chidori'],
    7: ['sage_mode'],
    8: ['nine_tails_chakra'],
    9: ['six_paths_sage'],
    10: ['bijuu_bomb']
};

// Función para crear una copia profunda de un personaje
function createCharacterCopy(characterId) {
    const original = CHARACTERS[characterId];
    if (!original) return null;
    
    return JSON.parse(JSON.stringify(original));
}

// Sistema de progresión de personajes
class ProgressionSystem {
    constructor() {
        this.playerProgress = {
            totalBattlesWon: 0,
            totalEnemiesDefeated: 0,
            jutsusLearned: 0,
            missionsCompleted: 0
        };
    }

    // Calcular experiencia necesaria para el siguiente nivel
    calculateExpForLevel(level) {
        if (LEVEL_PROGRESSION[level]) {
            return LEVEL_PROGRESSION[level].expRequired;
        }
        // Fórmula exponencial para niveles superiores
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    // Agregar experiencia al personaje
    addExperience(character, expAmount) {
        if (!character.isPlayer) return false;

        character.exp += expAmount;
        let leveledUp = false;

        // Verificar si puede subir de nivel
        while (character.exp >= character.expToNextLevel) {
            character.exp -= character.expToNextLevel;
            this.levelUp(character);
            leveledUp = true;
        }

        return leveledUp;
    }

    // Subir de nivel
    levelUp(character) {
        character.level++;
        
        // Obtener aumentos de estadísticas
        const progression = LEVEL_PROGRESSION[character.level] || {
            statIncrease: {
                hp: 10 + character.level * 2,
                chakra: 5 + character.level,
                strength: 2 + Math.floor(character.level / 2),
                ninjutsu: 2 + Math.floor(character.level / 2),
                speed: 1 + Math.floor(character.level / 3)
            }
        };

        // Aplicar aumentos
        const increases = progression.statIncrease;
        character.stats.maxHp += increases.hp || 10;
        character.stats.maxChakra += increases.chakra || 5;
        character.stats.strength += increases.strength || 2;
        character.stats.ninjutsu += increases.ninjutsu || 2;
        character.stats.speed += increases.speed || 1;
        
        // Restaurar HP y Chakra al subir de nivel
        character.stats.hp = character.stats.maxHp;
        character.stats.chakra = character.stats.maxChakra;

        // Calcular experiencia para el siguiente nivel
        character.expToNextLevel = this.calculateExpForLevel(character.level + 1);

        // Otorgar punto de habilidad
        character.skillPoints += 1;

        // Desbloquear jutsus si corresponde
        const newJutsus = JUTSU_UNLOCK_LEVELS[character.level] || [];
        newJutsus.forEach(jutsuId => {
            if (!character.knownJutsus.includes(jutsuId)) {
                character.knownJutsus.push(jutsuId);
            }
        });

        return {
            level: character.level,
            newJutsus: newJutsus,
            statIncreases: increases
        };
    }

    // Mejorar estadística con puntos de habilidad
    upgradeStat(character, statName) {
        if (character.skillPoints <= 0) return false;

        const validStats = ['strength', 'ninjutsu', 'genjutsu', 'speed', 'defense'];
        if (!validStats.includes(statName)) return false;

        // Costo de mejora aumenta con cada upgrade
        const currentUpgrades = character[`${statName}Upgrades`] || 0;
        const cost = Math.floor(1 + currentUpgrades * 0.5);

        if (character.skillPoints >= cost) {
            character.skillPoints -= cost;
            character.stats[statName] += 2; // Cada upgrade da +2
            character[`${statName}Upgrades`] = currentUpgrades + 1;
            return true;
        }

        return false;
    }

    // Aprender un nuevo jutsu
    learnJutsu(character, jutsuId) {
        const jutsu = getJutsu(jutsuId);
        if (!jutsu) return { success: false, reason: 'Jutsu no existe' };

        if (character.knownJutsus.includes(jutsuId)) {
            return { success: false, reason: 'Ya conoces este jutsu' };
        }

        // Verificar requisitos de nivel
        const requiredLevel = this.getJutsuRequiredLevel(jutsuId);
        if (requiredLevel && character.level < requiredLevel) {
            return { 
                success: false, 
                reason: `Necesitas nivel ${requiredLevel} para aprender este jutsu` 
            };
        }

        // Verificar afinidad elemental si aplica
        if (jutsu.element && character.element !== jutsu.element) {
            // Algunos jutsus pueden ser aprendidos sin la afinidad correcta (con penalización)
            if (jutsu.rank === 'A' || jutsu.rank === 'S') {
                return { 
                    success: false, 
                    reason: 'Necesitas la afinidad elemental correcta para este jutsu' 
                };
            }
        }

        character.knownJutsus.push(jutsuId);
        return { success: true, jutsu: jutsu };
    }

    // Obtener nivel requerido para un jutsu
    getJutsuRequiredLevel(jutsuId) {
        for (const [level, jutsus] of Object.entries(JUTSU_UNLOCK_LEVELS)) {
            if (jutsus.includes(jutsuId)) {
                return parseInt(level);
            }
        }
        return 1; // Jutsus básicos sin requisito
    }

    // Equipar jutsu en slot activo
    equipJutsu(character, jutsuId, slotIndex) {
        if (!character.knownJutsus.includes(jutsuId)) {
            return { success: false, reason: 'No conoces este jutsu' };
        }

        if (slotIndex < 0 || slotIndex >= character.jutsuSlots) {
            return { success: false, reason: 'Slot inválido' };
        }

        if (!character.equippedJutsus) {
            character.equippedJutsus = Array(character.jutsuSlots).fill(null);
        }

        character.equippedJutsus[slotIndex] = jutsuId;
        return { success: true };
    }

    // Recuperación pasiva de chakra fuera de combate
    regenerateChakra(character, amount = null) {
        const regenAmount = amount || Math.floor(character.stats.maxChakra * 0.1);
        character.stats.chakra = Math.min(character.stats.maxChakra, character.stats.chakra + regenAmount);
        return regenAmount;
    }

    // Recuperación pasiva de HP fuera de combate
    regenerateHealth(character, amount = null) {
        const regenAmount = amount || Math.floor(character.stats.maxHp * 0.05);
        character.stats.hp = Math.min(character.stats.maxHp, character.stats.hp + regenAmount);
        return regenAmount;
    }
}
