'use strict';
/* ============================================================
   音：BGM（場面ごとのキュー）、環境音、効果音、つぶやき声
   ============================================================ */
(function () {
  // ---- 曲 ----
  const OP110_FUGA = 0;   // 録音の中でフーガが始まる位置（秒）
  const TRACKS = {
    barcarolle: 'audio/barcarolle.mp3',   // ショパン 舟歌 作品60（導入）
    waltz:      'audio/waltz34-2.mp3',    // ショパン ワルツ第3番 作品34-2（序章）
    eroica:     'audio/eroica2.mp3',      // ベートーヴェン 交響曲第3番 第2楽章（本章）
    prelude20:  'audio/prelude20.mp3',    // ショパン 前奏曲 作品28-20（取調べ）
    noct48:     'audio/noct48-1.mp3',     // ショパン 夜想曲第13番 作品48-1（勾留の満期）
    op110:      'audio/op110-3.mp3',      // ベートーヴェン ピアノソナタ第31番 第3楽章（刑事編の公判・判決）
    noct20:     'audio/noct20.mp3',       // ショパン 夜想曲第20番 嬰ハ短調 遺作（数年後）
    pathetique: 'audio/pathetique2.mp3',  // ベートーヴェン ピアノソナタ第8番 第2楽章（終幕）
    waldstein:  'audio/waldstein2.mp3',   // ベートーヴェン ピアノソナタ第21番 第2楽章（判事編の公判）
    aria:       'audio/goldberg-aria.mp3',// バッハ ゴルトベルク変奏曲 アリア（令状当番）
    etude257:   'audio/etude25-7.mp3',    // ショパン 練習曲 作品25-7（経歴の終章：再審が来なかったとき）
    funeral:    'audio/sonata2-3.mp3'     // ショパン ピアノソナタ第2番 第3楽章（自分が捜査した事件の再審に、証人として呼ばれる場面だけ）
  };
  // ---- 場面ごとの指定 ----
  // t: 曲（null は無音）／at: 開始位置（秒）／restart: 同じ曲が鳴っていても頭出しし直す
  // 曲は1回流れたら止まる（ループしない）。
  const CUES = {
    title:        { t: 'barcarolle', at: 0 },
    quote:        { t: 'barcarolle', at: 0 },
    law1:         { t: 'barcarolle', at: 0 },
    prologue:     { t: 'waltz', at: 0, restart: true },
    prologueSolve:{ t: 'waltz', at: 150, restart: true },
    main:         { t: 'eroica', at: 0, restart: true },
    arrest:       { t: 'eroica', at: 255, restart: true },
    confession:   { t: 'eroica', at: 470, restart: true },
    soutchi:      { t: 'eroica', at: 760, restart: true },
    interro:      { t: 'prelude20', at: 0 },               // 取調べのたびに頭から鳴らし直さない
    expiry:       { t: 'noct48', at: 0, restart: true },
    trial:        { t: 'op110', at: 0, restart: true },
    verdict:      { t: 'op110', at: OP110_FUGA, restart: true },  // フーガの入り
    years:        { t: 'noct20', at: 0, restart: true },
    grave:        { t: 'funeral', at: 0, restart: true },
    finale:       { t: 'pathetique', at: 0, restart: true },
    hanjiTrial:   { t: 'waldstein', at: 0, restart: true },
    warrant:      { t: 'aria', at: 0, restart: true },
    witness:      { t: 'etude257', at: 0, restart: true },
    silence:      { t: null }
  };

  let AC = null, master = null, bgmGain = null, ambGain = null, sfxGain = null, voiceGain = null;
  let current = null; // { name, el, gain }
  let muted = !!(G.meta && G.meta.muted);
  function ctx() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        master = AC.createGain(); master.gain.value = muted ? 0 : 1; master.connect(AC.destination);
        bgmGain = AC.createGain(); bgmGain.gain.value = .33;   // 以前の .55 の約6割 bgmGain.connect(master);
        ambGain = AC.createGain(); ambGain.gain.value = .5; ambGain.connect(master);
        sfxGain = AC.createGain(); sfxGain.gain.value = .8; sfxGain.connect(master);
        voiceGain = AC.createGain(); voiceGain.gain.value = 1.6; voiceGain.connect(master);
      } catch (e) { AC = null; }
    }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }

  function fadeTo(g, v, sec) { if (!AC || !g) return; const t = AC.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(v, t + sec); }

  function stopCurrent(sec) {
    if (!current) return;
    const c = current; current = null;
    if (c.gain && AC) { fadeTo(c.gain, 0, sec); setTimeout(() => { try { c.el.pause(); } catch (e) {} }, sec * 1000 + 100); }
    else { try { c.el.pause(); } catch (e) {} }
  }

  let pendingCue = null;
  function cue(id) {
    const c = CUES[id]; if (!c) return;
    if (!AC) { pendingCue = id; return; }
    if (!c.t) { stopCurrent(2.5); return; }
    if (current && current.name === c.t && !c.restart) return;
    stopCurrent(2.5);
    const el = new Audio(); el.preload = 'auto'; el.src = TRACKS[c.t];
    let gain = null;
    try { const src = AC.createMediaElementSource(el); gain = AC.createGain(); gain.gain.value = 0; src.connect(gain); gain.connect(bgmGain); }
    catch (e) { gain = null; el.volume = muted ? 0 : .5; }
    const me = { name: c.t, el, gain };
    current = me;
    el.addEventListener('loadedmetadata', () => { try { el.currentTime = Math.min(c.at || 0, Math.max(0, el.duration - 5)); } catch (e) {} });
    el.addEventListener('ended', () => { if (current === me) current = null; });
    el.addEventListener('error', () => { if (current === me) current = null; });
    const p = el.play(); if (p && p.catch) p.catch(() => {});
    if (gain) fadeTo(gain, 1, 3);
  }

  // ---- 環境音（合成） ----
  let amb = null;
  function noiseBuffer(sec) {
    const n = Math.floor(AC.sampleRate * sec), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b;
  }
  function ambient(kind) {
    if (!ctx()) return;
    if (amb) { const a = amb; amb = null; fadeTo(a.g, 0, 1.5); setTimeout(() => a.stop(), 1700); }
    if (!kind) return;
    const g = AC.createGain(); g.gain.value = 0; g.connect(ambGain);
    const nodes = []; let timer = null;
    const hum = (f, v) => { const o = AC.createOscillator(); o.frequency.value = f; const og = AC.createGain(); og.gain.value = v; o.connect(og); og.connect(g); o.start(); nodes.push(o); };
    const room = (f, v) => { const s = AC.createBufferSource(); s.buffer = noiseBuffer(2); s.loop = true; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f; const sg = AC.createGain(); sg.gain.value = v; s.connect(lp); lp.connect(sg); sg.connect(g); s.start(); nodes.push(s); };
    // まれに混じる遠くの音（場所ごと。頻度は低く、音量は小さく）
    const far = (fn, v) => { const og = AC.createGain(); og.gain.value = v; og.connect(g); fn(AC.currentTime + .05, og); };
    const caw = (t, d) => { for (let i = 0; i < 2 + (Math.random() * 2 | 0); i++) { const o = AC.createOscillator(); o.type = 'sawtooth'; const t0 = t + i * .42; o.frequency.setValueAtTime(720, t0); o.frequency.linearRampToValueAtTime(560, t0 + .28); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 2.5; const eg = AC.createGain(); env(eg, t0, .03, .26, .5); o.connect(bp); bp.connect(eg); eg.connect(d); o.start(t0); o.stop(t0 + .35); } };
    const siren = (t, d) => { const o = AC.createOscillator(); o.type = 'sine'; for (let i = 0; i < 6; i++) { o.frequency.setValueAtTime(i % 2 ? 960 : 770, t + i * .65); } const eg = AC.createGain(); eg.gain.setValueAtTime(0, t); eg.gain.linearRampToValueAtTime(.25, t + 1.5); eg.gain.linearRampToValueAtTime(0, t + 3.9); o.connect(eg); eg.connect(d); o.start(t); o.stop(t + 4); };
    const rumble = (t, d) => { const s = AC.createBufferSource(); s.buffer = noiseBuffer(6); const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; const eg = AC.createGain(); eg.gain.setValueAtTime(0, t); eg.gain.linearRampToValueAtTime(.9, t + 2.5); eg.gain.linearRampToValueAtTime(0, t + 5.8); s.connect(lp); lp.connect(eg); eg.connect(d); s.start(t); };
    const thump = (t, d, n, gap) => { for (let i = 0; i < n; i++) { const s = AC.createBufferSource(); s.buffer = noiseBuffer(.12); const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const eg = AC.createGain(); env(eg, t + i * gap, .004, .08, .6); s.connect(lp); lp.connect(eg); eg.connect(d); s.start(t + i * gap); } };
    const cough = (t, d) => { for (let i = 0; i < 2; i++) { const s = AC.createBufferSource(); s.buffer = noiseBuffer(.25); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; const eg = AC.createGain(); env(eg, t + i * .3, .01, .16, .5); s.connect(bp); bp.connect(eg); eg.connect(d); s.start(t + i * .3); } };
    const RARE = {
      office: [() => far(caw, .05), () => far(siren, .05), () => far((t, d) => thump(t, d, 6, .38), .12)],
      interro: [() => far((t, d) => thump(t, d, 8, .45), .1), () => far((t, d) => thump(t, d, 1, 0), .25)],
      court: [() => far(cough, .12), () => far((t, d) => thump(t, d, 1, 0), .15)],
      night: [() => far(rumble, .07), () => far(caw, .03), () => far(siren, .03)]
    }[kind];
    let rareT = null;
    const nextRare = () => { rareT = setTimeout(() => { if (amb && amb.g === g && RARE) { G.pick(RARE)(); nextRare(); } }, 50000 + Math.random() * 90000); };
    if (RARE) nextRare();
    if (kind === 'interro') { hum(100, .02); hum(200, .006); room(400, .05); timer = setInterval(() => sfx('tick'), 1000); }
    if (kind === 'office') {
      room(600, .06); hum(60, .01);
      // 人の話し声のざわめき（声の帯域の雑音を、ゆっくり揺らす）
      { const s = AC.createBufferSource(); s.buffer = noiseBuffer(3); s.loop = true; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 1.4;
        const mg = AC.createGain(); mg.gain.value = .022; const lfo = AC.createOscillator(); lfo.frequency.value = .37; const lg = AC.createGain(); lg.gain.value = .014; lfo.connect(lg); lg.connect(mg.gain);
        s.connect(bp); bp.connect(mg); mg.connect(g); s.start(); lfo.start(); nodes.push(s, lfo); }
      // ときどき：キーボード、紙、椅子、遠くの電話
      const near = (fn) => { const og = AC.createGain(); og.gain.value = 1; og.connect(g); fn(AC.currentTime + .02, og); };
      const tick = (t, d, f, v, q) => { const s = AC.createBufferSource(); s.buffer = noiseBuffer(.05); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q || 3; const eg = AC.createGain(); env(eg, t, .002, .03, v); s.connect(bp); bp.connect(eg); eg.connect(d); s.start(t); };
      const EV = [
        () => near((t, d) => { const n = 6 + (Math.random() * 14 | 0); for (let i = 0; i < n; i++) tick(t + i * (.08 + Math.random() * .09), d, 1800 + Math.random() * 900, .05); }),
        () => near((t, d) => { for (let i = 0; i < 5; i++) tick(t + i * .03, d, 3000 + Math.random() * 2000, .04, 1); }),
        () => near((t, d) => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t); o.frequency.linearRampToValueAtTime(140, t + .25); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; const eg = AC.createGain(); env(eg, t, .02, .25, .015); o.connect(bp); bp.connect(eg); eg.connect(d); o.start(t); o.stop(t + .3); }),
        () => near((t, d) => { for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const o = AC.createOscillator(); o.type = 'square'; o.frequency.value = i % 2 ? 1650 : 1300; const eg = AC.createGain(); env(eg, t + r * .5 + i * .04, .002, .02, .006); o.connect(eg); eg.connect(d); o.start(t + r * .5 + i * .04); o.stop(t + r * .5 + i * .04 + .03); } })
      ];
      const W = [5, 3, 2, 1], tot = W.reduce((a, b) => a + b);
      timer = setInterval(() => { if (Math.random() < .5) return; let r = Math.random() * tot, i = 0; while ((r -= W[i]) > 0) i++; EV[i](); }, 3500);
    }
    if (kind === 'court') { room(300, .07); }
    if (kind === 'rain') { room(1800, .12); room(500, .08); }
    if (kind === 'night') { room(250, .04); }
    fadeTo(g, 1, 2);
    amb = { g, kind, stop: () => { nodes.forEach(n => { try { n.stop(); } catch (e) {} }); if (timer) clearInterval(timer); if (rareT) clearTimeout(rareT); } };
  }

  // ---- 効果音（合成） ----
  function env(g, t, a, d, v) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function burst(t, dur, f, type, v, q) {
    const s = AC.createBufferSource(); s.buffer = noiseBuffer(dur + .05);
    const fl = AC.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.value = f; if (q) fl.Q.value = q;
    const g = AC.createGain(); env(g, t, .004, dur, v); s.connect(fl); fl.connect(g); g.connect(sfxGain); s.start(t); s.stop(t + dur + .05);
  }
  function tone(t, f, dur, type, v, f2) {
    const o = AC.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = AC.createGain(); env(g, t, .005, dur, v); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + .05);
  }
  function sfx(name) {
    if (!ctx()) return; const t = AC.currentTime;
    switch (name) {
      case 'stamp': burst(t, .09, 700, 'lowpass', .9); tone(t, 130, .16, 'sine', .5, 40); break;
      case 'paper': {
        // 紙の繊維がこすれる細かい音（パラ）と、めくり終わりの空気の音（リ）
        for (let i = 0; i < 9; i++) { const tt = t + i * .022 + Math.random() * .012; burst(tt, .018 + Math.random() * .02, 2200 + Math.random() * 3500, 'bandpass', .22 + Math.random() * .15, 1.2); }
        const s2 = AC.createBufferSource(); s2.buffer = noiseBuffer(.4); const f2 = AC.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = .8;
        f2.frequency.setValueAtTime(900, t + .05); f2.frequency.exponentialRampToValueAtTime(4200, t + .32);
        const g2 = AC.createGain(); g2.gain.setValueAtTime(0, t + .05); g2.gain.linearRampToValueAtTime(.28, t + .14); g2.gain.exponentialRampToValueAtTime(.0001, t + .36);
        s2.connect(f2); f2.connect(g2); g2.connect(sfxGain); s2.start(t + .05); s2.stop(t + .4);
        burst(t + .2, .03, 1500, 'lowpass', .18); break; }
      case 'click': tone(t, 900, .03, 'square', .04); break;
      case 'tick': tone(t, 2400, .012, 'square', .02); break;
      case 'pen': for (let i = 0; i < 6; i++) burst(t + i * .07, .05, 3500, 'bandpass', .08, 2); break;
      case 'phone': for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) { tone(t + r * .5 + i * .04, 1300, .02, 'square', .04); tone(t + r * .5 + i * .04 + .02, 1650, .02, 'square', .03); } break;
      case 'door': burst(t, .25, 300, 'lowpass', .5); tone(t + .02, 90, .2, 'sine', .3, 60); break;
      case 'metal': tone(t, 220, .6, 'triangle', .15, 200); tone(t, 330, .5, 'triangle', .1); burst(t, .08, 3000, 'highpass', .3); burst(t + .2, .3, 400, 'lowpass', .4); break;
      case 'step': burst(t, .05, 380, 'lowpass', .32); burst(t + .012, .02, 2600, 'bandpass', .07, 4); break;   // 一歩（かかと）
      case 'select': tone(t, 98, .35, 'sine', .45, 55); burst(t, .07, 600, 'lowpass', .5); burst(t + .08, .22, 3200, 'bandpass', .09, 1.5); break;   // 選んだときの、重い判の音と紙
      case 'steps': for (let i = 0; i < 4; i++) burst(t + i * .42, .06, 500, 'lowpass', .25); break;
      case 'crowd': { const s = AC.createBufferSource(); s.buffer = noiseBuffer(2.2); const fl = AC.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 700; fl.Q.value = .5; const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .6); g.gain.linearRampToValueAtTime(0, t + 2); s.connect(fl); fl.connect(g); g.connect(sfxGain); s.start(t); break; }
      case 'bell': [55, 82.5, 110].forEach((f, i) => tone(t, f, 2.8, 'sine', .16 / (i + 1))); break;
      case 'thud': tone(t, 70, .5, 'sine', .5, 35); burst(t, .15, 200, 'lowpass', .4); break;
      case 'type': for (let i = 0; i < 8; i++) burst(t + i * .09 + Math.random() * .03, .03, 2000, 'bandpass', .12, 3); break;
    }
  }

  // ---- つぶやき声：母音のフォルマントを真似た短い発声 ----
  const VOW = [[800, 1200], [300, 2300], [350, 1300], [500, 1900], [500, 900]];
  let lastVoice = 0;
  function voice(v, ch) {
    if (!ctx() || !ch) return;
    if ('、。…！？「」　 ―・（）'.includes(ch)) return;
    const t = AC.currentTime; if (t - lastVoice < .045) return; lastVoice = t;
    const code = ch.charCodeAt(0), [f1, f2] = VOW[code % 5];
    const o = AC.createOscillator(); o.type = v.w || 'sawtooth';
    o.frequency.setValueAtTime(v.f * (0.94 + ((code >> 3) % 7) * .02), t);
    const g = AC.createGain(); env(g, t, .008, .085, .32);
    const a = AC.createBiquadFilter(); a.type = 'bandpass'; a.frequency.value = f1; a.Q.value = 5;
    const b = AC.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f2; b.Q.value = 7;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    o.connect(a); o.connect(b); a.connect(lp); b.connect(lp); lp.connect(g); g.connect(voiceGain);
    o.start(t); o.stop(t + .1);
  }

  G.audio = {
    unlock() { if (ctx() && pendingCue) { const p = pendingCue; pendingCue = null; cue(p); } },
    cue, ambient, sfx, voice, voiceStop() {}, ambientKind: () => amb ? amb.kind : null,
    setMuted(m) { muted = m; if (master) fadeTo(master, m ? 0 : 1, .3); if (current && !current.gain) current.el.volume = m ? 0 : .5; },
    CUES, TRACKS
  };
})();
