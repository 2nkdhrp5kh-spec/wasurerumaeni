'use strict';
/* ============================================================
   開発用：場面へ飛ぶ（URL に ?dev=1 を付けたときだけ、タイトルにボタンが出る）
   ・事件の途中の場面：自動の捜査官が高速・無音で遊び進め、目当ての曲が鳴る瞬間に止めて、操作を手渡す
   ・それ以外の場面：その場面の関数を直接呼ぶ
   ============================================================ */
(function () {
  const P = (...a) => G.P(...a);
  const CASES = [
    { id: 'aoyagi', label: '青柳書房事件', truths: [['G', '久住が犯人'], ['I', '久住は無実']] },
    { id: 'ekimae', label: '北見坂駅前事件', truths: [['A', '戸田が先に殴った'], ['D', '戸田は身を守っただけ']] },
    { id: 'chikan', label: '7時16分発', truths: [['G', '佐伯が犯人'], ['I', '佐伯は無実']] },
    { id: 'kasai', label: '本町三丁目火災', truths: [['A', '放火'], ['N', 'ストーブの事故']] }
  ];
  // 事件の中の場面（＝その場面で鳴る曲のキュー）
  const IN_CASE = [
    { cue: 'main', label: '事件のはじめ', small: '本章の曲' },
    { cue: 'interro', label: '取調べ', small: '前奏曲 28-20。逮捕のあと' },
    { cue: 'arrest', label: '逮捕', small: '青柳書房事件だけ' },
    { cue: 'confession', label: '自白', small: '青柳書房事件だけ。違法も使う捜査官のほうが届きやすい' },
    { cue: 'expiry', label: '勾留の満期が近づく', small: '夜想曲 48-1。自白がないまま満期の3日前' },
    { cue: 'soutchi', label: '送致', small: '' },
    { cue: 'trial', label: '公判', small: 'ソナタ31番（4分43秒から）。起訴されたときだけ' },
    { cue: 'years', label: '数年後', small: '夜想曲20番' },
    { cue: 'finale', label: '終幕', small: '悲愴 第2楽章' }
  ];

  /* ---------- 自動の捜査官（tools/selftest.js と同じ考え方） ---------- */
  let bot = null;   // { rough, stopped }
  const realST = window.setTimeout, realSI = window.setInterval;
  function fast(on) {
    if (on) { window.setTimeout = (f, t, ...a) => realST(f, Math.min(t || 0, 3), ...a); window.setInterval = (f, t, ...a) => realSI(f, Math.min(t || 0, 5), ...a); }
    else { window.setTimeout = realST; window.setInterval = realSI; }
  }
  function step() {
    const q = s => document.querySelector(s), rough = bot.rough;
    if (q('.coach .ch-n')) { q('.coach .ch-n').click(); return; }
    if (q('#curtain.on')) { q('#curtain').click(); return; }
    const ov = q('#overlay');
    if (ov && !ov.hidden) {
      if (q('.cmpv')) {
        const ps = [...document.querySelectorAll('.cmpp .paper')].map(p => { const c = [...p.querySelectorAll('.u.cand')]; const pool = c.length ? c : [...p.querySelectorAll('.u')]; return pool[Math.floor(Math.random() * pool.length)]; });
        if (ps[0] && ps[1]) { ps[0].click(); ps[1].click(); }
        if (q('#cmpgo') && !q('#cmpgo').disabled && Math.random() < .7) q('#cmpgo').click(); else if (q('#cmpx')) q('#cmpx').click();
        return;
      }
      const bs = [...ov.querySelectorAll('.pbtn:not(:disabled)')].filter(b => !/タイトルに戻る|やめてタイトル/.test(b.textContent));
      if (!bs.length) return;
      const good = rough
        ? [/^住居侵入・強盗刑法/, /^傷害致死/, /^現住建造物等放火/, /^迷惑行為防止条例/, /^告げずに/, /夜まで/, /認めれば/, /^指示に従う/]
        : [/^住居侵入・強盗刑法/, /^傷害致死/, /^現住建造物等放火/, /^迷惑行為防止条例/, /^逮捕しない/, /^黙秘権を告げる/, /^すぐに会わせる/, /^余罪には触れない/, /^断る/, /^証拠を示して/, /^休憩を入れて/, /^弁解を聴く/, /^言い分を聴く/, /^8枚の写真/, /^「示した写真は1枚」/, /^送る$/, /^まだ続ける/, /^一問一答/, /^自分にやらせて/];
      if (bot.hold) { const b = bs.find(x => /^まだ続ける/.test(x.textContent)); if (b) { b.click(); return; } }
      for (const re of good) { if (bot.hold && String(re) === String(/^送る$/)) continue; const b = bs.find(x => re.test(x.textContent)); if (b) { b.click(); return; } }
      const pref = bs.filter(b => !/閉じる|やめる|やめておく|条文帳を開く/.test(b.textContent) && !(!rough && /告げずに|夜まで|怒鳴り|認めれば|指紋が出た|明日の午後|中心に聴く|指示に従う|任せる|帰ってくる前|連れて行き、部屋を捜す|その場で中身/.test(b.textContent)));
      const b = pref.length && Math.random() < .85 ? pref[Math.floor(Math.random() * pref.length)] : bs[Math.floor(Math.random() * bs.length)];
      b.click(); return;
    }
    if (G.ui.talking) { q('#dlg').click(); return; }
    if (q('#send')) { q('#send').click(); return; }   // 送致記録をまとめる画面
    const K = G.keiji, S = K.state && K.state(); if (!S || !q('#acts')) return;
    // 被疑者の札：◯の多いほうを追う
    const pc = [...document.querySelectorAll('.pc-b')];
    if (pc.length && !S.c.target && (S.day >= 6 || (K.doc('camera3') && K.doc('miyaNeighbors')))) {
      const score = card => [...card.querySelectorAll('.pf-y .pf-s')].reduce((n, e) => n + e.textContent.length, 0) - [...card.querySelectorAll('.pf-n .pf-s')].reduce((n, e) => n + e.textContent.length, 0) * 1.2;
      const cards = [...document.querySelectorAll('.pcard')].filter(c => c.querySelector('.pc-b')).sort((a, b) => score(b) - score(a));
      if (cards[0]) { cards[0].querySelector('.pc-b').click(); return; }
    }
    const docs = [...document.querySelectorAll('#docs .doc.hl')];
    if (docs.length && Math.random() < .3) { docs[0].click(); return; }
    const lab = x => (x.querySelector('.l') || x).textContent;
    let acts = [...document.querySelectorAll('#acts .act:not(:disabled)')];
    if (!rough) acts = acts.filter(a => !/釈放を進言|在宅|切り上げ|管理人に部屋|賭博の容疑|現場に連れて|写真を1枚/.test(a.textContent));
    if (bot.hold) acts = acts.filter(a => !/取り調べる|切り上げ|釈放を進言/.test(a.textContent));   // 満期まで：自白させず、早く送らない
    bot.tried = bot.tried || {}; bot.today = bot.today || {};
    const day = S.day;
    if (G.keiji.freeStaff().length && G.ui.tab !== 'staff' && bot.staffDay !== day) { bot.staffDay = day; q('.tab[data-t=staff]').click(); return; }
    if (G.ui.tab === 'staff') {
      const fr = acts.filter(x => !bot.tried[lab(x)]);
      if (G.keiji.freeStaff().length && fr.length) { bot.tried[lab(fr[0])] = 1; fr[0].click(); return; }
      bot.staffDay = day;
      if (!S.selfUsed) { q('.tab[data-t=self]').click(); return; }
      if (q('#endday')) q('#endday').click(); return;
    }
    const nt = acts.filter(x => bot.today[lab(x)] !== day);
    const order = [...nt.filter(x => /逮捕状の請求|を逮捕する|金庫を捜す/.test(lab(x))), ...nt.filter(x => !bot.tried[lab(x)]), ...nt.filter(x => x.classList.contains('primary')), ...nt];
    if (order.length && !S.selfUsed) { const a = order[0]; bot.today[lab(a)] = day; bot.tried[lab(a)] = 1; a.click(); return; }
    if (q('#endday')) q('#endday').click();
  }

  // 目当ての曲が鳴るまで自動で進める。鳴ったら止めて、ふつうの速さ・音に戻す
  async function autoplay(id, opt, playCase) {
    const origCue = G.audio.cue;
    let hit = false;
    const stop = () => { if (!bot || bot.stopped) return; bot.stopped = true; fast(false); G.audio.setMuted(!!G.meta.muted); };
    G.audio.cue = cid => { if (bot && !bot.stopped && cid === opt.until) { hit = true; stop(); G.toast('開発用：ここから手で遊べる'); } origCue(cid); };
    G.devTruth = opt.truth; G.devReveal = opt.reveal;
    try {
      for (let tryNo = 1; tryNo <= 6 && !hit; tryNo++) {
        bot = { rough: opt.rough, stopped: false, hold: opt.until === 'expiry' };
        if (opt.until !== 'main') { fast(true); G.audio.setMuted(true); }
        else bot.stopped = true;
        const loop = () => { if (!bot || bot.stopped) return; try { step(); } catch (e) {} realST(loop, 4); };
        if (!bot.stopped) realST(loop, 50);
        if (opt.until === 'main') hit = true;
        await playCase(id);
        stop();
        if (!hit) G.toast('開発用：この回では届かなかった。やり直す（' + tryNo + '回目）');
      }
      if (!hit) await G.openPaper({ title: '届かなかった', sub: '開発用', body: P('6回遊び進めたが、この場面には届かなかった。捜査官の進め方（適法／違法も使う）や、真相を変えて試すこと。'), buttons: [{ label: '閉じる', value: 1 }] });
    } finally {
      stop(); bot = null; G.audio.cue = origCue; G.devTruth = null; G.devReveal = null;
    }
  }

  /* ---------- メニュー ---------- */
  async function menu(playCase) {
    const v = await G.openPaper({ title: '場面へ飛ぶ', sub: '開発用（?dev=1 のときだけ）', body: P('事件の中の場面は、自動の捜査官が高速・無音で遊び進め、その場面の曲が鳴った瞬間に止まる。そこからは手で遊べる。', '進捗（記録・記章など）は、ふつうに遊んだときと同じく残る。'),
      buttons: [
        { label: '音の診断', value: 'diag', small: '曲が鳴らないとき。どの鳴らし方が使えるかを調べる' },
        { label: '事件の中の場面', value: 'case', small: '取調べ・満期・公判・数年後・終幕など' },
        { label: '序章', value: 'prologue', small: 'ワルツ' },
        { label: '経歴：再審の証人', value: 'grave', small: '葬送行進曲。自分が捜査した事件の再審' },
        { label: '経歴：再審請求の証人', value: 'petition', small: '葬送行進曲。再審請求審' },
        { label: '経歴：再審が来なかった終わり', value: 'witness', small: '練習曲 25-7' },
        { label: '判事編：令状当番', value: 'warrant', small: 'ゴルトベルク アリア' },
        { label: '判事編：公判', value: 'hanjiTrial', small: 'ソナタ21番 第2楽章' }] });
    if (!v) return;
    if (v === 'diag') { G.toast('調べています（数秒）'); const lines = await G.audio.diag(); await G.openPaper({ title: '音の診断', sub: '開発用', body: '<pre style="white-space:pre-wrap;font-size:12px">' + lines.map(x => x.replace(/</g, '&lt;')).join('\n') + '</pre>', noClose: true, buttons: [{ label: '閉じる', value: 1 }] }); return; }
    G.inMode = true;
    if (v === 'prologue') { G.lawMode = 'keiji'; await G.cases.akisu.run(); return; }
    if (v === 'warrant') { await G.hanji.duty(false); return; }
    if (v === 'hanjiTrial') { await G.hanji.trials(); return; }
    if (v === 'grave' || v === 'petition' || v === 'witness') {
      G.lawMode = 'keiji';
      const hist = v === 'witness' ? [{ id: 'aoyagi', verdict: '不起訴' }]
        : [{ id: 'ekimae', verdict: '有罪', truthG: v === 'grave' ? false : true, confession: true, proc: { C: 1, D: 1, recorded: true } }];
      G.layout({ role: '巡査部長', date: '', info: '経歴（開発用）', scene: { bg: 'home' }, hint: '' });
      await G.career.devWitness({ rank: 1, hist });
      return;
    }
    // 事件の中の場面
    const until = await G.openPaper({ title: 'どの場面へ', sub: '開発用', body: P('その場面の曲が鳴る瞬間に止まる。'), buttons: IN_CASE.map(x => ({ label: x.label, value: x.cue, small: x.small })), closeLabel: '戻る' });
    if (!until) return;
    const id = await G.openPaper({ title: 'どの事件で', sub: '開発用', body: P(''), buttons: CASES.filter(k => !/^(arrest|confession)$/.test(until) || k.id === 'aoyagi').map(k => ({ label: k.label, value: k.id })), closeLabel: '戻る' });
    if (!id) return;
    const k = CASES.find(x => x.id === id);
    const truth = await G.openPaper({ title: '真相', sub: k.label, body: P('この回の真相を決める。'), buttons: k.truths.map(t => ({ label: t[1], value: t[0] })).concat([{ label: 'ふつうどおり（ランダム）', value: 'R' }]), closeLabel: '戻る' });
    if (!truth) return;
    let reveal = null;
    if (/^(years|finale)$/.test(until)) {
      reveal = await G.openPaper({ title: '数年後の出来事', sub: '開発用', body: P('判決が真相と食い違ったとき、それが明らかになるか（えん罪・真犯人の判明など）。'), buttons: [{ label: '明らかになる', value: 'y' }, { label: '何も起きない', value: 'n' }, { label: 'ふつうどおり（ランダム）', value: 'r' }], closeLabel: '戻る' });
      if (!reveal) return;
      reveal = reveal === 'y' ? true : reveal === 'n' ? false : null;
    }
    const rough = until === 'main' ? false : await G.openPaper({ title: '自動の捜査官', sub: '開発用', body: P('どう進めるか。'), buttons: [{ label: '手を尽くす（適法な手段だけ）', value: false }, { label: '乱暴（違法な手段も使う）', value: true, small: '自白・違法の場面に届きやすい' }], noClose: true });
    G.lawMode = 'keiji';
    G.meta.prologueDone = true; G.meta.diffChosen = true;
    await autoplay(id, { until, truth: truth === 'R' ? null : truth, reveal, rough }, playCase);
  }

  G.dev = { menu };
})();
