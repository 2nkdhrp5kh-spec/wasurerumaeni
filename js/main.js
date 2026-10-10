'use strict';
/* ============================================================
   タイトル・全体の流れ
   ============================================================ */
(function () {
  const $ = G.$;
  // 開発用の機能は、URL に ?dev=1 を付けたときだけ出す（配信版では隠れる）
  const DEV = /[?&]dev=1/.test(location.search);
  async function title() {
    G.inMode = false;
    G.closePaper(); G.audio.cue('title'); G.audio.ambient(null);
    const done = G.meta.runs.length > 0;
    $('#app').innerHTML = '<div class="title"><div class="sub">— 仮題 —</div><h1>調書</h1>'
      + '<div class="menu">'
      + '<button class="act primary" id="t-keiji"><span class="l">刑事編</span><span class="s">捜査官として　（はじめての方はここから。序章で操作を覚えられる）</span></button>'
      + '<button class="act" id="t-hanji"><span class="l">判事編</span><span class="s">令状当番の夜　（刑事編のあとがおすすめ）</span></button>'
      + '<button class="act" id="t-kyumon" disabled><span class="l">糾問編</span><span class="s">' + (done ? '準備中' : '刑事編と判事編のあとで') + '</span></button>'
      + '<button class="act ghost" id="t-rec"><span class="l">記録</span></button>'
      + '<button class="act ghost" id="t-arc"><span class="l">記録庫</span><span class="s">結末・真相・記章　' + G.archive.BADGES.filter(x => (G.meta.badges || {})[x[0]]).length + '／' + G.archive.BADGES.length + '</span></button>'
      + '<button class="act ghost" id="t-law"><span class="l">条文帳</span></button>'
      + '<button class="act ghost" id="t-cr"><span class="l">クレジット</span></button>'
      + '<button class="act ghost" id="t-warn"><span class="l">注意事項</span></button>'
      + '<button class="act ghost" id="t-diff"><span class="l">難しさ：' + G.DIFF_LABEL[G.diff()] + '</span><span class="s">' + G.DIFF_DESC[G.diff()][0] + '　押すと選び直せる</span></button></div>'
      + '<div class="foot">本作はフィクションです。登場する人物・団体・地名は架空のものです。<br>暴力的な描写を含みます。<br>手続は現行法に基づいていますが、ゲームとして日数や手順を簡略化しています。</div>'
      + (DEV ? '<button class="devreset" id="t-jump">開発用：場面へ飛ぶ</button><button class="devreset" id="t-reset">開発用：進捗をリセット</button>' : '') + '</div>';
    $('#t-keiji').onclick = () => { G.audio.unlock(); G.audio.sfx('select'); keiji(); };
    $('#t-hanji').onclick = async () => {
      G.audio.unlock(); G.audio.sfx('click');
      const sv = G.meta.hanjiSave;
      const v = await G.openPaper({ title: '判事編', sub: '北見坂地方裁判所　刑事部', body: G.P('どちらから始めるか。'),
        buttons: (sv ? [{ label: '令状当番：続きから', value: 'resume', cls: 'green', small: '第' + ['', '二', '三'][sv.night] + '夜から' }] : [])
          .concat((G.meta.hanjiMemos || []).length ? [{ label: '部総括判事からのメモを見返す', value: 'memos', small: (G.meta.hanjiMemos || []).length + '通' }] : [])
          .concat([{ label: '令状当番', value: 'duty', small: '三夜。夜ごとに記録が残る' + (sv ? '（続きの記録は消える）' : '') }, { label: '公判', value: 'trials', small: '記録だけを読んで裁く。二件' }]), closeLabel: '戻る' });
      if (!v) return;
      if (v === 'memos') { await G.openMemos(); return; }
      G.audio.sfx('select');
      if (v === 'duty' && sv) delete G.meta.hanjiSave;
      G.inMode = true;
      if (v === 'trials') { await G.hanji.trials(); G.archive.announce(G.archive.afterTrials(G.hanji._S)); }
      else { await G.hanji.duty(v === 'resume'); G.archive.announce(G.archive.afterDuty(G.hanji._S)); }
      record();
    };
    // 開発用：保存されている進捗（記録・記章・経歴・令状当番の続き・説明の既読など）をすべて消す
    if ($('#t-jump')) $('#t-jump').onclick = async () => { G.audio.unlock(); await G.dev.menu(playCase); title(); };
    if ($('#t-reset')) $('#t-reset').onclick = async () => {
      const v = await G.openPaper({ title: '進捗をリセット', sub: '開発用', body: G.P('記録・記録庫・記章・経歴・令状当番の続き・説明の既読を、すべて消します。元には戻せません。'),
        buttons: [{ label: 'すべて消す', value: true, cls: 'red' }], closeLabel: 'やめる' });
      if (!v) return;
      const muted = G.meta.muted;
      G.store.remove('chousho.meta.v1');
      G.meta = Object.assign(G.newMeta(), { muted: !!muted });
      G.saveMeta(); G.toast('進捗をリセットした'); title();
    };
    $('#t-rec').onclick = record;
    $('#t-arc').onclick = () => G.archive.open(CASES);
    $('#t-law').onclick = async () => {
      const v = await G.openPaper({ title: '条文帳', sub: 'どちらの本を開くか。', body: G.P('刑事編と判事編では、使う条文が違う。'),
        buttons: [{ label: '捜査（刑事編）', value: 'keiji', small: '刑法の罪名、捜査の手続、自白、違法収集証拠' }, { label: '令状・公判（判事編）', value: 'hanji', small: '逮捕・勾留・延長・捜索差押えの要件、訴因変更' }], closeLabel: '戻る' });
      if (!v) return;
      G.lawMode = v; await G.openLaw(); G.lawMode = null;
    };
    $('#t-cr').onclick = credits;
    $('#t-warn').onclick = () => G.showWarning(false);
    $('#t-diff').onclick = async () => { G.audio.sfx('click'); await G.chooseDiff(false); title(); };
  }

  async function keiji() {
    if (!G.meta.diffChosen) await G.chooseDiff(true);
    G.lawMode = 'keiji'; G.inMode = true;
    // 経歴（物語）か、事件を選ぶか（暗転は、経歴を選んだときだけ）
    const cr = G.meta.career;
    const mode = await G.openPaper({ title: '刑事編', sub: 'どう遊ぶか', closeLabel: '戻る', body: G.P('「経歴」は、一人の刑事の数年間を、四つの事件で順に歩む物語。「事件を選ぶ」は、好きな事件を一つ遊ぶ。'),
      buttons: (cr && !cr.done && cr.step > 0 ? [{ label: '経歴：続きから', value: 'resume', cls: 'green', small: (cr.step + 1) + '件目から（' + ['巡査部長', '警部補', '警部'][cr.rank] + '）' }] : [])
        .concat([{ label: '経歴（物語）', value: 'career', small: cr && cr.step > 0 && !cr.done ? 'はじめから（続きの記録は消える）' : '四つの事件を、年を追って' }, { label: '事件を選ぶ', value: 'free', small: '一つの事件を自由に' }]) });
    if (!mode) { G.lawMode = null; G.inMode = false; return title(); }   // 戻る：タイトルへ
    if (mode !== 'free') {
      G.audio.cue('law1');
      await G.curtain([{ html: '<div class="big">刑事編</div>', wait: 1000 }, { html: G.QUOTES.law1a, wait: 3000 }]);
    }
    let skip = !!G.meta.prologueDone;
    if (mode !== 'resume') {
      if (G.meta.prologueDone) skip = await G.openPaper({ title: '序章', body: G.P('序章（操作の練習を兼ねた短い事件）を、もう一度遊ぶか。'), noClose: true,
        buttons: [{ label: '序章から', value: false }, { label: '本章から', value: true }] });
      if (!skip) {
        await G.curtain([{ html: '<div class="big">序章</div><div class="small">空き巣</div>', wait: 1000 }]);
        await G.cases.akisu.run();
      }
    }
    if (mode === 'free') return keiji2();
    await G.career.run(mode === 'resume', playCase);
    record();
  }
  // 一つの事件を遊ぶ（自由に選んだときも、経歴の中でも）
  async function playCase(id) {
    G.audio.sfx('select');
    const cm = caseMeta(id); cm.started++; G.saveMeta();
    G.lastOutcome = null;
    const S = await G.cases[id].run();
    if (id === 'aoyagi' && S.c.target === 'M') { await G.trial.run(S, G.cases.aoyagi.trialM); if (G.lastOutcome) G.lastOutcome.truthG = S.c.truth === 'G'; }   // 宮下を追った道：記録庫の真相は「久住が犯人だったか」で数える
    else if (id === 'aoyagi') await G.ending.run(S);
    else await G.trial.run(S, G.cases[id].trial);
    if (G.lastOutcome) { cm.finished++; cm.results[G.lastOutcome.verdict] = (cm.results[G.lastOutcome.verdict] || 0) + 1; if (G.lastOutcome.reveal) cm.reveals[G.lastOutcome.reveal] = 1; G.saveMeta();
      G.archive.announce(G.archive.afterCase(id, G.lastOutcome, cm, CASES.find(k => k.id === id))); }
    return G.lastOutcome;
  }
  async function keiji2() {
    backfill();
    const id = await G.openPaper({ title: '事件を選ぶ', sub: '刑事課の机に、四つの事件記録がある。', noClose: true, body: G.P('どの事件の主任になるか。') + G.note('結末の数は、この事件で起こりうる捜査の結果と、数年後に起こりうる出来事の数。見た結末だけ名前が出る。'),
      buttons: CASES.map(k => ({ label: k.label + stampOf(k), value: k.id, cls: 'case', small: k.small + progressOf(k) })) });
    await playCase(id);
    record();
  }

  // 事件ごとの進み具合（遊んだ回数・見た結末）
  const CASES = [
    { id: 'aoyagi', label: '青柳書房事件', small: '古書店で、店主が縛られ、金庫が奪われた', results: ['有罪', '無罪', '不起訴', '釈放（不起訴）', '未解決'], reveals: { enzai: '再審', murai: '別の事件', miyashita: '別の男の逮捕', right: '正しかったと分かる' } },
    { id: 'ekimae', label: '北見坂駅前事件', small: '深夜の駅前で、男性が倒れて頭を打った。タクシー運転手が通報', results: ['有罪', '有罪（減軽）', '無罪', '不起訴', '釈放（不起訴）'], reveals: { wrong: '有罪のあとで', free: '有罪にならなかったあとで', right: '正しかったと分かる' } },
    { id: 'chikan', label: '7時16分発', small: '朝の電車で、女性が男の手をつかんだ。駅員が男を引き渡した', results: ['有罪', '略式命令（罰金）', '無罪', '不起訴', '釈放（不起訴）'], reveals: { wrong: '有罪のあとで', free: '有罪にならなかったあとで', right: '正しかったと分かる' } },
    { id: 'kasai', label: '本町三丁目火災', small: '未明の住宅火災。住人の母と息子は避難した', results: ['有罪', '無罪', '不起訴', '釈放（不起訴）'], reveals: { wrong: '有罪のあとで', free: '有罪にならなかったあとで', right: '正しかったと分かる' } }
  ];
  // この機能より前の記録からも、印を付ける
  function backfill() {
    if (G.meta.casesBackfilled) return; G.meta.casesBackfilled = true;
    const map = { '刑事編': 'aoyagi', '青柳書房事件': 'aoyagi', '駅前事件': 'ekimae', '北見坂駅前事件': 'ekimae', '7時16分発': 'chikan', '8時12分発': 'chikan', '本町三丁目火災': 'kasai' };
    (G.meta.runs || []).forEach(r => { const id = map[r.mode]; if (!id) return; const m = caseMeta(id); m.started++; m.finished++; m.results[r.result] = (m.results[r.result] || 0) + 1; });
    G.saveMeta();
  }
  function caseMeta(id) { G.meta.cases = G.meta.cases || {}; return G.meta.cases[id] = G.meta.cases[id] || { started: 0, finished: 0, results: {}, reveals: {} }; }
  function stampOf(k) { const m = caseMeta(k.id); return m.finished ? '<span class="cstamp done">済</span>' : m.started ? '<span class="cstamp mid">途中</span>' : ''; }
  function progressOf(k) {
    const m = caseMeta(k.id); if (!m.started) return '';
    const seen = k.results.filter(r => m.results[r]), rv = Object.keys(k.reveals).filter(r => m.reveals[r]);
    return '<span class="cprog">' + m.finished + '回　結末 ' + seen.length + '/' + k.results.length + (seen.length ? '（' + seen.join('・') + '）' : '')
      + '　数年後 ' + rv.length + '/' + Object.keys(k.reveals).length + (rv.length ? '（' + rv.map(r => k.reveals[r]).join('・') + '）' : '') + '</span>';
  }

  // 判明した事件での正答率：真相が（偶然）明らかになった事件のうち、自分の処理が正しかったもの
  function truthRate(rows) {
    const rev = rows.filter(r => r.revealed === '判明'), known = rev.filter(r => r.correct === true || r.correct === false), ok = known.filter(r => r.correct).length;
    const pct = known.length ? Math.round(ok / known.length * 100) + '<small>%</small>' : '—';
    return '<div class="trate"><div class="tl">判明した事件での正答率</div><div class="tv">' + pct + '</div>'
      + '<div class="ts">遊んだ' + rows.length + '件のうち、真相が明らかになったのは' + rev.length + '件。' + (known.length ? 'そのうち、あなたの処理が正しかったのは' + ok + '件。' : '') + '<br>真相が明らかになるのは、すべて偶然による。<br>誤っていたときのほうが、明らかになりやすい（再審の申立て、別の事件など）。</div></div>';
  }

  function record() {
    G.audio.ambient(null); G.audio.sfx('paper');
    const rows = G.meta.runs.slice().reverse();
    $('#app').innerHTML = '<header class="bar"><span class="role">記録</span><span class="info">これまでの事件。真相の欄はない。</span></header>';
    const w = document.createElement('div');
    w.innerHTML = '<div class="paper" style="margin-top:8px"><div class="paper-h">事件処理記録</div>'
      + (rows.length ? truthRate(rows) : '')
      + (rows.length ? '<table class="kv record"><tr><th>回</th><th>事件</th><th>結果</th><th>自白</th><th>問題のある捜査</th><th>送らなかった記録</th><th>真相</th></tr>'
        + rows.map(r => '<tr><td>' + r.no + '</td><td>' + (r.mode === '刑事編' ? '青柳書房事件' : r.mode) + '</td><td>' + r.result + '</td><td>' + r.confession + '</td><td>' + r.illegal + '</td><td>' + r.withheld + '</td><td>' + (r.revealed === '判明' ? '偶然、判明した' : '—') + '</td></tr>').join('') + '</table>'
        : G.P('まだ記録はない。'))
      + G.note('同じ証拠から、違う判断がありえた。違う真実も、ありえた。') + G.note('「判事編」：他の誰かが作った記録だけを読んで、裁く側に立つ。')
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
        ['取調べ', 'ショパン《24の前奏曲》作品28 第20番<br>演奏：Ivan Ilić（Musopen）<br>CC BY 3.0 ／ Wikimedia Commons「Chopin - Preludes, Op. 28 - No. 20 \'Funeral march\'.ogg」'],
        ['満期', 'ショパン《夜想曲第13番》作品48-1<br>演奏：Luke Faulkner／CC0'],
        ['公判・判決', 'ベートーヴェン《ピアノソナタ第31番》作品110 第3楽章<br>演奏：Musopen／パブリックドメイン'],
        ['数年後', 'ショパン《夜想曲第20番》嬰ハ短調 遺作<br>演奏：Musopen／CC0'],
        ['経歴　再審', 'ショパン《ピアノソナタ第2番》第3楽章（葬送行進曲）<br>演奏：Andreas Xenopoulos（Musopen）／CC0'],
        ['終幕', 'ベートーヴェン《ピアノソナタ第8番》第2楽章<br>演奏：Paul Pitman（Musopen）／CC0'],
        ['判事編　公判', 'ベートーヴェン《ピアノソナタ第21番》作品53 第2楽章<br>演奏：Musopen／パブリックドメイン'],
        ['判事編　令状当番', 'バッハ《ゴルトベルク変奏曲》アリア<br>演奏：Kimiko Ishizaka（Open Goldberg Variations）／CC0'],
        ['経歴　終章（再審のないとき）', 'ショパン《練習曲》作品25-7<br>演奏：La Pianista（Wikipedia 利用者）<br>CC BY-SA 3.0 ／ Wikimedia Commons「Chopin - Etude Op. 25, No. 7.ogg」']])
      + '<h4>引用</h4>' + G.kv([['刑事編の冒頭', '平野龍一『刑事訴訟法概説』（東京大学出版会、1968年）1頁'], ['判事編の冒頭', '平野龍一「現行刑事訴訟の診断」『団藤重光博士古稀祝賀論文集 第4巻』（有斐閣、1985年）407頁以下']])
      + '<h4>条文</h4>' + G.P('e-Gov法令検索（デジタル庁）による現行法令')
      + '<h4>フォント</h4>' + G.P('DotGothic16（Fontworks）、Noto Serif JP（Google）、Yuji Syuku（Kinuta Font Factory）。いずれも SIL Open Font License 1.1。ライセンス文は fonts フォルダに同梱。')
      + G.note('効果音・声・人物と背景のドット絵は、本作のために作成したもの。') });
  }

  G.main = { title };
  // ブラウザは、画面を一度押すまで音を出させない。押す前にタイトル（曲つき）が出ないよう、最初に一枚はさむ
  // 注意書きが出る初回は、その「はじめる」の押下で足りる。アプリ版（window.CHOUSHO_APP）では要らない
  function startCard() {
    if (window.CHOUSHO_APP || !G.meta.seenWarning3) return Promise.resolve();
    return new Promise(res => {
      const d = document.createElement('div'); d.className = 'startcard';
      d.innerHTML = '<div class="sc-t">調書</div><div class="sc-h">画面を押して、はじめる</div><div class="sc-n">音が出ます</div>';
      d.onclick = () => { G.audio.unlock(); d.classList.add('off'); setTimeout(() => d.remove(), 900); res(); };
      document.body.appendChild(d);
    });
  }
  window.addEventListener('DOMContentLoaded', async () => {
    await startCard();
    if (!G.meta.seenWarning3) { await G.showWarning(true); G.meta.seenWarning3 = true; G.saveMeta(); }
    if (!G.meta.seenQuote) {
      G.meta.seenQuote = true; G.saveMeta();
      await G.curtain([{ html: G.QUOTES.hirano1, wait: 4500 }]);
    }
    title();
  });
})();
