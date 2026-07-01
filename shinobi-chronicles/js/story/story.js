/**
 * Sistema de Story Mode - Fase 3
 * Controla el flujo de la historia, escenas y progresión narrativa
 */

class StoryMode {
    constructor() {
        this.currentArc = 'academy';
        this.currentChapter = 0;
        this.completedChapters = [];
        this.storyFlags = {};
        this.activeScene = null;
        
        // Definición de arcos y capítulos
        this.arcs = {
            academy: {
                title: 'Saga de la Academia',
                chapters: [
                    {
                        id: 'academy_1',
                        title: 'El Examen Final',
                        description: 'Demuestra tus habilidades para convertirte en Genin',
                        objectives: ['Derrota a Mizuki'],
                        enemies: ['mizuki_1'],
                        dialogues: ['iruka_intro', 'mizuki_betrayal', 'hokage_graduation'],
                        rewards: { xp: 500, ryo: 1000, items: ['Protector de Konoha'] }
                    },
                    {
                        id: 'academy_2',
                        title: 'El Pergamino Prohibido',
                        description: 'Recupera el pergamino robado por Mizuki',
                        objectives: ['Persigue a Mizuki (3)', 'Recupera el pergamino'],
                        enemies: ['mizuki_clone', 'mizuki_clone', 'mizuki_1'],
                        dialogues: ['mizuki_betrayal'],
                        rewards: { xp: 750, ryo: 1500, jutsu: 'shadow_clone' }
                    }
                ]
            },
            wave: {
                title: 'Tierra de las Olas',
                chapters: [
                    {
                        id: 'wave_1',
                        title: 'Protección del Constructor',
                        description: 'Escolta a Tazuna mientras construye el puente',
                        objectives: ['Derrota bandidos (5)'],
                        enemies: ['bandit', 'bandit', 'bandit', 'bandit', 'bandit'],
                        dialogues: ['tazuna_meeting'],
                        rewards: { xp: 1000, ryo: 3000 }
                    },
                    {
                        id: 'wave_2',
                        title: 'Los Hermanos Demonio',
                        description: 'Enfrenta a los primeros asesinos de la Niebla',
                        objectives: ['Derrota a los Hermanos Demonio'],
                        enemies: ['demon_brother_1', 'demon_brother_2'],
                        dialogues: [],
                        rewards: { xp: 1200, ryo: 2400 }
                    },
                    {
                        id: 'wave_3',
                        title: 'El Demonio Oculto en la Niebla',
                        description: 'Primera batalla contra Zabuza',
                        objectives: ['Sobrevive a Zabuza'],
                        enemies: ['zabuza_1'],
                        dialogues: ['zabuza_first_fight'],
                        rewards: { xp: 2500, ryo: 5000 }
                    },
                    {
                        id: 'wave_4',
                        title: 'La Verdad de Haku',
                        description: 'Enfrenta al misterioso ninja enmascarado',
                        objectives: ['Derrota a Haku'],
                        enemies: ['haku'],
                        dialogues: ['haku_truth'],
                        rewards: { xp: 3000, ryo: 6000, items: ['Máscara de Haku'] }
                    },
                    {
                        id: 'wave_5',
                        title: 'El Demonio Liberado',
                        description: 'Batalla final contra Zabuza',
                        objectives: ['Derrota a Zabuza definitivamente'],
                        enemies: ['zabuza_2'],
                        dialogues: [],
                        rewards: { xp: 4000, ryo: 8000 }
                    },
                    {
                        id: 'wave_6',
                        title: 'El Puente de la Libertad',
                        description: 'Derrota a Gato y completa el puente',
                        objectives: ['Derrota a Gato', 'Completa el puente'],
                        enemies: ['gato'],
                        dialogues: ['bridge_completion'],
                        rewards: { xp: 5000, ryo: 10000, items: ['Rollo de Héroe'] }
                    }
                ]
            },
            tsunade: {
                title: 'Búsqueda de Tsunade',
                chapters: [
                    {
                        id: 'tsunade_1',
                        title: 'La Búsqueda de la Quinta Hokage',
                        description: 'Jiraiya te pide ayuda para encontrar a Tsunade',
                        objectives: ['Viaja con Jiraiya', 'Derrota ninjas de Oto'],
                        enemies: ['ninja_oto_basico', 'ninja_oto_basico'],
                        dialogues: ['jiraiya_busqueda'],
                        rewards: { xp: 800, ryo: 2000, items: ['poción_chakra_grande'] }
                    },
                    {
                        id: 'tsunade_2',
                        title: 'El Legado del Hokage',
                        description: 'Tsunade pone a prueba tu determinación',
                        objectives: ['Demuestra tu fuerza'],
                        enemies: [],
                        boss: 'tsunade_prueba',
                        dialogues: ['tsunade_prueba'],
                        rewards: { xp: 1000, ryo: 2500, items: ['collar_hokage_prestado'] }
                    },
                    {
                        id: 'tsunade_3',
                        title: 'Los Sannin se Reúnen',
                        description: 'Orochimaru aparece buscando a Tsunade',
                        objectives: ['Protege a Tsunade', 'Derrota a Kabuto'],
                        enemies: ['kabuto'],
                        boss: 'orochimaru_f5',
                        dialogues: ['sannin_batalla'],
                        rewards: { xp: 2000, ryo: 5000, items: ['pergamino_sannin'] }
                    },
                    {
                        id: 'tsunade_4',
                        title: 'La Decisión de Tsunade',
                        description: 'Tsunade toma su decisión final',
                        objectives: ['Regresa a Konoha'],
                        enemies: [],
                        dialogues: ['tsunade_decision'],
                        rewards: { xp: 1500, ryo: 4000, items: ['bandana_konoha_mejorada'], unlockCharacter: 'tsunade' }
                    }
                ]
            },
            sasuke_rescue: {
                title: 'Rescate de Sasuke',
                chapters: [
                    {
                        id: 'sasuke_1',
                        title: 'La Deserción de Sasuke',
                        description: 'Sasuke ha abandonado Konoha',
                        objectives: ['Forma el equipo de rescate'],
                        enemies: ['ninja_oto_avanzado'],
                        dialogues: ['sasuke_desercion'],
                        rewards: { xp: 600, ryo: 1500 }
                    },
                    {
                        id: 'sasuke_2',
                        title: 'El Primer Obstáculo: Jirobo',
                        description: 'Jirobo bloquea el paso',
                        objectives: ['Derrota a Jirobo'],
                        enemies: [],
                        boss: 'jirobo',
                        dialogues: ['jirobo_batalla'],
                        rewards: { xp: 1800, ryo: 3000, items: ['píldora_soldado'] }
                    },
                    {
                        id: 'sasuke_3',
                        title: 'El Segundo Obstáculo: Kidomaru',
                        description: 'Kidomaru ataca desde la distancia',
                        objectives: ['Esquiva las flechas', 'Encuentra su punto ciego'],
                        enemies: [],
                        boss: 'kidomaru',
                        dialogues: ['kidomaru_batalla'],
                        rewards: { xp: 1900, ryo: 3200, items: ['arco_demoníaco_roto'] }
                    },
                    {
                        id: 'sasuke_4',
                        title: 'El Tercer Obstáculo: Tayuya',
                        description: 'Tayuya usa genjutsu musical',
                        objectives: ['Resiste el genjutsu'],
                        enemies: [],
                        boss: 'tayuya',
                        dialogues: ['tayuya_batalla'],
                        rewards: { xp: 2000, ryo: 3500, items: ['flauta_demoníaca_rota'] }
                    },
                    {
                        id: 'sasuke_5',
                        title: 'El Cuarto Obstáculo: Sakon & Ukon',
                        description: 'Los hermanos simbióticos',
                        objectives: ['Separa a los hermanos'],
                        enemies: [],
                        boss: 'sakon_ukon',
                        dialogues: ['sakon_batalla'],
                        rewards: { xp: 2100, ryo: 3800, items: ['píldora_soldado_x2'] }
                    },
                    {
                        id: 'sasuke_6',
                        title: 'El Quinto Obstáculo: Kimimaro',
                        description: 'El último de los Cuatro Sonidos',
                        objectives: ['Enfrenta a Kimimaro'],
                        enemies: [],
                        boss: 'kimimaro',
                        dialogues: ['kimimaro_batalla'],
                        rewards: { xp: 2500, ryo: 5000, items: ['hueso_sagrado'] }
                    },
                    {
                        id: 'sasuke_7',
                        title: 'El Valle del Fin',
                        description: 'Enfrentamiento final con Sasuke',
                        objectives: ['Confronta a Sasuke'],
                        enemies: [],
                        boss: 'sasuke_corrompido',
                        dialogues: ['valle_fin'],
                        rewards: { xp: 3500, ryo: 8000, items: ['bandana_rasgada'] }
                    },
                    {
                        id: 'sasuke_8',
                        title: 'El Regreso a Casa',
                        description: 'Promesa de traer a Sasuke',
                        objectives: ['Reporta a la Hokage'],
                        enemies: [],
                        dialogues: ['regreso_konoha'],
                        rewards: { xp: 2000, ryo: 5000, items: ['promesa_amistad'], unlockJutsu: ['rasengan_nivel_2'] }
                    }
                ]
            }
        };
    }

