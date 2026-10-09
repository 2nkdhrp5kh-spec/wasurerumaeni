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

  kit.nextMilestone = S => {
    if (!kit.inCustody(S)) return null;
    const d = kit.custodyDay(S);
    const ms = [[2, '検察官への送致'], [3, '勾留の決定'], [13, '勾留延長'], [LIMIT, '勾留満期']];
    for (const [day, label] of ms) if (day > d) return { d: day - d, label };
    return null;
  };
  kit.limitBar = function (d, left) {
    const seg = (cls, w, t) => '<span class="seg ' + cls + '" style="width:' + (w / LIMIT * 100) + '%">' + t + '</span>';
    return '<div class="limit"><div class="row"><span>身柄拘束 ' + d + '日目</span><span>勾留満期まで あと' + left + '日</span></div>'
      + '<div class="segs"><span class="done" style="width:' + Math.min(100, d / LIMIT * 100) + '%"></span>'
      + seg('s1', 3, '送致・請求') + seg('s2', 10, '勾留 10日') + seg('s3', 10, '延長 10日')
      + '<span class="now" style="left:calc(' + Math.min(100, d / LIMIT * 100) + '% - 1px)"></span></div>'
      + '<div style="margin-top:2px">逮捕から48時間で送致、24時間以内に勾留請求、勾留10日、延長は最大10日（刑訴法203・205・208条）</div></div>';
  };
  kit.info = (S, title) => {
    title = kit.title(S, title.replace(/（.*）$/, ''));
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
    if (d === 3) { L.push(['', '（裁判官は勾留を認めた。10日間。勾留状が届いた。）']); if (G.keiji.C().suspect) kit.forms.koryu(S, G.keiji.C()); }
    if (d === 5 && !S.staffGone.noguchi) { K.loseStaff('noguchi'); L.push(['todo', '野口は別件の応援に回す。被疑者はもう押さえてるんだ。', { scene: sc('todo') }]); }
    if (d === 13) { L.push(['', '（勾留延長。あと10日。）']); if (G.keiji.C().suspect) kit.forms.ext(S, G.keiji.C()); if (!S.staffGone.oka) { K.loseStaff('oka'); L.push(['todo', '岡も外す。残りは白井とお前でやれ。', { scene: sc('todo') }]); } }
    if (d === 8 && !c.confession && o.wantConfession) L.push(['todo', '検事が電話してきた。' + o.wantConfession, { scene: sc('todo') }]);
    if (d === 20) L.push(['shirai', '主任、満期まであと3日です。', { scene: sc('shirai') }]);
    if (!c.confession && !c.releaseAsked) {
      if (d === 5) L.push(['todo', '署長に聞かれたぞ。「自白はまだか」とな。', { scene: sc('todo') }], ['todo', 'このヤマが片づけば、今期の*本部長賞*はうちの係だ。……分かってるな。']);
      if (d === 9) L.push(['todo', '新聞が嗅ぎ回ってる。「捜査難航」と書かれたら、署の面子は丸つぶれだ。', { scene: sc('todo') }], ['todo', '否認のままじゃ、検事も起訴に踏み切れん。*今週中に落とせ*。']);
      if (d === 15) L.push(['shirai', '主任。……遺族の方が、また署に来てました。', { scene: sc('shirai') }], ['shirai', '「いつになったら認めるんですか」と。俺は、何も言えませんでした。']);
    }
    return L;
  };

  /* 勾留中の判断（どれが適法かは示さない。条文帳で確かめ、事件の終わりに振り返る）
     ・弁護人の接見（刑訴法39条1項・3項）
     ・余罪の取調べ
     ・満期後の「任意」の留め置き */
  kit.custodyEvents = async function (S) {
    const c = S.c; if (!kit.inCustody(S) || S._ended) return;
    const d = kit.custodyDay(S), ev = c.ev = c.ev || {}, sc = kit.sc, who = ((G.keiji.C().suspect || {}).name || '被疑者').split('　')[0];
    // 接見：身柄拘束の初日（送致の前）
    if (!ev.sekken && d >= 1) {
      ev.sekken = true;
      const busy = rnd() < .5; c.sekkenBusy = busy;
      await G.talk([['shirai', '主任、弁護士が来てます。' + who + 'の母親に頼まれたそうで、*接見*したいと。', { scene: sc('shirai') }],
        ['', busy ? '（ちょうど、取調室で' + who + 'の取調べをしている最中だった。区切りまでは、あと30分ほど。）' : '（' + who + 'は留置場にいる。今日の取調べは、午後からの予定だ。）'],
        ['todo', '今会わせたら、黙秘を吹き込まれるぞ。……お前が決めろ。', { scene: sc('todo') }]]);
      const v = await G.openPaper({ title: '弁護人の接見', sub: '弁護人となろうとする者が、接見を求めている。逮捕から、まだ一度も会っていない。', noClose: true, body: P('どう対応するか。条文帳で確かめてもよい。'),
        buttons: [{ label: 'すぐに会わせる', value: 'now', small: busy ? '取調べを中断する' : '留置場から接見室へ' },
          { label: '取調べの区切りまで、待ってもらう', value: 'wait', small: busy ? 'あと30分ほど' : '午後の取調べが終わるまで。夕方になる' },
          { label: '今日は会わせない。明日の午後を指定する', value: 'deny', small: '捜査のため必要がある、として日時を指定する' },
          { label: '条文帳を開く', value: 'law', small: '' }] });
      if (v === 'law') { ev.sekken = false; await G.openLaw(); return kit.custodyEvents(S); }
      c.sekken = v === 'wait' && !busy ? 'waitIdle' : v;
      if (v === 'now' || v === 'wait') { c.meter = Math.max(0, (c.meter || 0) - 8); await G.talk([['', v === 'now' ? '（弁護人は30分ほど' + who + 'と話し、帰っていった。）' : '（弁護人は待ち、' + (busy ? '30分後' : '夕方') + 'に' + who + 'と会った。）'], ['shirai', '……黙秘していい、と言われたでしょうね。', { scene: sc('shirai') }]]); }
      else { c.illegalCount = (c.illegalCount || 0) + 1; await G.talk([['', '（弁護人は、指定書を受け取って帰っていった。「これは不当な指定です。準抗告します」と言い残して。）'], ['todo', '構わん。今日一日、話を聞けるだけで違う。', { scene: sc('todo') }]]); }
      return;
    }
    // 余罪：勾留6日目ごろ（別件で拘束している事件は除く）
    if (!ev.yozai && d >= 6 && c.arrest_kind !== 'bekken' && !c.confession) {
      ev.yozai = true;
      await G.talk([['shirai', '主任。' + who + 'ですが、前に近所で自転車を盗んだ話があるんです。被害届も出てます。', { scene: sc('shirai') }],
        ['shirai', '本件で口が重いなら、そっちから崩す手もありますよ。……話し出すと、人は口が軽くなる。']]);
      const v = await G.openPaper({ title: '余罪の取調べ', sub: '勾留されているのは、本件についてだけだ。', noClose: true, body: P('自転車の件（余罪）を、どう扱うか。'),
        buttons: [{ label: '余罪には触れない', value: 'no', small: '本件に集中する' },
          { label: '本件の取調べのあと、拒めることを告げて短く聴く', value: 'ask', small: '「この件は話さなくてもいいし、帰りたいと言ってもいい」' },
          { label: '本件はいったん置き、数日、自転車の件を中心に聴く', value: 'focus', small: '取調室に連日、朝から呼ぶ' },
          { label: '条文帳を開く', value: 'law', small: '' }] });
      if (v === 'law') { ev.yozai = false; await G.openLaw(); return kit.custodyEvents(S); }
      c.yozai = v;
      if (v === 'ask') await G.talk([['', '（' + who + 'は、自転車の件を短く認めた。本件については、何も言わなかった。）']]);
      if (v === 'focus') { c.meter = (c.meter || 0) + 10; c.illegalCount = (c.illegalCount || 0) + 1; c.custodyBad = (c.custodyBad || 0) + 1;
        await G.talk([['', '（三日間、取調室では自転車の話ばかりが続いた。その合間に、本件のことも何度か持ち出した。）'], ['shirai', '口、軽くなってきましたね。', { scene: sc('shirai') }]]); }
      return;
    }
    // 満期後の留め置き：満期の3日前
    if (!ev.hold && d >= kit.LIMIT - 3 && !c.confession && !c.releaseAsked) {
      ev.hold = true; G.audio.cue('expiry');
      await G.talk([['todo', 'いいか。満期で処分保留の釈放になっても、*そのまま帰すな*。', { scene: sc('todo') }],
        ['todo', '「任意で」残ってもらえ。署の外に出すのは、話がついてからでいい。'], ['', '（課長は、それを' + who + 'にも伝えておけと言った。）']]);
      const v = await G.openPaper({ title: '満期の日のこと', sub: '勾留の期間は、延長を含めて最大20日。', noClose: true, body: P('課長の指示に、どう答えるか。'),
        buttons: [{ label: '断る。釈放するなら、そのまま帰す', value: 'no', small: '' },
          { label: '指示に従う。釈放の手続の後も、署に留めて取調べを続ける', value: 'hold', small: '「帰れない」と、本人にも伝えておく' },
          { label: '条文帳を開く', value: 'law', small: '' }] });
      if (v === 'law') { ev.hold = false; await G.openLaw(); return kit.custodyEvents(S); }
      c.hold = v;
      if (v === 'hold') { c.meter = (c.meter || 0) + 12; c.illegalCount = (c.illegalCount || 0) + 1; c.custodyBad = (c.custodyBad || 0) + 1;
        await G.talk([['', '（' + who + 'は、満期が来ても帰れないと知った。その夜、留置場で一睡もしなかったという。）']]); }
      else await G.talk([['todo', '……好きにしろ。結果は、お前が背負え。', { scene: sc('todo') }]]);
    }
  };
  // 手続の振り返り（事件の終わりに。選んだ手段が法的にどう評価されうるか）
  kit.procReview = function (S) {
    const c = S.c, s = c.sess || {}, R = [];
    const ok = (t, w) => R.push('<li class="pr-ok"><b>適法</b>' + t + '<small>' + w + '</small></li>');
    const ng = (t, w) => R.push('<li class="pr-ng"><b>違法の疑い</b>' + t + '<small>' + w + '</small></li>');
    const mid = (t, w) => R.push('<li class="pr-mid"><b>争いあり</b>' + t + '<small>' + w + '</small></li>');
    if (c.rightsSkip) ng('黙秘権を告げずに取り調べた（' + c.rightsSkip + '回）', '刑訴法198条2項・犯罪捜査規範169条に反する。告げなかったことだけで直ちに自白が証拠から外されるとは限らないが、任意性を判断する事情の一つになる');
    if (c.fair) ok('休憩を入れ、夕方までの取調べ（' + c.fair + '回）', '社会通念上相当な方法・限度の範囲（刑訴法198条、最決昭和59年2月29日）');
    if (s.C) ng('夜まで続けた取調べ（' + s.C + '回）', '長時間の取調べによる自白は、任意性に疑いが生じる（憲法38条2項、刑訴法319条1項）');
    if (c.trick) ng('「指紋が出た」という偽計（' + c.trick + '回）', '偽計で心理的強制を与え、虚偽の自白を誘発するおそれがあれば任意性を欠く（最大判昭和45年11月25日）');
    if ((s.D || 0) - (c.trick || 0) > 0) ng('利益の約束（' + ((s.D || 0) - (c.trick || 0)) + '回）', '約束による自白は、任意性に疑いがある（最判昭和41年7月1日）');
    if (s.E) ng('脅迫的な取調べ（' + s.E + '回）', '脅迫による自白は証拠とすることができない（刑訴法319条1項）');
    if (c.ninniPressure) ng('任意の取調べを明け方まで', '任意捜査としての取調べは、社会通念上相当な限度を超えてはならない（最決昭和59年2月29日）');
    if (c.search === 'illegal') ng('令状なしの住居への立入り', '令状主義（憲法35条、刑訴法218条1項）。重大な違法なら証拠が排除される（最判昭和53年9月7日）');
    if (c.arrest_kind === 'bekken') mid('賭博での逮捕と、強盗の取調べ', '別件逮捕・勾留。適法かどうかは見解が分かれる（条文帳「学説　別件逮捕・勾留」）');
    if (c.sekken === 'now') ok('弁護人をすぐに接見させた', '接見は被疑者の権利（刑訴法39条1項）');
    if (c.sekken === 'wait') ok('取調べの区切りまで、30分待ってもらった', '現に取調べ中なら、捜査に顕著な支障があるとして日時を指定できる（39条3項、最大判平成11年3月24日）');
    if (c.sekken === 'waitIdle') ng('取調べをしていないのに、夕方まで待たせた', '指定できるのは、取調べ中など捜査に顕著な支障が生じる場合に限られる（最大判平成11年3月24日）');
    if (c.sekken === 'deny') ng('初めての接見を翌日に指定した', '逮捕直後の初回の接見は特に重要で、これを不当に遅らせる指定は防御の権利を不当に制限する（39条3項ただし書、最判平成12年6月13日）');
    if (c.yozai === 'ask') ok('余罪を、拒めることを告げて短く聴いた', '本件の勾留中でも、任意の取調べとしてなら余罪を聴ける、とする見解が一般的');
    if (c.yozai === 'focus') ng('本件を置いて、余罪を連日取り調べた', '本件の勾留を余罪の取調べに流用すれば、令状主義の潜脱となりうる（条文帳「学説　余罪取調べの限界」）');
    if (c.hold === 'no') ok('満期後の留め置きの指示を断った', '勾留の期間は最大20日（刑訴法208条）');
    if (c.hold === 'hold') ng('満期後も「任意」として署に留めると決めた', '帰れないと告げて留め置けば、実質的な逮捕にあたる（令状のない身柄拘束）');
    if (!R.length) return '';
    return '<h4>手続の振り返り</h4><ul class="procrev">' + R.join('') + '</ul>';
  };

  // 取調べのやり方（共通の枠組み）
  kit.RISK = (recorded, meter) => ({
    C: { id: 'long', title: '長時間の取調べ', gain: ['今夜のうちに自白が取れる見込み：' + (meter >= 55 ? '高い' : 'ある'), '満期を待たずに送致でき、本部の評価が上がる', '課長と検事の期待に応えられる'], law: '憲法38条2項、刑訴法319条1項', lure: meter >= 55 ? '白井「もう限界ですよ。今夜詰めれば、落ちます」' : '白井「時間をかければ、人は話すもんです」',
      effects: ['得た自白が、任意性を欠くとして証拠から外されうる', recorded ? '取調べは録画されている。公判で、その映像が再生される' : '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] },
    D: { id: 'promise', title: '利益を約束して自白を求める', gain: ['相手に「認めたほうが得だ」と思わせれば、話は早い', '被害者・遺族に早く結果を伝えられる'], law: '刑訴法319条1項（判例：約束による自白）', lure: '白井「家族の話をすると、たいてい落ちますよ」',
      effects: ['得た自白が、任意性を欠くとして証拠から外されうる', recorded ? '取調べは録画されている。公判で、その映像が再生される' : '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] },
    E: { id: 'threat', title: '脅迫的な取調べ', gain: ['否認を崩す近道。「あの課長のやり方」で落ちた被疑者は多い', '自白が取れれば、事件は片づく'], law: '憲法38条2項、刑訴法319条1項', lure: '課長「否認してる奴に遠慮してどうする」',
      effects: ['得た自白が、脅迫による自白として証拠から外されうる', recorded ? '取調べは録画されている。公判で、その映像が再生される' : '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] }
  });
  kit.poolLines = function (S, pool, key) {
    const c = S.c; c.used = c.used || {}; const used = c.used[key] = c.used[key] || [];
    for (let i = 0; i < pool.length; i++) { if (used.includes(i)) continue; const L = pool[i](S); if (L) { used.push(i); return L; } }
    c.used[key] = []; for (let i = pool.length - 1; i >= 0; i--) { const L = pool[i](S); if (L) return L; }
    return [['', '（沈黙が続いた。）']];
  };
  /* cfg: { who, bg, labels:{A..E}, pools:{A..E}, first, inc:{A..E:{G,I}}, truthKey:'G'|'I' 値, recorded, after(S) , confess(S, voluntary) , afterConfession(S) } */
  /* 取調べの前：刑事部屋で、部下や課長が「近道」をささやく（選ぶ前に聞かされる誘い） */
  const LURES = [
    S => (S.c.meter || 0) >= 55 ? ['shirai', '主任。あいつ、もう限界ですよ。今夜まで粘れば、落ちます。……昔はみんな、そうやってました。'] : null,
    S => ['shirai', '「現場からお前の指紋が出た」とでも言ってやればいいんですよ。ハッタリです。みんなやってます。'],
    S => ['todo', '否認してる奴に遠慮するな。机の一つも叩いてみろ。'],
    S => ['shirai', '「認めれば、すぐ出られる」。……そう言えば、たいてい落ちますよ。'],
    S => ['todo', '検事が待ってるんだ。今日こそ落としてこい。やり方は任せる。']
  ];
  kit.lure = function (S) {
    const c = S.c; if (c.confession || c.lureDay === S.day || G.rnd() > .6) return null;
    const opts = LURES.map(f => f(S)).filter(Boolean).filter(l => l[1] !== c.lastLure);
    if (!opts.length) return null;
    const l = opts[Math.floor(G.rnd() * opts.length)]; c.lureDay = S.day; c.lastLure = l[1];
    return [['', '（取調室へ向かおうとすると――）', { scene: kit.sc(l[0]) }], [l[0], l[1], { scene: kit.sc(l[0]) }]];
  };
  /* 取調べの始めに、黙秘権（供述拒否権）を告げる（刑訴法198条2項）。告げずに始めることもできてしまう */
  kit.rights = async function (S, who) {
    const c = S.c;
    const v = await G.openPaper({ title: '取調べを始める', sub: '取調室。' + (c.rightsTold ? '今日の取調べの始め。' : 'はじめての取調べ。'), noClose: true,
      body: P('最初に何をするか。') + G.note('刑訴法198条2項：取調べに際しては、あらかじめ、自己の意思に反して供述をする必要がない旨を告げなければならない。犯罪捜査規範169条：取調べが相当期間中断した後に再開するときや、取調官が交代したときは、改めて告げる。'),
      buttons: [{ label: '黙秘権を告げる', value: 'ok', cls: 'green', small: '「言いたくないことは、言わなくていい」' }, { label: '告げずに始める', value: 'skip', small: '前にも告げた。時間が惜しい' }, { label: 'やめておく', value: null, small: '今日は取り調べない' }] });
    if (!v) return false;
    if (v === 'ok') { c.rightsTold = (c.rightsTold || 0) + 1; await G.talk([['you', G.pick(['あなたには、言いたくないことは言わなくていい権利があります。', '今日も最初に言っておく。言いたくないことは、言わなくていい。', '話したくないことは、話さなくていい。そのうえで聞く。'])], [who, G.pick(['……はい。', '……', '……分かってます。'])]]); }
    else c.rightsSkip = (c.rightsSkip || 0) + 1;
    return true;
  };
  kit.interro = async function (S, cfg) {
    const c = S.c; c.sess = c.sess || { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const lure = kit.lure(S); if (lure) await G.talk(lure);
    G.audio.ambient('interro'); G.audio.cue('interro'); G.drawScene(kit.sc(cfg.who, 'interro', kit.stage(S)));
    if (c.rightsDay !== S.day) { if (!(await kit.rights(S, cfg.who))) { G.audio.ambient(null); return false; } c.rightsDay = S.day; }
    if (c.confession) { const r = cfg.afterConfession ? await cfg.afterConfession(S) : (await G.talk([[cfg.who, '……書いてあるとおりです。']]), false); G.audio.ambient(null); return r; }
    const rec = c.recorded != null ? c.recorded : cfg.recorded;
    if (rec) await G.talk([['', '（録画装置の赤いランプが点いている。この取調べは、最初から最後まで記録される。）']]);
    const total = c.sess.A + c.sess.B + c.sess.C + c.sess.D + c.sess.E;
    if (total === 0 && cfg.first && !c.sawFirst) { c.sawFirst = true; await G.talk(cfg.first); }
    const L = cfg.labels;
    // どの進め方が適法かは、印を付けない（条文帳で確かめる）
    const k0 = await G.openPaper({ title: '取調べ', sub: cfg.sub ? cfg.sub(S) : '', noClose: true, body: P('どう進めるか。', '（どの進め方が法的に許されるかは、「条文帳を開く」で、刑訴法198条・319条と判例を確かめられる。）'),
      buttons: [{ label: L.A[0], value: 'A', small: L.A[1] }, { label: L.B[0], value: 'B', small: L.B[1] },
        { label: '休憩を入れて、夕方まで追及する', value: 'F', small: '朝9時から夕方まで。昼食と休憩をはさみ、同じ点を何度も確かめる' },
        { label: '夜まで取調べを続ける', value: 'C', small: '朝9時から、話すまで。' + ((c.meter || 0) >= 55 ? '今夜なら、落ちる' : '一晩で話が動くことは多い') },
        { label: '「現場からお前の指紋が出た」と告げる', value: 'G', small: '鑑定の結果は、まだ出ていない。反応を見る' },
        { label: '怒鳴りつけ、追い詰める', value: 'E', small: (L.E || '机を叩く。家族のことを持ち出す') + '。否認を崩す近道' },
        { label: L.D[0], value: 'D', small: L.D[1] + '。相手の逃げ道を用意してやる' }, { label: 'やめておく', value: null, small: '時間は使わない' }, { label: '条文帳を開く', value: 'law', small: '刑訴法198条・319条、判例' }] });
    if (k0 === 'law') { await G.openLaw('判例・学説'); c.sawFirst = true; return kit.interro(S, cfg); }
    if (!k0) { G.audio.ambient(null); return false; }
    // F（休憩を入れた長めの取調べ）は B と同じ扱い、G（偽計）は D（約束による自白）と同じ扱い
    const k = k0 === 'F' ? 'B' : k0 === 'G' ? 'D' : k0;
    const R = kit.RISK(rec, c.meter || 0);
    const risk = k0 === 'G' ? Object.assign({}, R.D, { id: 'trick', title: '偽計を用いた取調べ', law: '憲法38条2項、刑訴法319条1項（判例：偽計による自白）', lure: '白井「ハッタリですよ。みんなやってます」' }) : R[k];
    if (risk && !(await G.confirmRisk(risk))) { G.audio.ambient(null); return false; }
    c.sess[k]++; if (k0 === 'G') c.trick = (c.trick || 0) + 1; if (k0 === 'F') c.fair = (c.fair || 0) + 1; if (rec && 'CDE'.includes(k)) c.recordedAbuse = (c.recordedAbuse || 0) + 1;
    const W = cfg.who;
    const lines = k0 === 'F' ? kit.poolLines(S, [S2 => [['', '（昼食と休憩をはさみ、夕方まで、同じ点を角度を変えて確かめた。）'], [W, '……何度聞かれても、同じです。']], S2 => [['', '（休憩を入れながら、供述の細かい食い違いを一つずつ確かめた。）'], [W, '……そこは、よく覚えていません。']]], 'F')
      : k0 === 'G' ? kit.poolLines(S, [S2 => [['you', '現場から、お前の指紋が出たぞ。'], [W, '……え？'], ['', '（相手の顔から、血の気が引いた。……本当は、まだ鑑定の結果は出ていない。）']], S2 => [['you', '指紋のことは、もう分かってるんだ。'], [W, '……そんなはずは。']]], 'G')
      : kit.poolLines(S, cfg.pools[k], k);
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

  /* 自白の後の取調べ（共通）
     cfg: { who, guiltyKey, topics:[{k,label,small,run(S)}], chat:[fn], retracted:[...lines] } */
  kit.afterConfession = async function (S, cfg) {
    const c = S.c; c.asked = c.asked || {};
    if (c.retractCustody) { await G.talk([[cfg.who, 'やってません。前に言ったことは、本当じゃない。'], ['', '（それ以上、何も答えない。）']]); }
    const topics = (cfg.topics || []).filter(t => !c.asked[t.k]);
    const done = !topics.length;
    if (done && !c.retractCustody) await G.talk([['', '（自白の中身は、もう一通り聞いた。これ以上は何も話さなそうだ。）']]);
    const k = await G.openPaper({ title: '取調べ（自白の後）', body: P(c.retractCustody ? '被疑者は自白を撤回している。' : '自白の内容を確かめ、裏付けを取る。答えが本当なら、裏付けが取れるはずだ。'), noClose: true,
      buttons: (c.retractCustody ? [] : topics.map(t => ({ label: t.label, value: t.k, small: t.small || '' })))
        .concat([{ label: '雑談をする', value: '_chat', small: '事件以外の話。人柄が見えるかもしれない' },
          { label: '何か話すまで続ける', value: '_push', small: '夜まで。話が変わるかもしれない' },
          { label: '今日はやめておく', value: null, small: '時間は使わない' }]) });
    if (!k) return false;
    if (k === '_chat') {
      c.chatN = (c.chatN || 0) + 1;
      await G.talk(kit.poolLines(S, cfg.chat, 'chat'));
      if (c.truth !== cfg.guiltyKey && !c.confession.voluntary && !c.retractCustody && rnd() < .2) { c.retractCustody = true; await G.talk([[cfg.who, '……刑事さん。'], [cfg.who, 'やっぱり、やってません。前に言ったことは、本当じゃない。'], ['', '（自白を撤回した。）']]); }
      return;
    }
    if (k === '_push') {
      if (!(await G.confirmRisk(kit.RISK(c.recorded, 0).C))) return false;
      c.sess.C++; if (c.recorded) c.recordedAbuse = (c.recordedAbuse || 0) + 1;
      await G.talk([['', '（夜まで続けた。）'], [cfg.who, c.retractCustody ? '……もう、何でもいいです。書いたとおりで。' : '……書いてあるとおりです。もう、それでいいでしょう。']]);
      if (c.retractCustody) c.retractCustody = false;
      return;
    }
    c.asked[k] = true;
    const t = cfg.topics.find(x => x.k === k);
    await t.run(S);
    if (c.truth !== cfg.guiltyKey && !c.confession.voluntary && rnd() < .2) { c.retractCustody = true; await G.talk([[cfg.who, '……やっぱり、違います。やってません。'], ['', '（自白を撤回した。）']]); }
  };

  // 令状の書類（実際の様式で、捜査記録に綴る）
  kit.forms = {
    data(S, C, bekken) {
      const K = G.keiji, ch = kit.charge(S), sp = C.suspect || {};
      return Object.assign({}, sp, { charge: bekken ? '賭博' : ch ? ch.label : '（未定）', facts: C.factsOf ? C.factsOf(S, bekken) : '別紙のとおり', date: K.date(), valid: K.date(S.day + 7), judgeName: '浅倉　綾', sealed: true,
        requester: '北見坂警察署　司法警察員　警部　東堂　剛' });
    },
    request(S, C, bekken) {
      const d = kit.forms.data(S, C, bekken);
      G.keiji.addDoc({ id: 'warrantReq' + (bekken ? 'B' : ''), title: '逮捕状請求書（控）' + (bekken ? '：賭博' : ''), kind: 'memo', body: G.forms.request('逮捕状請求書', [
        ['被疑者', d.name + '（' + d.kana + '）　' + d.age + '　' + d.job], ['住居', d.addr], ['罪名', d.charge], ['被疑事実の要旨', d.facts],
        ['逮捕の必要', C.arrestNeed || '被疑者は、罪証を隠滅し、又は逃亡するおそれがある。'], ['引致すべき場所', '北見坂警察署']], { date: d.date, who: '東堂　剛' }) });
    },
    issued(S, C, bekken) {
      const d = kit.forms.data(S, C, bekken);
      G.keiji.addDoc({ id: 'warrant' + (bekken ? 'B' : ''), title: '逮捕状（通常逮捕）' + (bekken ? '：賭博' : ''), kind: 'neu', body: G.forms.arrest(d) });
    },
    koryu(S, C) {
      const d = kit.forms.data(S, C, S.c.arrest_kind === 'bekken' && !S.c.honkenArrested);
      G.keiji.addDoc({ id: 'koryuJo', title: '勾留状', kind: 'neu', body: G.forms.koryu(Object.assign(d, { reqDate: G.keiji.date(S.day - 1), valid: G.keiji.date(S.day + 7), grounds: C.koryuGrounds || [2, 3], judgeName: '浅倉　綾' })) });
    },
    ext(S, C) {
      const d = kit.forms.data(S, C, S.c.arrest_kind === 'bekken' && !S.c.honkenArrested), K = G.keiji;
      K.addDoc({ id: 'koryuJo', title: '勾留状（延長の記載あり）', kind: 'neu', body: G.forms.koryu(Object.assign(d, { reqDate: K.date(S.day - 11), valid: K.date(S.day - 3), grounds: C.koryuGrounds || [2, 3],
        ext: { days: 10, to: K.date(S.day + 9), why: '関係者の取調べ未了、鑑定結果未着のため。', date: K.date() } })) });
    }
  };

  // 事件の終わりに、経歴・記章・記録庫のために残すこと
  kit.outcomeExtra = function (S, C) {
    const c = S.c, sess = c.sess || {};
    const pairs = C && C.pick ? Object.keys(C.pick).filter(k => { const [x, y] = k.split('|'); return S.docs.some(d => d.id === x) && S.docs.some(d => d.id === y) && C.compare(S, x, y); }) : [];
    return { grade: c.grade || 'C', confession: !!c.confession, voluntary: !!(c.confession && c.confession.voluntary), retract: !!c.retract,
      proc: { C: sess.C || 0, D: sess.D || 0, E: sess.E || 0, illegal: c.illegalCount || 0, search: c.search || null, bekken: c.arrest_kind === 'bekken', leaks: (c.leaks || []).length, todoTook: !!c.todoTook, recorded: !!c.recorded, recordedAbuse: c.recordedAbuse || 0 },
      found: Object.keys(S.compared || {}).length, pairs: pairs.length, misses: c.missPoints || 0, secret: !!c.safeFound, released: c.how === 'release', charge: c.charge || null, chargeMismatch: !!c.chargeMismatch };
  };

  // 罪名を選ぶ（逮捕状の請求、または送致のとき）
  kit.charge = S => S.c.charge && (G.keiji.C().charges || []).find(x => x.id === S.c.charge);
  kit.title = (S, name) => { const ch = kit.charge(S); return name + (ch ? '（' + ch.label + '）' : ''); };
  kit.chooseCharge = async function (S, C, why, must) {
    if (S.c.charge) return kit.charge(S);
    let v;
    for (;;) {
      const cards = C.charges.map(ch => '<div class="chcard"><div class="chh">' + ch.label + '<span>' + ch.law + '</span></div>'
        + (ch.arts || []).map(k => { const r = G.lawFind(k); return r ? '<div class="chart"><b>' + r[0] + '</b>' + r[1] + '</div>' : ''; }).join('')
        + (ch.req ? '<div class="chreq">要素：' + ch.req.map(x => '<span>' + x + '</span>').join('') + '</div>' : '') + '</div>').join('');
      v = await G.openPaper({ title: '罪名を決める', sub: why === 'warrant' ? '逮捕状請求書の「罪名」「被疑事実の要旨」の欄' : why === 'soutchi' ? '送致書の「罪名」の欄' : '捜査の見立て。一度決めると、変えられない',
        body: G.P('集めた記録から、何の罪にあたるかを決める。罪名によって、逮捕・勾留の判断、取調べの録音・録画の義務、裁判の形が変わる。何の罪で起訴するかは、最終的には検察官が決める。')
          + (C.chargeHint ? '<div class="howto"><b>見分けるところ</b>' + C.chargeHint + '</div>' : '') + cards,
        noClose: true, buttons: C.charges.map(ch => ({ label: ch.label, value: ch.id, small: ch.law })).concat([{ label: '条文帳（刑法）を開く', value: '_law' }], must ? [] : [{ label: 'まだ決めない', value: null }]) });
      if (v !== '_law') break;
      await G.openLaw('刑法');
    }
    if (!v) return null;
    S.c.charge = v; const ch = kit.charge(S);
    if (C.charges.find(x => x.fit).id !== v) S.c.chargeMismatch = true;
    G.audio.sfx('stamp'); return ch;
  };
  kit.mismatchLines = (S, C) => {
    const ch = kit.charge(S), fit = C.charges.find(x => x.fit);
    if (!ch || ch.fit) return [];
    return [['kenji', '送致罪名は「' + ch.label + '」ですね。'], ['kenji', '……記録を読む限り、問題になるのは「' + fit.label + '」です。何の罪で起訴するかは、こちらで判断します。']];
  };

  // 釈放を進言する（全事件共通）
  kit.releaseAction = (gaugeOf, finish) => ({ id: 'release', who: 'self', label: '釈放を進言する', sub: '嫌疑が足りない、または身柄を拘束する必要がない', cond: S => kit.inCustody(S) && kit.custodyDay(S) >= 2 && !S.c.releaseAsked,
    run: async S => {
      const ok = await G.openPaper({ title: '釈放の進言', body: P('集めた記録では、起訴するだけの嫌疑がない。あるいは、身柄を拘束し続ける必要がない。そう判断するなら、課長と検事に釈放を進言できる。',
        '勾留中でも、検察官は被疑者を釈放できる。釈放したうえで在宅のまま捜査を続けることも、嫌疑不十分で不起訴とすることもある。'), noClose: true,
        buttons: [{ label: '釈放を進言する', value: true, cls: 'green' }, { label: 'やめる', value: false }] });
      if (!ok) return false;
      S.c.releaseAsked = true;
      const e = gaugeOf(S);
      if (e.ok && e.w >= 4) {
        await G.talk([['todo', '……何を言ってる。これだけ揃ってて、釈放だと？', { scene: kit.sc('todo') }], ['todo', '却下だ。満期まで、仕事をしろ。'], ['', '（進言は退けられた。この判断は、本部にも伝わった。）']]);
        S.c.releaseRejected = true; return;
      }
      await G.talk([['todo', '…………', { scene: kit.sc('todo') }], ['todo', '分かった。検事に伝える。……お前の名前でな。'], ['', '（課長は受話器を取った。）', { sfx: 'phone' }]]);
      await finish(S, 'release');
    } });

  // 本部の評価（組織の帳簿）
  kit.honbu = function (S, verdict, revealed) {
    const c = S.c;
    const mism = c.chargeMismatch ? 1 : 0;
    const base = { '有罪': 4, '有罪（減軽）': 3, '略式命令（罰金）': 3, '無罪': -2, '不起訴': 0, '釈放（不起訴）': -1, '未解決': -2 }[verdict] ?? 0;
    const miss = c.missPoints || 0;
    let sc = base + (c.confession ? 1 : 0) - (c.excludedIllegal || 0) * 2 - (c.releaseRejected ? 1 : 0) - mism;
    const grade = sc >= 4 ? 'A' : sc >= 2 ? 'B' : sc >= 0 ? 'C' : 'D'; c.grade = grade;
    const word = { A: '「よくやった。次の異動、悪いようにはせん」（東堂課長）', B: '「まあ、及第点だ」（東堂課長）', C: '「署長が渋い顔をしてたぞ」（東堂課長）', D: '「本部長賞は、別の係に行った」（東堂課長）' }[grade];
    const proc = (c.sess ? (c.sess.C ? 1 : 0) + (c.sess.D ? 1 : 0) + (c.sess.E ? 1 : 0) : 0) + (c.illegalCount || 0) + (c.search === 'illegal' ? 1 : 0) + (c.arrest_kind === 'bekken' ? 1 : 0);
    let after = '';
    if (revealed === 'wrong') after = '<br><br>数年後、再審無罪が報じられた日、県警本部は「当時の捜査は適正に行われた」とのコメントを出した。<br>あなたの人事記録の評価は、変わらなかった。';
    if (revealed === 'free') after = '<br><br>数年後、事件が報じられた日、県警本部は「当時の判断に問題はなかった」とのコメントを出した。';
    return '<div class="doc-s"><h3>本部の評価　' + grade + '</h3>' + word + '<br><br>結果：' + verdict + (c.confession ? '　／　自白：あり' : '') + (c.charge ? '<br>送致罪名：' + (kit.charge(S) || {}).label + (mism ? '（検察官が罪名を改めた）' : '') : '')
 + '<br><br><span style="color:#aaa">手続の記録：問題のある捜査 ' + proc + '件　／　送らなかった記録 ' + (c.withheld || []).length + '件</span>' + kit.procReview(S) + after + '</div>';
  };

  // 送致書（目録）の画面
  kit.soutchi = async function (C, S) {
    const c = S.c;
    if (c.how !== 'unsolved' && C.charges) await kit.chooseCharge(S, C, 'soutchi', true);
    G.audio.cue('soutchi');
    await G.curtain([{ html: '<div class="big">' + (c.how === 'release' ? '釈放・送致' : '送致') + '</div>', wait: 900 }]);
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
      buttons: [{ label: '課長に任せる', value: true, small: '取調室のことは、あなたは見ない' }, { label: '自分にやらせてほしいと言う', value: false, small: '課長は不機嫌になる' }] });
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
