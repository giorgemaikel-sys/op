/**
 * Sistema de Diálogos - Fase 3
 * Gestiona conversaciones con NPCs, escenas narrativas y decisiones
 */

class DialogueNode {
    constructor(id, speaker, text, choices = [], effects = {}) {
        this.id = id;
        this.speaker = speaker;
        this.text = text;
        this.choices = choices; // [{ text, nextId, condition }]
        this.effects = effects; // Funciones o cambios de estado
    }
}

class DialogueSystem {
    constructor() {
        this.currentDialogue = null;
        this.currentNode = null;
        this.dialogueHistory = [];
        this.onDialogueEnd = null;
    }

    loadDialogue(dialogueId) {
        const dialogue = dialogues[dialogueId];
        if (!dialogue) return false;
        
        this.currentDialogue = dialogue;
        this.currentNode = dialogue.start ? dialogue[dialogue.start] : dialogue[Object.keys(dialogue)[0]];
        this.dialogueHistory = [this.currentNode.id];
        
        return true;
    }

    getCurrentText() {
        return this.currentNode ? this.currentNode.text : '';
    }

    getCurrentSpeaker() {
        return this.currentNode ? this.currentNode.speaker : '';
    }

    getChoices(player) {
        if (!this.currentNode || !this.currentNode.choices) return [];
        
        return this.currentNode.choices.filter(choice => {
            if (!choice.condition) return true;
            return choice.condition(player, this);
        });
    }

    selectChoice(choiceIndex, player) {
        const choices = this.getChoices(player);
        if (choiceIndex < 0 || choiceIndex >= choices.length) return false;
        
        const choice = choices[choiceIndex];
        
        // Aplicar efectos si existen
        if (choice.effects) {
            this.applyEffects(choice.effects, player);
        }
        
        // Mover al siguiente nodo
        if (choice.nextId) {
            this.currentNode = this.currentDialogue[choice.nextId];
            this.dialogueHistory.push(this.currentNode.id);
            return true;
        }
        
        // Fin del diálogo
        this.endDialogue();
        return false;
    }

    applyEffects(effects, player) {
        if (effects.xp) player.gainXp(effects.xp);
        if (effects.ryo) player.ryo = (player.ryo || 0) + effects.ryo;
        if (effects.relationships) {
            player.relationships = player.relationships || {};
            for (const [npc, change] of Object.entries(effects.relationships)) {
                player.relationships[npc] = (player.relationships[npc] || 0) + change;
            }
        }
        if (effects.flags) {
            player.flags = player.flags || {};
            Object.assign(player.flags, effects.flags);
        }
    }

    endDialogue() {
        if (this.onDialogueEnd) {
            this.onDialogueEnd();
        }
        this.currentDialogue = null;
        this.currentNode = null;
    }

    skipToNode(nodeId) {
        if (!this.currentDialogue || !this.currentDialogue[nodeId]) return false;
        this.currentNode = this.currentDialogue[nodeId];
        this.dialogueHistory.push(nodeId);
        return true;
    }
}

