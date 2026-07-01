// Sistema de Combate por Turnos

class CombatSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.playerTeam = [];
        this.enemyTeam = [];
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.combatLog = [];
        this.menuState = 'main'; // main, jutsus, items
        this.selectedJutsuIndex = 0;
        this.isAnimating = false;
        this.combatResult = null; // 'victory', 'defeat', null
    }

    // Iniciar combate con equipos
    startCombat(playerTeam, enemyTeam) {
        this.playerTeam = playerTeam.map(p => createCharacterCopy(p));
        this.enemyTeam = enemyTeam.map(e => createCharacterCopy(e));
        
        // Calcular orden de turnos basado en velocidad
        this.calculateTurnOrder();
        
        this.currentTurnIndex = 0;
        this.combatLog = ['¡Combate iniciado!'];
        this.menuState = 'main';
        this.selectedJutsuIndex = 0;
        this.combatResult = null;
        
        this.log(`¡${this.playerTeam[0].name} vs ${this.enemyTeam[0].name}!`);
    }

    // Calcular orden de turnos
    calculateTurnOrder() {
        const allCharacters = [...this.playerTeam, ...this.enemyTeam];
        allCharacters.sort((a, b) => b.stats.speed - a.stats.speed);
        this.turnOrder = allCharacters;
    }

    // Obtener personaje actual
    getCurrentCharacter() {
        return this.turnOrder[this.currentTurnIndex];
    }

    // Verificar si es turno del jugador
    isPlayerTurn() {
        const current = this.getCurrentCharacter();
        return current && current.isPlayer;
    }

    // Ejecutar acción de ataque básico (Taijutsu)
    async performBasicAttack(attacker, target) {
        this.isAnimating = true;
        
        // Calcular daño
        let damage = attacker.stats.strength;
        damage += Math.random() * 5; // Variación aleatoria
        damage -= target.stats.defense * 0.3;
        damage = Math.max(1, Math.floor(damage));
        
        // Aplicar daño
        target.stats.hp = Math.max(0, target.stats.hp - damage);
        
        this.log(`${attacker.name} ataca con Taijutsu y causa ${damage} de daño!`);
        
        // Animación simple
        await this.animateAttack(attacker, target);
        
        this.isAnimating = false;
        this.checkCombatEnd();
        this.nextTurn();
    }

    // Ejecutar jutsu
    async performJutsu(attacker, target, jutsuId) {
        const jutsu = getJutsu(jutsuId);
        if (!jutsu) return;

        // Verificar chakra suficiente
        if (attacker.stats.chakra < jutsu.chakraCost) {
            this.log('¡Chakra insuficiente!');
            return;
        }

        this.isAnimating = true;

        // Consumir chakra
        attacker.stats.chakra -= jutsu.chakraCost;

        // Jutsu de curación
        if (jutsu.effects.includes('heal')) {
            const healAmount = jutsu.healAmount || 20;
            attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + healAmount);
            this.log(`${attacker.name} usa ${jutsu.name} y recupera ${healAmount} HP!`);
        } 
        // Jutsu de daño
        else {
            let damage = calculateJutsuDamage(jutsu, attacker, target);
            
            // Variación aleatoria
            damage = Math.floor(damage * (0.9 + Math.random() * 0.2));
            
            target.stats.hp = Math.max(0, target.stats.hp - damage);
            
            let elementInfo = jutsu.element ? ` (${ELEMENTS[jutsu.element].name})` : '';
            this.log(`${attacker.name} usa ${jutsu.name}${elementInfo} y causa ${damage} de daño!`);
            
            // Verificar efectividad elemental
            if (jutsu.element && target.element) {
                const elemData = ELEMENTS[jutsu.element];
                if (elemData && elemData.strongAgainst === target.element) {
                    this.log('¡Es súper efectivo!');
                } else if (elemData && elemData.weakAgainst === target.element) {
                    this.log('No es muy efectivo...');
                }
            }
        }

        await this.animateJutsu(attacker, target, jutsu);
        
        this.isAnimating = false;
        this.checkCombatEnd();
        this.nextTurn();
    }

    // Acción de defender
    async defend(character) {
        this.isAnimating = true;
        
        // Recuperar un poco de chakra al defender
        const chakraRecovery = Math.floor(character.stats.maxChakra * 0.1);
        character.stats.chakra = Math.min(character.stats.maxChakra, character.stats.chakra + chakraRecovery);
        
        this.log(`${character.name} se defiende y recupera ${chakraRecovery} de chakra.`);
        
        await wait(500);
        
        this.isAnimating = false;
        this.nextTurn();
    }

    // Intentar huir
    async tryToFlee() {
        // Solo funciona contra enemigos normales, no jefes
        const escapeChance = 0.7; // 70% de probabilidad
        
        if (Math.random() < escapeChance) {
            this.log('¡Escapaste exitosamente!');
            this.combatResult = 'escaped';
            await wait(1000);
            this.game.setState('exploration');
        } else {
            this.log('¡No pudiste escapar!');
            await wait(500);
            this.nextTurn();
        }
    }

    // Pasar al siguiente turno
    nextTurn() {
        if (this.combatResult) return;

        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
        
        // Si es turno del enemigo, ejecutar IA automáticamente
        if (!this.isPlayerTurn() && !this.combatResult) {
            setTimeout(() => this.executeEnemyAI(), 800);
        }
    }

    // IA básica para enemigos
    async executeEnemyAI() {
        if (this.combatResult) return;

        const enemy = this.getCurrentCharacter();
        if (!enemy || enemy.isPlayer) return;

        // Encontrar objetivo (primer personaje del equipo jugador vivo)
        const target = this.playerTeam.find(p => p.stats.hp > 0);
        if (!target) return;

        // Decidir acción: 70% ataque básico, 30% jutsu si tiene chakra
        const actionRoll = Math.random();
        
        if (actionRoll < 0.7 || enemy.stats.chakra < 10) {
            await this.performBasicAttack(enemy, target);
        } else {
            // Usar un jutsu aleatorio disponible
            const availableJutsus = Object.values(JUTSUS).filter(
                j => j.chakraCost <= enemy.stats.chakra && j.type === 'ninjutsu'
            );
            
            if (availableJutsus.length > 0) {
                const randomJutsu = availableJutsus[Math.floor(Math.random() * availableJutsus.length)];
                await this.performJutsu(enemy, target, randomJutsu.id);
            } else {
                await this.performBasicAttack(enemy, target);
            }
        }
    }

    // Verificar si el combate terminó
    checkCombatEnd() {
        // Verificar si todos los enemigos están derrotados
        const allEnemiesDefeated = this.enemyTeam.every(e => e.stats.hp <= 0);
        const allPlayersDefeated = this.playerTeam.every(p => p.stats.hp <= 0);

        if (allEnemiesDefeated) {
            this.combatResult = 'victory';
            this.log('¡Victoria! Has derrotado a tus enemigos.');
            
            // Repartir experiencia y registrar progresión
            this.playerTeam.forEach(player => {
                this.enemyTeam.forEach(enemy => {
                    // Agregar experiencia usando ProgressionSystem
                    if (this.game.progression) {
                        const leveledUp = this.game.progression.addExperience(player, enemy.exp);
                        if (leveledUp) {
                            this.log(`¡${player.name} subió al nivel ${player.level}!`);
                        }
                    } else {
                        // Fallback si no existe progression
                        player.exp += enemy.exp;
                    }
                    
                    // Registrar en estadísticas de progreso
                    if (this.game.progression) {
                        this.game.progression.playerProgress.totalEnemiesDefeated++;
                    }
                });
            });
            
            if (this.game.progression) {
                this.game.progression.playerProgress.totalBattlesWon++;
            }
        } else if (allPlayersDefeated) {
            this.combatResult = 'defeat';
            this.log('Derrota... Has sido vencido.');
        }
    }

    // Registrar mensaje en el log de combate
    log(message) {
        this.combatLog.push(message);
        // Mantener solo los últimos 5 mensajes
        if (this.combatLog.length > 5) {
            this.combatLog.shift();
        }
    }

    // Animaciones simples (placeholders)
    async animateAttack(attacker, target) {
        await wait(300);
    }

    async animateJutsu(attacker, target, jutsu) {
        await wait(500);
    }

    // Dibujar pantalla de combate
    render() {
        const ctx = this.ctx;
        
        // Fondo de combate
        ctx.fillStyle = '#2d4a2d';
        ctx.fillRect(0, 0, 800, 600);
        
        // Dibujar área de enemigos (parte superior)
        this.drawCharacter(this.enemyTeam[0], 400, 150, true);
        
        // Dibujar área del jugador (parte inferior)
        this.drawCharacter(this.playerTeam[0], 400, 450, false);
        
        // Dibujar UI de combate
        this.drawCombatUI();
        
        // Dibujar menú de acciones
        if (this.isPlayerTurn() && !this.isAnimating && !this.combatResult) {
            this.drawActionMenu();
        }
        
        // Dibujar resultado si el combate terminó
        if (this.combatResult) {
            this.drawCombatResult();
        }
    }

    // Dibujar un personaje en combate
    drawCharacter(character, x, y, isEnemy) {
        const ctx = this.ctx;
        
        // Sprite del personaje (emoji como placeholder)
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(character.sprite, x, y);
        
        // Nombre y nivel
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${character.name} (Lv.${character.level})`, x, y - 60);
        
        // Barras de HP y Chakra
        const barWidth = 200;
        const hpY = y - 40;
        const chakraY = y - 20;
        
        drawBar(ctx, x - barWidth/2, hpY, barWidth, 15, 
                character.stats.hp, character.stats.maxHp, 
                '#ff4444', '#ff8888', 'HP');
        
        drawBar(ctx, x - barWidth/2, chakraY, barWidth, 10,
                character.stats.chakra, character.stats.maxChakra,
                '#4444ff', '#8888ff', 'CHK');
        
        // Elemento (si tiene)
        if (character.element) {
            ctx.font = '20px Arial';
            ctx.fillText(ELEMENTS[character.element].icon, x + 110, y - 30);
        }
        
        // Mostrar buffs activos (si existen)
        if (character.buffs && character.buffs.length > 0) {
            ctx.font = '14px Arial';
            ctx.fillText(`🔥 Buffs: ${character.buffs.length}`, x, y + 30);
        }
    }

    // Dibujar UI de combate
    drawCombatUI() {
        const ctx = this.ctx;
        
        // Panel de log de combate
        drawRoundedRect(ctx, 10, 10, 380, 120, 10, 'rgba(0, 0, 0, 0.7)', '#666666');
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        
        this.combatLog.forEach((log, index) => {
            const y = 30 + index * 20;
            ctx.fillText(log, 20, y);
        });
        
        // Instrucciones
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.textAlign = 'right';
        ctx.fillText('WASD/Flechas: Mover | E: Interactuar', 790, 590);
    }

    // Dibujar menú de acciones
    drawActionMenu() {
        const ctx = this.ctx;
        const menuX = 420;
        const menuY = 350;
        
        // Fondo del menú
        drawRoundedRect(ctx, menuX, menuY, 370, 240, 10, 'rgba(0, 0, 0, 0.85)', '#ffffff');
        
        ctx.textAlign = 'left';
        
        // Título
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('Acciones', menuX + 20, menuY + 30);
        
        // Opciones del menú principal
        if (this.menuState === 'main') {
            const player = this.playerTeam.find(p => p.stats.hp > 0);
            
            // Mostrar nivel y puntos de habilidad disponibles
            if (player && player.skillPoints > 0) {
                ctx.font = '14px Arial';
                ctx.fillStyle = '#44ff44';
                ctx.fillText(`⭐ Puntos disponibles: ${player.skillPoints}`, menuX + 20, menuY + 30);
            }
            
            const options = [
                { key: '1', text: 'Atacar (Taijutsu)' },
                { key: '2', text: 'Jutsu' },
                { key: '3', text: 'Defender' },
                { key: '4', text: 'Huir' }
            ];
            
            ctx.font = '16px Arial';
            options.forEach((opt, index) => {
                const isSelected = index === this.selectedJutsuIndex;
                ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
                ctx.fillText(`[${opt.key}] ${opt.text}`, menuX + 20, menuY + 70 + index * 40);
            });
        }
        // Menú de selección de jutsus
        else if (this.menuState === 'jutsus') {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Selecciona un Jutsu:', menuX + 20, menuY + 50);
            
            const player = this.playerTeam.find(p => p.stats.hp > 0);
            
            // Filtrar jutsus conocidos por el jugador
            const knownJutsus = Object.values(JUTSUS).filter(
                j => player.knownJutsus.includes(j.id) && j.chakraCost <= player.stats.chakra
            );
            
            if (knownJutsus.length === 0) {
                ctx.fillStyle = '#ff8888';
                ctx.fillText('No tienes jutsus disponibles', menuX + 20, menuY + 90);
            } else {
                knownJutsus.forEach((jutsu, index) => {
                    const isSelected = index === this.selectedJutsuIndex;
                    const canUse = player.stats.chakra >= jutsu.chakraCost;
                    
                    ctx.fillStyle = isSelected ? '#ffff00' : (canUse ? '#ffffff' : '#888888');
                    const costText = jutsu.chakraCost > 0 ? `(${jutsu.chakraCost} CHK)` : '';
                    const typeIcon = jutsu.type === 'taijutsu' ? '👊' : (jutsu.type === 'genjutsu' ? '👁️' : '🌀');
                    ctx.fillText(`[${index + 1}] ${typeIcon} ${jutsu.name} ${costText}`, menuX + 20, menuY + 80 + index * 35);
                });
            }
            
            // Opción para volver
            ctx.fillStyle = '#ff8888';
            ctx.fillText('[ESC] Volver', menuX + 20, menuY + 200);
        }
    }

    // Dibujar resultado del combate
    drawCombatResult() {
        const ctx = this.ctx;
        
        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 800, 600);
        
        // Mensaje de resultado
        const resultText = this.combatResult === 'victory' ? '¡VICTORIA!' : 
                          (this.combatResult === 'escaped' ? '¡ESCAPASTE!' : 'DERROTA');
        const resultColor = this.combatResult === 'victory' ? '#44ff44' : 
                           (this.combatResult === 'escaped' ? '#44ffff' : '#ff4444');
        
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = resultColor;
        ctx.textAlign = 'center';
        ctx.fillText(resultText, 400, 250);
        
        // Instrucción para continuar
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Presiona ESPACIO para continuar', 400, 320);
    }

    // Manejar input del jugador
    handleInput(key) {
        if (this.combatResult) {
            if (key === ' ') {
                // Reiniciar o volver a exploración
                if (this.combatResult === 'victory' || this.combatResult === 'escaped') {
                    this.game.setState('exploration');
                } else {
                    // En caso de derrota, reiniciar combate
                    this.game.startTestCombat();
                }
            }
            return;
        }

        if (!this.isPlayerTurn() || this.isAnimating) return;

        // Navegación en menú de jutsus
        if (this.menuState === 'jutsus') {
            if (key === 'Escape') {
                this.menuState = 'main';
                this.selectedJutsuIndex = 0;
                return;
            }
            
            const player = this.playerTeam.find(p => p.stats.hp > 0);
            const availableJutsus = Object.values(JUTSUS).filter(
                j => j.chakraCost <= player.stats.chakra
            );
            
            if (key === 'ArrowUp' || key === 'w') {
                this.selectedJutsuIndex = Math.max(0, this.selectedJutsuIndex - 1);
            } else if (key === 'ArrowDown' || key === 's') {
                this.selectedJutsuIndex = Math.min(availableJutsus.length - 1, this.selectedJutsuIndex + 1);
            } else if (key === 'Enter' || key === ' ') {
                // Ejecutar jutsu seleccionado
                const target = this.enemyTeam.find(e => e.stats.hp > 0);
                if (target && availableJutsus[this.selectedJutsuIndex]) {
                    this.performJutsu(player, target, availableJutsus[this.selectedJutsuIndex].id);
                }
            }
            return;
        }

        // Menú principal de combate
        if (this.menuState === 'main') {
            const player = this.playerTeam.find(p => p.stats.hp > 0);
            const target = this.enemyTeam.find(e => e.stats.hp > 0);
            
            if (!player || !target) return;

            if (key === '1') {
                // Ataque básico
                this.performBasicAttack(player, target);
            } else if (key === '2') {
                // Abrir menú de jutsus
                this.menuState = 'jutsus';
                this.selectedJutsuIndex = 0;
            } else if (key === '3') {
                // Defender
                this.defend(player);
            } else if (key === '4') {
                // Huir
                this.tryToFlee();
            }
        }
    }
}
