// Juego Principal - Game Loop y Gestión de Estados

class Game {
    constructor() {
        // Configurar canvas
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Estado del juego
        this.currentState = 'exploration'; // exploration, combat
        this.isRunning = false;
        
        // Sistema de progresión
        this.progression = new ProgressionSystem();
        
        // Sistemas
        this.exploration = new ExplorationSystem(this);
        this.combat = new CombatSystem(this);
        
        // Input
        this.inputKeys = {};
        this.setupInputHandlers();
        
        // Iniciar el juego
        this.start();
    }

    // Configurar manejadores de input
    setupInputHandlers() {
        // Tecla presionada
        window.addEventListener('keydown', (e) => {
            this.inputKeys[e.key] = true;
            
            // Manejar inputs específicos por estado
            if (this.currentState === 'exploration') {
                this.exploration.handleInput(e.key);
            } else if (this.currentState === 'combat') {
                this.combat.handleInput(e.key);
            }
            
            // Prevenir comportamiento default para teclas de juego
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        // Tecla liberada
        window.addEventListener('keyup', (e) => {
            this.inputKeys[e.key] = false;
        });
    }

    // Iniciar el juego
    start() {
        this.isRunning = true;
        this.gameLoop();
        console.log('¡Shinobi Chronicles ha iniciado!');
        console.log('Fase 2: Sistema de Progresión - Niveles, Jutsus y Estadísticas');
        console.log('Usa P para abrir menú de progreso (fuera de combate)');
    }

    // Game Loop principal
    gameLoop() {
        if (!this.isRunning) return;

        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Actualizar y renderizar según el estado actual
        if (this.currentState === 'exploration') {
            this.exploration.update(this.inputKeys);
            this.exploration.render();
        } else if (this.currentState === 'combat') {
            this.combat.render();
        }

        // Solicitar siguiente frame
        requestAnimationFrame(() => this.gameLoop());
    }

    // Cambiar estado del juego
    setState(newState) {
        this.currentState = newState;
        
        // Resetear input al cambiar de estado
        this.inputKeys = {};
        
        console.log(`Cambiando a estado: ${newState}`);
    }

    // Iniciar combate de prueba (para debugging)
    startTestCombat() {
        const playerTeam = ['naruto'];
        const enemyTeam = ['enemy_ninja'];
        
        this.combat.startCombat(playerTeam, enemyTeam);
        this.setState('combat');
    }

    // Obtener estado actual
    getState() {
        return this.currentState;
    }

    // Pausar juego
    pause() {
        this.isRunning = false;
    }

    // Reanudar juego
    resume() {
        this.isRunning = true;
        this.gameLoop();
    }

    // Recuperar personaje después del combate
    recoverPlayer() {
        const player = this.exploration.player;
        if (player) {
            const healedHP = this.progression.regenerateHealth(player, player.stats.maxHp);
            const recoveredChakra = this.progression.regenerateChakra(player, player.stats.maxChakra);
            console.log(`Personaje recuperado: +${healedHP} HP, +${recoveredChakra} CHK`);
        }
    }
}

// Iniciar el juego cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
