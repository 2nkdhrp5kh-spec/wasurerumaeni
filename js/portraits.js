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
    const NH = o.tall ? 88 : N;   // 立っている人は、胴を長く（腰のあたりまで）
    const g = Array.from({ length: NH }, () => Array(N).fill(null));
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < NH) g[y][x] = c; };
    const at = (x, y) => (x >= 0 && y >= 0 && x < N && y < NH) ? g[y][x] : null;
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
      return y > 54 ? SH + Math.min(y - 54, 10) * .25 - Math.max(0, y - 70) * .12 : h;
    };
    for (let y = 46; y < NH; y++) { const h = bodyHalf(y); for (let x = 0; x < N; x++) if (Math.abs(x - cx) <= h) put(x, y, 'cloth'); }
    // 光は左上から：右側を暗く、肩の上を明るく
    for (let y = 46; y < NH; y++) for (let x = 0; x < N; x++) if (at(x, y) === 'cloth') {
      if (x > cx + SH * .55) put(x, y, 'clothSh');
      else if (y <= 52 && x < cx - 6 && at(x, y - 1) == null) put(x, y + 1, 'clothHi');
    }
    // 腕と胴の境（袖の付け根の線）
    for (let y = 55; y < NH; y++) { const k = (y - 55) * .15; put(Math.round(cx - SH + 4 + k), y, 'clothSh'); put(Math.round(cx + SH - 4 - k), y, 'clothSh'); }
    for (let x = 4; x < 26; x++) for (let y = 54; y < NH; y++) if (at(x, y) === 'cloth' && hash(x, y, 3) < .12) put(x, y, 'clothHi');
    // 首
    for (let y = 39; y <= 51; y++) for (let x = fem ? 27 : 26; x <= (fem ? 36 : 37); x++) put(x, y, x > 34 ? 'shade' : 'skin');
    for (let x = 26; x <= 37; x++) { if (at(x, 42)) put(x, 42, 'deep'); if (at(x, 43)) put(x, 43, 'shade'); if (at(x, 44) && x > 31) put(x, 44, 'shade'); }
    // 服の形
    if (o.cloth === 'suit' || o.cloth === 'suitBrown' || o.cloth === 'navy') {
      for (let y = 49; y < N; y++) { const w = Math.max(0, 8 - (y - 49) * .5); for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) put(x, y, 'shirt'); put(Math.round(cx - w) - 1, y, 'clothSh'); put(Math.round(cx + w) + 1, y, 'clothSh'); }
      if (o.tie) for (let y = 50; y < Math.min(NH, 76); y++) { put(31, y, 'tie'); put(32, y, 'tie'); if (y > 53) { put(30, y, 'tie'); put(33, y, 'tie'); } if (y === 51) { put(30, y, 'tie'); put(33, y, 'tie'); } }
    } else if (o.cloth === 'cardigan' || o.cloth === 'blouse') {
      for (let x = 23; x <= 40; x++) { put(x, 49, 'shirt'); if (Math.abs(x - cx) < 6) put(x, 50, 'shirt'); if (Math.abs(x - cx) < 3) put(x, 51, 'shirt'); }
      if (o.cloth === 'cardigan') for (let y = 53; y < NH; y += 3) put(32, y, 'clothSh');
    } else {
      for (let x = 21; x <= 42; x++) { const d = Math.abs(x - cx); if (d < 10) put(x, Math.round(50 + (10 - d) * .35), 'clothSh'); }
      if (o.cloth === 'jacket') for (let y = 52; y < NH; y++) { put(Math.round(cx - 3 - (y - 52) * .6), y, 'clothSh'); put(Math.round(cx + 3 + (y - 52) * .6), y, 'clothSh'); }
    }

    if (o.tall) {
      const suit = ['suit', 'suitBrown', 'navy'].includes(o.cloth);
      if (suit) { for (let y = 64; y < NH; y++) put(Math.round(cx) + (y > 76 ? 1 : 0), y, 'clothSh'); [68, 76].forEach(y => { put(Math.round(cx) - 2, y, 'clothHi'); put(Math.round(cx) - 2, y + 1, 'clothSh'); }); }
      if (o.tie) { put(31, 76, 'tie'); put(32, 76, 'tie'); put(31, 77, 'tie'); put(32, 77, 'tie'); }
      // 腕：胴の脇で、少し暗く。袖口の線
      for (let y = 60; y < NH; y++) { const xl = Math.round(cx - bodyHalf(y)), xr = Math.round(cx + bodyHalf(y)); for (let k = 0; k < 4; k++) { if (at(xl + k, y)) put(xl + k, y, k < 1 ? 'clothHi' : 'cloth'); if (at(xr - k, y)) put(xr - k, y, 'clothSh'); } }
      for (let x = 0; x < N; x++) { const y = 84; const xl = cx - bodyHalf(y), xr = cx + bodyHalf(y); if ((x > xl && x < xl + 5) || (x < xr && x > xr - 5)) { put(x, y, 'clothSh'); put(x, y + 1, 'skin'); put(x, y + 2, 'skin'); put(x, y + 3, 'shade'); } }
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
    // 口を開けたとき：上の歯は口の幅いっぱいに、薄く暗めに（真ん中だけ白い歯が出ると、齧歯類のように見える）
    if (o.mouthOpen) {
      for (let x = 28; x <= 35; x++) put(x, 38 + md, 'lip');
      for (let x = 28; x <= 35; x++) put(x, 39 + md, x === 28 || x === 35 ? 'mouthIn' : 'teeth');
      for (let x = 29; x <= 34; x++) put(x, 40 + md, 'mouthIn');
      for (let x = 30; x <= 33; x++) put(x, 41 + md, 'lipLo');
    }
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
    for (let y = 0; y < NH; y++) for (let x = 0; x < N; x++) {
      if (!g[y][x]) continue;
      if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1)) out.push([x, y]);
    }
    out.forEach(([x, y]) => { const c = at(x, y) || ''; if (c.startsWith('cloth') || c === 'shirt' || c === 'tie') put(x, y, 'clothSh'); else put(x, y, 'line'); });
    return g;
  }

  // ---- 人物の設定 ----
  const BASE = { mouthIn: '#3a1f1a', teeth: '#a89c8a', glint: '#f2ede2', line: '#1c1511', white: '#dcd4c4', iris: '#3b2a20', pupil: '#140f0c', lip: '#9a6352', lipLo: '#b27a66', bag: '#a98069', stub: '#8f7b69', frame: '#2a2622', shirt: '#d8d4c8', tie: '#6b2a26', brow: '#5a5550' };
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
    const key = id + ':' + (stage || 0) + ':' + (v.blink ? 1 : 0) + (v.mouth ? 1 : 0) + (v.tall ? 't' : '');
    if (cache[key]) return cache[key];
    const def = PEOPLE[id](stage || 0), grid = face(Object.assign({}, def.o, { blink: v.blink, mouthOpen: v.mouth, tall: v.tall })), pal = Object.assign({}, BASE, def.p);
    const c = document.createElement('canvas'); c.width = N; c.height = grid.length; const x = c.getContext('2d');
    for (let yy = 0; yy < grid.length; yy++) for (let xx = 0; xx < N; xx++) { const k = grid[yy][xx]; if (!k) continue; x.fillStyle = pal[k] || '#f0f'; x.fillRect(xx, yy, 1, 1); }
    c._key = key; cache[key] = c; return c;
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
  // ---- 一人称の手前の層（自分の机・手・持ち物）。人物はこの層の奥に描く ----
  // 自分の手は描かない（一人称で手が見えるのは不自然なため）。呼び出しは残し、何も描かない
  function hand() { }
  function handOld(x, X, Y, w, sleeve, right) {
    // 机に置いた手（甲を上に、指を軽く曲げる）。袖口は画面の下へ続く。光は左上から
    const H2 = 10, line = '#1c1511';
    R(x, line, X - 2, Y + H2 - 1, w + 6, H - Y); R(x, sleeve, X - 1, Y + H2, w + 4, H - Y); R(x, 'rgba(255,255,255,.08)', X, Y + H2, 2, H - Y); R(x, 'rgba(0,0,0,.3)', X + w, Y + H2, 3, H - Y);
    R(x, line, X, Y - 1, w, 1); R(x, line, X - 1, Y, 1, H2); R(x, line, X + w, Y, 1, H2);
    R(x, '#c99f7b', X, Y, w, H2); R(x, '#dcb592', X + 1, Y + 1, w - 4, 3); R(x, '#a67d5e', X, Y + H2 - 3, w, 3);
    for (let k = 0; k < 4; k++) { const fx = X + 1 + Math.round(k * (w - 3) / 4); R(x, '#86624b', fx, Y - 0, 1, 4); R(x, '#e2c0a0', fx + 1, Y, 1, 1); }
    const tx = right ? X - 4 : X + w; R(x, line, tx - (right ? 1 : 0), Y + 3, 5, 6); R(x, '#c99f7b', tx + (right ? 0 : 0), Y + 4, 4, 4); R(x, '#a67d5e', tx, Y + 7, 4, 1);
  }
  function deskTop(x, y0, c1, c2, edge) {
    // 手前ほど広く見える机の天板
    R(x, c1, 0, y0, W, H - y0); tex(x, 0, y0 + 2, W, H - y0, c2, .18, y0 + 50);
    R(x, edge, 0, y0, W, 1); R(x, 'rgba(255,255,255,.06)', 0, y0 + 1, W, 1);
    for (let i = 0; i < W; i += 37) R(x, 'rgba(0,0,0,.08)', i + Math.floor(hash(i, y0, 3) * 20), y0 + 4, 1, H - y0);
  }
  function sheet(x, X, Y, w, h, lines) {
    R(x, 'rgba(0,0,0,.35)', X + 2, Y + 2, w, h); R(x, '#e4dbc2', X, Y, w, h); R(x, '#cfc5aa', X, Y + h - 1, w, 1);
    for (let j = Y + 3; j < Y + h - 2; j += 3) R(x, '#9a917c', X + 3, j, Math.max(2, w - 6 - (lines && j % 6 ? 6 : 0)), 1);
  }
  const SLEEVE = '#2f3a4e';
  const FG = {
    interro: x => {
      deskTop(x, 80, '#3b3227', '#2f281f', '#1c1712');
      sheet(x, 84, 86, 52, 22, true); R(x, '#b23a2e', 124, 88, 8, 2);           // 調書
      R(x, '#151515', 140, 92, 22, 1); R(x, '#2a2a2a', 140, 93, 22, 1); R(x, '#c9b46a', 160, 92, 3, 2); // ペン
      R(x, '#e8e4d8', 176, 81, 8, 6); R(x, '#8a7a5a', 177, 82, 6, 1);           // 向こう側の湯のみ
      hand(x, 44, 90, 22, SLEEVE, false); hand(x, 172, 92, 22, SLEEVE, true);
    },
    office: x => {
      deskTop(x, 86, '#4a3a29', '#3e3021', '#2b2118');
      for (let k = 0; k < 4; k++) sheet(x, 14 + k, 90 - k * 2, 46, 16, false);   // 書類の山
      R(x, '#151515', 196, 90, 26, 12); R(x, '#26282b', 198, 92, 22, 8); R(x, '#151515', 192, 88, 34, 4); // 電話
      R(x, '#e8e4d8', 160, 90, 9, 10); R(x, '#8a5a3a', 161, 91, 7, 2); R(x, '#e8e4d8', 169, 93, 3, 4); // 湯のみ
      hand(x, 100, 94, 20, SLEEVE, false);
    },
    pros: x => {
      deskTop(x, 82, '#3e3022', '#33281c', '#211a12');
      sheet(x, 70, 84, 60, 10, false); sheet(x, 74, 80, 52, 6, false); R(x, '#b23a2e', 76, 81, 8, 2); // 一件記録
      R(x, '#2a2a2a', 170, 86, 20, 6); R(x, '#4a4a4a', 172, 84, 16, 3);         // 卓上の名札
      hand(x, 28, 94, 20, SLEEVE, false);
    },
    shop: x => {
      deskTop(x, 86, '#5a4733', '#4a3a29', '#2b2118');
      R(x, '#2a2a2a', 178, 80, 36, 18); R(x, '#3a3a3a', 180, 82, 32, 14);        // 自分の手帳（開いている）
      R(x, '#e4dbc2', 182, 83, 13, 12); R(x, '#e4dbc2', 197, 83, 13, 12); for (let j = 86; j < 94; j += 2) { R(x, '#8a8270', 184, j, 9, 1); R(x, '#8a8270', 199, j, 7, 1); }
      hand(x, 152, 90, 18, SLEEVE, false);
    },
    street: x => {
      // 手に持った手帳とペン
      R(x, '#1c1511', 177, 75, 46, 26); R(x, '#2a2a2a', 178, 76, 44, 24);
      R(x, '#e4dbc2', 181, 78, 18, 20); R(x, '#e4dbc2', 201, 78, 18, 20); for (let j = 81; j < 96; j += 3) { R(x, '#8a8270', 183, j, 13, 1); R(x, '#8a8270', 203, j, 10, 1); }
      hand(x, 156, 90, 18, SLEEVE, false); R(x, '#151515', 214, 70, 2, 16); R(x, '#c9b46a', 214, 70, 2, 2);
    },
    home: x => {
      deskTop(x, 88, '#5a4430', '#4a3826', '#2e2216');
      R(x, '#1c1511', 104, 89, 22, 12); R(x, '#e8e0d0', 105, 89, 20, 10); R(x, '#f4f0e4', 107, 89, 16, 3);   // 茶碗
      R(x, '#7a4a2a', 130, 96, 26, 1); R(x, '#7a4a2a', 130, 98, 26, 1);           // 箸
      R(x, '#3a5a6a', 60, 92, 24, 8); R(x, '#4a6a7a', 61, 93, 22, 2);            // 皿
    },
    court: x => {
      // 傍聴席の柵越しに見る
      R(x, '#3f3123', 0, 86, W, 4); R(x, '#5a4630', 0, 86, W, 1); R(x, '#2a2016', 0, 89, W, 1);
      for (let i = 6; i < W; i += 14) { R(x, '#3a2e22', i, 90, 3, 15); R(x, '#4a3a29', i, 90, 1, 15); }
    },
    chambers: x => {
      deskTop(x, 80, '#3a2f24', '#2f261d', '#1a140e');
      x.fillStyle = 'rgba(232,210,140,.10)'; x.beginPath(); x.moveTo(150, 80); x.lineTo(230, 80); x.lineTo(240, 105); x.lineTo(120, 105); x.fill();
      for (let k = 0; k < 6; k++) sheet(x, 20 + (k % 2), 96 - k * 3, 54, 12, false);   // 請求書の山
      sheet(x, 92, 84, 60, 20, true);                                                  // 読んでいる請求書
      R(x, '#7a1e1a', 168, 92, 14, 8); R(x, '#a3342b', 169, 93, 12, 3);                // 朱肉
      R(x, '#2a2420', 188, 86, 5, 14); R(x, '#c9b46a', 188, 86, 5, 2);                 // 職印
      hand(x, 70, 92, 20, '#2a2622', false);
    }
  };
  // ---- 令状当番の部屋（夜） ----
  BG.chambers = x => {
    R(x, '#1f1c18', 0, 0, W, H); tex(x, 0, 0, W, 80, '#24211c', .18, 41);
    R(x, '#0c0e14', 160, 10, 64, 46); R(x, '#141826', 162, 12, 60, 42); R(x, '#2a2e36', 191, 10, 2, 46);
    for (let i = 0; i < 18; i++) R(x, hash(i, 1, 42) < .5 ? '#c9b46a' : '#6a7a9a', 164 + Math.floor(hash(i, 2, 42) * 56), 34 + Math.floor(hash(i, 3, 42) * 18), 1, 1);
    R(x, '#3a3224', 8, 6, 70, 74); for (let j = 0; j < 4; j++) { R(x, '#2a2218', 8, 6 + j * 18 + 16, 70, 2); books(x, 10, 6 + j * 18, 66, 16, 60 + j); }
    R(x, '#f1ece0', 100, 8, 12, 12); R(x, '#222', 105, 10, 1, 5); R(x, '#222', 105, 14, 4, 1);
    R(x, '#555', 212, 58, 2, 22); R(x, '#d8c37a', 204, 54, 18, 5); x.fillStyle = 'rgba(232,210,140,.06)'; x.fillRect(150, 59, 90, 21);
  };
  // ---- 遠近法：消失点を相手の目の高さに置いた一点透視で描き直す ----
  // 凸多角形を走査線で塗る（ドットがにじまないよう、整数の矩形で塗る）
  function poly(x, c, pts) {
    const ys = pts.map(p => p[1]), y0 = Math.max(0, Math.ceil(Math.min(...ys))), y1 = Math.min(H - 1, Math.floor(Math.max(...ys)));
    x.fillStyle = c;
    for (let y = y0; y <= y1; y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= y + .5 && by > y + .5) || (by <= y + .5 && ay > y + .5)) xs.push(ax + (y + .5 - ay) * (bx - ax) / (by - ay));
      }
      if (xs.length >= 2) { const l = Math.round(Math.min(...xs)), r = Math.round(Math.max(...xs)); if (r > l) x.fillRect(l, y, r - l, 1); }
    }
  }
  function ln(x, c, x0, y0, x1, y1) {
    x.fillStyle = c; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let i = 0; i <= n; i++) x.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
  }
  // 奥の壁 [l,t,r,b] と、四方へ広がる天井・側壁・床
  function room(x, o) {
    const [l, t, r, b] = o.back;
    poly(x, o.ceil, [[0, 0], [W, 0], [r, t], [l, t]]);
    poly(x, o.side, [[0, 0], [l, t], [l, b], [0, H]]);
    poly(x, o.sideR || o.side, [[W, 0], [W, H], [r, b], [r, t]]);
    poly(x, o.floor, [[0, H], [l, b], [r, b], [W, H]]);
    R(x, o.wall, l, t, r - l, b - t); tex(x, l, t, r - l, b - t, o.wallTex || o.wall, .2, l + t);
    const e = o.edge || 'rgba(0,0,0,.35)';
    ln(x, e, 0, 0, l, t); ln(x, e, W - 1, 0, r, t); ln(x, e, 0, H - 1, l, b); ln(x, e, W - 1, H - 1, r, b);
    R(x, e, l, t, r - l, 1); R(x, e, l, b, r - l, 1); R(x, e, l, t, 1, b - t); R(x, e, r - 1, t, 1, b - t);
    // 巾木（床と壁の境）
    R(x, 'rgba(0,0,0,.25)', l, b - 2, r - l, 2);
  }
  // 側壁の上に、奥へ縮む四角を置く（窓・棚など）。u0,u1 は壁の手前(0)〜奥(1)、v0,v1 は上(0)〜下(1)
  function onSide(o, right, u0, u1, v0, v1) {
    const [l, t, r, b] = o.back, ex = right ? W : 0, bx = right ? r : l;
    const P = (u, v) => { const X = ex + (bx - ex) * u, top = 0 + (t - 0) * u, bot = H + (b - H) * u; return [X, top + (bot - top) * v]; };
    return [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  }
  // 手前の机：奥の縁 y0（x l〜r）から、画面の下へ向かって広がる台形
  function deskP(x, y0, l, r, top, grain, edge, lip) {
    poly(x, top, [[l, y0], [r, y0], [r + (r - l) * 1.2, H + 40], [l - (r - l) * 1.2, H + 40]]);
    for (let k = 0; k < 9; k++) { const u = (k + .5) / 9, gx = l + (r - l) * u; ln(x, grain, gx, y0 + 2, gx + (gx - 120) * 1.5, H); }
    R(x, edge, l, y0, r - l, 1); if (lip) R(x, lip, l, y0 + 1, r - l, 1);
  }
  // 手前の紙（奥ほど狭い）
  function sheetP(x, X, Y, w, h, lines, c) {
    const k = .18, a = [[X + w * k * .5, Y], [X + w - w * k * .5, Y], [X + w, Y + h], [X, Y + h]];
    poly(x, 'rgba(0,0,0,.35)', a.map(([p, q]) => [p + 2, q + 2])); poly(x, c || '#e4dbc2', a);
    if (lines) for (let j = Y + 3; j < Y + h - 2; j += 3) { const f = (j - Y) / h, ins = w * k * .5 * (1 - f) + 3; R(x, '#9a917c', Math.round(X + ins), j, Math.round(w - ins * 2 - (j % 6 ? 5 : 0)), 1); }
  }
  // 手前から伸びる前腕と手（近いので大きい）
  const HANDS = {};
  let fgBuilding = null;
  function armP() { }
  function armPOld(x, X, Y, w, sleeve, right) {
    if (fgBuilding) (HANDS[fgBuilding] = HANDS[fgBuilding] || []).push([X, Y, w, right]);
    const line = '#1c1511', dir = right ? 1 : -1;
    poly(x, line, [[X - 2, Y + 8], [X + w + 2, Y + 8], [X + w + 10 + dir * 14, H + 2], [X - 10 + dir * 14, H + 2]]);
    poly(x, sleeve, [[X - 1, Y + 9], [X + w + 1, Y + 9], [X + w + 9 + dir * 14, H + 2], [X - 9 + dir * 14, H + 2]]);
    poly(x, 'rgba(255,255,255,.07)', [[X - 1, Y + 9], [X + 3, Y + 9], [X - 5 + dir * 14, H + 2], [X - 9 + dir * 14, H + 2]]);
    R(x, line, X, Y - 1, w, 1); R(x, line, X - 1, Y, 1, 10); R(x, line, X + w, Y, 1, 10);
    R(x, '#c99f7b', X, Y, w, 10); R(x, '#dcb592', X + 1, Y + 1, w - 4, 3); R(x, '#a67d5e', X, Y + 7, w, 3);
    for (let k = 0; k < 4; k++) { const fx = X + 2 + Math.round(k * (w - 4) / 4); R(x, '#86624b', fx, Y, 1, 5); }
    const tx = right ? X - 5 : X + w; R(x, line, tx, Y + 3, 6, 7); R(x, '#c99f7b', tx + (right ? 1 : 0), Y + 4, 5, 5); R(x, '#a67d5e', tx, Y + 8, 5, 1);
  }
  const lightCone = (x, cx0, y0, w0, y1, w1, a) => { poly(x, 'rgba(216,195,122,' + a + ')', [[cx0 - w0, y0], [cx0 + w0, y0], [cx0 + w1, y1], [cx0 - w1, y1]]); };

  // 取調室：目の高さ y≈49。狭い部屋、奥にドア、右の壁にマジックミラー
  const RI = { back: [62, 20, 178, 74], ceil: '#1e1c18', side: '#26241f', sideR: '#211f1b', floor: '#1b1916', wall: '#2b2923', wallTex: '#302d27' };
  BG.interro = x => {
    room(x, RI);
    R(x, '#1b1a17', 76, 36, 20, 38); R(x, '#2b2924', 77, 37, 18, 37); R(x, '#141311', 80, 41, 12, 7); R(x, '#888', 92, 56, 2, 1);   // ドア
    R(x, '#151412', 146, 28, 10, 10); R(x, '#d6d0c0', 147, 29, 8, 8); R(x, '#222', 151, 30, 1, 4); R(x, '#222', 151, 33, 3, 1);       // 時計
    const mm = onSide(RI, true, .1, .75, .22, .55); poly(x, '#111', mm); poly(x, '#1d2224', mm.map(([p, q], i) => [p + (i % 3 ? -1 : 1), q + (i < 2 ? 1 : -1)]));  // マジックミラー
    poly(x, '#3a3a3a', [[104, 8], [136, 8], [138, 11], [102, 11]]); poly(x, '#d8c37a', [[106, 9], [134, 9], [135, 10], [105, 10]]);   // 天井灯
    lightCone(x, 120, 11, 16, 80, 64, .05);
    R(x, '#111', 24, 60, 22, 45); R(x, '#191816', 26, 56, 18, 8);   // 手前の椅子の影
  };
  // ---- 簡単な3次元の投影：消失点 (VX, VY)。床からの高さ Yh、横位置 X、奥行き z ----
  // 目の高さ＝1。z=1 で画面の下端あたり。奥の壁は z=ZB。
  const VX = 120, VY = 46;
  const P3 = (X, Yh, z) => [VX + X * 64 / z, VY + 62 * (1 - Yh) / z];
  // 箱（机・棚など）：手前の面と上の面と、消失点側の側面を塗る
  function box3(x, X0, X1, z0, z1, h, cTop, cFront, cSide, cEdge) {
    const ft = [P3(X0, h, z0), P3(X1, h, z0), P3(X1, 0, z0), P3(X0, 0, z0)];
    const top = [P3(X0, h, z1), P3(X1, h, z1), P3(X1, h, z0), P3(X0, h, z0)];
    // 側面：消失点に近い側（中央寄り）の面が見える
    const sideX = (X0 + X1) / 2 < 0 ? X1 : X0;
    const sd = [P3(sideX, h, z0), P3(sideX, h, z1), P3(sideX, 0, z1), P3(sideX, 0, z0)];
    if (h < 1) poly(x, cTop, top);
    poly(x, cSide, sd); poly(x, cFront, ft);
    if (cEdge) { const [a, b] = [P3(X0, h, z0), P3(X1, h, z0)]; R(x, cEdge, Math.round(a[0]), Math.round(a[1]), Math.max(1, Math.round(b[0] - a[0])), 1); }
  }
  // 座っている人の影（頭と肩）。z が奥ほど小さい
  function sitter(x, X, z, col, hair) {
    const [cx0, cy0] = P3(X, .72, z), s = 30 / z;
    const hw = Math.max(2, Math.round(s * .16)), hh = Math.max(2, Math.round(s * .2)), sw = Math.max(4, Math.round(s * .5)), sh = Math.max(3, Math.round(s * .3));
    R(x, col, Math.round(cx0 - sw / 2), Math.round(cy0 - sh), sw, sh);
    R(x, col, Math.round(cx0 - hw / 2), Math.round(cy0 - sh - hh), hw, hh);
    R(x, hair || '#16130f', Math.round(cx0 - hw / 2), Math.round(cy0 - sh - hh), hw, Math.max(1, Math.round(hh / 3)));
  }
  // 刑事部屋：手前から奥へ、通路の両側に机の島が並ぶ。左の壁に窓、奥にホワイトボードと課長席
  const ZB = 5.2;
  const RO = { back: [Math.round(P3(-2.6, 0, ZB)[0]), Math.round(P3(0, 1.9, ZB)[1]), Math.round(P3(2.6, 0, ZB)[0]), Math.round(P3(0, 0, ZB)[1])], ceil: '#2a2823', side: '#302e28', sideR: '#2b2924', floor: '#24221d', wall: '#2e2c26', wallTex: '#33302a' };
  BG.office = x => {
    room(x, RO);
    // 床：通路のリノリウムの継ぎ目
    for (let k = 1; k < 9; k++) { const z = 1 + k * .5; const [a, y] = P3(-2.6, 0, z), [b] = P3(2.6, 0, z); R(x, 'rgba(0,0,0,.12)', Math.round(a), Math.round(y), Math.round(b - a), 1); }
    ln(x, 'rgba(255,255,255,.05)', ...P3(-.45, 0, 1), ...P3(-.45, 0, ZB)); ln(x, 'rgba(255,255,255,.05)', ...P3(.45, 0, 1), ...P3(.45, 0, ZB));
    // 天井の蛍光灯（奥へ並ぶ）
    for (let k = 0; k < 4; k++) { const z = 1.4 + k * 1.1; [-1.2, 1.2].forEach(X => { const a = P3(X - .35, 1.9, z), b = P3(X + .35, 1.9, z), c = P3(X + .35, 1.9, z + .25), d = P3(X - .35, 1.9, z + .25); poly(x, '#d8d4c0', [c, d, a, b]); }); }
    // 左の壁：窓とブラインド（奥へ縮む）
    for (let w = 0; w < 2; w++) { const u0 = .12 + w * .42, u1 = u0 + .32; poly(x, '#1b1f22', onSide(RO, false, u0, u1, .22, .58)); for (let k = 0; k < 10; k++) { const v = .235 + k * .034; poly(x, '#62707a', onSide(RO, false, u0 + .01, u1 - .01, v, v + .018)); } }
    // 右の壁：書類棚とロッカー
    for (let k = 0; k < 3; k++) { const u0 = .15 + k * .26; poly(x, '#4a463c', onSide(RO, true, u0, u0 + .22, .42, .98)); for (let j = 0; j < 4; j++) poly(x, '#3a362e', onSide(RO, true, u0 + .02, u0 + .2, .46 + j * .13, .55 + j * .13)); }
    // 奥の壁：ホワイトボード、ポスター、時計、課長席
    const [l, t, r, b] = RO.back;
    R(x, '#1d1c19', l + 17, t + 3, 28, 13); R(x, '#d6d3c8', l + 18, t + 4, 26, 11); R(x, '#c9bfa6', l + 20, t + 6, 4, 5); R(x, '#c9bfa6', l + 26, t + 6, 4, 5); R(x, '#b23a2e', l + 20, t + 12, 16, 1); R(x, '#3a4a6a', l + 33, t + 6, 9, 1); R(x, '#3a4a6a', l + 33, t + 8, 7, 1);
    R(x, '#1d1c19', l + 6, t + 5, 9, 12); R(x, '#cdbf9a', l + 7, t + 6, 7, 10); R(x, '#a3342b', l + 7, t + 6, 7, 2);   // ポスター「検挙に勝る防犯なし」
    R(x, '#3a3428', r - 17, t + 3, 13, 6); R(x, '#c9b46a', r - 16, t + 4, 11, 4);                                    // 額（署長賞）
    box3(x, -.7, .7, ZB - .55, ZB - .1, .42, '#4a3a2a', '#3a2d20', '#2e241a', '#5a4733');                                    // 課長席の机
    R(x, '#151515', ...P3(.2, .42, ZB - .4).map(Math.round), 3, 2);
    // 机の島：左右に3つずつ。机の上にモニタ、書類。座っている同僚も
    const desk = (X0, X1, z0, z1) => {
      box3(x, X0, X1, z0, z1, .42, '#5a4733', '#3e3123', '#33281c', '#6a5640');
      const mid = (X0 + X1) / 2, zc = (z0 + z1) / 2;
      // モニタ（背面）
      const m0 = P3(mid - .18, .78, zc), m1 = P3(mid + .18, .5, zc);
      R(x, '#1a1b1d', Math.round(m0[0]), Math.round(m0[1]), Math.max(2, Math.round(m1[0] - m0[0])), Math.max(2, Math.round(m1[1] - m0[1])));
      // 書類の山
      const s0 = P3(X0 + .08, .5, z0 + .05), s1 = P3(X0 + .3, .42, z0 + .05);
      R(x, '#d9cfb4', Math.round(s0[0]), Math.round(s0[1]), Math.max(2, Math.round(s1[0] - s0[0])), Math.max(1, Math.round(s1[1] - s0[1])));
    };
    // 奥から手前へ描く（手前の机が奥の机を隠す）
    const who = { 2: [[-1.6, '#2a2f3a', '#111']], 1: [[1.3, '#3a3328', '#1a1410']], 0: [] };
    [[3.5, 4.1], [2.5, 3.1], [1.5, 2.1]].forEach(([z0, z1], i) => {
      const k = 2 - i;
      (who[k] || []).forEach(([X, c, h]) => sitter(x, X, z1 + .25, c, h));   // 机の向こう側に座る
      desk(-2.2, -.65, z0, z1); desk(.65, 2.2, z0, z1);
      [[-.62, -.45], [.45, .62]].forEach(([a, c]) => box3(x, a, c, z0 + .15, z0 + .45, .3, '#1e1e22', '#18181b', '#141416'));   // 椅子（通路側）
    });
  };
  // 古書店：両側の壁と奥の壁が本棚。奥に帳場、天井から裸電球
  const RS = { back: [Math.round(P3(-1.9, 0, 4.6)[0]), Math.round(P3(0, 2.1, 4.6)[1]), Math.round(P3(1.9, 0, 4.6)[0]), Math.round(P3(0, 0, 4.6)[1])], ceil: '#221c15', side: '#2b231a', sideR: '#281f17', floor: '#2e2519', wall: '#2b241c', wallTex: '#31291f' };
  BG.shop = x => {
    room(x, RS);
    for (let k = 1; k < 8; k++) { const z = 1 + k * .5, [a0, y] = P3(-1.9, 0, z), [b0] = P3(1.9, 0, z); R(x, 'rgba(0,0,0,.14)', Math.round(a0), Math.round(y), Math.round(b0 - a0), 1); }   // 床板
    // 側壁の本棚：段ごとに、奥へ縮む本の背
    const cols = ['#6a3a2a', '#3a4a5a', '#5a5a3a', '#4a3a4a', '#7a6a4a', '#2f4a3a', '#5a2f2f', '#8a7a5a'];
    [false, true].forEach(right => {
      poly(x, '#3a2e22', onSide(RS, right, .02, .98, .08, .86));
      for (let j = 0; j < 5; j++) {
        const v0 = .1 + j * .155;
        for (let k = 0; k < 26; k++) { const u = .03 + k * .036; poly(x, cols[(k * 7 + j * 3 + (right ? 1 : 0)) % cols.length], onSide(RS, right, u, u + .03, v0 + .02 + (hash(k, j, right ? 5 : 6) * .03), v0 + .14)); }
        poly(x, '#241b12', onSide(RS, right, .02, .98, v0 + .14, v0 + .155));
      }
    });
    // 奥の壁の本棚
    const [l, t, r, b] = RS.back;
    R(x, '#3a2e22', l + 2, t + 2, r - l - 4, b - t - 4);
    for (let j = 0; j < 4; j++) { books(x, l + 4, t + 4 + j * 6, r - l - 8, 5, 70 + j); R(x, '#241b12', l + 3, t + 9 + j * 6, r - l - 6, 1); }
    // 帳場（奥の机）と金庫のあった場所、レジ
    box3(x, -.9, .5, 3.6, 4.1, .45, '#5a4630', '#4a3a28', '#3a2d1f', '#6a5440');
    R(x, '#2a2a2a', ...P3(.1, .62, 3.75).map(Math.round), 6, 3);                                                  // レジ
    const sp = P3(-.6, .55, 3.8).map(Math.round); R(x, 'rgba(0,0,0,.35)', sp[0], sp[1], 6, 2);                   // 金庫のあった跡
    // 裸電球と光
    [[-.8, 2.6], [.8, 2.6], [0, 4.2]].forEach(([X, z]) => { const [cx0, cy0] = P3(X, 2.05, z); R(x, '#555', Math.round(cx0), 0, 1, Math.round(cy0)); R(x, '#f0d890', Math.round(cx0) - 1, Math.round(cy0), 3, 2); });
    // 平台の本（手前の床に積まれた本）
    for (let k = 0; k < 3; k++) books(x, 8 + k * 14, 78 - k * 2, 12, 9 + k * 2, 90 + k);
  };
  // 法廷：傍聴席から見る。奥に一段高い法壇、手前左に検察官席、右に弁護人席、中央に証言台
  const RT = { back: [Math.round(P3(-2.4, 0, 5)[0]), Math.round(P3(0, 2.2, 5)[1]), Math.round(P3(2.4, 0, 5)[0]), Math.round(P3(0, 0, 5)[1])], ceil: '#241f19', side: '#33291f', sideR: '#30271d', floor: '#2a221a', wall: '#3a2e22', wallTex: '#3f3226' };
  BG.court = x => {
    room(x, RT);
    const [l, t, r, b] = RT.back;
    for (let i = l + 6; i < r - 4; i += 7) R(x, '#33281d', i, t + 2, 1, b - t - 4);                                // 奥の壁の板張り
    R(x, '#8a7a50', 116, t + 3, 8, 6); R(x, '#3a2e22', 118, t + 4, 4, 4); R(x, '#8a7a50', 119, t + 5, 2, 2);      // 紋章
    for (let k = 0; k < 3; k++) { const u0 = .15 + k * .28; poly(x, '#4a3c2c', onSide(RT, false, u0, u0 + .2, .12, .7)); poly(x, '#4a3c2c', onSide(RT, true, u0, u0 + .2, .12, .7)); }   // 側壁の板
    box3(x, -2.2, 2.2, 4.3, 4.95, .85, '#5a4630', '#4f3d2a', '#3f3123', '#6e5a3f');                                  // 法壇
    [-1.2, 0, 1.2].forEach(X => { const [cx0, cy0] = P3(X, 1.15, 4.75); R(x, '#151515', Math.round(cx0) - 3, Math.round(cy0), 6, 4); R(x, '#1d1d1d', Math.round(cx0) - 2, Math.round(cy0) - 3, 4, 3); });   // 裁判官の背もたれ
    box3(x, -2.2, -.9, 2.6, 3.4, .5, '#4f3d2a', '#3f3123', '#33281d', '#5a4630');                                   // 検察官席
    box3(x, .9, 2.2, 2.6, 3.4, .5, '#4f3d2a', '#3f3123', '#33281d', '#5a4630');                                     // 弁護人席
    box3(x, -.3, .3, 3.3, 3.55, .65, '#5a4630', '#4a3a28', '#3a2d1f', '#6e5a3f');                                   // 証言台
    const d1 = P3(-1.8, .5, 3).map(Math.round), d2 = P3(1.3, .5, 3).map(Math.round); R(x, '#d9cfb4', d1[0], d1[1] - 2, 8, 2); R(x, '#d9cfb4', d2[0], d2[1] - 2, 7, 2);
  };
  // 検事室：目の高さ y≈51。奥に窓、右の壁に本棚
  const RP = { back: [58, 16, 182, 72], ceil: '#25241e', side: '#2d2b25', sideR: '#2a2822', floor: '#211f1a', wall: '#2f2d26', wallTex: '#33302a' };
  BG.pros = x => {
    room(x, RP);
    R(x, '#1d201f', 72, 24, 40, 28); R(x, '#6d7a72', 74, 26, 36, 24); R(x, '#4a5550', 91, 26, 2, 24);    // 窓
    R(x, '#ddd6c2', 128, 28, 20, 14); R(x, '#a3342b', 136, 31, 4, 4);                                     // 額
    for (let j = 0; j < 4; j++) { const v0 = .12 + j * .16; poly(x, '#3a3224', onSide(RP, true, .05, .8, v0, v0 + .15)); poly(x, '#2a2218', onSide(RP, true, .05, .8, v0 + .13, v0 + .15)); }
    for (let k = 0; k < 14; k++) { const u = .07 + k * .05, c = ['#6a3a2a', '#3a4a5a', '#5a5a3a', '#4a3a4a', '#7a6a4a'][k % 5]; for (let j = 0; j < 4; j++) { const v0 = .12 + j * .16; poly(x, c, onSide(RP, true, u, u + .03, v0 + .03, v0 + .13)); } }
    R(x, '#4a463c', 62, 56, 22, 16); for (let j = 58; j < 70; j += 5) R(x, '#d9cfb4', 64, j, 18, 3);       // 記録の棚
  };
  // 令状当番の部屋（夜）：目の高さ y≈53
  const RC = { back: [56, 16, 184, 74], ceil: '#1a1814', side: '#211e1a', sideR: '#1e1b17', floor: '#1a1814', wall: '#221f1b', wallTex: '#26231e' };
  BG.chambers = x => {
    room(x, RC);
    R(x, '#0c0e14', 120, 24, 50, 34); R(x, '#141826', 122, 26, 46, 30); R(x, '#2a2e36', 144, 24, 2, 34);   // 夜の窓
    for (let i = 0; i < 16; i++) R(x, hash(i, 1, 42) < .5 ? '#c9b46a' : '#6a7a9a', 123 + Math.floor(hash(i, 2, 42) * 44), 44 + Math.floor(hash(i, 3, 42) * 11), 1, 1);
    for (let j = 0; j < 4; j++) { const v0 = .1 + j * .19; poly(x, '#3a3224', onSide(RC, false, .05, .85, v0, v0 + .17)); poly(x, '#2a2218', onSide(RC, false, .05, .85, v0 + .15, v0 + .17)); }
    for (let k = 0; k < 15; k++) { const u = .07 + k * .052, c = ['#5a2f2f', '#2f4a3a', '#3a4a5a', '#7a6a4a', '#4a3a4a'][k % 5]; for (let j = 0; j < 4; j++) { const v0 = .1 + j * .19; poly(x, c, onSide(RC, false, u, u + .035, v0 + .03, v0 + .15)); } }
    R(x, '#f1ece0', 90, 26, 9, 9); R(x, '#222', 94, 28, 1, 4); R(x, '#222', 94, 31, 3, 1);
  };
  // 課長席：窓を背にした課長の机。こちらが課長の机の前に立つ
  const RK = { back: [54, 14, 186, 74], ceil: '#26241f', side: '#2e2c27', sideR: '#2a2823', floor: '#22201c', wall: '#2f2c26', wallTex: '#34312a' };
  BG.kacho = x => {
    room(x, RK);
    R(x, '#1b1f22', 70, 20, 100, 36); for (let j = 21; j < 55; j += 3) R(x, '#6a777c', 71, j, 98, 2); R(x, '#2a2e30', 119, 20, 2, 36);   // 窓とブラインド
    R(x, '#3a3428', 60, 18, 6, 56); R(x, '#8a2a24', 60, 18, 6, 10);                                                                         // 旗竿
    R(x, '#f1ece0', 176, 22, 8, 8); R(x, '#222', 179, 24, 1, 3); R(x, '#222', 179, 26, 3, 1);                                              // 時計
    for (let j = 0; j < 3; j++) { const v0 = .2 + j * .22; poly(x, '#3a3224', onSide(RK, true, .05, .7, v0, v0 + .2)); poly(x, '#2a2218', onSide(RK, true, .05, .7, v0 + .18, v0 + .2)); }
    R(x, '#ddd6c2', 128, 58, 30, 14); R(x, '#a3342b', 130, 60, 26, 3); for (let j = 64; j < 70; j += 2) R(x, '#666', 131, j, 24, 1);      // 表彰状
  };
  FG.kacho = x => {
    deskP(x, 82, 34, 206, '#3a2a1c', 'rgba(0,0,0,.14)', '#1a120c', '#4a3626');
    R(x, '#1a1612', 98, 83, 44, 7); R(x, '#c9b46a', 100, 84, 40, 5); R(x, '#1a1612', 104, 85, 32, 1); R(x, '#1a1612', 104, 87, 32, 1);   // 名札「刑事課長」
    sheetP(x, 30, 88, 56, 14, false); sheetP(x, 32, 85, 52, 6, false); R(x, '#b23a2e', 36, 86, 10, 2);                                     // 決裁箱の書類
    R(x, '#151515', 168, 86, 30, 13); R(x, '#26282b', 170, 88, 26, 9);                                                                       // 電話
  };
  // 手前の層（遠近つき）
  FG.interro = x => {
    deskP(x, 80, 46, 194, '#3b3227', 'rgba(0,0,0,.12)', '#1c1712', '#4a3f31');
    R(x, '#e8e4d8', 160, 76, 7, 5); R(x, '#8a7a5a', 161, 77, 5, 1);                       // 向こう側の湯のみ
    sheetP(x, 92, 86, 58, 22, true); R(x, '#b23a2e', 136, 90, 9, 2);                        // 調書
    ln(x, '#151515', 152, 98, 170, 92); ln(x, '#2a2a2a', 152, 99, 170, 93); R(x, '#c9b46a', 169, 92, 3, 2);  // ペン
    armP(x, 40, 88, 28, SLEEVE, false); armP(x, 174, 90, 28, SLEEVE, true);
  };
  FG.office = x => {
    deskP(x, 86, 40, 200, '#4a3a29', 'rgba(0,0,0,.12)', '#2b2118', '#5a4733');
    for (let k = 0; k < 4; k++) sheetP(x, 8 + k, 92 - k * 2, 52, 16, false);
    R(x, '#151515', 194, 88, 30, 13); R(x, '#26282b', 196, 90, 26, 9); R(x, '#151515', 190, 86, 38, 4);
    R(x, '#e8e4d8', 164, 88, 10, 11); R(x, '#8a5a3a', 165, 89, 8, 2); R(x, '#e8e4d8', 174, 91, 3, 4);
    armP(x, 104, 92, 26, SLEEVE, false);
  };
  FG.pros = x => {
    deskP(x, 82, 44, 196, '#3e3022', 'rgba(0,0,0,.12)', '#211a12', '#4a3a29');
    sheetP(x, 74, 84, 66, 12, false); sheetP(x, 78, 81, 58, 6, false); R(x, '#b23a2e', 82, 82, 8, 2);
    R(x, '#2a2a2a', 168, 80, 22, 6); R(x, '#4a4a4a', 170, 78, 18, 3);
    armP(x, 22, 92, 26, SLEEVE, false);
  };
  FG.chambers = x => {
    deskP(x, 80, 40, 200, '#3a2f24', 'rgba(0,0,0,.12)', '#1a140e', '#4a3c2e');
    lightCone(x, 196, 80, 30, 105, 70, .07);
    R(x, '#555', 196, 54, 2, 26); poly(x, '#d8c37a', [[188, 50], [206, 50], [210, 56], [184, 56]]);   // 卓上灯
    for (let k = 0; k < 6; k++) sheetP(x, 12 + (k % 2), 96 - k * 3, 58, 12, false);
    sheetP(x, 92, 84, 64, 22, true);
    R(x, '#7a1e1a', 170, 90, 16, 9); R(x, '#a3342b', 171, 91, 14, 3); R(x, '#2a2420', 190, 84, 6, 15); R(x, '#c9b46a', 190, 84, 6, 2);
    armP(x, 68, 90, 26, '#2a2622', false);
  };
  FG.shop = x => {
    deskP(x, 86, 30, 210, '#5a4733', 'rgba(0,0,0,.1)', '#2b2118', '#6a5440');
    R(x, '#2a2a2a', 172, 84, 40, 18); R(x, '#3a3a3a', 174, 86, 36, 14);
    R(x, '#e4dbc2', 176, 87, 15, 12); R(x, '#e4dbc2', 193, 87, 15, 12); for (let j = 90; j < 98; j += 2) { R(x, '#8a8270', 178, j, 11, 1); R(x, '#8a8270', 195, j, 9, 1); }
    armP(x, 150, 92, 22, SLEEVE, false);
  };
  FG.home = x => {
    deskP(x, 88, 30, 210, '#5a4430', 'rgba(0,0,0,.1)', '#2e2216', '#6a5440');
    R(x, '#1c1511', 104, 90, 24, 12); R(x, '#e8e0d0', 105, 90, 22, 10); R(x, '#f4f0e4', 107, 90, 18, 3);
    ln(x, '#7a4a2a', 134, 100, 160, 94); ln(x, '#7a4a2a', 134, 102, 160, 96);
    R(x, '#3a5a6a', 56, 93, 28, 8); R(x, '#4a6a7a', 57, 94, 26, 2);
  };
  // 人物の立ち位置：机の向こうに座る／立つ高さ（スプライト上端の y）
  // 立って話す場面（自分は座っている。相手の目は、こちらの目の高さ＝消失点より上に来る）
  const TALL = { office: 6, street: 17, shop: 10 };
  const PLACE = { kacho: 24, interro: 24, office: 30, pros: 26, shop: 28, home: 30, chambers: 28, street: 41, court: 41, phone: 41, dark: 41 };
  const fgCache = {};
  function fgCanvas(k) {
    if (!FG[k]) return null;
    if (fgCache[k]) return fgCache[k];
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    fgBuilding = k; FG[k](x); fgBuilding = null; fgCache[k] = c; return c;
  }
  const bgCache = {};
  function bgCanvas(k) {
    if (bgCache[k]) return bgCache[k];
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    (BG[k] || BG.dark)(x); bgCache[k] = c; return c;
  }
  const A = { cv: null, sc: null, t0: performance.now(), blinkUntil: 0, nextBlink: 0, mouth: false, lastMouth: 0, timer: null };
  // ---- 解像度を2倍に：Scale2x（ドット絵の斜めの線をなめらかにする、古典的な拡大法）----
  function s2x(src) {
    const w = src.width, h = src.height, sx = src.getContext('2d').getImageData(0, 0, w, h), a = new Uint32Array(sx.data.buffer);
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const cx2 = c.getContext('2d');
    const out = cx2.createImageData(w * 2, h * 2), b = new Uint32Array(out.data.buffer), W2 = w * 2;
    const P = (x, y) => a[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = a[y * w + x], A1 = P(x, y - 1), B1 = P(x + 1, y), C1 = P(x - 1, y), D1 = P(x, y + 1);
      const i = (y * 2) * W2 + x * 2;
      b[i] = (C1 === A1 && C1 !== D1 && A1 !== B1) ? A1 : p;
      b[i + 1] = (A1 === B1 && A1 !== C1 && B1 !== D1) ? B1 : p;
      b[i + W2] = (D1 === C1 && D1 !== B1 && C1 !== A1) ? C1 : p;
      b[i + W2 + 1] = (B1 === D1 && B1 !== A1 && D1 !== C1) ? D1 : p;
    }
    cx2.putImageData(out, 0, 0); return c;
  }
  const c2 = {};
  const hi = (key, make, detail) => { if (c2[key]) return c2[key]; const src = make(); if (!src) return c2[key] = null; const c = s2x(src); if (detail) { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; detail(x); } return c2[key] = c; };
  // 2倍の細かさで描き足す小物
  function mug2(x, X, Y, band) {
    const ell = (cx0, cy0, rx, ry, col) => { x.fillStyle = col; for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j / ry) * (j / ry))); x.fillRect(cx0 - w, cy0 + j, w * 2, 1); } };
    ell(X + 10, Y + 22, 12, 3, 'rgba(0,0,0,.35)');                                                     // 影
    x.fillStyle = '#2a2420'; x.fillRect(X - 1, Y + 3, 22, 20);                                            // 輪郭
    const cols = ['#cfc9bb', '#f4f0e6', '#f6f2e9', '#ebe6da', '#e2ddd0', '#ddd8ca', '#d8d2c4', '#d2ccbe', '#ccc6b8', '#c4beb0', '#bbb5a7', '#b2ac9e', '#a9a395'];
    for (let i = 0; i < 20; i++) { x.fillStyle = cols[Math.min(cols.length - 1, Math.round(i * (cols.length - 1) / 19))]; x.fillRect(X + i, Y + 3, 1, 19); }
    ell(X + 10, Y + 21, 10, 2, '#9f998b');
    if (band) { for (let i = 0; i < 20; i++) { x.fillStyle = i < 3 ? '#4a6a8a' : i > 14 ? '#2a3a4e' : '#3a5a7a'; x.fillRect(X + i, Y + 11, 1, 3); } }
    ell(X + 10, Y + 3, 11, 3, '#2a2420'); ell(X + 10, Y + 3, 10, 3, '#f8f5ec'); ell(X + 10, Y + 3, 8, 2, '#3a2416'); x.fillStyle = '#6a4a30'; x.fillRect(X + 6, Y + 2, 4, 1);   // 縁とコーヒー
    x.fillStyle = '#2a2420'; x.fillRect(X + 20, Y + 6, 6, 12); x.fillStyle = '#c4beb0'; x.fillRect(X + 21, Y + 7, 4, 10); x.fillStyle = '#2a2420'; x.fillRect(X + 21, Y + 9, 2, 6); x.fillStyle = '#e2ddd0'; x.fillRect(X + 21, Y + 7, 2, 1);   // 取っ手
    x.fillStyle = 'rgba(255,255,255,.10)'; for (let j = 0; j < 9; j++) { x.fillRect(X + 6 + Math.round(Math.sin(j * .9) * 2), Y - 3 - j, 1, 1); x.fillRect(X + 13 + Math.round(Math.sin(j * .9 + 2) * 2), Y - 5 - j, 1, 1); }   // 湯気
  }
  // 手（2倍の細かさ）：甲を上にして机に置いた手。指を1本ずつ、関節、爪、親指
  function hand2(x, X, Y, w, right) {
    X *= 2; Y *= 2; w *= 2; const h = 20, line = '#1c1511';
    const sk = ['#e2c0a0', '#d9b391', '#cfa784', '#c99f7b', '#bf9471', '#b58a67', '#a67d5e'];
    x.fillStyle = line; x.fillRect(X - 2, Y - 2, w + 4, h + 4);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = i / w, v = j / h; let k = Math.round(1 + u * 3 + v * 2.2); if (j < 2) k -= 1;
      x.fillStyle = sk[Math.max(0, Math.min(6, k))]; x.fillRect(X + i, Y + j, 1, 1);
    }
    // 指（4本）：先端を丸め、指のあいだに影、第二関節の線、爪
    const fw = Math.floor(w / 4);
    for (let f = 0; f < 4; f++) {
      const fx = X + f * fw;
      x.fillStyle = line; x.fillRect(fx, Y - 2, 1, 1); x.fillRect(fx + fw - 1, Y - 2, 1, 1);
      if (f > 0) { x.fillStyle = '#86624b'; x.fillRect(fx, Y, 1, 9); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(fx + 1, Y, 1, 7); }
      x.fillStyle = '#a67d5e'; x.fillRect(fx + 2, Y + 6, fw - 4, 1);
      x.fillStyle = '#ead2bb'; x.fillRect(fx + 2, Y, fw - 4, 2); x.fillStyle = '#c9a789'; x.fillRect(fx + 2, Y + 2, fw - 4, 1);
    }
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(X, Y + h - 5, w, 5);
    for (let f = 0; f < 4; f++) { x.fillStyle = '#d9b391'; x.fillRect(X + f * fw + 3, Y + 10, 3, 2); }   // 指の付け根の関節
    // 親指（内側）
    const tx = right ? X - 9 : X + w + 1;
    x.fillStyle = line; x.fillRect(tx - 1, Y + 5, 11, 12); x.fillStyle = '#c99f7b'; x.fillRect(tx, Y + 6, 9, 10);
    x.fillStyle = '#dcb592'; x.fillRect(tx + (right ? 1 : 0), Y + 6, 8, 2); x.fillStyle = '#ead2bb'; x.fillRect(right ? tx + 1 : tx + 5, Y + 7, 3, 2); x.fillStyle = '#a67d5e'; x.fillRect(tx, Y + 14, 9, 2);
  }
  const DETAIL_FG = {};
  Object.keys(FG).forEach(k => { DETAIL_FG[k] = x => { if (k === 'office') mug2(x, 326, 174, true); }; });
  // 壁の時計（背景ごとの位置。2倍の座標で描く）。時刻は G.clock = { h, m }
  const CLOCKS = { office: [139, 45, 6, '#f1ece0'], interro: [146, 28, 10, '#d6d0c0'], chambers: [90, 26, 9, '#f1ece0'], kacho: [176, 22, 8, '#f1ece0'] };
  function drawClock(x, bg) {
    const c = CLOCKS[bg]; if (!c) return;
    const t = G.clock || { h: 10, m: 0 }, cx0 = (c[0] + c[2] / 2) * 2, cy0 = (c[1] + c[2] / 2) * 2, r = c[2] - 1;
    x.fillStyle = c[3]; x.beginPath(); x.arc(cx0, cy0, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#6a6a6a'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillRect(Math.round(cx0 + Math.sin(a) * (r - 1)), Math.round(cy0 - Math.cos(a) * (r - 1)), 1, 1); }
    const hand = (ang, len, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(cx0, cy0); x.lineTo(cx0 + Math.sin(ang) * len, cy0 - Math.cos(ang) * len); x.stroke(); };
    hand(((t.h % 12) + t.m / 60) / 12 * Math.PI * 2, r * .5, '#1c1712', 1.6); hand(t.m / 60 * Math.PI * 2, r * .8, '#1c1712', 1);
  }
  // ---- 背景の動き：奥を歩く人影、通りすぎる車の明かり、扉の窓をよぎる影 ----
  function figure(x, X, z, ph, col) {
    const [fx, fy] = P3(X, 0, z), h = Math.max(6, 62 * 1.7 / z), w = Math.max(3, Math.round(h * .26));
    const head = Math.max(2, Math.round(h * .14)), torso = Math.round(h * .38), leg = Math.round(h * .42);
    const X0 = Math.round(fx - w / 2), top = Math.round(fy - h);
    x.fillStyle = col;
    x.fillRect(Math.round(fx - head / 2), top, head, head + 1);                       // 頭
    x.fillRect(X0, top + head + 1, w, torso);                                         // 胴
    const sw = Math.round(Math.sin(ph) * w * .35), lw = Math.max(1, Math.round(w * .4));
    x.fillRect(Math.round(fx - lw - 0 + sw), top + head + 1 + torso, lw, leg);         // 脚（交互に）
    x.fillRect(Math.round(fx - sw), top + head + 1 + torso, lw, leg);
  }
  function ambient(x, bg, now) {
    const t = now / 1000;
    if (bg === 'office') {
      // 通路を奥から手前へ歩いてくる同僚（14秒に一度）
      const c1 = (t % 14) / 7; if (c1 < 1) figure(x, .05, 4.9 - c1 * 2.6, t * 9, 'rgba(22,20,17,.92)');
      // 奥の壁ぞいを横切る人（19秒に一度）
      const c2 = ((t + 6) % 19) / 6; if (c2 < 1) figure(x, -2.3 + c2 * 4.6, 4.95, t * 8, 'rgba(26,24,20,.85)');
    } else if (bg === 'street') {
      const c = (t % 11) / 4; if (c < 1) { const X = Math.round(-20 + c * 280); x.fillStyle = 'rgba(255,240,200,.9)'; x.fillRect(X, 80, 3, 2); x.fillRect(X + 10, 80, 3, 2); poly(x, 'rgba(255,240,200,.07)', [[X + 13, 79], [X + 40, 75], [X + 40, 86], [X + 13, 83]]); }
      const p = ((t + 3) % 13) / 9; if (p < 1) { const X = Math.round(250 - p * 270), ph = Math.sin(t * 7) > 0; x.fillStyle = 'rgba(10,11,14,.9)'; x.fillRect(X, 47, 3, 3); x.fillRect(X - 1, 50, 5, 7); x.fillRect(X - (ph ? 1 : 0), 57, 2, 4); x.fillRect(X + (ph ? 2 : 1), 57, 2, 4); }
    } else if (bg === 'interro') {
      const c = (t % 15) / 1.4; if (c < 1) { x.fillStyle = 'rgba(0,0,0,.7)'; const X = 80 + Math.round(c * 14) - 4; x.fillRect(Math.max(80, X), 41, Math.max(0, Math.min(6, 92 - Math.max(80, X))), 7); }
    } else if (bg === 'kacho') {
      // ブラインドの向こうを、ときどき影が通る
      const c = (t % 17) / 2; if (c < 1) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(70 + Math.round(c * 90), 22, 10, 32); }
    }
  }
  function draw() {
    const cv = A.cv, sc = A.sc; if (!cv || !sc || !cv.isConnected) return;
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    x.setTransform(cv.width / (W * 2), 0, 0, cv.height / (H * 2), 0, 0);
    x.drawImage(hi('bg:' + sc.bg, () => bgCanvas(sc.bg)), 0, 0);
    drawClock(x, sc.bg);
    x.scale(2, 2);   // 以下、位置は従来の座標で指定し、拡大済みの絵を半分の大きさで置く
    if (!sc.dim) ambient(x, sc.bg, performance.now());
    if (sc.who && PEOPLE[sc.who]) {
      const now = performance.now();
      if (now > A.nextBlink) { A.blinkUntil = now + 130; A.nextBlink = now + 2400 + Math.random() * 3200; }
      const speaking = G.anim && G.anim.speaking === sc.who;
      if (speaking && now - A.lastMouth > 110) { A.mouth = !A.mouth; A.lastMouth = now; } if (!speaking) A.mouth = false;
      const breath = Math.sin((now - A.t0) / 1700 * Math.PI * 2) > .35 ? 1 : 0;
      const tall = TALL[sc.bg] != null;
      const s = sprite(sc.who, sc.stage, { blink: now < A.blinkUntil, mouth: A.mouth, tall });
      const px = sc.x === 'l' ? 40 : sc.x === 'r' ? 136 : 88, py = tall ? TALL[sc.bg] : PLACE[sc.bg] ?? H - N;
      // 歩いて入ってくる：同じ場所で人物が替わったときだけ、横から歩いて来る
      // 一歩ごとに体が上下し、足音が鳴る（コツ、コツ、コツ）
      const e = A.enter, k = e ? Math.min(1, (now - e.t0) / e.dur) : 1;
      const stepI = e ? Math.floor((now - e.t0) / STEP_MS) : 0, inStep = e ? ((now - e.t0) % STEP_MS) / STEP_MS : 0;
      const ease = k < .85 ? k / .85 * .95 : .95 + (k - .85) / .15 * .05;   // ほぼ一定の速さで歩き、最後に止まる
      const ox = e && k < 1 ? Math.round((1 - ease) * e.from) : 0, bob = e && k < 1 ? (inStep < .5 ? 1 : 0) : 0;
      if (e && k < 1 && stepI > (e.lastStep ?? -1)) { e.lastStep = stepI; G.audio.sfx('step'); }
      if (e && k >= 1) A.enter = null;
      x.drawImage(hi('sp:' + s._key, () => s), px + ox, py + breath - bob, s.width, s.height);
    }
    if (A.exit) {
      const ex = A.exit, el = performance.now() - ex.t0, k = Math.min(1, el / ex.dur), si = Math.floor(el / STEP_MS);
      if (si > (ex.lastStep ?? -1) && k < 1) { ex.lastStep = si; G.audio.sfx('step'); }
      if (k < 1) x.drawImage(hi('sp:' + ex.s._key, () => ex.s), ex.px + Math.round(k * ex.to), ex.py - ((el % STEP_MS) / STEP_MS < .5 ? 1 : 0), ex.s.width, ex.s.height); else A.exit = null;
    }
    const fg = hi('fg:' + sc.bg, () => fgCanvas(sc.bg), DETAIL_FG[sc.bg]); if (fg) x.drawImage(fg, 0, 0, W, H);
    if (sc.dim) { x.fillStyle = 'rgba(0,0,0,' + sc.dim + ')'; x.fillRect(0, 0, W, H); }
    if (A.fade) { const k = (performance.now() - A.fade.t0) / 520; if (k >= 1) A.fade = null; else { x.fillStyle = 'rgba(0,0,0,' + (1 - k * k).toFixed(3) + ')'; x.fillRect(0, 0, W, H); } }
    x.setTransform(1, 0, 0, 1, 0, 0);
  }
  function scene(cv, sc) {
    if (!A.sc || A.sc.who !== sc.who) { A.nextBlink = performance.now() + 1500 + Math.random() * 2000; A.blinkUntil = 0; }
    const prev = A.sc, sameRoom = prev && prev.bg === sc.bg && A.cv === cv;
    const now0 = performance.now(); A.recent = A.recent || {};
    const fresh = sc.who && !(A.recent[sc.bg + ':' + sc.who] > now0 - 30000);
    if (prev && prev.who) A.recent[prev.bg + ':' + prev.who] = now0;
    if (sc.who) A.recent[sc.bg + ':' + sc.who] = now0;
    // 歩いて来るのは、刑事部屋に報告に来る同僚だけ。取調べの相手や目撃者は、最初からそこにいる
    const walker = w => WALKERS.includes(w) && sc.bg === 'office';
    if (sameRoom && prev.who !== sc.who && (fresh || !sc.who)) {
      const now = performance.now(), fromRight = sc.x !== 'l';
      A.enter = walker(sc.who) && PEOPLE[sc.who] ? { t0: now, dur: STEP_MS * 7, from: fromRight ? 150 : -150 } : null;
      // 前の人は反対側へ歩いて出ていく
      A.exit = prev.who && PEOPLE[prev.who] && walker(prev.who) ? { s: sprite(prev.who, prev.stage, { tall: TALL[prev.bg] != null }), px: prev.x === 'l' ? 40 : prev.x === 'r' ? 136 : 88, py: TALL[prev.bg] ?? PLACE[prev.bg] ?? H - N, to: fromRight ? -150 : 150, t0: now, dur: STEP_MS * 5 } : null;
    } else if (!sameRoom) { A.enter = null; A.exit = null; }
    if (prev && prev.bg !== sc.bg && A.cv === cv) { A.fade = { t0: performance.now() }; G.audio.sfx(['interro', 'pros', 'kacho', 'chambers'].includes(sc.bg) ? 'door' : 'steps'); }
    A.cv = cv; A.sc = sc; draw();
    if (!A.timer) A.timer = setInterval(draw, 60);
  }
  const STEP_MS = 300, WALKERS = ['shirai', 'oka', 'noguchi'];
  // 歩いて来る人が着くまでの残り時間（台詞は着いてから出す）
  const arrivalLeft = () => A.enter ? Math.max(0, A.enter.t0 + A.enter.dur - performance.now()) : 0;
  const skipArrival = () => { if (A.enter) A.enter.t0 = performance.now() - A.enter.dur; };
  G.portraits = { scene, sprite, PEOPLE, face, arrivalLeft, skipArrival };
})();
