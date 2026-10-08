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
    blouse:   { cloth: '#8c8f86', clothSh: '#6c6f67', clothHi: '#a3a69c' },
    coat:     { cloth: '#6a6a66', clothSh: '#4e4e4b', clothHi: '#7c7c78' },
    lab:      { cloth: '#d6d4cc', clothSh: '#aeaca4', clothHi: '#e6e4dc' },
    beige:    { cloth: '#b8a888', clothSh: '#968868', clothHi: '#c8b898' }
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

    // 体：首の付け根から僧帽筋がなだらかに下り、肩で丸くなり、腕が下りる。肩幅は頭の大きさに合わせる
    const SH = o.shoulder || (R0 * (fem ? 1.35 : 1.6)), NB = fem ? 5 : 6;
    const bodyHalf = y => {
      if (y < 46) return -1;
      const t = Math.min(1, (y - 46) / 7);
      let h = NB + (SH - NB) * (1 - Math.pow(1 - t, 2.2));
      if (y >= 52 && y <= 54) h -= [1, .4, 0][y - 52] * (y === 52 ? 1 : 1);
      return y > 54 ? SH + (y - 54) * .25 : h;
    };
    for (let y = 46; y < N; y++) { const h = bodyHalf(y); for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= h) put(x, y, 'cloth'); }
    // 光は左上から：右側を暗く、肩の上を明るく
    for (let y = 46; y < N; y++) for (let x = 0; x < N; x++) if (at(x, y) === 'cloth') {
      if (x > cx + SH * .55) put(x, y, 'clothSh');
      else if (y <= 52 && x < cx - 6 && at(x, y - 1) == null) put(x, y + 1, 'clothHi');
    }
    // 腕と胴の境（袖の付け根の線）
    for (let y = 55; y < N; y++) { const k = (y - 55) * .15; put(Math.round(cx - SH + 4 + k), y, 'clothSh'); put(Math.round(cx + SH - 4 - k), y, 'clothSh'); }
    for (let x = 4; x < 26; x++) for (let y = 54; y < N; y++) if (at(x, y) === 'cloth' && hash(x, y, 3) < .12) put(x, y, 'clothHi');
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

    // 頭（各行の半幅 hw(y) を先に決め、耳も髪もこの輪郭から作る）
    const hw = y => y < 7 || y > 44 ? -1 : y <= 27 ? R0 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 24) / 17.5, 2))) : R0 - Math.pow((y - 27) / 17, 1.7) * jaw;
    for (let y = 7; y <= 44; y++) {
      if (y === 44 && fem) continue;
      for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= hw(y)) put(x, y, 'skin');
    }
    const edgeL = y => { for (let x = 0; x < N; x++) if (at(x, y) === 'skin') return x; return -1; };
    const edgeR = y => { for (let x = N - 1; x >= 0; x--) if (at(x, y) === 'skin') return x; return -1; };
    // 耳（その行の顔の端に付ける）
    const hs = o.hair || 'short';
    const earRows = [[24, 2], [25, 3], [26, 3], [27, 3], [28, 3], [29, 3], [30, 3], [31, 2], [32, 1]];
    if (!['long', 'wavy'].includes(hs)) earRows.forEach(([y, w]) => {
      const l = edgeL(y), r = edgeR(y);
      for (let k = 1; k <= w; k++) {
        const inner = k === 2 && y >= 26 && y <= 29;
        put(l - k, y, inner ? 'shade' : 'skin'); put(r + k, y, inner ? 'deep' : 'shade');
      }
    });
    // 陰影（光は左上から）
    for (let y = 7; y <= 44; y++) for (let x = 0; x < N; x++) {
      if (at(x, y) !== 'skin') continue;
      if (x >= cx + 10 || (y >= 36 && x >= cx + 7)) put(x, y, 'shade');
      if (x >= cx + 13) put(x, y, 'deep');
      if (x >= 19 && x <= 21 && y >= 25 && y <= 33 && at(x - 1, y) && hash(x, y, 9) < .8) put(x, y, 'hi');
    }
    for (let x = 22; x <= 41; x++) { if (at(x, 44) === 'skin') put(x, 44, 'shade'); if (at(x, 43) === 'skin' && x > 35) put(x, 43, 'shade'); }
    for (let x = 29; x <= 34; x++) if (at(x, 41) === 'skin') put(x, 41, 'hi');

    // 髪：頭の輪郭に沿って生やす（t＝外側へのボリューム、fr(x)＝前髪の生え際、sideLim＝もみあげの下端）
    const HS = {
      short:  { t: 2, side: 3, lim: 23, fr: x => 15 + Math.round(Math.sin(x * .9) * 1.6 + (x > 35 ? 1 : 0)) },
      crop:   { t: 1, side: 2, lim: 22, fr: x => 11 + (hash(x, 1, 2) < .3 ? 1 : 0) },
      parted: { t: 2, side: 3, lim: 23, fr: x => x < 27 ? 12 + Math.round((27 - x) * .3) : 12 + Math.round((x - 27) * .1) },
      partedR:{ t: 2, side: 3, lim: 23, fr: x => x > 36 ? 12 + Math.round((x - 36) * .3) : 12 + Math.round((36 - x) * .1) },
      thin:   { t: 1, side: 2, lim: 22, fr: x => Math.abs(x - cx) > 8 ? 12 : 9 },
      bun:    { t: 1, side: 2, lim: 21, fr: x => 13 + (x < 24 || x > 39 ? 1 : 0) },
      long:   { t: 2, side: 3, lim: 24, fr: x => 13 + (x > 32 ? 1 : 0), hang: 47 },
      wavy:   { t: 3, side: 3, lim: 24, fr: x => 13 + (x > 30 ? 2 : 0), hang: 47, wave: true },
      bob:    { t: 3, side: 3, lim: 24, fr: x => 16, hang: 36 },
      buzz:   { t: 1, side: 2, lim: 22, fr: x => 11 },
      slick:  { t: 1, side: 2, lim: 22, fr: x => 10 },
      shaggy: { t: 3, side: 3, lim: 24, fr: x => 17 + (hash(x, 2, 5) < .4 ? 1 : 0) },
      spiky:  { t: 2, side: 3, lim: 23, fr: x => 13 + (x % 3 === 0 ? -1 : 0) },
      curly:  { t: 3, side: 3, lim: 23, fr: x => 13 + Math.round(Math.sin(x * 1.7) * 1.5) },
      bald:   { t: 1, side: 2, lim: 23, top: 14, fr: x => -1 }
    }[hs] || { t: 2, side: 3, lim: 23, fr: x => 15 };
    const hairPx = (x, y) => {
      let hi = (y < 10 && x < 30 && hash(x, y, 1) < .4) || (x + Math.floor(y / 3)) % 5 === 0;
      if (hs === 'buzz') hi = hash(x, y, 3) < .35;
      if (hs === 'slick') hi = (x + y) % 6 === 0;
      if (hs === 'curly') hi = (x + y) % 2 === 0 && hash(x, y, 4) < .6;
      put(x, y, hi ? 'hairHi' : 'hair');
    };
    const T = HS.t, top = 7 - T;
    // 外側の輪郭：頭の楕円を T だけ膨らませ、もみあげの下端に向かって頭の輪郭へ戻す
    const ho = y => {
      if (y < top) return -1;
      if (y <= 24) return (R0 + T) * Math.sqrt(Math.max(0, 1 - Math.pow((y - 24) / (17.5 + T), 2)));
      return hw(y) + Math.max(0, T * (HS.lim - y) / Math.max(1, HS.lim - 24));
    };
    for (let y = top; y <= HS.lim; y++) for (let x = 0; x < N; x++) {
      const d = Math.abs(x - cx), o2 = ho(y); if (d > o2) continue;
      const cap = y <= HS.fr(x);
      const band = y >= (HS.top || 0) && d >= Math.max(0, hw(y)) - HS.side + (y > 20 ? Math.min(2, y - 20) : 0);
      if (cap || band) hairPx(x, y);
    }
    // 垂れる髪（顔の端から外側へ、すき間なく）
    if (HS.hang) {
      const outer = R0 + T;
      for (let y = HS.lim; y <= HS.hang; y++) {
        const off = HS.wave ? Math.round(Math.sin(y / 3) * 1.2) : 0;
        const ow = outer - (y > HS.hang - 3 ? (y - (HS.hang - 3)) : 0);
        const inner = y <= 44 ? Math.max(0, hw(y) - 1) : (fem ? 4.5 : 5.5);
        for (let x = 0; x < N; x++) {
          const dx = x - cx, d = Math.abs(dx + (dx < 0 ? off : -off) * 0);
          const dd = Math.abs(x + (dx < 0 ? -off : off) - cx);
          if (dd <= ow && d >= inner) { if (y > 44 && at(x, y) && !String(at(x, y)).startsWith('cloth') ) continue; hairPx(x, y); }
        }
      }
    }
    if (hs === 'bun') {
      for (let y = 0; y <= 10; y++) for (let x = 23; x <= 40; x++) { const d = Math.hypot(x - cx, (y - 4.3) * 1.15); if (d <= 5.6 && (!at(x, y) || y < 7)) put(x, y, (d < 3 && x < cx) ? 'hairHi' : 'hair'); }
      for (let x = 21; x <= 42; x += 3) if (at(x, 9) === 'hair') put(x, 9, 'hairHi');
    }
    if (hs === 'parted') for (let y = 5; y <= 12; y++) if (at(27, y)) put(27, y, 'hairHi');
    if (hs === 'partedR') for (let y = 5; y <= 12; y++) if (at(36, y)) put(36, y, 'hairHi');
    if (hs === 'spiky') for (let x = 20; x <= 43; x += 3) { let tp = 0; while (tp < N && at(x, tp) !== 'hair' && at(x, tp) !== 'hairHi') tp++; if (tp < N) { put(x, tp - 1, 'hair'); put(x, tp - 2, 'hair'); } }
    // もみあげ（顔の端に沿って）
    if (!HS.hang && hs !== 'bald') for (let y = HS.lim; y <= HS.lim + 2; y++) { const l = edgeL(y), r = edgeR(y); if (l >= 0) { put(l, y, 'hair'); put(r, y, 'hair'); } }

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
    const ed = o.eyeDy || 0, eg = o.eyeGap || 0, md = o.mouthDy || 0, nl = o.noseLong || 0;
    const brow = B[o.brows || 'n'].map(([x, y]) => [x - eg, y + ed + (o.browDy || 0)]);
    [...brow, ...mir(brow)].forEach(([x, y]) => put(x, y, o.browColor ? 'brow' : 'line'));

    // 目（左目 x22〜28、右目は鏡像）
    function eye(mr) {
      const X = i => mr ? M(22 - eg + i) : 22 - eg + i;
      const row = (y, arr) => arr.forEach((c, i) => c && put(X(i), y + ed, c));
      if (eyes > 0) row(23, ['shade', 'shade', 'shade', 'shade', 'shade', 'shade', 'shade']);
      if (o.narrow) {
        row(25, ['line', 'line', 'line', 'line', 'line', 'line', 'line']);
        row(26, ['shade', 'line', 'iris', 'pupil', 'iris', 'line', 'shade']);
        row(27, [null, 'shade', 'shade', 'shade', 'shade', 'shade', null]);
      } else if (eyes <= 1) {
        row(24, ['line', 'line', 'line', 'line', 'line', 'line', 'line']); if (fem) put(X(-1), 24, 'line');
        row(25, ['white', 'white', 'iris', 'pupil', 'iris', 'white', 'white']);
        row(26, ['shade', 'white', 'iris', 'iris', 'iris', 'white', 'shade']);
        put(X(2), 25 + ed, 'glint');
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
    if (o.blink) for (const mr of [false, true]) for (let i = 0; i < 7; i++) {
      const x = mr ? M(22 - eg + i) : 22 - eg + i, low = ((eyes >= 2) ? 26 : 25) + ed;
      for (let y = 24 + ed; y <= low; y++) put(x, y, y === 24 + ed && eyes > 0 ? 'shade' : 'skin');
      put(x, low + 1, 'line');
    }
    if (o.glasses) {
      const fr = 'frame';
      for (let x = 20; x <= 30; x++) { put(x, 22, fr); put(x, 29, fr); put(M(x), 22, fr); put(M(x), 29, fr); }
      for (let y = 22; y <= 29; y++) { put(20, y, fr); put(30, y, fr); put(M(20), y, fr); put(M(30), y, fr); }
      put(31, 24, fr); put(32, 24, fr); for (let x = edgeL(24) - 1; x <= 19; x++) { put(x, 24, fr); put(M(x), 24, fr); }
      put(21, 23, 'glint'); put(M(29), 23, 'glint');
    }

    // 鼻
    for (let y = 26; y <= 33 + nl; y++) put(33, y, 'shade');
    put(32, 33 + nl, 'hi'); put(31, 32 + nl, 'hi');
    for (let x = 30; x <= 34; x++) put(x, 34 + nl, 'shade');
    put(29, 34 + nl, 'deep'); put(35, 34 + nl, 'deep'); put(28, 33 + nl, 'shade'); put(36, 33 + nl, 'shade'); put(34, 35 + nl, 'shade');

    // 口
    const mouth = o.mouth || 'flat';
    if (mouth === 'frown') {
      for (let x = 28; x <= 35; x++) put(x, 38 + md, 'lip'); put(27, 39 + md, 'lip'); put(36, 39 + md, 'lip'); put(26, 40 + md, 'deep'); put(37, 40 + md, 'deep');
      for (let x = 30; x <= 33; x++) put(x, 39 + md, 'lipLo');
    } else if (mouth === 'smile') {
      for (let x = 27; x <= 36; x++) put(x, 39 + md, 'lip'); put(26, 38 + md, 'lip'); put(37, 38 + md, 'lip');
      for (let x = 30; x <= 33; x++) put(x, 40 + md, 'lipLo');
    } else if (mouth === 'tight') {
      for (let x = 27; x <= 36; x++) put(x, 38 + md, 'deep'); put(26, 38 + md, 'shade'); put(37, 38 + md, 'shade');
    } else {
      for (let x = 27; x <= 36; x++) put(x, 38 + md, 'lip'); put(27, 38 + md, 'deep'); put(36, 38 + md, 'deep');
      for (let x = 29; x <= 34; x++) put(x, 39 + md, 'lipLo');
    }
    for (let x = 30; x <= 33; x++) if (at(x, 40 + md) === 'skin') put(x, 40 + md, 'shade');
    if (o.mouthOpen) { for (let x = 28; x <= 35; x++) put(x, 38 + md, 'lip'); for (let x = 29; x <= 34; x++) put(x, 39 + md, 'mouthIn'); for (let x = 30; x <= 33; x++) { put(x, 40 + md, 'lipLo'); put(x, 39 + md, x === 30 || x === 33 ? 'mouthIn' : 'teeth'); } }
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
    const hairTop = []; for (let x = 0; x < N; x++) { let tp = 0; while (tp < N && at(x, tp) !== 'hair' && at(x, tp) !== 'hairHi') tp++; hairTop[x] = tp; }
    const used = {};
    if (o.messy) for (let i = 0; i < o.messy; i++) {
      // 寝ぐせ：髪の外周から、2画素幅の短い房を外へはねさせる（必ず髪につながる）
      const x = 20 + Math.floor(hash(i, 7, o.messy) * 24);
      const tp = hairTop[x];
      if (tp >= N || tp > 12 || used[x] || used[x - 1] || used[x + 1] || used[x - 2] || used[x + 2]) continue;
      used[x] = true;
      const lean = x < cx ? -1 : 1;
      put(x - 1, tp - 1, 'hair'); put(x, tp - 1, 'hair'); put(x + lean, tp - 1, 'hair');
      if (hash(i, 11, o.messy) < .4) { put(x, tp - 2, 'hair'); put(x + lean, tp - 2, 'hair'); }
    }

    if (o.gaunt) for (let y = 31; y <= 37; y++) { if (at(21, y) && at(21, y) !== 'stub') put(21, y, 'shade'); if (at(22, y) === 'skin' && y > 32 && y < 36) put(22, y, 'shade'); if (at(42, y) && at(42, y) !== 'stub') put(42, y, 'deep'); }

    // すき間の検査：上半身より上で、左右を塗られた画素にはさまれた空白は、透けて見える
    let holes = 0;
    for (let y = 0; y < 48; y++) {
      let l = -1, r = -1; for (let x = 0; x < N; x++) if (g[y][x]) { if (l < 0) l = x; r = x; }
      for (let x = l + 1; x < r; x++) if (!g[y][x]) {
        // 縦にも上下がふさがっているもの（本当の穴）だけを埋める
        let up = false, dn = false; for (let k = y - 1; k >= 0; k--) if (g[k][x]) { up = true; break; } for (let k = y + 1; k < N; k++) if (g[k][x]) { dn = true; break; }
        if (up && dn) { holes++; const nb = [g[y][x - 1], g[y][x + 1], at(x, y - 1), at(x, y + 1)].find(c => c && /hair/.test(c)); g[y][x] = nb || 'skin'; }
      }
    }
    face.holes = (face.holes || 0) + holes;

    // 輪郭線
    const out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!g[y][x]) continue;
      if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1)) out.push([x, y]);
    }
    out.forEach(([x, y]) => { const c = at(x, y) || ''; if (c.startsWith('cloth') || c === 'shirt' || c === 'tie') put(x, y, 'clothSh'); else put(x, y, 'line'); });
    return g;
  }

  // ---- 人物の設定 ----
  const BASE = { mouthIn: '#3a1f1a', teeth: '#cfc6b6', glint: '#f2ede2', line: '#1c1511', white: '#dcd4c4', iris: '#3b2a20', pupil: '#140f0c', lip: '#9a6352', lipLo: '#b27a66', bag: '#a98069', stub: '#8f7b69', frame: '#2a2622', shirt: '#d8d4c8', tie: '#6b2a26', brow: '#5a5550' };
  const PEOPLE = {
    kuzumi: st => ({ o: { hair: 'short', eyes: [0, 1, 2, 3][st], stubble: [0, 0, 1, 2][st], messy: [0, 0, 5, 10][st], brows: st === 3 ? 'sad' : 'n', mouth: st === 3 ? 'frown' : 'flat', gaunt: st === 3, cloth: 'sweat' },
                    p: Object.assign({}, KUZUMI_SKIN[st], CLOTH.sweat, { hair: '#2a221d', hairHi: '#3d332b' }) }),
    todo:     () => ({ o: { hair: 'crop', brows: 'stern', narrow: true, wrinkles: 2, mouth: 'tight', cloth: 'suit', tie: true, wide: 11.2, jaw: 6, mouthDy: 1, noseLong: 1 }, p: Object.assign({}, SKIN.c, CLOTH.suit, { hair: '#3a3632', hairHi: '#5e5a54', tie: '#3e2a4a' }) }),
    shirai:   () => ({ o: { hair: 'thin', brows: 'thick', wrinkles: 2, mustache: true, cloth: 'jacket', mouth: 'flat', wide: 11, eyeDy: 1, eyeGap: 1 }, p: Object.assign({}, SKIN.c, CLOTH.jacket, { hair: '#6a655e', hairHi: '#8a857c' }) }),
    oka:      () => ({ o: { hair: 'parted', glasses: true, cloth: 'navy', tie: true, mouth: 'flat', wide: 10, jaw: 7.4, eyeGap: -1 }, p: Object.assign({}, SKIN.a, CLOTH.navy, { hair: '#231c18', hairHi: '#3a302a', tie: '#2c4a5a' }) }),
    noguchi:  () => ({ o: { hair: 'spiky', brows: 'thin', cloth: 'suit', tie: true, mouth: 'smile', wide: 10.2, eyeDy: 1, mouthDy: -1 }, p: Object.assign({}, SKIN.b, CLOTH.suit, { hair: '#2e2420', hairHi: '#4a3a30', tie: '#5a5a2a' }) }),
    aoyagi:   () => ({ o: { female: true, hair: 'bun', glasses: true, wrinkles: 2, cloth: 'cardigan', brows: 'thin', mouth: 'flat' }, p: Object.assign({}, SKIN.old, CLOTH.cardigan, { hair: '#8d8880', hairHi: '#b3aea5', lip: '#a06a5c' }) }),
    murai:    () => ({ o: { female: true, hair: 'long', cloth: 'blouse', brows: 'thin', mouth: 'flat' }, p: Object.assign({}, SKIN.b, CLOTH.blouse, { hair: '#3a2c24', hairHi: '#54423a', lip: '#a8645a' }) }),
    miyashita:() => ({ o: { hair: 'buzz', brows: 'stern', narrow: true, stubble: 1, cloth: 'jacket', mouth: 'tight', wide: 10.2, jaw: 7.4, noseLong: 1, eyeGap: -1 }, p: Object.assign({}, SKIN.c, CLOTH.jacket, { hair: '#1e1a17', hairHi: '#2e2824', stub: '#7a6656' }) }),
    sakai:    () => ({ o: { hair: 'curly', brows: 'n', stubble: 1, cloth: 'jacket', mouth: 'flat', eyes: 1, wrinkles: 1, wide: 11.2, eyeGap: 1 }, p: Object.assign({}, SKIN.a, CLOTH.jacket, { hair: '#2b2622', hairHi: '#3e3832', cloth: '#5a4a3a', clothSh: '#43372b', clothHi: '#6a5848' }) }),
    toda:     st => ({ o: susp({ hair: 'buzz', brows: 'thick', cloth: 'navy', tie: true, mouth: 'tight', wide: 11.6, jaw: 5.6, eyeGap: 1, mouthDy: 1 }, st), p: Object.assign({}, SKIN.c, CLOTH.navy, { hair: '#1e1a17', hairHi: '#34302a', tie: '#3a3a52', stub: '#6e5c4e' }) }),
    saeki:    st => ({ o: susp({ hair: 'partedR', glasses: true, cloth: 'suit', tie: true, mouth: 'flat', wrinkles: 1, eyeDy: 1, wide: 10.4 }, st), p: Object.assign({}, SKIN.a, CLOTH.suit, { hair: '#4a4540', hairHi: '#6e6860', tie: '#5a2a2a' }) }),
    misaki:   () => ({ o: { female: true, hair: 'wavy', cloth: 'beige', brows: 'thin', mouth: 'flat', wide: 10, eyeDy: 1 }, p: Object.assign({}, SKIN.b, CLOTH.beige, { hair: '#2a1e18', hairHi: '#44342a', lip: '#b06a60' }) }),
    eto:      () => ({ o: { hair: 'slick', narrow: true, cloth: 'coat', mouth: 'tight', wrinkles: 1, stubble: 1, wide: 9.8, jaw: 7.8, noseLong: 2 }, p: Object.assign({}, SKIN.a, CLOTH.coat, { hair: '#3a3632', hairHi: '#55504a' }) }),
    otsuka:   st => ({ o: susp({ hair: 'bald', brows: 'n', cloth: 'cardigan', mouth: 'flat', wrinkles: 2, wide: 11, eyeDy: 1, mouthDy: 1 }, st), p: Object.assign({}, SKIN.old, CLOTH.cardigan, { hair: '#77726a', hairHi: '#99948b', cloth: '#5a5a48', clothSh: '#44443a', clothHi: '#6a6a58' }) }),
    kiyo:     () => ({ o: { female: true, hair: 'curly', wide: 10.4, eyeDy: 1, wrinkles: 2, cloth: 'cardigan', brows: 'thin', mouth: 'flat', eyes: 1 }, p: Object.assign({}, SKIN.old, CLOTH.cardigan, { hair: '#c8c4bc', hairHi: '#e0dcd4', cloth: '#8a7a8a', clothSh: '#6a5a6a', clothHi: '#9a8a9a' }) }),
    prof:     () => ({ o: { hair: 'bald', glasses: true, cloth: 'suitBrown', tie: false, mouth: 'flat', wrinkles: 2, brows: 'thin', mustache: true, eyeGap: -1 }, p: Object.assign({}, SKIN.old, CLOTH.suitBrown, { hair: '#a8a49c', hairHi: '#c8c4bc' }) }),
    kasoken:  () => ({ o: { hair: 'shaggy', glasses: true, cloth: 'lab', mouth: 'tight', wide: 10.2, eyeDy: 1 }, p: Object.assign({}, SKIN.a, CLOTH.lab, { hair: '#231c18', hairHi: '#3a302a' }) }),
    clerk:    () => ({ o: { female: true, hair: 'bob', cloth: 'blouse', brows: 'thin', mouth: 'smile', wide: 10, eyeGap: -1 }, p: Object.assign({}, SKIN.b, CLOTH.blouse, { hair: '#3a2a20', hairHi: '#54402e', cloth: '#3a6a5a', clothSh: '#2a5040', clothHi: '#4a7a6a' }) }),
    kenji:    () => ({ o: { hair: 'slick', brows: 'thin', cloth: 'suitBrown', tie: true, mouth: 'tight', glasses: true, wrinkles: 1, wide: 10, jaw: 7.6, noseLong: 1 }, p: Object.assign({}, SKIN.a, CLOTH.suitBrown, { hair: '#1c1714', hairHi: '#332a24', tie: '#2a3a2a' }) })
  };
  // 被疑者は、勾留が長くなるほどやつれていく
  function susp(o, st) {
    st = st || 0;
    return Object.assign({}, o, { eyes: o.narrow ? 0 : [0, 1, 2, 3][st], stubble: Math.max(o.stubble || 0, [0, 0, 1, 2][st]), messy: [0, 0, 5, 10][st],
      brows: st === 3 ? 'sad' : o.brows, mouth: st === 3 ? 'frown' : o.mouth, gaunt: st === 3 });
  }
  const cache = {};
  function sprite(id, stage, v) {
    v = v || {};
    const key = id + ':' + (stage || 0) + ':' + (v.blink ? 1 : 0) + (v.mouth ? 1 : 0);
    if (cache[key]) return cache[key];
    const def = PEOPLE[id](stage || 0), grid = face(Object.assign({}, def.o, { blink: v.blink, mouthOpen: v.mouth })), pal = Object.assign({}, BASE, def.p);
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
    phone: x => {
      // 刑事部屋の机の上の電話（受話器を取っている）
      R(x, '#2c2a25', 0, 0, W, H); tex(x, 0, 0, W, 50, '#312e29', .2, 31); R(x, '#4a3a29', 0, 50, W, 55); R(x, '#5a4733', 0, 50, W, 2); tex(x, 0, 52, W, 53, '#3e3021', .15, 32);
      R(x, '#18191b', 70, 60, 70, 34); R(x, '#26282b', 72, 62, 66, 30); for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) R(x, '#d6d0c0', 100 + i * 9, 66 + j * 6, 6, 4);
      R(x, '#b23a2e', 76, 66, 6, 4); R(x, '#e05a4a', 77, 67, 4, 2);
      R(x, '#18191b', 150, 20, 14, 46); R(x, '#26282b', 152, 22, 10, 42); R(x, '#18191b', 146, 16, 22, 8); R(x, '#18191b', 146, 60, 22, 8);
      for (let i = 0; i < 40; i++) R(x, '#2a2a2a', 140 - i, 70 + Math.round(Math.sin(i / 4) * 3), 1, 1);
      R(x, '#e8e2cc', 20, 64, 40, 30); for (let j = 68; j < 90; j += 4) R(x, '#8a8270', 24, j, 30 - (j % 8), 1); R(x, '#333', 56, 60, 2, 20);
      R(x, '#d8c37a', 200, 30, 12, 4); R(x, '#555', 205, 34, 2, 16);
    }
  };

  // ---- 描き込みの追加 ----
  const more = (k, f) => { const o = BG[k]; BG[k] = x => { o(x); f(x); }; };
  more('office', x => {
    R(x, '#1d1c19', 104, 10, 28, 36); R(x, '#cdbf9a', 106, 12, 24, 32); R(x, '#a3342b', 106, 12, 24, 5); R(x, '#5a5040', 110, 20, 16, 12); R(x, '#5a5040', 109, 35, 18, 1); R(x, '#5a5040', 109, 38, 14, 1);
    R(x, '#f1ece0', 64, 6, 12, 12); R(x, '#222', 69, 8, 1, 5); R(x, '#222', 69, 12, 4, 1);
    R(x, '#3a3428', 232, 14, 3, 62); R(x, '#4a4a52', 226, 18, 12, 24); R(x, '#3a3a44', 228, 20, 8, 20);
    R(x, '#e8e4d8', 120, 68, 7, 8); R(x, '#8a5a3a', 121, 69, 5, 2); R(x, '#e8e4d8', 127, 70, 2, 3);
    for (let i = 0; i < 5; i++) R(x, ['#3d5a6a', '#6a3a2a', '#5a5a3a', '#3d5a6a', '#4a3a4a'][i], 56 + i * 5, 62, 4, 14);
    R(x, '#2a2420', 140, 86, 30, 19); R(x, '#3a3028', 142, 84, 26, 4);
    R(x, '#3e6a3a', 98, 64, 10, 8); R(x, '#5a3a24', 100, 72, 6, 4); R(x, '#4f7a46', 101, 60, 4, 5);
  });
  more('interro', x => {
    R(x, '#1b1a17', 70, 8, 30, 66); R(x, '#2b2924', 72, 10, 26, 62); R(x, '#141311', 78, 16, 14, 10); R(x, '#888', 94, 40, 3, 2);
    tex(x, 0, 60, 30, 14, '#2f2c26', .3, 21); R(x, '#36332c', 0, 72, W, 1);
    R(x, '#111', 4, 70, 26, 35); R(x, '#191816', 6, 66, 22, 8);
    R(x, '#c9bfa6', 150, 78, 8, 6); R(x, '#5a4f3f', 152, 80, 4, 1);
  });
  more('shop', x => {
    R(x, '#222', 60, 0, 1, 10); R(x, '#d8c37a', 55, 10, 11, 3); R(x, '#222', 180, 0, 1, 8); R(x, '#d8c37a', 175, 8, 11, 3);
    for (let i = 0; i < 6; i++) { R(x, '#e8e0c8', 8 + i * 40, 75, 10, 4); R(x, '#a3342b', 10 + i * 40, 76, 6, 1); }
    for (let k = 0; k < 3; k++) books(x, 10 + k * 18, 92 - k * 2, 14, 10 + k * 2, 90 + k);
    R(x, '#2a2a2a', 150, 64, 14, 8); R(x, '#4a4a4a', 151, 62, 12, 3); R(x, '#8a8a7a', 153, 65, 8, 2);
  });
  more('street', x => {
    R(x, '#3a3a3a', 120, 4, 2, 60); R(x, '#2a2a2a', 0, 12, W, 1); R(x, '#2a2a2a', 0, 15, W, 1);
    R(x, '#2a3c4a', 196, 66, 20, 26); R(x, '#a8d0e0', 198, 68, 16, 12); R(x, '#d8e8f0', 199, 70, 14, 2); for (let i = 0; i < 4; i++) R(x, ['#c33', '#3a6', '#36c', '#cc3'][i], 199 + i * 4, 82, 3, 4);
    x.fillStyle = 'rgba(168,208,224,.06)'; x.fillRect(176, 60, 60, 40);
    R(x, '#26282c', 70, 96, 18, 3); R(x, '#303236', 72, 97, 14, 1);
  });
  more('home', x => {
    R(x, '#f0ecdc', 190, 28, 10, 12); for (let i = 0; i < 4; i++) R(x, ['#e06a5a', '#5aa0e0', '#e0c05a', '#6ac06a'][i], 191 + (i % 2) * 4, 30 + Math.floor(i / 2) * 5, 3, 3);
    R(x, '#222', 60, 30, 40, 26); R(x, '#2c3e4a', 62, 32, 36, 22); x.fillStyle = 'rgba(120,180,220,.08)'; x.fillRect(56, 56, 52, 20);
    R(x, '#ddd5c5', 150, 60, 14, 10); R(x, '#888', 153, 58, 8, 2);
    R(x, '#7a6a5a', 0, 40, 18, 28); R(x, '#5a4a3a', 2, 42, 14, 24);
  });
  more('pros', x => {
    R(x, '#ddd6c2', 70, 14, 30, 22); R(x, '#a3342b', 82, 18, 6, 6); for (let j = 27; j < 34; j += 2) R(x, '#666', 74, j, 22, 1);
    R(x, '#555', 200, 60, 2, 16); R(x, '#d8c37a', 194, 56, 14, 4);
    R(x, '#4a463c', 4, 52, 40, 24); for (let j = 54; j < 74; j += 6) { R(x, '#3a362e', 6, j, 36, 5); for (let i = 8; i < 40; i += 4) R(x, '#d9cfb4', i, j + 1, 3, 3); }
  });
  more('court', x => {
    for (let j = 0; j < 3; j++) R(x, '#3a2e22', 0, 92 + j * 5, 90, 3);
    for (let j = 0; j < 3; j++) R(x, '#3a2e22', 150, 92 + j * 5, 90, 3);
    R(x, '#222', 60, 40, 1, 6); R(x, '#222', 120, 40, 1, 6); R(x, '#222', 180, 40, 1, 6);
    R(x, '#4f3d2a', 70, 66, 100, 10); R(x, '#d9cfb4', 80, 63, 20, 3); R(x, '#d9cfb4', 140, 63, 16, 3);
  });
  const bgCache = {};
  function bgCanvas(k) {
    if (bgCache[k]) return bgCache[k];
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    (BG[k] || BG.dark)(x); bgCache[k] = c; return c;
  }
  const A = { cv: null, sc: null, t0: performance.now(), blinkUntil: 0, nextBlink: 0, mouth: false, lastMouth: 0, timer: null };
  function draw() {
    const cv = A.cv, sc = A.sc; if (!cv || !sc || !cv.isConnected) return;
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    x.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    x.drawImage(bgCanvas(sc.bg), 0, 0);
    if (sc.who && PEOPLE[sc.who]) {
      const now = performance.now();
      if (now > A.nextBlink) { A.blinkUntil = now + 130; A.nextBlink = now + 2400 + Math.random() * 3200; }
      const speaking = G.anim && G.anim.speaking === sc.who;
      if (speaking && now - A.lastMouth > 110) { A.mouth = !A.mouth; A.lastMouth = now; } if (!speaking) A.mouth = false;
      const breath = Math.sin((now - A.t0) / 1700 * Math.PI * 2) > .35 ? 1 : 0;
      const s = sprite(sc.who, sc.stage, { blink: now < A.blinkUntil, mouth: A.mouth });
      const px = sc.x === 'l' ? 40 : sc.x === 'r' ? 136 : 88;
      x.drawImage(s, px, H - N + breath);
    }
    if (sc.dim) { x.fillStyle = 'rgba(0,0,0,' + sc.dim + ')'; x.fillRect(0, 0, W, H); }
    x.setTransform(1, 0, 0, 1, 0, 0);
  }
  function scene(cv, sc) {
    if (!A.sc || A.sc.who !== sc.who) { A.nextBlink = performance.now() + 1500 + Math.random() * 2000; A.blinkUntil = 0; }
    A.cv = cv; A.sc = sc; draw();
    if (!A.timer) A.timer = setInterval(draw, 60);
  }
  G.portraits = { scene, sprite, PEOPLE, face };
})();
