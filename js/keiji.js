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
        const seen = new Set((S2.cmpNotes || []).map(n => n.title));
        const open = Object.keys(caseDef.pick).filter(k => { const [x, y] = k.split('|'); if (!K.doc(x) || !K.doc(y) || (S2.compared || {})[k]) return false; const r = caseDef.compare(S2, x, y); return r && !(r.memo && seen.has(r.memo.title)); });
        if (!open.length) return [['oka', '記録を全部読み返しました。……いまのところ、並べて気になるところは見当たりません。', { scene: { bg: 'office', who: 'oka' } }]];
        const [x, y] = open[Math.floor(Math.random() * open.length)].split('|');
        S2.hl = [x, y];   // 机の上で、二つの記録を光らせる（並べるまで）
        return [['oka', '記録を読み返しました。「' + K.doc(x).title + '」と「' + K.doc(y).title + '」。並べて読んでみてください。', { scene: { bg: 'office', who: 'oka' } }], ['oka', 'どこが、とまでは言えないんですが……どこか、引っかかるんです。']];
      } });
    // 満期を待たずに、記録を送って捜査を終える
    if (caseDef.finishNow && !caseDef.actions.some(a => a && a.id === 'sendNow')) caseDef.actions.push({ id: 'sendNow', who: 'self', once: false, label: '捜査を切り上げ、記録を検察官に送る', sub: '満期を待たずに、起訴するかどうかの判断を求める',
      cond: S2 => G.kit.inCustody(S2) && G.kit.custodyDay(S2) >= 3,
      run: async S2 => {
        const v = await G.openPaper({ title: '記録を検察官に送る', sub: '捜査を終える', noClose: true, body: G.P('ここで捜査を切り上げ、集めた記録を検察官に送る。送った後は、もう捜査はできない。', '満期まで、あと' + (G.kit.LIMIT - G.kit.custodyDay(S2)) + '日ある。') + (caseDef.gauge && G.diff() !== 'hard' ? caseDef.gauge(S2) : ''),
          buttons: [{ label: '送る', value: true, cls: 'green' }, { label: 'まだ続ける', value: false }] });
        if (!v) return false;
        await caseDef.finishNow(S2); return false;
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
  // 被疑者の候補：浮かんだ人物と、分かったこと（◯疑わしい点／×疑わしくない点）。追う人物を自分で決める
  function peoplePanel() {
    if (!C.people) return '';
    const ps = C.people(S); if (!ps.length) return '';
    const can = !C.canTarget || C.canTarget(S);
    return '<div class="people" id="people"><div class="ph"><span>被疑者の候補</span><span class="pp-h">◯疑わしい点　×疑わしくない点（数が多いほど強い）</span></div><div class="pcards">'
      + ps.map(p => '<div class="pcard' + (S.c.target === p.id ? ' on' : '') + '"><div class="pc-h"><b>' + p.name + '</b><small>' + p.sub + '</small>' + (S.c.target === p.id ? '<span class="pc-t">追っている</span>' : '') + '</div>'
        + '<ul>' + p.facts.map(f => '<li class="' + (f[0] === true ? 'pf-y' : f[0] === false ? 'pf-n' : 'pf-q') + '"><span class="pf-s">' + (f[0] == null ? '・' : (f[0] ? '◯' : '×').repeat(f[2] || 1)) + '</span>' + f[1] + '</li>').join('') + '</ul>'
        + (can && S.c.target !== p.id ? '<button class="pc-b" data-p="' + p.id + '">この人物を被疑者として追う</button>' : '') + '</div>').join('')
      + '</div>' + (!S.c.target && C.setTarget ? '<div class="pp-n">逮捕状を請求するには、追う人物を決める。決めた後も、逮捕状を請求するまでは変えられる。</div>' : '') + '</div>';
  }
  function bindPeople() {
    document.querySelectorAll('.pc-b').forEach(b => b.onclick = async () => {
      if (G.ui.talking || G.ui.busy) return; G.ui.busy = true; G.audio.sfx('select');
      try { await C.setTarget(S, b.dataset.p); } finally { G.ui.busy = false; }
      K.render(); K.idle();
    });
  }
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
      body: '<div id="goal-wrap">' + G.guide.panel(S, C) + '</div>'
        + '<div id="people-wrap">' + peoplePanel() + '</div>'
        + '<div class="desk" id="desk"><div class="ph"><span>捜査記録　' + S.docs.length + '綴</span><span class="dh">タップで開く</span></div><div id="docs"></div></div>',
      after: '<div class="row2"><div class="panel" id="p-staff"><div class="ph"><span>捜査員</span></div>' + staffPanel() + '</div>'
        + '<div class="panel" id="p-elem"><div class="ph"><span>' + (C.elemTitle || '立証すべき事実') + '</span><span>■=証拠 <span style="color:#b23a2e">■</span>=自白</span></div>' + elemPanel() + '</div></div>' });
    G.guide.bindPanel(); bindPeople(); renderDocs(); acts();
  };
  // 机の上の記録：種類ごとの束に分ける（束は開け閉めできる。未読や光っている記録がある束は開く）
  const GROUPS = [
    ['say', '供述・弁解', d => /供述|弁解|話|証言|メッセージ/.test(d.title) && d.kind !== 'memo'],
    ['rep', '捜査報告・鑑定', d => d.kind !== 'memo' && !/令状|許可状|勾留状|請求書|逮捕状/.test(d.title)],
    ['form', '令状・請求書', d => /令状|許可状|勾留状|請求書|逮捕状/.test(d.title)],
    ['memo', 'メモ・資料', d => true]
  ];
  const groupOf = d => GROUPS.find(g => g[2](d))[0];
  function renderDocs() {
    const el = G.$('#docs'); if (!el) return; el.innerHTML = '';
    S.deskOpen = S.deskOpen || { say: true, rep: true };
    if (S.hl && (S.compared || {})[S.hl.slice().sort().join('|')]) S.hl = null;   // 並べ終えた組は光らせない
    const hl = S.hl || [];
    GROUPS.forEach(([gid, gname]) => {
      const ds = S.docs.filter(d => groupOf(d) === gid); if (!ds.length) return;
      const hot = ds.some(d => d.isNew || hl.includes(d.id));
      const open = S.deskOpen[gid] || hot;
      const sec = document.createElement('div'); sec.className = 'dgrp' + (open ? ' open' : '');
      sec.innerHTML = '<button class="dgh"><span>' + (open ? '▾' : '▸') + ' ' + gname + '</span><span>' + ds.length + '綴' + (ds.some(d => d.isNew) ? '　<span class="newb">新</span>' : '') + '</span></button><div class="docs"></div>';
      sec.querySelector('.dgh').onclick = () => { S.deskOpen[gid] = !open; G.audio.sfx('click'); renderDocs(); };
      el.appendChild(sec);
      if (!open) return;
      const box = sec.querySelector('.docs');
      ds.forEach(d => box.appendChild(docButton(d, hl)));
    });
  }
  function docButton(d, hl) {
      const b = document.createElement('button');
      b.className = 'doc' + (d.isNew ? ' new' : '') + (d.fresh ? ' arrive' : '') + (d.kind === 'memo' ? ' memo' : '') + (hl.includes(d.id) ? ' hl' : ''); d.fresh = false;
      b.textContent = d.title;
      b.onclick = async () => {
        if (G.ui.talking) return;
        d.isNew = false; b.classList.remove('new');
        const others = S.docs.filter(x => x.id !== d.id);
        const partner = hl.includes(d.id) ? hl.find(x => x !== d.id) : null;
        const btns = [];
        if (C.compare && partner && K.doc(partner)) btns.push({ label: '「' + K.doc(partner).title + '」と並べる', value: 'hl', cls: 'green', small: '岡が言っていた組み合わせ' });
        if (C.compare && others.length) btns.push({ label: '横に並べる', value: 'cmp', small: '別の記録と見比べる（照らし合わせ）' });
        const v = await G.openPaper({ title: d.title, sub: d.sub, body: typeof d.body === 'function' ? d.body(S) : d.body, stamps: d.stamps, buttons: btns });
        if (!v) { K.refresh(); return; }
        if (v === 'hl') { compareWith(d.id, partner); return; }
        const o = await G.openPaper({ title: '並べる記録を選ぶ', sub: '「' + d.title + '」の横に置く', body: '', buttons: others.map(x => ({ label: x.title, value: x.id })) });
        if (o) compareWith(d.id, o); else K.refresh();
      };
      return b;
  }
  /* 照らし合わせの記録：見つけたこと（食い違い・つながり・一致）を一冊のメモに書き足していく */
  K.notes = () => (S.cmpNotes = S.cmpNotes || []);
  function noteBook() {
    const ns = K.notes(); if (!ns.length) return;
    K.addDoc({ id: 'cmpbook', title: '照らし合わせの記録', kind: 'memo', body: () => K.notes().map((n, i) => '<p class="cn ' + n.kind + '"><b>' + (i + 1) + '．' + n.title + '</b><br>' + n.text + '</p>').join('') });
  }
  K.addNote = (title, text, kind) => { if (K.notes().some(n => n.title === title)) return false; K.notes().push({ title, text, kind: kind || 'hit' }); noteBook(); return true; };
  // 記載の一致を見るための語（漢字・カタカナの語、数字と単位）。どの記録にも出るありふれた語は除く
  const STOP = new Set(['被疑者', '被害者', '事件', '確認', '記録', '供述', '午前', '午後', '当日', '本件', '結果', '報告', '以下', '同人', '自分', '捜査', '警察', '男性', '女性']);
  const toks = t => new Set((String(t).match(/[一-龥々]{2,}|[ァ-ヴー]{2,}|[0-9０-９]+(?:時|分|番|号|円|万円|日|月|年|cm|点|km|m|歳|枚|個|件)/g) || []).filter(w => !STOP.has(w)));
  function overlap(p, q) {
    const A = toks(p), B = toks(q), sh = [...A].filter(w => B.has(w) || [...B].some(v => v.length >= 3 && (v.includes(w) || w.includes(v)) && Math.min(v.length, w.length) >= 3));
    const score = sh.reduce((n, w) => n + Math.min(w.length, 6), 0);
    return { sh, ok: score >= 6 && sh.length >= 2 };
  }
  async function compareWith(a, b) {
    S.compared = S.compared || {};
    const key = [a, b].sort().join('|');
    const r = await compareView(a, b);
    if (!r) { K.render(); return; }
    if (r.misses) S.c.missPoints = (S.c.missPoints || 0) + r.misses.length;   // 数えるだけ（記録には残さない）
    if (r.miss) { K.render(); return; }
    if (r.match) {
      await G.talk([['oka', '「' + r.match.slice(0, 3).join('」「') + '」。……どちらの記録でも、記載が一致しますね。', { scene: { bg: 'office', who: 'oka' } }]]);
      K.addNote('記載の一致：「' + K.doc(a).title + '」と「' + K.doc(b).title + '」', '「' + r.picks[0].slice(0, 50) + '」と「' + r.picks[1].slice(0, 50) + '」。' + r.match.slice(0, 3).join('・') + 'の記載が一致する。', 'match');
      K.render(); return;
    }
    S.compared[key] = true;
    await G.talk(r.lines);
    const memo = r.memo || { title: '「' + K.doc(a).title + '」と「' + K.doc(b).title + '」', text: r.lines.filter(l => !l[0]).map(l => l[1].replace(/^（|）$/g, '')).join(' ') };
    K.addNote(memo.title, memo.text, 'hit');
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
    const picks = [null, null], misses = [];
    // 照らし合わせる価値のある記載に、うすく下線を引く（どれとどれが対になるかは、自分で見つける）
    const res = id => { const out = []; Object.entries(C.pick || {}).forEach(([k, rr]) => { const [x, y] = k.split('|'); if ((x === id || y === id) && K.doc(x) && K.doc(y)) out.push(...rr); }); return out; };
    const cand = G.diff() === 'hard' ? [[], []] : [res(a), res(b)];
    ov.querySelectorAll('.cmpp .paper').forEach(pp => {
      const i = +pp.dataset.i;
      pp.querySelectorAll('.paper-b p, .paper-b td, .paper-b li').forEach(u => {
        if (u.querySelector('p, td, li')) return;
        u.classList.add('u'); if (cand[i].some(r => r.test(u.textContent))) u.classList.add('cand');
        // 表の一行は、見出しと中身をあわせて一つの記載として読む
        const text = () => { const tr = u.closest('tr'); return tr ? tr.textContent : u.textContent; };
        u.onclick = () => { pp.querySelectorAll('.u.pick').forEach(x => x.classList.remove('pick')); u.classList.add('pick'); picks[i] = text(); G.audio.sfx('click'); G.$('#cmpgo').disabled = !(picks[0] && picks[1]); };
      });
    });
    ov.onclick = null; ov.hidden = false; ov.scrollTop = 0; G.audio.sfx('paper');
    setTimeout(() => G.guide.compareView(), 60);
    return new Promise(done => {
      G.$('#cmpx').onclick = () => { G.closePaper(); done(misses.length ? { miss: misses[misses.length - 1], misses } : null); };
      G.$('#cmpgo').onclick = () => {
        const r = C.compare(S, a, b), msg = G.$('#cmpmsg');
        const pk = r && (r.pick || (C.pick || {})[key]);
        const hit = r && (!pk || (pk[0].test(picks[0]) && pk[1].test(picks[1])) || (pk[0].test(picks[1]) && pk[1].test(picks[0])));
        const clear = () => { ov.querySelectorAll('.u.pick').forEach(x => x.classList.remove('pick')); picks[0] = picks[1] = null; G.$('#cmpgo').disabled = true; };
        if (hit && S.compared[key]) { msg.innerHTML = '<span class="cmpok">記録済み</span>この二つは、もう照らし合わせた（「照らし合わせの記録」にある）。'; clear(); return; }
        if (!hit) {
          // 文面の上で明らかにつながる記載（同じ場所・番号・物など）は、一致として認める
          const ov2 = overlap(picks[0], picks[1]);
          if (ov2.ok) { G.audio.sfx('stamp'); msg.innerHTML = '<span class="cmpok">一致</span>「' + ov2.sh.slice(0, 3).join('」「') + '」の記載が一致する。'; const pk2 = picks.slice(); setTimeout(() => { G.closePaper(); done({ match: ov2.sh, picks: pk2, misses }); }, 900); return; }
          G.audio.sfx('type'); misses.push(picks.slice());
          msg.innerHTML = '<span class="cmpno">つながらない</span>この二か所からは、何も見えてこない。別の一文を選び直してもよい。';
          clear(); return;
        }
        G.audio.sfx('stamp'); msg.innerHTML = '<span class="cmpok">つながった</span>' + (r.memo ? r.memo.title : '気づいたことがある。');
        setTimeout(() => { G.closePaper(); done(Object.assign({}, r, { misses })); }, 900);
      };
    });
  }
  function renderActs() {
    if (S && S._closed) return;
    const wrap = G.$('#acts-wrap'); if (!wrap) return;
    const tab = G.ui.tab;
    wrap.innerHTML = '<div class="sstrip">' + C.staff.map(st => { const t = S.tasks.find(x => x.staff === st.id), gone = S.staffGone[st.id]; return '<span class="' + (gone ? 'g' : t ? 'b' : 'f') + '">' + st.name + '：' + (gone ? '不在' : t ? 'あと' + Math.max(0, t.doneDay - S.day) + '日' : '待機') + '</span>'; }).join('') + '<span class="' + (S.selfUsed ? 'b' : 'f') + '">あなた：' + (S.selfUsed ? '済' : '動ける') + '</span></div><div class="tabs"><button class="tab' + (tab === 'staff' ? ' on' : '') + '" data-t="staff">部下に指示する</button><button class="tab' + (tab === 'self' ? ' on' : '') + '" data-t="self">自分で動く</button></div><div class="acts" id="acts"></div>'
      + '<button class="endday" id="endday">一日を終える<span class="s">' + C.endHint(S) + '</span></button>'
      + (nextReport() ? '<button class="endday skip" id="skip">' + skipLabel() + '<span class="s">' + nextReport() + '日後まで一気に進む。その間、あなたは動けない（途中で何か起きれば止まる）</span></button>' : '');
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
      b.innerHTML = '<span class="l">' + (typeof a.label === 'function' ? a.label(S) : a.label) + (a.risk && G.diff() === 'easy' ? '<span class="risk">注意</span>' : '') + '</span><span class="s">' + (running ? '進行中' : (typeof a.sub === 'function' ? a.sub(S) : a.sub) || '') + '</span>'
        + (days != null && tab === 'staff' ? '<span class="d">' + (days === 0 ? '即日' : days + '日') + '</span>' : '');
      b.disabled = dis;
      b.onclick = () => K.doAction(a);
      // ？：この行動の説明（押せない行動でも読める）
      const w = document.createElement('div'); w.className = 'actw';
      const q = document.createElement('button'); q.className = 'q'; q.textContent = '？'; q.title = '説明';
      q.onclick = e => { e.stopPropagation(); if (G.ui.talking) return; G.audio.sfx('click'); G.guide.help(a, S, C); };
      w.appendChild(b); w.appendChild(q); acts.appendChild(w);
    });
    G.$('#endday').onclick = () => K.endDay();
    if (G.$('#skip')) G.$('#skip').onclick = () => K.skip();
  }
  const acts = () => { if (C.actsOverride && C.actsOverride(S, G.$('#acts-wrap'))) return; renderActs(); };
  K.refresh = () => { if (S && S._closed) return; const gw = G.$('#goal-wrap'); if (gw) { gw.innerHTML = G.guide.panel(S, C); G.guide.bindPanel(); } const pw = G.$('#people-wrap'); if (pw) { pw.innerHTML = peoplePanel(); bindPeople(); } renderDocs(); acts(); const p = [G.$('#p-staff'), G.$('#p-elem')]; if (p[0]) p[0].innerHTML = '<div class="ph"><span>捜査員</span></div>' + staffPanel(); if (p[1]) { p[1].innerHTML = '<div class="ph"><span>' + (C.elemTitle || '立証すべき事実') + '</span><span>■=証拠 <span style="color:#b23a2e">■</span>=自白</span></div>' + elemPanel(); } };

  K.doAction = async function (a) {
    if (G.ui.talking || G.ui.busy) return;
    G.ui.busy = true;
    try { await doAction(a); if (!S._ended) { const l = lures(); if (l.length) { await G.talk(l); K.render(); } } } finally { G.ui.busy = false; }
    K.idle();
  };
  async function doAction(a) {
    if (a.risk && !(await G.confirmRisk(typeof a.risk === 'function' ? a.risk(S) : a.risk))) return;
    // 実務家：根拠条文を自分で引く（序章を除く）
    if (G.diff() === 'hard' && C.id !== 'akisu' && G.citeLaw) {
      const lab0 = typeof a.label === 'function' ? a.label(S) : (a.label || '');
      const need = G.lawNeed(lab0);
      S.cited = S.cited || {}; S.citeNo = S.citeNo || {};
      if (need && !S.cited[need.k]) {
        if (S.citeNo[need.k] === S.day) { G.toast('根拠が差し戻されたばかり。この種類の行動は、明日まで出せない'); return; }
        await G.tip('cite', [['todo', '主任。うちの係じゃ、何をするにも根拠を言え。*どの条文で*それをやるのか、だ。', { scene: { bg: 'kacho', who: 'todo' } }], ['todo', '条文帳を開いて、根拠になる条文を自分で選べ。間違えたら差し戻す。その日はもう同じことはさせない。']]);
        const ok = await G.citeLaw(need);
        if (ok === null) { K.render(); return; }
        if (!ok) { S.citeNo[need.k] = S.day; G.audio.sfx('paper'); await G.talk([['todo', '……その条文じゃ通らない。根拠を確かめてから出直せ。', { scene: { bg: 'kacho', who: 'todo' } }]]); K.render(); return; }
        S.cited[need.k] = true; G.toast('根拠を確認した');
      }
    }
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
    K.idle();
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
    K.idle();
  };
  // 手が空いたとき：はじめての画面・機能を指し示して説明する（一度だけ）
  let coaching = false;
  K.idle = async function () {
    if (coaching || !S || S._ended || S._closed || G.ui.talking || G.ui.busy || C.noCoach) return;
    const ov = G.$('#overlay'); if (ov && !ov.hidden) return;
    coaching = true; G.ui.busy = true;
    try {
      const U = G.guide;
      await U.mainDesk();
      if (G.$('#skip')) await U.skipBtn();
      if (G.$('#people')) await U.peopleBoard();
      if (S.docs.length >= 3 && C.compare) await U.firstDocs();
      if (S.c.warrantReady) { G.ui.tab = 'self'; renderActs(); await U.warrantReady(); }
      if (G.kit && G.kit.inCustody(S)) await U.arrested();
    } finally { coaching = false; G.ui.busy = false; }
  };
  async function morning(first) {
    G.clock = { h: 8, m: 30 };
    K.render('');
    const all = collect(first);
    K.refresh();
    if (all.length) await G.talk(all);
    if (S._ended) return;
    if (G.kit && G.kit.custodyEvents && C.custodyEvents !== false) await G.kit.custodyEvents(S);
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
    return m.concat(lines).concat(C.after ? (C.after(S) || []) : []).concat(lures());
  }
  // 危うい手段が選べるようになったら、その朝に誰かが「近道」をささやく（選ぶ前に聞かされる）
  const WHO = { 白井: 'shirai', 課長: 'todo', 岡: 'oka', 野口: 'noguchi', 検事: 'kenji' };
  function lures() {
    S.lured = S.lured || {}; const out = [];
    C.actions.forEach(a => {
      if (!a || !a.risk || S.lured[a.id] || (a.once !== false && S.done[a.id]) || (a.cond && !a.cond(S))) return;
      const r = typeof a.risk === 'function' ? a.risk(S) : a.risk, m = (r && r.lure || '').match(/^(白井|課長|岡|野口|検事)「(.*)」$/);
      if (!m) return; S.lured[a.id] = true;
      out.push([WHO[m[1]], m[2], { scene: { bg: 'office', who: WHO[m[1]] } }]);
    });
    return out;
  }
  // 事件が終わったあとは、この画面を描き直さない（次の画面＝検察・公判を上書きしないように）
  K.abort = () => { if (S) { S._ended = true; S._closed = true; S._finish = null; } if (C) C.actsOverride = null; };
  K.end = function (result) { S._ended = true; S._closed = true; const f = S._finish; S._finish = null; f && f(result); };
})();
