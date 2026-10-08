'use strict';
/* ============================================================
   事件：8時12分発（迷惑行為防止条例違反＝痴漢）
   証拠の中心は被害者の供述。認めれば略式の罰金で、その日のうちに帰れる。
   真相：'G'（佐伯が触った）／'I'（後ろにいた江藤が触った）
   ============================================================ */
(function () {
  const K = G.keiji, P = G.P, kv = G.kv, note = G.note, rnd = G.rnd, kit = G.kit, sc = kit.sc;
  const inC = kit.inCustody, cday = kit.custodyDay;
  const C = {
    id: 'chikan', role: '捜査官', base: { m: 6, d: 10 }, dayCard: true,
    staff: [{ id: 'shirai', name: '白井' }, { id: 'oka', name: '岡' }, { id: 'noguchi', name: '野口' }],
    info: S => kit.info(S, '8時12分発'),
    suspect: { name: '佐伯　修', kana: 'さえき おさむ', age: '45歳', job: '会社員（北見坂精機株式会社）', addr: '北見坂市緑ヶ丘二丁目11番3号' },
    koryuGrounds: [2],
    factsOf: S => S.c.charge === 'fudoi'
      ? '被疑者は、6月10日午前8時12分ころから同15分ころまでの間、北見坂中央駅から次駅に向けて進行中の電車内において、森川美咲（当時20歳）に対し、同人が同意しない意思を表明するいとまがないことに乗じ、着衣の上から臀部を手で触るわいせつな行為をしたものである。'
      : '被疑者は、6月10日午前8時12分ころから同15分ころまでの間、北見坂中央駅から次駅に向けて進行中の電車内において、森川美咲（当時20歳）に対し、着衣の上から臀部を手で触り、もって公共の乗物において、人を著しく羞恥させ、かつ、人に不安を覚えさせるような方法で、衣服の上から人の身体に触れたものである。',
    chargeHint: '分けるのは<b>行為の態様と程度</b>。衣服の上から触る行為は、多くは迷惑行為防止条例違反として扱われる。下着の中に手を入れるなど、行為がより重い場合は不同意わいせつ（刑法176条）が問題になる。満員電車で抵抗する間もない状態は、176条1項5号の「いとまがない」にあたりうる。',
    charges: [
      { id: 'jorei', label: '迷惑行為防止条例違反', law: '北見坂県迷惑行為防止条例（衣服の上から触る行為）', fit: true, arts: ['北見坂県迷惑行為防止条例'], req: ['公共の乗物の中で', '衣服の上から身体に触れる', '故意'] },
      { id: 'fudoi', label: '不同意わいせつ', law: '刑法176条', arts: ['刑法 第176条'], req: ['同意しない意思を表すのが困難な状態', 'わいせつな行為', '故意'], els: (S, e) => [e[0], e[1], { k: 'わいせつな行為（程度）', v: 1 }, e[2]] }
    ],
    scene: S => sc(null, 'office'),
    endHint: S => inC(S) ? '満期までに記録を固める' : '',
    stopSkip: S => inC(S) && (cday(S) >= kit.LIMIT || (cday(S) >= 16 && !S.c.confession && !S.c.takeoverAsked)),
    gauge: S => G.trial.gauge(S, TRIAL),
    nextMilestone: S => kit.nextMilestone(S),
    elements: S => {
      const c = S.c, d = id => !!K.doc(id);
      const who = c.confession ? 3 : Math.min(3, (d('victim2') ? 2 : d('victim') ? 1.5 : 0) + (c.fiber === true ? 2 : 0) + (d('passenger') ? .5 : 0));
      return [
        { k: '触られた事実', v: d('victim') ? 3 : 1 },
        { k: '触ったのは佐伯', v: Math.floor(who), conf: !!c.confession && c.fiber !== true },
        { k: '故意', v: c.confession ? 3 : 1, conf: !!c.confession }
      ];
    },
    morning: (S, first) => {
      const c = S.c, L = [];
      if (first) {
        L.push(['', '（6月10日、午前8時31分。北見坂中央駅の駅員室から、生活安全課を通じて刑事課に連絡が入った。）', { sfx: 'phone' }],
          ['todo', '痴漢だ。8時12分発の快速、2両目。被害者は大学生。本人が男の手首を掴んで、次の駅で駅員に突き出した。', { scene: sc('todo') }],
          ['todo', '男は佐伯修（さえき おさむ）、45歳。北見坂精機の課長。「やってない」の一点張りだ。'],
          ['todo', '私人による現行犯逮捕だ（刑訴法213条）。駅員から身柄を受け取った。ここから48時間だぞ。'],
          ['shirai', '主任。痴漢は、時間との勝負です。手を洗われたら、繊維は取れなくなる。', { scene: sc('shirai') }]);
        K.addDoc({ id: 'handover', title: '現行犯人引渡書', kind: 'neu', evid: true, body: kv([['逮捕者', '森川美咲（もりかわ みさき・20歳、大学生）'], ['逮捕の日時・場所', '6月10日 午前8時18分ころ、北見坂中央駅 2番線ホーム'], ['被疑事実', '快速電車内で、逮捕者の臀部を着衣の上から触った'], ['引渡し', '同日午前8時35分、駅員を通じて司法警察員に引き渡し（刑訴法214条）']]) });
        K.addDoc({ id: 'manual', title: '捜査の要点', kind: 'memo', body: P('・満員電車の痴漢は、客観的な証拠が残りにくい。被害者の供述が唯一の証拠であることも多い。',
          '・判例（最判平成21年4月14日・要旨）：このような事件では、被害者の供述の信用性を特に慎重に判断する必要がある。',
          '・衣服の上から触る行為は、多くは迷惑行為防止条例違反（北見坂県の条例は架空。法定刑：6月以下の拘禁刑又は50万円以下の罰金）。行為の態様によっては、不同意わいせつ（刑法176条）にあたる。条例違反なら、被疑者が認めれば略式手続（罰金）で終わることが多い（刑訴法461条）。',
          '・確定した略式命令は、確定判決と同一の効力を持つ（刑訴法470条）。') });
        c.arrest = 0; c.recorded = false;
        return L;
      }
      if (inC(S)) {
        L.push(...kit.custodyMorning(S, { name: '佐伯', kenji2: '否認ですか。……認めれば略式で終わるんですがね。', wantConfession: 'まだ認めないのか、とな。' }));
        if (cday(S) === 1) { K.addDoc({ id: 'news', title: '新聞記事', kind: 'memo', body: P('<b>電車内で痴漢の疑い　北見坂精機の課長を逮捕</b>', '北見坂署は、快速電車内で女子大学生の体を触ったとして、北見坂県迷惑行為防止条例違反の疑いで、北見坂精機課長、佐伯修容疑者（45歳）を逮捕した。同容疑者は「やっていない」と否認している。') });
          L.push(['', '（朝刊とネットのニュースに、佐伯の名前と勤め先が出た。）']); }
        if (cday(S) === 3) L.push(['wifeS', 'もしもし、佐伯の家内です。……主人は、いつ帰ってこられるんでしょうか。娘が、学校で……。', { scene: { bg: 'phone' } }]);
        if (cday(S) === 6) { c.fired = true; L.push(['shirai', '佐伯の会社、懲戒の手続きに入ったそうです。課長職は外された。', { scene: sc('shirai') }], ['shirai', '……否認してる限り、勾留は続く。認めりゃ、罰金で今日にも出られるのにな。']); }
      }
      return L;
    },
    check: async S => {
      const c = S.c;
      if (inC(S) && cday(S) >= 16 && !c.confession && !c.takeoverAsked && !(c.sess.C || c.sess.D || c.sess.E)) await kit.takeover(S, confess);
      if (inC(S) && cday(S) >= kit.LIMIT) { await finish(S, 'soutchi'); return 'end'; }
    },
    actions: []
  };
  const A = C.actions;

  // 照合：二枚のどの記載を選べば、つながりに気づくか（記録の組は名前順）
  C.pick = {
    'victim|victim2': [/すぐ後ろ|手首|見たわけではない/, /触っている手/],
    'passenger|stationCam': [/灰色のコート/, /灰色のコート|すぐ後ろ|手首/],
    'passenger|victim': [/灰色のコート/, /灰色のコート|すぐ後ろ|手首/],
    'claim|reenact': [/吊り革|鞄/, /吊り革|鞄|不自然/],
    'eto|stationCam': [/前歴|江藤|8:17/, /灰色のコート|8:16|降車/],
    'claim|fiber': [/左手|鞄|触っていない/, /繊維/]
  };
  C.compare = (S, a, b) => {
    const c = S.c, has = (x, y) => (a === x && b === y) || (a === y && b === x);
    if (has('victim', 'victim2')) return { lines: [['', '（1回目は「すぐ後ろにいた人の手首を掴んだ」。2回目は「触っている手を掴んだ」。）'], ['oka', '……2回目は、こちらが「触っている手を掴んだんですね」と確認したあとの調書です。', { scene: sc('oka') }]], memo: { title: '被害者の供述の変化', text: '1回目「振り向いて、すぐ後ろにいた人の手首を掴んだ」→ 2回目「触っている手を掴んだ」。2回目は確認の問いの後に録取された。' } };
    if (has('passenger', 'stationCam') || has('passenger', 'victim')) return { lines: [['', '（乗客は「その後ろに灰色のコートの男もいた」。）'], ['shirai', '……もう一人いたってことですな。', { scene: sc('shirai') }]], memo: { title: 'もう一人の男', text: '被害者の背後には、佐伯のほかに、灰色のコートの男がいた。' }, then: S => { c.coatLead = true; } };
    if (has('claim', 'reenact')) return { lines: [['', '（佐伯は「右手で吊り革、左手で鞄」。再現では、鞄を持ったまま左手を伸ばすと、届くが不自然な姿勢になる。）'], ['oka', '届くことは届く。でも、そうするかと言われると……。', { scene: sc('oka') }]], memo: { title: '手の位置', text: '佐伯の言う姿勢のままでも手は届くが、不自然な姿勢になる。' } };
    if (has('eto', 'stationCam')) return { lines: [['', '（灰色のコートの男は江藤。痴漢の前歴が2件。次の駅で、急ぐように降りている。）'], ['shirai', '……主任。こっちのほうが、よっぽど臭いですよ。', { scene: sc('shirai') }]], memo: { title: '江藤', text: '被害者の斜め後ろにいた江藤には、痴漢の前歴が2件あり、事件直後の駅で降りている。' } };
    if (has('fiber', 'claim') && c.fiber !== undefined) return c.fiber ? { lines: [['', '（佐伯の左手の指から、被害者のスカートと同種の繊維。）'], ['shirai', '左手は鞄を持ってた、と言ってましたな。', { scene: sc('shirai') }]], memo: { title: '指の繊維', text: '佐伯の左手指から、被害者のスカートと同種の繊維が検出された。ただし満員の車内では、接触で付着することもありうる。' } }
      : { lines: [['', '（佐伯の指からは、繊維は検出されなかった。）'], ['oka', '触っていたなら、何か付きそうなものですけどね。', { scene: sc('oka') }]], memo: { title: '指の繊維', text: '佐伯の指から、被害者のスカートの繊維は検出されなかった。' } };
    return null;
  };

  A.push({ id: 'swab', who: 'staff', days: 0, label: '佐伯の手指から微物を採取する', short: '微物の採取', sub: '手を洗われる前に', cond: S => S.day === 0,
    done: S => { S.c.swabbed = true; return [['noguchi', '両手の指先から、テープで採取しました。科捜研に回します。結果は1週間ほど。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'fiberRes', who: 'staff', days: 7, label: '微物（繊維）の鑑定を急がせる', short: '繊維鑑定', cond: S => S.c.swabbed,
    done: S => { const c = S.c; c.fiber = c.truth === 'G' ? rnd() < .7 : rnd() < .15;
      K.addDoc({ id: 'fiber', title: '微物鑑定書', kind: 'neu', evid: true, body: c.fiber ? P('佐伯の左手中指・薬指から、被害者のスカート（ポリエステル・紺色）と色調・材質が<b>同種の繊維</b>を検出した。', '同種の生地は広く流通している。') : P('佐伯の両手指から、被害者のスカートと同種の繊維は<b>検出されなかった</b>。') });
      return [['oka', c.fiber ? '繊維、出ました。左手の指から、スカートと同じ種類のが。' : '繊維は……出ませんでした。', { scene: sc('oka') }]]; } });
  A.push({ id: 'victimTalk', who: 'self', label: '被害者から話を聴く', sub: '女性警察官が同席する', cond: S => !S.fin.victimTalk, run: async S => {
    G.drawScene(sc('misaki', 'office'));
    await G.talk([['misaki', '駅を出てすぐ、お尻を触られて……最初は、混んでるからかと思ったんです。でも、ずっと。'], ['misaki', '怖くて、振り向いて、すぐ後ろにいた人の手首を掴みました。'], ['misaki', '……ごめんなさい、ちゃんと見たわけじゃないんです。触ってる手を、見たわけじゃ。']]);
    K.addDoc({ id: 'victim', title: '被害者の供述調書', kind: 'neu', evid: true, body: P('（森川美咲・20歳）', '8時12分に北見坂駅を出てすぐ、着衣の上から臀部を触られた。数分間続いた。', '振り向いて、すぐ後ろにいた男の手首を掴んだ。触っている手そのものを見たわけではない。') });
  } });
  A.push({ id: 'victimConfirm', who: 'self', label: '被害者に「触っている手を掴んだんですね」と確かめる', sub: '供述をはっきりさせる', cond: S => S.fin.victimTalk,
    risk: { id: 'chikanLead', lure: '課長「『たぶん』じゃ、公判がもたん。はっきりさせておけ」', title: '答えを含んだ問いで、被害者の供述を固める', law: '禁止規定はない。供述の信用性の問題', effects: ['被害者の記憶が、問いに合わせて変わるおそれがある', '弁護人は、供述が変わった経緯を必ず問う', '被害者自身が、後で苦しむことになるかもしれない'] },
    run: async S => {
      G.drawScene(sc('misaki', 'office'));
      await G.talk([['you', '確認ですが……触っている手を、掴んだんですね。'], ['misaki', '……え。'], ['misaki', '……はい。たぶん、そうだと思います。……はい。']]);
      K.addDoc({ id: 'victim2', title: '被害者の供述調書（2通目）', kind: 'neu', evid: true, body: P('（森川美咲）', '私は、自分の臀部を触っている手を掴みました。その手は、佐伯さんの左手でした。') });
    } });
  A.push({ id: 'passenger', who: 'staff', days: 2, label: '同じ車両の乗客を探して話を聴く', short: '乗客の聞き込み', cond: S => true,
    done: S => { K.addDoc({ id: 'passenger', title: '乗客の供述', kind: 'neu', evid: true, body: P('（会社員・30代男性。毎朝同じ車両）', '女の子のすぐ後ろに、あのスーツの人がいた。その人の手が、女の子の近くにあったのは見えた。触ってたかどうかは分からない。', 'その後ろに、灰色のコートを着た背の高い男もいた。次の駅で、すぐ降りていったと思う。') });
      return [['passenger', '後ろに、灰色のコートの男もいましたよ。次の駅で降りたかな。', { scene: { bg: 'street' } }]]; } });
  A.push({ id: 'stationCam', who: 'staff', days: 3, label: 'ホームの防犯カメラを確認する', short: 'ホームのカメラ', cond: S => true,
    done: S => { K.addDoc({ id: 'stationCam', title: 'ホーム防犯カメラの確認結果', kind: 'neu', evid: true, body: P('8:11、2両目の乗車口。被害者の直後に佐伯、その斜め後ろに灰色のコートの男（推定身長180cm）が乗車。', '8:16、次の停車駅で、灰色のコートの男が足早に降車。顔は判別できない。') });
      return [['noguchi', '乗るとき、佐伯の斜め後ろに灰色のコートの男がいます。次の駅で、急いで降りてる。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'icCard', who: 'staff', days: 5, label: '鉄道会社に交通系ICカードの記録を照会する', short: 'ICカード照会', sub: '197条2項。コートの男は誰か', cond: S => S.c.coatLead || S.fin.stationCam,
    done: S => { K.addDoc({ id: 'eto', title: 'ICカード照会・前歴照会結果', kind: 'neu', evid: true, body: P('次の停車駅で8:17に出場したICカードの記名者のうち、映像の人物と特徴が合うのは、江藤浩二（えとう こうじ・54歳）。', '江藤には、電車内の痴漢による条例違反の前歴が2件（いずれも罰金）。') });
      return [['oka', 'コートの男、江藤浩二。……痴漢の前歴が2件あります。', { scene: sc('oka') }]]; } });
  A.push({ id: 'etoTalk', who: 'self', label: '江藤から任意で話を聴く', sub: '相手は断れる', cond: S => S.fin.icCard && !S.fin.etoTalk, run: async S => {
    G.drawScene(sc('eto', 'street'));
    await G.talk([['eto', '……その電車には乗ってたかもしれない。毎朝乗ってるから。'], ['eto', '何もしてない。前のことを持ち出すなら、弁護士を呼ぶ。'], ['', '（江藤は帰っていった。任意である以上、止められない。）']]);
  } });
  A.push({ id: 'claimTalk', who: 'self', label: '佐伯の言い分を詳しく聴く', sub: '手の位置', cond: S => !S.fin.claimTalk, run: async S => {
    G.drawScene(sc('saeki', 'interro', 0));
    await G.talk([['saeki', '右手で吊り革を持って、左手で鞄を持ってました。胸の前に。いつもそうしてます。'], ['saeki', 'いきなり手首を掴まれて……「この人痴漢です」って。何が何だか。'], ['saeki', '私じゃありません。本当に、私じゃない。']]);
    K.addDoc({ id: 'claim', title: '佐伯の弁解', kind: 'neu', evid: true, body: P('「右手で吊り革、左手で鞄を胸の前に持っていた。触っていない」') });
  } });
  A.push({ id: 'reenact', who: 'staff', days: 2, label: '車内の位置を再現して確かめる', short: '再現見分', cond: S => S.fin.claimTalk,
    done: S => { K.addDoc({ id: 'reenact', title: '再現見分調書', kind: 'neu', evid: true, body: P('同型車両で、被害者（158cm）と佐伯（168cm）の位置を再現した。', '佐伯の弁解する姿勢（右手で吊り革、左手で鞄を胸の前）のまま左手を下ろすと、被害者の臀部に届く。ただし鞄を持ったままでは不自然な姿勢となる。', (S.fin.passenger || S.fin.stationCam ? '被害者の斜め後ろ（灰色のコートの男がいた位置）からも、手は届く。' : '被害者の斜め後ろの位置からも、手は届く。')) });
      return [['oka', '佐伯の位置からも、斜め後ろからも、届くことは届きます。', { scene: sc('oka') }]]; } });
  A.push({ id: 'trainCam', who: 'staff', days: 2, label: '車内の防犯カメラを確かめる', short: '車内カメラ', cond: S => true,
    done: S => { K.addDoc({ id: 'trainCam', title: '鉄道会社の回答（車内カメラ）', kind: 'neu', body: P('当該車両（旧型）には車内防犯カメラが設置されていない。') });
      return [['oka', '2両目は古い車両で、車内カメラがありませんでした。', { scene: sc('oka') }]]; } });
  A.push({ id: 'misakiMsg', who: 'staff', days: 2, label: '被害者が友人に送ったメッセージを確かめる', short: '被害者のメッセージ', sub: '本人の同意を得て', cond: S => S.fin.victimTalk,
    done: S => { K.addDoc({ id: 'misakiMsg', title: '被害者のメッセージ記録', kind: 'neu', evid: true, body: P('8:14、友人宛て：「やばい　痴漢されてる　後ろ」', '8:15、「動けない」') });
      return [['noguchi', '8時14分に、友だちに「痴漢されてる 後ろ」と送ってます。触られてたことは、間違いないですね。', { scene: sc('noguchi') }]]; } });
  A.push(kit.releaseAction(S => G.trial.estimate(S, TRIAL), (S, how) => finish(S, how)));
  A.push({ id: 'interro', who: 'self', once: false, label: '佐伯を取り調べる', sub: '取調室で', primary: true, cond: S => inC(S) && !(S.c.confession && S.c.confession.quick), run: async S => kit.interro(S, ICFG) });

  const ICFG = {
    who: 'saeki', guiltyKey: 'G', recorded: false,
    first: [['', '（佐伯修。45歳。ネクタイを外された首元を、何度も触っている。）'], ['saeki', '……会社には、連絡がいってるんでしょうか。']],
    labels: { A: ['黙秘権を告げ、弁解を聴く', 'そのまま聴き取る'], B: ['被害者の話を突きつける', '「あなたの手を掴んだと言っている」'], D: ['「認めれば略式の罰金で、今日帰れる」と言う', '実際に、そうなることが多い'] },
    inc: { A: { G: 8, I: 4 }, B: { G: 16, I: 12 }, C: { G: 28, I: 26 }, D: { G: 40, I: 38 }, E: { G: 24, I: 22 } },
    pools: {
      A: [S => [['you', '言いたくないことは、言わなくていい。'], ['saeki', '触ってません。右手は吊り革、左手は鞄です。']],
        S => [['saeki', '娘が中学2年なんです。……どんな顔して、家に帰ればいいんですか。']],
        S => [['saeki', '23年、同じ会社で働いてきました。毎朝、同じ電車です。']],
        S => S.c.fired ? [['saeki', '会社から、懲戒の通知が来たそうです。……認めたら、本当にクビですよね。']] : null,
        S => [['saeki', '後ろに、誰かいたはずです。私の後ろに。']]],
      B: [S => [['you', '被害者は、あなたの手首を掴んだ。'], ['saeki', '掴まれたのは、私の手です。でも、触っていた手かどうかは、彼女にも見えてなかったはずだ。']],
        S => S.c.fiber ? [['you', 'あなたの左手の指から、スカートと同じ繊維が出た。'], ['saeki', '……満員電車ですよ。誰の服だって、触ることはある。']] : null,
        S => [['you', '彼女が嘘をついているというのか。'], ['saeki', '嘘じゃないと思います。でも、間違ってる。']]],
      C: [S => [['', '（取調べは夜まで続いた。）'], ['saeki', '家に、帰らせてください。']], S => [['', '（今日も、午後10時過ぎまで。）'], ['saeki', '……']]],
      D: [S => [['you', '認めれば、略式で罰金だ。今日にも出られる。否認してたら、あと何週間もここだぞ。'], ['saeki', '……今日、ですか。']], S => [['you', '会社も、罰金で済めば何とかなるかもしれない。'], ['saeki', '……']]],
      E: [S => [['you', '女の子の気持ちを考えたことがあるのか！', { sfx: 'thud' }], ['saeki', '……考えてます。だから、違うって言ってるんです。']]]
    },
    confess: confess
  };
  async function confess(S, voluntary, opt) {
    const c = S.c; opt = opt || {};
    if (opt.by === 'todo') await G.talk([['todo', '認めたぞ。', { scene: sc('todo') }]]);
    else await G.talk([['saeki', '……触って、しまいました。'], ['saeki', '……これで、帰れるんですよね。']]);
    c.confession = { voluntary, by: opt.by || 'you', day: S.day, quick: true };
    K.addDoc({ id: 'confession', title: '佐伯の供述調書（自白）', kind: 'neu', evid: true, body: P('私は、6月10日朝の快速電車内で、前に立っていた女性の臀部を、左手で着衣の上から触りました。申し訳ありませんでした。') });
    await G.talk([['', '（自白調書が作られ、事件は検察官のもとへ送られる。）', { sfx: 'pen' }]]);
    await finish(S, 'soutchi');
  }
  async function finish(S, how) { S._ended = true; S.c.how = how; await kit.soutchi(C, S); K.end(how); }

  const TRIAL = {
    accusedName: '佐伯修', name: '8時12分発', court: '北見坂地方裁判所（裁判官1人）', truthText: '佐伯が触った世界か、後ろにいた江藤が触った世界か。',
    issue: { pro: '被告人が犯人であることを示す事情', yes: '以上によれば、被告人が本件の犯人であることは、合理的な疑いを差し挟む余地なく認められる。', no: '被害者が被害に遭ったことは疑いないが、被告人が犯人であることについては、合理的な疑いが残る。刑訴法336条により、被告人に対し無罪の言渡しをする。' },
    retract(S) { const c = S.c; if (c.confession) c.retract = rnd() < .2; },
    charge(S, est) { const c = S.c; if (c.confession && !c.retract) return 'ryakushiki'; return est.pos - est.neg >= 3; },
    lines(S, charge) {
      if (charge === 'ryakushiki') return [['kenji', '佐伯は認めています。略式でいきましょう。本人も同意している。'], ['', '（佐伯修は、略式命令で罰金30万円を言い渡され、その日のうちに釈放された。前科が一つ、ついた。）']];
      return [['kenji', S.c.confession ? '佐伯は自白を撤回しました。' : '佐伯は否認を続けています。'], ['kenji', charge ? '起訴します。' : '……被害者の供述だけでは、持ちません。嫌疑不十分で不起訴とします。'], ['', charge ? '（佐伯修は、条例違反で起訴された。）' : '（佐伯修は釈放された。）']];
    },
    weigh(S, ids, trial) {
      const c = S.c, has = id => ids.includes(id); let pos = 0, neg = 0; const pros = [], cons = [];
      const add = (v, why) => { if (v > 0) { pos += v; if (why) pros.push(why); } else if (v < 0) { neg -= v; if (why) cons.push(why); } };
      if (has('victim2')) add(trial && has('victim') ? 1.5 : 2.5, trial && has('victim') ? '被害者は、触っている手を掴んだと述べる。もっとも、当初の供述では「すぐ後ろにいた人の手首を掴んだ」と述べており、供述には変遷がある' : '被害者は、自分を触っている手を掴んだと述べている');
      else if (has('victim')) add(1.5, '被害者は、振り向いてすぐ後ろにいた被告人の手首を掴んだと述べている');
      if (has('handover')) add(.5, '');
      if (has('misakiMsg')) add(.3, '被害者は被害の最中、友人に「痴漢されてる　後ろ」と送信している');
      if (has('fiber') && c.fiber) add(2.5, '被告人の左手指から、被害者のスカートと同種の繊維が検出された');
      if (has('fiber') && c.fiber === false) add(-1, '被告人の手指からは、被害者のスカートの繊維が検出されていない');
      if (has('passenger')) { add(.5, '同じ車両の乗客は、被告人の手が被害者の近くにあったのを見ている'); add(-.8, '同乗客は、被告人の背後に灰色のコートの男もいたと述べている'); }
      if (has('stationCam')) add(-.8, '防犯カメラには、被害者の斜め後ろに別の男が乗車し、次の駅で足早に降車する様子が写っている');
      if (has('eto')) add(-.8, 'その男には同種の前歴がある');
      if (has('reenact')) add(-.4, '被告人の弁解する姿勢でも手は届くが、不自然な姿勢となる。被害者の斜め後ろからも手は届く');
      if (has('confession') && c.confession) add(c.retract && trial ? 1.5 : 3, '被告人は捜査段階で犯行を認めた' + (c.retract && trial ? 'が、公判では「早く帰りたかった」と撤回している' : ''));
      return { pos, neg, pros, cons };
    },
    admit(S, admit, drop) { const c = S.c; if (c.confession && (c.sess.C || c.sess.D || c.sess.E) && rnd() < .7) drop('confession', '自白は、長時間の取調べ、脅迫的な言動又は利益の約束の下でされたもので、任意性に疑いがある（刑訴法319条1項）'); },
    decide(S, r) { return (r.pos - r.neg >= 3.5 && r.neg <= 1.2) ? { verdict: '有罪', main: '被告人を罰金40万円に処する。' } : { verdict: '無罪', main: '被告人は無罪。' }; },
    nothing: v => v.startsWith('有罪') || v.startsWith('略式') ? '佐伯修は会社を辞め、家族と別の町に越したという。' : '佐伯修が会社に戻れたのかどうかは、分からない。',
    finale: '痴漢事件は、取調べの録音・録画の義務の対象ではない。<br>否認すれば勾留が続き、認めれば罰金で帰れる。この構造は「人質司法」と呼ばれ、批判されてきた。',
    async reveal(S, verdict) {
      const c = S.c, punished = verdict.startsWith('有罪') || verdict.startsWith('略式');
      if (punished && c.truth === 'I' && rnd() < .55) {
        await G.curtain([{ html: '<div class="big">3年後</div>', wait: 1200 },
          { html: '<div class="doc-s"><h3>同じ路線で</h3>江藤浩二（57歳）が、別の女性への痴漢で逮捕された。乗客がスマートフォンで撮影していた。<br>押収された江藤のスマートフォンには、日付と時刻、車両の番号を記した手帳のようなメモが残っていた。<br><br>その中に、「6/10　8:12　2両目」の記載があった。</div>', wait: 3400 },
          { html: '<div class="doc-s"><h3>再審</h3>' + (verdict.startsWith('略式') ? '確定した略式命令は、確定判決と同一の効力を持つ（刑訴法470条）。佐伯修は、再審を請求した。<br>「あの日、帰りたかった。娘の顔が見たかった。だから、やってもいないことを認めた。」' : '佐伯修は再審を請求した。') + '<br><br>再審で、佐伯は無罪となった。<br>会社には、戻らなかった。</div>', wait: 3600 }]);
        return true;
      }
      if (!punished && c.truth === 'G' && rnd() < .55) {
        await G.curtain([{ html: '<div class="big">2年後</div>', wait: 1200 },
          { html: '<div class="doc-s"><h3>同じ路線で</h3>佐伯修（47歳）が、高校生への痴漢で現行犯逮捕された。周りの乗客が撮影した動画に、佐伯の左手が映っていた。<br>佐伯は、取調べでこう述べた。<br>「前のときも、やりました。……あのときは、運がよかった。」</div>', wait: 3400 },
          { html: '<div class="doc-s"><h3>森川美咲さんの手紙（抜粋）</h3>「あのあと、半年、電車に乗れませんでした。大学には、母に車で送ってもらいました。<br>警察の人も、検察の人も、親切でした。でも、最後には『あなたの言うことだけでは、足りない』と言われました。<br>私は、嘘をついていませんでした。」</div>', wait: 3600 }]);
        return true;
      }
      return false;
    }
  };

  G.cases = G.cases || {};
  G.cases.chikan = {
    title: '8時12分発', sub: '痴漢・証拠は被害者の供述', trial: TRIAL,
    run: async function () {
      const S = { c: { truth: rnd() < .5 ? 'G' : 'I', sess: { A: 0, B: 0, C: 0, D: 0, E: 0 } } };
      G.audio.cue('main'); G.audio.ambient('office');
      await G.curtain(['<div class="big">8時12分発</div><div class="small">朝の電車。女性が「痴漢です」と男の手をつかんだ</div>']);
      G.auditCtx = { suspect: 'saeki', inCustody: () => inC(S) };
      await K.start(C, S);
      G.audio.ambient(null);
      return S;
    }
  };
})();
