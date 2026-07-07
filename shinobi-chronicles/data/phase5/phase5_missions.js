// Misiones de la Fase 5: Búsqueda de Tsunade + Rescate de Sasuke

const phase5Missions = [
    // ARCO DE TSUNADE
    {
        id: 'tsunade_1',
        title: 'La Búsqueda de la Quinta Hokage',
        description: 'Jiraiya te pide ayuda para encontrar a Tsunade y convencerla de convertirse en Hokage.',
        arc: 'Búsqueda de Tsunade',
        order: 1,
        objectives: [
            'Viaja con Jiraiya a buscar a Tsunade',
            'Derrota a los ninjas de Oto que los emboscan',
            'Encuentra a Tsunade en el pueblo del juego'
        ],
        rewards: {
            exp: 800,
            ryo: 2000,
            items: ['poción_chakra_grande']
        },
        enemies: ['ninja_oto_basico', 'ninja_oto_basico'],
        boss: null,
        dialogue: {
            start: '¡Naruto! Necesito tu ayuda. Vamos a buscar a una vieja amiga... Tsunade.',
            end: '¡La encontramos! Pero parece que tiene sus propias dudas...'
        }
    },
    {
        id: 'tsunade_2',
        title: 'El Legado del Hokage',
        description: 'Tsunade pone a prueba tu determinación con un desafío especial.',
        arc: 'Búsqueda de Tsunade',
        order: 2,
        objectives: [
            'Demuestra tu fuerza a Tsunade',
            'Aprende sobre el collar del Primer Hokage',
            'Gana la confianza de Tsunade'
        ],
        rewards: {
            exp: 1000,
            ryo: 2500,
            items: ['collar_hokage_prestado']
        },
        enemies: [],
        boss: 'tsunade_prueba',
        dialogue: {
            start: '¿Quieres que sea Hokage? Demuéstrame que vales la pena.',
            end: 'No está mal... tal vez haya esperanza para Konoha después de todo.'
        }
    },
    {
        id: 'tsunade_3',
        title: 'Los Sannin se Reúnen',
        description: 'Orochimaru aparece buscando a Tsunade. ¡Los tres Sannin se enfrentan!',
        arc: 'Búsqueda de Tsunade',
        order: 3,
        objectives: [
            'Protege a Tsunade de Orochimaru',
            'Derrota a Kabuto',
            'Ayuda a Jiraiya en la batalla'
        ],
        rewards: {
            exp: 2000,
            ryo: 5000,
            items: ['pergamino_sannin']
        },
        enemies: ['kabuto'],
        boss: 'orochimaru_f5',
        dialogue: {
            start: 'Tsunade... únete a mí y juntos dominaremos el mundo.',
            end: '¡Jamás! Konoha es mi hogar. ¡Naruto, demuestra tu camino ninja!'
        }
    },
    {
        id: 'tsunade_4',
        title: 'La Decisión de Tsunade',
        description: 'Después de la batalla, Tsunade toma su decisión final.',
        arc: 'Búsqueda de Tsunade',
        order: 4,
        objectives: [
            'Regresa a Konoha con Tsunade',
            'Testifica la ceremonia de investidura',
            'Recibe tu primera misión como equipo de la nueva Hokage'
        ],
        rewards: {
            exp: 1500,
            ryo: 4000,
            items: ['bandana_konoha_mejorada'],
            unlockCharacter: 'tsunade'
        },
        enemies: [],
        boss: null,
        dialogue: {
            start: 'He tomado mi decisión. Seré la Quinta Hokage.',
            end: '¡Bienvenidos a casa! Konoha tiene un nuevo futuro por delante.'
        }
    },
    
    // ARCO DEL RESCATE DE SASUKE
    {
        id: 'sasuke_1',
        title: 'La Deserción de Sasuke',
        description: 'Sasuke ha abandonado Konoha siguiendo a Orochimaru. Debes detenerlo.',
        arc: 'Rescate de Sasuke',
        order: 5,
        objectives: [
            'Descubre la huida de Sasuke',
            'Forma el equipo de rescate',
            'Persigue a los Cuatro Sonidos'
        ],
        rewards: {
            exp: 600,
            ryo: 1500,
            items: []
        },
        enemies: ['ninja_oto_avanzado'],
        boss: null,
        dialogue: {
            start: '¡Sasuke se ha ido! Se fue con Orochimaru...',
            end: 'No podemos dejar que se escape. ¡Vamos a traerlo de vuelta!'
        }
    },
    {
        id: 'sasuke_2',
        title: 'El Primer Obstáculo: Jirobo',
        description: 'Jirobo bloquea el paso del equipo de rescate. Naruto debe enfrentarlo solo.',
        arc: 'Rescate de Sasuke',
        order: 6,
        objectives: [
            'Derrota a Jirobo',
            'Libera el sello maldito de nivel 2',
            'Continúa la persecución'
        ],
        rewards: {
            exp: 1800,
            ryo: 3000,
            items: ['píldora_soldado']
        },
        enemies: [],
        boss: 'jirobo',
        dialogue: {
            start: '¿Creen que pueden pasar? Soy el más fuerte de los Cuatro Sonidos.',
            end: '¡Imposible! ¿Cómo pudiste superar mi poder?'
        }
    },
    {
        id: 'sasuke_3',
        title: 'El Segundo Obstáculo: Kidomaru',
        description: 'Kidomaru ataca desde la distancia. Neji debe usar su Byakugan para vencerlo.',
        arc: 'Rescate de Sasuke',
        order: 7,
        objectives: [
            'Esquiva las flechas de Kidomaru',
            'Encuentra su punto ciego',
            'Derrota al arquero de Oto'
        ],
        rewards: {
            exp: 1900,
            ryo: 3200,
            items: ['arco_demoníaco_roto']
        },
        enemies: [],
        boss: 'kidomaru',
        dialogue: {
            start: 'Mi arco nunca falla. Prepárate para morir.',
            end: 'Mi... mi punto ciego... ¿cómo lo encontraste?'
        }
    },
    {
        id: 'sasuke_4',
        title: 'El Tercer Obstáculo: Tayuya',
        description: 'Tayuya usa genjutsu musical. Shikamaru debe ingeniar una estrategia brillante.',
        arc: 'Rescate de Sasuke',
        order: 8,
        objectives: [
            'Resiste el genjutsu de la flauta',
            'Derrota a los invocados de Tayuya',
            'Supera el intelecto de Shikamaru'
        ],
        rewards: {
            exp: 2000,
            ryo: 3500,
            items: ['flauta_demoníaca_rota']
        },
        enemies: [],
        boss: 'tayuya',
        dialogue: {
            start: 'Mi música controlará tu mente. ¡Prepárate para sufrir!',
            end: '¡Malditos genios! ¿Por qué tienen que ser tan listos?'
        }
    },
    {
        id: 'sasuke_5',
        title: 'El Cuarto Obstáculo: Sakon & Ukon',
        description: 'Los hermanos simbióticos son un enemigo único. Kiba y Akamaru deben trabajar juntos.',
        arc: 'Rescate de Sasuke',
        order: 9,
        objectives: [
            'Separa a los hermanos',
            'Derrota a Sakon y Ukon individualmente',
            'Usa el trabajo en equipo perfecto'
        ],
        rewards: {
            exp: 2100,
            ryo: 3800,
            items: ['píldora_soldado_x2']
        },
        enemies: [],
        boss: 'sakon_ukon',
        dialogue: {
            start: 'Somos uno y somos dos. No puedes vencernos.',
            end: 'Imposible... nos separaron...'
        }
    },
    {
        id: 'sasuke_6',
        title: 'El Quinto Obstáculo: Kimimaro',
        description: 'El último y más poderoso de los Cuatro Sonidos. Gaara llega para ayudar.',
        arc: 'Rescate de Sasuke',
        order: 10,
        objectives: [
            'Enfrenta al portador del Shikotsumyaku',
            'Sobrevive a la Danza del Loto',
            'Espera la llegada de Gaara'
        ],
        rewards: {
            exp: 2500,
            ryo: 5000,
            items: ['hueso_sagrado']
        },
        enemies: [],
        boss: 'kimimaro',
        dialogue: {
            start: 'Lord Orochimaru será complacido. No pasarán.',
            end: 'Mi cuerpo... finalmente sirve a Lord Orochimaru...'
        }
    },
    {
        id: 'sasuke_7',
        title: 'El Valle del Fin',
        description: 'Finalmente alcanzas a Sasuke en el Valle del Fin. Es hora del enfrentamiento final.',
        arc: 'Rescate de Sasuke',
        order: 11,
        objectives: [
            'Confronta a Sasuke en el Valle del Fin',
            'Demuestra tu amistad con combate',
            'Intenta hacerlo entrar en razón'
        ],
        rewards: {
            exp: 3500,
            ryo: 8000,
            items: ['bandana_rasgada']
        },
        enemies: [],
        boss: 'sasuke_corrompido',
        dialogue: {
            start: 'Naruto... ¿por qué viniste? No puedes entender mi dolor.',
            end: 'Eres mi mejor amigo... siempre lo serás. Volveré por ti.'
        }
    },
    {
        id: 'sasuke_8',
        title: 'El Regreso a Casa',
        description: 'Aunque Sasuke escapó, has demostrado tu valía. Konoha te espera.',
        arc: 'Rescate de Sasuke',
        order: 12,
        objectives: [
            'Regresa a Konoha herido pero vivo',
            'Reporta a la Quinta Hokage',
            'Promete traer a Sasuke de vuelta'
        ],
        rewards: {
            exp: 2000,
            ryo: 5000,
            items: ['promesa_amistad'],
            unlockJutsu: ['rasengan_nivel_2']
        },
        enemies: [],
        boss: null,
        dialogue: {
            start: 'Fallamos en traerlo de vuelta...',
            end: 'No importa cuánto tiempo tome, traeré a Sasuke de vuelta. ¡Eso es mi camino ninja!'
        }
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { phase5Missions };
}