// Diálogos de la Saga de la Academia
const academyDialogues = {
    iruka_intro: {
        start: 'greeting',
        greeting: new DialogueNode(
            'greeting',
            'Iruka',
            '¡Naruto! Llegas justo a tiempo. Hoy es el examen final de graduación. ¿Estás preparado?',
            [
                { text: '¡Dattebayo! ¡Voy a aprobar!', nextId: 'confident' },
                { text: 'Tengo un poco de nervios...', nextId: 'nervous' }
            ]
        ),
        confident: new DialogueNode(
            'confident',
            'Iruka',
            '¡Esa es la actitud! Recuerda: el Clone Jutsu es esencial. Demuestra todo lo que has aprendido.',
            [
                { text: '¡Entendido, Iruka-sensei!', nextId: 'end', effects: { xp: 50 } }
            ]
        ),
        nervous: new DialogueNode(
            'nervous',
            'Iruka',
            'No te preocupes, Naruto. Confía en ti mismo. Has mejorado mucho este año.',
            [
                { text: 'Gracias, Iruka-sensei. ¡No te defraudaré!', nextId: 'end', effects: { xp: 50 } }
            ]
        ),
        end: new DialogueNode('end', '', '')
    },

    mizuki_betrayal: {
        start: 'reveal',
        reveal: new DialogueNode(
            'reveal',
            'Mizuki',
            '¿Realmente creíste que Iruka se preocupaba por ti? ¡Todos en la aldea te temen!',
            [
                { text: '¿Qué estás diciendo?', nextId: 'truth' },
                { text: '¡Eso es mentira!', nextId: 'deny' }
            ]
        ),
        truth: new DialogueNode(
            'truth',
            'Mizuki',
            '¡El Zorro de Nueve Colas está sellado dentro de ti! ¡Eres un monstruo!',
            [
                { text: '...¿Es verdad?', nextId: 'doubt' },
                { text: '¡No me importa! ¡Soy Naruto Uzumaki!', nextId: 'resolve' }
            ]
        ),
        deny: new DialogueNode(
            'deny',
            'Mizuki',
            '¡Abre los ojos! Por eso nadie te acepta. Pero puedo darte poder...',
            [
                { text: '¿Poder?', nextId: 'offer' }
            ]
        ),
        doubt: new DialogueNode(
            'doubt',
            'Mizuki',
            'Exacto. Ahora dame el pergamino prohibido y te enseñaré jutsus poderosos.',
            [
                { text: '¡Nunca!', nextId: 'fight' },
                { text: '...(considerarlo)', nextId: 'consider' }
            ]
        ),
        resolve: new DialogueNode(
            'resolve',
            'Mizuki',
            '¡Entonces morirás! ¡No dejaré que te interpongas en mi camino!',
            [
                { text: '¡Inténtalo!', nextId: 'fight', effects: { flags: { 'mizuki_fight': true } } }
            ]
        ),
        offer: new DialogueNode(
            'offer',
            'Mizuki',
            'Roba el pergamino prohibido de la oficina del Hokage. Aprende sus secretos.',
            [
                { text: '¡Jamás traicionaría a Konoha!', nextId: 'fight' }
            ]
        ),
        consider: new DialogueNode(
            'consider',
            'Narrador',
            'Por un momento dudas... pero recuerdas las palabras de Iruka.',
            [
                { text: '¡Eres un traidor, Mizuki!', nextId: 'fight' }
            ]
        ),
        fight: new DialogueNode('fight', '', '')
    },

    hokage_graduation: {
        start: 'ceremony',
        ceremony: new DialogueNode(
            'ceremony',
            'Tercer Hokage',
            'Naruto Uzumaki... Has demostrado un valor excepcional. A partir de hoy, eres un Genin de la Hoja.',
            [
                { text: '¡Lo logré! ¡Believe it!', nextId: 'celebrate' }
            ]
        ),
        celebrate: new DialogueNode(
            'celebrate',
            'Tercer Hokage',
            'Mañana conocerás a tu equipo y a tu Jonin sensei. Descansa bien.',
            [
                { text: '¡Sí, Hokage-sama!', nextId: 'end', effects: { xp: 100, items: ['Protector de Konoha'] } }
            ]
        ),
        end: new DialogueNode('end', '', '')
    }
};

// Diálogos de la Tierra de las Olas
const waveDialogues = {
    tazuna_meeting: {
        start: 'introduction',
        introduction: new DialogueNode(
            'introduction',
            'Tazuna',
            'Así que estos son los ninjas de Konoha... Esperaba algo más impresionante.',
            [
                { text: '¡Oye! ¡Somos muy fuertes!', nextId: 'naruto_protest' },
                { text: 'No se preocupe, lo protegeremos.', nextId: 'kakashi_reassure' }
            ]
        ),
        naruto_protest: new DialogueNode(
            'naruto_protest',
            'Naruto',
            '¡Cuando termine esta misión, seré el Hokage más grande de todos!',
            [
                { text: 'Je je... Tienes espíritu, niño.', nextId: 'explain_mission' }
            ]
        ),
        kakashi_reassure: new DialogueNode(
            'kakashi_reassure',
            'Kakashi',
            'Mi equipo es más capaz de lo que parece. Contamos con su confianza.',
            [
                { text: 'Espero que tengas razón...', nextId: 'explain_mission' }
            ]
        ),
        explain_mission: new DialogueNode(
            'explain_mission',
            'Tazuna',
            'Debo construir un puente para liberar a nuestro país de Gato. Pero él enviará asesinos.',
            [
                { text: 'Entendido. Partamos de inmediato.', nextId: 'end', effects: { xp: 75 } }
            ]
        ),
        end: new DialogueNode('end', '', '')
    },

    zabuza_first_fight: {
        start: 'encounter',
        encounter: new DialogueNode(
            'encounter',
            'Zabuza',
            'El Koppi no Kakashi... He esperado este momento.',
            [
                { text: '¿Quién eres?', nextId: 'reveal' }
            ]
        ),
        reveal: new DialogueNode(
            'reveal',
            'Zabuza',
            'Soy Zabuza Momochi, el Demonio Oculto en la Niebla. Y tú morirás aquí.',
            [
                { text: '¡No subestimes a Konoha!', nextId: 'fight_start', effects: { flags: { 'zabuza_fight_1': true } } }
            ]
        ),
        fight_start: new DialogueNode('fight_start', '', '')
    },

    haku_truth: {
        start: 'mask_off',
        mask_off: new DialogueNode(
            'mask_off',
            'Haku',
            'Las herramientas ninja no tienen género ni sueños. Solo sirven a su maestro.',
            [
                { text: '¡Eso es triste! ¡Todos merecemos sueños!', nextId: 'haku_pause' }
            ]
        ),
        haku_pause: new DialogueNode(
            'haku_pause',
            'Haku',
            'Tus palabras... me recuerdan a alguien. Pero debo cumplir mi deber.',
            [
                { text: '¡Entonces lucharemos!', nextId: 'fight', effects: { flags: { 'haku_fight': true } } }
            ]
        ),
        fight: new DialogueNode('fight', '', '')
    },

    bridge_completion: {
        start: 'final_words',
        final_words: new DialogueNode(
            'final_words',
            'Tazuna',
            'El puente está completo. Gracias a ustedes, la Tierra de las Olas será libre.',
            [
                { text: '¡Fue una gran misión!', nextId: 'name_bridge' }
            ]
        ),
        name_bridge: new DialogueNode(
            'name_bridge',
            'Tazuna',
            'Lo llamaremos "El Gran Puente Naruto". En honor al ninja que nunca se rindió.',
            [
                { text: '¡Wow! ¡Esto es increíble!', nextId: 'farewell', effects: { xp: 500, ryo: 5000 } }
            ]
        ),
        farewell: new DialogueNode(
            'farewell',
            'Kakashi',
            'Bien hecho, equipo. Regresemos a Konoha. Nos esperan nuevas aventuras.',
            [
                { text: '¡Sí! ¡Dattebayo!', nextId: 'end' }
            ]
        ),
        end: new DialogueNode('end', '', '')
    }
};