    getCurrentArc() {
        return this.arcs[this.currentArc];
    }

    getCurrentChapter() {
        const arc = this.getCurrentArc();
        if (!arc || this.currentChapter >= arc.chapters.length) return null;
        return arc.chapters[this.currentChapter];
    }

    startChapter(chapterIndex) {
        const arc = this.getCurrentArc();
        if (!arc || chapterIndex < 0 || chapterIndex >= arc.chapters.length) return false;
        
        this.currentChapter = chapterIndex;
        const chapter = arc.chapters[chapterIndex];
        
        // Iniciar diálogos introductorios si existen
        if (chapter.dialogues && chapter.dialogues.length > 0) {
            this.startDialogue(chapter.dialogues[0]);
        }
        
        return true;
    }

    completeChapter() {
        const chapter = this.getCurrentChapter();
        if (!chapter) return false;
        
        // Marcar capítulo como completado
        this.completedChapters.push(chapter.id);
        this.storyFlags[`completed_${chapter.id}`] = true;
        
        // Avanzar al siguiente capítulo o arco
        const arc = this.getCurrentArc();
        if (this.currentChapter < arc.chapters.length - 1) {
            this.currentChapter++;
        } else {
            // Completar arco actual
            this.storyFlags[`completed_${this.currentArc}_arc`] = true;
            this.advanceToNextArc();
        }
        
        return true;
    }

