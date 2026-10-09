'use strict';
/* ============================================================
   記録庫と記章（やり込み）
   ・記録庫：事件ごとの結末と、二つの真相（偶然明らかになったもの）を集める
   ・記章：遊び方に応じて得る印。得ていないものは「？？？」
   ============================================================ */
(function () {
  const A = G.archive = {};
  const TRUTH = {
    aoyagi: ['久住が犯人だった', '久住は犯人ではなかった'],
    ekimae: ['戸田が先に殴った', '戸田は振り払っただけだった'],
    chikan: ['佐伯が触った', '江藤が触った'],
    kasai: ['大塚が火をつけた', '火事は事故だった']
  };
  // [id, 名前, 説明, 隠しているときの手がかり]
  const BADGES = [
    ['clean', '手続を守って', '注意の付いた手段を一度も使わずに、起訴まで持ち込んだ。', '手段を選んで、起訴まで'],
    ['secret', '秘密の暴露', '捜査側の知らなかった事実が、自白どおりに裏付けられた。', '自白の中に、まだ誰も知らないこと'],
    ['allPairs', '並べるべきものを', '並べて読むべき記録を、すべて並べた。', '照合を、余さず'],
    ['noMiss', '一度も外さず', '照合で一度も外さずに、二つ以上のつながりを見つけた。', '照合を、外さずに'],
    ['release', '引き返す', '勾留中の被疑者について、釈放を進言した。', '身柄を、放す'],
    ['releaseRight', '放した手', '釈放した判断が正しかったと、のちに分かった。', '放した判断の、その後'],
    ['confRight', '確かめられた有罪', '有罪の判断が正しかったと、のちに分かった。', '有罪の、その後'],
    ['wrong', '再審', 'あなたが送った事件で、冤罪が明らかになった。', '何年も、あとで'],
    ['gradeA', '本部長賞', '本部の評価で A を得た。', '本部の評価'],
    ['gradeAWrong', 'Aの事件', '本部の評価は A。真相は違った。', '評価と、真相'],
    ['bothTruths', '二つの世界', '一つの事件で、二つの真相の両方を見た。', '同じ事件を、もう一度'],
    ['allEndings', 'すべての結末', '一つの事件で、起こりうる結末をすべて見た。', '同じ事件の、すべての終わり'],
    ['hanjiStrict', '厳格な審査', '令状当番で、要件に問題のある請求を一件も見落とさなかった。', '三夜の審査'],
    ['hanjiRubber', 'ちょうどいい当番', '捜査機関にとって、ちょうどいい令状当番だった。', '三夜の審査（別の形で）'],
    ['hanjiCourse', '一通りの当番', '令状当番の三回の段階を、すべて終えた。', '当番を重ねる'],
    ['hanjiHand', 'あの三夜', '総まとめの三夜を終えた。', '四回目の当番'],
    ['soin', '訴因の変更', '訴因の変更を許して、判決を言い渡した。', '殺人被告事件'],
    ['shukusho', '縮小認定', '訴因を変えずに、軽い罪を認定した。', '殺人被告事件（別の形で）'],
    ['promote1', '警部補', '経歴の中で、警部補に昇進した。', '経歴'],
    ['promote2', '警部', '経歴の中で、警部に昇進した。', '経歴（さらに）'],
    ['witnessTruth', '証言台で', '再審の法廷で、自分のしたことを、そのまま証言した。', '経歴の終わり'],
    ['witnessLie', '記憶にない', '再審の法廷で、自分のしたことを、そのまま話さなかった。', '経歴の終わり（別の形で）'],
    ['career', '経歴', '経歴を、最後まで終えた。', '経歴の終わりまで']
  ];
  A.BADGES = BADGES;
  const meta = () => { G.meta.badges = G.meta.badges || {}; return G.meta.badges; };
  const give = (id, out) => { if (meta()[id]) return; meta()[id] = Date.now(); const b = BADGES.find(x => x[0] === id); if (b) out.push(b[1]); };
  A.give = (id) => { const out = []; give(id, out); G.saveMeta(); if (out.length) G.toast('記章を得た：' + out.join('、')); };

  // 刑事編の事件が終わったとき
  A.afterCase = function (id, o, cm, k) {
    const out = [];
    if (!o) return out;
    const charged = /有罪|略式|無罪/.test(o.verdict);
    const p = o.proc || {}, procN = (p.C || 0) + (p.D || 0) + (p.E || 0) + (p.illegal || 0) + (p.search === 'illegal' ? 1 : 0) + (p.bekken ? 1 : 0);
    if (charged && !procN) give('clean', out);
    if (o.secret) give('secret', out);
    if (o.pairs > 0 && o.found >= o.pairs) give('allPairs', out);
    if (o.found >= 2 && !o.misses) give('noMiss', out);
    if (o.released) give('release', out);
    const guiltyV = /有罪|略式/.test(o.verdict);
    if (o.revealed && o.correct && o.released) give('releaseRight', out);
    if (o.revealed && o.correct && guiltyV) give('confRight', out);
    if (o.revealed && o.correct === false && guiltyV) give('wrong', out);
    if (o.grade === 'A') give('gradeA', out);
    if (o.grade === 'A' && o.revealed && o.correct === false) give('gradeAWrong', out);
    // 記録庫：見た真相
    if (o.revealed && o.truthG != null) { cm.truthSeen = cm.truthSeen || {}; cm.truthSeen[o.truthG ? 'g' : 'i'] = 1; }
    if (cm.truthSeen && cm.truthSeen.g && cm.truthSeen.i) give('bothTruths', out);
    if (k && k.results.every(r => cm.results[r])) give('allEndings', out);
    G.saveMeta();
    return out;
  };
  // 令状当番・公判が終わったとき
  A.afterDuty = function (S) {
    const out = [];
    if (S.verdictWord === '厳格な審査を行った。') give('hanjiStrict', out);
    if (/ちょうどいい/.test(S.verdictWord || '')) give('hanjiRubber', out);
    if (S.dutyNo >= 3) give('hanjiCourse', out);
    if (S.hand) give('hanjiHand', out);
    G.saveMeta(); return out;
  };
  A.afterTrials = function (S) {
    const out = [];
    if (S.trial2 && S.trial2.allowed && S.trial2.kind !== 'muzai') give('soin', out);
    if (S.trial2 && S.trial2.kind === 'shukusho') give('shukusho', out);
    G.saveMeta(); return out;
  };
  A.announce = list => { if (list && list.length) { G.audio.sfx('stamp'); G.toast('記章を得た：' + list.join('、')); } };

  // 記録庫の画面
  A.open = function (CASES) {
    const cases = (G.meta.cases || {}), b = meta();
    const caseHtml = CASES.map(k => {
      const m = cases[k.id] || { results: {}, reveals: {} }, ts = m.truthSeen || {};
      return '<div class="arc"><div class="arh">' + k.label + '<span>' + (m.finished || 0) + '回</span></div>'
        + '<div class="arr"><b>結末</b>' + k.results.map(r => '<span class="' + (m.results && m.results[r] ? 'on' : '') + '">' + (m.results && m.results[r] ? r : '？？？') + '</span>').join('') + '</div>'
        + '<div class="arr"><b>真相</b>' + TRUTH[k.id].map((t, i) => '<span class="' + (ts[i ? 'i' : 'g'] ? 'on' : '') + '">' + (ts[i ? 'i' : 'g'] ? t : '？？？') + '</span>').join('') + '</div></div>';
    }).join('');
    const hanji = '<div class="arc"><div class="arh">令状当番<span>' + (G.meta.hanjiDutyNo || 0) + '回</span></div>'
      + '<div class="arr"><b>見た問題点の型</b><span class="on">' + Object.keys(G.meta.hanjiUsed || {}).filter(k => !k.startsWith('n:')).length + '／94</span></div></div>';
    const got = BADGES.filter(x => b[x[0]]).length;
    const badges = '<div class="badges">' + BADGES.map(x => b[x[0]] ? '<div class="bdg on"><b>' + x[1] + '</b><small>' + x[2] + '</small></div>' : '<div class="bdg"><b>？？？</b><small>' + x[3] + '</small></div>').join('') + '</div>';
    return G.openPaper({ title: '記録庫', sub: '集めた結末と真相、得た記章。真相は、偶然明らかになったものだけが残る。',
      body: '<h4>刑事編</h4>' + caseHtml + '<h4>判事編</h4>' + hanji + '<h4>記章　' + got + '／' + BADGES.length + '</h4>' + badges });
  };
})();
