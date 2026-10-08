'use strict';
/* ============================================================
   タイトル・全体の流れ
   ============================================================ */
(function () {
  const $ = G.$;
  async function title() {
    G.closePaper(); G.audio.cue('title'); G.audio.ambient(null);
    const done = G.meta.runs.length > 0;
    $('#app').innerHTML = '<div class="title"><div class="sub">— 仮題 —</div><h1>調書</h1>'
      + '<div class="menu">'
      + '<button class="act primary" id="t-keiji"><span class="l">刑事編</span><span class="s">捜査官として</span></button>'
      + '<button class="act" id="t-hanji" disabled><span class="l">判事編</span><span class="s">制作中（刑事編のあとに遊べるようになる予定）</span></button>'
      + '<button class="act" id="t-kyumon" disabled><span class="l">糾問編</span><span class="s">' + (done ? '準備中' : '刑事編と判事編のあとで') + '</span></button>'
      + '<button class="act ghost" id="t-rec"><span class="l">記録</span></button>'
      + '<button class="act ghost" id="t-law"><span class="l">条文帳</span></button>'
      + '<button class="act ghost" id="t-cr"><span class="l">クレジット</span></button></div>'
      + '<div class="foot">本作はフィクションです。登場する人物・団体・地名は架空のものです。<br>暴力的な描写を含みます。<br>手続は現行法に基づいていますが、ゲームとして日数や手順を簡略化しています。</div></div>';
    $('#t-keiji').onclick = () => { G.audio.unlock(); keiji(); };
    $('#t-rec').onclick = record;
    $('#t-law').onclick = G.openLaw;
    $('#t-cr').onclick = credits;
  }

  async function keiji() {
    G.audio.cue('law1');
    await G.curtain([{ html: '<div class="big">刑事編</div>', wait: 1000 }, { html: G.QUOTES.law1a, wait: 3000 },
      { html: '<div class="law">北見坂警察署　刑事課　強行犯係。<br>巡査部長。<br><br>それが、あなただ。</div>', wait: 1800 }]);
    let skip = false;
    if (G.meta.prologueDone) skip = await G.openPaper({ title: '序章', body: G.P('序章（操作の練習を兼ねた短い事件）を、もう一度遊ぶか。'), noClose: true,
      buttons: [{ label: '序章から', value: false }, { label: '本章から', value: true }] });
    if (!skip) {
      await G.curtain([{ html: '<div class="big">序章</div><div class="small">空き巣</div>', wait: 1000 }]);
      await G.cases.akisu.run();
    }
    const id = await G.openPaper({ title: '事件を選ぶ', sub: '刑事課の机に、四つの事件記録がある。', noClose: true, body: G.P('どの事件の主任になるか。'),
      buttons: [
        { label: '青柳書房事件', value: 'aoyagi', small: '強盗・誰がやったのか' },
        { label: '北見坂駅前事件', value: 'ekimae', small: '傷害致死・正当防衛は成立するか（裁判員裁判）' },
        { label: '8時12分発', value: 'chikan', small: '痴漢・証拠は被害者の供述' },
        { label: '本町三丁目火災', value: 'kasai', small: '放火・火事か放火か（裁判員裁判）' }] });
    const S = await G.cases[id].run();
    if (id === 'aoyagi') await G.ending.run(S);
    else await G.trial.run(S, G.cases[id].trial);
    record();
  }

  function record() {
    G.audio.ambient(null);
    const rows = G.meta.runs.slice().reverse();
    $('#app').innerHTML = '<header class="bar"><span class="role">記録</span><span class="info">これまでの事件。真相の欄はない。</span></header>';
    const w = document.createElement('div');
    w.innerHTML = '<div class="paper" style="margin-top:8px"><div class="paper-h">事件処理記録</div>'
      + (rows.length ? '<table class="kv record"><tr><th>回</th><th>事件</th><th>結果</th><th>自白</th><th>注意の付いた行動</th><th>送らなかった記録</th><th>真相</th></tr>'
        + rows.map(r => '<tr><td>' + r.no + '</td><td>' + (r.mode === '刑事編' ? '青柳書房事件' : r.mode) + '</td><td>' + r.result + '</td><td>' + r.confession + '</td><td>' + r.illegal + '</td><td>' + r.withheld + '</td><td>' + (r.revealed === '判明' ? '偶然、判明した' : '—') + '</td></tr>').join('') + '</table>'
        : G.P('まだ記録はない。'))
      + G.note('同じ証拠から、違う判断がありえた。違う真実も、ありえた。') + G.note('次は「判事編」：他の誰かが作った記録だけを読んで、裁く側に立つ。（制作中）')
      + '<div class="paper-f"><button class="pbtn" id="r-q">冒頭の言葉</button><button class="pbtn" id="r-t">タイトルへ</button></div></div>';
    $('#app').appendChild(w);
    $('#r-t').onclick = title;
    $('#r-q').onclick = async () => { await G.curtain([{ html: G.QUOTES.hirano1, wait: 3000 }]); };
  }

  function credits() {
    G.openPaper({ title: 'クレジット', body:
      '<h4>音楽（録音）</h4>'
      + G.kv([['導入', 'ショパン《舟歌》作品60<br>演奏：Veronika Ilinskaya（Musopen）<br>CC BY 3.0 ／ Wikimedia Commons「Chopin - Barcarole-op-60.ogg」'],
        ['序章', 'ショパン《ワルツ第3番》作品34-2<br>演奏：Luke Faulkner（Musopen）／CC0'],
        ['本章', 'ベートーヴェン《交響曲第3番》第2楽章<br>演奏：Czech National Symphony Orchestra（Musopen）／CC0'],
        ['公判〜数年後', 'ショパン《ピアノソナタ第2番》第3楽章<br>演奏：Andreas Xenopoulos（Musopen）／CC0'],
        ['終幕（仮）', 'ベートーヴェン《ピアノソナタ第8番》第2楽章<br>演奏：Paul Pitman（Musopen）／CC0']])
      + '<h4>引用</h4>' + G.P('平野龍一『刑事訴訟法概説』（東京大学出版会、1968年）1頁')
      + '<h4>条文</h4>' + G.P('e-Gov法令検索（デジタル庁）による現行法令')
      + G.note('効果音・声・人物と背景のドット絵は、本作のために作成したもの。') });
  }

  G.main = { title };
  window.addEventListener('DOMContentLoaded', async () => {
    if (!G.meta.seenQuote) {
      G.meta.seenQuote = true; G.saveMeta();
      await G.curtain([{ html: G.QUOTES.hirano1, wait: 4500 }]);
    }
    title();
  });
})();
