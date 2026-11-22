/* Crónicas del Trono Sepulcral — motor de simulación.
   Sin DOM. Toda acción devuelve {ok, titulo, mec[], cambios[], tiempo, narr{}}.
   El motor decide los resultados; la narración se escribe después. */
(function () {
  var W = window.TS.W;
  var E = {};
  var S = null; // estado de la partida

  /* ═════════ 1. AZAR DETERMINISTA ═════════ */
  function mulberry32() {
    var t = (S.rs += 0x6D2B79F5) >>> 0;
    var r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1) >>> 0;
    r ^= (r + Math.imul(r ^ (r >>> 7), r | 61)) >>> 0;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }
  function rnd() { return mulberry32(); }
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function pesado(arr, key) {
    var tot = 0, i;
    for (i = 0; i < arr.length; i++) tot += (arr[i][key] || 1);
    var r = rnd() * tot;
    for (i = 0; i < arr.length; i++) { r -= (arr[i][key] || 1); if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  }
  E.rnd = rnd; E.ri = ri; E.pick = pick;

  /* ═════════ 2. TIRADAS ═════════ */
  // dif: dificultad objetivo. mods: [{n:'etiqueta', v:+/-}]
  E.tirada = function (dif, mods) {
    mods = mods || [];
    var suma = 0;
    for (var i = 0; i < mods.length; i++) suma += mods[i].v;
    // Dificultad extrema: los modificadores pesan la mitad de su valor nominal,
    // así que las estadísticas ayudan pero no garantizan nada.
    suma = Math.round(suma * 0.5);
    var roll = ri(1, 100);
    var total = roll + suma;
    var margen = total - dif;
    var grado;
    if (roll >= 99) grado = 'critico';
    else if (roll <= 2) grado = 'fracaso_critico';
    else if (margen >= 35 && roll >= 65) grado = 'critico';
    else if (margen >= 0) grado = 'exito';
    else if (margen >= -12) grado = 'parcial';
    else if (margen >= -38) grado = 'fracaso';
    else grado = 'fracaso_critico';
    return { roll: roll, mods: mods, bono: suma, total: total, dif: Math.round(dif), margen: Math.round(margen), grado: grado };
  };
  E.gradoTxt = {
    critico: 'Éxito crítico', exito: 'Éxito', parcial: 'Éxito parcial',
    fracaso: 'Fracaso', fracaso_critico: 'Fracaso crítico'
  };
  function tiradaLinea(t) {
    var ms = t.mods.map(function (m) { return (m.v >= 0 ? '+' : '') + m.v + ' ' + m.n; }).join(', ');
    return 'Tirada d100: ' + t.roll + (t.bono ? ' (' + (t.bono >= 0 ? '+' : '') + t.bono + ')' : '') +
      ' vs dificultad ' + t.dif + ' → ' + E.gradoTxt[t.grado] + (ms ? ' · ' + ms : '');
  }
  E.tiradaLinea = tiradaLinea;

  /* ═════════ 3. CALENDARIO ═════════ */
  var C = W.cal;
  function diaAbsoluto(f) { return (f.a * C.meses * C.diasMes) + ((f.m - 1) * C.diasMes) + f.d; }
  E.diaAbsoluto = diaAbsoluto;
  E.estacion = function (f) {
    for (var i = 0; i < C.estaciones.length; i++) if (C.estaciones[i].meses.indexOf(f.m) >= 0) return C.estaciones[i];
    return C.estaciones[0];
  };
  E.diaSemana = function (f) { return C.nombresDia[diaAbsoluto(f) % C.diasSemana]; };
  E.ciclo = function (id, f) {
    var c = null, i;
    for (i = 0; i < C.ciclos.length; i++) if (C.ciclos[i].id === id) c = C.ciclos[i];
    var pos = diaAbsoluto(f) % c.periodo;
    var idx = Math.floor(pos / (c.periodo / c.fases.length));
    return { nombre: c.n, fase: c.fases[Math.min(idx, c.fases.length - 1)], pos: pos, periodo: c.periodo };
  };
  E.festividad = function (f) {
    for (var i = 0; i < C.festividades.length; i++) {
      var ft = C.festividades[i];
      if (ft.m === f.m && Math.abs(ft.d - f.d) <= 0) return ft;
    }
    return null;
  };
  E.horaTxt = function (f) {
    var h = f.h;
    var frag = h < 4 ? 'noche profunda' : h < 7 ? 'antes del alba' : h < 12 ? 'mañana' :
      h < 15 ? 'mediodía' : h < 19 ? 'tarde' : h < 22 ? 'anochecer' : 'noche';
    return (h < 10 ? '0' : '') + h + ':' + (f.min < 10 ? '0' : '') + f.min + ' (' + frag + ')';
  };
  E.fechaTxt = function (f) {
    f = f || S.fecha;
    return E.diaSemana(f) + ', ' + f.d + ' de ' + C.nombresMes[f.m - 1] + ' de ' + f.a + ' ' + C.eraNombre;
  };
  // Modificador global de maná según la Marea
  E.mareaMod = function () {
    var fase = E.ciclo('marea', S.fecha).fase;
    return fase === 'Flujo Alto' ? 1.35 : fase === 'Flujo' ? 1.15 : fase === 'Reflujo' ? 0.85 : fase === 'Reflujo Bajo' ? 0.65 : 1;
  };
  E.veloMod = function () {
    var fase = E.ciclo('velo', S.fecha).fase;
    return fase === 'Velo Delgado' ? 15 : fase === 'Velo Tenso' ? 7 : fase === 'Velo Espeso' ? -12 : 0;
  };

  /* ═════════ 4. ESTADO DERIVADO ═════════ */
  E.hpMax = function () { return Math.round(30 + S.pc.st.vit * 4 + S.pc.nivel * 2 + (S.pc.bonos.hp || 0)); };
  E.manaMax = function () { return Math.round(10 + S.pc.st.man * 2.2 + S.pc.nivel + (S.pc.bonos.mana || 0)); };
  E.regenHora = function () { return +(S.pc.st.mrg * (1 + S.pc.st.man / 45) * E.mareaMod()).toFixed(2); };
  E.defensa = function () { return Math.round(6 + S.pc.st.vel * 0.45 + S.pc.st.res * 0.3 + (S.pc.bonos.def || 0)); };
  E.precision = function () { return Math.round(S.pc.st.ctl * 1.6 + S.pc.st.int * 0.5 + S.pc.st.afi * 0.4); };
  E.rango = function () {
    var n = S.pc.nivel, r = W.rangos[0];
    for (var i = 0; i < W.rangos.length; i++) if (n >= W.rangos[i].min && n <= W.rangos[i].max) r = W.rangos[i];
    return r;
  };
  E.xpSiguiente = function (nv) { return Math.round(55 * Math.pow(nv || S.pc.nivel, 1.75)); };
  E.dom = function (id) { // dominio de escuela o rama
    if (S.mag.esc[id] != null) return S.mag.esc[id];
    if (S.mag.ramas[id] != null) return S.mag.ramas[id];
    return 0;
  };
  E.dinero = function (c) {
    c = (c == null ? S.pc.dinero : c);
    var co = Math.floor(c / 240), r = c % 240, mp = Math.floor(r / 12), pc = r % 12;
    var out = [];
    if (co) out.push(co + ' co');
    if (mp) out.push(mp + ' mp');
    if (pc || !out.length) out.push(pc + ' pc');
    return out.join(' ');
  };
  E.getS = function () { return S; };
  E.setS = function (st) { S = st; };

  /* ═════════ 5. REGISTRO Y CAMBIOS ═════════ */
  var _cambios = [];
  function delta(el, antes, ahora) {
    if (antes === ahora) return;
    _cambios.push({ el: el, a: antes, b: ahora });
  }
  function abrirCambios() { _cambios = []; }
  function cerrarCambios() { var c = _cambios; _cambios = []; return c; }
  E._ab = abrirCambios; E._cer = cerrarCambios; E._delta = delta;
  E.log = function (tipo, txt, cambios) {
    S.log.push({ f: JSON.parse(JSON.stringify(S.fecha)), tipo: tipo, txt: txt, c: cambios || [] });
    if (S.log.length > 400) S.log.splice(0, S.log.length - 400);
  };

  function setHp(v) { var a = S.pc.hp; S.pc.hp = Math.max(0, Math.min(E.hpMax(), Math.round(v * 10) / 10)); delta('Vitalidad', a, S.pc.hp); }
  function setMana(v) { var a = S.pc.mana; S.pc.mana = Math.max(0, Math.min(E.manaMax(), Math.round(v * 10) / 10)); delta('Maná', a, S.pc.mana); }
  E.setHp = setHp; E.setMana = setMana;

  E.darXp = function (n, motivo) {
    if (n <= 0) return [];
    var a = S.pc.xp;
    S.pc.xp += n;
    delta('Experiencia', a, S.pc.xp);
    var subidas = [];
    while (S.pc.xp >= E.xpSiguiente() && S.pc.nivel < 100) {
      var gate = E.rango();
      if (S.pc.nivel === gate.max && !S.pc.pruebas[gate.i]) {
        S.pc.bloqueoRango = gate;
        break; // necesita superar la prueba de rango
      }
      S.pc.xp -= E.xpSiguiente();
      S.pc.nivel++;
      S.pc.bonos.hp = (S.pc.bonos.hp || 0);
      subidas.push(S.pc.nivel);
      delta('Nivel', S.pc.nivel - 1, S.pc.nivel);
      setHp(E.hpMax()); setMana(S.pc.mana + 4);
    }
    if (subidas.length) E.log('nivel', 'Nivel ' + subidas[subidas.length - 1] + ' alcanzado (' + motivo + ').');
    return subidas;
  };

  // Progreso de dominio con rendimientos decrecientes
  E.subirDom = function (id, puntos) {
    var esEsc = S.mag.esc[id] != null;
    var cur = E.dom(id);
    var freno = 1 - Math.min(0.85, cur / 115);
    var ganado = Math.round(puntos * freno * 10) / 10;
    if (ganado <= 0) ganado = 0.1;
    var nuevo = Math.min(100, Math.round((cur + ganado) * 10) / 10);
    if (esEsc) S.mag.esc[id] = nuevo; else S.mag.ramas[id] = nuevo;
    delta('Dominio ' + E.nombreDe(id), cur, nuevo);
    return nuevo - cur;
  };
  E.nombreDe = function (id) {
    var i;
    for (i = 0; i < W.escuelas.length; i++) if (W.escuelas[i].id === id) return W.escuelas[i].n;
    for (i = 0; i < W.ramas.length; i++) if (W.ramas[i].id === id) return W.ramas[i].n;
    for (i = 0; i < W.stats.length; i++) if (W.stats[i].id === id) return W.stats[i].n;
    return id;
  };
  // Entrenamiento de estadísticas
  E.subirStat = function (id, puntos) {
    var st = S.pc.st, pr = S.pc.prog;
    var cur = st[id];
    var freno = 1 - Math.min(0.9, (cur - 5) / 60);
    pr[id] = (pr[id] || 0) + puntos * freno;
    var ganados = 0;
    while (pr[id] >= 100) { pr[id] -= 100; st[id] = Math.round((st[id] + 1) * 100) / 100; ganados++; }
    if (ganados) delta(E.nombreDe(id), cur, st[id]);
    return ganados;
  };

  /* ═════════ 6. CONOCIMIENTO ═════════ */
  E.conoce = function (cat, id) { return !!(S.conoc[cat] && S.conoc[cat][id]); };
  E.descubrir = function (cat, id, nota) {
    if (!S.conoc[cat]) S.conoc[cat] = {};
    if (S.conoc[cat][id]) return false;
    S.conoc[cat][id] = true;
    var nombre = id;
    if (cat === 'lug') { var l = E.lugar(id); nombre = l ? l.n : id; }
    if (cat === 'npc') { var p = E.npcDef(id); nombre = p ? p.n : id; }
    if (cat === 'saber') { for (var i = 0; i < W.saber.length; i++) if (W.saber[i].id === id) nombre = W.saber[i].t; }
    _cambios.push({ el: 'Descubrimiento', a: '—', b: nombre + (nota ? ' (' + nota + ')' : '') });
    E.log('descubrimiento', 'Descubierto: ' + nombre);
    return true;
  };
  E.lugar = function (id) { for (var i = 0; i < W.lugares.length; i++) if (W.lugares[i].id === id) return W.lugares[i]; return null; };
  E.npcDef = function (id) { for (var i = 0; i < W.npcs.length; i++) if (W.npcs[i].id === id) return W.npcs[i]; return null; };
  E.polDef = function (id) { for (var i = 0; i < W.polities.length; i++) if (W.polities[i].id === id) return W.polities[i]; return null; };
  E.compDef = function (id) { for (var i = 0; i < W.comp.length; i++) if (W.comp[i].id === id) return W.comp[i]; return null; };
  E.objDef = function (id) { for (var i = 0; i < W.objetos.length; i++) if (W.objetos[i].id === id) return W.objetos[i]; return null; };
  E.bestDef = function (id) { for (var i = 0; i < W.bestiario.length; i++) if (W.bestiario[i].id === id) return W.bestiario[i]; return null; };
  E.orgDef = function (id) { for (var i = 0; i < W.orgs.length; i++) if (W.orgs[i].id === id) return W.orgs[i]; return null; };
  E.invDef = function (id) { for (var i = 0; i < W.investigaciones.length; i++) if (W.investigaciones[i].id === id) return W.investigaciones[i]; return null; };

  E.npcsEn = function (locId) {
    var out = [];
    for (var k in S.npcs) {
      if (S.npcs[k].loc === locId && S.npcs[k].vivo) {
        var d = E.npcDef(k);
        if (d) out.push({ id: k, def: d, est: S.npcs[k], conocido: E.conoce('npc', k) });
      }
    }
    return out;
  };
  E.rutasDe = function (locId) {
    var out = [];
    for (var i = 0; i < W.rutas.length; i++) {
      var r = W.rutas[i];
      if (r.a === locId) out.push({ id: r.b, h: r.h, r: r.r });
      else if (r.b === locId) out.push({ id: r.a, h: r.h, r: r.r });
    }
    return out.filter(function (x) { return E.conoce('lug', x.id); });
  };

  /* ═════════ 7. INVENTARIO ═════════ */
  E.tiene = function (id, q) { return (S.inv[id] || 0) >= (q || 1) || (S.comp[id] || 0) >= (q || 1); };
  E.addItem = function (id, q) {
    q = q == null ? 1 : q;
    var def = E.objDef(id);
    if (def) { var a = S.inv[id] || 0; S.inv[id] = a + q; delta('Objeto: ' + def.n, a, S.inv[id]); return true; }
    var c = E.compDef(id);
    if (c) { var b = S.comp[id] || 0; S.comp[id] = b + q; delta('Componente: ' + c.n, b, S.comp[id]); return true; }
    return false;
  };
  E.quitarItem = function (id, q) {
    q = q == null ? 1 : q;
    if ((S.inv[id] || 0) >= q) { var a = S.inv[id]; S.inv[id] -= q; if (!S.inv[id]) delete S.inv[id]; delta('Objeto: ' + E.objDef(id).n, a, S.inv[id] || 0); return true; }
    if ((S.comp[id] || 0) >= q) { var b = S.comp[id]; S.comp[id] -= q; if (!S.comp[id]) delete S.comp[id]; delta('Componente: ' + E.compDef(id).n, b, S.comp[id] || 0); return true; }
    return false;
  };
  E.pagar = function (cobres) {
    if (S.pc.dinero < cobres) return false;
    var a = S.pc.dinero; S.pc.dinero -= cobres; delta('Dinero', E.dinero(a), E.dinero(S.pc.dinero)); return true;
  };
  E.cobrar = function (cobres) { var a = S.pc.dinero; S.pc.dinero += cobres; delta('Dinero', E.dinero(a), E.dinero(S.pc.dinero)); };
  E.pesoInv = function () {
    var p = 0, k;
    for (k in S.inv) { var d = E.objDef(k); if (d) p += (d.peso || 0) * S.inv[k]; }
    for (k in S.comp) p += 0.3 * S.comp[k];
    return Math.round(p * 10) / 10;
  };
  E.cargaMax = function () { return Math.round(8 + S.pc.st.fue * 1.8); };

  /* ═════════ 8. NUEVA PARTIDA ═════════ */
  E.nuevaPartida = function (seed) {
    S = {
      v: 1, seed: seed || 20471247, rs: (seed || 20471247) >>> 0, turno: 0,
      fecha: { a: 1247, m: 10, d: 19, h: 22, min: 40 },
      pc: {
        nombre: 'Maikel', edad: 18, clase: 'Nigromante', origen: 'Encontró un grimorio prohibido',
        nivel: 1, xp: 0, dinero: 86, loc: 'osa', hp: 0, mana: 0,
        st: { vit: 9, man: 12, mrg: 1.1, fue: 8, vel: 10, res: 9, int: 15, vol: 13, per: 11, ctl: 6, afi: 10, car: 9, sue: 7 },
        prog: {}, bonos: {}, pruebas: {}, bloqueoRango: null,
        cond: 'Despierto, cansado', efectos: [], heridas: [],
        hambre: 20, descanso: 45, cordura: 100,
        notoriedad: 0, sospecha: 8, reputacion: { arcana: 0, popular: 2, criminal: 0 },
        titulos: [], principios: [], idiomas: { comun: 100, thanel: 4 }
      },
      mag: { esc: {}, ramas: {} },
      hechizos: [], criaturas: [], critSeq: 0,
      inv: { codice: 1, cuch_barb: 1, linterna: 1, aguja_hilo: 1, libreta: 1, manta: 1, vela_sebo: 3, pan_duro: 2, odre: 1 },
      comp: { hueso_hum: 1, hueso_peq: 4, sal_osa: 3, tiza_osa: 2, mortaja_vieja: 2, colmillo: 1 },
      codice: { leg: 12, mortajas: [true, false, false, false, false, false, false, false, false], estudios: 0, llaves: [] },
      proyectos: [], hechos: [], recetas: [],
      conoc: { lug: {}, npc: {}, saber: {}, esc: {}, best: {}, org: {}, pol: {}, dim: {}, cont: {} },
      npcs: {}, pol: {}, org: null, ciudades: [],
      sucesos: [], rumores: [], log: [], objetivos: [], flags: {}, combate: null,
      mundo: { guerras: [], alianzas: [], precios: {}, anio_ultimo: 1247 }
    };
    // escuelas: todas existen, ninguna dominada. Nigromancia abierta por el Códice.
    var i;
    for (i = 0; i < W.escuelas.length; i++) S.mag.esc[W.escuelas[i].id] = 0;
    S.mag.esc.nigro = 6;
    for (i = 0; i < W.ramas.length; i++) S.mag.ramas[W.ramas[i].id] = 0;
    S.mag.ramas.invo_nm = 4; S.mag.ramas.thanat = 7;
    // afinidades: ocultas hasta descubrirse
    S.mag.afin = {};
    var afinBase = { nigro: 'alta', espiritu: 'media', almas: 'alta', hielo: 'media', sombra: 'media', fuego: 'baja', sagrada: 'nula', natura: 'baja' };
    for (i = 0; i < W.escuelas.length; i++) {
      var id = W.escuelas[i].id;
      S.mag.afin[id] = { nivel: afinBase[id] || pick(['baja', 'media', 'baja', 'media', 'alta', 'nula']), descubierta: false };
    }
    S.mag.afin.nigro.descubierta = true;
    // potencias
    for (i = 0; i < W.polities.length; i++) {
      var p = W.polities[i];
      S.pol[p.id] = { pob: p.pob, tes: p.tes, est: p.est, mil: p.mil, grano: 50, guerra: [], rel: {}, metaProg: 0 };
      if (p.conocido) S.conoc.pol[p.id] = true;
    }
    // relaciones iniciales
    S.pol.cal.rel = { mor: -45, fon: 20, ash: 15, llb: -10, ver: 10 };
    S.pol.mor.rel = { cal: -45, fon: 10, ash: 25, llb: 5 };
    S.pol.llb.rel = { cal: -10, mor: 5, fon: -20, nvd: -80 };
    S.pol.fon.rel = { cal: 20, mor: 10, llb: -20, nvd: -15 };
    // organizaciones
    S.orgs = {};
    for (i = 0; i < W.orgs.length; i++) {
      var o = W.orgs[i];
      S.orgs[o.id] = { poder: o.poder, inf: o.inf, metaProg: 0, miembros: Math.round(o.poder * 3.2) };
      if (o.conocido) S.conoc.org[o.id] = true;
    }
    // npcs
    for (i = 0; i < W.npcs.length; i++) {
      var n = W.npcs[i];
      S.npcs[n.id] = { op: n.op || 0, salud: n.salud == null ? 80 : n.salud, loc: n.loc, vivo: true, edad: n.edad, metaProg: 0, memoria: [], estado: 'normal' };
      if (n.con) S.conoc.npc[n.id] = true;
    }
    // lugares y saber conocidos
    for (i = 0; i < W.lugares.length; i++) if (W.lugares[i].con) S.conoc.lug[W.lugares[i].id] = true;
    for (i = 0; i < W.saber.length; i++) if (W.saber[i].con) S.conoc.saber[W.saber[i].id] = true;
    for (i = 0; i < W.continentes.length; i++) if (W.continentes[i].conocido) S.conoc.cont[W.continentes[i].id] = true;
    for (i = 0; i < W.dimensiones.length; i++) if (W.dimensiones[i].conocido) S.conoc.dim[W.dimensiones[i].id] = true;
    S.conoc.best = { rata_osa: true, perro_fer: true, esq_simple: true, cuervo_vel: true };
    // hechizo incompleto inicial
    S.hechizos.push({
      id: 'rescoldo_palido', n: 'Prender el Rescoldo Pálido', esc: ['nigro'], rama: 'invo_nm',
      efecto: 'percibir', rango: 'Aprendiz', nivel: 1, coste: 5, pot: 2, alcance: 'Tacto / 2 pasos',
      dur: 'Instantáneo o unos minutos', act: '1 minuto de concentración', dif: 48,
      req: 'Nigromancia ≥ 5 · contacto con restos', sec: 'Incompleta: 25% de probabilidad de fallo con retroceso (1d6 de daño espiritual)',
      evol: ['Completarla mediante investigación', 'Versión a distancia', 'Versión persistente'],
      desc: 'Lo único legible de la Primera Mortaja. Permite percibir el residuo de muerte en unos restos y, si el residuo es suficiente, prender en ellos un movimiento breve.',
      origen: 'Códice de las Nueve Mortajas, Primera Mortaja', incompleto: true, usos: 0
    });
    S.objetivos.push({ id: 'o1', t: 'Decidir qué hacer con el Códice', estado: 'abierto', nota: 'Nadie te ha dado esta misión. Es tuya.' });
    S.pc.hp = E.hpMax(); S.pc.mana = E.manaMax();
    E.log('inicio', 'Comienza la crónica de Maikel en Vadosombrío.');
    E.generarRumores(4);
    return S;
  };

  window.TS = window.TS || {};
  window.TS.E = E;
})();

