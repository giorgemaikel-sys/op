// Sistema de Exploración Básica

class ExplorationSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        
        // Mapa de prueba (grid simple)
        this.mapWidth = 800;
        this.mapHeight = 600;
        
        // Jugador
        this.player = {
            x: 400,
            y: 300,
            width: 40,
            height: 40,
            speed: 5,
            character: createCharacterCopy('naruto')
        };
        
        // Enemigos en el mapa
        this.enemies = [
            {
                id: 'enemy1',
                x: 200,
                y: 150,
                width: 40,
                height: 40,
                data: 'enemy_ninja',
                interacted: false
            },
            {
                id: 'enemy2',
                x: 600,
                y: 450,
                width: 40,
                height: 40,
                data: 'enemy_bandit',
                interacted: false
            }
        ];
        
        // Obstáculos (árboles, rocas, etc.)
        this.obstacles = [
            { x: 100, y: 100, width: 60, height: 60, type: 'tree' },
            { x: 650, y: 100, width: 60, height: 60, type: 'tree' },
            { x: 100, y: 450, width: 60, height: 60, type: 'tree' },
            { x: 650, y: 450, width: 60, height: 60, type: 'tree' },
            { x: 370, y: 270, width: 60, height: 60, type: 'rock' }
        ];
        
        // Decoración del mapa
        this.decorations = [
            { x: 50, y: 50, type: 'grass' },
            { x: 700, y: 500, type: 'grass' },
            { x: 150, y: 500, type: 'flower' },
            { x: 650, y: 150, type: 'flower' }
        ];
        
        // Mensaje de instrucción
        this.instructionMessage = 'Usa WASD o Flechas para moverte. Acércate a un enemigo y presiona E para combatir.';
    }

    // Actualizar estado del jugador
    update(inputKeys) {
        let dx = 0;
        let dy = 0;

        if (inputKeys['ArrowUp'] || inputKeys['w'] || inputKeys['W']) dy = -this.player.speed;
        if (inputKeys['ArrowDown'] || inputKeys['s'] || inputKeys['S']) dy = this.player.speed;
        if (inputKeys['ArrowLeft'] || inputKeys['a'] || inputKeys['A']) dx = -this.player.speed;
        if (inputKeys['ArrowRight'] || inputKeys['d'] || inputKeys['D']) dx = this.player.speed;

        // Normalizar movimiento diagonal
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }

        // Calcular nueva posición
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // Verificar colisiones con bordes del mapa
        if (newX - this.player.width/2 >= 0 && newX + this.player.width/2 <= this.mapWidth) {
            this.player.x = newX;
        }
        if (newY - this.player.height/2 >= 0 && newY + this.player.height/2 <= this.mapHeight) {
            this.player.y = newY;
        }

        // Verificar colisiones con obstáculos
        this.checkObstacleCollisions();
    }

    // Verificar colisiones con obstáculos
    checkObstacleCollisions() {
        const playerRect = {
            x: this.player.x - this.player.width/2,
            y: this.player.y - this.player.height/2,
            width: this.player.width,
            height: this.player.height
        };

        for (const obstacle of this.obstacles) {
            if (this.rectIntersect(playerRect, obstacle)) {
                // Empujar al jugador fuera del obstáculo
                this.resolveCollision(obstacle);
            }
        }
    }

    // Resolver colisión empujando al jugador
    resolveCollision(obstacle) {
        // Calcular centros
        const playerCenterX = this.player.x;
        const playerCenterY = this.player.y;
        const obstacleCenterX = obstacle.x + obstacle.width/2;
        const obstacleCenterY = obstacle.y + obstacle.height/2;

        // Dirección de colisión
        const dx = playerCenterX - obstacleCenterX;
        const dy = playerCenterY - obstacleCenterY;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Colisión horizontal
            if (dx > 0) {
                this.player.x = obstacle.x + obstacle.width + this.player.width/2;
            } else {
                this.player.x = obstacle.x - this.player.width/2;
            }
        } else {
            // Colisión vertical
            if (dy > 0) {
                this.player.y = obstacle.y + obstacle.height + this.player.height/2;
            } else {
                this.player.y = obstacle.y - this.player.height/2;
            }
        }
    }

    // Verificar intersección entre dos rectángulos
    rectIntersect(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // Verificar si el jugador está cerca de un enemigo para interactuar
    checkEnemyInteraction() {
        const interactionRange = 60;

        for (const enemy of this.enemies) {
            const distance = getDistance(this.player.x, this.player.y, enemy.x, enemy.y);
            
            if (distance < interactionRange) {
                return enemy;
            }
        }

        return null;
    }

    // Iniciar combate con un enemigo
    startCombatWithEnemy(enemy) {
        const enemyData = CHARACTERS[enemy.data];
        if (!enemyData) return;

        // Crear equipo del jugador y del enemigo
        const playerTeam = ['naruto'];
        const enemyTeam = [enemy.data];

        this.game.combat.startCombat(playerTeam, enemyTeam);
        this.game.setState('combat');
    }

    // Dibujar el mapa de exploración
    render() {
        const ctx = this.ctx;

        // Fondo del mapa (pasto)
        ctx.fillStyle = '#3d6b1e';
        ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

        // Patrón de pasto (decoración)
        this.drawGrassPattern();

        // Dibujar decoraciones
        this.drawDecorations();

        // Dibujar obstáculos
        this.drawObstacles();

        // Dibujar enemigos
        this.drawEnemies();

        // Dibujar jugador
        this.drawPlayer();

        // Dibujar UI de exploración
        this.drawExplorationUI();

        // Indicador de interacción
        const nearbyEnemy = this.checkEnemyInteraction();
        if (nearbyEnemy) {
            this.drawInteractionPrompt(nearbyEnemy);
        }
    }

    // Dibujar patrón de pasto
    drawGrassPattern() {
        const ctx = this.ctx;
        ctx.fillStyle = '#4a7a2a';
        
        // Algunos parches de pasto más claro
        for (let i = 0; i < 20; i++) {
            const x = (i * 73) % this.mapWidth;
            const y = (i * 47) % this.mapHeight;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Dibujar decoraciones
    drawDecorations() {
        const ctx = this.ctx;
        
        for (const dec of this.decorations) {
            if (dec.type === 'grass') {
                ctx.font = '20px Arial';
                ctx.fillText('🌿', dec.x, dec.y);
            } else if (dec.type === 'flower') {
                ctx.font = '16px Arial';
                ctx.fillText('🌸', dec.x, dec.y);
            }
        }
    }

    // Dibujar obstáculos
    drawObstacles() {
        const ctx = this.ctx;
        
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'tree') {
                // Tronco
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(obstacle.x + 20, obstacle.y + 30, 20, 30);
                
                // Copa del árbol
                ctx.font = '50px Arial';
                ctx.fillText('🌳', obstacle.x + 30, obstacle.y + 35);
            } else if (obstacle.type === 'rock') {
                ctx.font = '50px Arial';
                ctx.fillText('🪨', obstacle.x + 30, obstacle.y + 45);
            }
        }
    }

    // Dibujar enemigos
    drawEnemies() {
        const ctx = this.ctx;
        
        for (const enemy of this.enemies) {
            const enemyData = CHARACTERS[enemy.data];
            if (!enemyData) continue;

            // Sprite del enemigo
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(enemyData.sprite, enemy.x, enemy.y);

            // Nombre del enemigo
            ctx.font = '12px Arial';
            ctx.fillStyle = '#ff6666';
            ctx.fillText(enemyData.name, enemy.x, enemy.y - 25);

            // Indicador de que se puede interactuar
            const distance = getDistance(this.player.x, this.player.y, enemy.x, enemy.y);
            if (distance < 60) {
                ctx.font = '10px Arial';
                ctx.fillStyle = '#ffff00';
                ctx.fillText('¡E!', enemy.x, enemy.y - 40);
            }
        }
    }

    // Dibujar jugador
    drawPlayer() {
        const ctx = this.ctx;
        const player = this.player;

        // Sprite del personaje (emoji como placeholder)
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.character.sprite, player.x, player.y);

        // Nombre del personaje
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(player.character.name, player.x, player.y - 25);

        // Barras de HP y Chakra pequeñas sobre el personaje
        const barWidth = 50;
        const hpY = player.y - 15;
        const chakraY = player.y - 5;

        // HP
        ctx.fillStyle = '#333333';
        ctx.fillRect(player.x - barWidth/2, hpY, barWidth, 6);
        const hpPercent = player.character.stats.hp / player.character.stats.maxHp;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(player.x - barWidth/2, hpY, barWidth * hpPercent, 6);

        // Chakra
        ctx.fillStyle = '#333333';
        ctx.fillRect(player.x - barWidth/2, chakraY, barWidth, 4);
        const chakraPercent = player.character.stats.chakra / player.character.stats.maxChakra;
        ctx.fillStyle = '#4444ff';
        ctx.fillRect(player.x - barWidth/2, chakraY, barWidth * chakraPercent, 4);
    }

    // Dibujar UI de exploración
    drawExplorationUI() {
        const ctx = this.ctx;

        // Panel superior con stats del jugador
        drawRoundedRect(ctx, 10, 10, 250, 100, 10, 'rgba(0, 0, 0, 0.7)', '#666666');

        const player = this.player.character;
        
        // Nombre y nivel
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`${player.name} - Nivel ${player.level}`, 20, 35);

        // Barra de HP
        drawBar(ctx, 20, 45, 230, 15, 
                player.stats.hp, player.stats.maxHp,
                '#ff4444', '#ff8888', 'HP');

        // Barra de Chakra
        drawBar(ctx, 20, 70, 230, 15,
                player.stats.chakra, player.stats.maxChakra,
                '#4444ff', '#8888ff', 'CHK');

        // Elemento
        if (player.element) {
            ctx.font = '20px Arial';
            ctx.fillText(ELEMENTS[player.element].icon, 240, 60);
        }

        // Instrucciones en la parte inferior
        drawRoundedRect(ctx, 10, 520, 780, 70, 10, 'rgba(0, 0, 0, 0.7)', '#666666');
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(this.instructionMessage, 400, 545);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Controles: WASD/Flechas = Mover | E = Interactuar', 400, 570);
    }

    // Dibujar prompt de interacción
    drawInteractionPrompt(enemy) {
        const ctx = this.ctx;
        const enemyData = CHARACTERS[enemy.data];

        // Círculo pulsante alrededor del enemigo
        const pulseSize = 50 + Math.sin(Date.now() / 200) * 5;
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, pulseSize, 0, Math.PI * 2);
        ctx.stroke();

        // Texto de acción
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'center';
        ctx.fillText(`¡Presiona E para combatir!`, enemy.x, enemy.y - 60);
        ctx.font = '14px Arial';
        ctx.fillText(`${enemyData.name} - Nvl ${CHARACTERS[enemy.data].level}`, enemy.x, enemy.y - 40);
    }

    // Manejar input del jugador
    handleInput(key) {
        if (key === 'e' || key === 'E') {
            const nearbyEnemy = this.checkEnemyInteraction();
            if (nearbyEnemy) {
                this.startCombatWithEnemy(nearbyEnemy);
            }
        }
    }
}
