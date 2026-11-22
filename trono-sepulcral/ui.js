/* Crónicas del Trono Sepulcral — interfaz, narración y comandos.
   El motor (engine.js) decide; aquí solo se presenta y se narra. */
(function () {
  var W = window.TS.W, E = window.TS.E, A = E.A;
  var UI = { sample: null, narrando: false, prosa: 'quick', narrarOn: true, tab: 'estado', pendiente: null };
  window.TS.UI = UI;
  var LS = 'trono-sepulcral.v1';

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function S() { return E.getS(); }

  function toast(msg) {
    var t = el('div', 'toast', msg);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* ───────── Guardado local ───────── */
  function guardarLocal() {
    try { localStorage.setItem(LS, E.guardar()); } catch (e) { /* modo privado o almacenamiento bloqueado */ }
  }
  function cargarLocal() {
    try {
      var t = localStorage.getItem(LS);
      if (!t) return false;
      var r = E.cargar(t);
      return r.ok;
    } catch (e) { return false; }
  }

  /* ───────── Barra de estado ───────── */
  function renderChips() {
    var s = S(), f = s.fecha, c = $('chips');
    c.innerHTML = '';
    function chip(txt, cls) { var x = el('span', 'chip' + (cls ? ' ' + cls : '')); x.innerHTML = txt; c.appendChild(x); }
    chip('<b>' + esc(f.d + ' ' + W.cal.nombresMes[f.m - 1] + ' ' + f.a) + '</b> · ' + esc(E.horaTxt(f).split(' ')[0]));
    chip(esc(E.lugar(s.pc.loc).n));
    chip('Nv <b>' + s.pc.nivel + '</b> ' + esc(E.rango().n));
    chip('Vit <b>' + Math.round(s.pc.hp) + '</b>/' + E.hpMax(), s.pc.hp < E.hpMax() * .35 ? 'blood' : '');
    chip('Maná <b>' + Math.round(s.pc.mana) + '</b>/' + E.manaMax(), 'soul');
    chip(esc(E.estacion(f).n) + ' · ' + esc(E.ciclo('marea', f).fase));
    var velo = E.ciclo('velo', f).fase;
    if (velo === 'Velo Delgado' || velo === 'Velo Tenso') chip(esc(velo), 'soul');
    if (s.pc.notoriedad >= 15) chip('Notoriedad <b>' + s.pc.notoriedad + '</b>', 'blood');
    if (s.pc.sospecha >= 25) chip('Priorato <b>' + s.pc.sospecha + '</b>', 'blood');
    if (s.combate) chip('EN COMBATE', 'blood');
    chip('Narrador: <b>' + (UI.sample && UI.narrarOn ? (UI.prosa === 'quick' ? 'Claude' : 'Claude+') : 'motor') + '</b>');
  }

  /* ───────── Crónica ───────── */
  function entrada(r, opts) {
    opts = opts || {};
    var s = S();
    var wrap = el('div', 'entry');
    var head = el('div', 'ehead');
    head.appendChild(el('span', null, E.fechaTxt(r.fecha || s.fecha)));
    head.appendChild(el('span', null, E.horaTxt(r.fecha || s.fecha)));
    head.appendChild(el('span', null, E.lugar(s.pc.loc).n));
    if (s.pc.cond && s.pc.cond !== 'En forma') head.appendChild(el('span', null, s.pc.cond));
    wrap.appendChild(head);
    if (r.titulo && !opts.sinTitulo) wrap.appendChild(el('h2', 'etitle', r.titulo));
    var prose = el('div', 'prose');
    wrap.appendChild(prose);

    // Mecánica
    if (r.mec && r.mec.length || (r.cambios && r.cambios.length)) {
      var det = el('details', 'mech');
      if (opts.abierto) det.open = true;
      det.appendChild(el('summary', null, 'Mecánica, tiradas y registro de cambios'));
      var inn = el('div', 'mech-in');
      (r.mec || []).forEach(function (m) {
        var line = el('div', null);
        var g = /Éxito crítico/.test(m) ? 'critico' : /Fracaso crítico/.test(m) ? 'fracaso_critico' :
          /Éxito parcial/.test(m) ? 'parcial' : /→ Éxito/.test(m) ? 'exito' : /Fracaso/.test(m) ? 'fracaso' : null;
        if (g) { line.className = 'roll g-' + g; }
        line.textContent = '› ' + m;
        inn.appendChild(line);
      });
      if (r.cambios && r.cambios.length) {
        var tb = el('table', 'delta');
        tb.innerHTML = '<tr><th>Elemento</th><th>Antes</th><th>Ahora</th></tr>';
        r.cambios.forEach(function (c) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + esc(c.el) + '</td><td class="a">' + esc(c.a) + '</td><td class="b">' + esc(c.b) + '</td>';
          tb.appendChild(tr);
        });
        inn.appendChild(tb);
      }
      det.appendChild(inn);
      wrap.appendChild(det);
    }

    // Noticias del mundo
    var noti = (r.noticias || []).filter(function (n) { return !n.silencioso; })
      .concat((r.mundo || []).filter(function (n) { return n && n.txt && !n.silencioso && !n.llega; }));
    if (noti.length) {
      var nb = el('div', 'news');
      nb.appendChild(el('h4', null, 'El mundo, mientras tanto'));
      var ul = el('ul');
      noti.slice(0, 7).forEach(function (n) {
        var li = el('li', n.tipo === 'peligro' || n.tipo === 'muerte' ? 'peligro' : null);
        li.innerHTML = '<b>' + esc(n.t) + ':</b> ' + esc(n.txt);
        ul.appendChild(li);
      });
      nb.appendChild(ul);
      wrap.appendChild(nb);
    }

    // Caja de combate
    if (s.combate) wrap.appendChild(cajaCombate());

    $('cron-inner').appendChild(wrap);
    scrollFin();
    return prose;
  }
  function scrollFin() { var c = $('cron'); c.scrollTop = c.scrollHeight; }

  function cajaCombate() {
    var s = S(), cb = s.combate;
    var box = el('div', 'cbox');
    box.appendChild(el('h4', null, 'Combate · ronda ' + cb.ronda));
    cb.enemigos.forEach(function (e) {
      var row = el('div', 'cfoe');
      row.appendChild(el('span', 'n', e.n + (e.estado !== 'activo' ? ' (' + e.estado + ')' : '')));
      row.appendChild(el('span', 'v', Math.max(0, e.vit) + '/' + e.vitMax));
      box.appendChild(row);
    });
    var aliados = s.criaturas.filter(function (c) { return cb.aliados.indexOf(c.uid) >= 0 && c.estado === 'activa'; });
    aliados.forEach(function (c) {
      var row = el('div', 'cfoe');
      row.appendChild(el('span', 'n', '↳ ' + c.n));
      row.appendChild(el('span', 'v', Math.max(0, c.vit) + '/' + c.vitMax));
      box.appendChild(row);
    });
    var acts = el('div', null);
    var vivos = cb.enemigos.filter(function (e) { return e.estado === 'activo'; });
    function b(txt, cls, fn) { var x = el('button', 'btn' + (cls ? ' ' + cls : ''), txt); x.onclick = fn; acts.appendChild(x); }
    b('Atacar', 'pri', function () { ejecutar(function () { return A.combateAccion({ tipo: 'atacar', objetivo: vivos[0] && vivos[0].uid }); }); });
    s.hechizos.forEach(function (h) {
      b('Lanzar ' + h.n, null, function () { ejecutar(function () { return A.combateAccion({ tipo: 'hechizo', hechizo: h.id, objetivo: vivos[0] && vivos[0].uid }); }); });
    });
    b('Defender', null, function () { ejecutar(function () { return A.combateAccion({ tipo: 'defender' }); }); });
    b('Huir', 'dgr', function () { ejecutar(function () { return A.combateAccion({ tipo: 'huir', objetivo: vivos[0] && vivos[0].uid }); }); });
    box.appendChild(acts);
    if (vivos.length > 1) {
      var sel = el('div', 'tiny', 'Objetivo actual: ' + (vivos[0] ? vivos[0].n : '—') + '. Escribe «ataco a ' + vivos[1].n + '» para cambiar de objetivo.');
      box.appendChild(sel);
    }
    return box;
  }

  /* ───────── Narración ───────── */
  var REGLAS = [
    'Eres el Game Master de "Crónicas del Trono Sepulcral": RPG de fantasía oscura, nigromancia y simulación, en dificultad extrema.',
    'El MOTOR del juego ya ha resuelto la acción con tiradas. Tu única tarea es narrar ese resultado exacto en prosa española, segunda persona ("tú"), 110-200 palabras.',
    'REGLAS INVIOLABLES:',
    '1. No decidas ni inventes las decisiones, palabras ni pensamientos futuros de Maikel. Él solo ha hecho la acción indicada.',
    '2. No alteres el resultado mecánico. No concedas éxitos, objetos, hechizos, criaturas, aliados ni poderes que no figuren en los datos.',
    '3. No reveles nada que Maikel no haya descubierto: ni secretos, ni nombres ocultos, ni mapas, ni estadísticas ajenas.',
    '4. No impongas misiones ni digas qué debería hacer. Puedes describir lo que percibe y lo que otros hacen por su cuenta.',
    '5. Violencia fantástica y tensa, nunca gráfica ni morbosa.',
    '6. Solo prosa: sin encabezados, listas, tablas ni cifras de juego (esas ya van en el bloque mecánico). No repitas tiradas.',
    '7. El mundo existe sin Maikel: los demás tienen sus propios asuntos.',
    '8. Cierra situándolo en el presente: dónde está y qué percibe ahora.'
  ].join('\n');

  function digest() {
    var s = S(), loc = E.lugar(s.pc.loc);
    var L = [];
    L.push('FECHA: ' + E.fechaTxt() + ', ' + E.horaTxt(s.fecha) + '. Estación: ' + E.estacion(s.fecha).n + ' (' + E.estacion(s.fecha).clima + '). ' + E.ciclo('marea', s.fecha).nombre + ': ' + E.ciclo('marea', s.fecha).fase + '. Velo: ' + E.ciclo('velo', s.fecha).fase + '.');
    var fest = E.festividad(s.fecha);
    if (fest) L.push('HOY ES: ' + fest.n + ' — ' + fest.desc);
    L.push('LUGAR: ' + loc.n + ' (' + loc.tipo + ', ' + loc.reg + '). ' + loc.desc + ' Clima: ' + loc.clima + '.');
    var presentes = E.npcsEn(s.pc.loc).filter(function (n) { return n.conocido; });
    if (presentes.length) L.push('PRESENTES: ' + presentes.map(function (n) {
      return n.def.n + ' (' + n.def.ocu + ', ' + n.def.pers.split('.')[0] + '; opinión sobre Maikel ' + n.est.op + ')';
    }).join('; ') + '.');
    L.push('MAIKEL: ' + s.pc.edad + ' años, nivel ' + s.pc.nivel + ' (' + E.rango().n + '), nigromante autodidacta. Condición: ' + s.pc.cond + '. Vitalidad ' + Math.round(s.pc.hp) + '/' + E.hpMax() + ', maná ' + Math.round(s.pc.mana) + '/' + E.manaMax() + ', cordura ' + s.pc.cordura + '/100.');
    L.push('DOMINIO: Nigromancia ' + E.dom('nigro') + '/100. Códice legible al ' + s.codice.leg + '%, mortajas abiertas ' + s.codice.mortajas.filter(Boolean).length + '/9.');
    if (s.hechizos.length) L.push('TÉCNICAS: ' + s.hechizos.map(function (h) { return h.n + (h.incompleto ? ' (incompleta)' : ''); }).join(', ') + '.');
    var crs = s.criaturas.filter(function (c) { return c.estado !== 'destruida'; });
    if (crs.length) L.push('CRIATURAS: ' + crs.map(function (c) { return c.n + ' (' + c.esp + ', ' + c.estado + ', lealtad ' + c.lealtad + ', inteligencia ' + c.int + ')'; }).join('; ') + '.');
    if (s.org) L.push('ORGANIZACIÓN: ' + s.org.n + ', ' + s.org.miembros + ' miembros, moral ' + s.org.moral + '.');
    if (s.pc.notoriedad > 10) L.push('RIESGO: notoriedad ' + s.pc.notoriedad + '/100; sospecha del Priorato ' + s.pc.sospecha + '/100.');
    if (s.rumores.length) L.push('RUMORES QUE MAIKEL CONOCE: ' + s.rumores.slice(-4).join(' / '));
    return L.join('\n');
  }

  async function narrar(prose, r) {
    var local = narrarLocal(r);
    if (!UI.sample || !UI.narrarOn) { prose.innerHTML = parr(local); return; }
    var ctx = JSON.stringify(r.ctx || {}).slice(0, 1400);
    var noti = (r.noticias || []).filter(function (n) { return !n.silencioso; }).slice(0, 4)
      .map(function (n) { return '- ' + n.t + ': ' + n.txt; }).join('\n');
    var prompt = REGLAS + '\n\n=== ESTADO ACTUAL ===\n' + digest() +
      '\n\n=== ACCIÓN RESUELTA POR EL MOTOR ===\nAcción: ' + r.titulo +
      (r.ok ? '' : ' (LA ACCIÓN NO SE PUDO REALIZAR: narra el impedimento, sin que Maikel consiga nada)') +
      '\nResultado mecánico exacto (no lo contradigas):\n' + (r.mec || []).map(function (m) { return '- ' + m; }).join('\n') +
      '\nDatos de contexto: ' + ctx +
      (noti ? '\n\n=== NOTICIAS QUE PUEDEN LLEGARLE (solo si es verosímil que las oiga aquí) ===\n' + noti : '') +
      '\n\nNarra ahora ese momento.';
    prose.innerHTML = '<p class="cursor">El narrador escribe…</p>';
    UI.narrando = true;
    try {
      var res = await UI.sample(prompt, {
        modelTier: UI.prosa, cache: false,
        onText: function (u) { prose.innerHTML = parr(u.text); scrollFin(); }
      });
      prose.innerHTML = parr(res.text);
    } catch (e) {
      prose.innerHTML = parr(local);
      if (e && e.code === 'not_granted') { UI.sample = null; toast('Sin permiso para usar Claude: narra el motor.'); }
      else if (e && e.code === 'rate_limited') toast('Claude está al límite de uso; narra el motor.');
      else if (e && e.code && e.code !== 'cancelled') toast('Narración de Claude no disponible (' + e.code + ').');
    }
    UI.narrando = false;
    renderChips();
    scrollFin();
  }
  function parr(txt) {
    return String(txt).split(/\n{1,}/).filter(function (x) { return x.trim(); })
      .map(function (p) { return '<p>' + esc(p.trim()) + '</p>'; }).join('');
  }

  /* ───────── Narrador local (sin Claude) ───────── */
  function narrarLocal(r) {
    var s = S(), c = r.ctx || {}, loc = E.lugar(s.pc.loc);
    var P = E.pick;
    if (!r.ok) return 'No llega a hacerlo. ' + (r.mec[0] || 'Algo lo impide.');
    switch (c.tipo) {
      case 'viaje':
        return 'Dejas ' + c.desde + ' y caminas hacia ' + c.hasta + '. ' +
          P(['El camino está blando por la lluvia y cada paso suena a sorbo.', 'El viento viene del páramo y trae olor a turba quemada.', 'La luz se va antes de lo que esperabas y aprietas el paso.']) +
          (c.incidente ? ' Algo rompe la monotonía: ' + (c.encuentro ? 'hay movimiento delante y no es ganado.' : 'pierdes el sendero un rato largo.') : ' Llegas sin incidentes dignos de contar.') +
          ' Ahora estás en ' + c.hasta + '.';
      case 'exploracion':
        return 'Recorres ' + c.lugar + ' despacio, mirando lo que la gente de aquí ya no mira. ' +
          (c.hallazgo === 'componentes' ? 'Apartas algo aprovechable y te lo guardas sin ceremonia.' :
            c.hallazgo ? 'Y encuentras algo que nadie había puesto en palabras: ' + c.hallazgo :
              c.nuevoLugar ? 'Al fondo se abre un camino que no estaba en tu cabeza: ' + c.nuevoLugar + '.' :
                'No sacas nada claro, solo la certeza de que falta mirar mejor.');
      case 'recoleccion':
        return 'Trabajas con las manos y la paciencia que te enseñó el oficio. ' +
          (c.obtenido && c.obtenido.length ? 'Te llevas ' + c.obtenido.join(', ').toLowerCase() + '.' : 'No hay nada que valga la pena cargar.');
      case 'estudio_codice':
        return 'Abres el Códice con la linterna baja. La piel de la cubierta sigue fría aunque la casa no lo esté. ' +
          (c.revelacion ? 'Durante un instante las líneas dejan de resistirse y entiendes un pasaje entero, como si alguien te lo dictara con mucha calma.' :
            c.retroceso ? 'Y algo sale mal: ' + c.retroceso + '. Cierras el libro con las manos temblando.' :
              'Avanzas poco. La notación no es escritura: es un plano de algo.') +
          ' Legibilidad actual: ' + s.codice.leg + '%.';
      case 'conversacion':
        return 'Hablas con ' + c.npc + '. ' +
          (c.resultado === 'critico' ? 'La conversación va mejor de lo que esperabas y se le escapa más de lo que pretendía.' :
            c.resultado === 'exito' ? 'Te escucha y te responde sin reservas excesivas.' :
              c.resultado === 'parcial' ? 'Contesta a medias, midiendo las palabras.' :
                'La cosa se tensa; algo que has dicho le ha sonado mal, y lo recordará.') +
          (c.secreto ? ' Y entre lo dicho cae una pieza importante: ' + c.secreto : '') +
          (c.info && c.info.length ? ' Lo que oyes: ' + c.info.join(' ') : '');
      case 'practica':
        return 'Practicas ' + c.disciplina + ' durante ' + c.horas + ' horas, con la sal trazada y el pulso lo más quieto que puedes. ' +
          (r.mec.join(' ').indexOf('Retroceso') >= 0 ? 'El tejido se te vuelve en contra y lo pagas con el cuerpo.' : 'Algo mejora: poco, medible, tuyo.') +
          (c.afinidad ? ' Y descubres algo de ti: tu afinidad con ' + c.afinidad.escuela + ' es ' + c.afinidad.nivel + '.' : '');
      case 'entrenamiento':
        return 'Dedicas ' + c.horas + ' horas a entrenar ' + c.stat + '. Nadie te mira, nadie te corrige, y esa es la mitad del problema.';
      case 'descanso':
        return (c.dormir ? 'Duermes ' + c.horas + ' horas.' : 'Descansas ' + c.horas + ' horas sin dormir del todo.') +
          (c.sueño ? ' Sueñas con ' + c.sueño + '.' : '') +
          (c.encuentro ? ' Algo te despierta antes de tiempo.' : '');
      case 'trabajo':
        return 'Trabajas en ' + c.lugar + ' ' + c.horas + ' horas por lo que pagan, que no es mucho.';
      case 'hechizo':
        return 'Tejes ' + c.hechizo + (c.objetivo ? ' sobre ' + c.objetivo : '') + '. ' +
          (c.resultado === 'critico' ? 'Sale limpio, casi fácil, y eso te inquieta más que un fallo.' :
            c.resultado === 'exito' ? 'Funciona.' :
              c.resultado === 'parcial' ? 'Funciona a medias y se deshace antes de tiempo.' :
                c.retroceso ? 'El tejido se cierra sobre ti y te muerde.' : 'No cuaja.') +
          (c.lectura ? ' Lo que percibes: ' + c.lectura : '');
      case 'crear_hechizo':
        return c.hechizo ? 'Tras horas de pruebas y tiza gastada, "' + c.hechizo.n + '" existe. Es tuya: nadie la ha escrito antes, y nadie va a corregirte si está mal.' :
          'El diseño no cierra. Lo que tienes son notas, agujeros y la certeza de que falta un principio que aún no conoces.';
      case 'crear_criatura':
        return c.criatura ? 'Cosas, encajas, sellas con sal. Cuando el núcleo prende, ' + c.criatura.n + ' se mueve por primera vez: ' + (c.criatura.int > 40 ? 'y te mira, que es distinto de obedecer.' : 'sin voluntad propia, como una herramienta bien hecha.') :
          'La construcción falla. Lo que queda en la mesa ya no sirve para nada.';
      case 'orden':
        return 'Le das la orden a ' + c.criatura + ': «' + c.orden + '». ' + (r.mec.join(' ').indexOf('obedece.') >= 0 ? 'Obedece.' : 'No del todo.');
      case 'evolucion':
        return 'Abres a ' + c.criatura + ' y reescribes parte de lo que es. Es una operación larga y no hay anestesia para lo que no siente.';
      case 'investigacion_inicio':
        return 'Abres una línea de trabajo nueva: "' + c.n + '". Primera página, fecha, hipótesis. El resultado no está prometido.';
      case 'investigacion':
        return 'Trabajas en "' + c.n + '": mediciones, repeticiones, notas al margen. ' +
          (c.completada ? 'Y hoy llegas al final del cuaderno.' : 'Queda camino.');
      case 'combate_inicio':
        return 'No hay tiempo para preparar nada. ' + (c.enemigos || []).join(' y ') + ' delante, y tú con lo que llevas encima.';
      case 'combate':
        return (c.acciones || []).map(function (a) { return a.quien + ' ' + a.txt + '.'; }).join(' ') || 'La ronda pasa sin que nadie acierte.';
      case 'combate_fin':
        return 'Se termina. Respiras, cuentas lo que te queda y mides lo que te ha costado.';
      case 'muerte':
        return c.recuperado ? 'Te desplomas, y algo que preparaste antes se consume para traerte de vuelta. Funciona una sola vez.' :
          'Y aquí se acaba. El mundo sigue: los reinos cobran impuestos, el Priorato archiva su expediente, y nadie escribe tu nombre.';
      case 'prueba_rango':
        return 'Te sometes a la prueba. ' + (c.prueba ? c.prueba.desc + ' ' : '') + 'No hay público: estas cosas no se hacen con testigos.';
      case 'fundar_org':
        return 'Lo decís en voz baja, en un sitio sin ventanas: ' + c.org.n + ' existe desde hoy. Sois pocos y eso es una ventaja mientras dure.';
      case 'fundar_ciudad':
        return 'Se clavan las primeras estacas de ' + c.ciudad.n + '. Un asentamiento no es una ciudad: es una apuesta con hambre.';
      case 'compra': return 'Pagas ' + c.precio + ' por ' + c.item + '.';
      case 'venta': return 'Te desprendes de ' + c.item + '.';
      case 'espera': return 'Dejas pasar ' + c.horas + ' horas. El mundo no te espera: sigue.';
      default:
        return (r.mec && r.mec.length ? r.mec.join(' ') : 'El tiempo pasa en ' + loc.n + '.');
    }
  }

  /* ───────── Ejecutar una acción del motor ───────── */
  function ejecutar(fn) {
    if (UI.narrando) { toast('Espera a que termine la narración.'); return; }
    var s = S();
    if (s.pc.muerto) { toast('Maikel está muerto. Carga un guardado o empieza de nuevo.'); return; }
    var r;
    try { r = fn(); } catch (err) { toast('Error del motor: ' + err.message); console.error(err); return; }
    if (!r) return;
    renderChips(); UI.renderPanel(); guardarLocal();
    var prose = entrada(r);
    narrar(prose, r);
    // El motor puede haber abierto un combate
    if (r.ctx && r.ctx.encuentro && !S().combate) {
      var enc = r.ctx.encuentro;
      var r2 = A.iniciarCombate({ id: enc.id, cant: enc.cant, n: enc.n, nv: enc.nv });
      renderChips(); UI.renderPanel();
      entrada(r2, { abierto: false });
    }
    if (S().pc.muerto) {
      var fin = { ok: true, titulo: 'Fin de la crónica', mec: ['Maikel ha muerto. El mundo continúa.'], ctx: { tipo: 'muerte' }, cambios: [] };
      entrada(fin);
    }
    window.TS.UI.ultimo = r;
    return r;
  }
  UI.renderPanel = function () {};  // lo sustituye el módulo de fichas
  UI.ejecutar = ejecutar;
  UI.narrarLocal = narrarLocal;
  UI.renderChips = renderChips;
  UI.entrada = entrada;
  UI.toast = toast;
  UI.$ = $; UI.el = el; UI.esc = esc; UI.parr = parr; UI.scrollFin = scrollFin;
  UI.guardarLocal = guardarLocal; UI.cargarLocal = cargarLocal;
  UI.narrar = narrar; UI.digest = digest; UI.REGLAS = REGLAS;
  UI.cajaCombate = cajaCombate;
})();