/* ═════════ Tiempo, simulación del mundo autónomo, rumores ═════════ */
(function () {
  var W = window.TS.W, E = window.TS.E;
  function S() { return E.getS(); }
  var C = W.cal;

  /* ── Avance del tiempo ── */
  E.avanzar = function (minutos, opts) {
    opts = opts || {};
    var s = S(), f = s.fecha, ev = [];
    var restantes = Math.max(0, Math.round(minutos));
    while (restantes > 0) {
      var paso = Math.min(restantes, 60 - f.min);
      f.min += paso; restantes -= paso;
      var horasFrac = paso / 60;
      // maná
      var regen = E.regenHora() * horasFrac * (opts.durmiendo ? 3 : opts.descansando ? 1.8 : 1);
      E.setMana(s.pc.mana + regen);
      if (opts.durmiendo) {
        E.setHp(s.pc.hp + E.hpMax() * 0.02 * horasFrac);
        s.pc.descanso = Math.min(100, s.pc.descanso + 12 * horasFrac);
      } else {
        s.pc.descanso = Math.max(0, s.pc.descanso - 2.2 * horasFrac);
      }
      s.pc.hambre = Math.min(100, s.pc.hambre + 2.0 * horasFrac);
      if (f.min >= 60) { f.min -= 60; f.h++; }
      while (f.h >= 24) { f.h -= 24; f.d++; ev = ev.concat(nuevoDia()); }
      while (f.d > C.diasMes) { f.d -= C.diasMes; f.m++; ev = ev.concat(nuevoMes()); }
      while (f.m > C.meses) { f.m -= C.meses; f.a++; ev = ev.concat(nuevoAnio()); }
    }
    s.pc.cond = condicion();
    return ev;
  };

  function condicion() {
    var s = S(), c = [];
    if (s.pc.hp <= 0) return 'Inconsciente / muriendo';
    if (s.pc.hp < E.hpMax() * 0.3) c.push('malherido');
    else if (s.pc.hp < E.hpMax() * 0.7) c.push('herido');
    if (s.pc.descanso < 20) c.push('agotado');
    else if (s.pc.descanso < 45) c.push('cansado');
    if (s.pc.hambre > 80) c.push('hambriento');
    if (s.pc.mana < E.manaMax() * 0.15) c.push('vacío de maná');
    if (s.pc.cordura < 60) c.push('mente dañada');
    for (var i = 0; i < s.pc.efectos.length; i++) c.push(s.pc.efectos[i].n);
    return c.length ? c.join(', ') : 'En forma';
  }
  E.condicion = condicion;

  /* ── Día nuevo ── */
  function nuevoDia() {
    var s = S(), ev = [];
    // efectos temporales
    s.pc.efectos = s.pc.efectos.filter(function (e) { e.dias = (e.dias || 1) - 1; return e.dias > 0; });
    // devolver estadísticas mermadas temporalmente
    if (s.pc.bonos.pendiente && s.pc.bonos.pendiente.length) {
      s.pc.bonos.pendiente = s.pc.bonos.pendiente.filter(function (b) {
        b.dias--;
        if (b.dias <= 0) { s.pc.st[b.st] = Math.round((s.pc.st[b.st] + b.v) * 100) / 100; return false; }
        return true;
      });
    }
    // hambre y privación
    if (s.pc.hambre > 85) { E.setHp(s.pc.hp - 4); }
    if (s.pc.descanso < 15) { s.pc.cordura = Math.max(0, s.pc.cordura - 2); }
    // criaturas: mantenimiento
    var manaMant = 0, perdidas = [];
    for (var i = 0; i < s.criaturas.length; i++) {
      var cr = s.criaturas[i];
      if (cr.estado === 'destruida' || cr.estado === 'inactiva') continue;
      manaMant += cr.mant || 0;
      // lealtad deriva
      if (cr.int > 45 && cr.lealtad < 40) cr.lealtad -= 1;
      if (cr.lealtad <= 0 && cr.estado !== 'rebelde') { cr.estado = 'rebelde'; ev.push({ t: 'Criatura rebelde', txt: cr.n + ' ha dejado de obedecerte.', tipo: 'peligro' }); }
    }
    if (manaMant > 0) {
      if (s.pc.mana >= manaMant) E.setMana(s.pc.mana - manaMant);
      else {
        var falta = manaMant - s.pc.mana; E.setMana(0);
        for (var j = 0; j < s.criaturas.length; j++) {
          var c2 = s.criaturas[j];
          if (c2.estado === 'activa' && falta > 0) {
            c2.estado = 'inactiva'; falta -= (c2.mant || 0);
            ev.push({ t: 'Colapso de mantenimiento', txt: c2.n + ' se ha desplomado: no había maná para sostenerla.', tipo: 'peligro' });
          }
        }
      }
    }
    // investigación en curso con asistentes
    for (var k = 0; k < s.proyectos.length; k++) {
      var p = s.proyectos[k];
      if (p.estado === 'activo' && p.asistentes) p.prog += p.asistentes * 0.4;
    }
    // notoriedad se enfría muy despacio
    if (s.pc.notoriedad > 0 && E.rnd() < 0.15) s.pc.notoriedad = Math.max(0, s.pc.notoriedad - 1);
    // sospecha del Priorato crece si hay residuo acumulado
    if (s.pc.notoriedad > 20 && E.rnd() < 0.25) s.pc.sospecha = Math.min(100, s.pc.sospecha + 1);
    // muerte fuera de combate
    if (s.pc.hp <= 0 && !s.pc.muerto) {
      if (s.flags.ancla) {
        s.flags.ancla = false;
        E.setHp(Math.round(E.hpMax() * 0.25));
        s.pc.cordura = Math.max(0, s.pc.cordura - 20);
        ev.push({ t: 'El ancla se consume', txt: 'Te has desplomado y el ancla espiritual te ha devuelto. Ya no existe.', tipo: 'muerte' });
      } else {
        s.pc.muerto = true;
        ev.push({ t: 'Muerte', txt: 'Maikel ha muerto: heridas, hambre o agotamiento. El mundo sigue sin él.', tipo: 'muerte' });
        E.log('muerte', 'Maikel muere de agotamiento o heridas en ' + E.lugar(s.pc.loc).n + '.');
      }
    }
    // mundo
    ev = ev.concat(simularMundoDia());
    // organización / ciudades del jugador
    ev = ev.concat(tickDominios());
    return ev;
  }

  function nuevoMes() {
    var s = S(), ev = [];
    // demografía y economía de todas las potencias
    for (var id in s.pol) {
      var st = s.pol[id], def = E.polDef(id);
      if (!def || def.pob === 0) continue;
      var comida = (def.recursos.grano / 50) * (st.grano / 50);
      var seguridad = st.est / 60;
      var nat = 0.0028 * Math.min(1.5, comida) * (st.est > 35 ? 1 : 0.7);
      var mor = 0.0021 * (comida < 0.8 ? 1.6 : 1) * (st.est < 30 ? 1.4 : 1) * (st.guerra.length ? 1.25 : 1);
      var nac = Math.round(st.pob * nat), mue = Math.round(st.pob * mor);
      var mig = Math.round(st.pob * 0.0004 * (seguridad - 1));
      var antes = st.pob;
      st.pob = Math.max(100, st.pob + nac - mue + mig);
      st.nac = nac; st.mue = mue; st.mig = mig;
      // economía
      var ingr = Math.round(st.pob * 0.011 * (st.est / 55));
      var gasto = Math.round(st.pob * 0.009 + st.mil * 70 + (st.guerra.length ? st.mil * 90 : 0));
      st.tes += ingr - gasto;
      st.ingr = ingr; st.gasto = gasto;
      if (st.tes < -20000) { st.est = Math.max(5, st.est - 4); }
      // grano estacional
      var est = E.estacion(s.fecha).n;
      st.grano = Math.max(5, Math.min(100, st.grano + (est === 'Declive' ? 14 : est === 'Mortaja' ? -9 : est === 'Deshielo' ? -4 : 2)));
      if (id === 'cal' && Math.abs(st.pob - antes) > 0) { /* registrado */ }
    }
    // población local de los lugares de la Marca
    for (var i = 0; i < W.lugares.length; i++) {
      var l = W.lugares[i];
      if (!l.pob || l.pob < 5) continue;
      if (!s.locPob) s.locPob = {};
      if (s.locPob[l.id] == null) s.locPob[l.id] = l.pob;
      var pe = s.pol[l.pol] ? s.pol[l.pol].est : 50;
      var dr = s.locPob[l.id] * (0.0022 - 0.0019) + (pe < 40 ? -s.locPob[l.id] * 0.0015 : s.locPob[l.id] * 0.0008);
      s.locPob[l.id] = Math.max(0, Math.round(s.locPob[l.id] + dr));
    }
    ev.push({ t: 'Cambio de mes', txt: 'Comienza ' + C.nombresMes[s.fecha.m - 1] + '.', tipo: 'calendario', silencioso: true });
    return ev;
  }

  function nuevoAnio() {
    var s = S(), ev = [];
    s.pc.edad++;
    for (var id in s.npcs) {
      var n = s.npcs[id];
      if (!n.vivo) continue;
      if (n.edad != null) n.edad++;
      var def = E.npcDef(id);
      if (n.edad && n.edad > 55) {
        var riesgo = (n.edad - 55) * 0.008 + (100 - n.salud) * 0.0015;
        if (E.rnd() < riesgo) {
          n.vivo = false; n.estado = 'muerto';
          ev.push({ t: 'Muerte', txt: (def ? def.n : id) + ' ha muerto.', tipo: 'muerte', visib: n.loc });
        }
      }
    }
    ev.push({ t: 'Año nuevo', txt: 'Comienza el año ' + s.fecha.a + ' de la ' + C.eraNombre + '.', tipo: 'calendario' });
    return ev;
  }

  /* ── Simulación diaria del mundo ── */
  function simularMundoDia() {
    var s = S(), ev = [];
    // deriva de estabilidad y progreso de metas
    for (var id in s.pol) {
      var st = s.pol[id];
      st.est += (st.tes > 0 ? 0.04 : -0.05) + (st.guerra.length ? -0.12 : 0.02);
      st.est = Math.max(3, Math.min(97, st.est));
      st.metaProg += E.rnd() * 0.6;
    }
    for (var oid in s.orgs) { s.orgs[oid].metaProg += E.rnd() * 0.7 * (s.orgs[oid].poder / 50); }
    // sucesos: ~0.9 por día en todo el mundo
    var n = E.rnd() < 0.55 ? 1 : (E.rnd() < 0.25 ? 2 : 0);
    for (var i = 0; i < n; i++) {
      var e = generarSuceso();
      if (e) ev.push(e);
    }
    // NPC: agenda
    ev = ev.concat(tickNpcs());
    // rival: Kesla busca el Códice
    ev = ev.concat(tickRival());
    return ev;
  }

  function generarSuceso() {
    var s = S();
    var plantilla = E.pick ? pesado(W.sucesos) : W.sucesos[0];
    var polIds = Object.keys(s.pol);
    var pol = E.pick(polIds), pol2 = E.pick(polIds);
    var pdef = E.polDef(pol), p2def = E.polDef(pol2);
    var st = s.pol[pol];
    var txt = plantilla.txt, tipo = 'mundo', visib = null;
    var locs = W.lugares.filter(function (l) { return l.pol === pol; });
    var loc = locs.length ? E.pick(locs) : null;

    if (plantilla.especial === 'guerra') {
      if (pol === pol2 || !pdef || !p2def || st.guerra.indexOf(pol2) >= 0) return null;
      var rel = (st.rel[pol2] || 0);
      if (rel > -30 || st.mil < 40) return null;
      st.guerra.push(pol2); s.pol[pol2].guerra.push(pol);
      st.rel[pol2] = -100; s.pol[pol2].rel[pol] = -100;
      s.mundo.guerras.push({ a: pol, b: pol2, desde: JSON.parse(JSON.stringify(s.fecha)) });
      txt = pdef.n + ' declara la guerra a ' + p2def.n + '.';
      tipo = 'guerra';
    } else if (plantilla.especial === 'batalla') {
      if (!st.guerra.length) return null;
      var enem = st.guerra[0], edef = E.polDef(enem);
      var fa = st.mil * (0.7 + E.rnd() * 0.6), fb = s.pol[enem].mil * (0.7 + E.rnd() * 0.6);
      var gana = fa > fb ? pol : enem, pierde = fa > fb ? enem : pol;
      s.pol[pierde].mil = Math.max(5, s.pol[pierde].mil - E.ri(3, 9));
      s.pol[pierde].est = Math.max(3, s.pol[pierde].est - E.ri(2, 6));
      s.pol[gana].mil = Math.max(5, s.pol[gana].mil - E.ri(1, 4));
      txt = 'Batalla entre ' + pdef.n + ' y ' + edef.n + '. Vence ' + E.polDef(gana).n + '.';
      tipo = 'guerra';
    } else if (plantilla.especial === 'alianza') {
      if (pol === pol2 || (st.rel[pol2] || 0) < 10) return null;
      st.rel[pol2] = Math.min(100, (st.rel[pol2] || 0) + 25);
      s.pol[pol2].rel[pol] = st.rel[pol2];
      txt = pdef.n + ' y ' + p2def.n + ' firman un pacto.';
    } else if (plantilla.especial === 'org') {
      var o = E.pick(W.orgs), ost = s.orgs[o.id];
      if (ost.metaProg < 30) return null;
      ost.metaProg = 0; ost.poder = Math.min(100, ost.poder + E.ri(1, 3));
      txt = o.n + ': ' + E.pick(o.metas) + ' — avance conseguido.';
      tipo = 'organizacion';
    } else if (plantilla.especial === 'npc') {
      return null; // los NPC se gestionan en tickNpcs
    } else if (plantilla.especial === 'caza') {
      txt = 'La Orden del Sello Blanco abre proceso contra ' + E.ri(1, 4) + ' personas en ' + (loc ? loc.reg : pdef.n) + '.';
      if (loc && loc.reg === 'Marca de Grisbrial') { s.pc.sospecha = Math.min(100, s.pc.sospecha + 2); tipo = 'peligro'; }
    } else if (plantilla.especial === 'tumulo') {
      if (!s.flags.tumulosAbiertos) s.flags.tumulosAbiertos = 6;
      if (s.flags.tumulosAbiertos >= 7) return null;
      s.flags.tumulosAbiertos++;
      txt = 'Los rastreadores han abierto otro túmulo en el Páramo de los Siete Túmulos (' + s.flags.tumulosAbiertos + ' de 7).';
      tipo = 'peligro';
    } else if (plantilla.especial === 'precio') {
      var rec = E.pick(['grano', 'hierro', 'madera', 'sal', 'componentes']);
      var dir = E.rnd() < 0.5 ? -1 : 1;
      s.mundo.precios[rec] = Math.max(0.5, Math.min(2.5, (s.mundo.precios[rec] || 1) + dir * (0.05 + E.rnd() * 0.2)));
      txt = 'El precio de ' + rec + ' ' + (dir > 0 ? 'sube' : 'baja') + ' en los mercados de ' + (loc ? loc.reg : pdef.n) + '.';
      tipo = 'economia';
    } else if (plantilla.especial === 'velo') {
      if (E.ciclo('velo', s.fecha).fase !== 'Velo Delgado') return null;
      txt = 'Las lámparas se apagan solas de noche en ' + (loc ? loc.n : 'la comarca') + '.';
      tipo = 'magia';
    } else if (plantilla.especial === 'bestias') {
      txt = 'Pastores de ' + (loc ? loc.reg : pdef.n) + ' informan de criaturas bajando del páramo.';
      tipo = 'peligro';
    } else {
      txt = txt.replace('{pol}', pdef ? pdef.n : '—').replace('{pol2}', p2def ? p2def.n : '—')
        .replace('{reg}', loc ? loc.reg : (pdef ? pdef.n : '—')).replace('{loc}', loc ? loc.n : (pdef ? pdef.cap : '—'))
        .replace('{lider}', pdef && pdef.lider && E.npcDef(pdef.lider) ? E.npcDef(pdef.lider).n : 'el gobierno')
        .replace('{org}', E.pick(W.orgs).n).replace('{rec}', E.pick(['grano', 'hierro', 'sal']));
    }
    // efectos numéricos
    if (plantilla.ef) {
      if (plantilla.ef.est != null) st.est = Math.max(3, Math.min(97, st.est + plantilla.ef.est));
      if (plantilla.ef.tes != null) st.tes += plantilla.ef.tes;
      if (plantilla.ef.pob != null) st.pob = Math.max(100, Math.round(st.pob * (1 + plantilla.ef.pob)));
      if (plantilla.ef.grano != null) st.grano = Math.max(5, st.grano + plantilla.ef.grano);
    }
    // ¿cuándo llega la noticia al jugador?
    var retraso = 0;
    var locJug = E.lugar(s.pc.loc);
    var mismaRegion = loc && locJug && loc.reg === locJug.reg;
    if (plantilla.alc === 'local') retraso = mismaRegion ? E.ri(0, 2) : 999;
    else if (plantilla.alc === 'regional') retraso = mismaRegion ? E.ri(0, 1) : E.ri(6, 20);
    else retraso = mismaRegion ? E.ri(1, 4) : E.ri(5, 25);
    var suceso = {
      id: 's' + (s.sucesos.length + 1), f: JSON.parse(JSON.stringify(s.fecha)), t: plantilla.t, txt: txt,
      tipo: tipo, pol: pol, llega: E.diaAbsoluto(s.fecha) + retraso, visto: false, alc: plantilla.alc
    };
    s.sucesos.push(suceso);
    if (s.sucesos.length > 220) s.sucesos.splice(0, 60);
    return suceso;
  }

  function pesado(arr) {
    var tot = 0, i;
    for (i = 0; i < arr.length; i++) tot += (arr[i].p || 1);
    var r = E.rnd() * tot;
    for (i = 0; i < arr.length; i++) { r -= (arr[i].p || 1); if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  }

  /* ── NPC con vida propia ── */
  function tickNpcs() {
    var s = S(), ev = [];
    var ids = Object.keys(s.npcs);
    // tres NPC actúan por día
    for (var k = 0; k < 3; k++) {
      var id = E.pick(ids), n = s.npcs[id], def = E.npcDef(id);
      if (!n.vivo || !def) continue;
      n.metaProg += E.rnd() * (def.pot ? 1 + def.pot / 20 : 1);
      // salud
      if (def.salud != null && def.salud < 50) n.salud = Math.max(0, n.salud - (E.rnd() < 0.2 ? 1 : 0));
      if (n.salud <= 0) {
        n.vivo = false; n.estado = 'muerto';
        ev.push({ t: 'Muerte', txt: def.n + ' ha muerto.', tipo: 'muerte', visib: n.loc, f: JSON.parse(JSON.stringify(s.fecha)) });
        continue;
      }
      // movimiento ocasional
      if (E.rnd() < 0.07 && def.loc) {
        var rutas = W.rutas.filter(function (r) { return r.a === n.loc || r.b === n.loc; });
        if (rutas.length && E.rnd() < 0.5) {
          var r = E.pick(rutas);
          n.loc = (r.a === n.loc ? r.b : r.a);
        } else n.loc = def.loc;
      }
      // meta cumplida
      if (n.metaProg >= 40) {
        n.metaProg = 0;
        var meta = def.metas && def.metas.length ? E.pick(def.metas) : null;
        if (meta) {
          var e = {
            id: 'n' + id + s.sucesos.length, f: JSON.parse(JSON.stringify(s.fecha)),
            t: 'Asunto de ' + def.n, txt: def.n + ' avanza en lo suyo: ' + meta.toLowerCase() + '.',
            tipo: 'npc', llega: E.diaAbsoluto(s.fecha) + (n.loc === s.pc.loc ? 0 : E.ri(1, 6)), visto: false, alc: 'local', npc: id
          };
          if (E.conoce('npc', id)) { s.sucesos.push(e); ev.push(e); }
        }
      }
    }
    return ev;
  }

  function tickRival() {
    var s = S(), ev = [];
    if (!s.flags.keslaProg) s.flags.keslaProg = 0;
    var vel = 0.35 + s.pc.notoriedad * 0.02;
    s.flags.keslaProg += E.rnd() * vel;
    var hitos = [
      [20, 'Alguien ha estado preguntando en Grisbrial por un libro de nueve cuadernillos.'],
      [45, 'Han aparecido marcas de tiza en el muro del cementerio de Vadosombrío. No son de los niños.'],
      [70, 'Un carro cerrado ha pasado el vado de noche, con permiso que el alguacil no recuerda haber firmado.'],
      [95, 'Hay una mujer joven preguntando por el sepulturero del osario, y no ha dado nombre.']
    ];
    for (var i = 0; i < hitos.length; i++) {
      var h = hitos[i];
      if (s.flags.keslaProg >= h[0] && !s.flags['kesla' + h[0]]) {
        s.flags['kesla' + h[0]] = true;
        var e = {
          id: 'k' + h[0], f: JSON.parse(JSON.stringify(s.fecha)), t: 'Rumor inquietante', txt: h[1],
          tipo: 'peligro', llega: E.diaAbsoluto(s.fecha) + E.ri(0, 2), visto: false, alc: 'local'
        };
        s.sucesos.push(e); ev.push(e);
      }
    }
    return ev;
  }

  /* ── Organización y ciudades del jugador ── */
  function tickDominios() {
    var s = S(), ev = [];
    if (s.org) {
      s.org.dias = (s.org.dias || 0) + 1;
      if (s.org.dias % 30 === 0) {
        var ingr = Math.round(s.org.miembros * 1.6 + (s.org.influencia || 0) * 2);
        var gasto = Math.round(s.org.miembros * 2.2 + (s.org.instalaciones || []).length * 15);
        s.org.tesoro = (s.org.tesoro || 0) + ingr - gasto;
        s.org.ingr = ingr; s.org.gasto = gasto;
        if (s.org.tesoro < 0) {
          s.org.moral = Math.max(0, (s.org.moral == null ? 60 : s.org.moral) - 8);
          ev.push({ t: 'Tesorería en rojo', txt: s.org.n + ' no ha podido pagar a todos este mes.', tipo: 'organizacion' });
          if (s.org.moral < 25 && E.rnd() < 0.4) {
            var perd = Math.max(1, Math.round(s.org.miembros * 0.12));
            s.org.miembros -= perd;
            ev.push({ t: 'Deserciones', txt: perd + ' miembros abandonan ' + s.org.n + '.', tipo: 'organizacion' });
          }
        } else if (E.rnd() < 0.5) {
          var nuevos = E.ri(0, Math.max(1, Math.round((s.org.influencia || 1) / 8)));
          if (nuevos) { s.org.miembros += nuevos; ev.push({ t: 'Reclutamiento', txt: nuevos + ' nuevos miembros se unen a ' + s.org.n + '.', tipo: 'organizacion' }); }
        }
      }
    }
    for (var i = 0; i < s.ciudades.length; i++) {
      var c = s.ciudades[i];
      c.dias = (c.dias || 0) + 1;
      if (c.dias % 30 !== 0) continue;
      var comida = c.granjas * 60 - c.pob;
      c.hambre = comida < 0;
      var nac = Math.round(c.pob * (comida > 0 ? 0.0032 : 0.0012));
      var mue = Math.round(c.pob * (comida < 0 ? 0.0045 : 0.0018) * (c.salud ? 0.7 : 1.3));
      var mig = Math.round((c.estabilidad - 50) * 0.6 + (comida > 0 ? 4 : -10));
      c.pob = Math.max(0, c.pob + nac - mue + mig);
      c.ingresos = Math.round(c.pob * 0.9 * (c.impuestos / 10));
      c.gastos = Math.round(c.pob * 0.5 + c.edificios.length * 25 + c.guarnicion * 20);
      c.tesoro += c.ingresos - c.gastos;
      c.estabilidad = Math.max(0, Math.min(100, c.estabilidad + (comida > 0 ? 2 : -6) - (c.impuestos > 12 ? 4 : 0) + (c.tesoro > 0 ? 1 : -3)));
      ev.push({ t: 'Informe mensual de ' + c.n, txt: 'Población ' + c.pob + ' (' + (nac - mue + mig >= 0 ? '+' : '') + (nac - mue + mig) + '), tesoro ' + c.tesoro + ' co, estabilidad ' + Math.round(c.estabilidad) + '%.', tipo: 'ciudad' });
      if (c.estabilidad < 20 && E.rnd() < 0.5) ev.push({ t: 'Descontento', txt: 'Hay conspiraciones abiertas en ' + c.n + '.', tipo: 'peligro' });
    }
    return ev;
  }

  /* ── Rumores y noticias que el jugador puede conocer ── */
  E.generarRumores = function (n) {
    var s = S(), loc = E.lugar(s.pc.loc), pool = [];
    if (loc && loc.rum) pool = pool.concat(loc.rum);
    var vecinos = E.rutasDe(s.pc.loc);
    for (var i = 0; i < vecinos.length; i++) {
      var l = E.lugar(vecinos[i].id);
      if (l && l.rum) pool = pool.concat(l.rum);
    }
    for (var k = 0; k < n && pool.length; k++) {
      var r = E.pick(pool);
      if (s.rumores.indexOf(r) < 0) s.rumores.push(r);
    }
    if (s.rumores.length > 14) s.rumores.splice(0, s.rumores.length - 14);
  };
  // Noticias que ya han llegado y el jugador no ha visto
  E.noticiasNuevas = function () {
    var s = S(), hoy = E.diaAbsoluto(s.fecha), out = [];
    for (var i = 0; i < s.sucesos.length; i++) {
      var e = s.sucesos[i];
      if (!e.visto && e.llega <= hoy && e.llega < 900000) { e.visto = true; out.push(e); }
    }
    return out;
  };
  // Saltos largos de tiempo: se asume rutina (16 h despierto, 8 h de sueño, comer si hay comida)
  E.simularDias = function (n) {
    var s = S(), ev = [];
    for (var i = 0; i < n; i++) {
      ev = ev.concat(E.avanzar(16 * 60));
      if (s.pc.hambre > 55) {
        if ((s.inv.pan_duro || 0) > 0) { E.quitarItem('pan_duro', 1); s.pc.hambre = Math.max(0, s.pc.hambre - 45); }
        else if (s.pc.dinero >= 4) { s.pc.dinero -= 4; s.pc.hambre = Math.max(0, s.pc.hambre - 45); }
      }
      ev = ev.concat(E.avanzar(8 * 60, { durmiendo: true }));
      if (s.pc.muerto) break;
    }
    return ev;
  };
})();

/* ═════════ Acciones del jugador ═════════ */
(function () {
  var W = window.TS.W, E = window.TS.E;
  function S() { return E.getS(); }
  var A = {};
  E.A = A;

  function nueva(titulo) {
    E._ab();
    return { ok: true, titulo: titulo, mec: [], cambios: [], tiempo: 0, mundo: [], ctx: {}, tiradas: [] };
  }
  function cerrar(r) {
    var s = S();
    r.cambios = E._cer();
    s.turno++;
    r.fecha = JSON.parse(JSON.stringify(s.fecha));
    r.noticias = E.noticiasNuevas();
    E.log('accion', r.titulo, r.cambios);
    return r;
  }
  function avanzar(r, min, opts) { r.mundo = r.mundo.concat(E.avanzar(min, opts)); r.tiempo += min; }
  function mod(n, v) { return { n: n, v: Math.round(v) }; }
  E.nuevaRes = nueva; E.cerrarRes = cerrar;

  var recComp = {
    'hueso': 'hueso_hum', 'sal de osario': 'sal_osa', 'mortajas': 'mortaja_vieja', 'hueso antiguo': 'hueso_noble',
    'bronce de túmulo': 'bronce_tum', 'esencias': 'esencia_pena', 'cristal de maná (raro)': 'cristal_man',
    'cristal de maná': 'cristal_man', 'colmillo de huargo': 'colmillo_huargo', 'agalla de roble': 'tinta_agalla',
    'esencia de pena': 'esencia_pena', 'hueso de ballena': 'hueso_bestia', 'hueso real': 'hueso_real',
    'esencia de mando': 'esencia_mando', 'hierro-tumba': 'hierro_tumba', 'hueso de ballena': 'hueso_bestia',
    'pieles': 'cuero', 'juncos': null, 'turba': null, 'madera': null, 'hierbas': null, 'pescado': null,
    'hierro': null, 'carbón': null, 'grano': null, 'lino': null, 'textos': null, 'conocimiento': null
  };

  /* ── VIAJAR ── */
  A.mover = function (destId) {
    var s = S(), r = nueva('Viaje');
    var rutas = E.rutasDe(s.pc.loc);
    var ruta = null;
    for (var i = 0; i < rutas.length; i++) if (rutas[i].id === destId) ruta = rutas[i];
    if (!ruta) { r.ok = false; r.mec.push('No conoces ninguna ruta directa desde aquí hasta ahí.'); return cerrar(r); }
    var dest = E.lugar(destId);
    var carga = E.pesoInv() > E.cargaMax() ? 1.4 : 1;
    var fatiga = s.pc.descanso < 30 ? 1.3 : 1;
    var min = Math.round(ruta.h * 60 * carga * fatiga);
    r.ctx.tipo = 'viaje'; r.ctx.desde = E.lugar(s.pc.loc).n; r.ctx.hasta = dest.n; r.ctx.horas = Math.round(min / 60 * 10) / 10;
    r.mec.push('Distancia: ' + (Math.round(min / 6) / 10) + ' h de camino' + (carga > 1 ? ' (sobrecargado)' : '') + (fatiga > 1 ? ' (cansado)' : ''));
    // incidente
    if (ruta.r > 0) {
      var t = E.tirada(ruta.r, [mod('percepción', s.pc.st.per * 0.8), mod('velocidad', s.pc.st.vel * 0.4)]);
      r.tiradas.push(t); r.mec.push('Riesgo del camino — ' + E.tiradaLinea(t));
      if (t.grado === 'fracaso' || t.grado === 'fracaso_critico') {
        r.ctx.incidente = true;
        var enc = encuentroEn(destId, ruta.r);
        if (enc) { r.ctx.encuentro = enc; r.mec.push('Encuentro en el camino: ' + enc.n + (enc.cant > 1 ? ' ×' + enc.cant : '')); }
      } else if (t.grado === 'critico') {
        r.mec.push('Atajo encontrado: el trayecto se acorta.');
        min = Math.round(min * 0.8);
      }
    }
    avanzar(r, min);
    s.pc.loc = destId;
    E._delta('Ubicación', r.ctx.desde, dest.n);
    s.pc.descanso = Math.max(0, s.pc.descanso - min / 60 * 3.5);
    if (!s.flags['visitado_' + destId]) {
      s.flags['visitado_' + destId] = true;
      E.darXp(10, 'primer viaje a ' + dest.n);
      r.mec.push('+10 XP por llegar por primera vez a ' + dest.n + '.');
      // posibilidad de avistar lugares cercanos desconocidos
      var vec = W.rutas.filter(function (x) { return (x.a === destId || x.b === destId); });
      for (var k = 0; k < vec.length; k++) {
        var otro = vec[k].a === destId ? vec[k].b : vec[k].a;
        if (!E.conoce('lug', otro) && E.rnd() < 0.45) {
          var l2 = E.lugar(otro);
          E.descubrir('lug', otro, 'visto desde ' + dest.n);
          r.mec.push('Avistado: ' + l2.n + ' (' + l2.tipo + ').');
        }
      }
    }
    E.generarRumores(2);
    return cerrar(r);
  };

  function encuentroEn(locId, riesgo) {
    var cands = W.bestiario.filter(function (b) {
      return b.loc.indexOf(locId) >= 0 && !b.oculto && b.nv <= Math.max(3, Math.round(riesgo / 5) + 4);
    });
    if (!cands.length) return null;
    var b = E.pick(cands);
    return { id: b.id, n: b.n, cant: b.nv <= 3 ? E.ri(1, 3) : E.ri(1, 2) };
  }
  E.encuentroEn = encuentroEn;

  /* ── EXPLORAR ── */
  A.explorar = function () {
    var s = S(), r = nueva('Exploración'), loc = E.lugar(s.pc.loc);
    var horas = E.ri(2, 4);
    var dif = 25 + (loc.oculto && !s.flags['oculto_' + loc.id] ? 25 : 0) + (loc.tipo === 'Ruina mayor' ? 20 : 0);
    var t = E.tirada(dif, [mod('percepción', s.pc.st.per * 1.4), mod('inteligencia', s.pc.st.int * 0.5),
      mod('suerte', s.pc.st.sue * 0.3), mod(loc.tipo, 0)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    r.ctx.tipo = 'exploracion'; r.ctx.lugar = loc.n;
    avanzar(r, horas * 60);
    if (t.grado === 'critico' && loc.oculto && !s.flags['oculto_' + loc.id]) {
      s.flags['oculto_' + loc.id] = true;
      r.ctx.hallazgo = loc.oculto;
      r.mec.push('Hallazgo mayor.');
      E.darXp(45, 'hallazgo en ' + loc.n);
    } else if (t.grado === 'critico' || t.grado === 'exito') {
      // componentes o lugar nuevo
      var comps = (loc.rec || []).map(function (x) { return recComp[x]; }).filter(Boolean);
      if (comps.length && E.rnd() < 0.7) {
        var c = E.pick(comps), q = E.ri(1, 2);
        E.addItem(c, q);
        r.ctx.hallazgo = 'componentes';
        r.mec.push('Recogido: ' + E.compDef(c).n + ' ×' + q + '.');
      }
      var noDesc = W.rutas.filter(function (x) {
        var o = x.a === loc.id ? x.b : (x.b === loc.id ? x.a : null);
        return o && !E.conoce('lug', o);
      });
      if (noDesc.length && E.rnd() < 0.5) {
        var x0 = noDesc[0], otro = x0.a === loc.id ? x0.b : x0.a;
        E.descubrir('lug', otro, 'explorando ' + loc.n);
        r.ctx.nuevoLugar = E.lugar(otro).n;
        r.mec.push('Descubierto: ' + E.lugar(otro).n + '.');
      }
      E.darXp(E.ri(8, 18), 'exploración');
    } else if (t.grado === 'parcial') {
      r.mec.push('Encuentras indicios, nada concluyente.');
      E.darXp(5, 'exploración parcial');
    } else {
      var enc = encuentroEn(loc.id, 40);
      if (enc && t.grado === 'fracaso_critico') { r.ctx.encuentro = enc; r.mec.push('Has llamado la atención de algo: ' + enc.n + '.'); }
      else r.mec.push('Horas perdidas.');
      s.pc.descanso = Math.max(0, s.pc.descanso - 8);
    }
    E.generarRumores(1);
    return cerrar(r);
  };

  /* ── RECOLECTAR COMPONENTES ── */
  A.recolectar = function () {
    var s = S(), r = nueva('Recolección'), loc = E.lugar(s.pc.loc);
    var comps = (loc.rec || []).map(function (x) { return recComp[x]; }).filter(Boolean);
    if (loc.id === 'osa') comps = comps.concat(['hueso_hum', 'hueso_peq', 'sal_osa', 'mortaja_vieja', 'tiza_osa']);
    if (!comps.length) { r.ok = false; r.mec.push('Aquí no hay nada aprovechable para tu oficio.'); return cerrar(r); }
    var horas = 3;
    var t = E.tirada(30, [mod('percepción', s.pc.st.per), mod('nigromancia', E.dom('nigro') * 0.3)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    avanzar(r, horas * 60);
    r.ctx.tipo = 'recoleccion'; r.ctx.lugar = loc.n;
    var bolsa = {};
    var veces = t.grado === 'critico' ? 3 : t.grado === 'exito' ? 2 : t.grado === 'parcial' ? 1 : 0;
    for (var i = 0; i < veces; i++) {
      var c = E.pick(comps), q = E.ri(1, 2);
      E.addItem(c, q); bolsa[c] = (bolsa[c] || 0) + q;
    }
    var obtenido = Object.keys(bolsa).map(function (k) { return E.compDef(k).n + ' ×' + bolsa[k]; });
    // rescoldo pálido solo en lugares con mucho residuo
    if ((loc.id === 'osa' || loc.id === 'tum' || loc.id === 'cri') && (t.grado === 'critico' || (t.grado === 'exito' && E.rnd() < 0.4))) {
      E.addItem('rescoldo', 1); obtenido.push('Rescoldo pálido ×1');
    }
    if (!obtenido.length) r.mec.push('Nada utilizable.');
    else { r.mec.push('Obtenido: ' + obtenido.join(', ') + '.'); E.darXp(6, 'recolección'); }
    r.ctx.obtenido = obtenido;
    if (t.grado === 'fracaso_critico') { E.setHp(s.pc.hp - E.ri(2, 5)); r.mec.push('Te has cortado trabajando con prisa.'); }
    return cerrar(r);
  };

  /* ── HABLAR ── */
  A.hablar = function (npcId, tema) {
    var s = S(), r = nueva('Conversación'), def = E.npcDef(npcId), est = s.npcs[npcId];
    if (!def || !est || !est.vivo) { r.ok = false; r.mec.push('No hay nadie así disponible.'); return cerrar(r); }
    if (est.loc !== s.pc.loc) { r.ok = false; r.mec.push(def.n + ' no está aquí.'); return cerrar(r); }
    E.descubrir('npc', npcId);
    r.ctx.tipo = 'conversacion'; r.ctx.npc = def.n; r.ctx.tema = tema || 'general'; r.ctx.opinion = est.op;
    var min = E.ri(20, 50);
    var dif = 45 - est.op * 0.35 + (tema === 'enseñar' ? 25 : tema === 'secreto' ? 40 : 0);
    var t = E.tirada(dif, [mod('carisma', s.pc.st.car * 1.3), mod('inteligencia', s.pc.st.int * 0.4),
      mod('opinión', est.op * 0.25), mod('reputación', s.pc.reputacion ? 0 : 0)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    avanzar(r, min);
    var antesOp = est.op;
    if (t.grado === 'critico') est.op = Math.min(100, est.op + E.ri(4, 9));
    else if (t.grado === 'exito') est.op = Math.min(100, est.op + E.ri(1, 4));
    else if (t.grado === 'fracaso') est.op = Math.max(-100, est.op - E.ri(1, 4));
    else if (t.grado === 'fracaso_critico') est.op = Math.max(-100, est.op - E.ri(4, 10));
    if (est.op !== antesOp) E._delta('Opinión de ' + def.n, antesOp, est.op);
    est.memoria.push({ f: E.fechaTxt(), q: 'Hablasteis de ' + (tema || 'nada en concreto') + '. ' + E.gradoTxt[t.grado] + '.' });
    if (est.memoria.length > 12) est.memoria.shift();
    // frutos de la conversación
    r.ctx.resultado = t.grado;
    if (t.grado === 'exito' || t.grado === 'critico') {
      if (tema === 'rumores' || !tema) {
        E.generarRumores(2);
        var nuevos = s.rumores.slice(-2);
        r.ctx.info = nuevos;
        r.mec.push('Información obtenida: ' + nuevos.length + ' rumor(es).');
      }
      if (tema === 'enseñar' && def.maestro) {
        var m = def.maestro;
        if (m.precio && !E.pagar(m.precio * 12)) { r.mec.push('No tienes los ' + E.dinero(m.precio * 12) + ' que pide.'); }
        else {
          if (m.escuela) {
            var g = E.subirDom(m.escuela, 6);
            r.mec.push('Lección recibida: ' + E.nombreDe(m.escuela) + ' +' + g.toFixed(1) + ' (tope de este maestro: ' + m.max + ').');
            s.conoc.esc[m.escuela] = true;
          }
          if (m.idioma) {
            var a0 = s.pc.idiomas[m.idioma] || 0;
            s.pc.idiomas[m.idioma] = Math.min(m.max, a0 + E.ri(4, 9));
            E._delta('Idioma ' + m.idioma, a0, s.pc.idiomas[m.idioma]);
            r.mec.push('Thanel Antiguo: ' + a0 + ' → ' + s.pc.idiomas[m.idioma] + '.');
          }
          E.darXp(20, 'aprendizaje');
        }
      }
      if (t.grado === 'critico' && est.op >= 25 && def.sec && !s.flags['sec_' + npcId]) {
        s.flags['sec_' + npcId] = true; r.ctx.secreto = def.sec;
        r.mec.push('Se le ha escapado algo importante.');
        E.darXp(30, 'secreto descubierto');
      }
      E.darXp(4, 'conversación');
    } else if (t.grado === 'fracaso_critico') {
      if (npcId === 'npc_breviar') { s.pc.sospecha = Math.min(100, s.pc.sospecha + 6); r.mec.push('Sospecha del Priorato +6.'); }
      r.mec.push('La conversación ha ido mal y se recordará.');
    }
    return cerrar(r);
  };

  /* ── ESTUDIAR EL CÓDICE ── */
  A.estudiarCodice = function (horas) {
    var s = S(), r = nueva('Estudio del Códice');
    horas = Math.max(1, Math.min(10, horas || 3));
    if (!s.inv.codice) { r.ok = false; r.mec.push('No llevas el Códice encima.'); return cerrar(r); }
    r.ctx.tipo = 'estudio_codice'; r.ctx.horas = horas; r.ctx.legibilidad = s.codice.leg;
    var dif = 55 - s.codice.leg * 0.5 - (s.pc.idiomas.thanel || 0) * 0.45 + (s.pc.descanso < 30 ? 12 : 0);
    var mods = [mod('inteligencia', s.pc.st.int * 1.3), mod('voluntad', s.pc.st.vol * 0.7),
      mod('nigromancia', E.dom('nigro') * 0.4), mod('Thanel', (s.pc.idiomas.thanel || 0) * 0.3),
      mod('horas', horas * 1.5), mod('Velo', E.veloMod() * 0.5)];
    if (s.inv.lexico_thanel) mods.push(mod('léxico', 12));
    var t = E.tirada(dif, mods);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    avanzar(r, horas * 60);
    s.codice.estudios++;
    s.pc.descanso = Math.max(0, s.pc.descanso - horas * 4);
    var cord = 0;
    if (t.grado === 'critico') {
      var gl = E.ri(3, 6); var a = s.codice.leg; s.codice.leg = Math.min(100, s.codice.leg + gl);
      E._delta('Legibilidad del Códice', a + '%', s.codice.leg + '%');
      E.subirDom('nigro', 3.5); E.subirDom('thanat', 3);
      E.darXp(35, 'estudio del Códice');
      cord = 2;
      r.ctx.revelacion = true;
      r.mec.push('Un pasaje entero cede. Legibilidad +' + gl + '%.');
    } else if (t.grado === 'exito') {
      var g2 = E.ri(1, 3); var a2 = s.codice.leg; s.codice.leg = Math.min(100, s.codice.leg + g2);
      E._delta('Legibilidad del Códice', a2 + '%', s.codice.leg + '%');
      E.subirDom('nigro', 2); E.subirDom('thanat', 1.5);
      E.darXp(18, 'estudio del Códice'); cord = 1;
      r.mec.push('Legibilidad +' + g2 + '%.');
    } else if (t.grado === 'parcial') {
      E.subirDom('nigro', 0.8); E.darXp(6, 'estudio'); cord = 2;
      r.mec.push('Avance mínimo. Las manos te tiemblan al cerrar el libro.');
    } else if (t.grado === 'fracaso') {
      cord = 4; r.mec.push('Nada. Has perdido ' + horas + ' h y algo de sueño.');
      s.pc.descanso = Math.max(0, s.pc.descanso - 10);
    } else {
      cord = 9;
      var efecto = E.pick([
        { n: 'lagunas de memoria', dias: 3, st: 'int', v: -2 },
        { n: 'insomnio del Códice', dias: 4, st: 'res', v: -2 },
        { n: 'voces de fondo', dias: 2, st: 'per', v: -2 }
      ]);
      s.pc.efectos.push(efecto);
      var prev = s.pc.st[efecto.st];
      s.pc.st[efecto.st] = Math.max(1, prev + efecto.v);
      E._delta(E.nombreDe(efecto.st) + ' (temporal)', prev, s.pc.st[efecto.st]);
      s.pc.bonos.pendiente = s.pc.bonos.pendiente || [];
      s.pc.bonos.pendiente.push({ st: efecto.st, v: -efecto.v, dias: efecto.dias });
      r.ctx.retroceso = efecto.n;
      r.mec.push('Retroceso: ' + efecto.n + ' durante ' + efecto.dias + ' días.');
    }
    var ac = s.pc.cordura; s.pc.cordura = Math.max(0, s.pc.cordura - cord);
    if (cord) E._delta('Cordura', ac, s.pc.cordura);
    // ¿puede abrirse la siguiente mortaja?
    var sig = s.codice.mortajas.indexOf(false);
    if (sig === 1 && s.codice.leg >= 30 && E.dom('nigro') >= 20 && s.codice.llaves.indexOf('observado') >= 0) {
      r.ctx.mortajaDisponible = 2;
      r.mec.push('La Segunda Mortaja está lista para ser forzada (investigación disponible).');
    }
    return cerrar(r);
  };

  /* ── ENTRENAR ESTADÍSTICA ── */
  A.entrenar = function (statId, horas) {
    var s = S(), r = nueva('Entrenamiento');
    horas = Math.max(1, Math.min(8, horas || 2));
    var st = null;
    for (var i = 0; i < W.stats.length; i++) if (W.stats[i].id === statId) st = W.stats[i];
    if (!st) { r.ok = false; r.mec.push('Eso no es una estadística entrenable.'); return cerrar(r); }
    if (statId === 'sue') { r.ok = false; r.mec.push('La suerte no se entrena.'); return cerrar(r); }
    r.ctx.tipo = 'entrenamiento'; r.ctx.stat = st.n; r.ctx.horas = horas;
    var t = E.tirada(40, [mod('voluntad', s.pc.st.vol * 0.8), mod('resistencia', s.pc.st.res * 0.5), mod('horas', horas * 2),
      mod(s.pc.descanso < 30 ? 'agotado' : 'descansado', s.pc.descanso < 30 ? -15 : 5)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    avanzar(r, horas * 60);
    var factor = t.grado === 'critico' ? 2.2 : t.grado === 'exito' ? 1.4 : t.grado === 'parcial' ? 0.7 : t.grado === 'fracaso' ? 0.25 : 0;
    var puntos = horas * 5.5 * factor;
    var subio = E.subirStat(statId, puntos);
    r.mec.push('Progreso en ' + st.n + ': +' + Math.round(puntos) + ' (' + Math.round(s.pc.prog[statId] || 0) + '/100)' + (subio ? ' → ¡' + st.n + ' +' + subio + '!' : ''));
    if (subio) E.darXp(15 * subio, 'estadística mejorada');
    else E.darXp(Math.round(puntos / 8), 'entrenamiento');
    s.pc.descanso = Math.max(0, s.pc.descanso - horas * (st.tipo === 'fis' ? 7 : 4));
    s.pc.hambre = Math.min(100, s.pc.hambre + horas * 2);
    if (t.grado === 'fracaso_critico' && st.tipo === 'fis') { E.setHp(s.pc.hp - E.ri(3, 8)); r.mec.push('Lesión leve por forzar.'); }
    return cerrar(r);
  };

  /* ── PRACTICAR MAGIA ── */
  A.practicar = function (id, horas) {
    var s = S(), r = nueva('Práctica mágica');
    horas = Math.max(1, Math.min(8, horas || 2));
    var esEsc = s.mag.esc[id] != null, esRama = s.mag.ramas[id] != null;
    if (!esEsc && !esRama) { r.ok = false; r.mec.push('No hay nada así que practicar.'); return cerrar(r); }
    var nombre = E.nombreDe(id);
    // ¿tiene acceso?
    if (esEsc && E.dom(id) === 0 && !s.conoc.esc[id] && id !== 'nigro') {
      r.ok = false;
      r.mec.push('No tienes ni la base ni un maestro de ' + nombre + '. Necesitas un texto, un maestro o un descubrimiento para empezar.');
      return cerrar(r);
    }
    if (esRama) {
      var rama = null;
      for (var i = 0; i < W.ramas.length; i++) if (W.ramas[i].id === id) rama = W.ramas[i];
      if (rama && E.dom('nigro') < rama.req) {
        r.ok = false;
        r.mec.push(nombre + ' requiere Nigromancia ≥ ' + rama.req + ' (tienes ' + E.dom('nigro') + ').');
        return cerrar(r);
      }
    }
    var costeMana = Math.round(horas * 3 * (1 / E.mareaMod()));
    if (s.pc.mana < costeMana) { r.ok = false; r.mec.push('Necesitas ' + costeMana + ' de maná para practicar ' + horas + ' h (tienes ' + Math.round(s.pc.mana) + ').'); return cerrar(r); }
    r.ctx.tipo = 'practica'; r.ctx.disciplina = nombre; r.ctx.horas = horas;
    var afin = s.mag.afin[esEsc ? id : 'nigro'] || { nivel: 'media' };
    var afinBono = afin.nivel === 'alta' ? 12 : afin.nivel === 'media' ? 4 : afin.nivel === 'baja' ? -8 : -25;
    var t = E.tirada(42, [mod('control', s.pc.st.ctl * 1.5), mod('afinidad', afinBono), mod('horas', horas * 2),
      mod('marea', (E.mareaMod() - 1) * 20), mod('inteligencia', s.pc.st.int * 0.3)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    E.setMana(s.pc.mana - costeMana);
    avanzar(r, horas * 60);
    var f = t.grado === 'critico' ? 2.4 : t.grado === 'exito' ? 1.5 : t.grado === 'parcial' ? 0.8 : t.grado === 'fracaso' ? 0.2 : 0;
    var g = E.subirDom(id, horas * 1.6 * f);
    r.mec.push('Dominio de ' + nombre + ': +' + g.toFixed(1) + ' → ' + E.dom(id).toFixed(1) + '/100');
    E.darXp(Math.round(horas * 4 * f), 'práctica');
    // descubrir afinidad
    if (esEsc && !afin.descubierta && (t.grado === 'exito' || t.grado === 'critico')) {
      afin.descubierta = true;
      r.ctx.afinidad = { escuela: nombre, nivel: afin.nivel };
      r.mec.push('Afinidad descubierta con ' + nombre + ': ' + afin.nivel + '.');
    }
    if (t.grado === 'fracaso_critico') {
      var d = E.ri(3, 9); E.setHp(s.pc.hp - d);
      r.mec.push('Retroceso mágico: ' + d + ' de daño.');
      if (esEsc && (id === 'nigro' || id === 'almas')) { s.pc.notoriedad = Math.min(100, s.pc.notoriedad + 1); r.mec.push('Residuo necromántico detectable (+1 notoriedad).'); }
    }
    if ((id === 'nigro' || esRama) && E.lugar(s.pc.loc).pob > 100 && E.rnd() < 0.25) {
      s.pc.notoriedad = Math.min(100, s.pc.notoriedad + 1);
      r.mec.push('Has practicado nigromancia cerca de gente. Notoriedad +1.');
    }
    return cerrar(r);
  };

  /* ── DESCANSAR / DORMIR ── */
  A.descansar = function (horas, dormir) {
    var s = S(), r = nueva(dormir ? 'Dormir' : 'Descansar');
    horas = Math.max(1, Math.min(14, horas || (dormir ? 7 : 2)));
    r.ctx.tipo = 'descanso'; r.ctx.horas = horas; r.ctx.dormir = !!dormir;
    var seguro = ['vad', 'osa', 'pos', 'gri', 'sau'].indexOf(s.pc.loc) >= 0;
    avanzar(r, horas * 60, { durmiendo: !!dormir, descansando: !dormir });
    if (s.pc.hambre > 60 && (s.inv.pan_duro || 0) > 0) {
      E.quitarItem('pan_duro', 1); var h0 = s.pc.hambre; s.pc.hambre = Math.max(0, s.pc.hambre - 45);
      E._delta('Hambre', Math.round(h0), Math.round(s.pc.hambre)); r.mec.push('Has comido pan duro.');
    }
    if (dormir) {
      var c0 = s.pc.cordura; s.pc.cordura = Math.min(100, s.pc.cordura + (s.codice.estudios > 0 ? 1 : 3));
      if (c0 !== s.pc.cordura) E._delta('Cordura', c0, s.pc.cordura);
      if (s.codice.estudios > 2 && E.rnd() < 0.35) {
        r.ctx.sueño = E.pick([
          'una llanura sin horizonte y una figura de pie, muy lejos, que no se acerca pero tampoco se va',
          'siete clavos de hierro clavados en un campo y un sonido debajo',
          'una corona vacía en un trono de piedra, y tu nombre escrito en el respaldo',
          'tus propias manos cosiendo algo que respira'
        ]);
        r.mec.push('Sueño relacionado con el Códice.');
      }
    }
    if (!seguro && E.rnd() < 0.3) {
      var enc = encuentroEn(s.pc.loc, 35);
      if (enc) { r.ctx.encuentro = enc; r.mec.push('Interrumpido: ' + enc.n + '.'); }
    }
    r.mec.push('Maná ' + Math.round(s.pc.mana) + '/' + E.manaMax() + ' · Vitalidad ' + Math.round(s.pc.hp) + '/' + E.hpMax() + ' · Descanso ' + Math.round(s.pc.descanso) + '%');
    return cerrar(r);
  };

  /* ── TRABAJAR POR DINERO ── */
  A.trabajar = function (horas) {
    var s = S(), r = nueva('Jornal'), loc = E.lugar(s.pc.loc);
    horas = Math.max(1, Math.min(12, horas || 6));
    var tarifas = { osa: 4, vad: 3, min: 7, gri: 4, pos: 3, sau: 3 };
    var tar = tarifas[loc.id];
    if (!tar) { r.ok = false; r.mec.push('Aquí no hay trabajo pagado para ti.'); return cerrar(r); }
    r.ctx.tipo = 'trabajo'; r.ctx.lugar = loc.n; r.ctx.horas = horas;
    var t = E.tirada(35, [mod('fuerza', s.pc.st.fue * 0.7), mod('resistencia', s.pc.st.res * 0.8), mod('carisma', s.pc.st.car * 0.3)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    avanzar(r, horas * 60);
    var f = t.grado === 'critico' ? 1.6 : t.grado === 'exito' ? 1.15 : t.grado === 'parcial' ? 0.8 : t.grado === 'fracaso' ? 0.4 : 0.2;
    var paga = Math.round(horas * tar * f);
    E.cobrar(paga);
    r.mec.push('Jornal: ' + E.dinero(paga) + '.');
    s.pc.descanso = Math.max(0, s.pc.descanso - horas * 5);
    s.pc.hambre = Math.min(100, s.pc.hambre + horas * 2.5);
    E.darXp(Math.round(horas / 2), 'trabajo');
    if (loc.id === 'osa' && (t.grado === 'exito' || t.grado === 'critico') && E.rnd() < 0.5) {
      E.addItem(E.pick(['hueso_hum', 'mortaja_vieja', 'sal_osa']), 1);
      r.mec.push('Has apartado material del trabajo sin que nadie lo note.');
    }
    if (loc.id === 'min' && t.grado === 'fracaso_critico') { E.setHp(s.pc.hp - E.ri(5, 14)); r.mec.push('Accidente en la galería.'); }
    return cerrar(r);
  };

  /* ── COMPRAR / VENDER ── */
  A.comprar = function (itemId, q) {
    var s = S(), r = nueva('Compra'), loc = E.lugar(s.pc.loc);
    q = q || 1;
    var tieneMercado = (loc.servicios || []).some(function (x) { return /mercado|botica|herrero|posada/.test(x); });
    if (!tieneMercado) { r.ok = false; r.mec.push('No hay dónde comprar aquí.'); return cerrar(r); }
    var def = E.objDef(itemId) || E.compDef(itemId);
    if (!def || def.val == null) { r.ok = false; r.mec.push('Eso no está en venta.'); return cerrar(r); }
    var raro = def.rar === 'raro' || def.rar === 'muy raro' || def.rar === 'legendario';
    if (raro && loc.pob < 5000) { r.ok = false; r.mec.push('Nadie en ' + loc.n + ' vende algo así.'); return cerrar(r); }
    var precio = Math.round(def.val * 12 * q * (1 + (s.mundo.precios.componentes || 1) - 1) * (loc.pob < 3000 ? 1.15 : 1));
    var t = E.tirada(45, [mod('carisma', s.pc.st.car * 1.2), mod('inteligencia', s.pc.st.int * 0.3)]);
    if (t.grado === 'critico') precio = Math.round(precio * 0.75);
    else if (t.grado === 'exito') precio = Math.round(precio * 0.9);
    else if (t.grado === 'fracaso_critico') precio = Math.round(precio * 1.25);
    if (!E.pagar(precio)) { r.ok = false; r.mec.push('Cuesta ' + E.dinero(precio) + ' y tienes ' + E.dinero() + '.'); return cerrar(r); }
    E.addItem(itemId, q);
    r.tiradas.push(t); r.mec.push('Regateo — ' + E.tiradaLinea(t));
    r.mec.push('Comprado: ' + def.n + ' ×' + q + ' por ' + E.dinero(precio) + '.');
    r.ctx.tipo = 'compra'; r.ctx.item = def.n; r.ctx.precio = E.dinero(precio);
    avanzar(r, 30);
    return cerrar(r);
  };
  A.vender = function (itemId, q) {
    var s = S(), r = nueva('Venta'), loc = E.lugar(s.pc.loc);
    q = q || 1;
    var def = E.objDef(itemId) || E.compDef(itemId);
    if (!def) { r.ok = false; r.mec.push('No existe ese objeto.'); return cerrar(r); }
    if ((s.inv[itemId] || 0) < q && (s.comp[itemId] || 0) < q) { r.ok = false; r.mec.push('No tienes ' + q + ' de eso.'); return cerrar(r); }
    if (def.unico) { r.ok = false; r.mec.push('Vender el Códice en un mercado público es una forma rápida de acabar en el Priorato.'); return cerrar(r); }
    var precio = Math.round((def.val || 1) * 12 * q * 0.45);
    var ilegal = /hueso|alma|esencia|rescoldo|mortaja/.test(itemId);
    var t = E.tirada(ilegal ? 55 : 40, [mod('carisma', s.pc.st.car * 1.2)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    if (t.grado === 'fracaso_critico' && ilegal) {
      s.pc.sospecha = Math.min(100, s.pc.sospecha + 8);
      r.mec.push('El comprador ha hecho preguntas y alguien escuchaba. Sospecha +8.');
    }
    var f = t.grado === 'critico' ? 1.5 : t.grado === 'exito' ? 1.1 : t.grado === 'parcial' ? 0.85 : 0.6;
    E.quitarItem(itemId, q);
    E.cobrar(Math.round(precio * f));
    r.mec.push('Vendido ' + def.n + ' ×' + q + ' por ' + E.dinero(Math.round(precio * f)) + '.');
    r.ctx.tipo = 'venta'; r.ctx.item = def.n;
    avanzar(r, 30);
    return cerrar(r);
  };

  A.usar = function (itemId) {
    var s = S(), r = nueva('Uso de objeto'), def = E.objDef(itemId);
    if (!def || !(s.inv[itemId] > 0)) { r.ok = false; r.mec.push('No tienes eso.'); return cerrar(r); }
    if (!def.efecto) { r.ok = false; r.mec.push(def.n + ' no se usa así.'); return cerrar(r); }
    if (def.efecto.hp) { E.setHp(s.pc.hp + def.efecto.hp); r.mec.push('Vitalidad +' + def.efecto.hp + '.'); }
    if (def.efecto.mana) { E.setMana(s.pc.mana + def.efecto.mana); r.mec.push('Maná +' + def.efecto.mana + '.'); }
    if (def.efecto.debuff) { s.pc.efectos.push({ n: def.efecto.debuff, dias: 1 }); r.mec.push('Efecto secundario: ' + def.efecto.debuff + '.'); }
    E.quitarItem(itemId, 1);
    r.ctx.tipo = 'objeto'; r.ctx.item = def.n;
    avanzar(r, 5);
    return cerrar(r);
  };

  A.esperar = function (horas) {
    var r = nueva('Espera');
    horas = Math.max(1, Math.min(72, horas || 1));
    r.ctx.tipo = 'espera'; r.ctx.horas = horas;
    avanzar(r, horas * 60, { descansando: true });
    r.mec.push('Han pasado ' + horas + ' h.');
    return cerrar(r);
  };
})();

/* ═════════ Hechizos: lanzar y crear ═════════ */
(function () {
  var W = window.TS.W, E = window.TS.E, A = E.A;
  function S() { return E.getS(); }
  function mod(n, v) { return { n: n, v: Math.round(v) }; }

  E.hechizo = function (id) {
    var s = S();
    for (var i = 0; i < s.hechizos.length; i++) if (s.hechizos[i].id === id) return s.hechizos[i];
    return null;
  };

  A.lanzar = function (hid, objetivo) {
    var s = S(), r = E.nuevaRes('Lanzamiento de hechizo'), h = E.hechizo(hid);
    if (!h) { r.ok = false; r.mec.push('No conoces ese hechizo.'); return E.cerrarRes(r); }
    var coste = Math.round(h.coste / E.mareaMod());
    if (s.pc.mana < coste) {
      r.ok = false;
      r.mec.push('Coste ' + coste + ' de maná; tienes ' + Math.round(s.pc.mana) + '. Puedes forzarlo con vitalidad usando "forzar ' + h.n + '".');
      return E.cerrarRes(r);
    }
    r.ctx.tipo = 'hechizo'; r.ctx.hechizo = h.n; r.ctx.objetivo = objetivo || 'sin objetivo definido';
    var domRel = Math.max.apply(null, (h.esc || ['nigro']).map(function (e) { return E.dom(e); }));
    if (h.rama) domRel = Math.max(domRel, E.dom(h.rama));
    var mods = [mod('precisión', E.precision()), mod('dominio', domRel * 0.6), mod('marea', (E.mareaMod() - 1) * 18)];
    if (h.esc.indexOf('nigro') >= 0 || h.rama) mods.push(mod('Velo', E.veloMod()));
    if (h.incompleto) mods.push(mod('técnica incompleta', -18));
    if (s.pc.descanso < 25) mods.push(mod('agotado', -12));
    var t = E.tirada(h.dif, mods);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    E.setMana(s.pc.mana - coste);
    r.mec.push('Maná −' + coste + '.');
    E.avanzar(Math.max(1, Math.round((h.act || '').indexOf('minuto') >= 0 ? 3 : 1)));
    h.usos = (h.usos || 0) + 1;
    r.ctx.resultado = t.grado;
    if (t.grado === 'critico' || t.grado === 'exito') {
      E.subirDom(h.esc[0], 0.5); if (h.rama) E.subirDom(h.rama, 0.8);
      E.darXp(t.grado === 'critico' ? 10 : 5, 'hechizo lanzado');
      r.mec.push('Efecto conseguido' + (t.grado === 'critico' ? ' con una limpieza que no esperabas.' : '.'));
      if (h.id === 'rescoldo_palido') {
        r.ctx.lectura = lecturaResiduo(objetivo, t.grado === 'critico');
        r.mec.push('Lectura de residuo obtenida.');
      }
      // evolución espontánea de la técnica por uso
      if (h.usos >= 12 && h.nivel < 5 && (t.grado === 'critico')) {
        h.nivel++; h.pot = Math.round(h.pot * 1.25 * 10) / 10;
        r.mec.push(h.n + ' sube a nivel ' + h.nivel + ' por uso repetido.');
      }
    } else if (t.grado === 'parcial') {
      r.mec.push('El tejido se sostiene a medias: el efecto es débil o incompleto.');
      E.subirDom(h.esc[0], 0.2);
      E.darXp(2, 'hechizo parcial');
    } else if (t.grado === 'fracaso') {
      r.mec.push('El tejido se deshace. Maná gastado sin efecto.');
    } else {
      var d = E.ri(2, 4) + Math.round((h.pot || 2) * 0.8);
      E.setHp(s.pc.hp - d);
      r.mec.push('Retroceso: ' + d + ' de daño y descontrol momentáneo.');
      if (h.esc.indexOf('nigro') >= 0) { s.pc.notoriedad = Math.min(100, s.pc.notoriedad + 2); r.mec.push('Residuo visible: notoriedad +2.'); }
      r.ctx.retroceso = true;
    }
    var loc = E.lugar(s.pc.loc);
    if (loc.pob > 100 && (h.esc.indexOf('nigro') >= 0 || h.rama) && E.rnd() < 0.3) {
      s.pc.notoriedad = Math.min(100, s.pc.notoriedad + 1);
      r.mec.push('Alguien pudo notarlo. Notoriedad +1.');
    }
    return E.cerrarRes(r);
  };

  function lecturaResiduo(objetivo, bueno) {
    var s = S(), loc = E.lugar(s.pc.loc);
    var base = {
      osa: 'Residuo denso y estratificado: décadas de muertos apilados. Hay una veta más fría bajo el sótano inferior, detrás del muro de juntas nuevas.',
      tum: 'El residuo no se dispersa como debería: algo lo mantiene ordenado en siete puntos.',
      min: 'Residuo reciente y furioso en la galería cuarta, y debajo otro mucho más viejo y quieto.',
      cri: 'Residuo con forma de juramento: alguien prometió algo aquí y sigue cumpliéndolo.',
      cue: 'El residuo se mueve como corriente de aire. Hay paso.',
      bos: 'Residuo animal abundante y una franja donde no hay ninguno, lo que es peor.'
    };
    var txt = base[loc.id] || 'Residuo escaso, disperso, viejo. Nada que aprovechar.';
    if (!bueno) txt = txt.split('.')[0] + '.';
    return txt;
  }

  /* ── CREAR HECHIZO ── */
  var ALCANCES = { tacto: { n: 'Tacto', dif: 0, f: 1 }, corto: { n: 'Corto (5 pasos)', dif: 6, f: 1.15 }, medio: { n: 'Medio (20 pasos)', dif: 14, f: 1.35 }, largo: { n: 'Largo (60 pasos)', dif: 24, f: 1.7 }, vista: { n: 'Línea de visión', dif: 34, f: 2.1 }, remoto: { n: 'Remoto (vínculo)', dif: 50, f: 3 } };
  var DURACIONES = { instant: { n: 'Instantáneo', dif: 0, f: 1 }, minutos: { n: 'Minutos', dif: 8, f: 1.25 }, horas: { n: 'Horas', dif: 18, f: 1.6 }, dias: { n: 'Días', dif: 32, f: 2.2 }, permanente: { n: 'Permanente', dif: 55, f: 3.5 } };
  E.ALCANCES = ALCANCES; E.DURACIONES = DURACIONES;

  E.evaluarHechizo = function (spec) {
    var s = S();
    var ef = null, i;
    for (i = 0; i < W.efectos.length; i++) if (W.efectos[i].id === spec.efecto) ef = W.efectos[i];
    var escala = W.escalas[Math.max(1, Math.min(10, spec.escala || 2)) - 1];
    var alc = ALCANCES[spec.alcance || 'tacto'], dur = DURACIONES[spec.duracion || 'instant'];
    var escuelas = (spec.escuelas && spec.escuelas.length) ? spec.escuelas : ['nigro'];
    if (!ef) return { error: 'Elige un efecto base.' };
    var difEsc = 0;
    for (i = 0; i < escuelas.length; i++) {
      var ed = null;
      for (var j = 0; j < W.escuelas.length; j++) if (W.escuelas[j].id === escuelas[i]) ed = W.escuelas[j];
      difEsc += (ed ? ed.dif : 5) * 1.6;
    }
    var multi = escuelas.length > 1 ? 14 * (escuelas.length - 1) : 0;
    var dif = Math.round(ef.dif + escala.dif + difEsc + alc.dif + dur.dif + multi);
    // dominio relevante (media ponderada hacia la escuela peor dominada)
    var doms = escuelas.map(function (e) { return E.dom(e); });
    var peor = Math.min.apply(null, doms), mejor = Math.max.apply(null, doms);
    var domRel = peor * 0.65 + mejor * 0.35;
    if (spec.rama) domRel = Math.max(domRel, E.dom(spec.rama) * 0.8 + E.dom('nigro') * 0.2);
    var reqDom = Math.round(dif * 0.42);
    var coste = Math.max(1, Math.round(ef.base * escala.m * dur.f * alc.f * 0.55));
    var pot = Math.round(escala.m * (1 + domRel / 60) * 2 * 10) / 10;
    // materiales necesarios
    var mats = [];
    if (escala.id >= 4) mats.push({ c: 'sal_osa', q: Math.ceil(escala.id / 2) });
    if (spec.duracion === 'permanente' || spec.duracion === 'dias') mats.push({ c: 'tiza_osa', q: 1 });
    if (ef.id === 'animar' || ef.id === 'invocar') mats.push({ c: 'rescoldo', q: Math.max(1, Math.floor(escala.id / 3)) });
    if (ef.id === 'extraer') mats.push({ c: 'cristal_man', q: 1 });
    if (escala.id >= 7) mats.push({ c: 'cristal_man', q: Math.floor(escala.id / 3) });
    var faltan = mats.filter(function (m) { return (s.comp[m.c] || 0) < m.q; });
    var viable = domRel >= reqDom * 0.55;
    var horas = Math.max(2, Math.round(3 + dif / 14));
    var riesgos = [];
    if (dif - domRel > 45) riesgos.push('Muy por encima de tu nivel: el fracaso crítico es probable');
    if (ef.id === 'extraer') riesgos.push('Delito capital en todo Valdrath');
    if (spec.duracion === 'permanente') riesgos.push('Un rito permanente mal cerrado sigue funcionando, pero no como quieres');
    if (escuelas.length > 2) riesgos.push('Tres escuelas a la vez: interferencia de tejidos');
    if (escuelas.indexOf('sagrada') >= 0 && escuelas.indexOf('nigro') >= 0) riesgos.push('Sagrada y nigromancia se rechazan: incompatibilidad grave');
    return {
      efecto: ef, escala: escala, alcance: alc, duracion: dur, escuelas: escuelas,
      dif: dif, reqDom: reqDom, domRel: Math.round(domRel * 10) / 10, coste: coste, pot: pot,
      materiales: mats, faltan: faltan, viable: viable, horas: horas, riesgos: riesgos
    };
  };

  A.crearHechizo = function (spec) {
    var s = S(), r = E.nuevaRes('Diseño de técnica'), ev = E.evaluarHechizo(spec);
    if (ev.error) { r.ok = false; r.mec.push(ev.error); return E.cerrarRes(r); }
    if (!spec.nombre) { r.ok = false; r.mec.push('La técnica necesita un nombre.'); return E.cerrarRes(r); }
    if (!ev.viable) {
      r.ok = false;
      r.mec.push('Imposible por ahora. Dificultad ' + ev.dif + ' exige dominio ≈ ' + ev.reqDom + '; el tuyo relevante es ' + ev.domRel + '.');
      r.mec.push('Necesitas: subir dominio, reducir escala/alcance/duración, o investigar primero.');
      return E.cerrarRes(r);
    }
    if (ev.faltan.length) {
      r.ok = false;
      r.mec.push('Faltan materiales: ' + ev.faltan.map(function (m) { return E.compDef(m.c).n + ' ×' + m.q; }).join(', ') + '.');
      return E.cerrarRes(r);
    }
    r.ctx.tipo = 'crear_hechizo'; r.ctx.nombre = spec.nombre; r.ctx.dif = ev.dif;
    var mods = [mod('dominio', ev.domRel * 0.9), mod('control', s.pc.st.ctl * 1.2), mod('inteligencia', s.pc.st.int * 0.7),
      mod('voluntad', s.pc.st.vol * 0.3), mod('suerte', s.pc.st.sue * 0.2)];
    if (s.inv.codice && (ev.escuelas.indexOf('nigro') >= 0)) mods.push(mod('Códice', Math.round(s.codice.leg * 0.15)));
    var t = E.tirada(ev.dif, mods);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    E.avanzar(ev.horas * 60);
    r.tiempo += ev.horas * 60;
    s.pc.descanso = Math.max(0, s.pc.descanso - ev.horas * 4);
    var costeMana = Math.round(ev.coste * 2);
    E.setMana(Math.max(0, s.pc.mana - costeMana));
    for (var i = 0; i < ev.materiales.length; i++) E.quitarItem(ev.materiales[i].c, ev.materiales[i].q);
    var rango = E.rango().n;
    function ficha(defecto, bonif) {
      var id = 'h' + (s.hechizos.length + 1) + '_' + Date.now().toString(36);
      var h = {
        id: id, n: spec.nombre, esc: ev.escuelas, rama: spec.rama || null, efecto: ev.efecto.id,
        rango: rango, nivel: 1, coste: Math.max(1, Math.round(ev.coste * (bonif ? 0.85 : 1) * (defecto === 'coste' ? 1.5 : 1))),
        pot: Math.round(ev.pot * (bonif ? 1.25 : 1) * (defecto === 'potencia' ? 0.6 : 1) * 10) / 10,
        alcance: ev.alcance.n, dur: ev.duracion.n, act: ev.efecto.id === 'ritual' ? 'Rito de ' + Math.max(1, Math.round(ev.dif / 20)) + ' h' : (ev.escala.id > 4 ? '3 minutos' : '1 acción'),
        dif: Math.round(ev.dif * 0.78), req: 'Dominio ≈ ' + ev.reqDom + ' en ' + ev.escuelas.map(E.nombreDe).join(' + '),
        sec: defecto === 'inestable' ? 'Inestable: 20% de probabilidad de efecto erróneo' : defecto === 'coste' ? 'Derrochador: consume un 50% más de maná del previsto' : defecto === 'potencia' ? 'Débil: rinde por debajo del diseño' : (ev.riesgos[0] || 'Ninguno conocido'),
        evol: ['Ampliar escala (nuevo diseño, dificultad +' + (W.escalas[Math.min(9, ev.escala.id)].dif - ev.escala.dif) + ')', 'Reducir coste mediante práctica', 'Fusionar con otra técnica propia'],
        desc: spec.desc || ('Técnica original de ' + s.pc.nombre + ': ' + ev.efecto.n.toLowerCase() + ' de escala ' + ev.escala.n.toLowerCase() + '.'),
        origen: 'Diseño propio · ' + E.fechaTxt(), usos: 0, escala: ev.escala.id
      };
      s.hechizos.push(h);
      return h;
    }
    if (t.grado === 'critico') {
      var h1 = ficha(null, true);
      r.ctx.hechizo = h1; r.ctx.resultado = 'critico';
      r.mec.push('Diseño limpio y mejor de lo previsto: ' + h1.n + ' (coste ' + h1.coste + ', potencia ' + h1.pot + ').');
      E.darXp(Math.round(ev.dif * 1.6), 'técnica original');
      for (var k = 0; k < ev.escuelas.length; k++) E.subirDom(ev.escuelas[k], 3);
      if (ev.dif >= 70 && s.pc.principios.length < 9) {
        s.pc.principios.push('Principio deducido al diseñar "' + h1.n + '"');
        r.mec.push('Has deducido un principio mágico propio.');
      }
    } else if (t.grado === 'exito') {
      var h2 = ficha(null, false);
      r.ctx.hechizo = h2; r.ctx.resultado = 'exito';
      r.mec.push('Técnica funcional: ' + h2.n + '.');
      E.darXp(Math.round(ev.dif * 1.1), 'técnica original');
      for (var k2 = 0; k2 < ev.escuelas.length; k2++) E.subirDom(ev.escuelas[k2], 2);
    } else if (t.grado === 'parcial') {
      var def = E.pick(['coste', 'potencia', 'inestable']);
      var h3 = ficha(def, false);
      r.ctx.hechizo = h3; r.ctx.resultado = 'parcial'; r.ctx.defecto = def;
      r.mec.push('Funciona, con un defecto: ' + h3.sec);
      E.darXp(Math.round(ev.dif * 0.6), 'técnica defectuosa');
      E.subirDom(ev.escuelas[0], 1);
    } else if (t.grado === 'fracaso') {
      r.ctx.resultado = 'fracaso';
      r.mec.push('El diseño no cierra. Materiales y horas perdidos; conservas las notas.');
      E.darXp(Math.round(ev.dif * 0.25), 'intento fallido');
      E.subirDom(ev.escuelas[0], 0.6);
    } else {
      r.ctx.resultado = 'fracaso_critico';
      var d = E.ri(4, 10) + Math.round(ev.escala.id * 1.5);
      E.setHp(s.pc.hp - d);
      r.mec.push('El tejido se vuelve contra ti: ' + d + ' de daño.');
      if (ev.escuelas.indexOf('nigro') >= 0) {
        s.pc.notoriedad = Math.min(100, s.pc.notoriedad + 3);
        r.mec.push('Un pulso de residuo recorre el lugar. Notoriedad +3.');
      }
      var c0 = s.pc.cordura; s.pc.cordura = Math.max(0, s.pc.cordura - E.ri(2, 6));
      E._delta('Cordura', c0, s.pc.cordura);
    }
    return E.cerrarRes(r);
  };
})();

/* ═════════ Criaturas: construir, mandar, evolucionar ═════════ */
(function () {
  var W = window.TS.W, E = window.TS.E, A = E.A;
  function S() { return E.getS(); }
  function mod(n, v) { return { n: n, v: Math.round(v) }; }

  E.evaluarCriatura = function (spec) {
    var s = S();
    var piezas = [], tot = { vit: 0, man: 0, fue: 0, vel: 0, def: 0, int: 0, vol: 0, per: 0, car: 0, res: 0, mant: 0 };
    var intCap = 100, intBase = 0, lealBonus = 0, grave = false, especies = {};
    var listas = ['armazon', 'nucleo', 'esencia', 'alma', 'materiales'];
    var faltan = [];
    for (var li = 0; li < listas.length; li++) {
      var arr = spec[listas[li]] || [];
      for (var i = 0; i < arr.length; i++) {
        var it = typeof arr[i] === 'string' ? { c: arr[i], q: 1 } : arr[i];
        var def = E.compDef(it.c);
        if (!def) continue;
        if ((s.comp[it.c] || 0) < it.q) faltan.push({ c: it.c, q: it.q, tengo: s.comp[it.c] || 0 });
        piezas.push({ def: def, q: it.q, cat: listas[li] });
        for (var k in def.ap) tot[k] = (tot[k] || 0) + def.ap[k] * it.q;
        if (def.lim && def.lim.int != null) intCap = Math.min(intCap, def.lim.int);
        if (def.int_b) intBase = Math.max(intBase, def.int_b);
        if (def.lealtad) lealBonus += def.lealtad;
        if (def.grave) grave = true;
        if (listas[li] === 'armazon') especies[def.id] = true;
      }
    }
    var nArm = Object.keys(especies).length;
    if (!nArm) return { error: 'Necesitas al menos un armazón (huesos, hierro-tumba, quitina, carne…).' };
    var tieneNucleo = piezas.some(function (p) { return p.cat === 'nucleo'; });
    if (!tieneNucleo) return { error: 'Necesitas un núcleo que la mueva (rescoldo, cristal de maná, núcleo de forja…).' };
    var domC = E.dom('crea_cr'), domCtrl = E.dom('ctrl_nm'), domNig = E.dom('nigro');
    var cal = 0.75 + domC / 140 + domNig / 300;
    var st = {
      vit: Math.round((tot.vit || 0) * cal), man: Math.round((tot.man || 0) * cal),
      fue: Math.round((tot.fue || 0) * cal), vel: Math.round((tot.vel || 0) * cal),
      def: Math.round((tot.def || 0) * cal), per: Math.round((tot.per || 0) * 0.8), vol: Math.round((tot.vol || 0) * 0.8)
    };
    var inteligencia = Math.min(intCap, Math.round(intBase + domC * 0.25 + (spec.inteligenciaDeseada || 0)));
    var lealtad = Math.round(50 + lealBonus + domCtrl * 0.55 + s.pc.st.car * 0.5 - inteligencia * 0.35 + (grave ? -10 : 0));
    lealtad = Math.max(0, Math.min(100, lealtad));
    var mant = Math.max(0, Math.round((tot.mant || 0) + st.man * 0.04 + (inteligencia > 50 ? 2 : 0)));
    var nivel = Math.max(1, Math.round((st.vit + st.fue + st.vel + st.def + st.man) / 26));
    var rango = nivel < 8 ? 'Aprendiz' : nivel < 18 ? 'Adepto' : nivel < 30 ? 'Experto' : nivel < 45 ? 'Especialista' : 'Maestro';
    var dif = Math.round(22 + piezas.length * 4.5 + nArm * 6 + inteligencia * 0.45 + (grave ? 18 : 0) + (nArm > 1 ? 18 : 0) + nivel * 1.2);
    var reqDom = Math.round(dif * 0.38);
    var costeMana = Math.round(10 + (st.vit + st.fue + st.def) / 4 + inteligencia * 0.3);
    var horas = Math.max(3, Math.round(3 + piezas.length * 1.6 + nivel * 0.3));
    var riesgos = [];
    if (nArm > 1) riesgos.push('Fusión de armazones: requiere Fusión de especies para ser estable');
    if (inteligencia > 55) riesgos.push('Inteligencia alta: la lealtad bajará con el tiempo si no la cuidas');
    if (grave) riesgos.push('Usar un alma humana es delito capital y los Tejedores de Gris llevan cuentas');
    if (dif - domC > 40) riesgos.push('Muy por encima de tu dominio: riesgo de criatura hostil');
    if (mant > 8) riesgos.push('Mantenimiento alto: ' + mant + ' de maná al día');
    var reqs = [];
    if (!s.inv.aguja_hilo) reqs.push('Aguja e hilo de cirujano');
    var loc = E.lugar(s.pc.loc);
    var tallerOk = (loc.servicios || []).some(function (x) { return /taller|laboratorio/.test(x); }) || s.flags.tallerPropio;
    if (!tallerOk) reqs.push('Un taller (el osario sirve; también un laboratorio propio)');
    if (nArm > 1 && E.dom('fusion') < 10) reqs.push('Fusión de especies ≥ 10 para combinar armazones distintos');
    return {
      piezas: piezas, st: st, int: inteligencia, intCap: intCap, lealtad: lealtad, mant: mant, nivel: nivel, rango: rango,
      dif: dif, reqDom: reqDom, domC: domC, costeMana: costeMana, horas: horas, faltan: faltan, riesgos: riesgos,
      requisitos: reqs, viable: domC >= reqDom * 0.5 && !reqs.length, grave: grave, nArm: nArm
    };
  };

  A.crearCriatura = function (spec) {
    var s = S(), r = E.nuevaRes('Construcción de criatura'), ev = E.evaluarCriatura(spec);
    if (ev.error) { r.ok = false; r.mec.push(ev.error); return E.cerrarRes(r); }
    if (!spec.nombre) { r.ok = false; r.mec.push('Dale un nombre. Importa más de lo que parece.'); return E.cerrarRes(r); }
    if (ev.faltan.length) {
      r.ok = false;
      r.mec.push('Faltan componentes: ' + ev.faltan.map(function (f) { return E.compDef(f.c).n + ' (' + f.tengo + '/' + f.q + ')'; }).join(', ') + '.');
      return E.cerrarRes(r);
    }
    if (ev.requisitos.length) { r.ok = false; r.mec.push('Requisitos no cumplidos: ' + ev.requisitos.join('; ') + '.'); return E.cerrarRes(r); }
    if (!ev.viable) {
      r.ok = false;
      r.mec.push('Diseño fuera de tu alcance: dificultad ' + ev.dif + ' pide Creación de criaturas ≈ ' + ev.reqDom + ' (tienes ' + ev.domC.toFixed(1) + ').');
      return E.cerrarRes(r);
    }
    if (s.pc.mana < ev.costeMana) { r.ok = false; r.mec.push('Coste ' + ev.costeMana + ' de maná; tienes ' + Math.round(s.pc.mana) + '.'); return E.cerrarRes(r); }
    r.ctx.tipo = 'crear_criatura'; r.ctx.nombre = spec.nombre; r.ctx.especie = spec.especie || 'especie sin clasificar';
    var mods = [mod('creación de criaturas', ev.domC * 0.85), mod('control mágico', s.pc.st.ctl * 1.1),
      mod('inteligencia', s.pc.st.int * 0.6), mod('anatomía', s.inv.tratado_anat ? 12 : 0), mod('Velo', E.veloMod() * 0.6)];
    if (E.dom('mod_cr') > 10) mods.push(mod('modificación', E.dom('mod_cr') * 0.2));
    var t = E.tirada(ev.dif, mods);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    E.setMana(s.pc.mana - ev.costeMana);
    E.avanzar(ev.horas * 60);
    r.tiempo += ev.horas * 60;
    s.pc.descanso = Math.max(0, s.pc.descanso - ev.horas * 4.5);
    var perder = t.grado === 'exito' || t.grado === 'critico' ? 1 : t.grado === 'parcial' ? 1 : 0.5;
    for (var i = 0; i < ev.piezas.length; i++) {
      var p = ev.piezas[i];
      var q = Math.max(0, Math.round(p.q * perder));
      if (q) E.quitarItem(p.def.id, Math.min(q, s.comp[p.def.id] || 0));
    }
    function habilidades() {
      var hs = [];
      for (var i2 = 0; i2 < ev.piezas.length; i2++) {
        var d = ev.piezas[i2].def;
        if (d.id === 'hilo_nervio') hs.push('Reflejos cosidos (+iniciativa)');
        if (d.id === 'colmillo_huargo' || d.id === 'colmillo') hs.push('Mordisco');
        if (d.id === 'pluma_velo' || d.id === 'ojo_cuervo') hs.push('Vista del Velo (percibe espíritus)');
        if (d.id === 'esencia_furia') hs.push('Frenesí');
        if (d.id === 'esencia_juramento') hs.push('Juramento (no huye)');
        if (d.id === 'esencia_dolor') hs.push('Insensible al dolor');
        if (d.id === 'plata_lab') hs.push('Toque de plata (daña a lo incorpóreo)');
        if (d.id === 'hierro_tumba') hs.push('Armadura de hierro-tumba');
        if (d.id === 'esencia_imitacion') hs.push('Imitación de voces');
        if (d.id === 'nucleo_hambre') hs.push('Hambre (debe alimentarse)');
        if (d.id === 'quitina') hs.push('Trepar');
      }
      if (!hs.length) hs.push('Golpe');
      return hs.filter(function (x, idx, arr2) { return arr2.indexOf(x) === idx; });
    }
    if (t.grado === 'critico' || t.grado === 'exito' || t.grado === 'parcial') {
      var bonif = t.grado === 'critico' ? 1.18 : 1;
      var defecto = null;
      if (t.grado === 'parcial') defecto = E.pick(['lealtad', 'mant', 'tullida', 'fragil']);
      s.critSeq++;
      var cr = {
        uid: 'cr' + s.critSeq, n: spec.nombre, esp: spec.especie || 'Construcción sin clasificar',
        nivel: ev.nivel, rango: ev.rango, xp: 0,
        vit: Math.round(ev.st.vit * bonif * (defecto === 'fragil' ? 0.7 : 1)),
        vitMax: Math.round(ev.st.vit * bonif * (defecto === 'fragil' ? 0.7 : 1)),
        man: Math.round(ev.st.man * bonif), fue: Math.round(ev.st.fue * bonif),
        vel: Math.round(ev.st.vel * bonif * (defecto === 'tullida' ? 0.6 : 1)),
        def: Math.round(ev.st.def * bonif), int: ev.int,
        hab: habilidades(), lealtad: Math.max(0, ev.lealtad - (defecto === 'lealtad' ? 25 : 0) + (t.grado === 'critico' ? 10 : 0)),
        mant: ev.mant + (defecto === 'mant' ? Math.ceil(ev.mant * 0.6) : 0),
        origen: ev.piezas.map(function (p) { return p.def.n + (p.q > 1 ? ' ×' + p.q : ''); }).join(', '),
        creada: E.fechaTxt(), funcion: spec.funcion || 'sin función asignada',
        pers: spec.personalidad || (ev.int > 40 ? 'incipiente' : 'ninguna'),
        estado: 'activa', defecto: defecto, historia: ['Construida en ' + E.lugar(s.pc.loc).n + ' el ' + E.fechaTxt() + '.'],
        evol: ev.int > 35 ? ['Desarrollo de personalidad', 'Mejora de armazón', 'Injerto de elemento'] : ['Mejora de armazón', 'Aumento de armazón', 'Injerto de elemento']
      };
      s.criaturas.push(cr);
      r.ctx.criatura = cr; r.ctx.resultado = t.grado;
      r.mec.push('Criatura construida: ' + cr.n + ' — nivel ' + cr.nivel + ' (' + cr.rango + '), lealtad ' + cr.lealtad + ', mantenimiento ' + cr.mant + ' maná/día.');
      if (defecto) r.mec.push('Defecto de fabricación: ' + ({ lealtad: 'obedece de mala gana (lealtad −25)', mant: 'consume más maná del previsto', tullida: 'cojea (velocidad −40%)', fragil: 'armazón frágil (vitalidad −30%)' })[defecto]);
      E.darXp(Math.round(ev.dif * (t.grado === 'critico' ? 1.7 : t.grado === 'exito' ? 1.2 : 0.7)), 'criatura creada');
      E.subirDom('crea_cr', t.grado === 'critico' ? 5 : 3);
      E.subirDom('nigro', 1.5);
      if (ev.nArm > 1) E.subirDom('fusion', 2);
      s.pc.notoriedad = Math.min(100, s.pc.notoriedad + (ev.nivel > 10 ? 3 : 1));
      r.mec.push('Notoriedad +' + (ev.nivel > 10 ? 3 : 1) + ' (hay algo nuevo en el mundo que no debería estar).');
    } else if (t.grado === 'fracaso') {
      r.ctx.resultado = 'fracaso';
      r.mec.push('El armazón no acepta el núcleo. Pierdes la mitad del material y las horas.');
      E.darXp(Math.round(ev.dif * 0.2), 'intento fallido');
      E.subirDom('crea_cr', 1);
    } else {
      r.ctx.resultado = 'fracaso_critico';
      var d = E.ri(5, 12) + ev.nivel;
      E.setHp(s.pc.hp - d);
      r.mec.push('La construcción se cierra sobre sí misma. ' + d + ' de daño.');
      if (ev.int > 25 && E.rnd() < 0.5) {
        var hostil = { id: 'esq_simple', n: spec.nombre + ' (fallida y hostil)', cant: 1, nv: Math.max(1, ev.nivel - 2) };
        r.ctx.encuentro = hostil;
        r.mec.push('Y se ha levantado sin obedecerte.');
      }
      E.subirDom('crea_cr', 0.5);
      s.pc.notoriedad = Math.min(100, s.pc.notoriedad + 2);
    }
    return E.cerrarRes(r);
  };

  A.ordenar = function (uid, orden) {
    var s = S(), r = E.nuevaRes('Orden a criatura');
    var cr = null;
    for (var i = 0; i < s.criaturas.length; i++) if (s.criaturas[i].uid === uid) cr = s.criaturas[i];
    if (!cr) { r.ok = false; r.mec.push('No tienes esa criatura.'); return E.cerrarRes(r); }
    if (cr.estado === 'destruida') { r.ok = false; r.mec.push(cr.n + ' fue destruida.'); return E.cerrarRes(r); }
    if (cr.estado === 'inactiva') {
      var coste = cr.mant * 2;
      if (s.pc.mana < coste) { r.ok = false; r.mec.push('Reactivarla cuesta ' + coste + ' de maná.'); return E.cerrarRes(r); }
      E.setMana(s.pc.mana - coste); cr.estado = 'activa';
      r.mec.push(cr.n + ' vuelve a moverse (−' + coste + ' maná).');
    }
    r.ctx.tipo = 'orden'; r.ctx.criatura = cr.n; r.ctx.orden = orden;
    var complej = /busca|vigila|sigue|trae|espera|ataca/i.test(orden || '') ? 0 : 15;
    var t = E.tirada(28 + cr.int * 0.5 + complej - cr.lealtad * 0.3, [mod('control de no-muertos', E.dom('ctrl_nm') * 0.9),
      mod('voluntad', s.pc.st.vol * 0.8), mod('lealtad', cr.lealtad * 0.25)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    E.avanzar(10);
    if (t.grado === 'critico' || t.grado === 'exito') {
      r.mec.push(cr.n + ' obedece.');
      cr.historia.push(E.fechaTxt() + ': orden "' + orden + '" — cumplida.');
      cr.xp += 3;
      E.subirDom('ctrl_nm', 0.5);
      if (cr.xp >= cr.nivel * 20) { cr.xp = 0; cr.nivel++; cr.vitMax += 4; cr.vit = cr.vitMax; cr.fue += 2; r.mec.push(cr.n + ' sube a nivel ' + cr.nivel + '.'); }
    } else if (t.grado === 'parcial') {
      r.mec.push(cr.n + ' hace parte de lo ordenado, a su manera.');
      cr.historia.push(E.fechaTxt() + ': orden "' + orden + '" — cumplida a medias.');
    } else {
      cr.lealtad = Math.max(0, cr.lealtad - E.ri(2, 6));
      r.mec.push(cr.n + ' no obedece. Lealtad ' + cr.lealtad + '.');
      cr.historia.push(E.fechaTxt() + ': orden "' + orden + '" — desobedecida.');
      if (t.grado === 'fracaso_critico' && cr.int > 40) { cr.estado = 'rebelde'; r.mec.push(cr.n + ' se ha vuelto rebelde.'); }
    }
    return E.cerrarRes(r);
  };

  A.evolucionar = function (uid, via) {
    var s = S(), r = E.nuevaRes('Evolución de criatura');
    var cr = null;
    for (var i = 0; i < s.criaturas.length; i++) if (s.criaturas[i].uid === uid) cr = s.criaturas[i];
    if (!cr) { r.ok = false; r.mec.push('No tienes esa criatura.'); return E.cerrarRes(r); }
    if (E.dom('evo_cr') < 5 && E.dom('mod_cr') < 10) {
      r.ok = false;
      r.mec.push('Para reescribir una criatura ya construida necesitas Modificación de criaturas ≥ 10 o Evolución de criaturas ≥ 5.');
      return E.cerrarRes(r);
    }
    var mats = [{ c: 'rescoldo', q: 1 }, { c: 'sal_osa', q: 2 }];
    if (via === 'elemento') mats.push({ c: 'cristal_man', q: 1 });
    var faltan = mats.filter(function (m) { return (s.comp[m.c] || 0) < m.q; });
    if (faltan.length) { r.ok = false; r.mec.push('Faltan: ' + faltan.map(function (m) { return E.compDef(m.c).n + ' ×' + m.q; }).join(', ') + '.'); return E.cerrarRes(r); }
    r.ctx.tipo = 'evolucion'; r.ctx.criatura = cr.n; r.ctx.via = via || 'armazón';
    var dif = 40 + cr.nivel * 2 + cr.int * 0.4;
    var t = E.tirada(dif, [mod('modificación', E.dom('mod_cr') * 0.7), mod('evolución', E.dom('evo_cr') * 0.9),
      mod('control', s.pc.st.ctl)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    for (var m2 = 0; m2 < mats.length; m2++) E.quitarItem(mats[m2].c, mats[m2].q);
    E.avanzar(5 * 60);
    E.setMana(Math.max(0, s.pc.mana - 15));
    if (t.grado === 'critico' || t.grado === 'exito') {
      var g = t.grado === 'critico' ? 1.35 : 1.18;
      cr.vitMax = Math.round(cr.vitMax * g); cr.vit = cr.vitMax;
      cr.fue = Math.round(cr.fue * g); cr.def = Math.round(cr.def * g); cr.nivel++;
      if (via === 'elemento') cr.hab.push('Injerto elemental');
      if (via === 'inteligencia') { cr.int = Math.min(cr.int + 12, 95); cr.lealtad = Math.max(0, cr.lealtad - 8); cr.hab.push('Juicio propio'); }
      if (t.grado === 'critico') cr.hab.push('Rasgo emergente: ' + E.pick(['regeneración ósea', 'silencio absoluto', 'resistencia a la luz', 'presencia que asusta a los animales']));
      cr.historia.push(E.fechaTxt() + ': evolución por ' + (via || 'armazón') + ' — ' + E.gradoTxt[t.grado] + '.');
      r.mec.push(cr.n + ' evoluciona: nivel ' + cr.nivel + ', vitalidad ' + cr.vitMax + ', fuerza ' + cr.fue + '.');
      E.darXp(Math.round(dif * 1.2), 'evolución');
      E.subirDom('evo_cr', 3); E.subirDom('mod_cr', 2);
    } else if (t.grado === 'parcial') {
      cr.vitMax = Math.round(cr.vitMax * 1.05); cr.lealtad = Math.max(0, cr.lealtad - 5);
      r.mec.push('Mejora mínima y algo de rechazo. Lealtad ' + cr.lealtad + '.');
      E.subirDom('mod_cr', 1);
    } else {
      var dmg = Math.round(cr.vitMax * (t.grado === 'fracaso_critico' ? 0.6 : 0.25));
      cr.vit = Math.max(1, cr.vit - dmg);
      r.mec.push('Rechazo: ' + cr.n + ' pierde ' + dmg + ' de vitalidad.');
      if (t.grado === 'fracaso_critico') {
        if (E.rnd() < 0.4) { cr.estado = 'destruida'; r.mec.push(cr.n + ' se ha deshecho por completo.'); }
        else { cr.lealtad = Math.max(0, cr.lealtad - 20); r.mec.push('Y recuerda quién le ha hecho eso.'); }
      }
      cr.historia.push(E.fechaTxt() + ': evolución fallida.');
    }
    return E.cerrarRes(r);
  };
})();

/* ═════════ Investigación, combate, dominios, rangos, memoria ═════════ */
(function () {
  var W = window.TS.W, E = window.TS.E, A = E.A;
  function S() { return E.getS(); }
  function mod(n, v) { return { n: n, v: Math.round(v) }; }

  /* ── INVESTIGACIÓN ── */
  E.investigacionesDisponibles = function () {
    var s = S(), out = [];
    for (var i = 0; i < W.investigaciones.length; i++) {
      var p = W.investigaciones[i];
      if (s.hechos.indexOf(p.id) >= 0) continue;
      if (s.proyectos.some(function (x) { return x.id === p.id && x.estado === 'activo'; })) continue;
      var falta = [];
      for (var k in (p.req || {})) {
        var val = k === 'legibilidad' ? s.codice.leg : (s.pc.st[k] != null ? s.pc.st[k] : E.dom(k));
        if (val < p.req[k]) falta.push((k === 'legibilidad' ? 'Legibilidad del Códice' : E.nombreDe(k)) + ' ≥ ' + p.req[k] + ' (tienes ' + Math.round(val * 10) / 10 + ')');
      }
      out.push({ def: p, falta: falta, disponible: !falta.length });
    }
    return out;
  };

  A.investigarIniciar = function (pid) {
    var s = S(), r = E.nuevaRes('Nueva investigación'), def = E.invDef(pid);
    if (!def) { r.ok = false; r.mec.push('No conoces esa línea de investigación.'); return E.cerrarRes(r); }
    if (s.proyectos.some(function (x) { return x.id === pid && x.estado === 'activo'; })) { r.ok = false; r.mec.push('Ya está en marcha.'); return E.cerrarRes(r); }
    var disp = E.investigacionesDisponibles().filter(function (x) { return x.def.id === pid; })[0];
    if (disp && disp.falta.length) { r.ok = false; r.mec.push('Requisitos: ' + disp.falta.join(' · ')); return E.cerrarRes(r); }
    var faltanMat = (def.mat || []).filter(function (m) { return (s.comp[m.c] || 0) < m.q; });
    if (faltanMat.length) { r.ok = false; r.mec.push('Materiales necesarios: ' + faltanMat.map(function (m) { return E.compDef(m.c).n + ' ×' + m.q; }).join(', ')); return E.cerrarRes(r); }
    s.proyectos.push({
      id: pid, n: def.n, rama: def.rama, dif: def.dif, prog: 0,
      total: def.dias * 8, estado: 'activo', asistentes: 0, inicio: E.fechaTxt(), notas: []
    });
    r.ctx.tipo = 'investigacion_inicio'; r.ctx.n = def.n;
    r.mec.push('Abierta: "' + def.n + '" — ' + def.dias + ' jornadas estimadas (' + def.dias * 8 + ' h de trabajo), dificultad ' + def.dif + '.');
    r.mec.push('Materiales reservados: ' + (def.mat || []).map(function (m) { return E.compDef(m.c).n + ' ×' + m.q; }).join(', ') || 'ninguno');
    E.avanzar(30);
    return E.cerrarRes(r);
  };

  A.investigarLibre = function (spec) {
    var s = S(), r = E.nuevaRes('Investigación propia');
    if (!spec.objetivo) { r.ok = false; r.mec.push('Define qué quieres averiguar.'); return E.cerrarRes(r); }
    var escala = Math.max(1, Math.min(10, spec.escala || 3));
    var dif = 20 + escala * 11;
    var dias = Math.max(2, Math.round(escala * 3.5));
    s.proyectos.push({
      id: 'libre_' + (s.proyectos.length + 1), n: spec.objetivo, rama: spec.rama || 'thanat', dif: dif,
      prog: 0, total: dias * 8, estado: 'activo', asistentes: 0, inicio: E.fechaTxt(), libre: true,
      premio: { dominio: spec.rama ? spec.rama : 'thanat', xp: Math.round(dif * 2.2) }, notas: []
    });
    r.ctx.tipo = 'investigacion_inicio'; r.ctx.n = spec.objetivo;
    r.mec.push('Abierta línea propia: "' + spec.objetivo + '" — dificultad estimada ' + dif + ', ' + dias + ' jornadas.');
    r.mec.push('El resultado no está garantizado: puede salir parcial, nulo o distinto de lo buscado.');
    E.avanzar(60);
    return E.cerrarRes(r);
  };

  A.investigarTrabajar = function (pid, horas) {
    var s = S(), r = E.nuevaRes('Trabajo de investigación');
    horas = Math.max(1, Math.min(10, horas || 4));
    var p = null;
    for (var i = 0; i < s.proyectos.length; i++) if (s.proyectos[i].id === pid && s.proyectos[i].estado === 'activo') p = s.proyectos[i];
    if (!p) { r.ok = false; r.mec.push('No hay una investigación activa con ese nombre.'); return E.cerrarRes(r); }
    if (!s.inv.libreta) { r.ok = false; r.mec.push('Necesitas tu libreta para registrar resultados.'); return E.cerrarRes(r); }
    r.ctx.tipo = 'investigacion'; r.ctx.n = p.n;
    var t = E.tirada(42, [mod('inteligencia', s.pc.st.int * 1.3), mod('percepción', s.pc.st.per * 0.4),
      mod('dominio de la rama', E.dom(p.rama) * 0.5), mod('horas', horas * 1.2),
      mod(s.pc.descanso < 30 ? 'agotado' : 'lúcido', s.pc.descanso < 30 ? -14 : 4)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    var f = t.grado === 'critico' ? 1.9 : t.grado === 'exito' ? 1.25 : t.grado === 'parcial' ? 0.7 : t.grado === 'fracaso' ? 0.25 : 0;
    var gan = Math.round(horas * f * 10) / 10;
    p.prog = Math.round((p.prog + gan) * 10) / 10;
    E._delta('Progreso: ' + p.n, (p.prog - gan).toFixed(1) + '/' + p.total + ' h', p.prog.toFixed(1) + '/' + p.total + ' h');
    r.mec.push('Progreso ' + p.prog + '/' + p.total + ' h (' + Math.round(p.prog / p.total * 100) + '%).');
    E.avanzar(horas * 60);
    s.pc.descanso = Math.max(0, s.pc.descanso - horas * 3.5);
    E.darXp(Math.round(horas * 1.5 * f), 'investigación');
    if (t.grado === 'fracaso_critico') {
      r.mec.push('Accidente de laboratorio.');
      E.setHp(s.pc.hp - E.ri(2, 7));
      if (E.rnd() < 0.4 && p.prog > 5) { p.prog = Math.max(0, p.prog - 6); r.mec.push('Se han perdido notas: −6 h de progreso.'); }
    }
    if (p.prog >= p.total) {
      r.mundo = r.mundo.concat([]);
      var fin = completarInvestigacion(p, r);
      r.ctx.completada = fin;
    }
    return E.cerrarRes(r);
  };

  function completarInvestigacion(p, r) {
    var s = S(), def = E.invDef(p.id);
    var t = E.tirada(p.dif, [mod('inteligencia', s.pc.st.int * 1.1), mod('dominio', E.dom(p.rama) * 0.8),
      mod('voluntad', s.pc.st.vol * 0.4), mod('suerte', s.pc.st.sue * 0.3),
      mod('Códice', s.inv.codice ? Math.round(s.codice.leg * 0.12) : 0)]);
    r.tiradas.push(t); r.mec.push('RESOLUCIÓN FINAL — ' + E.tiradaLinea(t));
    p.estado = t.grado === 'fracaso_critico' ? 'fallida' : (t.grado === 'fracaso' ? 'estancada' : 'completada');
    // consumir materiales
    if (def && def.mat) for (var i = 0; i < def.mat.length; i++) E.quitarItem(def.mat[i].c, def.mat[i].q);
    var prem = (def && def.premio) || p.premio || {};
    if (t.grado === 'fracaso') {
      r.mec.push('Resultado nulo. El trabajo queda estancado: podrás retomarlo con mejor dominio o mejores materiales.');
      p.prog = Math.round(p.total * 0.6);
      p.estado = 'activo';
      E.darXp(Math.round(p.dif * 0.3), 'investigación estancada');
      return { grado: t.grado };
    }
    if (t.grado === 'fracaso_critico') {
      r.mec.push('El experimento falla de forma peligrosa.');
      E.setHp(s.pc.hp - E.ri(6, 15));
      var c0 = s.pc.cordura; s.pc.cordura = Math.max(0, s.pc.cordura - E.ri(3, 8));
      E._delta('Cordura', c0, s.pc.cordura);
      if (def && def.riesgo && E.rnd() < def.riesgo / 100) r.mec.push('Y algo ha quedado mal cerrado.');
      return { grado: t.grado };
    }
    var parcial = t.grado === 'parcial';
    var factor = t.grado === 'critico' ? 1.4 : parcial ? 0.5 : 1;
    if (prem.dominio) {
      if (typeof prem.dominio === 'string') { var g0 = E.subirDom(prem.dominio, 10 * factor); r.mec.push('Dominio ' + E.nombreDe(prem.dominio) + ' +' + g0.toFixed(1) + '.'); }
      else for (var k in prem.dominio) { var g = E.subirDom(k, prem.dominio[k] * factor); r.mec.push('Dominio ' + E.nombreDe(k) + ' +' + g.toFixed(1) + '.'); }
    }
    if (prem.xp) E.darXp(Math.round(prem.xp * factor), 'investigación completada');
    if (prem.legibilidad && !parcial) { var a = s.codice.leg; s.codice.leg = Math.min(100, s.codice.leg + prem.legibilidad); E._delta('Legibilidad del Códice', a + '%', s.codice.leg + '%'); }
    if (prem.comp && !parcial) for (var ci = 0; ci < prem.comp.length; ci++) { E.addItem(prem.comp[ci].c, prem.comp[ci].q); r.mec.push('Obtenido: ' + E.compDef(prem.comp[ci].c).n + ' ×' + prem.comp[ci].q + '.'); }
    if (prem.saber && !parcial) E.descubrir('saber', prem.saber, 'investigación');
    if (prem.principio && !parcial) { s.pc.principios.push(prem.principio); r.mec.push('Principio establecido: "' + prem.principio + '".'); }
    if (prem.receta && !parcial) { s.recetas.push(prem.receta); r.mec.push('Receta disponible: ' + prem.receta + '.'); }
    if (prem.mortaja && !parcial) {
      s.codice.mortajas[prem.mortaja - 1] = true;
      var mt = W.mortajas[prem.mortaja - 1];
      r.mec.push('MORTAJA ABIERTA: ' + mt.titulo + ' → ' + mt.contiene.join('; ') + '.');
      E.subirDom('nigro', 8);
    }
    if (prem.hechizo === 'rescoldo_completo' && !parcial) {
      var h = E.hechizo('rescoldo_palido');
      if (h) { h.incompleto = false; h.n = 'Prender el Rescoldo Pálido'; h.sec = 'Ninguno conocido'; h.dif = 34; h.nivel = 2; h.pot = 4; r.mec.push('"Prender el Rescoldo Pálido" queda completa: dificultad 34, sin retroceso.'); }
    }
    if (parcial) r.mec.push('Resultado parcial: tienes la mitad de la respuesta y la mitad que falta es la importante.');
    if (p.estado === 'completada') s.hechos.push(p.id);
    return { grado: t.grado, premio: prem };
  }

  /* ── COMBATE ── */
  A.iniciarCombate = function (spec) {
    var s = S(), r = E.nuevaRes('Combate');
    var enemigos = [], seq = 0;
    var lista = Array.isArray(spec) ? spec : [spec];
    for (var i = 0; i < lista.length; i++) {
      var e = lista[i], bd = E.bestDef(e.id);
      var cant = e.cant || 1;
      for (var c = 0; c < cant; c++) {
        seq++;
        var base = bd || { n: e.n || 'Enemigo', nv: e.nv || 2, vit: e.vit || 14, fue: e.fue || 8, vel: e.vel || 10, def: e.def || 5, int: e.int || 20, hab: ['Golpe'] };
        enemigos.push({
          uid: 'e' + seq, n: base.n + (cant > 1 ? ' ' + (c + 1) : ''), bid: bd ? bd.id : null, nv: base.nv,
          vit: base.vit, vitMax: base.vit, fue: base.fue, vel: base.vel, def: base.def, int: base.int,
          hab: base.hab || ['Golpe'], estado: 'activo'
        });
      }
      if (bd) E.descubrir('best', bd.id, 'combate');
    }
    var aliados = s.criaturas.filter(function (x) { return x.estado === 'activa'; }).map(function (x) { return x.uid; });
    s.combate = { ronda: 1, enemigos: enemigos, aliados: aliados, log: [], terminado: false };
    r.ctx.tipo = 'combate_inicio';
    r.ctx.enemigos = enemigos.map(function (x) { return x.n + ' (nv ' + x.nv + ')'; });
    r.mec.push('Combate iniciado. Enemigos: ' + r.ctx.enemigos.join(', ') + '.');
    r.mec.push('Tus fuerzas: ' + s.pc.nombre + ' (' + Math.round(s.pc.hp) + '/' + E.hpMax() + ')' + (aliados.length ? ' + ' + aliados.length + ' criatura(s)' : ' (sin apoyo)') + '.');
    return E.cerrarRes(r);
  };

  function crPor(uid) { var s = S(); for (var i = 0; i < s.criaturas.length; i++) if (s.criaturas[i].uid === uid) return s.criaturas[i]; return null; }
  function enemVivos() { var s = S(); return s.combate.enemigos.filter(function (e) { return e.estado === 'activo'; }); }

  A.combateAccion = function (acc) {
    var s = S(), r = E.nuevaRes('Ronda de combate');
    if (!s.combate || s.combate.terminado) { r.ok = false; r.mec.push('No hay combate en curso.'); return E.cerrarRes(r); }
    var cb = s.combate;
    r.ctx.tipo = 'combate'; r.ctx.ronda = cb.ronda; r.ctx.acciones = [];
    var vivos = enemVivos();
    if (!vivos.length) { return finCombate(r, true); }
    var objetivo = null;
    for (var i = 0; i < vivos.length; i++) if (vivos[i].uid === acc.objetivo) objetivo = vivos[i];
    if (!objetivo) objetivo = vivos[0];

    // 1) acción del jugador
    if (acc.tipo === 'huir') {
      var dificultadHuida = 38 + objetivo.vel - s.pc.st.vel * 1.1;
      var th = E.tirada(dificultadHuida, [mod('velocidad', s.pc.st.vel), mod('criaturas cubriendo', cb.aliados.length * 6)]);
      r.tiradas.push(th); r.mec.push('Huida — ' + E.tiradaLinea(th));
      if (th.grado === 'exito' || th.grado === 'critico') {
        cb.terminado = true; s.combate = null;
        r.ctx.huida = true; r.mec.push('Has escapado.');
        E.avanzar(20);
        return E.cerrarRes(r);
      }
      r.mec.push('No logras romper el contacto.');
      r.ctx.acciones.push({ quien: s.pc.nombre, txt: 'intenta huir y no consigue separarse' });
    } else if (acc.tipo === 'atacar') {
      var arma = s.inv.cuch_barb ? { n: 'cuchillo', d: 6 } : { n: 'manos', d: 2 };
      var ta = E.tirada(40 + objetivo.def * 0.8, [mod('fuerza', s.pc.st.fue * 0.7), mod('velocidad', s.pc.st.vel * 0.4)]);
      r.tiradas.push(ta); r.mec.push('Ataque con ' + arma.n + ' — ' + E.tiradaLinea(ta));
      if (ta.grado !== 'fracaso' && ta.grado !== 'fracaso_critico') {
        var dmg = Math.max(1, Math.round(arma.d + s.pc.st.fue * 0.4 + ta.margen * 0.12) * (ta.grado === 'critico' ? 2 : ta.grado === 'parcial' ? 0.5 : 1));
        objetivo.vit -= dmg;
        r.mec.push(objetivo.n + ' recibe ' + dmg + ' (' + Math.max(0, objetivo.vit) + '/' + objetivo.vitMax + ').');
        r.ctx.acciones.push({ quien: s.pc.nombre, txt: 'golpea a ' + objetivo.n + ' con el ' + arma.n + ' causando ' + dmg });
      } else {
        r.mec.push('Fallas.');
        r.ctx.acciones.push({ quien: s.pc.nombre, txt: 'falla el golpe contra ' + objetivo.n });
        if (ta.grado === 'fracaso_critico') { E.setHp(s.pc.hp - 2); r.mec.push('Y te haces daño en el intento.'); }
      }
    } else if (acc.tipo === 'hechizo') {
      var h = E.hechizo(acc.hechizo);
      if (!h) { r.ok = false; r.mec.push('No conoces ese hechizo.'); return E.cerrarRes(r); }
      var coste = Math.round(h.coste / E.mareaMod());
      if (s.pc.mana < coste) { r.mec.push('Sin maná suficiente (' + coste + ' necesarios). Pierdes la acción tanteando.'); }
      else {
        E.setMana(s.pc.mana - coste);
        var mods = [mod('precisión', E.precision()), mod('dominio', E.dom(h.esc[0]) * 0.6)];
        if (h.incompleto) mods.push(mod('incompleta', -18));
        if (h.rama) mods.push(mod('Velo', E.veloMod()));
        var ts = E.tirada(h.dif + objetivo.def * 0.4, mods);
        r.tiradas.push(ts); r.mec.push(h.n + ' — ' + E.tiradaLinea(ts));
        h.usos = (h.usos || 0) + 1;
        if (ts.grado === 'exito' || ts.grado === 'critico' || ts.grado === 'parcial') {
          if (h.efecto === 'daño' || h.efecto === 'destruc' || h.efecto === 'maldecir') {
            var sd = Math.max(1, Math.round((h.pot * 3 + ts.margen * 0.2) * (ts.grado === 'critico' ? 1.8 : ts.grado === 'parcial' ? 0.45 : 1)));
            objetivo.vit -= sd;
            r.mec.push(objetivo.n + ' sufre ' + sd + ' (' + Math.max(0, objetivo.vit) + '/' + objetivo.vitMax + ').');
            r.ctx.acciones.push({ quien: s.pc.nombre, txt: 'lanza ' + h.n + ' sobre ' + objetivo.n + ' causando ' + sd });
          } else {
            objetivo.estado = h.efecto === 'sellar' && ts.grado === 'critico' ? 'sellado' : objetivo.estado;
            r.mec.push('Efecto aplicado: ' + h.efecto + (objetivo.estado === 'sellado' ? ' — ' + objetivo.n + ' queda sellado y fuera de combate.' : '.'));
            r.ctx.acciones.push({ quien: s.pc.nombre, txt: 'usa ' + h.n + ' (' + h.efecto + ') contra ' + objetivo.n });
          }
          E.subirDom(h.esc[0], 0.4);
        } else {
          r.mec.push('El tejido se deshace.');
          r.ctx.acciones.push({ quien: s.pc.nombre, txt: 'intenta ' + h.n + ' y el tejido se deshace' });
          if (ts.grado === 'fracaso_critico') { var rd = E.ri(2, 6); E.setHp(s.pc.hp - rd); r.mec.push('Retroceso: ' + rd + ' de daño.'); }
        }
      }
    } else if (acc.tipo === 'defender') {
      s.pc.efectos.push({ n: 'a la defensiva', dias: 1, def: 12 });
      r.mec.push('Te cubres: +12 a la defensa esta ronda.');
      r.ctx.acciones.push({ quien: s.pc.nombre, txt: 'se cubre y busca una apertura' });
    } else if (acc.tipo === 'objeto') {
      var o = E.objDef(acc.item);
      if (o && s.inv[acc.item] && o.efecto) {
        if (o.efecto.hp) E.setHp(s.pc.hp + o.efecto.hp);
        if (o.efecto.mana) E.setMana(s.pc.mana + o.efecto.mana);
        E.quitarItem(acc.item, 1);
        r.mec.push('Usas ' + o.n + '.');
        r.ctx.acciones.push({ quien: s.pc.nombre, txt: 'usa ' + o.n });
      } else r.mec.push('No puedes usar eso.');
    }

    // 2) criaturas aliadas
    for (var ai = 0; ai < cb.aliados.length; ai++) {
      var cr = crPor(cb.aliados[ai]);
      if (!cr || cr.estado !== 'activa' || cr.vit <= 0) continue;
      var vv = enemVivos();
      if (!vv.length) break;
      var tgt = vv[0];
      var tl = E.tirada(20 + cr.int * 0.3 - cr.lealtad * 0.25, [mod('lealtad', cr.lealtad * 0.3)]);
      if (tl.grado === 'fracaso_critico') { r.mec.push(cr.n + ' no reacciona a tu orden.'); continue; }
      var tc = E.tirada(38 + tgt.def * 0.7, [mod('fuerza', cr.fue * 0.6), mod('velocidad', cr.vel * 0.3)]);
      if (tc.grado !== 'fracaso' && tc.grado !== 'fracaso_critico') {
        var cd = Math.max(1, Math.round((cr.fue * 0.5 + E.ri(1, 6)) * (tc.grado === 'critico' ? 1.8 : tc.grado === 'parcial' ? 0.5 : 1)));
        tgt.vit -= cd;
        r.mec.push(cr.n + ' ataca a ' + tgt.n + ': ' + cd + ' de daño.');
        r.ctx.acciones.push({ quien: cr.n, txt: 'ataca a ' + tgt.n + ' causando ' + cd });
        cr.xp += 2;
      } else { r.mec.push(cr.n + ' falla.'); }
    }

    // bajas enemigas
    var vv2 = cb.enemigos;
    for (var ei = 0; ei < vv2.length; ei++) {
      if (vv2[ei].estado === 'activo' && vv2[ei].vit <= 0) {
        vv2[ei].estado = 'destruido';
        r.mec.push(vv2[ei].n + ' cae.');
        r.ctx.acciones.push({ quien: vv2[ei].n, txt: 'cae' });
      }
    }
    if (!enemVivos().length) return finCombate(r, true);

    // 3) enemigos actúan
    var activos = enemVivos();
    for (var k = 0; k < activos.length; k++) {
      var en = activos[k];
      // huida del enemigo
      if (en.vit < en.vitMax * 0.25 && en.int > 20 && E.rnd() < 0.35) {
        en.estado = 'huido';
        r.mec.push(en.n + ' se retira.');
        r.ctx.acciones.push({ quien: en.n, txt: 'se retira' });
        continue;
      }
      var alAliados = cb.aliados.map(crPor).filter(function (x) { return x && x.estado === 'activa' && x.vit > 0; });
      var atacaCriatura = alAliados.length && E.rnd() < 0.45;
      var defObj = atacaCriatura ? (alAliados[0].def + 30) : (E.defensa() + 34 + (s.pc.efectos.some(function (x) { return x.def; }) ? 12 : 0));
      var te = E.tirada(defObj, [mod('fuerza', en.fue * 0.6), mod('nivel', en.nv * 1.2), mod('velocidad', en.vel * 0.3)]);
      if (te.grado === 'exito' || te.grado === 'critico' || te.grado === 'parcial') {
        var ed = Math.max(1, Math.round((en.fue * 0.5 + E.ri(1, 6)) * (te.grado === 'critico' ? 1.9 : te.grado === 'parcial' ? 0.5 : 1)));
        if (atacaCriatura) {
          alAliados[0].vit -= ed;
          r.mec.push(en.n + ' golpea a ' + alAliados[0].n + ': ' + ed + ' (' + Math.max(0, alAliados[0].vit) + '/' + alAliados[0].vitMax + ').');
          r.ctx.acciones.push({ quien: en.n, txt: 'golpea a ' + alAliados[0].n + ' causando ' + ed });
          if (alAliados[0].vit <= 0) {
            alAliados[0].estado = 'destruida';
            alAliados[0].historia.push(E.fechaTxt() + ': destruida en combate.');
            r.mec.push(alAliados[0].n + ' queda destruida.');
          }
        } else {
          E.setHp(s.pc.hp - ed);
          r.mec.push(en.n + ' te alcanza: ' + ed + ' de daño (' + Math.round(s.pc.hp) + '/' + E.hpMax() + ').');
          r.ctx.acciones.push({ quien: en.n, txt: 'te alcanza causando ' + ed });
        }
      } else {
        r.mec.push(en.n + ' falla su ataque.');
      }
    }
    s.pc.efectos = s.pc.efectos.filter(function (x) { return !x.def; });
    cb.ronda++;
    E.avanzar(1);
    if (s.pc.hp <= 0) return muerte(r);
    if (!enemVivos().length) return finCombate(r, true);
    r.mec.push('— Fin de la ronda ' + (cb.ronda - 1) + ' —');
    r.ctx.estado = {
      jugador: Math.round(s.pc.hp) + '/' + E.hpMax(), mana: Math.round(s.pc.mana) + '/' + E.manaMax(),
      enemigos: enemVivos().map(function (e) { return e.n + ' ' + Math.max(0, e.vit) + '/' + e.vitMax; })
    };
    return E.cerrarRes(r);
  };

  function finCombate(r, victoria) {
    var s = S(), cb = s.combate;
    if (!cb) return E.cerrarRes(r);
    var xp = 0, drops = [];
    for (var i = 0; i < cb.enemigos.length; i++) {
      var e = cb.enemigos[i];
      if (e.estado === 'destruido' || e.estado === 'sellado') {
        xp += e.nv * 11 + 5;
        var bd = e.bid ? E.bestDef(e.bid) : null;
        if (bd && bd.drops) {
          for (var d = 0; d < bd.drops.length; d++) {
            if (E.rnd() < 0.55) { E.addItem(bd.drops[d], 1); drops.push(E.compDef(bd.drops[d]) ? E.compDef(bd.drops[d]).n : bd.drops[d]); }
          }
        }
      }
    }
    r.ctx.tipo = 'combate_fin'; r.ctx.victoria = true;
    r.mec.push('Combate terminado.');
    if (xp) { E.darXp(xp, 'combate'); r.mec.push('+' + xp + ' XP.'); }
    if (drops.length) r.mec.push('Botín: ' + drops.join(', ') + '.');
    // las criaturas aprenden
    for (var a = 0; a < cb.aliados.length; a++) {
      var cr = crPor(cb.aliados[a]);
      if (cr && cr.estado === 'activa') {
        cr.xp += 6;
        if (cr.xp >= cr.nivel * 20) { cr.xp = 0; cr.nivel++; cr.vitMax += 5; cr.vit = cr.vitMax; cr.fue += 2; r.mec.push(cr.n + ' sube a nivel ' + cr.nivel + ' por experiencia de combate.'); }
      }
    }
    s.combate = null;
    return E.cerrarRes(r);
  }

  function muerte(r) {
    var s = S();
    r.ctx.tipo = 'muerte';
    s.combate = null;
    r.mec.push('Tu vitalidad ha llegado a cero.');
    if (s.flags.ancla) {
      s.flags.ancla = false;
      E.setHp(Math.round(E.hpMax() * 0.25));
      var perdXp = Math.round(s.pc.xp * 0.4);
      s.pc.xp = Math.max(0, s.pc.xp - perdXp);
      s.pc.cordura = Math.max(0, s.pc.cordura - 20);
      r.mec.push('El ancla espiritual se consume y te devuelve: −' + perdXp + ' XP, −20 cordura. El ancla ya no existe.');
      r.ctx.recuperado = true;
    } else {
      s.pc.muerto = true;
      r.mec.push('No tenías ancla espiritual, pacto ni artefacto de retorno. Maikel ha muerto.');
      r.mec.push('El mundo continúa sin ti: usa /cargar con un guardado anterior, o empieza una crónica nueva.');
      E.log('muerte', 'Maikel muere en ' + E.lugar(s.pc.loc).n + '.');
    }
    return E.cerrarRes(r);
  }
  E.muerte = muerte;

  /* ── PRUEBA DE RANGO ── */
  A.pruebaRango = function () {
    var s = S(), r = E.nuevaRes('Prueba de rango'), g = E.rango();
    if (s.pc.nivel < g.max) { r.ok = false; r.mec.push('Las pruebas de rango se intentan al alcanzar el nivel ' + g.max + ' (vas por el ' + s.pc.nivel + ').'); return E.cerrarRes(r); }
    if (s.pc.pruebas[g.i]) { r.ok = false; r.mec.push('Ya superaste la prueba de ' + g.n + '.'); return E.cerrarRes(r); }
    r.ctx.tipo = 'prueba_rango'; r.ctx.prueba = g.prueba;
    r.mec.push('Prueba: ' + g.prueba.n + ' — ' + g.prueba.desc);
    r.mec.push('Requisitos declarados: ' + g.prueba.req);
    var dif = 55 + g.i * 10;
    var t = E.tirada(dif, [mod('voluntad', s.pc.st.vol * 1.2), mod('nigromancia', E.dom('nigro') * 0.7),
      mod('control', s.pc.st.ctl * 0.8), mod('cordura', (s.pc.cordura - 70) * 0.25), mod('principios', s.pc.principios.length * 5)]);
    r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
    E.avanzar(6 * 60);
    if (t.grado === 'exito' || t.grado === 'critico') {
      s.pc.pruebas[g.i] = true; s.pc.bloqueoRango = null;
      r.mec.push('Prueba superada. El siguiente rango queda abierto: ' + (W.rangos[g.i + 1] ? W.rangos[g.i + 1].n : '—') + '.');
      E.darXp(Math.round(dif * 2), 'prueba de rango');
      s.pc.titulos.push(g.prueba.n);
    } else if (t.grado === 'parcial') {
      r.mec.push('Casi. La prueba no se supera a medias: puedes reintentarla, pero el desgaste es real.');
      E.setHp(s.pc.hp - E.ri(5, 12));
      s.pc.cordura = Math.max(0, s.pc.cordura - 5);
    } else {
      r.mec.push('Fracaso.');
      E.setHp(s.pc.hp - E.ri(10, 25));
      s.pc.cordura = Math.max(0, s.pc.cordura - E.ri(5, 15));
      if (s.pc.hp <= 0) return muerte(r);
    }
    return E.cerrarRes(r);
  };

  /* ── ORGANIZACIÓN Y CIUDADES ── */
  A.fundarOrg = function (spec) {
    var s = S(), r = E.nuevaRes('Fundación de organización');
    if (s.org) { r.ok = false; r.mec.push('Ya diriges ' + s.org.n + '. Puedes refundarla o expandirla, no duplicarla.'); return E.cerrarRes(r); }
    if (!spec.n) { r.ok = false; r.mec.push('Necesita nombre.'); return E.cerrarRes(r); }
    var seguidores = s.criaturas.filter(function (c) { return c.estado === 'activa'; }).length;
    var aliados = 0;
    for (var k in s.npcs) if (s.npcs[k].vivo && s.npcs[k].op >= 45) aliados++;
    if (seguidores + aliados < 2) {
      r.ok = false;
      r.mec.push('Una organización necesita al menos dos apoyos: criaturas activas o personas con opinión ≥ 45. Tienes ' + (seguidores + aliados) + '.');
      return E.cerrarRes(r);
    }
    var coste = 60;
    if (!E.pagar(coste)) { r.ok = false; r.mec.push('Hacen falta ' + E.dinero(coste) + ' para los primeros gastos.'); return E.cerrarRes(r); }
    s.org = {
      n: spec.n, tipo: spec.tipo || 'Círculo clandestino', ideologia: spec.ideologia || 'sin declarar',
      lider: s.pc.nombre, miembros: seguidores + aliados, moral: 65, tesoro: 0, influencia: 3,
      rangos: spec.rangos || ['Iniciado', 'Mano', 'Voz', 'Heredero'], territorios: [], instalaciones: [],
      enemigos: [], aliados: [], secreta: spec.secreta !== false, fundada: E.fechaTxt(), dias: 0, miembrosNpc: []
    };
    r.ctx.tipo = 'fundar_org'; r.ctx.org = s.org;
    r.mec.push('Fundada: ' + s.org.n + ' (' + s.org.tipo + ') con ' + s.org.miembros + ' miembros, moral 65, influencia 3.');
    r.mec.push('Jerarquía: ' + s.org.rangos.join(' → ') + '.');
    E.darXp(90, 'organización fundada');
    E.avanzar(3 * 60);
    return E.cerrarRes(r);
  };

  A.orgAccion = function (tipo, param) {
    var s = S(), r = E.nuevaRes('Gestión de la organización');
    if (!s.org) { r.ok = false; r.mec.push('No diriges ninguna organización.'); return E.cerrarRes(r); }
    var o = s.org;
    r.ctx.tipo = 'org_accion'; r.ctx.accion = tipo;
    if (tipo === 'reclutar') {
      var t = E.tirada(45 + o.miembros * 0.8, [mod('carisma', s.pc.st.car * 1.4), mod('influencia', o.influencia * 1.5),
        mod('moral', (o.moral - 50) * 0.3), mod('notoriedad', s.pc.notoriedad * 0.3)]);
      r.tiradas.push(t); r.mec.push(E.tiradaLinea(t));
      var n = t.grado === 'critico' ? E.ri(3, 6) : t.grado === 'exito' ? E.ri(1, 3) : t.grado === 'parcial' ? 1 : 0;
      o.miembros += n;
      r.mec.push(n ? ('+' + n + ' miembros (total ' + o.miembros + ').') : 'Nadie se compromete esta vez.');
      if (t.grado === 'fracaso_critico') { s.pc.sospecha = Math.min(100, s.pc.sospecha + 5); r.mec.push('Has hablado con quien no debías: sospecha +5.'); }
      E.darXp(8, 'reclutamiento'); E.avanzar(5 * 60);
    } else if (tipo === 'instalacion') {
      var costes = { 'taller': 240, 'laboratorio': 720, 'biblioteca': 600, 'cripta': 360, 'escondite': 180 };
      var c = costes[param] != null ? costes[param] : 300;
      if (!E.pagar(c)) { r.ok = false; r.mec.push('Cuesta ' + E.dinero(c) + '.'); return E.cerrarRes(r); }
      o.instalaciones.push(param || 'instalación');
      if (param === 'taller' || param === 'laboratorio') s.flags.tallerPropio = true;
      r.mec.push('Construido: ' + (param || 'instalación') + ' (' + E.dinero(c) + ').');
      if (param === 'laboratorio') r.mec.push('Las investigaciones avanzarán más rápido y podrás construir criaturas donde quieras.');
      E.darXp(25, 'instalación'); E.avanzar(10 * 24 * 60);
    } else if (tipo === 'influencia') {
      var t2 = E.tirada(50, [mod('carisma', s.pc.st.car), mod('miembros', o.miembros * 0.5), mod('tesoro', o.tesoro > 0 ? 8 : -8)]);
      r.tiradas.push(t2); r.mec.push(E.tiradaLinea(t2));
      var inc = t2.grado === 'critico' ? 6 : t2.grado === 'exito' ? 3 : t2.grado === 'parcial' ? 1 : 0;
      o.influencia += inc;
      r.mec.push(inc ? 'Influencia +' + inc + ' (total ' + o.influencia + ').' : 'Sin avances.');
      E.avanzar(2 * 24 * 60);
    } else if (tipo === 'financiar') {
      var cant = Math.max(0, Math.round(param || 0));
      if (!E.pagar(cant)) { r.ok = false; r.mec.push('No tienes ' + E.dinero(cant) + '.'); return E.cerrarRes(r); }
      o.tesoro += Math.round(cant / 12);
      o.moral = Math.min(100, o.moral + 4);
      r.mec.push('Aportas ' + E.dinero(cant) + ' a la tesorería (' + o.tesoro + ' co). Moral +4.');
      E.avanzar(30);
    } else { r.ok = false; r.mec.push('Acciones: reclutar, instalacion <tipo>, influencia, financiar <cobres>.'); }
    return E.cerrarRes(r);
  };

  A.fundarCiudad = function (spec) {
    var s = S(), r = E.nuevaRes('Fundación de asentamiento');
    if (!s.org) { r.ok = false; r.mec.push('Necesitas una organización que sostenga el asentamiento.'); return E.cerrarRes(r); }
    if (s.org.miembros < 12) { r.ok = false; r.mec.push('Necesitas al menos 12 miembros (tienes ' + s.org.miembros + ').'); return E.cerrarRes(r); }
    var coste = 1200;
    if (!E.pagar(coste)) { r.ok = false; r.mec.push('Fundar cuesta ' + E.dinero(coste) + ' en herramientas, grano y madera.'); return E.cerrarRes(r); }
    var c = {
      id: 'c' + (s.ciudades.length + 1), n: spec.n || 'Asentamiento sin nombre', lugar: E.lugar(s.pc.loc).n,
      pob: s.org.miembros, granjas: 1, edificios: ['empalizada'], guarnicion: 2, impuestos: 10,
      tesoro: 0, estabilidad: 55, salud: false, dias: 0, leyes: [], cargos: {}, fundada: E.fechaTxt()
    };
    s.ciudades.push(c);
    r.ctx.tipo = 'fundar_ciudad'; r.ctx.ciudad = c;
    r.mec.push('Fundado: ' + c.n + ' junto a ' + c.lugar + ' con ' + c.pob + ' habitantes.');
    r.mec.push('Al cabo de un mes recibirás el primer informe de población, tesoro y estabilidad.');
    E.darXp(220, 'asentamiento fundado');
    E.avanzar(20 * 24 * 60);
    return E.cerrarRes(r);
  };

  A.ciudadAccion = function (cid, tipo, param) {
    var s = S(), r = E.nuevaRes('Gobierno'), c = null;
    for (var i = 0; i < s.ciudades.length; i++) if (s.ciudades[i].id === cid || s.ciudades[i].n === cid) c = s.ciudades[i];
    if (!c) { r.ok = false; r.mec.push('No gobiernas ese lugar.'); return E.cerrarRes(r); }
    r.ctx.tipo = 'ciudad_accion'; r.ctx.ciudad = c.n; r.ctx.accion = tipo;
    if (tipo === 'impuestos') {
      var v = Math.max(0, Math.min(30, Math.round(param)));
      var a = c.impuestos; c.impuestos = v;
      E._delta('Impuestos de ' + c.n, a + '%', v + '%');
      c.estabilidad += (v < a ? 4 : -5);
      r.mec.push('Impuestos: ' + a + '% → ' + v + '%. Estabilidad ' + Math.round(c.estabilidad) + '%.');
    } else if (tipo === 'construir') {
      var precios = { granja: 300, muralla: 1800, cuartel: 700, almacen: 400, academia: 2400, hospital: 900, templo: 800, laboratorio: 1500, biblioteca: 1300, mina: 1100, puerto: 2000 };
      var p = precios[param];
      if (p == null) { r.ok = false; r.mec.push('Edificios: ' + Object.keys(precios).join(', ') + '.'); return E.cerrarRes(r); }
      if (!E.pagar(p)) { r.ok = false; r.mec.push('Cuesta ' + E.dinero(p) + '.'); return E.cerrarRes(r); }
      if (param === 'granja') c.granjas++;
      else c.edificios.push(param);
      if (param === 'hospital') c.salud = true;
      if (param === 'laboratorio') s.flags.tallerPropio = true;
      r.mec.push('Construido en ' + c.n + ': ' + param + '.');
      E.darXp(30, 'construcción');
      E.avanzar(15 * 24 * 60);
    } else if (tipo === 'ley') {
      c.leyes.push(param || 'ley sin redactar');
      var impacto = /trabajo|forzos|esclav|toque de queda/i.test(param || '') ? -8 : 3;
      c.estabilidad = Math.max(0, Math.min(100, c.estabilidad + impacto));
      r.mec.push('Promulgada: "' + param + '". Estabilidad ' + (impacto > 0 ? '+' : '') + impacto + ' → ' + Math.round(c.estabilidad) + '%.');
    } else if (tipo === 'guarnicion') {
      var n = Math.max(0, Math.round(param));
      var cst = n * 40;
      if (!E.pagar(cst)) { r.ok = false; r.mec.push('Equipar ' + n + ' hombres cuesta ' + E.dinero(cst) + '.'); return E.cerrarRes(r); }
      c.guarnicion += n;
      r.mec.push('Guarnición: ' + c.guarnicion + ' efectivos.');
    } else { r.ok = false; r.mec.push('Acciones: impuestos <%>, construir <edificio>, ley <texto>, guarnicion <n>.'); }
    return E.cerrarRes(r);
  };

  /* ── MEMORIA: auditoría, guardado, resumen ── */
  E.auditoria = function () {
    var s = S(), out = [], av = [];
    out.push('Fecha interna: ' + E.fechaTxt() + ', ' + E.horaTxt(s.fecha));
    out.push('Turnos jugados: ' + s.turno + ' · sucesos del mundo registrados: ' + s.sucesos.length);
    if (s.pc.hp > E.hpMax()) av.push('Vitalidad por encima del máximo: corregida.');
    if (s.pc.hp > E.hpMax()) s.pc.hp = E.hpMax();
    if (s.pc.mana > E.manaMax()) { av.push('Maná por encima del máximo: corregido.'); s.pc.mana = E.manaMax(); }
    if (s.pc.dinero < 0) { av.push('Dinero negativo: corregido a 0.'); s.pc.dinero = 0; }
    var k;
    for (k in s.comp) if (s.comp[k] <= 0) { delete s.comp[k]; av.push('Componente con cantidad 0 eliminado: ' + k); }
    for (k in s.inv) if (s.inv[k] <= 0) { delete s.inv[k]; av.push('Objeto con cantidad 0 eliminado: ' + k); }
    var mant = 0;
    for (var i = 0; i < s.criaturas.length; i++) if (s.criaturas[i].estado === 'activa') mant += s.criaturas[i].mant;
    out.push('Criaturas activas: ' + s.criaturas.filter(function (c) { return c.estado === 'activa'; }).length +
      ' · mantenimiento diario: ' + mant + ' de maná (regeneras ' + (E.regenHora() * 24).toFixed(1) + '/día)');
    if (mant > E.regenHora() * 24) av.push('Mantenimiento superior a tu regeneración diaria: las criaturas se desplomarán.');
    out.push('Hechizos: ' + s.hechizos.length + ' · investigaciones activas: ' + s.proyectos.filter(function (p) { return p.estado === 'activo'; }).length);
    out.push('Peso cargado: ' + E.pesoInv() + ' / ' + E.cargaMax() + ' kg');
    out.push('Notoriedad ' + s.pc.notoriedad + '/100 · sospecha del Priorato ' + s.pc.sospecha + '/100 · cordura ' + s.pc.cordura + '/100');
    for (k in s.npcs) { if (s.npcs[k].vivo === false && s.npcs[k].loc) { /* coherente */ } }
    out.push(av.length ? ('Incoherencias corregidas: ' + av.length) : 'Sin incoherencias detectadas.');
    return { lineas: out, avisos: av };
  };

  E.guardar = function () {
    var s = S();
    return JSON.stringify({ juego: 'Crónicas del Trono Sepulcral', v: 1, guardado: E.fechaTxt() + ' · ' + E.horaTxt(s.fecha), estado: s });
  };
  E.cargar = function (txt) {
    try {
      var d = JSON.parse(txt);
      var st = d.estado || d;
      if (!st.pc || !st.fecha) return { ok: false, msg: 'Ese texto no contiene un estado de partida válido.' };
      E.setS(st);
      if (!st.conoc) st.conoc = { lug: {}, npc: {}, saber: {} };
      return { ok: true, msg: 'Partida cargada: ' + st.pc.nombre + ', nivel ' + st.pc.nivel + ', ' + E.fechaTxt() };
    } catch (e) { return { ok: false, msg: 'No he podido interpretar el guardado: ' + e.message }; }
  };
  E.respaldo = function () {
    var s = S(), L = [];
    L.push('=== RESPALDO COMPACTO · CRÓNICAS DEL TRONO SEPULCRAL ===');
    L.push('Fecha: ' + E.fechaTxt() + ' · ' + E.horaTxt(s.fecha) + ' · Lugar: ' + E.lugar(s.pc.loc).n);
    L.push('Maikel · ' + s.pc.edad + ' años · Nivel ' + s.pc.nivel + ' (' + E.rango().n + ') · XP ' + s.pc.xp + '/' + E.xpSiguiente());
    L.push('Vitalidad ' + Math.round(s.pc.hp) + '/' + E.hpMax() + ' · Maná ' + Math.round(s.pc.mana) + '/' + E.manaMax() + ' · Cordura ' + s.pc.cordura + ' · Dinero ' + E.dinero());
    L.push('Atributos: ' + W.stats.map(function (x) { return x.n + ' ' + s.pc.st[x.id]; }).join(', '));
    L.push('Nigromancia ' + E.dom('nigro') + '/100. Ramas: ' + W.ramas.filter(function (x) { return E.dom(x.id) > 0; }).map(function (x) { return x.n + ' ' + E.dom(x.id); }).join(', '));
    var escD = W.escuelas.filter(function (x) { return E.dom(x.id) > 0 && x.id !== 'nigro'; });
    if (escD.length) L.push('Otras escuelas: ' + escD.map(function (x) { return x.n + ' ' + E.dom(x.id); }).join(', '));
    L.push('Códice: legibilidad ' + s.codice.leg + '%, mortajas abiertas ' + s.codice.mortajas.filter(Boolean).length + '/9, estudios ' + s.codice.estudios);
    L.push('Hechizos: ' + (s.hechizos.map(function (h) { return h.n + ' (nv' + h.nivel + ', coste ' + h.coste + ')'; }).join(' | ') || '—'));
    L.push('Criaturas: ' + (s.criaturas.map(function (c) { return c.n + ' [' + c.esp + ', nv' + c.nivel + ', lealtad ' + c.lealtad + ', ' + c.estado + ']'; }).join(' | ') || '—'));
    L.push('Inventario: ' + Object.keys(s.inv).map(function (k) { var d = E.objDef(k); return (d ? d.n : k) + '×' + s.inv[k]; }).join(', '));
    L.push('Componentes: ' + (Object.keys(s.comp).map(function (k) { var d = E.compDef(k); return (d ? d.n : k) + '×' + s.comp[k]; }).join(', ') || '—'));
    L.push('Investigaciones activas: ' + (s.proyectos.filter(function (p) { return p.estado === 'activo'; }).map(function (p) { return p.n + ' ' + Math.round(p.prog / p.total * 100) + '%'; }).join(' | ') || '—'));
    L.push('Organización: ' + (s.org ? s.org.n + ' (' + s.org.miembros + ' miembros, moral ' + s.org.moral + ', influencia ' + s.org.influencia + ')' : '—'));
    L.push('Asentamientos: ' + (s.ciudades.map(function (c) { return c.n + ' (' + c.pob + ' hab.)'; }).join(', ') || '—'));
    L.push('Notoriedad ' + s.pc.notoriedad + ' · Sospecha del Priorato ' + s.pc.sospecha);
    L.push('Relaciones: ' + Object.keys(s.npcs).filter(function (k) { return E.conoce('npc', k) && s.npcs[k].vivo; }).map(function (k) { return E.npcDef(k).n + ' ' + (s.npcs[k].op >= 0 ? '+' : '') + s.npcs[k].op; }).join(', '));
    L.push('Lugares conocidos: ' + Object.keys(s.conoc.lug).map(function (k) { var l = E.lugar(k); return l ? l.n : k; }).join(', '));
    L.push('Últimos sucesos del mundo:');
    var vistos = s.sucesos.filter(function (e) { return e.visto; }).slice(-8);
    for (var i = 0; i < vistos.length; i++) L.push('  · ' + vistos[i].t + ': ' + vistos[i].txt);
    L.push('Guerras en curso: ' + (s.mundo.guerras.map(function (g) { return E.polDef(g.a).n + ' vs ' + E.polDef(g.b).n; }).join(', ') || 'ninguna conocida'));
    L.push('=== FIN DEL RESPALDO (pégalo en otra conversación para continuar) ===');
    return L.join('\n');
  };
})();
