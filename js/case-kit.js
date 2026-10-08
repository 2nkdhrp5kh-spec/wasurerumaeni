'use strict';
/* ============================================================
   事件を作るための共通部品（身柄拘束、取調べ、送致）
   ============================================================ */
(function () {
  const K = G.keiji, P = G.P, rnd = G.rnd;
  const LIMIT = 23;
  const kit = G.kit = { LIMIT };
  kit.sc = (who, bg, stage) => ({ bg: bg || 'office', who, stage });
  kit.inCustody = S => S.c.arrest != null && !S.c.released;
  kit.custodyDay = S => S.day - S.c.arrest;
  kit.stage = S => { const c = S.c; if (c.arrest == null) return 0; const d = S.day - c.arrest; return d < 4 ? 0 : d < 9 ? 1 : d < 16 ? 2 : 3; };

  kit.limitBar = function (d, left) {
    const seg = (cls, w, t) => '<span class="seg ' + cls + '" style="width:' + (w / LIMIT * 100) + '%">' + t + '</span>';
    return '<div class="limit"><div class="row"><span>身柄拘束 ' + d + '日目</span><span>勾留満期まで あと' + left + '日</span></div>'
      + '<div class="segs"><span class="done" style="width:' + Math.min(100, d / LIMIT * 100) + '%"></span>'
      + seg('s1', 3, '送致・請求') + seg('s2', 10, '勾留 10日') + seg('s3', 10, '延長 10日')
      + '<span class="now" style="left:calc(' + Math.min(100, d / LIMIT * 100) + '% - 1px)"></span></div>'
      + '<div style="margin-top:2px">逮捕から48時間で送致、24時間以内に勾留請求、勾留10日、延長は最大10日（刑訴法203・205・208条）</div></div>';
  };
  kit.info = (S, title) => {
    if (kit.inCustody(S)) {
      const d = kit.custodyDay(S), stage = d < 2 ? '送致前（48時間）' : d < 3 ? '勾留請求' : d < 13 ? '勾留' : '勾留延長';
      return { text: title + '　' + stage, clock: kit.limitBar(d, LIMIT - d) };
    }
    return { text: title + '　事件発生から' + (S.day + 1) + '日' };
  };

  // 逮捕後の朝の出来事（共通）
  kit.custodyMorning = function (S, o) {
    const L = [], c = S.c, d = kit.custodyDay(S), sc = kit.sc;
    if (d === 2) L.push(['', '（48時間。' + o.name + 'は検察官に送致された。）'], ['kenji', '担当の検事です。勾留を請求します。' + (o.kenji2 || ''), { scene: sc('kenji', 'pros') }]);
    if (d === 3) L.push(['', '（裁判官は勾留を認めた。10日間。）']);
    if (d === 5 && !S.staffGone.noguchi) { K.loseStaff('noguchi'); L.push(['todo', '野口は別件の応援に回す。被疑者はもう押さえてるんだ。', { scene: sc('todo') }]); }
    if (d === 13) { L.push(['', '（勾留延長。あと10日。）']); if (!S.staffGone.oka) { K.loseStaff('oka'); L.push(['todo', '岡も外す。残りは白井とお前でやれ。', { scene: sc('todo') }]); } }
    if (d === 8 && !c.confession && o.wantConfession) L.push(['todo', '検事が電話してきた。' + o.wantConfession, { scene: sc('todo') }]);
    if (d === 20) L.push(['shirai', '主任、満期まであと3日です。', { scene: sc('shirai') }]);
    return L;
  };

  // 取調べのやり方（共通の枠組み）
  kit.RISK = (recorded, meter) => ({
    C: { id: 'long', title: '長時間の取調べ', law: '憲法38条2項、刑訴法319条1項', lure: meter >= 55 ? '白井「もう限界ですよ。今夜詰めれば、落ちます」' : '白井「時間をかければ、人は話すもんです」',
      effects: ['得た自白が、任意性を欠くとして証拠から外されうる', recorded ? '取調べは録画されている。公判で、その映像が再生される' : '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] },
    D: { id: 'promise', title: '利益を約束して自白を求める', law: '刑訴法319条1項（判例：約束による自白）', lure: '白井「家族の話をすると、たいてい落ちますよ」',
      effects: ['得た自白が、任意性を欠くとして証拠から外されうる', recorded ? '取調べは録画されている。公判で、その映像が再生される' : '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] },
    E: { id: 'threat', title: '脅迫的な取調べ', law: '憲法38条2項、刑訴法319条1項', lure: '課長「否認してる奴に遠慮してどうする」',
      effects: ['得た自白が、脅迫による自白として証拠から外されうる', recorded ? '取調べは録画されている。公判で、その映像が再生される' : '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] }
  });
  kit.poolLines = function (S, pool, key) {
    const c = S.c; c.used = c.used || {}; const used = c.used[key] = c.used[key] || [];
    for (let i = 0; i < pool.length; i++) { if (used.includes(i)) continue; const L = pool[i](S); if (L) { used.push(i); return L; } }
    c.used[key] = []; for (let i = pool.length - 1; i >= 0; i--) { const L = pool[i](S); if (L) return L; }
    return [['', '（沈黙が続いた。）']];
  };
  /* cfg: { who, bg, labels:{A..E}, pools:{A..E}, first, inc:{A..E:{G,I}}, truthKey:'G'|'I' 値, recorded, after(S) , confess(S, voluntary) , afterConfession(S) } */
  kit.interro = async function (S, cfg) {
    const c = S.c; c.sess = c.sess || { A: 0, B: 0, C: 0, D: 0, E: 0 };
    G.audio.ambient('interro'); G.drawScene(kit.sc(cfg.who, 'interro', kit.stage(S)));
    if (c.confession) { const r = cfg.afterConfession ? await cfg.afterConfession(S) : (await G.talk([[cfg.who, '……書いてあるとおりです。']]), false); G.audio.ambient(null); return r; }
    if (cfg.recorded) await G.talk([['', '（録画装置の赤いランプが点いている。この取調べは、最初から最後まで記録される。）']]);
    const total = c.sess.A + c.sess.B + c.sess.C + c.sess.D + c.sess.E;
    if (total === 0 && cfg.first) await G.talk(cfg.first);
    const L = cfg.labels;
    const k = await G.openPaper({ title: '取調べ', sub: cfg.sub ? cfg.sub(S) : '', noClose: true, body: P('どう進めるか。'),
      buttons: [{ label: L.A[0], value: 'A', small: L.A[1] }, { label: L.B[0], value: 'B', small: L.B[1] },
        { label: '夜まで取調べを続ける', value: 'C', cls: 'red', small: '朝9時から、話すまで' },
        { label: '怒鳴りつけ、追い詰める', value: 'E', cls: 'red', small: L.E || '机を叩く。家族のことを持ち出す' },
        { label: L.D[0], value: 'D', cls: 'red', small: L.D[1] }] });
    const R = kit.RISK(cfg.recorded, c.meter || 0);
    if (R[k] && !(await G.confirmRisk(R[k]))) { G.audio.ambient(null); return false; }
    c.sess[k]++; if (cfg.recorded && 'CDE'.includes(k)) c.recordedAbuse = (c.recordedAbuse || 0) + 1;
    const lines = kit.poolLines(S, cfg.pools[k], k);
    const inc = cfg.inc[k][c.truth === cfg.guiltyKey ? 'G' : 'I'] + (c.fired ? 5 : 0);
    c.meter = (c.meter || 0) + inc;
    let confess = c.meter >= 100, voluntary = false;
    if (!confess && k === 'A' && c.truth === cfg.guiltyKey && c.sess.A >= 2 && rnd() < .18) { confess = true; voluntary = true; }
    await G.talk(lines);
    if (confess) await cfg.confess(S, voluntary);
    else if (c.meter >= 70) await G.talk([['shirai', '主任……あと一押しすれば、落ちます。', { scene: kit.sc('shirai') }]]);
    else if (kit.custodyDay(S) >= 10 && c.meter < 45) await G.talk([['shirai', 'このままじゃ満期です。……やり方、考えたほうがいいんじゃないですか。', { scene: kit.sc('shirai') }]]);
    G.audio.ambient(null);
  };

  // 送致書（目録）の画面
  kit.soutchi = async function (C, S) {
    const c = S.c;
    G.audio.cue('soutchi');
    await G.curtain([{ html: '<div class="big">送致</div>', wait: 900 }]);
    const ev = S.docs.filter(d => d.evid && !d.late);
    const sent = {}; ev.forEach(d => sent[d.id] = true);
    G.ui.busy = false;   // 送致画面では、記録を読み、照らし合わせられるようにする
    await new Promise(done => {
      C.actsOverride = (S2, wrap) => {
        if (!wrap) return true;
        wrap.innerHTML = '<div class="panel" style="margin-top:10px"><div class="ph"><span>送致書（証拠品・書類目録）</span><span>' + Object.values(sent).filter(Boolean).length + '/' + ev.length + '件を送る</span></div>'
          + '<div style="font-size:12px;color:#8c8578;margin-bottom:6px">上の捜査記録は、読むことも照らし合わせることもできる。送らない記録は「外す」。司法警察員は、書類及び証拠物とともに事件を送致しなければならない（刑訴法246条）。</div>'
          + ev.map(d => '<div class="srow' + (sent[d.id] ? '' : ' off') + '"><span>' + d.title + '</span><button class="bbtn" data-id="' + d.id + '">' + (sent[d.id] ? '送る' : '外す') + '</button></div>').join('')
          + '</div><button class="endday" id="send">この内容で送致する</button>';
        wrap.querySelectorAll('.srow .bbtn').forEach(b => b.onclick = () => { sent[b.dataset.id] = !sent[b.dataset.id]; G.audio.sfx('click'); C.actsOverride(S2, wrap); });
        G.$('#send').onclick = () => { if (G.ui.talking) return; C.actsOverride = null; G.audio.sfx('stamp'); done(); };
        return true;
      };
      K.render('（送致記録をまとめる。送る前に、もう一度読み返すこともできる。）');
    });
    c.sent = sent; c.withheld = Object.keys(sent).filter(k => !sent[k]);
    await G.talk([['todo', 'ご苦労だった。あとは検察の仕事だ。', { scene: kit.sc('todo') }]]);
  };

  // 課長が取調べを引き取る（共通）
  kit.takeover = async function (S, onConfess) {
    const c = S.c, sc = kit.sc;
    c.takeoverAsked = true;
    await G.talk([['todo', '……お前のやり方じゃ、埒があかん。', { scene: sc('todo') }], ['todo', '今夜は俺が調べる。']]);
    const v = await G.openPaper({ title: '東堂課長', body: P('課長が、自分で被疑者を取り調べると言っている。'), noClose: true,
      buttons: [{ label: '課長に任せる', value: true, cls: 'red', small: '取調室のことは、あなたは見ない' }, { label: '自分にやらせてほしいと言う', value: false, small: '課長は不機嫌になる' }] });
    if (v) {
      c.todoTook = true; c.sess.C += 2; c.sess.E = (c.sess.E || 0) + 1; if (c.recorded) c.recordedAbuse = (c.recordedAbuse || 0) + 2;
      c.meter = (c.meter || 0) + 75;
      await G.talk([['', '（その夜、取調室の明かりは、午前1時過ぎまで消えなかった。）', { scene: { bg: 'interro' } }], ['', '（廊下まで、課長の声が聞こえた。）', { sfx: 'thud' }]]);
      if (c.meter >= 100) await onConfess(S, false, { by: 'todo' });
      else await G.talk([['todo', '……しぶとい奴だ。', { scene: sc('todo') }]]);
    } else {
      await G.talk([['todo', 'なら、満期までに結果を出せ。白井も外す。', { scene: sc('todo') }]]);
      K.loseStaff('shirai');
    }
    K.render();
  };
})();