/* ═════════ Comandos, lenguaje natural, modales e inicio ═════════ */
(function () {
  var W = window.TS.W, E = window.TS.E, A = E.A, UI = window.TS.UI;
  var $ = UI.$, el = UI.el, esc = UI.esc, toast = UI.toast;
  function S() { return E.getS(); }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }

  /* ── Modales ── */
  function modal(titulo, lead, cuerpo, acciones) {
    var scrim = el('div', 'scrim');
    var m = el('div', 'modal');
    m.appendChild(el('h2', null, titulo));
    if (lead) m.appendChild(el('p', 'lead', lead));
    if (typeof cuerpo === 'string') { var d = el('div'); d.innerHTML = cuerpo; m.appendChild(d); }
    else m.appendChild(cuerpo);
    var row = el('div', 'mrow');
    (acciones || []).forEach(function (a) {
      var b = el('button', 'btn' + (a.pri ? ' pri' : ''), a.t);
      b.onclick = function () { if (a.fn && a.fn(m) === false) return; cerrar(); };
      row.appendChild(b);
    });
    var cx = el('button', 'btn', 'Cerrar');
    cx.onclick = cerrar; row.appendChild(cx);
    m.appendChild(row);
    scrim.appendChild(m);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) cerrar(); });
    $('modal-root').appendChild(scrim);
    function cerrar() { scrim.remove(); }
    UI.cerrarModal = cerrar;
    return { m: m, cerrar: cerrar };
  }
  UI.modal = modal;

  function campo(label, inner) {
    var f = el('div', 'field');
    f.appendChild(el('label', null, label));
    f.appendChild(inner);
    return f;
  }
  function sel(opts, val) {
    var s = el('select');
    opts.forEach(function (o) {
      var op = el('option', null, o.t); op.value = o.v;
      if (o.v === val) op.selected = true;
      s.appendChild(op);
    });
    return s;
  }
  function inp(ph, val, tipo) { var i = el('input'); i.type = tipo || 'text'; i.placeholder = ph || ''; if (val != null) i.value = val; return i; }

  /* ── Modal: crear hechizo ── */
  function modalHechizo() {
    var s = S();
    var cuerpo = el('div');
    var nombre = inp('p. ej. Mano de Hueso Menor');
    var efecto = sel(W.efectos.map(function (e) { return { v: e.id, t: e.n + ' — ' + e.desc }; }), 'animar');
    var escala = sel(W.escalas.map(function (e) { return { v: e.id, t: e.id + ' · ' + e.n + ' (' + e.desc + ')' }; }), 2);
    var alcance = sel(Object.keys(E.ALCANCES).map(function (k) { return { v: k, t: E.ALCANCES[k].n }; }), 'tacto');
    var duracion = sel(Object.keys(E.DURACIONES).map(function (k) { return { v: k, t: E.DURACIONES[k].n }; }), 'instant');
    var rama = sel([{ v: '', t: '— ninguna —' }].concat(W.ramas.map(function (r) { return { v: r.id, t: r.n + ' (dominio ' + E.dom(r.id) + ')' }; })), 'invo_nm');
    var desc = el('textarea'); desc.placeholder = 'Qué quieres que haga exactamente (opcional, para la ficha y la narración).';
    var escBox = el('div', 'chkgrid');
    var escuelasOrden = W.escuelas.slice().sort(function (a, b) { return (E.dom(b.id) - E.dom(a.id)) || a.n.localeCompare(b.n); });
    escuelasOrden.forEach(function (e) {
      if (e.oculta && !s.conoc.esc[e.id] && E.dom(e.id) <= 0) return;
      var lab = el('label');
      var cb = el('input'); cb.type = 'checkbox'; cb.value = e.id;
      if (e.id === 'nigro') cb.checked = true;
      lab.appendChild(cb);
      lab.appendChild(el('span', null, e.n + ' (' + E.dom(e.id) + ')'));
      escBox.appendChild(lab);
    });
    var readout = el('div', 'readout');
    cuerpo.appendChild(campo('Nombre de la técnica', nombre));
    cuerpo.appendChild(campo('Efecto base', efecto));
    cuerpo.appendChild(campo('Escuelas implicadas (combinarlas es más difícil)', escBox));
    cuerpo.appendChild(campo('Rama de nigromancia asociada', rama));
    cuerpo.appendChild(campo('Escala', escala));
    var fila = el('div'); fila.style.display = 'grid'; fila.style.gridTemplateColumns = '1fr 1fr'; fila.style.gap = '10px';
    fila.appendChild(campo('Alcance', alcance)); fila.appendChild(campo('Duración', duracion));
    cuerpo.appendChild(fila);
    cuerpo.appendChild(campo('Descripción del efecto deseado', desc));
    cuerpo.appendChild(readout);

    function leerSpec() {
      var escs = [].slice.call(escBox.querySelectorAll('input:checked')).map(function (x) { return x.value; });
      return {
        nombre: nombre.value.trim(), efecto: efecto.value, escuelas: escs.length ? escs : ['nigro'],
        escala: +escala.value, alcance: alcance.value, duracion: duracion.value,
        rama: rama.value || null, desc: desc.value.trim()
      };
    }
    function actualizar() {
      var ev = E.evaluarHechizo(leerSpec());
      if (ev.error) { readout.innerHTML = '<span class="bad">' + esc(ev.error) + '</span>'; return; }
      var L = [];
      L.push('Dificultad del diseño: <b>' + ev.dif + '</b> · dominio necesario ≈ <b>' + ev.reqDom + '</b> · tu dominio relevante: <b class="' + (ev.domRel >= ev.reqDom ? 'ok' : 'warn') + '">' + ev.domRel + '</b>');
      L.push('Coste estimado: <b>' + ev.coste + '</b> de maná · potencia <b>' + ev.pot + '</b> · tiempo de diseño <b>' + ev.horas + ' h</b>');
      L.push('Materiales: ' + (ev.materiales.length ? ev.materiales.map(function (m) {
        var falta = (S().comp[m.c] || 0) < m.q;
        return '<span class="' + (falta ? 'bad' : 'ok') + '">' + esc(E.compDef(m.c).n) + ' ×' + m.q + '</span>';
      }).join(', ') : 'ninguno'));
      if (ev.riesgos.length) L.push('<span class="warn">Riesgos: ' + ev.riesgos.map(esc).join(' · ') + '</span>');
      L.push(ev.viable ? '<span class="ok">Viable: puedes intentarlo (el resultado no está garantizado).</span>'
        : '<span class="bad">Fuera de tu alcance: baja la escala, el alcance o la duración, o sube dominio antes.</span>');
      readout.innerHTML = L.join('<br>');
    }
    [nombre, efecto, escala, alcance, duracion, rama].forEach(function (x) { x.addEventListener('input', actualizar); });
    escBox.addEventListener('change', actualizar);
    actualizar();
    modal('Diseñar una técnica propia', 'Nada de listas cerradas: defines el efecto y el motor calcula si es posible, qué cuesta y qué puede salir mal.', cuerpo, [
      { t: 'Intentar el diseño', pri: true, fn: function () {
          var spec = leerSpec();
          if (!spec.nombre) { toast('Ponle nombre.'); return false; }
          UI.ejecutar(function () { return A.crearHechizo(spec); });
        } }
    ]);
  }

  /* ── Modal: crear criatura ── */
  function modalCriatura() {
    var s = S();
    var cuerpo = el('div');
    var nombre = inp('p. ej. Costura');
    var especie = inp('p. ej. Esqueleto de osario reforzado');
    var funcion = inp('p. ej. cargar peso y vigilar la puerta');
    var pers = inp('p. ej. silenciosa, obsesiva con el orden');
    var cats = [
      { k: 'armazon', t: 'Armazón (obligatorio): el cuerpo' },
      { k: 'nucleo', t: 'Núcleo (obligatorio): lo que la mueve' },
      { k: 'esencia', t: 'Esencias: carácter y rasgos' },
      { k: 'alma', t: 'Almas: inteligencia (y consecuencias)' },
      { k: 'materiales', t: 'Materiales: refuerzos y detalles' }
    ];
    var inputs = {};
    cuerpo.appendChild(campo('Nombre', nombre));
    cuerpo.appendChild(campo('Especie que declaras', especie));
    cats.forEach(function (c) {
      var box = el('div', 'chkgrid');
      var hay = false;
      W.comp.filter(function (x) { return x.tipo === (c.k === 'materiales' ? 'material' : c.k) || (c.k === 'materiales' && x.tipo === 'reactivo'); })
        .forEach(function (x) {
          var q = s.comp[x.id] || 0;
          if (!q) return;
          hay = true;
          var lab = el('label');
          var n = el('input'); n.type = 'number'; n.min = 0; n.max = q; n.value = 0; n.style.width = '58px';
          n.dataset.comp = x.id;
          lab.appendChild(n);
          lab.appendChild(el('span', null, x.n + ' (tienes ' + q + ')'));
          box.appendChild(lab);
        });
      if (!hay) box.appendChild(el('div', 'empty', 'No tienes componentes de este tipo.'));
      inputs[c.k] = box;
      cuerpo.appendChild(campo(c.t, box));
    });
    cuerpo.appendChild(campo('Función en tu organización o ejército', funcion));
    cuerpo.appendChild(campo('Personalidad deseada (si la inteligencia lo permite)', pers));
    var readout = el('div', 'readout');
    cuerpo.appendChild(readout);

    function leerSpec() {
      var spec = { nombre: nombre.value.trim(), especie: especie.value.trim(), funcion: funcion.value.trim(), personalidad: pers.value.trim() };
      cats.forEach(function (c) {
        spec[c.k] = [].slice.call(inputs[c.k].querySelectorAll('input[type=number]'))
          .filter(function (x) { return +x.value > 0; })
          .map(function (x) { return { c: x.dataset.comp, q: +x.value }; });
      });
      return spec;
    }
    function actualizar() {
      var ev = E.evaluarCriatura(leerSpec());
      if (ev.error) { readout.innerHTML = '<span class="warn">' + esc(ev.error) + '</span>'; return; }
      var L = [];
      L.push('Nivel estimado <b>' + ev.nivel + '</b> (' + ev.rango + ') · vitalidad <b>' + ev.st.vit + '</b> · fuerza <b>' + ev.st.fue + '</b> · velocidad <b>' + ev.st.vel + '</b> · defensa <b>' + ev.st.def + '</b> · maná <b>' + ev.st.man + '</b>');
      L.push('Inteligencia <b>' + ev.int + '</b> (tope del armazón: ' + ev.intCap + ') · lealtad prevista <b>' + ev.lealtad + '</b> · mantenimiento <b>' + ev.mant + '</b> maná/día');
      L.push('Dificultad <b>' + ev.dif + '</b> · dominio necesario ≈ <b>' + ev.reqDom + '</b> · tu Creación de criaturas: <b class="' + (ev.domC >= ev.reqDom ? 'ok' : 'warn') + '">' + ev.domC + '</b> · coste <b>' + ev.costeMana + '</b> maná · <b>' + ev.horas + ' h</b>');
      if (ev.requisitos.length) L.push('<span class="bad">Requisitos: ' + ev.requisitos.map(esc).join(' · ') + '</span>');
      if (ev.riesgos.length) L.push('<span class="warn">Riesgos: ' + ev.riesgos.map(esc).join(' · ') + '</span>');
      L.push(ev.viable ? '<span class="ok">Puedes intentarlo.</span>' : '<span class="bad">Aún no: sube dominio o simplifica el diseño.</span>');
      readout.innerHTML = L.join('<br>');
    }
    cuerpo.addEventListener('input', actualizar);
    actualizar();
    modal('Construir una criatura', 'Elige las piezas. El motor calcula estadísticas, inteligencia, lealtad y mantenimiento a partir de lo que realmente tienes.', cuerpo, [
      { t: 'Construir', pri: true, fn: function () {
          var spec = leerSpec();
          if (!spec.nombre) { toast('Dale un nombre.'); return false; }
          UI.ejecutar(function () { return A.crearCriatura(spec); });
        } }
    ]);
  }

  /* ── Modal: viajar ── */
  function modalViajar() {
    var s = S(), rutas = E.rutasDe(s.pc.loc);
    var c = el('div');
    if (!rutas.length) c.appendChild(el('p', 'empty', 'No conoces rutas desde aquí.'));
    rutas.forEach(function (rt) {
      var l = E.lugar(rt.id);
      var card = el('div', 'card');
      card.appendChild(el('h4', null, l.n));
      card.appendChild(el('div', 'sub', l.tipo + ' · ' + rt.h + ' h de camino · riesgo ' + rt.r + '/100' + (s.locPob && s.locPob[l.id] ? ' · ' + s.locPob[l.id] + ' hab.' : (l.pob ? ' · ' + l.pob + ' hab.' : ''))));
      if (s.flags['visitado_' + l.id]) card.appendChild(el('p', null, l.desc));
      else card.appendChild(el('p', null, 'No has estado nunca. Lo que sabes es de oídas.'));
      var b = el('button', 'btn pri', 'Viajar a ' + l.n);
      b.onclick = function () { UI.cerrarModal(); UI.ejecutar(function () { return A.mover(rt.id); }); };
      card.appendChild(b);
      c.appendChild(card);
    });
    modal('Viajar', 'El tiempo transcurre de verdad: un viaje puede costar horas o días, y el camino tiene riesgos.', c, []);
  }

  /* ── Modal: hablar ── */
  function modalHablar() {
    var s = S(), gente = E.npcsEn(s.pc.loc);
    var c = el('div');
    if (!gente.length) c.appendChild(el('p', 'empty', 'No hay nadie aquí con quien hablar.'));
    gente.forEach(function (g) {
      var card = el('div', 'card');
      card.appendChild(el('h4', null, g.conocido ? g.def.n : 'Alguien desconocido'));
      card.appendChild(el('div', 'sub', g.def.ocu + ' · ' + g.def.edad + ' años · opinión ' + (g.est.op >= 0 ? '+' : '') + g.est.op));
      if (g.conocido) card.appendChild(el('p', null, g.def.pers));
      ['saludar', 'rumores', 'enseñar', 'comerciar', 'secreto'].forEach(function (tema) {
        if (tema === 'enseñar' && !g.def.maestro) return;
        var b = el('button', 'btn' + (tema === 'rumores' ? ' pri' : ''), tema === 'secreto' ? 'tantear' : tema);
        b.onclick = function () { UI.cerrarModal(); UI.ejecutar(function () { return A.hablar(g.id, tema); }); };
        card.appendChild(b);
      });
      c.appendChild(card);
    });
    modal('Hablar', 'Cada conversación deja huella: los NPC recuerdan cómo los has tratado.', c, []);
  }

  /* ── Modal: guardar / cargar / respaldo ── */
  function modalGuardar() {
    var txt = E.guardar();
    var c = el('div');
    c.appendChild(el('p', 'mini', 'Este texto es tu partida completa (' + (txt.length / 1024).toFixed(1) + ' KB). Cópialo y guárdalo donde quieras. La partida también se guarda automáticamente en este navegador tras cada acción.'));
    var ta = el('textarea', 'save-box'); ta.value = txt; ta.readOnly = true;
    c.appendChild(ta);
    modal('Guardar partida', null, c, [
      { t: 'Copiar al portapapeles', pri: true, fn: function () {
          try {
            navigator.clipboard.writeText(txt).then(function () { toast('Guardado copiado.'); }, function () { ta.select(); toast('Selecciónalo y copia con el teclado.'); });
          } catch (e) { ta.select(); toast('Selecciónalo y copia con el teclado.'); }
          return false;
        } },
      { t: 'Descargar archivo', fn: function () { descargar('trono-sepulcral.json', txt); return false; } }
    ]);
  }
  async function descargar(nombre, contenido) {
    try {
      var d = await window.claude.use('downloads');
      if (!d) { toast('Este visor no permite descargas: copia el texto.'); return; }
      await d.save({ filename: nombre, data: contenido });
      toast('Archivo entregado.');
    } catch (e) { toast('No se pudo descargar: copia el texto.'); }
  }
  function modalCargar() {
    var c = el('div');
    c.appendChild(el('p', 'mini', 'Pega aquí un guardado completo (el texto de /guardar).'));
    var ta = el('textarea', 'save-box'); ta.placeholder = '{"juego":"Crónicas del Trono Sepulcral", ...}';
    c.appendChild(ta);
    modal('Cargar partida', null, c, [
      { t: 'Cargar', pri: true, fn: function () {
          var r = E.cargar(ta.value);
          if (!r.ok) { toast(r.msg); return false; }
          UI.guardarLocal();
          $('cron-inner').innerHTML = '';
          UI.renderChips(); UI.renderPanel();
          UI.entrada({ ok: true, titulo: 'Partida cargada', mec: [r.msg], cambios: [], ctx: { tipo: 'carga' } }, { sinTitulo: false });
          toast(r.msg);
        } }
    ]);
  }
  function bloqueTexto(titulo, txt) {
    var pros = UI.entrada({ ok: true, titulo: titulo, mec: [], cambios: [], ctx: { tipo: 'documento' } }, { sinTitulo: false });
    var pre = el('pre'); pre.style.fontFamily = 'var(--f-mono)'; pre.style.fontSize = '11.5px';
    pre.style.whiteSpace = 'pre-wrap'; pre.style.color = 'var(--bone2)'; pre.style.margin = '0';
    pre.textContent = txt;
    pros.innerHTML = ''; pros.appendChild(pre);
  }

  function modalAyuda() {
    var c = el('div');
    c.innerHTML =
      '<h3 class="sec">Cómo se juega</h3>' +
      '<p class="mini">Escribe lo que hace Maikel en lenguaje natural («bajo al sótano y examino el muro», «practico nigromancia cuatro horas», «hablo con Odolan del expediente»). El motor decide con tiradas visibles; Claude solo narra lo que el motor ya ha resuelto, así que nadie te regala poder.</p>' +
      '<h3 class="sec">Comandos</h3>' +
      '<p class="mini">' + [
        '/estado', '/personaje', '/atributos', '/magia', '/grimorio', '/crear-hechizo', '/investigar', '/invocaciones',
        '/criaturas', '/evolucionar', '/npc', '/organizacion', '/ciudad', '/reinos', '/poblacion', '/economia',
        '/inventario', '/mapa', '/misiones', '/historial', '/guardar', '/cargar', '/resumen', '/respaldo',
        '/auditoria', '/reglas', '/ayuda'
      ].map(function (x) { return '<span class="pill">' + x + '</span>'; }).join(' ') + '</p>' +
      '<h3 class="sec">Lo que el motor controla de verdad</h3>' +
      '<ul class="lista">' +
      '<li>Calendario propio (12 meses de 30 días, 6 días por semana), estaciones, Marea de Maná, espesor del Velo, dos lunas y festividades.</li>' +
      '<li>Tiradas d100 con cinco grados de resultado. Los modificadores pesan la mitad: las estadísticas ayudan, no deciden.</li>' +
      '<li>16 potencias políticas con población, tesorería, estabilidad, ejército, guerras y metas propias; 12 organizaciones; NPC que viajan, envejecen, prosperan y mueren sin ti.</li>' +
      '<li>Diseño libre de hechizos y construcción de criaturas pieza a pieza, con dificultad, materiales, coste y riesgo calculados.</li>' +
      '<li>Investigación con progreso por horas y resultado no garantizado (nulo, parcial, inesperado).</li>' +
      '<li>Dificultad extrema: puedes fracasar, perderlo todo y morir. La muerte es definitiva salvo que hayas preparado un ancla.</li>' +
      '</ul>' +
      '<h3 class="sec">Narración</h3>' +
      '<p class="mini">Si tu visor permite usar Claude, la prosa la escribe Claude con el resultado del motor como camisa de fuerza. Si no, narra el propio motor y el juego funciona igual.</p>';
    var row = el('div');
    var t1 = el('button', 'btn', 'Prosa: ' + (UI.prosa === 'quick' ? 'rápida' : 'cuidada'));
    t1.onclick = function () { UI.prosa = UI.prosa === 'quick' ? 'default' : 'quick'; t1.textContent = 'Prosa: ' + (UI.prosa === 'quick' ? 'rápida' : 'cuidada'); UI.renderChips(); };
    var t2 = el('button', 'btn', 'Narrador: ' + (UI.narrarOn ? 'Claude' : 'motor'));
    t2.onclick = function () { UI.narrarOn = !UI.narrarOn; t2.textContent = 'Narrador: ' + (UI.narrarOn ? 'Claude' : 'motor'); UI.renderChips(); };
    var t3 = el('button', 'btn dgr', 'Empezar crónica nueva');
    t3.onclick = function () {
      UI.cerrarModal();
      modal('Empezar de cero', 'Se borrará la partida guardada en este navegador. Esto no se puede deshacer.', el('div'), [
        { t: 'Borrar y empezar', pri: true, fn: function () { nuevaPartidaUI(true); } }
      ]);
    };
    row.appendChild(t1); row.appendChild(t2); row.appendChild(t3);
    c.appendChild(row);
    modal('Crónicas del Trono Sepulcral', 'Un RPG de fantasía oscura con motor de simulación propio.', c, []);
  }

  /* ── Navegación de fichas ── */
  function navegar(tab) {
    UI.tab = tab;
    if (window.innerWidth <= 920) $('panel').hidden = false;
    else $('panel').hidden = false;
    UI.renderPanel();
  }
  UI.navegar = navegar;

  /* ── Comandos ── */
  var TABS = {
    estado: 'estado', personaje: 'personaje', atributos: 'atributos', magia: 'magia', grimorio: 'grimorio',
    invocaciones: 'criaturas', criaturas: 'criaturas', investigar: 'investigacion', npc: 'npc',
    organizacion: 'organizacion', ciudad: 'ciudad', reinos: 'mundo', poblacion: 'mundo', economia: 'economia',
    inventario: 'inventario', mapa: 'mapa', misiones: 'objetivos', reglas: 'reglas', historial: 'historial'
  };

  function comando(txt) {
    var s = S();
    var m = txt.replace(/^\//, '').trim();
    var partes = m.split(/\s+/);
    var cmd = norm(partes[0]).replace('-', '');
    var resto = partes.slice(1).join(' ');
    if (TABS[cmd]) { navegar(TABS[cmd]); toast('Ficha abierta: ' + cmd); return true; }
    if (cmd === 'crearhechizo' || cmd === 'crearhechizos') { modalHechizo(); return true; }
    if (cmd === 'crearcriatura' || cmd === 'construir') { modalCriatura(); return true; }
    if (cmd === 'evolucionar') {
      var crs = s.criaturas.filter(function (c) { return c.estado !== 'destruida'; });
      if (!crs.length) { toast('No tienes criaturas.'); return true; }
      var c0 = el('div');
      crs.forEach(function (cr) {
        var card = el('div', 'card');
        card.appendChild(el('h4', null, cr.n));
        card.appendChild(el('div', 'sub', cr.esp + ' · nivel ' + cr.nivel + ' · inteligencia ' + cr.int + ' · lealtad ' + cr.lealtad));
        ['armazón', 'elemento', 'inteligencia'].forEach(function (via) {
          var b = el('button', 'btn', 'Evolucionar: ' + via);
          b.onclick = function () { UI.cerrarModal(); UI.ejecutar(function () { return A.evolucionar(cr.uid, via === 'armazón' ? 'armazon' : via); }); };
          card.appendChild(b);
        });
        c0.appendChild(card);
      });
      modal('Evolucionar criatura', 'Reescribir una criatura viva es más difícil que construirla. Consume materiales y puede destruirla.', c0, []);
      return true;
    }
    if (cmd === 'guardar') { modalGuardar(); return true; }
    if (cmd === 'cargar') { modalCargar(); return true; }
    if (cmd === 'respaldo') { bloqueTexto('Respaldo compacto', E.respaldo()); return true; }
    if (cmd === 'resumen') { bloqueTexto('Resumen de la crónica', resumenTexto()); return true; }
    if (cmd === 'auditoria') {
      var a = E.auditoria();
      bloqueTexto('Auditoría de coherencia', a.lineas.join('\n') + (a.avisos.length ? '\n\nCorregido:\n- ' + a.avisos.join('\n- ') : ''));
      UI.renderChips(); UI.renderPanel();
      return true;
    }
    if (cmd === 'ayuda') { modalAyuda(); return true; }
    if (cmd === 'viajar') { modalViajar(); return true; }
    if (cmd === 'hablar') { modalHablar(); return true; }
    if (cmd === 'prueba' || cmd === 'pruebarango') { UI.ejecutar(function () { return A.pruebaRango(); }); return true; }
    return false;
  }

  function resumenTexto() {
    var s = S(), L = [];
    L.push('Maikel · ' + s.pc.edad + ' años · nivel ' + s.pc.nivel + ' (' + E.rango().n + ') · ' + E.fechaTxt() + ', ' + E.horaTxt(s.fecha));
    L.push('Lugar: ' + E.lugar(s.pc.loc).n + ' · ' + s.pc.cond);
    L.push('');
    L.push('LO QUE HA HECHO (últimos 18 registros):');
    s.log.slice(-18).forEach(function (l) {
      L.push('  ' + l.f.d + '/' + l.f.m + '/' + l.f.a + ' · ' + l.txt + (l.c && l.c.length ? ' [' + l.c.slice(0, 3).map(function (c) { return c.el + ': ' + c.a + '→' + c.b; }).join('; ') + ']' : ''));
    });
    L.push('');
    L.push('LO QUE SABE DEL MUNDO:');
    var vistos = s.sucesos.filter(function (e) { return e.visto; }).slice(-10);
    vistos.forEach(function (e) { L.push('  · ' + e.t + ': ' + e.txt); });
    L.push('');
    L.push('OBJETIVOS PROPIOS: ' + (s.objetivos.map(function (o) { return o.t + ' (' + o.estado + ')'; }).join(' | ') || 'ninguno declarado'));
    return L.join('\n');
  }

  /* ── Lenguaje natural: intérprete local ── */
  function buscarLugar(t) {
    var n = norm(t), mejor = null;
    E.rutasDe(S().pc.loc).forEach(function (r) {
      var l = E.lugar(r.id);
      if (n.indexOf(norm(l.n)) >= 0 || norm(l.n).indexOf(n) >= 0) mejor = r.id;
    });
    return mejor;
  }
  function buscarNpc(t) {
    var n = norm(t), mejor = null;
    E.npcsEn(S().pc.loc).forEach(function (g) {
      var nm = norm(g.def.n);
      if (n.indexOf(nm.split(' ')[0]) >= 0 || n.indexOf(nm) >= 0) mejor = g.id;
    });
    return mejor;
  }
  function buscarDisciplina(t) {
    var n = norm(t), mejor = null;
    W.escuelas.concat(W.ramas).forEach(function (x) {
      if (n.indexOf(norm(x.n)) >= 0) mejor = x.id;
    });
    if (!mejor && /nigroman/.test(n)) mejor = 'nigro';
    return mejor;
  }
  function buscarStat(t) {
    var n = norm(t), mejor = null;
    W.stats.forEach(function (x) { if (n.indexOf(norm(x.n)) >= 0) mejor = x.id; });
    if (!mejor && /fisic|cuerpo|musculo/.test(n)) mejor = 'fue';
    if (!mejor && /mente|estudi|leer libros/.test(n)) mejor = 'int';
    return mejor;
  }
  function buscarHechizo(t) {
    var n = norm(t), mejor = null;
    S().hechizos.forEach(function (h) { if (n.indexOf(norm(h.n)) >= 0 || norm(h.n).indexOf(n) >= 0) mejor = h.id; });
    if (!mejor && /rescoldo/.test(n)) mejor = 'rescoldo_palido';
    return mejor;
  }
  function horasDe(t, def) {
    var m = norm(t).match(/(\d+(?:[.,]\d+)?)\s*(h|hora|horas|dia|dias|jornada|jornadas|semana|semanas|mes|meses)?/);
    if (!m) return def;
    var v = parseFloat(m[1].replace(',', '.'));
    var u = m[2] || 'hora';
    if (/dia|jornada/.test(u)) return v * 24;
    if (/semana/.test(u)) return v * 24 * 6;
    if (/mes/.test(u)) return v * 24 * 30;
    return v;
  }

  function parseLocal(txt) {
    var n = norm(txt), s = S();
    if (s.combate) {
      if (/^(atac|golpe|peg|acuchill|apuñal)/.test(n)) {
        var vivos = s.combate.enemigos.filter(function (e) { return e.estado === 'activo'; });
        var obj = vivos[0];
        vivos.forEach(function (e) { if (n.indexOf(norm(e.n)) >= 0) obj = e; });
        return function () { return A.combateAccion({ tipo: 'atacar', objetivo: obj && obj.uid }); };
      }
      if (/^(huy|escap|corr|retir)/.test(n)) return function () { return A.combateAccion({ tipo: 'huir' }); };
      if (/^(defend|cubr|parar|esquiv)/.test(n)) return function () { return A.combateAccion({ tipo: 'defender' }); };
      if (/(lanz|uso|invoc|teje)/.test(n)) {
        var hid = buscarHechizo(n);
        if (hid) return function () { return A.combateAccion({ tipo: 'hechizo', hechizo: hid }); };
      }
    }
    if (/(estudi|le[eo]|lectur|descifr|traduc).*(codice|códice|grimorio|libro|mortaja)/.test(n) || /^(estudiar|leer) *$/.test(n))
      return function () { return A.estudiarCodice(horasDe(n, 3)); };
    if (/(practic|entren).*(nigroman|magia|hechic|escuela|rama|invocaci|control|almas|sombra|hielo|fuego|sello|maldic)/.test(n) || /^practic/.test(n)) {
      var d = buscarDisciplina(n) || 'nigro';
      return function () { return A.practicar(d, horasDe(n, 3)); };
    }
    if (/^(entren|ejercit|fortalec)/.test(n)) {
      var st = buscarStat(n) || 'fue';
      return function () { return A.entrenar(st, horasDe(n, 2)); };
    }
    if (/(viaj|voy|ir a|camin|march|dirij|parto|regres|vuelv)/.test(n)) {
      var lid = buscarLugar(n);
      if (lid) return function () { return A.mover(lid); };
      modalViajar(); return 'modal';
    }
    if (/(explor|registr|inspeccion|examin|recorr|busco por|rebusc)/.test(n)) return function () { return A.explorar(); };
    if (/(recolect|recoj|recog|junt|extraig|saqu).*(hueso|material|component|sal|resto|hierba)/.test(n) || /^recolect/.test(n))
      return function () { return A.recolectar(); };
    if (/(hablo|habl|pregunt|convers|saludo|cuento|interrog|tante)/.test(n)) {
      var npc = buscarNpc(n);
      var tema = /rumor|noticia|que se dice|qué se dice/.test(n) ? 'rumores' :
        /enseñ|aprend|lecci|maestr/.test(n) ? 'enseñar' :
          /compr|vend|precio|negoci/.test(n) ? 'comerciar' :
            /secret|expedient|verdad|oculta/.test(n) ? 'secreto' : 'saludar';
      if (npc) return function () { return A.hablar(npc, tema); };
      modalHablar(); return 'modal';
    }
    if (/(duerm|dorm|acuest|descans|siest|recuper)/.test(n)) {
      var dormir = /duerm|dorm|acuest/.test(n);
      return function () { return A.descansar(horasDe(n, dormir ? 7 : 2), dormir); };
    }
    if (/(trabaj|jornal|gano dinero|cobro|turno)/.test(n)) return function () { return A.trabajar(horasDe(n, 6)); };
    if (/(lanz|uso el hechizo|teje|invoc|conjur|pruebo).*(rescoldo|hechizo|tecnica|técnica)/.test(n) || /^(lanz|conjur|teje)/.test(n)) {
      var h2 = buscarHechizo(n);
      if (h2) {
        var objtxt = txt.replace(/.*(sobre|en|contra|a)\s+/i, '');
        return function () { return A.lanzar(h2, objtxt !== txt ? objtxt : null); };
      }
    }
    if (/(crear|diseñ|invent).*(hechizo|tecnica|técnica|conjuro)/.test(n)) { modalHechizo(); return 'modal'; }
    if (/(crear|construir|constru|fabric|cos|ensambl|levant).*(criatura|esqueleto|golem|gólem|guardian|guardián|bestia|servidor|no-muerto)/.test(n)) { modalCriatura(); return 'modal'; }
    if (/(investig|estudio cientifico|experiment)/.test(n)) {
      var disp = E.investigacionesDisponibles();
      var act = s.proyectos.filter(function (p) { return p.estado === 'activo'; });
      var encontrado = null;
      act.forEach(function (p) { if (n.indexOf(norm(p.n).slice(0, 12)) >= 0) encontrado = p.id; });
      if (encontrado) return function () { return A.investigarTrabajar(encontrado, horasDe(n, 6)); };
      if (act.length === 1 && /(sig|continu|trabaj|avanz)/.test(n)) return function () { return A.investigarTrabajar(act[0].id, horasDe(n, 6)); };
      var nuevo = null;
      disp.forEach(function (d) { if (d.disponible && n.indexOf(norm(d.def.n).slice(0, 14)) >= 0) nuevo = d.def.id; });
      if (nuevo) return function () { return A.investigarIniciar(nuevo); };
      navegar('investigacion');
      toast('Elige una línea de investigación en la ficha.');
      return 'modal';
    }
    if (/(ordeno|orden|mando|dile|que vigile|que ataque|que busque)/.test(n)) {
      var cr = null;
      s.criaturas.forEach(function (c) { if (c.estado === 'activa' && n.indexOf(norm(c.n)) >= 0) cr = c; });
      if (!cr) { var act2 = s.criaturas.filter(function (c) { return c.estado === 'activa'; }); cr = act2[0]; }
      if (cr) return function () { return A.ordenar(cr.uid, txt); };
    }
    if (/(espero|esper|dejo pasar|paso el tiempo|aguard)/.test(n)) return function () { return A.esperar(horasDe(n, 1)); };
    if (/(compro|comprar)/.test(n)) {
      var it = null;
      W.objetos.concat(W.comp).forEach(function (o) { if (n.indexOf(norm(o.n).split(' ')[0]) >= 0) it = o.id; });
      if (it) return function () { return A.comprar(it, 1); };
    }
    if (/(vendo|vender)/.test(n)) {
      var it2 = null;
      Object.keys(s.inv).concat(Object.keys(s.comp)).forEach(function (k) {
        var d = E.objDef(k) || E.compDef(k);
        if (d && n.indexOf(norm(d.n).split(' ')[0]) >= 0) it2 = k;
      });
      if (it2) return function () { return A.vender(it2, 1); };
    }
    if (/(fundo|fundar|creo una organizacion|creo la secta|monto)/.test(n) && /(organizacion|secta|circulo|círculo|orden|gremio|culto)/.test(n)) {
      var nombre = txt.replace(/.*(llamad[ao]|llamar[ée]|nombre)\s*/i, '');
      modalOrg(nombre !== txt ? nombre : '');
      return 'modal';
    }
    if (/(prueba de rango|ascender de rango|superar la prueba)/.test(n)) return function () { return A.pruebaRango(); };
    return null;
  }

  function modalOrg(nombre) {
    var c = el('div');
    var n1 = inp('Nombre de la organización', nombre || '');
    var t1 = inp('Círculo clandestino, orden, gremio, secta…', 'Círculo clandestino');
    var i1 = el('textarea'); i1.placeholder = 'Ideología o propósito declarado.';
    var r1 = inp('Rangos separados por comas', 'Iniciado, Mano, Voz, Heredero');
    c.appendChild(campo('Nombre', n1)); c.appendChild(campo('Tipo', t1));
    c.appendChild(campo('Ideología', i1)); c.appendChild(campo('Jerarquía', r1));
    c.appendChild(el('p', 'mini', 'Requisitos: al menos dos apoyos (criaturas activas o personas con opinión ≥ 45) y 5 mp para los primeros gastos.'));
    modal('Fundar una organización', 'Empieza pequeña y clandestina. Crecer tiene costes mensuales y gente con ambiciones propias.', c, [
      { t: 'Fundar', pri: true, fn: function () {
          UI.ejecutar(function () {
            return A.fundarOrg({ n: n1.value.trim(), tipo: t1.value.trim(), ideologia: i1.value.trim(), rangos: r1.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean) });
          });
        } }
    ]);
  }
  UI.modalOrg = modalOrg; UI.resumenTexto = resumenTexto;
  UI.modalHechizo = modalHechizo; UI.modalCriatura = modalCriatura;
  UI.modalViajar = modalViajar; UI.modalHablar = modalHablar;
  UI.modalGuardar = modalGuardar; UI.modalCargar = modalCargar; UI.modalAyuda = modalAyuda;
  UI.bloqueTexto = bloqueTexto;

  /* ── Intérprete con Claude cuando el local no entiende ── */
  var ACCIONES_IA = ['mover', 'explorar', 'recolectar', 'hablar', 'estudiar_codice', 'entrenar', 'practicar',
    'descansar', 'dormir', 'trabajar', 'lanzar', 'investigar_trabajar', 'investigar_iniciar', 'investigar_libre',
    'ordenar', 'crear_hechizo', 'crear_criatura', 'esperar', 'prueba_rango', 'nada'];

  async function interpretarIA(txt) {
    var s = S();
    var opciones = {
      lugares: E.rutasDe(s.pc.loc).map(function (r) { return r.id + '=' + E.lugar(r.id).n; }),
      personas: E.npcsEn(s.pc.loc).map(function (g) { return g.id + '=' + g.def.n; }),
      hechizos: s.hechizos.map(function (h) { return h.id + '=' + h.n; }),
      disciplinas: ['nigro=Nigromancia'].concat(W.ramas.filter(function (r) { return E.dom('nigro') >= r.req; }).map(function (r) { return r.id + '=' + r.n; })),
      estadisticas: W.stats.map(function (x) { return x.id + '=' + x.n; }),
      criaturas: s.criaturas.filter(function (c) { return c.estado !== 'destruida'; }).map(function (c) { return c.uid + '=' + c.n; }),
      investigaciones_activas: s.proyectos.filter(function (p) { return p.estado === 'activo'; }).map(function (p) { return p.id + '=' + p.n; }),
      investigaciones_disponibles: E.investigacionesDisponibles().filter(function (d) { return d.disponible; }).map(function (d) { return d.def.id + '=' + d.def.n; })
    };
    var prompt = 'Eres el intérprete de órdenes de un RPG. Traduce la frase del jugador a UNA acción del motor.\n' +
      'Responde SOLO con un objeto JSON: {"accion": "<una de la lista>", "objetivo": "<id exacto o null>", "horas": <número o null>, "texto": "<texto libre si la acción lo necesita>", "motivo": "<una frase corta en español explicando qué hace Maikel>"}\n' +
      'Acciones válidas: ' + ACCIONES_IA.join(', ') + '. Usa "nada" si la frase no corresponde a ninguna acción ejecutable (por ejemplo si es una pregunta).\n' +
      'IDs disponibles ahora mismo:\n' + JSON.stringify(opciones) + '\n' +
      'Reglas: usa solo IDs de esa lista. "estudiar_codice", "descansar", "dormir", "trabajar", "practicar", "entrenar", "investigar_trabajar" y "esperar" aceptan "horas". ' +
      '"practicar" necesita objetivo de disciplinas; "entrenar" de estadisticas; "mover" de lugares; "hablar" de personas (y en "texto" el tema: saludar, rumores, enseñar, comerciar, secreto); ' +
      '"ordenar" necesita objetivo de criaturas y la orden en "texto"; "investigar_libre" necesita el objetivo de la investigación en "texto".\n' +
      'Frase del jugador: ' + JSON.stringify(txt);
    var j = await UI.sample.json(prompt, { modelTier: 'quick', cache: false });
    return j;
  }

  function ejecutarIA(j, txt) {
    var h = j && j.horas ? +j.horas : null;
    var o = j && j.objetivo ? String(j.objetivo) : null;
    switch (j && j.accion) {
      case 'mover': return function () { return A.mover(o); };
      case 'explorar': return function () { return A.explorar(); };
      case 'recolectar': return function () { return A.recolectar(); };
      case 'hablar': return function () { return A.hablar(o, (j.texto || 'saludar').toLowerCase()); };
      case 'estudiar_codice': return function () { return A.estudiarCodice(h || 3); };
      case 'entrenar': return function () { return A.entrenar(o || 'fue', h || 2); };
      case 'practicar': return function () { return A.practicar(o || 'nigro', h || 3); };
      case 'descansar': return function () { return A.descansar(h || 2, false); };
      case 'dormir': return function () { return A.descansar(h || 7, true); };
      case 'trabajar': return function () { return A.trabajar(h || 6); };
      case 'lanzar': return function () { return A.lanzar(o, j.texto || null); };
      case 'investigar_trabajar': return function () { return A.investigarTrabajar(o, h || 6); };
      case 'investigar_iniciar': return function () { return A.investigarIniciar(o); };
      case 'investigar_libre': return function () { return A.investigarLibre({ objetivo: j.texto || txt, escala: 3 }); };
      case 'ordenar': return function () { return A.ordenar(o, j.texto || txt); };
      case 'esperar': return function () { return A.esperar(h || 1); };
      case 'prueba_rango': return function () { return A.pruebaRango(); };
      case 'crear_hechizo': modalHechizo(); return 'modal';
      case 'crear_criatura': modalCriatura(); return 'modal';
      default: return null;
    }
  }

  async function enviar() {
    var txt = $('cmd').value.trim();
    if (!txt) return;
    if (UI.narrando) { toast('El narrador está escribiendo.'); return; }
    $('cmd').value = '';
    if (txt[0] === '/') {
      if (!comando(txt)) toast('Comando desconocido. Prueba /ayuda.');
      return;
    }
    var fn = parseLocal(txt);
    if (fn === 'modal') return;
    if (fn) { UI.ejecutar(fn); return; }
    // No se ha entendido: que lo interprete Claude
    if (UI.sample) {
      $('send').disabled = true; $('hint').textContent = 'Interpretando lo que quieres hacer…';
      try {
        var j = await interpretarIA(txt);
        var fn2 = ejecutarIA(j, txt);
        if (fn2 === 'modal') { /* abierto */ }
        else if (fn2) UI.ejecutar(fn2);
        else {
          var pros = UI.entrada({ ok: true, titulo: 'El mundo no responde a eso', mec: [j && j.motivo ? 'Interpretación: ' + j.motivo : 'No es una acción ejecutable.'], cambios: [], ctx: { tipo: 'aclaracion' } });
          pros.innerHTML = UI.parr('Eso no es algo que Maikel pueda hacer ahora mismo, o no está claro qué pretende. Prueba a decirlo como una acción concreta: a dónde va, a quién habla, qué estudia, qué construye. Con /ayuda tienes la lista de comandos.');
        }
      } catch (e) {
        toast('No he podido interpretarlo' + (e && e.code ? ' (' + e.code + ')' : '') + '. Di la acción de forma más concreta o usa un comando.');
      }
      $('send').disabled = false; $('hint').textContent = HINT;
      return;
    }
    toast('No he entendido la acción. Usa un botón, un comando (/ayuda) o dilo de forma más concreta.');
  }
  var HINT = 'Lenguaje natural o comandos (/ayuda). El motor decide los resultados; nadie te regala nada.';

  /* ── Botones rápidos ── */
  function renderQuick() {
    var q = $('quick'); q.innerHTML = '';
    var s = S();
    var botones = [
      { t: 'Estudiar el Códice', key: true, fn: function () { UI.ejecutar(function () { return A.estudiarCodice(3); }); } },
      { t: 'Practicar nigromancia', fn: function () { UI.ejecutar(function () { return A.practicar('nigro', 3); }); } },
      { t: 'Recolectar', fn: function () { UI.ejecutar(function () { return A.recolectar(); }); } },
      { t: 'Explorar', fn: function () { UI.ejecutar(function () { return A.explorar(); }); } },
      { t: 'Hablar', fn: modalHablar },
      { t: 'Viajar', fn: modalViajar },
      { t: 'Trabajar', fn: function () { UI.ejecutar(function () { return A.trabajar(6); }); } },
      { t: 'Dormir', fn: function () { UI.ejecutar(function () { return A.descansar(7, true); }); } },
      { t: 'Diseñar técnica', key: true, fn: modalHechizo },
      { t: 'Construir criatura', key: true, fn: modalCriatura },
      { t: 'Investigación', fn: function () { navegar('investigacion'); } },
      { t: 'Estado', fn: function () { navegar('estado'); } }
    ];
    if (s.combate) botones.unshift({ t: '⚔ Atacar', key: true, fn: function () { UI.ejecutar(function () { return A.combateAccion({ tipo: 'atacar' }); }); } });
    if (s.pc.nivel >= E.rango().max && !s.pc.pruebas[E.rango().i]) botones.unshift({ t: 'Prueba de rango', key: true, fn: function () { UI.ejecutar(function () { return A.pruebaRango(); }); } });
    botones.forEach(function (b) {
      var x = el('button', 'qb' + (b.key ? ' key' : ''), b.t);
      x.onclick = b.fn;
      q.appendChild(x);
    });
  }
  UI.renderQuick = renderQuick;

  /* ── Escena inicial ── */
  var INTRO_LOCAL = [
    'Diecinueve de Velonegro. La Noche de las Lámparas terminó hace nueve días y en Vadosombrío todavía huele a sebo quemado: durante una noche entera la villa alumbra a sus muertos, y durante la semana siguiente los hermanos del Priorato de la Llama Sellada bajan a la villa a preguntar quién ha alumbrado demasiado.',
    'Tienes dieciocho años y llevas cuatro trabajando en el osario: lavar, coser, apilar. Odolan Verch, el sepulturero mayor, te enseñó a separar un fémur de un peroné antes de enseñarte a escribir tu nombre, y últimamente tose sangre y no quiere que la boticaria lo mire. Arriba están los cuerpos recientes de tres aldeas sin osario propio. Abajo, dos sótanos de huesos ordenados por décadas con una obsesión que nadie le pidió a nadie.',
    'Hace once días, moviendo un arcón del sótano inferior, encontraste un libro que no estaba en ningún registro: nueve cuadernillos cosidos con hilo de nervio dentro de una cubierta de piel sin curtir que sigue fría aunque la casa no lo esté. Ocho están sellados con mortajas que no son solo tela. El primero está abierto y, aun así, no lo entiendes: Thanel Antiguo mezclado con una notación que no es escritura, sino el plano de algo. De todo el cuadernillo has sacado una técnica a medias y la certeza, difícil de explicar, de que el libro no estaba perdido: estaba esperando.',
    'Nadie te ha nombrado elegido. No tienes maestro, ni dinero, ni permiso. Fuera, la Marca de Grisbrial se está desmoronando despacio: la margravina Renwyn pide a Thornhal una guarnición que Thornhal no tiene, Mornavar ha movido dos mil lanzas al otro lado del río, la Mina Ahogada se derrumbó en la galería cuarta y hay cuatro cuerpos sin sacar, y una niña del Saucedo entró en el Bosque de Vigías Torcidos a por leña y no ha vuelto. Nada de eso te está esperando a ti.',
    'Son casi las once de la noche. Estás en el sótano del osario, con una linterna de aceite al mínimo, el Códice cerrado sobre las rodillas y diecisiete horas antes de que el hermano Breviar Tolm venga a hacer su inspección mensual. El muro del fondo tiene las juntas distintas al resto: alguien tapió algo ahí, y Odolan nunca ha querido saber qué.',
    '¿Qué hace Maikel?'
  ].join('\n\n');

  async function intro() {
    var s = S();
    var pros = UI.entrada({
      ok: true, titulo: 'Vadosombrío, sótano del osario',
      mec: ['Partida iniciada. Dificultad extrema.',
        'Maikel · 18 años · Nigromante · nivel 1 · Aprendiz · 0 XP · dominio de nigromancia 6/100',
        'Vitalidad ' + E.hpMax() + ' · Maná ' + E.manaMax() + ' · Dinero ' + E.dinero() + ' · Códice legible al ' + s.codice.leg + '%',
        'El mundo ya está en marcha: 16 potencias, 12 organizaciones y 22 personas con sus propios planes.'],
      cambios: [], ctx: { tipo: 'intro' }, fecha: s.fecha
    }, { abierto: true });
    pros.innerHTML = UI.parr(INTRO_LOCAL);
    if (UI.sample) {
      // Si Claude está disponible, reescribe la apertura con la misma información
      try {
        UI.narrando = true;
        var prompt = UI.REGLAS + '\n\n=== ESTADO ACTUAL ===\n' + UI.digest() +
          '\n\n=== ESCENA INICIAL ===\nEsta es la apertura de la crónica. Excepcionalmente, escribe 280-380 palabras.' +
          '\nMaterial que debes respetar y usar (no lo contradigas, no añadas poderes ni revelaciones):\n' + INTRO_LOCAL +
          '\n\nDatos extra: hace once días Maikel encontró el Códice en el sótano del osario; no tiene maestro ni dinero; el hermano Breviar Tolm inspecciona el osario mañana por la tarde; el muro del fondo del sótano inferior está tapiado (Maikel lo ha notado, no sabe qué hay).' +
          '\nEscribe la apertura en segunda persona, termina preguntando implícitamente qué hace, y no decidas por él.';
        var res = await UI.sample(prompt, { modelTier: UI.prosa, cache: { gcTime: 600000 }, onText: function (u) { pros.innerHTML = UI.parr(u.text); UI.scrollFin(); } });
        pros.innerHTML = UI.parr(res.text);
      } catch (e) { pros.innerHTML = UI.parr(INTRO_LOCAL); }
      UI.narrando = false;
      UI.renderChips();
    }
  }

  function nuevaPartidaUI(borrar) {
    if (borrar) { try { localStorage.removeItem('trono-sepulcral.v1'); } catch (e) { } }
    E.nuevaPartida(Math.floor(Math.random() * 2147483647));
    $('cron-inner').innerHTML = '';
    UI.renderChips(); UI.renderPanel(); renderQuick(); UI.guardarLocal();
    intro();
  }
  UI.nuevaPartidaUI = nuevaPartidaUI;

  /* ── Arranque ── */
  function arrancar(datosHot) {
    var cargada = false;
    if (datosHot && datosHot.estado) {
      var r = E.cargar(JSON.stringify({ estado: datosHot.estado }));
      cargada = r.ok;
    }
    if (!cargada) cargada = UI.cargarLocal();
    if (!cargada) {
      E.nuevaPartida(Math.floor(Math.random() * 2147483647));
      UI.renderChips(); UI.renderPanel(); renderQuick();
      intro();
    } else {
      UI.renderChips(); UI.renderPanel(); renderQuick();
      var s = S();
      var pros = UI.entrada({
        ok: true, titulo: 'La crónica continúa', mec: [
          'Partida recuperada: ' + s.pc.nombre + ', nivel ' + s.pc.nivel + ' (' + E.rango().n + '), ' + E.fechaTxt(),
          'Turnos jugados: ' + s.turno + ' · lugar: ' + E.lugar(s.pc.loc).n
        ], cambios: [], ctx: { tipo: 'retorno' }
      });
      var vistos = s.sucesos.filter(function (e) { return e.visto; }).slice(-3).map(function (e) { return e.t + ': ' + e.txt; });
      pros.innerHTML = UI.parr('Vuelves a ' + E.lugar(s.pc.loc).n + ', ' + E.fechaTxt() + ', ' + E.horaTxt(s.fecha) + '. ' + s.pc.cond + '.' +
        (vistos.length ? '\n\nLo último que sabes del mundo: ' + vistos.join(' · ') : ''));
    }

    // Capacidad de Claude (puede no estar disponible: el juego funciona igual)
    if (window.claude && window.claude.use) {
      window.claude.use('sample').then(function (sm) {
        if (!sm) return;
        UI.sample = sm;
        UI.renderChips();
      }).catch(function () { });
    }
  }

  function init() {
    $('send').onclick = enviar;
    $('cmd').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
    });
    $('cmd').addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(120, this.scrollHeight) + 'px';
    });
    $('btn-ayuda').onclick = modalAyuda;
    $('btn-panel').onclick = function () {
      var p = $('panel');
      p.hidden = !p.hidden;
      if (!p.hidden) UI.renderPanel();
    };
    if (window.innerWidth > 920) $('panel').hidden = false;
    $('hint').textContent = HINT;

    // Actualizaciones en caliente: no perder la partida
    if (window.claude && window.claude.hot) {
      try {
        window.claude.hot.snapshot(function () { return { estado: E.getS() }; });
      } catch (e) { }
    }
    if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(arrancar);
    else arrancar((window.claude && window.claude.hot && window.claude.hot.data) || null);
  }
  UI.init = init;
})();

