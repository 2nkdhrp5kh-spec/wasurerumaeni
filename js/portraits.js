'use strict';
/* ============================================================
   人物（48×48）と背景のドット絵
   ============================================================ */
(function () {
  const N = 48;
  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  const SKIN = {
    a: { skin: '#c99f7b', shade: '#a67d5e', deep: '#86624b', hi: '#dcb592' },
    b: { skin: '#d2ab8a', shade: '#ae876a', deep: '#8c6a53', hi: '#e2c0a0' },
    c: { skin: '#b98f6c', shade: '#97704f', deep: '#78573e', hi: '#cba27f' },
    old:{ skin: '#cfa98d', shade: '#ab8670', deep: '#8a6a58', hi: '#dfbea5' }
  };
  const CLOTH = {
    sweat:    { cloth: '#5b6064', clothSh: '#41464a', clothHi: '#6c7276' },
    suit:     { cloth: '#2c2f36', clothSh: '#1e2025', clothHi: '#3a3e47' },
    suitBrown:{ cloth: '#4a3d33', clothSh: '#362c25', clothHi: '#5a4b3f' },
    cardigan: { cloth: '#7a6a58', clothSh: '#5c4f41', clothHi: '#8a7a66' },
    jacket:   { cloth: '#4b4f3c', clothSh: '#35382a', clothHi: '#5d624b' },
    navy:     { cloth: '#2f3a4e', clothSh: '#222a39', clothHi: '#3d4a62' },
    blouse:   { cloth: '#8c8f86', clothSh: '#6c6f67', clothHi: '#a3a69c' }
  };

  // 久住の段階（逮捕当日→勾留20日目）
  const KUZUMI_SKIN = [
    { skin: '#c99f7b', shade: '#a67d5e', deep: '#86624b', hi: '#dcb592', bag: '#a98069', stub: '#8f7b69' },
    { skin: '#c49c7a', shade: '#a17a5d', deep: '#82604a', hi: '#d5b08e', bag: '#9a735f', stub: '#8f7b69' },
    { skin: '#bb987b', shade: '#98765f', deep: '#7a5d4b', hi: '#c9a88b', bag: '#82614f', stub: '#857263' },
    { skin: '#b19680', shade: '#8d7262', deep: '#6f584c', hi: '#bea38d', bag: '#6e5247', stub: '#6f6259' }
  ];

  function face(o) {
    const g = Array.from({ length: N }, () => Array(N).fill(null));
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
    const at = (x, y) => (x >= 0 && y >= 0 && x < N && y < N) ? g[y][x] : null;
    const cx = 23.5, fem = !!o.female, eyes = o.eyes || 0;
    const mir = pts => pts.map(([x, y]) => [47 - x, y]);

    // 体
    for (let y = 36; y < N; y++) { const half = Math.min(23.5, (fem ? 7 : 8) + (y - 36) * 2.2); for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= half) put(x, y, 'cloth'); }
    for (let x = 0; x < N; x++) for (let y = 36; y < N; y++) if (at(x, y) === 'cloth' && x > cx + 12) put(x, y, 'clothSh');
    for (let x = 6; x < 14; x++) for (let y = 41; y < N; y++) if (at(x, y) === 'cloth' && hash(x, y, 3) < .2) put(x, y, 'clothHi');
    // 首
    for (let y = 29; y <= 38; y++) for (let x = fem ? 20 : 19; x <= (fem ? 27 : 28); x++) put(x, y, x > 25 ? 'shade' : 'skin');
    for (let x = 19; x <= 28; x++) { if (at(x, 31)) put(x, 31, 'deep'); if (at(x, 32)) put(x, 32, 'shade'); }
    // 服の形
    if (o.cloth === 'suit' || o.cloth === 'suitBrown' || o.cloth === 'navy') {
      for (let y = 37; y < N; y++) { const w = Math.max(0, 6 - (y - 37) * .5); for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) put(x, y, 'shirt'); }
      if (o.tie) for (let y = 38; y < N; y++) { put(23, y, 'tie'); put(24, y, 'tie'); if (y > 41) { put(22, y, 'tie'); put(25, y, 'tie'); } }
      for (let y = 37; y < N; y++) { const w = Math.max(0, 6 - (y - 37) * .5); put(Math.round(cx - w) - 1, y, 'clothSh'); put(Math.round(cx + w) + 1, y, 'clothSh'); }
    } else if (o.cloth === 'cardigan' || o.cloth === 'blouse') {
      for (let x = 18; x <= 29; x++) { put(x, 37, 'shirt'); if (Math.abs(x - cx) < 4) put(x, 38, 'shirt'); }
      if (o.cloth === 'cardigan') for (let y = 39; y < N; y += 2) put(24, y, 'clothSh');
    } else {
      for (let x = 17; x <= 30; x++) { const d = Math.abs(x - cx); if (d < 7) put(x, Math.round(38 + (7 - d) * 0.35), 'clothSh'); }
    }

    // 頭
    const rx0 = (o.wide || 10.6) - (fem ? .8 : 0), jaw = o.jaw || 6.8;
    for (let y = 5; y <= 33; y++) {
      let rx = y <= 20 ? rx0 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 18) / 13, 2))) : rx0 - Math.pow((y - 20) / 13, 1.7) * (jaw + (fem ? .6 : 0));
      if (y === 33 && fem) continue;
      for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= rx) put(x, y, 'skin');
    }
    // 耳
    if (o.hair !== 'long') for (let y = 18; y <= 24; y++) { put(12, y, 'shade'); put(35, y, 'deep'); if (y > 18 && y < 24) { put(11, y, 'shade'); put(36, y, 'deep'); } }
    // 陰影
    for (let y = 5; y <= 33; y++) for (let x = 0; x < N; x++) {
      if (at(x, y) !== 'skin') continue;
      if (x >= 31 || (y >= 27 && x >= 29)) put(x, y, 'shade');
      if (x >= 33) put(x, y, 'deep');
      if (x >= 14 && x <= 15 && y >= 19 && y <= 24 && at(x - 1, y) === 'skin') put(x, y, 'hi');
    }
    for (let x = 17; x <= 30; x++) { if (at(x, 33) === 'skin') put(x, 33, 'shade'); if (at(x, 32) === 'skin' && x > 26) put(x, 32, 'shade'); }

    // 髪
    const hs = o.hair || 'short';
    for (let y = 1; y <= 36; y++) for (let x = 0; x < N; x++) {
      const dx = (x - cx) / 12.2, dy = (y - 13) / 10.5, inside = dx * dx + dy * dy <= 1;
      const side = (x <= 13 || x >= 34);
      let fr;
      if (hs === 'short') fr = 11 + Math.round(Math.sin(x * 1.3) * 1.2 + (x > 26 ? 1 : 0));
      else if (hs === 'crop') fr = 8 + (hash(x, 1, 2) < .3 ? 1 : 0);
      else if (hs === 'parted') fr = x < 20 ? 9 + Math.round((20 - x) * .25) : 9 + Math.round((x - 20) * .08);
      else if (hs === 'thin') fr = 5;
      else if (hs === 'bun') fr = 8;
      else if (hs === 'long') fr = 10 + (x > 24 ? 1 : 0);
      if (inside && (y <= fr || (side && y <= (hs === 'thin' ? 15 : 19)))) put(x, y, (y < 7 && x < 22 && hash(x, y, 1) < .35) ? 'hairHi' : 'hair');
      if (hs === 'long' && (x >= 10 && x <= 14 || x >= 33 && x <= 37) && y >= 10 && y <= 35 && !(y > 30 && (x === 10 || x === 37))) put(x, y, 'hair');
    }
    if (hs === 'bun') for (let y = 0; y <= 6; y++) for (let x = 18; x <= 29; x++) { const d = Math.hypot(x - cx, y - 3.5); if (d <= 4.6) put(x, y, d < 2 ? 'hairHi' : 'hair'); }
    if (hs === 'parted') for (let y = 4; y <= 9; y++) put(20, y, 'hairHi');
    if (hs !== 'long' && hs !== 'thin') for (let y = 17; y <= 21; y++) { put(13, y, 'hair'); put(34, y, 'hair'); }
    if (hs === 'thin') for (let x = 15; x <= 32; x++) if (at(x, 6) === 'hair' && hash(x, 6, 4) < .5) put(x, 6, 'skin');

    // しわ
    const wr = o.wrinkles || 0;
    if (wr >= 1) { for (let y = 25; y <= 28; y++) { put(20 - (y > 26 ? 1 : 0), y, 'shade'); put(27 + (y > 26 ? 1 : 0), y, 'shade'); } }
    if (wr >= 2) { [16, 17].forEach(x => put(x, 21, 'shade')); [30, 31].forEach(x => put(x, 21, 'shade')); for (let x = 19; x <= 28; x++) if (at(x, 10) === 'skin') put(x, 10, 'shade'); }

    // 眉
    const browN = [[16, 15], [17, 15], [18, 15], [19, 15], [20, 15], [21, 15], [19, 14], [20, 14], [21, 14]];
    const browThick = browN.concat([[16, 14], [17, 14], [18, 14]]);
    const browThin = [[16, 15], [17, 14], [18, 14], [19, 14], [20, 14], [21, 15]];
    const browSad = [[16, 16], [17, 16], [17, 15], [18, 15], [19, 15], [19, 14], [20, 14], [21, 14], [20, 13], [21, 13]];
    const browStern = [[16, 14], [17, 14], [18, 15], [19, 15], [20, 15], [21, 16], [16, 15], [17, 15], [18, 16], [19, 16], [20, 16]];
    const brow = { n: browN, thick: browThick, thin: browThin, sad: browSad, stern: browStern }[o.brows || 'n'];
    [...brow, ...mir(brow)].forEach(([x, y]) => put(x, y, o.browColor ? 'brow' : 'line'));

    // 目
    function eye(x0, m) {
      const X = i => m ? x0 + 4 - i : x0 + i;
      if (eyes > 0) for (let i = 0; i < 5; i++) put(X(i), 17, 'shade');
      if (o.narrow) {
        for (let i = 0; i < 5; i++) put(X(i), 19, 'line');
        put(X(2), 19, 'pupil'); put(X(1), 19, 'iris'); put(X(3), 19, 'iris');
        for (let i = 0; i < 5; i++) put(X(i), 20, 'shade');
      } else if (eyes <= 1) {
        for (let i = 0; i < 5; i++) put(X(i), 18, 'line');
        if (fem) put(X(-1), 18, 'line');
        ['white', 'iris', 'pupil', 'iris', 'white'].forEach((c, i) => put(X(i), 19, c));
        if (eyes === 0) { ['shade', 'white', 'iris', 'white', 'shade'].forEach((c, i) => put(X(i), 20, c)); for (let i = 1; i < 4; i++) put(X(i), 21, 'shade'); }
        else for (let i = 0; i < 5; i++) put(X(i), 20, 'bag');
      } else if (eyes === 2) {
        for (let i = 0; i < 5; i++) { put(X(i), 18, 'shade'); put(X(i), 19, 'line'); }
        ['white', 'iris', 'pupil', 'iris', 'white'].forEach((c, i) => put(X(i), 20, c));
        for (let i = 0; i < 5; i++) put(X(i), 21, 'bag'); [1, 2, 3].forEach(i => put(X(i), 22, 'bag'));
      } else {
        for (let i = 0; i < 5; i++) { put(X(i), 18, 'shade'); put(X(i), 19, 'line'); }
        ['shade', 'iris', 'pupil', 'iris', 'shade'].forEach((c, i) => put(X(i), 20, c));
        for (let i = 0; i < 5; i++) { put(X(i), 21, 'bag'); put(X(i), 22, i > 0 && i < 4 ? 'bag' : 'shade'); }
      }
    }
    eye(17, false); eye(26, true);
    if (o.glasses) {
      const fr = 'frame';
      for (let x = 15; x <= 22; x++) { put(x, 17, fr); put(x, 22, fr); }
      for (let x = 25; x <= 32; x++) { put(x, 17, fr); put(x, 22, fr); }
      for (let y = 17; y <= 22; y++) { put(15, y, fr); put(22, y, fr); put(25, y, fr); put(32, y, fr); }
      put(23, 18, fr); put(24, 18, fr); put(14, 18, fr); put(13, 18, fr); put(33, 18, fr); put(34, 18, fr);
    }

    // 鼻
    for (let y = 19; y <= 25; y++) put(25, y, 'shade');
    put(24, 25, 'hi'); put(23, 26, 'shade'); put(24, 26, 'shade'); put(25, 26, 'shade');
    put(22, 26, 'deep'); put(26, 26, 'deep'); put(21, 25, 'shade'); put(27, 25, 'shade'); put(26, 27, 'shade');

    // 口
    const mouth = o.mouth || 'flat';
    if (mouth === 'frown') {
      for (let x = 22; x <= 26; x++) put(x, 29, 'lip'); put(21, 30, 'lip'); put(27, 30, 'lip'); put(20, 31, 'deep'); put(28, 31, 'deep');
      for (let x = 23; x <= 25; x++) put(x, 30, 'lipLo');
    } else if (mouth === 'smile') {
      for (let x = 21; x <= 27; x++) put(x, 30, 'lip'); put(20, 29, 'lip'); put(28, 29, 'lip');
      for (let x = 23; x <= 25; x++) put(x, 31, 'lipLo');
    } else if (mouth === 'tight') {
      for (let x = 21; x <= 27; x++) put(x, 29, 'deep');
    } else {
      for (let x = 21; x <= 27; x++) put(x, 29, 'lip'); put(21, 29, 'deep'); put(27, 29, 'deep');
      for (let x = 23; x <= 25; x++) put(x, 30, 'lipLo');
    }
    for (let x = 23; x <= 25; x++) if (at(x, 31) === 'skin') put(x, 31, 'shade');
    if (o.mustache) for (let x = 20; x <= 27; x++) { put(x, 27, 'hair'); if (x > 20 && x < 27) put(x, 28, 'hair'); }

    // ひげ・乱れ
    const st = o.stubble || 0;
    if (st > 0) {
      const dens = st === 1 ? .35 : .65;
      for (let y = 26; y <= 33; y++) for (let x = 14; x <= 33; x++) {
        const c = at(x, y); if (!(c === 'skin' || c === 'shade' || c === 'hi')) continue;
        const jw = (y >= 31 && !(y === 31 && x >= 22 && x <= 26)) || (y >= 27 && y <= 28 && x >= 20 && x <= 28) || (y >= 28 && (x <= 18 || x >= 30));
        if (jw && hash(x >> 1, y, st + 7) < dens) put(x, y, 'stub');
      }
    }
    if (o.messy) {
      for (let i = 0; i < o.messy; i++) {
        const x = 14 + Math.floor(hash(i, 7, o.messy) * 20);
        let top = 0; while (top < N && at(x, top) !== 'hair' && at(x, top) !== 'hairHi') top++;
        if (top < N) { put(x, top - 1, 'hair'); if (hash(i, 11, o.messy) < .4) put(x + (hash(i, 5, 1) < .5 ? -1 : 1), top - 2, 'hair'); }
      }
    }
    if (o.gaunt) { for (let y = 23; y <= 27; y++) { if (at(16, y) && at(16, y) !== 'stub') put(16, y, 'shade'); if (at(31, y) && at(31, y) !== 'stub') put(31, y, 'deep'); } }

    // 輪郭線
    const out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!g[y][x] || y >= 40) continue;
      if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1)) out.push([x, y]);
    }
    out.forEach(([x, y]) => { const c = at(x, y) || ''; if (c.startsWith('cloth') || c === 'shirt' || c === 'tie') put(x, y, 'clothSh'); else put(x, y, 'line'); });
    return g;
  }

  // ---- 人物の設定 ----
  const BASE = { line: '#1c1511', white: '#dcd4c4', iris: '#3b2a20', pupil: '#140f0c', lip: '#9a6352', lipLo: '#b27a66', bag: '#a98069', stub: '#8f7b69', frame: '#2a2622', shirt: '#d8d4c8', tie: '#6b2a26', brow: '#5a5550' };
  const PEOPLE = {
    kuzumi: st => ({ o: { hair: 'short', eyes: [0, 1, 2, 3][st], stubble: [0, 0, 1, 2][st], messy: [0, 0, 5, 10][st], brows: st === 3 ? 'sad' : 'n', mouth: st === 3 ? 'frown' : 'flat', gaunt: st === 3, cloth: 'sweat' },
                    p: Object.assign({}, KUZUMI_SKIN[st], CLOTH.sweat, { hair: '#2a221d', hairHi: '#3d332b' }) }),
    todo:     () => ({ o: { hair: 'crop', brows: 'stern', narrow: true, wrinkles: 2, mouth: 'tight', cloth: 'suit', tie: true, wide: 11.2, jaw: 6 }, p: Object.assign({}, SKIN.c, CLOTH.suit, { hair: '#3a3632', hairHi: '#5e5a54', tie: '#3e2a4a' }) }),
    shirai:   () => ({ o: { hair: 'thin', brows: 'thick', wrinkles: 2, mustache: true, cloth: 'jacket', mouth: 'flat', wide: 11 }, p: Object.assign({}, SKIN.c, CLOTH.jacket, { hair: '#6a655e', hairHi: '#8a857c' }) }),
    oka:      () => ({ o: { hair: 'parted', glasses: true, cloth: 'navy', tie: true, mouth: 'flat' }, p: Object.assign({}, SKIN.a, CLOTH.navy, { hair: '#231c18', hairHi: '#3a302a', tie: '#2c4a5a' }) }),
    noguchi:  () => ({ o: { hair: 'short', brows: 'thin', cloth: 'suit', tie: true, mouth: 'flat', wide: 10.2 }, p: Object.assign({}, SKIN.b, CLOTH.suit, { hair: '#2e2420', hairHi: '#4a3a30', tie: '#5a5a2a' }) }),
    aoyagi:   () => ({ o: { female: true, hair: 'bun', glasses: true, wrinkles: 2, cloth: 'cardigan', brows: 'thin', mouth: 'flat' }, p: Object.assign({}, SKIN.old, CLOTH.cardigan, { hair: '#a8a49c', hairHi: '#c8c4bc', lip: '#a06a5c' }) }),
    murai:    () => ({ o: { female: true, hair: 'long', cloth: 'blouse', brows: 'thin', mouth: 'flat' }, p: Object.assign({}, SKIN.b, CLOTH.blouse, { hair: '#3a2c24', hairHi: '#54423a', lip: '#a8645a' }) }),
    miyashita:() => ({ o: { hair: 'crop', brows: 'stern', narrow: true, stubble: 1, cloth: 'jacket', mouth: 'tight', wide: 10.2, jaw: 7.4 }, p: Object.assign({}, SKIN.c, CLOTH.jacket, { hair: '#1e1a17', hairHi: '#2e2824', stub: '#7a6656' }) }),
    sakai:    () => ({ o: { hair: 'thin', brows: 'n', stubble: 1, cloth: 'jacket', mouth: 'flat', eyes: 1, wrinkles: 1 }, p: Object.assign({}, SKIN.a, CLOTH.jacket, { hair: '#2b2622', hairHi: '#3e3832', cloth: '#5a4a3a', clothSh: '#43372b', clothHi: '#6a5848' }) }),
    kenji:    () => ({ o: { hair: 'parted', brows: 'n', cloth: 'suitBrown', tie: true, mouth: 'tight', glasses: true, wrinkles: 1 }, p: Object.assign({}, SKIN.a, CLOTH.suitBrown, { hair: '#1c1714', hairHi: '#332a24', tie: '#2a3a2a' }) })
  };
  const cache = {};
  function sprite(id, stage) {
    const key = id + ':' + (stage || 0);
    if (cache[key]) return cache[key];
    const def = PEOPLE[id](stage || 0), grid = face(def.o), pal = Object.assign({}, BASE, def.p);
    const c = document.createElement('canvas'); c.width = N; c.height = N; const x = c.getContext('2d');
    for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) { const k = grid[yy][xx]; if (!k) continue; x.fillStyle = pal[k] || '#f0f'; x.fillRect(xx, yy, 1, 1); }
    cache[key] = c; return c;
  }

  // ---- 背景（論理 160×70） ----
  function R(x, c, X, Y, W, H) { x.fillStyle = c; x.fillRect(X, Y, W, H); }
  const BG = {
    dark: x => R(x, '#0b0a09', 0, 0, 160, 70),
    office: x => { R(x, '#2a2823', 0, 0, 160, 70); R(x, '#232120', 0, 0, 160, 6); R(x, '#3d4a52', 8, 10, 30, 22); R(x, '#56656d', 10, 12, 26, 18); R(x, '#3d4a52', 22, 12, 2, 18);
      R(x, '#3a352b', 118, 8, 34, 26); for (let i = 0; i < 6; i++) R(x, ['#d9cfb4', '#cfc5aa', '#a3342b'][i % 3], 121 + (i % 3) * 10, 11 + Math.floor(i / 3) * 10, 8, 7);
      R(x, '#4a3a29', 0, 52, 160, 18); R(x, '#2b2118', 0, 52, 160, 2); R(x, '#d9cfb4', 10, 46, 22, 6); R(x, '#e4dbc2', 12, 44, 20, 6); R(x, '#111', 132, 46, 10, 6); R(x, '#111', 136, 44, 8, 2); },
    interro: x => { R(x, '#1b1a17', 0, 0, 160, 70); R(x, '#24221e', 0, 0, 160, 40); R(x, '#d8c37a', 72, 0, 16, 3);
      x.fillStyle = 'rgba(216,195,122,.06)'; x.beginPath(); x.moveTo(72, 3); x.lineTo(88, 3); x.lineTo(130, 60); x.lineTo(30, 60); x.fill();
      R(x, '#141311', 124, 8, 26, 18); R(x, '#25292b', 126, 10, 22, 14); R(x, '#3b3227', 20, 56, 120, 4); R(x, '#2b241b', 26, 60, 4, 10); R(x, '#2b241b', 130, 60, 4, 10); R(x, '#dcd2b6', 34, 52, 16, 4); },
    shop: x => { R(x, '#2b241c', 0, 0, 160, 70); for (let i = 0; i < 10; i++) { R(x, '#3a2e22', i * 16, 4, 14, 50); for (let j = 0; j < 5; j++) R(x, ['#6a3a2a', '#3a4a5a', '#5a5a3a', '#4a3a4a'][(i + j) % 4], i * 16 + 1, 6 + j * 10, 12, 8); }
      R(x, '#4a3a29', 0, 56, 160, 14); R(x, '#d8c37a', 140, 2, 6, 3); },
    street: x => { R(x, '#16181c', 0, 0, 160, 70); R(x, '#22252b', 0, 30, 160, 40); for (let i = 0; i < 6; i++) R(x, '#2c3038', i * 28, 8, 22, 24); R(x, '#d8c37a', 30, 14, 3, 3); R(x, '#d8c37a', 112, 12, 3, 3); R(x, '#30333a', 0, 58, 160, 2); },
    home: x => { R(x, '#2a2420', 0, 0, 160, 70); R(x, '#3a3028', 0, 0, 160, 44); R(x, '#d8c37a', 76, 0, 8, 4); x.fillStyle = 'rgba(216,195,122,.07)'; x.fillRect(40, 4, 80, 50);
      R(x, '#5a4430', 20, 50, 120, 6); R(x, '#4a3826', 26, 56, 4, 14); R(x, '#4a3826', 130, 56, 4, 14); R(x, '#e8e0d0', 60, 46, 10, 4); R(x, '#e8e0d0', 90, 46, 10, 4); },
    court: x => { R(x, '#2b2620', 0, 0, 160, 70); R(x, '#241f1a', 0, 0, 160, 14); R(x, '#8a7a50', 74, 2, 12, 10); R(x, '#2b2620', 77, 4, 6, 6); R(x, '#5a4630', 10, 30, 140, 14); R(x, '#6e5a3f', 10, 30, 140, 2); R(x, '#4f3d2a', 66, 56, 28, 14); },
    pros: x => { R(x, '#27261f', 0, 0, 160, 70); R(x, '#2f2d26', 0, 0, 160, 34); R(x, '#46504a', 10, 6, 30, 20); R(x, '#6d7a72', 12, 8, 26, 16); for (let i = 0; i < 8; i++) R(x, ['#8a3a2c', '#3d5a6a', '#6a5a3a'][i % 3], 104 + i * 6, 6, 5, 26);
      R(x, '#3e3022', 0, 50, 160, 20); R(x, '#d9cfb4', 46, 42, 56, 8); },
    phone: x => { R(x, '#1d1c19', 0, 0, 160, 70); R(x, '#111', 70, 26, 20, 12); R(x, '#222', 72, 22, 16, 4); }
  };

  function scene(cv, sc) {
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    x.setTransform(2, 0, 0, 2, 0, 0);
    (BG[sc.bg] || BG.dark)(x);
    if (sc.who && PEOPLE[sc.who]) {
      const s = sprite(sc.who, sc.stage);
      const px = sc.x === 'l' ? 26 : sc.x === 'r' ? 92 : 56;
      x.drawImage(s, px, 70 - N);
    }
    if (sc.dim) { x.fillStyle = 'rgba(0,0,0,' + sc.dim + ')'; x.fillRect(0, 0, 160, 70); }
    x.setTransform(1, 0, 0, 1, 0, 0);
  }
  G.portraits = { scene, sprite, PEOPLE };
})();
