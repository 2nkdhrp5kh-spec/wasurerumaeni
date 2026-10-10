'use strict';
/* ============================================================
   経歴（刑事編の物語）
   一人の刑事の数年間を、四つの事件で順に歩む。
   事件のあいだに、本部の評価・昇進・家族の場面がはさまる。
   終章：過去に送った事件の再審（または再審請求）で、証人として呼ばれる。
   最後に、昇進（本部の評価）と、正答率（明らかになった真相）を並べる。
   ============================================================ */
(function () {
  const P = G.P;
  const ORDER = [
    { id: 'aoyagi', when: '一年目の秋', month: '10月', title: '青柳書房事件' },
    { id: 'ekimae', when: '一年目の冬', month: '11月', title: '北見坂駅前事件' },
    { id: 'chikan', when: '二年目の初夏', month: '6月', title: '7時16分発' },
    { id: 'kasai', when: '三年目の冬', month: '1月', title: '本町三丁目火災' }
  ];
  const RANK = ['巡査部長', '警部補', '警部'], NEED = [0, 5, 10], PTS = { A: 4, B: 3, C: 1, D: 0 };
  const fresh = () => ({ step: 0, rank: 0, pts: 0, hist: [], done: false });
  const save = () => G.saveMeta();
  const guiltyV = v => /有罪|略式/.test(v || '');

  // 家の場面（年ごと。前の事件の様子で、言葉が変わる）
  function home(i, cr) {
    const last = cr.hist[cr.hist.length - 1], age = [8, 8, 9, 10][i];
    const L = [['', '（' + ORDER[i].when + '。夜。家の台所。）', { scene: { bg: 'home' } }]];
    if (i === 0) L.push(['wife', 'お帰りなさい。……新しい係、どう？'], ['daughter', 'おとうさん、きょう学校で「しょうらいのゆめ」書いたよ。'], ['daughter', 'けいさつかんって書いた。わるいひとを、つかまえるの。']);
    else {
      if (last && last.proc && (last.proc.C || last.proc.todoTook)) L.push(['wife', '……このところ、毎晩遅いのね。取調べ？'], ['wife', 'あなたの顔、最近、知らない人みたい。']);
      else L.push(['wife', 'お帰りなさい。ご飯、温める？']);
      if (last && last.revealed && last.correct === false && guiltyV(last.verdict)) L.push(['wife', '……ニュース、見た。あの事件のこと。'], ['wife', 'あなたのせいじゃないって、言っていいのよね？']);
      L.push(['daughter', ['', 'おとうさん、こんど運動会、来れる？', 'おとうさん、テレビの刑事ドラマって、ほんとう？ 犯人、ちゃんと分かるの？', 'おとうさん、まちがえたこと、ある？'][i]]);
    }
    L.push(['', '（娘は' + age + '歳になった。）']);
    return L;
  }

  async function promote(cr) {
    const before = cr.rank;
    while (cr.rank < 2 && cr.pts >= NEED[cr.rank + 1]) cr.rank++;
    if (cr.rank === before) return;
    G.audio.sfx('stamp');
    await G.curtain([{ html: '<div class="big">辞令</div><div class="small">' + RANK[cr.rank] + 'に任ずる</div>', wait: 1400 },
      { html: '<div class="law">北見坂警察署　署長室。<br>「本部の評価が高い。よくやった」<br><br>理由は、書かれていない。</div>', wait: 2000 }]);
    if (cr.rank >= 1) G.archive.give('promote1');
    if (cr.rank >= 2) G.archive.give('promote2');
  }

  // 終章：過去の事件が、戻ってくる
  function pickReturn(cr) {
    const h = cr.hist;
    return h.find(x => guiltyV(x.verdict) && x.truthG === false) && { kind: 'retrial', x: h.find(x => guiltyV(x.verdict) && x.truthG === false) }
      || h.find(x => guiltyV(x.verdict) && x.confession) && { kind: 'petition', x: h.find(x => guiltyV(x.verdict) && x.confession) }
      || h.find(x => guiltyV(x.verdict)) && { kind: 'petition', x: h.find(x => guiltyV(x.verdict)) }
      || null;
  }
  async function witness(cr) {
    const r = pickReturn(cr);
    if (!r) {
      G.audio.cue('witness');
      await G.curtain([{ html: '<div class="big">数年後</div>', wait: 1200 },
        { html: '<div class="law">あなたが送った事件で、有罪になったものはなかった。<br><br>再審の請求も、証人の呼出しも、来なかった。<br><br>それが正しかったのかどうかは、分からない。</div>', wait: 2600 }]);
      return null;
    }
    const x = r.x, o = ORDER.find(k => k.id === x.id), p = x.proc || {};
    G.audio.cue('grave');
    await G.curtain([{ html: '<div class="big">' + (cr.rank >= 2 ? '六' : '五') + '年後</div>', wait: 1200 },
      { html: '<div class="law">' + o.title + '。<br><br>' + (r.kind === 'retrial' ? '有罪が確定した元被告人の再審が、開始された。' : '有罪が確定した元被告人が、再審を請求した。') + '<br>あなたは、捜査の主任として、証人に呼ばれた。</div>', wait: 2400, sfx: 'crowd' }]);
    G.layout({ role: '証人', date: '', info: '北見坂地方裁判所　' + (r.kind === 'retrial' ? '再審公判' : '再審請求審'), scene: { bg: 'court' }, hint: '（証言台に立つ。宣誓をした。）' });
    G.audio.ambient('court');
    await G.talk([['judge', '証人は、良心に従って真実を述べ、何事も隠さず、偽りを述べないことを誓いましたね。'], ['', '（宣誓書に署名し、印を押した。偽りの証言をすれば、偽証の罪に問われる。）'], ['bengo', '弁護人から伺います。あなたが、この事件の取調べを担当しましたね。']]);
    // 実際にしたことから、問いを作る
    const Q = [];
    if (p.C || p.todoTook) Q.push(['取調べは、一日にどのくらいの時間でしたか。夜遅くまで続けたことは？', true, '夜まで続けた日があった']);
    if (p.D) Q.push(['「認めれば」軽くなる、早く帰れる、といった話をしたことは？', true, '利益の約束をした']);
    if (p.E) Q.push(['大きな声を出したり、机を叩いたりしたことは？', true, '威圧的な取調べをした']);
    if (p.leaks) Q.push(['自白の前に、現場の写真を被疑者に見せたことは？', true, '自白の前に現場の写真を見せた']);
    if (p.todoTook) Q.push(['上司が、あなたに代わって取り調べた夜がありましたね。そのとき、何がありましたか。', true, '課長が一晩取り調べた']);
    if (!Q.length) Q.push(['取調べで、無理な追及をしたことはありますか。', false, '']);
    let honest = 0, lied = 0, caught = 0, forgot = 0;
    for (const [q, fact, what] of Q) {
      const v = await G.openPaper({ title: '弁護人の問い', sub: '証言台で', noClose: true, body: G.P(q),
        buttons: [{ label: fact ? 'はい。' + what + '。' : 'いいえ', value: 'truth', small: fact ? 'あったことを、そのまま話す' : 'そのとおりに答える' },
          ...(fact ? [{ label: '記憶にありません', value: 'forget' }, { label: 'いいえ。取調べは適正に行いました', value: 'deny', cls: 'red' }] : [])] });
      if (v === 'truth') { honest++; await G.talk([['you', fact ? 'はい。' + what + '。' : 'いいえ。'], ['bengo', '……ありがとうございます。']]); }
      else if (v === 'forget') { lied++;
        // 「記憶にない」：記憶に反していれば偽証になりうる（刑法169条。自分の記憶に反する陳述）。ただ、覚えていたことを証明するのは難しい
        if (p.recorded) { forgot++; await G.talk([['bengo', '取調べの録画を、再生します。'], ['', '（法廷のモニターに、取調室が映った。そこにいるのは、あなただった。）', { sfx: 'thud' }], ['bengo', '……これでも、記憶にありませんか。'], ['you', '……記憶にありません。'], ['judge', '分かりました。……証人の記憶の点は、映像そのものによって判断します。']]); }
        else await G.talk([['bengo', '……そうですか。録画は、ありませんでしたね。'], ['', '（弁護人は、それ以上は聞かなかった。傍聴席の誰かが、小さく息を吐いた。）']]); }
      else { lied++;
        if (p.recorded) { caught++; await G.talk([['bengo', '取調べの録画を、再生します。'], ['', '（法廷のモニターに、取調室が映った。そこにいるのは、あなただった。）', { sfx: 'thud' }], ['judge', '……証人。いまの証言と、映像とが、食い違っているようですが。']]); }
        else await G.talk([['bengo', '……そうですか。録画は、ありませんでしたね。'], ['', '（弁護人は、それ以上は聞かなかった。傍聴席の誰かが、小さく息を吐いた。）']]); }
    }
    G.audio.ambient(null);
    if (r.kind === 'retrial') { x.revealed = true; x.correct = false; }   // 再審無罪で、真相が明らかになった
    G.archive.give(lied ? 'witnessLie' : 'witnessTruth');
    const outcome = r.kind === 'retrial'
      ? '再審公判で、元被告人は無罪となった。' + (honest ? '判決は、取調べについてのあなたの証言を引いて、自白の任意性を否定した。' : '判決は、自白の信用性を否定した。あなたの証言には、触れていなかった。')
      : (honest && (p.C || p.D || p.E) ? '再審請求は棄却された。ただ、決定は、取調べに不適切な点があったことを認めた。' : '再審請求は、棄却された。');
    await G.curtain([{ html: '<div class="doc-s"><h3>' + (r.kind === 'retrial' ? '再審判決' : '決定') + '</h3>' + outcome + (caught ? '<br><br>あなたの証言について、偽証の告発がされたと聞いた。' : forgot ? '<br><br>判決は、取調べの様子を、あなたの証言ではなく録画によって認定した。「記憶にない」という証言は、信用できないとされた。' : '') + '</div>', wait: 2800 }]);
    return { kind: r.kind, x, honest, lied, caught };
  }

  // 最後に：昇進と、正答率
  async function summary(cr, w) {
    const rev = cr.hist.filter(x => x.revealed), ok = rev.filter(x => x.correct).length;
    const rows = cr.hist.map((x, i) => '<tr><td>' + ORDER[i].when + '</td><td>' + ORDER[i].title + '</td><td>' + x.verdict + '</td><td>' + (x.grade || '—') + '</td><td>' + (x.revealed ? (x.correct ? '正しかった' : '<b style="color:#b23a2e">誤っていた</b>') : '—') + '</td></tr>').join('');
    await G.openPaper({ title: '経歴', sub: '北見坂警察署　刑事課', noClose: true,
      body: G.kv([['階級', RANK[cr.rank]], ['本部の評価（合計）', cr.pts + '点'], ['明らかになった真相', rev.length ? rev.length + '件のうち、正しかったのは' + ok + '件' : 'なし']])
        + '<table class="kv record"><tr><th>時期</th><th>事件</th><th>結果</th><th>本部の評価</th><th>真相</th></tr>' + rows + '</table>'
        + G.P('あなたの昇進は、本部の評価で決まった。', '本部の評価は、自白と、有罪と、早さで決まった。', '真相は、その計算の中に入っていない。')
        + (w && w.lied ? G.note('再審の法廷で、あなたは、したことをそのまま話さなかった。') : w ? G.note('再審の法廷で、あなたは、したことをそのまま話した。') : ''),
      buttons: [{ label: '閉じる', value: 1 }] });
  }

  G.career = {
    devWitness: witness,
    async run(resume, playCase) {
      let cr = G.meta.career;
      if (!resume || !cr || cr.done) { cr = G.meta.career = fresh(); save();
        await G.curtain([{ html: '<div class="big">経歴</div>', wait: 1000 },
          { html: '<div class="law">北見坂警察署　刑事課　強行犯係。<br>巡査部長。38歳。<br><br>それが、あなただ。</div>', wait: 1800 },
          { html: '<div class="law">妻と、小学二年生の娘がいる。<br><br>これから数年のあいだに、あなたは四つの事件の主任になる。</div>', wait: 2600 }]); }
      for (let i = cr.step; i < ORDER.length; i++) {
        G.layout({ role: RANK[cr.rank], date: '', info: '経歴　' + (i + 1) + '／4', scene: { bg: 'home' }, hint: '' });
        G.audio.ambient(null);
        await G.talk(home(i, cr));
        await G.curtain([{ html: '<div class="big">' + ORDER[i].when + '</div><div class="small">' + ORDER[i].month + '　' + RANK[cr.rank] + '</div>', wait: 1200 }]);
        const o = await playCase(ORDER[i].id);
        if (!o) return;   // 中断
        cr.hist.push({ id: ORDER[i].id, verdict: o.verdict, grade: o.grade, revealed: !!o.revealed, correct: o.correct, truthG: o.truthG, confession: o.confession, proc: o.proc });
        cr.pts += PTS[o.grade] || 0; cr.step = i + 1; save();
        await promote(cr); save();
        if (i < ORDER.length - 1) {
          const go = await G.openPaper({ title: '経歴', sub: ORDER[i].when + 'が終わった', noClose: true, body: G.kv([['階級', RANK[cr.rank]], ['本部の評価', o.grade + '（合計 ' + cr.pts + '点）']]) + G.P('次の事件に進むか。ここでやめても、次は続きから始められる。'),
            buttons: [{ label: '次へ', value: true, cls: 'green' }, { label: 'ここでやめる', value: false }] });
          if (!go) return;
        }
      }
      const w = await witness(cr);
      await summary(cr, w);
      cr.done = true; G.archive.give('career'); save();
      const rev = cr.hist.filter(x => x.revealed);
      G.meta.runs.push({ no: G.meta.runs.length + 1, mode: '経歴', result: RANK[cr.rank] + '・本部' + cr.pts + '点', confession: '—', illegal: '—', withheld: '—', revealed: rev.length ? '判明' : '—', correct: null });
      save();
    }
  };
})();