/* ═════════ Fichas (panel derecho) ═════════ */
(function () {
  var W = window.TS.W, E = window.TS.E, A = E.A, UI = window.TS.UI;
  var $ = UI.$, el = UI.el, esc = UI.esc;
  function S() { return E.getS(); }

  var TABS = [
    ['estado', 'Estado'], ['personaje', 'Personaje'], ['atributos', 'Atributos'], ['magia', 'Magia'],
    ['grimorio', 'Grimorio'], ['criaturas', 'Criaturas'], ['investigacion', 'Investigación'],
    ['inventario', 'Inventario'], ['mundo', 'Mundo'], ['economia', 'Economía'], ['npc', 'Personas'],
    ['organizacion', 'Organización'], ['ciudad', 'Ciudades'], ['mapa', 'Mapa'], ['objetivos', 'Objetivos'],
    ['historial', 'Historial'], ['reglas', 'Reglas'], ['guardado', 'Guardado']
  ];

  function h3(t) { return el('h3', 'sec', t); }
  function kv(pares) {
    var d = el('dl', 'kv');
    pares.forEach(function (p) {
      if (p[1] == null || p[1] === '') return;
      d.appendChild(el('dt', null, p[0]));
      var dd = el('dd'); dd.innerHTML = p[1]; d.appendChild(dd);
    });
    return d;
  }
  function barra(cls, v, max) {
    var b = el('div', 'bar ' + cls);
    var i = el('i'); i.style.width = Math.max(0, Math.min(100, (v / (max || 1)) * 100)) + '%';
    b.appendChild(i); return b;
  }
  function dominioRow(nombre, val, extra) {
    var r = el('div', 'srow');
    r.appendChild(el('span', 'lab', nombre + (extra ? ' · ' + extra : '')));
    r.appendChild(el('span', 'num', (Math.round(val * 10) / 10) + '/100'));
    var pg = el('div', 'pg'); pg.appendChild(barra('dom', val, 100));
    r.appendChild(pg);
    return r;
  }
  function card(titulo, sub, cuerpo) {
    var c = el('div', 'card');
    if (titulo) c.appendChild(el('h4', null, titulo));
    if (sub) c.appendChild(el('div', 'sub', sub));
    if (cuerpo) c.appendChild(cuerpo);
    return c;
  }
  function btn(t, fn, cls) { var b = el('button', 'btn' + (cls ? ' ' + cls : ''), t); b.onclick = fn; return b; }
  function vacio(t) { return el('p', 'empty', t); }

  function renderPanel() {
    var cont = $('pbody'), tabs = $('ptabs');
    if (!cont) return;
    tabs.innerHTML = '';
    TABS.forEach(function (t) {
      var b = el('button', 'ptab', t[1]);
      b.setAttribute('aria-selected', UI.tab === t[0] ? 'true' : 'false');
      b.onclick = function () { UI.tab = t[0]; renderPanel(); };
      tabs.appendChild(b);
    });
    if (window.innerWidth <= 920) {
      var cx = el('button', 'ptab pclose', '✕ cerrar');
      cx.onclick = function () { $('panel').hidden = true; };
      tabs.appendChild(cx);
    }
    cont.innerHTML = '';
    var f = ({
      estado: tEstado, personaje: tPersonaje, atributos: tAtributos, magia: tMagia, grimorio: tGrimorio,
      criaturas: tCriaturas, investigacion: tInvestigacion, inventario: tInventario, mundo: tMundo,
      economia: tEconomia, npc: tNpc, organizacion: tOrg, ciudad: tCiudad, mapa: tMapa,
      objetivos: tObjetivos, historial: tHistorial, reglas: tReglas, guardado: tGuardado
    })[UI.tab] || tEstado;
    f(cont);
  }
  UI.renderPanel = renderPanel;

  /* ── Estado ── */
  function tEstado(c) {
    var s = S(), loc = E.lugar(s.pc.loc), fest = E.festividad(s.fecha);
    c.appendChild(h3('Fecha y situación'));
    c.appendChild(kv([
      ['Día', E.diaSemana(s.fecha) + ', ' + s.fecha.d + ' de ' + W.cal.nombresMes[s.fecha.m - 1] + ' de ' + s.fecha.a],
      ['Hora', E.horaTxt(s.fecha)],
      ['Estación', E.estacion(s.fecha).n + ' — ' + E.estacion(s.fecha).clima],
      ['Marea', E.ciclo('marea', s.fecha).fase + ' (maná ×' + E.mareaMod() + ')'],
      ['Velo', E.ciclo('velo', s.fecha).fase + ' (' + (E.veloMod() >= 0 ? '+' : '') + E.veloMod() + ' a nigromancia)'],
      ['Hespera', E.ciclo('hespera', s.fecha).fase],
      ['Mor', E.ciclo('mor', s.fecha).fase],
      ['Festividad', fest ? '<b>' + esc(fest.n) + '</b> — ' + esc(fest.desc) : null],
      ['Ubicación', esc(loc.n) + ' · ' + esc(loc.tipo) + ' · ' + esc(loc.reg)],
      ['Clima local', esc(loc.clima)]
    ]));
    c.appendChild(el('p', 'mini', loc.desc));
    if (loc.peligros && loc.peligros.length) c.appendChild(el('p', 'mini', 'Peligros: ' + loc.peligros.join(', ') + '.'));
    if (loc.servicios && loc.servicios.length) {
      var p = el('p');
      loc.servicios.forEach(function (x) { p.appendChild(el('span', 'pill', x)); });
      c.appendChild(p);
    }
    c.appendChild(h3('Estado del personaje'));
    var est = el('div');
    [['Vitalidad', Math.round(s.pc.hp), E.hpMax(), 'hp'], ['Maná', Math.round(s.pc.mana), E.manaMax(), 'mana'],
     ['Experiencia', s.pc.xp, E.xpSiguiente(), 'xp']].forEach(function (b) {
      var r = el('div', 'srow');
      r.appendChild(el('span', 'lab', b[0]));
      r.appendChild(el('span', 'num', b[1] + ' / ' + b[2]));
      var pg = el('div', 'pg'); pg.appendChild(barra(b[3], b[1], b[2])); r.appendChild(pg);
      est.appendChild(r);
    });
    c.appendChild(est);
    c.appendChild(kv([
      ['Nivel', s.pc.nivel + ' · ' + E.rango().n + (s.pc.bloqueoRango ? ' <b>(bloqueado: prueba de rango pendiente)</b>' : '')],
      ['Condición', esc(s.pc.cond)],
      ['Efectos', s.pc.efectos.length ? s.pc.efectos.map(function (e) { return esc(e.n) + ' (' + e.dias + 'd)'; }).join(', ') : 'ninguno'],
      ['Descanso', Math.round(s.pc.descanso) + '%'],
      ['Hambre', Math.round(s.pc.hambre) + '%'],
      ['Cordura', s.pc.cordura + '/100'],
      ['Notoriedad', s.pc.notoriedad + '/100'],
      ['Sospecha del Priorato', s.pc.sospecha + '/100'],
      ['Dinero', E.dinero()],
      ['Carga', E.pesoInv() + ' / ' + E.cargaMax() + ' kg']
    ]));
    var gente = E.npcsEn(s.pc.loc);
    c.appendChild(h3('Quién hay aquí'));
    if (!gente.length) c.appendChild(vacio('Nadie, salvo lo que no respira.'));
    gente.forEach(function (g) {
      c.appendChild(card(g.conocido ? g.def.n : 'Desconocido', g.def.ocu + ' · opinión ' + (g.est.op >= 0 ? '+' : '') + g.est.op,
        el('p', null, g.conocido ? g.def.pers : 'No lo conoces.')));
    });
    if (s.rumores.length) {
      c.appendChild(h3('Rumores que has oído'));
      var ul = el('ul', 'lista');
      s.rumores.slice(-7).reverse().forEach(function (r) { ul.appendChild(el('li', null, r)); });
      c.appendChild(ul);
    }
  }

  /* ── Personaje ── */
  function tPersonaje(c) {
    var s = S(), g = E.rango();
    c.appendChild(h3('Ficha de personaje'));
    c.appendChild(kv([
      ['Nombre', s.pc.nombre], ['Edad', s.pc.edad + ' años'], ['Clase', s.pc.clase],
      ['Origen', s.pc.origen], ['Personalidad', 'Inteligente, calculador y estratégico'],
      ['Ambición', 'Alcanzar el máximo poder mágico'], ['Dificultad', 'Extrema'],
      ['Especialización', 'Todas las ramas de nigromancia (por potencial, no por dominio)'],
      ['Nivel', s.pc.nivel + ' / 100'], ['Rango', g.n + ' (niveles ' + g.min + '–' + g.max + ')'],
      ['Experiencia', s.pc.xp + ' / ' + E.xpSiguiente() + ' para el nivel ' + (s.pc.nivel + 1)],
      ['Reputación arcana', s.pc.reputacion.arcana], ['Reputación popular', s.pc.reputacion.popular],
      ['Idiomas', Object.keys(s.pc.idiomas).map(function (k) { return k + ' ' + s.pc.idiomas[k] + '%'; }).join(', ')],
      ['Títulos', s.pc.titulos.length ? s.pc.titulos.join(', ') : 'ninguno'],
      ['Principios propios', s.pc.principios.length ? s.pc.principios.join(' · ') : 'ninguno todavía']
    ]));
    c.appendChild(h3('Rangos y pruebas'));
    W.rangos.forEach(function (r) {
      var estado = s.pc.pruebas[r.i] ? 'prueba superada' : (s.pc.nivel > r.max ? 'superado' : s.pc.nivel >= r.min ? 'rango actual' : 'bloqueado');
      var cuerpo = el('div');
      cuerpo.appendChild(el('p', null, 'Prueba: ' + r.prueba.n + ' — ' + r.prueba.desc));
      cuerpo.appendChild(el('p', 'tiny', 'Requisitos: ' + r.prueba.req));
      if (s.pc.nivel >= r.max && !s.pc.pruebas[r.i]) cuerpo.appendChild(btn('Intentar la prueba', function () { UI.ejecutar(function () { return A.pruebaRango(); }); }, 'pri'));
      c.appendChild(card((r.i + 1) + '. ' + r.n + ' (nv ' + r.min + '–' + r.max + ')', estado, cuerpo));
    });
  }

  /* ── Atributos ── */
  function tAtributos(c) {
    var s = S();
    c.appendChild(h3('Estadísticas'));
    var g = el('div', 'stat-grid');
    W.stats.forEach(function (st) {
      var r = el('div', 'srow');
      r.appendChild(el('span', 'lab', st.n + ' · ' + st.f));
      r.appendChild(el('span', 'num', s.pc.st[st.id]));
      var pg = el('div', 'pg');
      var prog = Math.round(s.pc.prog[st.id] || 0);
      var b = el('div', 'bar xp'); var i = el('i'); i.style.width = prog + '%'; b.appendChild(i);
      pg.appendChild(b);
      pg.appendChild(el('div', 'tiny', 'progreso de entrenamiento ' + prog + '/100'));
      r.appendChild(pg);
      g.appendChild(r);
    });
    c.appendChild(g);
    c.appendChild(h3('Valores derivados'));
    c.appendChild(kv([
      ['Vitalidad máxima', E.hpMax()], ['Maná máximo', E.manaMax()],
      ['Regeneración', E.regenHora() + ' de maná por hora (×3 durmiendo)'],
      ['Defensa', E.defensa()], ['Precisión mágica', E.precision()],
      ['Carga máxima', E.cargaMax() + ' kg']
    ]));
    c.appendChild(h3('Entrenar'));
    var box = el('div');
    W.stats.filter(function (x) { return x.id !== 'sue'; }).forEach(function (st) {
      box.appendChild(btn(st.n + ' 2 h', function () { UI.ejecutar(function () { return A.entrenar(st.id, 2); }); }));
    });
    c.appendChild(box);
    c.appendChild(el('p', 'tiny', 'Cuanto más alta es una estadística, más lento sube. El agotamiento penaliza.'));
  }

  /* ── Magia ── */
  function tMagia(c) {
    var s = S();
    c.appendChild(h3('Nigromancia'));
    c.appendChild(dominioRow('Nigromancia (escuela madre)', E.dom('nigro')));
    c.appendChild(btn('Practicar 3 h', function () { UI.ejecutar(function () { return A.practicar('nigro', 3); }); }, 'pri'));
    c.appendChild(h3('Ramas de nigromancia'));
    W.ramas.forEach(function (r) {
      var abierta = E.dom('nigro') >= r.req;
      var row = el('div');
      row.appendChild(dominioRow(r.n, E.dom(r.id), abierta ? null : 'requiere Nigromancia ' + r.req));
      row.appendChild(el('div', 'tiny', r.desc));
      if (abierta) row.appendChild(btn('Practicar 3 h', function () { UI.ejecutar(function () { return A.practicar(r.id, 3); }); }));
      c.appendChild(row);
    });
    ['elemental', 'espiritual', 'avanzada'].forEach(function (cat) {
      c.appendChild(h3('Escuelas: magia ' + cat));
      W.escuelas.filter(function (e) { return e.cat === cat && e.id !== 'nigro'; }).forEach(function (e) {
        if (e.oculta && !s.conoc.esc[e.id] && E.dom(e.id) <= 0) return;
        var af = s.mag.afin[e.id];
        var row = el('div');
        row.appendChild(dominioRow(e.n, E.dom(e.id), 'dificultad ' + e.dif + '/10' + (af && af.descubierta ? ' · afinidad ' + af.nivel : '')));
        row.appendChild(el('div', 'tiny', e.desc + (E.dom(e.id) <= 0 && !s.conoc.esc[e.id] ? ' — sin base: necesitas un maestro, un texto o un descubrimiento.' : '')));
        if (E.dom(e.id) > 0 || s.conoc.esc[e.id]) row.appendChild(btn('Practicar 3 h', function () { UI.ejecutar(function () { return A.practicar(e.id, 3); }); }));
        c.appendChild(row);
      });
    });
    c.appendChild(h3('Afinidades descubiertas'));
    var pp = el('p');
    var algo = false;
    W.escuelas.forEach(function (e) {
      var af = s.mag.afin[e.id];
      if (af && af.descubierta) { algo = true; pp.appendChild(el('span', 'pill ' + (af.nivel === 'alta' ? 'on' : af.nivel === 'nula' ? 'off' : ''), e.n + ': ' + af.nivel)); }
    });
    c.appendChild(algo ? pp : vacio('Solo conoces tu afinidad con la nigromancia. Las demás se descubren practicando.'));
  }

  /* ── Grimorio ── */
  function tGrimorio(c) {
    var s = S();
    var cod = E.objDef('codice');
    c.appendChild(h3('Códice de las Nueve Mortajas'));
    if (!s.inv.codice) c.appendChild(vacio('No lo tienes encima.'));
    else {
      c.appendChild(kv([
        ['Legibilidad', s.codice.leg + '%'], ['Mortajas abiertas', s.codice.mortajas.filter(Boolean).length + ' / 9'],
        ['Sesiones de estudio', s.codice.estudios], ['Thanel Antiguo', (s.pc.idiomas.thanel || 0) + '%'],
        ['Llaves conseguidas', s.codice.llaves.length ? s.codice.llaves.join(', ') : 'ninguna']
      ]));
      c.appendChild(el('p', 'mini', cod.desc));
      c.appendChild(btn('Estudiarlo 3 h', function () { UI.ejecutar(function () { return A.estudiarCodice(3); }); }, 'pri'));
      c.appendChild(btn('Estudiarlo 6 h', function () { UI.ejecutar(function () { return A.estudiarCodice(6); }); }));
      W.mortajas.forEach(function (m, i) {
        var abierta = s.codice.mortajas[i];
        var cuerpo = el('div');
        cuerpo.appendChild(el('p', null, abierta ? 'Contiene: ' + m.contiene.join('; ') : m.req));
        c.appendChild(card(m.titulo, abierta ? 'abierta' : 'sellada', cuerpo));
      });
    }
    c.appendChild(h3('Técnicas conocidas (' + s.hechizos.length + ')'));
    if (!s.hechizos.length) c.appendChild(vacio('Ninguna.'));
    s.hechizos.forEach(function (hc) {
      var cuerpo = el('div');
      cuerpo.appendChild(kv([
        ['Escuela', hc.esc.map(E.nombreDe).join(' + ') + (hc.rama ? ' / ' + E.nombreDe(hc.rama) : '')],
        ['Rango', hc.rango], ['Nivel', hc.nivel], ['Coste', hc.coste + ' de maná'],
        ['Potencia', hc.pot], ['Alcance', hc.alcance], ['Duración', hc.dur],
        ['Activación', hc.act], ['Dificultad', hc.dif], ['Requisitos', hc.req],
        ['Efectos secundarios', hc.sec], ['Evoluciones', (hc.evol || []).join(' · ')],
        ['Origen', hc.origen], ['Usos', hc.usos || 0]
      ]));
      cuerpo.appendChild(el('p', null, hc.desc));
      cuerpo.appendChild(btn('Lanzar', function () { UI.ejecutar(function () { return A.lanzar(hc.id, null); }); }, 'pri'));
      c.appendChild(card(hc.n + (hc.incompleto ? ' (incompleta)' : ''), hc.esc.map(E.nombreDe).join(' + '), cuerpo));
    });
    c.appendChild(btn('Diseñar una técnica nueva', UI.modalHechizo, 'pri'));
  }

  /* ── Criaturas ── */
  function tCriaturas(c) {
    var s = S();
    var mant = 0;
    s.criaturas.forEach(function (x) { if (x.estado === 'activa') mant += x.mant; });
    c.appendChild(h3('Criaturas propias (' + s.criaturas.length + ')'));
    c.appendChild(kv([
      ['Mantenimiento total', mant + ' de maná al día'],
      ['Tu regeneración', (E.regenHora() * 24).toFixed(1) + ' de maná al día'],
      ['Margen', (E.regenHora() * 24 - mant).toFixed(1) + ' de maná al día']
    ]));
    if (mant > E.regenHora() * 24) c.appendChild(el('p', 'mini peligro', 'Gastas más de lo que regeneras: algunas criaturas se desplomarán.'));
    if (!s.criaturas.length) c.appendChild(vacio('Ninguna. Construye la primera con componentes reales.'));
    s.criaturas.forEach(function (cr) {
      var cuerpo = el('div');
      cuerpo.appendChild(kv([
        ['Especie', cr.esp], ['Nivel', cr.nivel + ' (' + cr.rango + ')'], ['XP', cr.xp],
        ['Vitalidad', cr.vit + ' / ' + cr.vitMax], ['Maná', cr.man], ['Fuerza', cr.fue],
        ['Velocidad', cr.vel], ['Defensa', cr.def], ['Inteligencia', cr.int],
        ['Habilidades', cr.hab.join(', ')], ['Lealtad', cr.lealtad + '/100'],
        ['Mantenimiento', cr.mant + ' de maná/día'], ['Origen', cr.origen],
        ['Creada', cr.creada], ['Función', cr.funcion], ['Personalidad', cr.pers],
        ['Defecto', cr.defecto || 'ninguno'], ['Estado', cr.estado],
        ['Evoluciones posibles', (cr.evol || []).join(' · ')]
      ]));
      if (cr.historia && cr.historia.length) {
        cuerpo.appendChild(el('div', 'tiny', 'Historia:'));
        var ul = el('ul', 'lista');
        cr.historia.slice(-5).forEach(function (hh) { ul.appendChild(el('li', null, hh)); });
        cuerpo.appendChild(ul);
      }
      if (cr.estado !== 'destruida') {
        cuerpo.appendChild(btn('Dar una orden', function () {
          var box = el('div');
          var i = el('input'); i.type = 'text'; i.placeholder = 'p. ej. vigila la puerta del osario hasta el alba';
          box.appendChild(i);
          UI.modal('Orden a ' + cr.n, 'Una criatura inteligente puede interpretar, discutir o negarse.', box, [
            { t: 'Ordenar', pri: true, fn: function () { UI.ejecutar(function () { return A.ordenar(cr.uid, i.value || 'espera'); }); } }
          ]);
        }));
        cuerpo.appendChild(btn('Evolucionar', function () {
          var box = el('div');
          box.appendChild(el('p', 'mini', 'Vías: armazón (más cuerpo), elemento (injerto elemental), inteligencia (juicio propio, menos lealtad).'));
          ['armazon', 'elemento', 'inteligencia'].forEach(function (via) {
            box.appendChild(btn(via, function () { UI.cerrarModal(); UI.ejecutar(function () { return A.evolucionar(cr.uid, via); }); }));
          });
          UI.modal('Evolucionar a ' + cr.n, 'Consume rescoldo pálido y sal de osario. Puede destruirla.', box, []);
        }));
      }
      c.appendChild(card(cr.n, cr.esp + ' · ' + cr.estado, cuerpo));
    });
    c.appendChild(btn('Construir una criatura', UI.modalCriatura, 'pri'));
  }

  /* ── Investigación ── */
  function tInvestigacion(c) {
    var s = S();
    c.appendChild(h3('En curso'));
    var act = s.proyectos.filter(function (p) { return p.estado === 'activo'; });
    if (!act.length) c.appendChild(vacio('Nada en marcha.'));
    act.forEach(function (p) {
      var cuerpo = el('div');
      cuerpo.appendChild(kv([
        ['Rama', E.nombreDe(p.rama)], ['Dificultad', p.dif],
        ['Progreso', p.prog + ' / ' + p.total + ' h (' + Math.round(p.prog / p.total * 100) + '%)'],
        ['Abierta', p.inicio]
      ]));
      cuerpo.appendChild(barra('xp', p.prog, p.total));
      [2, 4, 8].forEach(function (hh) {
        cuerpo.appendChild(btn('Trabajar ' + hh + ' h', function () { UI.ejecutar(function () { return A.investigarTrabajar(p.id, hh); }); }, hh === 4 ? 'pri' : null));
      });
      c.appendChild(card(p.n, 'activa', cuerpo));
    });
    c.appendChild(h3('Líneas disponibles'));
    E.investigacionesDisponibles().forEach(function (d) {
      var cuerpo = el('div');
      cuerpo.appendChild(el('p', null, d.def.desc));
      cuerpo.appendChild(kv([
        ['Rama', E.nombreDe(d.def.rama)], ['Jornadas', d.def.dias], ['Dificultad', d.def.dif],
        ['Materiales', (d.def.mat || []).map(function (m) { return E.compDef(m.c).n + ' ×' + m.q + ' (tienes ' + (s.comp[m.c] || 0) + ')'; }).join(', ') || 'ninguno'],
        ['Riesgo', d.def.riesgo ? d.def.riesgo + '%' : 'bajo']
      ]));
      if (d.falta.length) cuerpo.appendChild(el('p', 'tiny peligro', 'Te falta: ' + d.falta.join(' · ')));
      else cuerpo.appendChild(btn('Abrir esta línea', function () { UI.ejecutar(function () { return A.investigarIniciar(d.def.id); }); }, 'pri'));
      c.appendChild(card(d.def.n, d.disponible ? 'disponible' : 'requisitos pendientes', cuerpo));
    });
    c.appendChild(h3('Investigación propia'));
    c.appendChild(el('p', 'mini', 'Puedes investigar cualquier cosa que se te ocurra: el motor estima dificultad y jornadas, y el resultado puede ser nulo o parcial.'));
    c.appendChild(btn('Abrir una línea propia', function () {
      var box = el('div');
      var i = el('input'); i.type = 'text'; i.placeholder = 'p. ej. por qué los siete túmulos están alineados';
      var sc = el('select');
      W.escalas.forEach(function (e) { var o = el('option', null, e.id + ' · ' + e.n); o.value = e.id; sc.appendChild(o); });
      sc.value = 3;
      var ra = el('select');
      W.ramas.concat(W.escuelas).forEach(function (r) { var o = el('option', null, r.n); o.value = r.id; ra.appendChild(o); });
      box.appendChild(el('label', null, 'Qué quieres averiguar')); box.appendChild(i);
      box.appendChild(el('label', null, 'Ambición (escala)')); box.appendChild(sc);
      box.appendChild(el('label', null, 'Rama o escuela implicada')); box.appendChild(ra);
      UI.modal('Investigación propia', 'La magia es experimental: define el objetivo y trabaja horas sobre él.', box, [
        { t: 'Abrir línea', pri: true, fn: function () { UI.ejecutar(function () { return A.investigarLibre({ objetivo: i.value, escala: +sc.value, rama: ra.value }); }); } }
      ]);
    }, 'pri'));
    if (s.hechos.length) {
      c.appendChild(h3('Completadas'));
      var ul = el('ul', 'lista');
      s.hechos.forEach(function (idh) { var d = E.invDef(idh); ul.appendChild(el('li', null, d ? d.n : idh)); });
      c.appendChild(ul);
    }
    if (s.recetas.length) {
      c.appendChild(h3('Recetas obtenidas'));
      c.appendChild(el('p', 'mini', s.recetas.join(', ')));
    }
  }

  /* ── Inventario ── */
  function tInventario(c) {
    var s = S();
    c.appendChild(h3('Bolsa'));
    c.appendChild(kv([['Dinero', E.dinero()], ['Peso', E.pesoInv() + ' / ' + E.cargaMax() + ' kg']]));
    c.appendChild(el('p', 'tiny', '1 corona de oro (co) = 20 marcos de plata (mp) = 240 peniques de cobre (pc).'));
    c.appendChild(h3('Objetos'));
    var hay = false;
    Object.keys(s.inv).forEach(function (k) {
      var d = E.objDef(k); if (!d) return; hay = true;
      var cuerpo = el('div');
      cuerpo.appendChild(kv([
        ['Tipo', d.tipo], ['Rareza', d.rar], ['Cantidad', s.inv[k]],
        ['Peso', (d.peso || 0) + ' kg'], ['Valor', d.val != null ? E.dinero(Math.round(d.val * 12)) : 'incalculable'],
        ['Propiedades', (d.props || []).join(' · ')]
      ]));
      cuerpo.appendChild(el('p', null, d.desc));
      if (d.efecto) cuerpo.appendChild(btn('Usar', function () { UI.ejecutar(function () { return A.usar(k); }); }, 'pri'));
      if (!d.unico) cuerpo.appendChild(btn('Vender 1', function () { UI.ejecutar(function () { return A.vender(k, 1); }); }));
      c.appendChild(card(d.n + ' ×' + s.inv[k], d.tipo, cuerpo));
    });
    if (!hay) c.appendChild(vacio('Vacío.'));
    c.appendChild(h3('Componentes mágicos'));
    var tipos = { armazon: 'Armazones', nucleo: 'Núcleos', esencia: 'Esencias', alma: 'Almas', material: 'Materiales', reactivo: 'Reactivos' };
    Object.keys(tipos).forEach(function (t) {
      var items = Object.keys(s.comp).filter(function (k) { var d = E.compDef(k); return d && d.tipo === t; });
      if (!items.length) return;
      c.appendChild(el('div', 'tiny', tipos[t]));
      var ul = el('ul', 'lista');
      items.forEach(function (k) {
        var d = E.compDef(k);
        var li = el('li');
        li.innerHTML = '<b>' + esc(d.n) + '</b> ×' + s.comp[k] + ' <span class="tiny">' + esc(d.rar) + ' · valor ' + E.dinero(Math.round(d.val * 12)) + '</span><br><span class="mini">' + esc(d.desc) + '</span>';
        ul.appendChild(li);
      });
      c.appendChild(ul);
    });
    if (!Object.keys(s.comp).length) c.appendChild(vacio('Sin componentes. Recolecta en el osario, los túmulos o el bosque.'));
  }

  /* ── Mundo ── */
  function tMundo(c) {
    var s = S();
    c.appendChild(h3('Noticias conocidas'));
    var vistos = s.sucesos.filter(function (e) { return e.visto; }).slice(-14).reverse();
    if (!vistos.length) c.appendChild(vacio('Nada ha llegado hasta ti.'));
    var ul = el('ul', 'lista');
    vistos.forEach(function (e) {
      var li = el('li', e.tipo === 'peligro' || e.tipo === 'muerte' ? 'peligro' : null);
      li.innerHTML = '<span class="tiny">' + e.f.d + '/' + e.f.m + '/' + e.f.a + '</span> <b>' + esc(e.t) + ':</b> ' + esc(e.txt);
      ul.appendChild(li);
    });
    c.appendChild(ul);
    c.appendChild(h3('Guerras y pactos'));
    if (!s.mundo.guerras.length) c.appendChild(vacio('Ninguna guerra abierta de la que sepas.'));
    s.mundo.guerras.forEach(function (g) {
      c.appendChild(el('p', 'mini', E.polDef(g.a).n + ' contra ' + E.polDef(g.b).n + ' desde el ' + g.desde.d + '/' + g.desde.m + '/' + g.desde.a + '.'));
    });
    c.appendChild(h3('Potencias que conoces'));
    W.polities.forEach(function (p) {
      if (!s.conoc.pol[p.id]) return;
      var st = s.pol[p.id];
      var cuerpo = el('div');
      cuerpo.appendChild(el('p', null, p.desc));
      cuerpo.appendChild(kv([
        ['Tipo', p.tipo], ['Capital', p.cap], ['Continente', (function () { for (var i = 0; i < W.continentes.length; i++) if (W.continentes[i].id === p.cont) return W.continentes[i].n; })()],
        ['Población', st.pob.toLocaleString('es-ES')],
        ['Nacimientos último mes', st.nac != null ? st.nac.toLocaleString('es-ES') : '—'],
        ['Muertes último mes', st.mue != null ? st.mue.toLocaleString('es-ES') : '—'],
        ['Migración', st.mig != null ? (st.mig >= 0 ? '+' : '') + st.mig : '—'],
        ['Tesorería', st.tes.toLocaleString('es-ES') + ' co'],
        ['Estabilidad', Math.round(st.est) + '/100'], ['Fuerza militar', Math.round(st.mil) + '/100'],
        ['Reservas de grano', Math.round(st.grano) + '/100'],
        ['En guerra con', st.guerra.length ? st.guerra.map(function (x) { return E.polDef(x).n; }).join(', ') : 'nadie'],
        ['Actitud ante la nigromancia', p.act <= -70 ? 'persecución total' : p.act < -20 ? 'ilegal' : p.act < 20 ? 'tolerada a regañadientes' : p.act < 70 ? 'regulada' : 'institucional'],
        ['Metas declaradas', p.metas.join(' · ')]
      ]));
      c.appendChild(card(p.n, p.tipo, cuerpo));
    });
    c.appendChild(h3('Continentes'));
    W.continentes.forEach(function (ct) {
      if (!s.conoc.cont[ct.id]) return;
      c.appendChild(card(ct.n, null, el('p', null, ct.desc)));
    });
    c.appendChild(h3('Dimensiones conocidas'));
    var algo = false;
    W.dimensiones.forEach(function (d) {
      if (!s.conoc.dim[d.id]) return;
      algo = true;
      c.appendChild(card(d.n, 'acceso: ' + d.acceso, el('p', null, d.desc)));
    });
    if (!algo) c.appendChild(vacio('Solo intuyes el Velo.'));
    c.appendChild(h3('Organizaciones conocidas'));
    W.orgs.forEach(function (o) {
      if (!s.conoc.org[o.id]) return;
      var st = s.orgs[o.id];
      var cuerpo = el('div');
      cuerpo.appendChild(el('p', null, o.desc));
      cuerpo.appendChild(kv([['Ideología', o.ideo], ['Poder', Math.round(st.poder)], ['Influencia', Math.round(st.inf)],
        ['Miembros estimados', st.miembros], ['Metas', o.metas.join(' · ')]]));
      c.appendChild(card(o.n, null, cuerpo));
    });
    c.appendChild(h3('Saber e historia'));
    W.saber.forEach(function (l) {
      if (!s.conoc.saber[l.id]) return;
      var cuerpo = el('div');
      cuerpo.appendChild(el('p', null, 'Lo que se cuenta: ' + l.creencia));
      if (s.flags['verdad_' + l.id]) cuerpo.appendChild(el('p', null, 'Lo que descubriste: ' + l.verdad));
      c.appendChild(card(l.t, s.flags['verdad_' + l.id] ? 'verificado' : 'versión común', cuerpo));
    });
    c.appendChild(h3('Bestiario'));
    var ub = el('ul', 'lista');
    W.bestiario.forEach(function (b) {
      if (!s.conoc.best[b.id]) return;
      var li = el('li');
      li.innerHTML = '<b>' + esc(b.n) + '</b> <span class="tiny">nivel ' + b.nv + ' · ' + b.rango + ' · vit ' + b.vit + ' · fue ' + b.fue + ' · vel ' + b.vel + ' · def ' + b.def + '</span><br><span class="mini">' + esc(b.desc) + ' Habilidades: ' + b.hab.join(', ') + '.</span>';
      ub.appendChild(li);
    });
    c.appendChild(ub);
  }

  /* ── Economía ── */
  function tEconomia(c) {
    var s = S();
    c.appendChild(h3('Tus finanzas'));
    c.appendChild(kv([['Efectivo', E.dinero()], ['Valor de los componentes',
      E.dinero(Math.round(Object.keys(s.comp).reduce(function (a, k) { var d = E.compDef(k); return a + (d ? d.val * 12 * s.comp[k] : 0); }, 0)))]]));
    c.appendChild(h3('Precios del mercado'));
    var pr = s.mundo.precios;
    var ul = el('ul', 'lista');
    ['grano', 'hierro', 'madera', 'sal', 'componentes'].forEach(function (k) {
      ul.appendChild(el('li', null, k + ': índice ' + (pr[k] || 1).toFixed(2) + (pr[k] > 1.15 ? ' (caro)' : pr[k] < 0.85 ? ' (barato)' : '')));
    });
    c.appendChild(ul);
    if (s.org) {
      c.appendChild(h3('Organización: ' + s.org.n));
      c.appendChild(kv([['Tesorería', s.org.tesoro + ' co'], ['Ingresos último mes', (s.org.ingr || 0) + ' co'],
        ['Gastos último mes', (s.org.gasto || 0) + ' co'], ['Miembros', s.org.miembros], ['Moral', s.org.moral + '/100']]));
    }
    s.ciudades.forEach(function (ci) {
      c.appendChild(h3('Asentamiento: ' + ci.n));
      c.appendChild(kv([['Población', ci.pob], ['Tesoro', ci.tesoro + ' co'], ['Ingresos', (ci.ingresos || 0) + ' co'],
        ['Gastos', (ci.gastos || 0) + ' co'], ['Impuestos', ci.impuestos + '%'], ['Estabilidad', Math.round(ci.estabilidad) + '/100'],
        ['Granjas', ci.granjas], ['Edificios', ci.edificios.join(', ')], ['Guarnición', ci.guarnicion]]));
    });
    c.appendChild(h3('Economías conocidas'));
    W.polities.forEach(function (p) {
      if (!s.conoc.pol[p.id]) return;
      var st = s.pol[p.id];
      var linea = el('p', 'mini');
      linea.innerHTML = '<b>' + esc(p.n) + '</b>: tesorería ' + st.tes.toLocaleString('es-ES') + ' co · ingresos ' +
        (st.ingr || 0).toLocaleString('es-ES') + ' · gastos ' + (st.gasto || 0).toLocaleString('es-ES') +
        ' · grano ' + Math.round(st.grano) + '/100 · estabilidad ' + Math.round(st.est);
      c.appendChild(linea);
    });
  }

  /* ── Personas ── */
  function tNpc(c) {
    var s = S();
    c.appendChild(h3('Personas que conoces'));
    var algo = false;
    Object.keys(s.npcs).forEach(function (id) {
      if (!s.conoc.npc[id]) return;
      algo = true;
      var d = E.npcDef(id), st = s.npcs[id];
      var cuerpo = el('div');
      cuerpo.appendChild(kv([
        ['Edad', st.edad != null ? st.edad + ' años' : 'desconocida'], ['Especie', d.esp], ['Ocupación', d.ocu],
        ['Ubicación', st.loc && s.conoc.lug[st.loc] ? E.lugar(st.loc).n : 'paradero desconocido'],
        ['Opinión sobre ti', (st.op >= 0 ? '+' : '') + st.op + '/100'],
        ['Estado', st.vivo ? (st.salud < 45 ? 'enfermo o malherido' : 'vivo') : 'muerto'],
        ['Habilidades', (d.hab || []).join(', ')], ['Recursos', (d.rec || []).join(', ')],
        ['Objetivos', (d.metas || []).join(' · ')], ['Relaciones', (d.rel || []).join(' · ')]
      ]));
      cuerpo.appendChild(el('p', null, d.pers));
      cuerpo.appendChild(el('p', 'mini', d.hist));
      if (s.flags['sec_' + id]) cuerpo.appendChild(el('p', 'mini', 'Lo que descubriste: ' + d.sec));
      if (st.memoria && st.memoria.length) {
        cuerpo.appendChild(el('div', 'tiny', 'Qué recuerda de ti:'));
        var ul = el('ul', 'lista');
        st.memoria.slice(-4).forEach(function (m) { ul.appendChild(el('li', null, m.f + ' — ' + m.q)); });
        cuerpo.appendChild(ul);
      }
      if (st.vivo && st.loc === s.pc.loc) cuerpo.appendChild(btn('Hablar', function () { UI.ejecutar(function () { return A.hablar(id, 'saludar'); }); }, 'pri'));
      c.appendChild(card(d.n, d.ocu, cuerpo));
    });
    if (!algo) c.appendChild(vacio('A nadie, todavía.'));
  }

  /* ── Organización ── */
  function tOrg(c) {
    var s = S();
    if (!s.org) {
      c.appendChild(h3('Sin organización'));
      c.appendChild(el('p', 'mini', 'Puedes fundar un círculo clandestino, una orden, un gremio o una secta y hacerlo crecer hasta convertirlo en una potencia. Requisitos: dos apoyos (criaturas activas o personas con opinión ≥ 45) y 5 mp.'));
      c.appendChild(btn('Fundar una organización', function () { UI.modalOrg(''); }, 'pri'));
      return;
    }
    var o = s.org;
    c.appendChild(h3(o.n));
    c.appendChild(kv([
      ['Tipo', o.tipo], ['Líder', o.lider], ['Ideología', o.ideologia], ['Fundada', o.fundada],
      ['Miembros', o.miembros], ['Moral', o.moral + '/100'], ['Influencia', o.influencia],
      ['Tesorería', o.tesoro + ' co'], ['Jerarquía', o.rangos.join(' → ')],
      ['Instalaciones', o.instalaciones.length ? o.instalaciones.join(', ') : 'ninguna'],
      ['Territorios', o.territorios.length ? o.territorios.join(', ') : 'ninguno'],
      ['Secreta', o.secreta ? 'sí' : 'no']
    ]));
    c.appendChild(h3('Acciones'));
    c.appendChild(btn('Reclutar', function () { UI.ejecutar(function () { return A.orgAccion('reclutar'); }); }, 'pri'));
    c.appendChild(btn('Ganar influencia', function () { UI.ejecutar(function () { return A.orgAccion('influencia'); }); }));
    ['escondite', 'taller', 'cripta', 'biblioteca', 'laboratorio'].forEach(function (x) {
      c.appendChild(btn('Construir ' + x, function () { UI.ejecutar(function () { return A.orgAccion('instalacion', x); }); }));
    });
    c.appendChild(btn('Financiar (1 co)', function () { UI.ejecutar(function () { return A.orgAccion('financiar', 240); }); }));
    c.appendChild(h3('Asentamientos'));
    c.appendChild(el('p', 'mini', 'Con 12 miembros y 5 co puedes fundar un asentamiento propio donde estés.'));
    c.appendChild(btn('Fundar asentamiento aquí', function () {
      var box = el('div');
      var i = el('input'); i.type = 'text'; i.placeholder = 'Nombre del asentamiento';
      box.appendChild(i);
      UI.modal('Fundar asentamiento', 'Tardarás unos veinte días en levantar lo mínimo.', box, [
        { t: 'Fundar', pri: true, fn: function () { UI.ejecutar(function () { return A.fundarCiudad({ n: i.value }); }); } }
      ]);
    }));
  }

  /* ── Ciudades ── */
  function tCiudad(c) {
    var s = S();
    if (!s.ciudades.length) { c.appendChild(h3('Sin territorios')); c.appendChild(vacio('No gobiernas nada todavía.')); return; }
    s.ciudades.forEach(function (ci) {
      c.appendChild(h3(ci.n));
      c.appendChild(kv([
        ['Junto a', ci.lugar], ['Fundado', ci.fundada], ['Población', ci.pob],
        ['Tesoro', ci.tesoro + ' co'], ['Impuestos', ci.impuestos + '%'],
        ['Estabilidad', Math.round(ci.estabilidad) + '/100'], ['Granjas', ci.granjas],
        ['Alimentación', ci.hambre ? 'deficitaria' : 'suficiente'],
        ['Edificios', ci.edificios.join(', ')], ['Guarnición', ci.guarnicion],
        ['Leyes', ci.leyes.length ? ci.leyes.join(' · ') : 'ninguna']
      ]));
      [5, 10, 15, 20].forEach(function (v) {
        c.appendChild(btn('Impuestos ' + v + '%', function () { UI.ejecutar(function () { return A.ciudadAccion(ci.id, 'impuestos', v); }); }));
      });
      ['granja', 'almacen', 'cuartel', 'hospital', 'laboratorio', 'biblioteca', 'muralla', 'academia'].forEach(function (x) {
        c.appendChild(btn('Construir ' + x, function () { UI.ejecutar(function () { return A.ciudadAccion(ci.id, 'construir', x); }); }));
      });
      c.appendChild(btn('Promulgar una ley', function () {
        var box = el('div');
        var i = el('input'); i.type = 'text'; i.placeholder = 'p. ej. toque de queda nocturno';
        box.appendChild(i);
        UI.modal('Nueva ley en ' + ci.n, 'Los habitantes reaccionan a lo que decides.', box, [
          { t: 'Promulgar', pri: true, fn: function () { UI.ejecutar(function () { return A.ciudadAccion(ci.id, 'ley', i.value); }); } }
        ]);
      }, 'pri'));
    });
  }

  /* ── Mapa ── */
  function tMapa(c) {
    var s = S();
    c.appendChild(h3('Lugares conocidos'));
    var conocidos = W.lugares.filter(function (l) { return s.conoc.lug[l.id]; });
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    conocidos.forEach(function (l) { minX = Math.min(minX, l.x); maxX = Math.max(maxX, l.x); minY = Math.min(minY, l.y); maxY = Math.max(maxY, l.y); });
    var pad = 60;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    var w = Math.max(200, maxX - minX), hh = Math.max(200, maxY - minY);
    var svg = '<svg id="mapa" viewBox="' + minX + ' ' + minY + ' ' + w + ' ' + hh + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de lugares conocidos">';
    W.rutas.forEach(function (r) {
      if (!s.conoc.lug[r.a] || !s.conoc.lug[r.b]) return;
      var a = E.lugar(r.a), b = E.lugar(r.b);
      svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="rgba(231,222,203,.18)" stroke-width="1.6" stroke-dasharray="4 4"/>';
    });
    conocidos.forEach(function (l) {
      var aqui = l.id === s.pc.loc;
      var visitado = s.flags['visitado_' + l.id] || aqui;
      var rr = l.tipo === 'Ciudad' || l.tipo === 'Capital' || l.tipo === 'Ciudad-estado' ? 9 : l.pob > 500 ? 7 : 5;
      svg += '<circle cx="' + l.x + '" cy="' + l.y + '" r="' + rr + '" fill="' + (aqui ? '#c9a05c' : visitado ? '#5fc2b8' : '#3a3347') + '" stroke="' + (aqui ? '#f0d9a8' : 'rgba(231,222,203,.3)') + '" stroke-width="' + (aqui ? 3 : 1) + '"/>';
      svg += '<text x="' + (l.x + rr + 5) + '" y="' + (l.y + 4) + '" fill="' + (aqui ? '#e7decb' : '#a79d8a') + '" font-size="15" font-family="IBM Plex Mono, monospace">' + esc(l.n) + '</text>';
    });
    svg += '</svg>';
    var box = el('div'); box.innerHTML = svg; c.appendChild(box);
    c.appendChild(el('p', 'tiny', 'Dorado: dónde estás. Verde: visitado. Gris: conocido de oídas. Las líneas son rutas conocidas.'));
    c.appendChild(h3('Fichas de lugar'));
    conocidos.forEach(function (l) {
      var cuerpo = el('div');
      var pob = (s.locPob && s.locPob[l.id] != null) ? s.locPob[l.id] : l.pob;
      cuerpo.appendChild(kv([
        ['Tipo', l.tipo], ['Región', l.reg], ['Potencia', l.pol && E.polDef(l.pol) ? E.polDef(l.pol).n : 'ninguna'],
        ['Población', pob ? pob.toLocaleString('es-ES') : '—'], ['Clima', l.clima],
        ['Recursos', (l.rec || []).join(', ') || '—'], ['Peligros', (l.peligros || []).join(', ') || '—'],
        ['Servicios', (l.servicios || []).join(', ') || '—']
      ]));
      cuerpo.appendChild(el('p', null, s.flags['visitado_' + l.id] ? l.desc : 'Solo sabes lo que cuentan.'));
      if (s.flags['oculto_' + l.id] && l.oculto) cuerpo.appendChild(el('p', 'mini', 'Descubierto: ' + l.oculto));
      c.appendChild(card(l.n, l.id === s.pc.loc ? 'estás aquí' : null, cuerpo));
    });
  }

  /* ── Objetivos ── */
  function tObjetivos(c) {
    var s = S();
    c.appendChild(h3('Tus objetivos'));
    c.appendChild(el('p', 'mini', 'Nadie te asigna misiones. Esto es tu propia lista.'));
    var ul = el('ul', 'lista');
    s.objetivos.forEach(function (o, i) {
      var li = el('li');
      li.innerHTML = '<b>' + esc(o.t) + '</b> <span class="tiny">' + esc(o.estado) + '</span>' + (o.nota ? '<br><span class="mini">' + esc(o.nota) + '</span>' : '');
      var b = el('button', 'btn', o.estado === 'abierto' ? 'marcar cumplido' : 'reabrir');
      b.onclick = function () { o.estado = o.estado === 'abierto' ? 'cumplido' : 'abierto'; UI.guardarLocal(); renderPanel(); };
      li.appendChild(b);
      var bd = el('button', 'btn dgr', 'borrar');
      bd.onclick = function () { s.objetivos.splice(i, 1); UI.guardarLocal(); renderPanel(); };
      li.appendChild(bd);
      ul.appendChild(li);
    });
    c.appendChild(ul);
    var i2 = el('input'); i2.type = 'text'; i2.placeholder = 'Nuevo objetivo propio';
    i2.style.width = '100%'; i2.style.background = '#110e18'; i2.style.color = 'var(--bone)';
    i2.style.border = '1px solid var(--line2)'; i2.style.borderRadius = '7px'; i2.style.padding = '7px 10px';
    c.appendChild(i2);
    c.appendChild(btn('Añadir', function () {
      if (!i2.value.trim()) return;
      s.objetivos.push({ id: 'o' + (s.objetivos.length + 1), t: i2.value.trim(), estado: 'abierto', nota: 'Objetivo propio, anotado el ' + E.fechaTxt() });
      i2.value = ''; UI.guardarLocal(); renderPanel();
    }, 'pri'));
    c.appendChild(h3('Oportunidades que has oído'));
    var ul2 = el('ul', 'lista');
    s.rumores.slice(-8).forEach(function (r) { ul2.appendChild(el('li', null, r)); });
    c.appendChild(s.rumores.length ? ul2 : vacio('Nada por ahora.'));
  }

  /* ── Historial ── */
  function tHistorial(c) {
    var s = S();
    c.appendChild(h3('Registro cronológico'));
    var ul = el('ul', 'lista');
    s.log.slice().reverse().slice(0, 80).forEach(function (l) {
      var li = el('li');
      li.innerHTML = '<span class="tiny">' + l.f.d + '/' + l.f.m + '/' + l.f.a + ' ' + (l.f.h < 10 ? '0' : '') + l.f.h + ':' + (l.f.min < 10 ? '0' : '') + l.f.min + '</span> ' + esc(l.txt) +
        (l.c && l.c.length ? '<br><span class="mini">' + l.c.map(function (x) { return esc(x.el) + ': ' + esc(x.a) + ' → ' + esc(x.b); }).join(' · ') + '</span>' : '');
      ul.appendChild(li);
    });
    c.appendChild(ul);
  }

  /* ── Reglas ── */
  function tReglas(c) {
    c.appendChild(h3('Tiradas'));
    c.appendChild(el('p', 'mini', 'Toda acción incierta se resuelve con un d100 más modificadores (que pesan la mitad de su valor nominal) contra una dificultad. Grados: éxito crítico (margen ≥ 35 con tirada ≥ 65, o 99-100), éxito (margen ≥ 0), éxito parcial (hasta −12), fracaso (hasta −38) y fracaso crítico (por debajo, o 1-2). El resultado no se cambia por conveniencia narrativa.'));
    c.appendChild(h3('Progresión'));
    c.appendChild(el('p', 'mini', 'Niveles 1-100 repartidos en diez rangos. Al llegar al nivel máximo de un rango no se asciende automáticamente: hay que superar una prueba concreta. La experiencia llega de combates, exploración, investigación, aprendizaje, creación, descubrimientos, gestión y conquista, en cantidades proporcionadas.'));
    c.appendChild(h3('Dominio'));
    c.appendChild(el('p', 'mini', 'Cada escuela y cada rama de nigromancia tiene su propio dominio de 0 a 100, con rendimientos decrecientes. Las ramas se desbloquean con nigromancia suficiente. Las escuelas ajenas necesitan maestro, texto o descubrimiento: no se improvisan.'));
    c.appendChild(h3('Maná y mantenimiento'));
    c.appendChild(el('p', 'mini', 'El maná regenera por hora según tu estadística y la Marea de Maná (ciclo de 18 días). Cada criatura activa cuesta maná al día: si no llegas, se desploman. No hay ejércitos gratis.'));
    c.appendChild(h3('Tiempo'));
    c.appendChild(el('p', 'mini', 'Calendario propio: 12 meses de 30 días, semanas de 6 días, cuatro estaciones, dos lunas, Marea de Maná y espesor del Velo (ciclo de 40 días que facilita y a la vez hace más peligrosa la nigromancia). Una conversación cuesta minutos; un viaje, horas o días; una investigación, jornadas.'));
    c.appendChild(h3('El mundo sin ti'));
    c.appendChild(el('p', 'mini', 'Cada día se simulan 16 potencias (población, nacimientos, muertes, migración, tesorería, grano, estabilidad, guerras), 12 organizaciones con metas y 22 personas con agenda propia. Las noticias tardan en llegarte según la distancia: lo que pasa lejos lo sabrás tarde, o nunca.'));
    c.appendChild(h3('Muerte'));
    c.appendChild(el('p', 'mini', 'Es real y definitiva salvo que hayas preparado de antemano un ancla espiritual, un pacto o un artefacto de retorno. Esos métodos existen en el mundo, son difíciles de descubrir, caros y tienen consecuencias.'));
    c.appendChild(h3('Qué narra Claude y qué no'));
    c.appendChild(el('p', 'mini', 'El motor calcula y decide; Claude solo pone en prosa lo que el motor ya resolvió, sin poder concederte éxitos, objetos, hechizos ni revelaciones. Si no hay acceso a Claude, narra el motor y el juego funciona exactamente igual.'));
  }

  /* ── Guardado ── */
  function tGuardado(c) {
    var s = S();
    c.appendChild(h3('Memoria de la partida'));
    c.appendChild(el('p', 'mini', 'La partida se guarda automáticamente en este navegador tras cada acción. Ese guardado vive solo en tu navegador: no viaja a otros dispositivos. Para llevártela a otro sitio, usa el guardado completo o el respaldo compacto.'));
    c.appendChild(kv([['Turnos', s.turno], ['Registros', s.log.length], ['Sucesos del mundo', s.sucesos.length],
      ['Semilla de azar', s.seed]]));
    c.appendChild(btn('Guardar (copiar o descargar)', UI.modalGuardar, 'pri'));
    c.appendChild(btn('Cargar partida', UI.modalCargar));
    c.appendChild(btn('Respaldo compacto', function () { UI.bloqueTexto('Respaldo compacto', E.respaldo()); }));
    c.appendChild(btn('Resumen', function () { UI.bloqueTexto('Resumen de la crónica', (function () { return UI.resumenTexto ? UI.resumenTexto() : E.respaldo(); })()); }));
    c.appendChild(btn('Auditoría de coherencia', function () {
      var a = E.auditoria();
      UI.bloqueTexto('Auditoría de coherencia', a.lineas.join('\n') + (a.avisos.length ? '\n\nCorregido:\n- ' + a.avisos.join('\n- ') : ''));
      UI.renderChips(); renderPanel();
    }));
    c.appendChild(btn('Empezar crónica nueva', function () {
      UI.modal('Empezar de cero', 'Se borrará la partida guardada en este navegador. No se puede deshacer.', el('div'), [
        { t: 'Borrar y empezar', pri: true, fn: function () { UI.nuevaPartidaUI(true); } }
      ]);
    }, 'dgr'));
  }

  UI.init();
})();