    advanceToNextArc() {
        if (this.currentArc === 'academy') {
            this.currentArc = 'wave';
            this.currentChapter = 0;
        } else if (this.currentArc === 'wave') {
            this.currentArc = 'chunin';
            this.currentChapter = 0;
        } else if (this.currentArc === 'chunin') {
            this.currentArc = 'tsunade';
            this.currentChapter = 0;
        } else if (this.currentArc === 'tsunade') {
            this.currentArc = 'sasuke_rescue';
            this.currentChapter = 0;
        } else if (this.currentArc === 'sasuke_rescue') {
            // Fin de la Fase 5 - Preparar para Fase 6
            this.storyFlags['phase_5_complete'] = true;
        }
    }

    startDialogue(dialogueId) {
        if (typeof DialogueSystem !== 'undefined') {
            this.activeScene = { type: 'dialogue', dialogueId };
            return true;
        }
        return false;
    }

    startCombat(enemyId) {
        const chapter = this.getCurrentChapter();
        if (!chapter) return false;
        
        const enemy = chapter.enemies.find(e => e === enemyId || e.id === enemyId);
        if (!enemy) return false;
        
        this.activeScene = { type: 'combat', enemyId };
        return true;
    }

    endActiveScene(success) {
        if (!this.activeScene) return false;
        
        if (success && this.activeScene.type === 'combat') {
            // Verificar si todos los enemigos del capítulo fueron derrotados
            this.checkChapterCompletion();
        }
        
        this.activeScene = null;
        return true;
    }

    checkChapterCompletion() {
        const chapter = this.getCurrentChapter();
        if (!chapter) return false;
        
        // Verificar objetivos completados
        const allObjectivesComplete = chapter.objectives.every(obj => {
            // Lógica simplificada - en implementación real verificaría progreso
            return this.storyFlags[obj.replace(/\s/g, '_').toLowerCase()] || false;
        });
        
        if (allObjectivesComplete) {
            this.completeChapter();
            return true;
        }
        
        return false;
    }

    getStoryProgress() {
        const totalChapters = 
            this.arcs.academy.chapters.length + 
            this.arcs.wave.chapters.length;
        
        return {
            currentArc: this.currentArc,
            currentChapter: this.currentChapter + 1,
            totalChapters: totalChapters,
            completedChapters: this.completedChapters.length,
            percentage: Math.round((this.completedChapters.length / totalChapters) * 100)
        };
    }