// Diálogos Fase 5 - Búsqueda de Tsunade
const tsunadeDialogues = {
    jiraiya_busqueda: {
        start: 'inicio',
        inicio: new DialogueNode(
            'inicio',
            'Jiraiya',
            '¡Naruto! Necesito tu ayuda. Vamos a buscar a una vieja amiga... Tsunade. Ella es una de los Legendarios Sannin.',
            [
                { text: '¿Sannin? ¿Quiénes son?', nextId: 'explicacion' },
                { text: '¡Vamos! ¡No puedo esperar!', nextId: 'partida' }
            ]
        ),
        explicacion: new DialogueNode(
            'explicacion',
            'Jiraiya',
            'Los Sannin somos tres ninjas legendarios entrenados por el Tercer Hokage. Yo, Tsunade y... Orochimaru.',
            [
                { text: '¡Entendido! ¡Vamos a buscarla!', nextId: 'partida' }
            ]
        ),
        partida: new DialogueNode(
            'partida',
            'Narrador',
            'Así comienza el viaje para encontrar a la Quinta Hokage...',
            [
                { text: '¡En marcha!', nextId: 'fin', effects: { xp: 100 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    tsunade_prueba: {
        start: 'encuentro',
        encuentro: new DialogueNode(
            'encuentro',
            'Tsunade',
            '¿Así que tú eres el ninja que quiere que sea Hokage? Demuéstrame que vales la pena.',
            [
                { text: '¡Te lo demostraré!', nextId: 'batalla' }
            ]
        ),
        batalla: new DialogueNode(
            'batalla',
            'Tsunade',
            'Muy bien. Prepárate para el combate más duro de tu vida.',
            [
                { text: '¡Dattebayo!', nextId: 'fin', effects: { xp: 200 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    sannin_batalla: {
        start: 'confrontacion',
        confrontacion: new DialogueNode(
            'confrontacion',
            'Orochimaru',
            'Tsunade... únete a mí y juntos dominaremos el mundo. Puedo revivir a Dan y Nawaki.',
            [
                { text: '¡No lo escuches, Tsunade!', nextId: 'decision' }
            ]
        ),
        decision: new DialogueNode(
            'decision',
            'Tsunade',
            '¡Jamás! Konoha es mi hogar. ¡Naruto, Jiraiya, demostremos nuestro camino ninja!',
            [
                { text: '¡Sí!', nextId: 'fin', effects: { xp: 300 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    tsunade_decision: {
        start: 'aceptacion',
        aceptacion: new DialogueNode(
            'aceptacion',
            'Tsunade',
            'He tomado mi decisión. Seré la Quinta Hokage. Regresemos a Konoha.',
            [
                { text: '¡Bienvenido seas, Hokage-sama!', nextId: 'fin', effects: { xp: 500, ryo: 2000 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    }
};

// Diálogos Fase 5 - Rescate de Sasuke
const sasukeRescueDialogues = {
    sasuke_desercion: {
        start: 'descubrimiento',
        descubrimiento: new DialogueNode(
            'descubrimiento',
            'Sakura',
            '¡Sasuke se ha ido! Se fue con Orochimaru...',
            [
                { text: '¿Qué? ¡Tenemos que ir por él!', nextId: 'equipo' }
            ]
        ),
        equipo: new DialogueNode(
            'equipo',
            'Shikamaru',
            'Formaré un equipo de rescate. Necesitamos traer a Sasuke de vuelta.',
            [
                { text: '¡Cuenta conmigo!', nextId: 'fin', effects: { xp: 200 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    jirobo_batalla: {
        start: 'enfrentamiento',
        enfrentamiento: new DialogueNode(
            'enfrentamiento',
            'Jirobo',
            '¿Creen que pueden pasar? Soy el más fuerte de los Cuatro Sonidos.',
            [
                { text: '¡Déjame pasar!', nextId: 'sello' }
            ]
        ),
        sello: new DialogueNode(
            'sello',
            'Jirobo',
            'Si quieres pasar, tendrás que derrotarme. ¡Prepárate!',
            [
                { text: '¡No me detendrás!', nextId: 'fin', effects: { xp: 300 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    kidomaru_batalla: {
        start: 'arco',
        arco: new DialogueNode(
            'arco',
            'Kidomaru',
            'Mi arco nunca falla. Prepárate para morir desde la distancia.',
            [
                { text: '¡Tu arco no es rival para mi Byakugan!', nextId: 'fin', effects: { xp: 300 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    tayuya_batalla: {
        start: 'flauta',
        flauta: new DialogueNode(
            'flauta',
            'Tayuya',
            'Mi música controlará tu mente. ¡Prepárate para sufrir!',
            [
                { text: '¡Tu genjutsu no funcionará!', nextId: 'fin', effects: { xp: 300 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    sakon_batalla: {
        start: 'hermanos',
        hermanos: new DialogueNode(
            'hermanos',
            'Sakon',
            'Somos uno y somos dos. No puedes vencernos.',
            [
                { text: '¡Los separaré!', nextId: 'fin', effects: { xp: 300 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    kimimaro_batalla: {
        start: 'huesos',
        huesos: new DialogueNode(
            'huesos',
            'Kimimaro',
            'Lord Orochimaru será complacido. No pasarán.',
            [
                { text: '¡Tu lealtad no te salvará!', nextId: 'fin', effects: { xp: 400 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    valle_fin: {
        start: 'encuentro',
        encuentro: new DialogueNode(
            'encuentro',
            'Sasuke',
            'Naruto... ¿por qué viniste? No puedes entender mi dolor.',
            [
                { text: '¡Eres mi mejor amigo! ¡No te dejaré ir!', nextId: 'combate' }
            ]
        ),
        combate: new DialogueNode(
            'combate',
            'Sasuke',
            'Entonces demuestra tu amistad con tu puño. ¡Solo uno de nosotros sobrevivirá!',
            [
                { text: '¡Dattebayo!', nextId: 'promesa', effects: { xp: 1000 } }
            ]
        ),
        promesa: new DialogueNode(
            'promesa',
            'Naruto',
            'Eres mi mejor amigo... siempre lo serás. Volveré por ti.',
            [
                { text: 'Continuar...', nextId: 'fin' }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    },
    
    regreso_konoha: {
        start: 'reporte',
        reporte: new DialogueNode(
            'reporte',
            'Tsunade',
            'Fallamos en traerlo de vuelta... pero al menos estás vivo.',
            [
                { text: 'No importa cuánto tiempo tome, traeré a Sasuke de vuelta.', nextId: 'promesa_final' }
            ]
        ),
        promesa_final: new DialogueNode(
            'promesa_final',
            'Naruto',
            '¡Eso es mi camino ninja! ¡Lo traeré de vuelta sin importar qué!',
            [
                { text: 'Fin del arco', nextId: 'fin', effects: { xp: 2000, ryo: 5000 } }
            ]
        ),
        fin: new DialogueNode('fin', '', '')
    }
};

// Combinar todos los diálogos
const dialogues = {
    ...academyDialogues,
    ...waveDialogues,
    ...tsunadeDialogues,
    ...sasukeRescueDialogues
};

// Exportar para navegador
window.DialogueSystem = DialogueSystem;
window.DialogueNode = DialogueNode;
window.dialogues = dialogues;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DialogueSystem, DialogueNode, dialogues };
}
