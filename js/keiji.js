'use strict';
/* ============================================================
   刑事編の進行：日付、部下への割り振り、自分の行動、書類
   ============================================================ */
(function () {
  const MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function dateOf(base, day) {
    let m = base.m, d = base.d + day;
    while (d > MD[m - 1]) { d -= MD[m - 1]; m = m % 12 + 1; }
    return m + '月' + d + '日';
  }

  const K = G.keiji = {};
  let C = null, S = null;
  K.state = () => S;

  K.start = function (caseDef, state) {
    // 行き詰まったとき：部下に記録を読み返してもらう（どの二つを並べるとよいか、だけを教えてくれる）
    if (caseDef.compare && caseDef.pick && !caseDef.actions.some(a => a && a.id === 'rereadHint')) caseDef.actions.push({ id: 'rereadHint', who: 'staff', days: 1, once: false, label: '捜査記録を読み返してもらう', short: '記録の読み返し', sub: '見落としがないか。並べて読むべき記録を教えてくれる',
      cond: S2 => G.diff() !== 'hard' && S2.docs.length >= 3 && !S2.tasks.some(t => t.aid === 'rereadHint'),
      done: S2 => {
        const open = Object.keys(caseDef.pick).filter(k => { const [x, y] = k.split('|'); return K.doc(x) && K.doc(y) && !(S2.compared || {})[k] && caseDef.compare(S2, x, y); });
        if (!open.length) return [['oka', '記録を全部読み返しました。……いまのところ、並べて気になるところは見当たりません。', { scene: { bg: 'office', who: 'oka' } }]];
        const [x, y] = open[Math.floor(Math.random() * open.length)].split('|');
        return [['oka', '記録を読み返しました。「' + K.doc(x).title + '」と「' + K.doc(y).title + '」。並べて読んでみてください。', { scene: { bg: 'office', who: 'oka' } }], ['oka', 'どこが、とまでは言えないんですが……どこか、引っかかるんです。']];
      } });
    if (caseDef.charges && !caseDef.actions.some(a => a && a.id === 'chargeSel')) caseDef.actions.unshift({ id: 'chargeSel', who: 'self', once: false, label: '罪名を決める', sub: '一日は使わない。決めると「立証すべき事実」が出る', cond: S2 => !S2.c.charge,
      run: async S2 => { await G.kit.chooseCharge(S2, caseDef, 'memo'); K.render(); return false; } });
    C = caseDef; S = state;
    if (G.diff() === 'hard' && !state.staffGone) state.staffGone = { noguchi: true };   // むずかしい：部下が一人少ない
    S.day = S.day || 0; S.tasks = S.tasks || []; S.docs = S.docs || []; S.done = S.done || {}; S.selfUsed = false;
    S.staffGone = S.staffGone || {}; S.flags = S.flags || {}; S.fin = S.fin || {};
    G.ui.tab = 'staff';
    return new Promise(res => { S._finish = res; K.morning(true); });
  };
  K.date = (d) => dateOf(C.base, d == null ? S.day : d);
  // 書類が届いたとき：机に置かれる演出（紙の音・知らせ）。まとめて届いたら、まとめて知らせる
  let arrived = [], arrT = null;
  const announce = title => { arrived.push(title); clearTimeout(arrT); arrT = setTimeout(() => { if (!arrived.length) return; G.audio.sfx('paper'); G.toast('捜査記録に綴じた：' + arrived.map(t => '「' + t + '」').join('')); arrived = []; }, 120); };
  K.addDoc = function (d) {
    const ex = S.docs.find(x => x.id === d.id);
    if (ex) { Object.assign(ex, d, { isNew: true, fresh: true }); announce(ex.title); return ex; }
    d.isNew = true; d.fresh = true; S.docs.push(d); announce(d.title); return d;
  };
  K.doc = id => S.docs.find(d => d.id === id);
  K.freeStaff = () => C.staff.filter(s => !S.staffGone[s.id] && !S.tasks.find(t => t.staff === s.id));
  K.loseStaff = id => { S.staffGone[id] = true; S.tasks = S.tasks.filter(t => t.staff !== id); };
  K.busy = aid => S.tasks.some(t => t.aid === aid);

  function staffPanel() {
    return C.staff.map(s => {
      const t = S.tasks.find(x => x.staff === s.id);
      const gone = S.staffGone[s.id];
      const st = gone ? '別件に回された' : t ? t.label + '（' + (t.doneDay - S.day <= 0 ? '今日中' : 'あと' + (t.doneDay - S.day) + '日') + '）' : '待機中';
      return '<div class="staff' + (gone ? ' gone' : t ? '' : ' free') + '"><span class="nm">' + s.name + '</span><span class="st">' + st + '</span></div>';
    }).join('') + '<div class="staff' + (S.selfUsed ? '' : ' free') + '"><span class="nm">あなた</span><span class="st">' + (S.selfUsed ? '今日の行動は済んだ' : '動ける') + '</span></div>';
  }
  K.C = () => C;
  function elemPanel() {
    if (C.charges && !S.c.charge) return (C.gauge && G.diff() !== 'hard' ? C.gauge(S) : '') + '<div class="elem" style="color:#8c8578;font-size:12px;line-height:1.6">（罪名がまだ決まっていない。逮捕状を請求するとき、または送致するときに、罪名を決める。立証すべき事実は、罪名によって変わる。）</div>';
    const chs = C.charges && C.charges.find(x => x.id === S.c.charge);
    const els = chs && chs.els ? chs.els(S, C.elements(S)) : C.elements(S);
    const gz = C.gauge && G.diff() !== 'hard' ? C.gauge(S) : '';
    return gz + els.map(e => '<div class="elem"><span class="k">' + e.k + '</span><span class="boxes">'
      + [1, 2, 3].map(i => '<span class="bx' + (e.v >= i ? (e.conf ? ' conf' : ' on') : '') + '"></span>').join('')
      + '</span><span class="src">' + (e.src || '') + '</span></div>').join('');
  }

  K.render = function (hint) {
    if (S && S._closed) return;
    // 指示を出す画面（自分の机）では、刑事部屋の音を
    if (C && C.scene && (C.scene(S) || {}).bg === 'office' && G.audio.ambientKind && G.audio.ambientKind() !== 'office') G.audio.ambient('office');
    const info = C.info(S);
    G.layout({ role: C.role, date: K.date(), info: info.text, clock: info.clock, scene: C.scene(S), hint: hint || '（今日の指示を出す。）',
      body: '<div class="row2"><div class="panel"><div class="ph"><span>捜査員</span></div>' + staffPanel() + '</div>'
        + '<div class="panel"><div class="ph"><span>' + (C.elemTitle || '立証すべき事実') + '</span><span>■=証拠 <span style="color:#b23a2e">■</span>=自白</span></div>' + elemPanel() + '</div></div>'
        + '<div class="desk"><div class="ph"><span>捜査記録　' + S.docs.length + '綴</span></div><div class="docs" id="docs"></div></div>' });
    renderDocs(); acts();
  };
  function renderDocs() {
    const el = G.$('#docs'); if (!el) return; el.innerHTML = '';
    S.docs.forEach(d => {
      const b = document.createElement('button');
      b.className = 'doc' + (d.isNew ? ' new' : '') + (d.fresh ? ' arrive' : '') + (d.kind === 'memo' ? ' memo' : '') ; d.fresh = false;
      b.textContent = d.title;
      b.onclick = async () => {
        if (G.ui.talking) return;
        d.isNew = false; b.classList.remove('new');
        if (C.compare) G.meta.tips = G.meta.tips || {}, (!G.meta.tips.docs && (G.meta.tips.docs = true, G.saveMeta(), G.toast('記録の下の「横に並べる」で、別の記録と見比べられる')));
        const others = S.docs.filter(x => x.id !== d.id);
        const v = await G.openPaper({ title: d.title, sub: d.sub, body: typeof d.body === 'function' ? d.body(S) : d.body, stamps: d.stamps,
          buttons: C.compare && others.length ? [{ label: '横に並べる', value: 'cmp', small: '別の記録と見比べる' }] : [] });
        if (v !== 'cmp') return;
        const o = await G.openPaper({ title: '並べる記録を選ぶ', sub: '「' + d.title + '」の横に置く', body: '', buttons: others.map(x => ({ label: x.title, value: x.id })) });
        if (o) compareWith(d.id, o);
      };
      el.appendChild(b);
    });
  }
  async function compareWith(a, b) {
    S.compared = S.compared || {};
    const key = [a, b].sort().join('|');
    const r = await compareView(a, b);
    if (!r) { K.render(); return; }
    if (r.miss) {
      // 外れた指摘も、捜査メモとして残る（課長や検事も目を通す）
      S.c.missPoints = (S.c.missPoints || 0) + 1;
      K.addDoc({ id: 'miss_' + S.c.missPoints, title: '捜査メモ：照合' + S.c.missPoints, kind: 'memo', body: G.P('「' + K.doc(a).title + '」の「' + r.miss[0].slice(0, 60) + '」と、「' + K.doc(b).title + '」の「' + r.miss[1].slice(0, 60) + '」を照らし合わせた。') });
      K.render(); return;
    }
    S.compared[key] = true;
    await G.talk(r.lines);
    if (r.memo) K.addDoc({ id: 'memo_' + key, title: '捜査メモ：' + r.memo.title, kind: 'memo', body: G.P(r.memo.text) });
    if (r.then) r.then(S);
    K.render();
  }
  /* 二枚の記録を並べ、それぞれから一か所ずつ選んで照らし合わせる */
  function compareView(a, b) {
    const da = K.doc(a), db = K.doc(b), ov = G.$('#overlay');
    const body = d => typeof d.body === 'function' ? d.body(S) : d.body;
    const key = [a, b].sort().join('|');
    ov.innerHTML = '<div class="cmpv"><div class="cmpp">' + [da, db].map((d, i) => '<div class="paper" data-i="' + i + '"><div class="paper-h">' + d.title + '</div><div class="paper-b">' + body(d) + '</div></div>').join('') + '</div>'
      + '<div class="cmpbar"><div class="cmpmsg" id="cmpmsg">それぞれの記録から、照らし合わせたい記載を一か所ずつ選ぶ。</div><div class="paper-f"><button class="pbtn green" id="cmpgo" disabled>食い違い・つながりとして記録する</button><button class="pbtn" id="cmpx">閉じる</button></div></div></div>';
    const picks = [null, null];
    // 照らし合わせる価値のある記載に、うすく下線を引く（どれとどれが対になるかは、自分で見つける）
    const res = id => { const out = []; Object.entries(C.pick || {}).forEach(([k, rr]) => { const [x, y] = k.split('|'); if ((x === id || y === id) && K.doc(x) && K.doc(y)) out.push(...rr); }); return out; };
    const cand = G.diff() === 'hard' ? [[], []] : [res(a), res(b)];
    ov.querySelectorAll('.cmpp .paper').forEach(pp => {
      const i = +pp.dataset.i;
      pp.querySelectorAll('.paper-b p, .paper-b td, .paper-b li').forEach(u => {
        if (u.querySelector('p, td, li')) return;
        u.classList.add('u'); if (cand[i].some(r => r.test(u.textContent))) u.classList.add('cand');
        u.onclick = () => { pp.querySelectorAll('.u.pick').forEach(x => x.classList.remove('pick')); u.classList.add('pick'); picks[i] = u.textContent; G.audio.sfx('click'); G.$('#cmpgo').disabled = !(picks[0] && picks[1]); };
      });
    });
    ov.onclick = null; ov.hidden = false; ov.scrollTop = 0; G.audio.sfx('paper');
    return new Promise(done => {
      G.$('#cmpx').onclick = () => { G.closePaper(); done(null); };
      G.$('#cmpgo').onclick = () => {
        const r = C.compare(S, a, b), msg = G.$('#cmpmsg');
        const pk = r && (r.pick || (C.pick || {})[key]);
        const hit = r && (!pk || (pk[0].test(picks[0]) && pk[1].test(picks[1])) || (pk[0].test(picks[1]) && pk[1].test(picks[0])));
        if (hit && S.compared[key]) { msg.textContent = '（この二つは、もう照らし合わせた。捜査メモに残っている。）'; return; }
        if (!hit) { G.audio.sfx('type'); G.closePaper(); done({ miss: picks.slice() }); return; }
        G.audio.sfx('stamp'); G.closePaper(); done(r);
      };
    });
  }
  function renderActs() {
    if (S && S._closed) return;
    const wrap = G.$('#acts-wrap'); if (!wrap) return;
    const tab = G.ui.tab;
    wrap.innerHTML = '<div class="tabs"><button class="tab' + (tab === 'staff' ? ' on' : '') + '" data-t="staff">部下に指示する</button><button class="tab' + (tab === 'self' ? ' on' : '') + '" data-t="self">自分で動く</button></div><div class="acts" id="acts"></div>'
      + '<button class="endday" id="endday">一日を終える<span class="s">' + C.endHint(S) + '</span></button>'
      + (nextReport() ? '<button class="endday skip" id="skip">' + skipLabel() + '<span class="s">' + nextReport() + '日後。その間に起きたことがあれば、そこで止まる</span></button>' : '');
    wrap.querySelectorAll('.tab').forEach(t => t.onclick = () => { G.ui.tab = t.dataset.t; G.audio.sfx('click'); renderActs(); });
    const acts = G.$('#acts');
    const list = C.actions.filter(a => a.who === tab && (!a.cond || a.cond(S)) && !(a.once !== false && S.done[a.id]));
    if (!list.length) acts.innerHTML = '<div style="font-size:12px;color:#777;padding:6px">（いまできることはない）</div>';
    const free = K.freeStaff().length;
    list.forEach(a => {
      const b = document.createElement('button');
      b.className = 'act' + (a.primary ? ' primary' : '');
      const days = typeof a.days === 'function' ? a.days(S) : a.days;
      const running = K.busy(a.id);
      let dis = running || (tab === 'staff' && !free) || (tab === 'self' && S.selfUsed && !a.free);
      b.innerHTML = '<span class="l">' + a.label + (a.risk ? '<span class="risk">注意</span>' : '') + '</span><span class="s">' + (running ? '進行中' : (typeof a.sub === 'function' ? a.sub(S) : a.sub) || '') + '</span>'
        + (days != null && tab === 'staff' ? '<span class="d">' + (days === 0 ? '即日' : days + '日') + '</span>' : '');
      b.disabled = dis;
      b.onclick = () => K.doAction(a);
      acts.appendChild(b);
    });
    G.$('#endday').onclick = () => K.endDay();
    if (G.$('#skip')) G.$('#skip').onclick = () => K.skip();
  }
  const acts = () => { if (C.actsOverride && C.actsOverride(S, G.$('#acts-wrap'))) return; renderActs(); };
  K.refresh = () => { if (S && S._closed) return; renderDocs(); acts(); const p = document.querySelectorAll('.panel'); if (p[0]) p[0].innerHTML = '<div class="ph"><span>捜査員</span></div>' + staffPanel(); if (p[1]) { p[1].innerHTML = '<div class="ph"><span>' + (C.elemTitle || '立証すべき事実') + '</span><span>■=証拠 <span style="color:#b23a2e">■</span>=自白</span></div>' + elemPanel(); } };

  K.doAction = async function (a) {
    if (G.ui.talking || G.ui.busy) return;
    G.ui.busy = true;
    try { await doAction(a); } finally { G.ui.busy = false; }
  };
  async function doAction(a) {
    if (a.risk && !(await G.confirmRisk(typeof a.risk === 'function' ? a.risk(S) : a.risk))) return;
    G.audio.sfx('click');
    if (a.who === 'staff') {
      const s = K.freeStaff()[0]; if (!s) return;
      const days = typeof a.days === 'function' ? a.days(S) : a.days;
      if (a.once !== false) S.done[a.id] = true;
      const t = { aid: a.id, staff: s.id, label: a.short || a.label, doneDay: S.day + days };
      if (a.start) { const r = a.start(S); if (r === false) { delete S.done[a.id]; return; } }
      if (days === 0) { await finishTask(t, a); K.render(); return; }
      S.tasks.push(t);
      K.refresh();
      G.toast(s.name + 'に「' + (a.short || a.label) + '」を指示した（' + days + '日）');
    } else {
      const lab = typeof a.label === 'function' ? a.label(S) : (a.label || '');
      if (/任意で話を聴く/.test(lab)) await G.tip('ninni', [['shirai', '主任。逮捕する前の*任意*の聴取は、*録画の義務*はありません。相手は、いつでも席を立って帰れます。', { scene: { bg: 'office', who: 'shirai' } }], ['shirai', '……ここで無理をすると、あとで「任意じゃなかった」と言われます。まあ、覚えておいてください。']]);
      if (/取り調べる/.test(lab) && S.c.arrest != null) await G.tip('interro', [['shirai', '取調べの前には、必ず*黙秘権*を告げてください（刑訴法198条2項）。言いたくないことは言わなくていい、と。', { scene: { bg: 'office', who: 'shirai' } }], ['shirai', '罪名によっては、ここからの取調べは全部*録画*されます。されない罪名もある。……どっちにしても、調書に書いたことは法廷で読まれます。']]);
      const r = a.run ? await a.run(S) : null;
      if (/を逮捕する/.test(lab) && S.c.arrest != null) await G.tip('arrest', [['shirai', '逮捕しました。ここから時計が動きます。*48時間*以内に検察官へ送致、検察官は*24時間*以内に勾留を請求します。', { scene: { bg: 'office', who: 'shirai' } }], ['shirai', '*勾留*は10日、延長しても最大でもう10日。全部で*23日*。その間に、起訴できるだけの記録をそろえる。……長いようで、短いですよ。']]);
      if (r === false) { K.render(); return; }   // 取りやめ
      if (a.once !== false) S.done[a.id] = true;
      S.fin[a.id] = true;
      if (!a.free) { S.selfUsed = true; G.clock = { h: Math.min(19, (G.clock ? G.clock.h : 9) + 2 + (Math.random() < .5 ? 1 : 0)), m: [0, 10, 20, 30, 40, 50][Math.floor(Math.random() * 6)] }; }
      if (S._ended) return;
      K.render();
    }
  }
  async function finishTask(t, a) {
    S.fin[a.id] = true;
    const lines = a.done ? a.done(S) : [];
    if (lines && lines.length) { G.drawScene(C.scene(S)); await G.talk(lines); }
  }

  function nextReport() {
    const t = S.tasks.length ? Math.min(...S.tasks.map(x => x.doneDay)) - S.day : Infinity;
    const m = C.nextMilestone ? C.nextMilestone(S) : null;
    const md = m ? m.d : Infinity;
    const d = Math.min(t, md);
    if (d === Infinity || d < 2) return 0;
    return d;
  }
  function skipLabel() {
    const t = S.tasks.length ? Math.min(...S.tasks.map(x => x.doneDay)) - S.day : Infinity;
    const m = C.nextMilestone ? C.nextMilestone(S) : null;
    return (m && m.d <= t) ? '次の節目（' + m.label + '）まで進める' : '次の報告が届くまで進める';
  }
  K.skip = async function () {
    if (G.ui.talking || G.ui.busy) return;
    G.ui.busy = true;
    try {
      const from = S.day; let lines = [];
      for (let i = 0; i < 40; i++) {
        S.day++; S.selfUsed = false;
        lines = collect(false);
        if (lines.length || (C.stopSkip && C.stopSkip(S))) break;
      }
      G.audio.sfx('steps');
      await G.curtain([{ html: '<div class="big">' + K.date() + '</div><div class="small">' + (S.day - from) + '日が過ぎた　' + C.info(S).text + '</div>', wait: 600 }], { delay: 200 });
      K.render('');
      if (lines.length) await G.talk(lines);
      if (S._ended) return;
      if (C.check) { const r = await C.check(S); if (r === 'end') return; }
      K.render();
    } finally { G.ui.busy = false; }
  };
  K.endDay = async function () {
    if (G.ui.talking || G.ui.busy) return;
    G.ui.busy = true;
    if (C.beforeEndDay) { const r = await C.beforeEndDay(S); if (r === false) { G.ui.busy = false; return; } }
    S.day++; S.selfUsed = false;
    G.audio.sfx('steps');
    if (C.dayCard) await G.curtain([{ html: '<div class="big">' + K.date() + '</div><div class="small">' + C.info(S).text + '</div>', wait: 500 }], { delay: 200 });
    K.morning(false);
  };
  K.morning = async function (first) {
    G.ui.busy = true;
    try { await morning(first); } finally { G.ui.busy = false; }
  };
  async function morning(first) {
    G.clock = { h: 8, m: 30 };
    K.render('');
    const all = collect(first);
    K.refresh();
    if (all.length) await G.talk(all);
    if (S._ended) return;
    if (C.check) { const r = await C.check(S); if (r === 'end') return; }
    K.render();
  }
  function collect(first) {
    const lines = [];
    // 完了した捜査
    const due = S.tasks.filter(t => t.doneDay <= S.day);
    S.tasks = S.tasks.filter(t => t.doneDay > S.day);
    for (const t of due) {
      const a = C.actions.find(x => x.id === t.aid);
      S.fin[t.aid] = true;
      const ls = a && a.done ? a.done(S) : [];
      const s = C.staff.find(x => x.id === t.staff);
      lines.push(['', '（' + (s ? s.name : '') + 'が「' + t.label + '」を終えて戻った。）']);
      (ls || []).forEach(l => lines.push(l));
    }
    const m = C.morning(S, first) || [];
    return m.concat(lines).concat(C.after ? (C.after(S) || []) : []);
  }
  // 事件が終わったあとは、この画面を描き直さない（次の画面＝検察・公判を上書きしないように）
  K.abort = () => { if (S) { S._ended = true; S._closed = true; S._finish = null; } if (C) C.actsOverride = null; };
  K.end = function (result) { S._ended = true; S._closed = true; const f = S._finish; S._finish = null; f && f(result); };
})();
