/**
 * Sistema de Misiones - Fase 3
 * Gestiona misiones principales, secundarias y recompensas
 */

const MissionType = {
    MAIN: 'main',      // Historia principal
    SIDE: 'side',      // Misiones secundarias
    TRAINING: 'training' // Entrenamiento
};

const MissionStatus = {
    LOCKED: 'locked',
    AVAILABLE: 'available',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
};

class Mission {
    constructor(id, title, description, type, objectives, rewards, requirements = {}) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.objectives = objectives || [];
        this.rewards = rewards || {};
        this.requirements = requirements;
        this.status = MissionStatus.LOCKED;
        this.currentObjectiveIndex = 0;
        this.progress = {};
    }

    isAvailable(player) {
        if (this.status !== MissionStatus.LOCKED) return false;
        
        // Verificar requisitos de nivel
        if (this.requirements.level && player.level < this.requirements.level) {
            return false;
        }
        
        // Verificar misiones completadas requeridas
        if (this.requirements.completedMissions) {
            for (const missionId of this.requirements.completedMissions) {
                if (!player.missions.some(m => m.id === missionId && m.status === MissionStatus.COMPLETED)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    start(player) {
        if (this.isAvailable(player) || this.status === MissionStatus.AVAILABLE) {
            this.status = MissionStatus.IN_PROGRESS;
            this.currentObjectiveIndex = 0;
            this.progress = {};
            
            // Inicializar progreso de objetivos
            this.objectives.forEach(obj => {
                this.progress[obj.id] = obj.current || 0;
            });
            
            return true;
        }
        return false;
    }

    updateObjective(objectiveId, value) {
        if (this.status !== MissionStatus.IN_PROGRESS) return false;
        
        const objective = this.objectives.find(obj => obj.id === objectiveId);
        if (!objective) return false;
        
        if (objective.type === 'kill' || objective.type === 'collect') {
            this.progress[objectiveId] = (this.progress[objectiveId] || 0) + value;
            
            // Verificar si el objetivo está completo
            if (this.progress[objectiveId] >= objective.target) {
                this.currentObjectiveIndex++;
                
                // Verificar si todos los objetivos están completos
                if (this.currentObjectiveIndex >= this.objectives.length) {
                    this.status = MissionStatus.COMPLETED;
                    return 'completed';
                }
                return 'objective_complete';
            }
            return 'progress';
        }
        
        return false;
    }

    complete(player) {
        if (this.status !== MissionStatus.COMPLETED) return false;
        
        // Aplicar recompensas
        if (this.rewards.xp) {
            player.gainXp(this.rewards.xp);
        }
        if (this.rewards.ryo) {
            player.ryo = (player.ryo || 0) + this.rewards.ryo;
        }
        if (this.rewards.items) {
            player.inventory = player.inventory || [];
            player.inventory.push(...this.rewards.items);
        }
        if (this.rewards.jutsu) {
            player.learnJutsu(this.rewards.jutsu);
        }
        
        this.status = MissionStatus.COMPLETED;
        return true;
    }

    getCurrentObjective() {
        if (this.currentObjectiveIndex >= this.objectives.length) return null;
        return this.objectives[this.currentObjectiveIndex];
    }

    getProgressText() {
        const current = this.getCurrentObjective();
        if (!current) return '¡Misión completada!';
        
        const progress = this.progress[current.id] || 0;
        return `${current.description} (${progress}/${current.target})`;
    }
}

// Definición de misiones de la Saga de la Academia
const academyMissions = [
    new Mission(
        'academy_1',
        '¡El Examen de Graduación!',
        'Demuestra tus habilidades en el examen final de la Academia para convertirte en Genin.',
        MissionType.MAIN,
        [
            {
                id: 'defeat_mizuki',
                type: 'kill',
                description: 'Derrota a Mizuki',
                target: 1,
                current: 0
            }
        ],
        {
            xp: 500,
            ryo: 1000,
            items: [{ name: 'Protector de Konoha', type: 'key' }],
            jutsu: 'clone_jutsu'
        },
        { level: 1 }
    ),
    
    new Mission(
        'academy_2',
        'El Robo del Pergamino',
        'Mizuki ha robado el pergamino prohibido. ¡Recupéralo antes de que escape!',
        MissionType.MAIN,
        [
            {
                id: 'chase_mizuki',
                type: 'kill',
                description: 'Persigue a Mizuki',
                target: 3,
                current: 0
            },
            {
                id: 'recover_scroll',
                type: 'collect',
                description: 'Recupera el pergamino',
                target: 1,
                current: 0
            }
        ],
        {
            xp: 750,
            ryo: 1500,
            jutsu: 'shadow_clone'
        },
        { completedMissions: ['academy_1'] }
    )
];

// Misiones de la Tierra de las Olas
const waveCountryMissions = [
    new Mission(
        'wave_1',
        'Proteger al Constructor de Puentes',
        'Tazuna necesita protección mientras construye el puente. Derrota a los bandidos.',
        MissionType.MAIN,
        [
            {
                id: 'defeat_bandits',
                type: 'kill',
                description: 'Derrota bandidos',
                target: 5,
                current: 0
            }
        ],
        {
            xp: 1000,
            ryo: 3000
        },
        { completedMissions: ['academy_2'], level: 5 }
    ),
    
    new Mission(
        'wave_2',
        'El Demonio Oculto en la Niebla',
        'Zabuza Momochi amenaza la misión. Prepárate para una batalla difícil.',
        MissionType.MAIN,
        [
            {
                id: 'defeat_zabuza',
                type: 'kill',
                description: 'Derrota a Zabuza',
                target: 1,
                current: 0
            }
        ],
        {
            xp: 2500,
            ryo: 5000,
            jutsu: 'water_clone'
        },
        { completedMissions: ['wave_1'] }
    ),
    
    new Mission(
        'wave_3',
        'La Verdad de Haku',
        'Descubre la verdad sobre Haku y su relación con Zabuza.',
        MissionType.MAIN,
        [
            {
                id: 'defeat_haku',
                type: 'kill',
                description: 'Enfrenta a Haku',
                target: 1,
                current: 0
            }
        ],
        {
            xp: 3000,
            ryo: 6000,
            jutsu: 'rasengan'
        },
        { completedMissions: ['wave_2'] }
    ),
    
    new Mission(
        'wave_4',
        'El Puente de la Libertad',
        'Gato ha traicionado a todos. ¡Detén sus planes y completa el puente!',
        MissionType.MAIN,
        [
            {
                id: 'defeat_gato',
                type: 'kill',
                description: 'Derrota a Gato',
                target: 1,
                current: 0
            },
            {
                id: 'complete_bridge',
                type: 'collect',
                description: 'Completa el puente',
                target: 1,
                current: 0
            }
        ],
        {
            xp: 5000,
            ryo: 10000,
            items: [{ name: 'Rollo de Héroe', type: 'key' }]
        },
        { completedMissions: ['wave_3'] }
    )
];

// Misiones secundarias
const sideMissions = [
    new Mission(
        'side_1',
        'Entrenamiento de Resistencia',
        'Ayuda a los civiles a llevar suministros por la aldea.',
        MissionType.SIDE,
        [
            {
                id: 'deliver_supplies',
                type: 'collect',
                description: 'Entrega suministros',
                target: 10,
                current: 0
            }
        ],
        {
            xp: 200,
            ryo: 500
        },
        { level: 2 }
    ),
    
    new Mission(
        'side_2',
        'Caza de Ladrones',
        'Unos ladrones han estado robando en el mercado. Captúralos.',
        MissionType.SIDE,
        [
            {
                id: 'catch_thieves',
                type: 'kill',
                description: 'Captura ladrones',
                target: 3,
                current: 0
            }
        ],
        {
            xp: 400,
            ryo: 800
        },
        { level: 3 }
    )
];

class MissionSystem {
    constructor() {
        this.allMissions = [...academyMissions, ...waveCountryMissions, ...sideMissions];
        this.activeMissions = [];
        this.completedMissions = [];
    }

    getAvailableMissions(player) {
        return this.allMissions.filter(mission => 
            mission.isAvailable(player) && 
            !this.activeMissions.includes(mission) &&
            !this.completedMissions.includes(mission)
        );
    }

    getActiveMissions() {
        return this.activeMissions.filter(m => m.status === MissionStatus.IN_PROGRESS);
    }

    acceptMission(missionId, player) {
        const mission = this.allMissions.find(m => m.id === missionId);
        if (mission && mission.start(player)) {
            this.activeMissions.push(mission);
            return true;
        }
        return false;
    }

    updateMissionProgress(missionId, objectiveId, value) {
        const mission = this.activeMissions.find(m => m.id === missionId);
        if (!mission) return false;
        
        const result = mission.updateObjective(objectiveId, value);
        
        if (result === 'completed') {
            this.completeMission(missionId, mission.getPlayer());
        }
        
        return result;
    }

    completeMission(missionId, player) {
        const mission = this.activeMissions.find(m => m.id === missionId);
        if (mission && mission.complete(player)) {
            this.completedMissions.push(mission);
            this.activeMissions = this.activeMissions.filter(m => m.id !== missionId);
            return true;
        }
        return false;
    }

    getMissionById(missionId) {
        return this.allMissions.find(m => m.id === missionId);
    }

    getCurrentStoryArc() {
        const lastCompleted = this.completedMissions[this.completedMissions.length - 1];
        if (!lastCompleted) return 'Academia Ninja';
        
        if (lastCompleted.id.startsWith('academy')) return 'Academia Ninja';
        if (lastCompleted.id.startsWith('wave')) return 'Tierra de las Olas';
        
        return 'Próxima Aventura';
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Mission, MissionSystem, MissionType, MissionStatus };
}
