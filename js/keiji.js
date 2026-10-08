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
    C = caseDef; S = state;
    S.day = S.day || 0; S.tasks = S.tasks || []; S.docs = S.docs || []; S.done = S.done || {}; S.selfUsed = false;
    S.staffGone = S.staffGone || {}; S.flags = S.flags || {}; S.fin = S.fin || {};
    G.ui.tab = 'staff';
    return new Promise(res => { S._finish = res; K.morning(true); });
  };
  K.date = (d) => dateOf(C.base, d == null ? S.day : d);
  K.addDoc = function (d) {
    const ex = S.docs.find(x => x.id === d.id);
    if (ex) { Object.assign(ex, d, { isNew: true }); return ex; }
    d.isNew = true; S.docs.push(d); return d;
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
  function elemPanel() {
    const els = C.elements(S);
    return els.map(e => '<div class="elem"><span class="k">' + e.k + '</span><span class="boxes">'
      + [1, 2, 3].map(i => '<span class="bx' + (e.v >= i ? (e.conf ? ' conf' : ' on') : '') + '"></span>').join('')
      + '</span><span class="src">' + (e.src || '') + '</span></div>').join('');
  }

  K.render = function (hint) {
    const info = C.info(S);
    G.layout({ role: C.role, date: K.date(), info: info.text, clock: info.clock, scene: C.scene(S), hint: hint || '（今日の指示を出す。）',
      body: '<div class="row2"><div class="panel"><div class="ph"><span>捜査員</span></div>' + staffPanel() + '</div>'
        + '<div class="panel"><div class="ph"><span>' + (C.elemTitle || '立証すべき事実') + '</span><span>■=証拠 <span style="color:#b23a2e">■</span>=自白</span></div>' + elemPanel() + '</div></div>'
        + '<div class="desk"><div class="ph"><span>捜査記録</span><span>' + S.docs.length + '綴</span></div><div class="docs" id="docs"></div></div>' });
    renderDocs(); renderActs();
  };
  function renderDocs() {
    const el = G.$('#docs'); if (!el) return; el.innerHTML = '';
    S.docs.forEach(d => {
      const b = document.createElement('button');
      b.className = 'doc' + (d.isNew ? ' new' : '') + (d.kind === 'memo' ? ' memo' : '') + (d.kind === 'exc' ? ' exc' : '');
      b.textContent = d.title;
      b.onclick = () => { if (G.ui.talking) return; d.isNew = false; b.classList.remove('new'); G.openPaper({ title: d.title, sub: d.sub, body: typeof d.body === 'function' ? d.body(S) : d.body, stamps: d.stamps }); };
      el.appendChild(b);
    });
  }
  function renderActs() {
    const wrap = G.$('#acts-wrap'); if (!wrap) return;
    const tab = G.ui.tab;
    wrap.innerHTML = '<div class="tabs"><button class="tab' + (tab === 'staff' ? ' on' : '') + '" data-t="staff">部下に指示する</button><button class="tab' + (tab === 'self' ? ' on' : '') + '" data-t="self">自分で動く</button></div><div class="acts" id="acts"></div>'
      + '<button class="endday" id="endday">一日を終える<span class="s">' + C.endHint(S) + '</span></button>';
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
  }
  K.refresh = () => { renderDocs(); renderActs(); const p = document.querySelectorAll('.panel'); if (p[0]) p[0].innerHTML = '<div class="ph"><span>捜査員</span></div>' + staffPanel(); if (p[1]) { p[1].innerHTML = '<div class="ph"><span>' + (C.elemTitle || '立証すべき事実') + '</span><span>■=証拠 <span style="color:#b23a2e">■</span>=自白</span></div>' + elemPanel(); } };

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
      await G.talk([['', s.name + 'に「' + (a.short || a.label) + '」を指示した。' + (days ? '（' + days + '日）' : '')]]);
    } else {
      const r = a.run ? await a.run(S) : null;
      if (r === false) { K.render(); return; }   // 取りやめ
      if (a.once !== false) S.done[a.id] = true;
      S.fin[a.id] = true;
      if (!a.free) S.selfUsed = true;
      if (S._ended) return;
      K.render();
    }
  }
  async function finishTask(t, a) {
    S.fin[a.id] = true;
    const lines = a.done ? a.done(S) : [];
    if (lines && lines.length) { G.drawScene(C.scene(S)); await G.talk(lines); }
  }

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
    K.render('');
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
    const all = m.concat(lines).concat(C.after ? (C.after(S) || []) : []);
    K.refresh();
    if (all.length) await G.talk(all);
    if (S._ended) return;
    if (C.check) { const r = await C.check(S); if (r === 'end') return; }
    K.render();
  }
  K.end = function (result) { S._ended = true; const f = S._finish; S._finish = null; f && f(result); };
})();
