'use strict';
/* ============================================================
   人物（48×48）と背景のドット絵
   ============================================================ */
(function () {
  const N = 64;
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
    const cx = 31.5, fem = !!o.female, eyes = o.eyes || 0, M = x => 63 - x;
    const mir = pts => pts.map(([x, y]) => [M(x), y]);
    const R0 = (o.wide || 10.6) * 4 / 3 - (fem ? 1 : 0), jaw = (o.jaw || 6.8) * 4 / 3 + (fem ? .8 : 0);

    // 体
    for (let y = 48; y < N; y++) { const half = Math.min(31.5, (fem ? 9.5 : 11) + (y - 48) * 2.6); for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= half) put(x, y, 'cloth'); }
    for (let x = 0; x < N; x++) for (let y = 48; y < N; y++) if (at(x, y) === 'cloth' && x > cx + 15) put(x, y, 'clothSh');
    for (let y = 52; y < N; y++) { put(Math.round(cx - 13 - (y - 52) * .4), y, 'clothSh'); }
    for (let x = 4; x < 18; x++) for (let y = 54; y < N; y++) if (at(x, y) === 'cloth' && hash(x, y, 3) < .18) put(x, y, 'clothHi');
    // 首
    for (let y = 39; y <= 51; y++) for (let x = fem ? 27 : 26; x <= (fem ? 36 : 37); x++) put(x, y, x > 34 ? 'shade' : 'skin');
    for (let x = 26; x <= 37; x++) { if (at(x, 42)) put(x, 42, 'deep'); if (at(x, 43)) put(x, 43, 'shade'); if (at(x, 44) && x > 31) put(x, 44, 'shade'); }
    // 服の形
    if (o.cloth === 'suit' || o.cloth === 'suitBrown' || o.cloth === 'navy') {
      for (let y = 49; y < N; y++) { const w = Math.max(0, 8 - (y - 49) * .5); for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) put(x, y, 'shirt'); put(Math.round(cx - w) - 1, y, 'clothSh'); put(Math.round(cx + w) + 1, y, 'clothSh'); }
      if (o.tie) for (let y = 50; y < N; y++) { put(31, y, 'tie'); put(32, y, 'tie'); if (y > 53) { put(30, y, 'tie'); put(33, y, 'tie'); } if (y === 51) { put(30, y, 'tie'); put(33, y, 'tie'); } }
    } else if (o.cloth === 'cardigan' || o.cloth === 'blouse') {
      for (let x = 23; x <= 40; x++) { put(x, 49, 'shirt'); if (Math.abs(x - cx) < 6) put(x, 50, 'shirt'); if (Math.abs(x - cx) < 3) put(x, 51, 'shirt'); }
      if (o.cloth === 'cardigan') for (let y = 53; y < N; y += 3) put(32, y, 'clothSh');
    } else {
      for (let x = 21; x <= 42; x++) { const d = Math.abs(x - cx); if (d < 10) put(x, Math.round(50 + (10 - d) * .35), 'clothSh'); }
      if (o.cloth === 'jacket') for (let y = 52; y < N; y++) { put(Math.round(cx - 3 - (y - 52) * .6), y, 'clothSh'); put(Math.round(cx + 3 + (y - 52) * .6), y, 'clothSh'); }
    }

    // 頭
    for (let y = 7; y <= 44; y++) {
      const rx = y <= 27 ? R0 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 24) / 17.5, 2))) : R0 - Math.pow((y - 27) / 17, 1.7) * jaw;
      if (y === 44 && fem) continue;
      for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= rx) put(x, y, 'skin');
    }
    // 耳
    if (o.hair !== 'long') for (let y = 24; y <= 32; y++) { const e = y > 24 && y < 32; put(16, y, 'shade'); put(47, y, 'deep'); if (e) { put(15, y, 'shade'); put(48, y, 'deep'); } if (y > 26 && y < 30) { put(16, y, 'deep'); put(47, y, 'line'); } }
    // 陰影（光は左上から）
    for (let y = 7; y <= 44; y++) for (let x = 0; x < N; x++) {
      if (at(x, y) !== 'skin') continue;
      if (x >= cx + 10 || (y >= 36 && x >= cx + 7)) put(x, y, 'shade');
      if (x >= cx + 13) put(x, y, 'deep');
      if (x >= 19 && x <= 21 && y >= 25 && y <= 33 && at(x - 1, y) && hash(x, y, 9) < .8) put(x, y, 'hi');
    }
    for (let x = 22; x <= 41; x++) { if (at(x, 44) === 'skin') put(x, 44, 'shade'); if (at(x, 43) === 'skin' && x > 35) put(x, 43, 'shade'); }
    for (let x = 29; x <= 34; x++) if (at(x, 41) === 'skin') put(x, 41, 'hi');

    // 髪
    const hs = o.hair || 'short';
    for (let y = 1; y <= 48; y++) for (let x = 0; x < N; x++) {
      const dx = (x - cx) / 16.3, dy = (y - 17) / 14, inside = dx * dx + dy * dy <= 1;
      const side = (x <= 18 || x >= 45);
      let fr;
      if (hs === 'short') fr = 15 + Math.round(Math.sin(x * .9) * 1.6 + (x > 35 ? 1 : 0));
      else if (hs === 'crop') fr = 11 + (hash(x, 1, 2) < .3 ? 1 : 0);
      else if (hs === 'parted') fr = x < 27 ? 12 + Math.round((27 - x) * .3) : 12 + Math.round((x - 27) * .1);
      else if (hs === 'thin') fr = Math.abs(x - cx) < 4.5 ? 11 : Math.abs(x - cx) < 10 ? 8 : 12;
      else if (hs === 'bun') fr = 13 + (x < 24 || x > 39 ? 1 : 0);
      else if (hs === 'long') fr = 13 + (x > 32 ? 1 : 0);
      if (inside && (y <= fr || (side && y <= (hs === 'bun' ? 22 : 25)))) {
        const strand = (x + Math.floor(y / 3)) % 5 === 0;
        put(x, y, (y < 10 && x < 30 && hash(x, y, 1) < .4) || strand ? 'hairHi' : 'hair');
      }
      if (hs === 'long' && ((x >= 13 && x <= 19) || (x >= 44 && x <= 50)) && y >= 13 && y <= 47 && !(y > 41 && (x === 13 || x === 50))) put(x, y, (x + y) % 6 === 0 ? 'hairHi' : 'hair');
    }
    if (hs === 'bun') {
      for (let y = 0; y <= 10; y++) for (let x = 23; x <= 40; x++) { const d = Math.hypot(x - cx, (y - 4.3) * 1.15); if (d <= 5.6 && !at(x, y)) put(x, y, (d < 3 && x < cx) ? 'hairHi' : 'hair'); }
      for (let y = 12; y <= 25; y++) { put(16, y, 'hair'); put(47, y, 'hair'); if (y < 22) { put(17, y, 'hair'); put(46, y, 'hair'); } }
      for (let x = 21; x <= 42; x += 3) put(x, 9, 'hairHi');
    }
    if (hs === 'parted') for (let y = 5; y <= 12; y++) put(27, y, 'hairHi');
    if (hs !== 'long' && hs !== 'bun') for (let y = 23; y <= 28; y++) { put(18, y, 'hair'); put(45, y, 'hair'); }

    // しわ
    const wr = o.wrinkles || 0;
    if (wr >= 1) for (let y = 33; y <= 37; y++) { put(27 - (y > 35 ? 1 : 0), y, 'shade'); put(36 + (y > 35 ? 1 : 0), y, 'shade'); }
    if (wr >= 2) { [[20, 27], [21, 28]].forEach(([x, y]) => { put(x, y, 'shade'); put(M(x), y, 'shade'); }); for (let x = 25; x <= 38; x++) { if (at(x, 13) === 'skin') put(x, 13, 'shade'); if (at(x, 15) === 'skin' && x % 2) put(x, 15, 'shade'); } }

    // 眉
    const B = {
      n: [[21, 20], [22, 20], [23, 20], [24, 20], [25, 20], [26, 20], [27, 20], [28, 20], [25, 19], [26, 19], [27, 19], [28, 19]],
      thick: [[21, 20], [22, 20], [23, 20], [24, 20], [25, 20], [26, 20], [27, 20], [28, 20], [21, 19], [22, 19], [23, 19], [24, 19], [25, 19], [26, 19], [27, 19], [28, 19], [26, 18], [27, 18], [28, 18]],
      thin: [[21, 20], [22, 19], [23, 19], [24, 19], [25, 19], [26, 19], [27, 19], [28, 20]],
      sad: [[21, 22], [22, 22], [23, 21], [24, 21], [25, 20], [26, 20], [27, 19], [28, 19], [22, 21], [24, 20], [26, 19], [28, 18], [27, 18]],
      stern: [[21, 19], [22, 19], [23, 19], [24, 20], [25, 20], [26, 21], [27, 21], [28, 22], [21, 20], [22, 20], [23, 20], [24, 21], [25, 21], [26, 22], [27, 22]]
    };
    const brow = B[o.brows || 'n'];
    [...brow, ...mir(brow)].forEach(([x, y]) => put(x, y, o.browColor ? 'brow' : 'line'));

    // 目（左目 x22〜28、右目は鏡像）
    function eye(mr) {
      const X = i => mr ? M(22 + i) : 22 + i;
      const row = (y, arr) => arr.forEach((c, i) => c && put(X(i), y, c));
      if (eyes > 0) row(23, ['shade', 'shade', 'shade', 'shade', 'shade', 'shade', 'shade']);
      if (o.narrow) {
        row(25, ['line', 'line', 'line', 'line', 'line', 'line', 'line']);
        row(26, ['shade', 'line', 'iris', 'pupil', 'iris', 'line', 'shade']);
        row(27, [null, 'shade', 'shade', 'shade', 'shade', 'shade', null]);
      } else if (eyes <= 1) {
        row(24, ['line', 'line', 'line', 'line', 'line', 'line', 'line']); if (fem) put(X(-1), 24, 'line');
        row(25, ['white', 'white', 'iris', 'pupil', 'iris', 'white', 'white']);
        row(26, ['shade', 'white', 'iris', 'iris', 'iris', 'white', 'shade']);
        put(X(2), 25, 'glint');
        if (eyes === 0) row(27, [null, 'shade', 'shade', 'shade', 'shade', 'shade', null]);
        else { row(27, ['bag', 'bag', 'bag', 'bag', 'bag', 'bag', 'bag']); row(28, [null, 'bag', 'bag', 'bag', 'bag', 'bag', null]); }
      } else if (eyes === 2) {
        row(24, ['shade', 'shade', 'shade', 'shade', 'shade', 'shade', 'shade']);
        row(25, ['line', 'line', 'line', 'line', 'line', 'line', 'line']);
        row(26, ['white', 'white', 'iris', 'pupil', 'iris', 'white', 'white']);
        row(27, ['bag', 'bag', 'bag', 'bag', 'bag', 'bag', 'bag']); row(28, [null, 'bag', 'bag', 'bag', 'bag', 'bag', null]);
      } else {
        row(24, ['shade', 'shade', 'shade', 'shade', 'shade', 'shade', 'shade']);
        row(25, ['line', 'line', 'line', 'line', 'line', 'line', 'line']);
        row(26, ['shade', 'shade', 'iris', 'pupil', 'iris', 'shade', 'shade']);
        row(27, ['bag', 'bag', 'bag', 'bag', 'bag', 'bag', 'bag']); row(28, ['shade', 'bag', 'bag', 'bag', 'bag', 'bag', 'shade']); row(29, [null, 'shade', 'shade', 'shade', 'shade', 'shade', null]);
      }
    }
    eye(false); eye(true);
    if (o.glasses) {
      const fr = 'frame';
      for (let x = 20; x <= 30; x++) { put(x, 22, fr); put(x, 29, fr); put(M(x), 22, fr); put(M(x), 29, fr); }
      for (let y = 22; y <= 29; y++) { put(20, y, fr); put(30, y, fr); put(M(20), y, fr); put(M(30), y, fr); }
      put(31, 24, fr); put(32, 24, fr); [17, 18, 19].forEach(x => { put(x, 24, fr); put(M(x), 24, fr); });
      put(21, 23, 'glint'); put(M(29), 23, 'glint');
    }

    // 鼻
    for (let y = 26; y <= 33; y++) put(33, y, 'shade');
    put(32, 33, 'hi'); put(31, 32, 'hi');
    for (let x = 30; x <= 34; x++) put(x, 34, 'shade');
    put(29, 34, 'deep'); put(35, 34, 'deep'); put(28, 33, 'shade'); put(36, 33, 'shade'); put(34, 35, 'shade');

    // 口
    const mouth = o.mouth || 'flat';
    if (mouth === 'frown') {
      for (let x = 28; x <= 35; x++) put(x, 38, 'lip'); put(27, 39, 'lip'); put(36, 39, 'lip'); put(26, 40, 'deep'); put(37, 40, 'deep');
      for (let x = 30; x <= 33; x++) put(x, 39, 'lipLo');
    } else if (mouth === 'smile') {
      for (let x = 27; x <= 36; x++) put(x, 39, 'lip'); put(26, 38, 'lip'); put(37, 38, 'lip');
      for (let x = 30; x <= 33; x++) put(x, 40, 'lipLo');
    } else if (mouth === 'tight') {
      for (let x = 27; x <= 36; x++) put(x, 38, 'deep'); put(26, 38, 'shade'); put(37, 38, 'shade');
    } else {
      for (let x = 27; x <= 36; x++) put(x, 38, 'lip'); put(27, 38, 'deep'); put(36, 38, 'deep');
      for (let x = 29; x <= 34; x++) put(x, 39, 'lipLo');
    }
    for (let x = 30; x <= 33; x++) if (at(x, 40) === 'skin') put(x, 40, 'shade');
    if (o.mustache) for (let x = 26; x <= 37; x++) { put(x, 36, 'hair'); if (x > 26 && x < 37) put(x, 37, (x % 3) ? 'hair' : 'hairHi'); }

    // ひげ・乱れ・頬
    const st = o.stubble || 0;
    if (st > 0) {
      const dens = st === 1 ? .35 : .62;
      for (let y = 35; y <= 44; y++) for (let x = 18; x <= 45; x++) {
        const c = at(x, y); if (!(c === 'skin' || c === 'shade' || c === 'hi')) continue;
        const mouthZone = (y >= 38 && y <= 39 && x >= 27 && x <= 36);
        const jw = !mouthZone && ((y >= 41) || (y >= 35 && y <= 37 && x >= 27 && x <= 36) || (y >= 37 && (x <= 24 || x >= 39)));
        if (jw && hash(x >> 1, y, st + 7) < dens) put(x, y, 'stub');
      }
    }
    if (o.messy) for (let i = 0; i < o.messy; i++) {
      const x = 18 + Math.floor(hash(i, 7, o.messy) * 28);
      let top = 0; while (top < N && at(x, top) !== 'hair' && at(x, top) !== 'hairHi') top++;
      if (top < N) { put(x, top - 1, 'hair'); if (hash(i, 11, o.messy) < .45) put(x + (hash(i, 5, 1) < .5 ? -1 : 1), top - 2, 'hair'); }
    }
    if (o.gaunt) for (let y = 31; y <= 37; y++) { if (at(21, y) && at(21, y) !== 'stub') put(21, y, 'shade'); if (at(22, y) === 'skin' && y > 32 && y < 36) put(22, y, 'shade'); if (at(42, y) && at(42, y) !== 'stub') put(42, y, 'deep'); }

    // 輪郭線
    const out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!g[y][x] || y >= 53) continue;
      if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1)) out.push([x, y]);
    }
    out.forEach(([x, y]) => { const c = at(x, y) || ''; if (c.startsWith('cloth') || c === 'shirt' || c === 'tie') put(x, y, 'clothSh'); else put(x, y, 'line'); });
    return g;
  }

  // ---- 人物の設定 ----
  const BASE = { glint: '#f2ede2', line: '#1c1511', white: '#dcd4c4', iris: '#3b2a20', pupil: '#140f0c', lip: '#9a6352', lipLo: '#b27a66', bag: '#a98069', stub: '#8f7b69', frame: '#2a2622', shirt: '#d8d4c8', tie: '#6b2a26', brow: '#5a5550' };
  const PEOPLE = {
    kuzumi: st => ({ o: { hair: 'short', eyes: [0, 1, 2, 3][st], stubble: [0, 0, 1, 2][st], messy: [0, 0, 5, 10][st], brows: st === 3 ? 'sad' : 'n', mouth: st === 3 ? 'frown' : 'flat', gaunt: st === 3, cloth: 'sweat' },
                    p: Object.assign({}, KUZUMI_SKIN[st], CLOTH.sweat, { hair: '#2a221d', hairHi: '#3d332b' }) }),
    todo:     () => ({ o: { hair: 'crop', brows: 'stern', narrow: true, wrinkles: 2, mouth: 'tight', cloth: 'suit', tie: true, wide: 11.2, jaw: 6 }, p: Object.assign({}, SKIN.c, CLOTH.suit, { hair: '#3a3632', hairHi: '#5e5a54', tie: '#3e2a4a' }) }),
    shirai:   () => ({ o: { hair: 'thin', brows: 'thick', wrinkles: 2, mustache: true, cloth: 'jacket', mouth: 'flat', wide: 11 }, p: Object.assign({}, SKIN.c, CLOTH.jacket, { hair: '#6a655e', hairHi: '#8a857c' }) }),
    oka:      () => ({ o: { hair: 'parted', glasses: true, cloth: 'navy', tie: true, mouth: 'flat' }, p: Object.assign({}, SKIN.a, CLOTH.navy, { hair: '#231c18', hairHi: '#3a302a', tie: '#2c4a5a' }) }),
    noguchi:  () => ({ o: { hair: 'short', brows: 'thin', cloth: 'suit', tie: true, mouth: 'flat', wide: 10.2 }, p: Object.assign({}, SKIN.b, CLOTH.suit, { hair: '#2e2420', hairHi: '#4a3a30', tie: '#5a5a2a' }) }),
    aoyagi:   () => ({ o: { female: true, hair: 'bun', glasses: true, wrinkles: 2, cloth: 'cardigan', brows: 'thin', mouth: 'flat' }, p: Object.assign({}, SKIN.old, CLOTH.cardigan, { hair: '#8d8880', hairHi: '#b3aea5', lip: '#a06a5c' }) }),
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

  // ---- 背景（論理 240×105） ----
  const W = 240, H = 105;
  function R(x, c, X, Y, w, h) { x.fillStyle = c; x.fillRect(X, Y, w, h); }
  function tex(x, X, Y, w, h, c, dens, seed) { x.fillStyle = c; for (let j = Y; j < Y + h; j++) for (let i = X; i < X + w; i++) if (hash(i, j, seed) < dens) x.fillRect(i, j, 1, 1); }
  function books(x, X, Y, w, h, seed) {
    const cols = ['#6a3a2a', '#3a4a5a', '#5a5a3a', '#4a3a4a', '#7a6a4a', '#2f4a3a', '#5a2f2f', '#8a7a5a'];
    let i = X; while (i < X + w - 2) { const bw = 2 + Math.floor(hash(i, Y, seed) * 4), bh = h - Math.floor(hash(i, Y + 1, seed) * 5); R(x, cols[Math.floor(hash(i, 3, seed) * cols.length)], i, Y + h - bh, bw, bh); R(x, 'rgba(255,255,255,.08)', i, Y + h - bh + 2, 1, bh - 4); i += bw + (hash(i, 9, seed) < .15 ? 2 : 0); }
  }
  const BG = {
    dark: x => R(x, '#0b0a09', 0, 0, W, H),
    office: x => {
      R(x, '#2c2a25', 0, 0, W, H); tex(x, 0, 0, W, 70, '#312e29', .2, 1); R(x, '#24221f', 0, 0, W, 6); for (let i = 0; i < W; i += 30) R(x, '#3a3832', i + 10, 1, 14, 3);
      // 窓とブラインド
      R(x, '#1b1f22', 10, 12, 50, 36); for (let j = 13; j < 47; j += 3) R(x, '#5f6d73', 11, j, 48, 2); R(x, '#2a2e30', 34, 12, 2, 36);
      // ホワイトボード
      R(x, '#1d1c19', 150, 10, 80, 44); R(x, '#d6d3c8', 152, 12, 76, 40);
      [[156, 15, '#c9bfa6'], [176, 15, '#bfb59c'], [196, 15, '#c9bfa6']].forEach(([a, b, c]) => { R(x, c, a, b, 14, 18); R(x, '#8a8070', a + 4, b + 4, 6, 7); });
      R(x, '#b23a2e', 160, 36, 50, 1); R(x, '#b23a2e', 182, 33, 1, 6); for (let k = 0; k < 4; k++) R(x, '#3a4a6a', 156 + k * 16, 42, 12, 1); R(x, '#3a4a6a', 156, 46, 40, 1);
      // 書類棚
      R(x, '#4a463c', 70, 20, 24, 50); for (let j = 24; j < 68; j += 11) { R(x, '#3a362e', 72, j, 20, 9); R(x, '#8a8270', 80, j + 4, 4, 1); }
      // 机
      R(x, '#4a3a29', 0, 76, W, 29); R(x, '#5a4733', 0, 76, W, 2); tex(x, 0, 78, W, 27, '#3e3021', .15, 2); R(x, '#2b2118', 0, 75, W, 1);
      R(x, '#d9cfb4', 16, 66, 34, 10); R(x, '#e4dbc2', 18, 63, 30, 10); R(x, '#cfc5aa', 20, 60, 26, 4); for (let j = 65; j < 73; j += 2) R(x, '#9a917c', 22, j, 22, 1);
      R(x, '#151515', 196, 66, 18, 10); R(x, '#222', 199, 63, 12, 4); R(x, '#151515', 214, 70, 6, 6);
      R(x, '#5a5a5a', 168, 58, 2, 18); R(x, '#d8c37a', 162, 56, 12, 4);
    },
    interro: x => {
      R(x, '#24221e', 0, 0, W, H); tex(x, 0, 0, W, 72, '#29271f', .25, 3); R(x, '#1a1916', 0, 0, W, 4);
      // マジックミラー・時計
      R(x, '#111', 176, 14, 50, 30); R(x, '#1d2224', 178, 16, 46, 26); R(x, '#2a3134', 180, 18, 14, 22);
      R(x, '#151412', 28, 12, 16, 16); R(x, '#d6d0c0', 29, 13, 14, 14); R(x, '#222', 35, 15, 1, 6); R(x, '#222', 35, 20, 5, 1);
      // 電灯と光
      R(x, '#3a3a3a', 112, 0, 16, 3); R(x, '#d8c37a', 108, 3, 24, 4);
      x.fillStyle = 'rgba(216,195,122,.06)'; x.beginPath(); x.moveTo(108, 7); x.lineTo(132, 7); x.lineTo(196, 90); x.lineTo(44, 90); x.fill();
      // 机
      R(x, '#3b3227', 26, 84, 188, 6); R(x, '#4a3f31', 26, 84, 188, 1); R(x, '#2b241b', 34, 90, 6, 15); R(x, '#2b241b', 200, 90, 6, 15);
      R(x, '#dcd2b6', 52, 79, 24, 5); R(x, '#cfc5aa', 54, 77, 20, 2); R(x, '#222', 160, 80, 2, 4); R(x, '#888', 156, 82, 10, 2);
    },
    shop: x => {
      R(x, '#2b241c', 0, 0, W, H);
      for (let k = 0; k < 6; k++) { const X = k * 40 + 2; R(x, '#3a2e22', X, 4, 36, 70); for (let j = 0; j < 5; j++) { R(x, '#2a2016', X, 4 + j * 14 + 12, 36, 2); books(x, X + 2, 4 + j * 14, 32, 12, k * 10 + j); } }
      R(x, '#4a3a29', 0, 80, W, 25); R(x, '#5a4733', 0, 80, W, 2); tex(x, 0, 82, W, 23, '#3e3021', .15, 5);
      R(x, '#d8c37a', 210, 2, 10, 4); x.fillStyle = 'rgba(216,195,122,.07)'; x.fillRect(150, 6, 90, 74);
      R(x, '#5a4630', 96, 70, 48, 10); R(x, '#3e6a3a', 110, 64, 18, 6);
    },
    street: x => {
      R(x, '#121419', 0, 0, W, H); tex(x, 0, 0, W, 30, '#1a1d24', .05, 6);
      for (let k = 0; k < 7; k++) { const X = k * 36, h = 30 + Math.floor(hash(k, 1, 7) * 26); R(x, '#23262d', X, 60 - h, 32, h); for (let j = 60 - h + 4; j < 56; j += 7) for (let i = X + 3; i < X + 29; i += 7) R(x, hash(i, j, 8) < .3 ? '#c9b46a' : '#2f333b', i, j, 4, 4); }
      R(x, '#1f2228', 0, 60, W, 45); R(x, '#2a2d34', 0, 60, W, 2); R(x, '#3a3d44', 0, 92, W, 2);
      R(x, '#333', 40, 20, 2, 72); R(x, '#d8c37a', 34, 18, 14, 3); x.fillStyle = 'rgba(216,195,122,.08)'; x.beginPath(); x.moveTo(34, 21); x.lineTo(48, 21); x.lineTo(70, 92); x.lineTo(12, 92); x.fill();
      R(x, '#2b2f36', 150, 88, 60, 4); R(x, '#16303a', 150, 92, 60, 13);
      for (let i = 0; i < W; i += 2) R(x, '#2a2a2a', i, 10 + Math.round(Math.sin(i / 30) * 2), 1, 1);
    },
    home: x => {
      R(x, '#2a2420', 0, 0, W, H); R(x, '#3a3028', 0, 0, W, 68); tex(x, 0, 0, W, 68, '#40352b', .15, 10);
      R(x, '#4a4038', 0, 66, W, 2);
      R(x, '#555', 118, 0, 4, 6); R(x, '#d8c37a', 108, 6, 24, 5); x.fillStyle = 'rgba(216,195,122,.08)'; x.fillRect(50, 11, 140, 70);
      R(x, '#c8c4b8', 186, 20, 34, 56); R(x, '#a8a498', 186, 46, 34, 1); R(x, '#777', 214, 26, 2, 12);
      R(x, '#5a4430', 30, 78, 180, 7); R(x, '#4a3826', 38, 85, 5, 20); R(x, '#4a3826', 196, 85, 5, 20);
      R(x, '#e8e0d0', 80, 73, 14, 5); R(x, '#e8e0d0', 140, 73, 14, 5); R(x, '#d0c0a0', 108, 70, 18, 8); R(x, '#f0ecd8', 60, 74, 12, 4);
      R(x, '#e8e4d8', 20, 30, 26, 18); for (let j = 33; j < 46; j += 3) R(x, '#888', 23, j, 18, 1);
    },
    court: x => {
      R(x, '#2b2620', 0, 0, W, H); tex(x, 0, 0, W, 40, '#2f2a23', .2, 11); R(x, '#241f1a', 0, 0, W, 20);
      R(x, '#8a7a50', 111, 3, 18, 14); R(x, '#2b2620', 115, 6, 10, 8); R(x, '#8a7a50', 119, 8, 2, 4);
      R(x, '#5a4630', 14, 44, 212, 20); R(x, '#6e5a3f', 14, 44, 212, 3); for (let i = 20; i < 220; i += 20) R(x, '#4f3d2a', i, 48, 1, 16);
      R(x, '#4f3d2a', 98, 84, 44, 21); R(x, '#6e5a3f', 98, 84, 44, 2); R(x, '#3f3123', 8, 64, 40, 20); R(x, '#3f3123', 192, 64, 40, 20);
    },
    pros: x => {
      R(x, '#27261f', 0, 0, W, H); R(x, '#2f2d26', 0, 0, W, 52); tex(x, 0, 0, W, 52, '#33302a', .15, 12);
      R(x, '#1d201f', 14, 8, 44, 30); R(x, '#6d7a72', 16, 10, 40, 26); R(x, '#4a5550', 35, 10, 2, 26);
      R(x, '#3a3224', 150, 4, 84, 48); for (let j = 0; j < 3; j++) { R(x, '#2a2218', 150, 4 + j * 16 + 14, 84, 2); books(x, 152, 4 + j * 16, 80, 14, 40 + j); }
      R(x, '#3e3022', 0, 76, W, 29); R(x, '#4a3a29', 0, 76, W, 2);
      R(x, '#d9cfb4', 64, 64, 80, 12); R(x, '#e5dcc4', 68, 60, 72, 6); R(x, '#d4caae', 72, 56, 64, 5); R(x, '#b23a2e', 74, 58, 8, 2);
    },
    phone: x => { R(x, '#1d1c19', 0, 0, W, H); R(x, '#111', 100, 40, 40, 20); R(x, '#222', 104, 34, 32, 6); }
  };

  function scene(cv, sc) {
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    x.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    (BG[sc.bg] || BG.dark)(x);
    if (sc.who && PEOPLE[sc.who]) {
      const s = sprite(sc.who, sc.stage);
      const px = sc.x === 'l' ? 40 : sc.x === 'r' ? 136 : 88;
      x.drawImage(s, px, H - N);
    }
    if (sc.dim) { x.fillStyle = 'rgba(0,0,0,' + sc.dim + ')'; x.fillRect(0, 0, W, H); }
    x.setTransform(1, 0, 0, 1, 0, 0);
  }
  G.portraits = { scene, sprite, PEOPLE };
})();