    setFlag(flagName, value = true) {
        this.storyFlags[flagName] = value;
    }

    getFlag(flagName, defaultValue = false) {
        return this.storyFlags[flagName] !== undefined ? this.storyFlags[flagName] : defaultValue;
    }
}

// Escenas cinemáticas especiales
const cutscenes = {
    academy_graduation: {
        id: 'academy_graduation',
        title: 'Graduación de la Academia',
        scenes: [
            { type: 'text', speaker: 'Narrador', text: 'Después de años de esfuerzo...' },
            { type: 'text', speaker: 'Narrador', text: 'Naruto finalmente se gradúa de la Academia.' },
            { type: 'dialogue', dialogueId: 'hokage_graduation' }
        ]
    },
    
    bridge_named: {
        id: 'bridge_named',
        title: 'El Gran Puente Naruto',
        scenes: [
            { type: 'text', speaker: 'Narrador', text: 'El puente está completo.' },
            { type: 'text', speaker: 'Tazuna', text: 'Lo llamaremos... El Gran Puente Naruto.' },
            { type: 'dialogue', dialogueId: 'bridge_completion' }
        ]
    },
    
    zabuza_haku_death: {
        id: 'zabuza_haku_death',
        title: 'El Fin de un Demonio',
        scenes: [
            { type: 'text', speaker: 'Narrador', text: 'Con su último aliento...' },
            { type: 'text', speaker: 'Zabuza', text: 'Haku... ¿podría ir donde tú vas?' },
            { type: 'text', speaker: 'Narrador', text: 'El demonio finalmente encontró paz.' }
        ]
    },
    
    // Fase 5 - Tsunade
    tsunade_accepts: {
        id: 'tsunade_accepts',
        title: 'La Quinta Hokage',
        scenes: [
            { type: 'text', speaker: 'Narrador', text: 'Después de la batalla con Orochimaru...' },
            { type: 'text', speaker: 'Tsunade', text: 'He tomado mi decisión. Seré la Quinta Hokage.' },
            { type: 'dialogue', dialogueId: 'tsunade_decision' }
        ]
    },
    
    // Fase 5 - Rescate Sasuke
    valley_of_end: {
        id: 'valley_of_end',
        title: 'El Valle del Fin',
        scenes: [
            { type: 'text', speaker: 'Narrador', text: 'Dos amigos se enfrentan en el valle...' },
            { type: 'text', speaker: 'Naruto', text: '¡Eres mi mejor amigo! ¡No te dejaré ir!' },
            { type: 'text', speaker: 'Sasuke', text: 'Naruto... no puedes entender mi dolor.' },
            { type: 'dialogue', dialogueId: 'valle_fin' }
        ]
    },
    
    sasuke_escape: {
        id: 'sasuke_escape',
        title: 'La Promesa',
        scenes: [
            { type: 'text', speaker: 'Narrador', text: 'Aunque Sasuke escapó...' },
            { type: 'text', speaker: 'Naruto', text: 'No importa cuánto tiempo tome, te traeré de vuelta.' },
            { type: 'text', speaker: 'Narrador', text: 'Esta es mi promesa.' }
        ]
    }
};

class CutscenePlayer {
    constructor() {
        this.currentCutscene = null;
        this.currentSceneIndex = 0;
        this.onCutsceneEnd = null;
    }

    play(cutsceneId) {
        const cutscene = cutscenes[cutsceneId];
        if (!cutscene) return false;
        
        this.currentCutscene = cutscene;
        this.currentSceneIndex = 0;
        return true;
    }

    getCurrentScene() {
        if (!this.currentCutscene) return null;
        return this.currentCutscene.scenes[this.currentSceneIndex];
    }

    nextScene() {
        if (!this.currentCutscene) return null;
        
        this.currentSceneIndex++;
        
        if (this.currentSceneIndex >= this.currentCutscene.scenes.length) {
            this.end();
            return null;
        }
        
        return this.getCurrentScene();
    }

    end() {
        if (this.onCutsceneEnd) {
            this.onCutsceneEnd();
        }
        this.currentCutscene = null;
        this.currentSceneIndex = 0;
    }
}

// Exportar para navegador
window.StoryMode = StoryMode;
window.CutscenePlayer = CutscenePlayer;
window.cutscenes = cutscenes;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryMode, CutscenePlayer, cutscenes };
}
