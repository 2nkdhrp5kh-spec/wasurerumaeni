'use strict';
/* ============================================================
   事件：本町三丁目火災（現住建造物等放火）
   争点は「火事か、放火か」。科学鑑定の評価が分かれる。
   真相：'A'（大塚が灯油を撒いて火をつけた）／'N'（石油ストーブの事故）
   裁判員裁判の対象。逮捕後の取調べは録画される。
   ============================================================ */
(function () {
  const K = G.keiji, P = G.P, kv = G.kv, note = G.note, rnd = G.rnd, kit = G.kit, sc = kit.sc;
  const inC = kit.inCustody, cday = kit.custodyDay;
  const C = {
    id: 'kasai', role: '捜査官', base: { m: 1, d: 18 }, dayCard: true,
    staff: [{ id: 'shirai', name: '白井' }, { id: 'oka', name: '岡' }, { id: 'noguchi', name: '野口' }],
    info: S => kit.info(S, '本町三丁目火災'),
    suspect: { name: '大塚　茂', kana: 'おおつか しげる', age: '58歳', job: '無職', addr: '北見坂市本町三丁目4番2号（焼損。現在は市内の親族方に身を寄せている）' },
    koryuGrounds: [2],
    factsOf: S => {
      const id = S.c.charge, head = '被疑者は、1月18日午前2時40分ころ、北見坂市本町三丁目4番2号の被疑者方木造2階建て住宅（被疑者及びその母大塚キヨが現に住居に使用するもの）において、';
      if (id === 'jushikka') return head + '居間の石油ストーブを使用するに当たり、重大な過失により、その転倒を防止する措置を講じないまま就寝し、同ストーブから出火させ、同住宅の1階の約8割等を焼損したものである。';
      if (id === 'shikka') return head + '過失により、居間の石油ストーブから出火させ、同住宅の1階の約8割等を焼損したものである。';
      return head + '居間の床に灯油を撒いた上、これに火を放ち、その火を同住宅に燃え移らせ、同住宅の1階の約8割等を焼損したものである。';
    },
    chargeHint: '火事の罪名を分けるのは<b>わざと火をつけたか</b>。わざとなら放火（燃えたのが人の住む家なら108条）。不注意なら失火（116条、罰金のみ）。不注意の程度が重大なら重過失失火（117条の2）。出火の原因が分からないうちは、どれとも決められない。',
    charges: [
      { id: 'hoka', label: '現住建造物等放火', law: '刑法108条（裁判員裁判の対象）', fit: true, saibanin: true, arts: ['刑法 第108条'], req: ['放火する行為', '人が住んでいる建物', '焼損（独立して燃え続ける状態）', '放火の故意'] },
      { id: 'jushikka', label: '重過失失火', law: '刑法117条の2後段', saibanin: false, noArrest: true, arts: ['刑法 第117条の2', '刑法 第116条'], req: ['重大な不注意', '焼損', '放火の故意がないこと'],
        els: (S, e) => [e[0], { k: '大塚の重大な過失', v: G.keiji.doc('stove') ? 1 : 0 }, e[2]] },
      { id: 'shikka', label: '失火', law: '刑法116条（罰金のみ）', saibanin: false, noArrest: true, arts: ['刑法 第116条'], req: ['不注意', '焼損'],
        els: (S, e) => [e[0], { k: '大塚の過失', v: G.keiji.doc('stove') ? 1 : 0 }] }
    ],
    scene: S => sc(null, 'office'),
    endHint: S => inC(S) ? '満期までに記録を固める' : '',
    stopSkip: S => (inC(S) && (cday(S) >= kit.LIMIT || (cday(S) >= 16 && !S.c.confession && !S.c.takeoverAsked))) || (S.c.arrest == null && S.day >= 35),
    gauge: S => G.trial.gauge(S, TRIAL),
    nextMilestone: S => kit.nextMilestone(S),
    elements: S => {
      const c = S.c, d = id => !!K.doc(id);
      const arson = c.confession ? 3 : Math.min(3, (d('kanteiP') ? 2 : 0) + (c.phone === 'A' ? 1.5 : 0) + (d('insurance') ? .5 : 0));
      return [
        { k: '焼損', v: d('scene') ? 3 : 1 },
        { k: '放火である', v: Math.floor(arson), conf: !!c.confession },
        { k: '大塚の行為', v: c.confession ? 3 : (d('neighbor') ? 1 : 0), conf: !!c.confession },
        { k: '動機', v: Math.min(3, (d('insurance') ? 1 : 0) + (d('debt') ? 1 : 0)) }
      ];
    },
    morning: (S, first) => {
      const c = S.c, L = [];
      if (first) {
        L.push(['', '（1月18日、午前2時40分。本町三丁目の木造2階建て住宅から出火した。）', { sfx: 'phone' }],
          ['todo', '住んでたのは大塚茂（おおつか しげる）、58歳と、母親のキヨ、84歳。母親は寝たきりだ。息子が背負って外に出た。二人とも軽いやけどで済んだ。', { scene: sc('todo') }],
          ['todo', '1階はほぼ全焼。……ところが、だ。2か月前に、火災保険を増額してる。それに、借金がある。'],
          ['shirai', '消防の調査と、科捜研の鑑定が要ります。火事の鑑定は、時間がかかりますよ。', { scene: sc('shirai') }]);
        K.addDoc({ id: 'scene', title: '実況見分調書（火災現場）', kind: 'neu', evid: true, body: P('木造2階建て住宅。1階居間を中心に、1階の約8割を焼損。2階は一部焼損。', '居間の床には、石油ストーブ（焼損）。その周辺の床面に、不規則な形の焼け跡が広がっている。', '出火当時、大塚茂は2階、キヨは1階奥の和室で就寝していたと述べている。') });
        K.addDoc({ id: 'manual', title: '捜査の要点', kind: 'memo', body: P('・現住建造物等放火（刑法108条）：放火して、現に人が住居に使用する建造物を焼損した者は、死刑又は無期若しくは5年以上の拘禁刑。裁判員裁判の対象で、逮捕後の取調べは録画される。',
          '・争点は「火事か、放火か」。火災の原因の鑑定は、専門家の間でも評価が分かれることがある。',
          '・記録を開いて「横に並べる」と、二枚を見比べられる。食い違いやつながりに気づけば、捜査の糸口になる。') });
        return L;
      }
      if (c.warrantPending && S.day > c.warrantPending) { c.warrantPending = null; c.warrantReady = true; kit.forms.issued(S, C); L.push(['todo', '逮捕状が出た。', { scene: sc('todo') }]); }
      if (S.day === 9 && c.arrest == null && rnd() < .4) { c.sceneDisturbed = true; L.push(['noguchi', '大塚が、規制線をくぐって焼け跡に入ってました。「母の写真を探してた」って。', { scene: sc('noguchi') }], ['shirai', '現場を荒らされたかもしれませんな。……鑑定は、もう試料を取ってあるのが救いです。', { scene: sc('shirai') }]); }
      if (S.day === 6 && c.arrest == null) L.push(['todo', '近所が騒いでる。「保険金目当ての放火だ」ってな。週刊誌も嗅ぎつけた。', { scene: sc('todo') }]);
      if (inC(S)) {
        L.push(...kit.custodyMorning(S, { name: '大塚', kenji2: '……鑑定は、公判で持ちますか。', wantConfession: '火をつけたと認めたか、とな。' }));
        if (cday(S) === 1) K.addDoc({ id: 'news', title: '新聞記事', kind: 'memo', body: P('<b>自宅に放火の疑い　58歳の男を逮捕　保険金目的か</b>', '北見坂署は、自宅に火をつけたとして、現住建造物等放火の疑いで、無職大塚茂容疑者（58歳）を逮捕した。寝たきりの母親が同居していた。同署は保険金目的の可能性もあるとみて調べている。') });
        if (cday(S) === 5) L.push(['shirai', '大塚の母親、施設に移されたそうです。家は焼けて、息子は留置場ですからね。', { scene: sc('shirai') }]);
      }
      return L;
    },
    check: async S => {
      const c = S.c;
      if (inC(S) && cday(S) >= 16 && !c.confession && !c.takeoverAsked && !(c.sess.C || c.sess.D || c.sess.E)) await kit.takeover(S, confess);
      if (inC(S) && cday(S) >= kit.LIMIT) { await finish(S, 'soutchi'); return 'end'; }
      if (c.arrest == null && S.day >= 35) { await G.talk([['todo', '……逮捕できないなら、在宅で送れ。', { scene: sc('todo') }]]); await finish(S, 'zaitaku'); return 'end'; }
    },
    actions: []
  };
  const A = C.actions;

  // 照合：二枚のどの記載を選べば、つながりに気づくか（記録の組は名前順）
  C.pick = {
    'kanteiP|kanteiR': [/焼け跡|撒い|ポアパターン|結論/, /焼け跡|フラッシュオーバー|推認|結論/],
    'kanteiP|stove': [/灯油/, /石油ストーブ|口金/],
    'recall|stove': [/KT-2300|自動消火/, /KT-2300|横倒し/],
    'claim|neighbor': [/1時半|自販機/, /1時半/],
    'debt|insurance': [/400万|借入/, /増額|2000万/],
    'claim|kiyo': [/ストーブ/, /ストーブ/],
    'neighbor|vend': [/1時半/, /1時34分|お茶/]
  };
  C.compare = (S, a, b) => {
    const c = S.c, has = (x, y) => (a === x && b === y) || (a === y && b === x);
    if (has('kanteiP', 'kanteiR')) return { lines: [['', '（科捜研は「床に液体を撒いた痕跡」。久我教授は「全面燃焼の後に、同じ模様はできる」。）'], ['oka', '同じ焼け跡を見て、専門家の言うことが正反対です。', { scene: sc('oka') }]], memo: { title: '鑑定の食い違い', text: '科捜研は床の焼け跡を「液体を撒いた痕跡」とし、久我教授は「フラッシュオーバー後に生じうる模様で、撒いた痕跡とは言えない」とした。' } };
    if (has('kanteiP', 'stove')) return { lines: [['', '（灯油成分の検出。だが、居間には石油ストーブがあった。）'], ['shirai', 'ストーブの灯油が漏れても、同じものが出ますな。', { scene: sc('shirai') }]], memo: { title: '灯油成分', text: '床から検出された灯油成分は、石油ストーブの灯油でも説明できる。' } };
    if (has('stove', 'recall')) return { lines: [['', '（同じ型番のストーブで、転倒時に消火装置が働かない不具合の報告がある。）'], ['oka', '……事故の線、ありますね。', { scene: sc('oka') }]], memo: { title: 'ストーブの不具合', text: '焼損したストーブと同型の製品で、転倒時消火装置の不具合が複数報告されている。' } };
    if (has('neighbor', 'claim')) return { lines: [['', '（隣人は「1時半ごろ、大塚さんが外で何かしていた」。大塚は「自販機に飲み物を買いに出た」。）'], ['noguchi', '自販機の記録を見れば、分かるかもしれません。', { scene: sc('noguchi') }]], memo: { title: '午前1時半の外出', text: '隣人の目撃と、大塚の「自販機に行った」という説明。自販機の販売記録で確かめられるかもしれない。' }, then: S => { c.vendLead = true; } };
    if (has('insurance', 'debt')) return { lines: [['', '（借金は約400万円。保険は2か月前に1200万円から2000万円に増額。）'], ['shirai', '動機としちゃ、十分ですな。……動機があるってだけ、ですが。', { scene: sc('shirai') }]], memo: { title: '動機', text: '多額の借金と、直前の保険増額。動機はありうる。ただし動機は行為の証明ではない。' } };
    if (has('kiyo', 'claim')) return { lines: [['', '（キヨは「茂がストーブを……」と言った。それが何を意味するのかは分からない。）'], ['oka', 'お母さん、認知症の診断が出てます。……調書にしても、証拠になるかどうか。', { scene: sc('oka') }]], memo: { title: '母の言葉', text: 'キヨの「茂がストーブを……」という言葉は、意味が特定できない。認知症の診断がある。' } };
    if (has('vend', 'neighbor')) return { lines: [['', '（自販機の記録：1月18日 1:34、温かいお茶1本、現金。）'], ['noguchi', '大塚の言うとおり、自販機には行ってますね。', { scene: sc('noguchi') }]], memo: { title: '自販機', text: '午前1時34分に、近くの自販機で温かいお茶が1本売れている。大塚の説明と合う。' } };
    return null;
  };

  A.push({ id: 'fireman', who: 'staff', days: 3, label: '消防の火災原因調査の結果を受け取る', short: '消防の調査', cond: S => true,
    done: S => { K.addDoc({ id: 'fireman', title: '消防・火災原因判定書', kind: 'neu', evid: true, body: P('出火箇所：1階居間、石油ストーブ付近。', '出火原因：特定に至らず。ストーブからの出火、放火のいずれも否定できない。') });
      return [['fireman', '出火したのは居間のストーブ付近。原因は、特定できませんでした。', { scene: { bg: 'street' } }]]; } });
  A.push({ id: 'kanteiP', who: 'staff', days: 10, label: '科捜研に燃焼残渣の鑑定を依頼する', short: '科捜研の鑑定', cond: S => true,
    done: S => { K.addDoc({ id: 'kanteiP', title: '鑑定書（科捜研）', kind: 'neu', evid: true, body: P('居間の床の燃焼残渣から、灯油成分を検出した。', '床面に、液体を撒いた場合に特徴的な不規則な焼け跡（ポアパターン）が認められる。', '結論：床に灯油を撒いて着火した可能性が高い。') });
      return [['kasoken', '床から灯油成分。それに、液体を撒いたときに特徴的な焼け跡があります。放火の可能性が高い、と考えます。', { scene: sc('kasoken', 'office') }]]; } });
  A.push({ id: 'kanteiR', who: 'staff', days: 14, label: '大学の火災研究者に、別の鑑定を頼む', short: '再鑑定', sub: '費用と時間がかかる', cond: S => S.fin.kanteiP,
    done: S => { K.addDoc({ id: 'kanteiR', title: '鑑定書（北見坂工業大学　久我教授）', kind: 'neu', evid: true, body: P('床面の不規則な焼け跡は、室内が全面的に燃え上がる現象（フラッシュオーバー）の後、可燃性の床材が燃えることでも生じる。現在の火災科学では、この模様のみから液体の散布を推認することはできないとされる。',
        '灯油成分は、石油ストーブの燃料の漏出でも説明できる。', '結論：放火と事故のいずれとも判断できない。') });
      return [['prof', '焼け跡の模様だけで「撒いた」と言える時代は、もう終わっています。分からないものは、分からないと書くべきです。', { scene: sc('prof', 'office') }]].concat(G.kit.inCustody(S) ? [['oka', '主任。……これで、起訴できますか。', { scene: sc('oka') }], ['', '（拘束を続ける理由があるのか。釈放を進言することもできる。）']] : []); } });
  A.push({ id: 'stove', who: 'staff', days: 4, label: '焼けたストーブを調べる', short: 'ストーブの見分', cond: S => true,
    done: S => { K.addDoc({ id: 'stove', title: 'ストーブの見分結果', kind: 'neu', evid: true, body: P('石油ストーブは横倒しの状態で焼損。給油タンクの口金が緩んでいる。', '製造は12年前。型番：KT-2300。') });
      return [['noguchi', 'ストーブ、倒れてました。タンクの口金も緩んでる。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'recall', who: 'staff', days: 5, label: 'ストーブの型番の事故情報を調べる', short: '型番の事故情報', sub: 'メーカーと消費者庁に照会', cond: S => S.fin.stove,
    done: S => { K.addDoc({ id: 'recall', title: '製品事故情報の照会結果', kind: 'neu', evid: true, body: P('同型番（KT-2300）の石油ストーブについて、転倒時に自動消火装置が作動せず火災に至った事故が、過去5年間に全国で3件報告されている。', 'メーカーは「使用者の誤使用」として、リコールはしていない。') });
      return [['oka', '同じ型番で、倒れても火が消えなかった事故が、全国で3件。', { scene: sc('oka') }]]; } });
  A.push({ id: 'insurance', who: 'staff', days: 3, label: '保険会社に照会する', short: '保険の照会', cond: S => true,
    done: S => { K.addDoc({ id: 'insurance', title: '保険会社の回答', kind: 'neu', evid: true, body: P('火災保険：2か月前に、保険金額を1200万円から2000万円に増額。', '増額の理由について、契約者は「家財を見直したため」と説明していた。') });
      return [['oka', '2か月前に、保険を2000万に増やしてます。', { scene: sc('oka') }]]; } });
  A.push({ id: 'debt', who: 'staff', days: 4, label: '大塚の借金を調べる', short: '借金の照会', cond: S => true,
    done: S => { K.addDoc({ id: 'debt', title: '信用情報・金融機関の回答', kind: 'neu', evid: true, body: P('大塚茂の借入残高：約400万円（消費者金融3社）。半年前に勤め先の工務店が倒産し、無職。', '母キヨの介護費用の支払いが滞っている。') });
      return [['shirai', '借金が400万。仕事は半年前に失くしてる。介護の金も払えてない。', { scene: sc('shirai') }]]; } });
  A.push({ id: 'neighbor', who: 'staff', days: 2, label: '近所の聞き込み', short: '聞き込み', cond: S => true,
    done: S => { K.addDoc({ id: 'neighbor', title: '隣人の供述', kind: 'neu', evid: true, body: P('（隣家の女性・60代）', '夜中の1時半ごろ、トイレに起きたら、大塚さんが家の前で何かしているのが見えました。暗かったので、何をしていたかは。', '大塚さんは、お母さんの介護を一人でずっと頑張ってました。') });
      return [['neighbor', '1時半ごろ、大塚さん、外にいましたよ。何をしてたかまでは……。', { scene: { bg: 'street' } }]]; } });
  A.push({ id: 'neighborCam', who: 'staff', days: 3, label: '近隣の防犯カメラを集める', short: '近隣のカメラ', cond: S => true,
    done: S => { K.addDoc({ id: 'neighborCam', title: '近隣の防犯カメラ確認結果', kind: 'neu', evid: true, body: P('向かいの家の玄関カメラ（大塚宅の玄関が映る）：', '1:31　大塚が玄関から出る。1:36　手にペットボトルを持って戻る。', '2:33　1階の窓が明るくなる（出火）。2:41　大塚が母を背負って出てくる。', 'この間、ほかに出入りした者はいない。') });
      return [['oka', '1時半に出て、5分で戻ってる。手にはペットボトル。そのあと出火まで、誰も出入りしてません。', { scene: sc('oka') }]]; } });
  A.push({ id: 'kerosene', who: 'staff', days: 2, label: '灯油の購入記録を確かめる', short: '灯油の購入', cond: S => true,
    done: S => { K.addDoc({ id: 'kerosene', title: '灯油の購入記録', kind: 'neu', evid: true, body: P('近所の燃料店：大塚は冬の間、毎週土曜に18リットルを購入。1月16日（事件の2日前）にも18リットル。') });
      return [['noguchi', '灯油は毎週買ってます。事件の2日前も。いつもどおり、ですね。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'doctor', who: 'self', label: 'キヨの主治医から話を聴く', sub: '病状と、夜の様子', cond: S => S.fin.kiyo && !S.fin.doctor, run: async S => {
    G.drawScene({ bg: 'office' });
    await G.talk([['', '（キヨの主治医の話。）'], ['', '「寝たきりと言っても、夜中に這って移動することがあると、息子さんから聞いていました。ストーブに手を伸ばしたこともある、と」']]);
    K.addDoc({ id: 'doctor', title: '主治医の供述', kind: 'neu', evid: true, body: P('キヨは寝たきりだが、夜間に這って移動することがある。ストーブに手を伸ばしたことがあると、息子から相談を受けていた。') });
  } });
  A.push({ id: 'experiment', who: 'staff', days: 10, label: '燃焼の再現実験を頼む', short: '再現実験', sub: '大学の実験施設で', cond: S => S.fin.kanteiR,
    done: S => { K.addDoc({ id: 'experiment', title: '再現実験の報告', kind: 'neu', evid: true, body: P('同型のストーブを転倒させ、同じ床材・家具の配置で燃焼させたところ、約40分で全面燃焼に至り、床面に本件と類似した不規則な焼け跡が生じた。') });
      return [['prof', 'ストーブが倒れただけで、あの焼け跡はできます。実験で確かめました。', { scene: sc('prof', 'office') }]]; } });
  A.push({ id: 'claimTalk', who: 'self', label: '大塚から任意で話を聴く', sub: '病院から戻ったあと', cond: S => S.c.arrest == null && !S.fin.claimTalk, run: async S => {
    G.drawScene(sc('otsuka', 'interro', 0));
    await G.talk([['otsuka', '1時半ごろ、喉が渇いて、角の自販機にお茶を買いに行きました。戻って、寝ました。'], ['otsuka', 'ストーブは……消したと思います。たぶん。母の部屋が寒いので、いつも遅くまで点けてるんです。'], ['otsuka', '煙で目が覚めて、母を背負って外に出ました。……保険？ 家財を見直しただけです。']]);
    K.addDoc({ id: 'claim', title: '大塚の弁解', kind: 'neu', evid: true, body: P('「午前1時半ごろ、自販機にお茶を買いに出た。戻って就寝した。ストーブは消したと思う。煙で目覚め、母を背負って避難した。保険の増額は家財の見直しのため」') });
  } });
  A.push({ id: 'vend', who: 'staff', days: 2, label: '自販機の販売記録を確かめる', short: '自販機の記録', cond: S => S.c.vendLead,
    done: S => { K.addDoc({ id: 'vend', title: '自販機の販売記録', kind: 'neu', evid: true, body: P('大塚宅から約50mの自販機：1月18日 午前1時34分、温かいお茶（ペットボトル）1本、現金で販売。') });
      return [['noguchi', '1時34分に、お茶が1本売れてます。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'kiyo', who: 'self', label: '母キヨから話を聴く', sub: '施設で', cond: S => !S.fin.kiyo, run: async S => {
    G.drawScene(sc('kiyo', 'home'));
    await G.talk([['kiyo', '……茂が、ストーブを……'], ['you', 'ストーブを、どうしたんですか。'], ['kiyo', '茂は、いい子ですよ。……お父さんは、まだ帰らないの。']]);
    K.addDoc({ id: 'kiyo', title: '大塚キヨの供述', kind: 'neu', evid: true, body: P('「茂が、ストーブを……」（以下、要領を得ず）') + note('キヨには、中等度の認知症の診断がある。') });
  } });
  A.push({ id: 'phone', who: 'staff', days: 7, label: '大塚のスマートフォンを解析する', short: 'スマホの解析', sub: '令状で差し押さえる', cond: S => S.c.arrest != null || S.c.searchWarrant,
    done: S => { const c = S.c, r = rnd();
      c.phone = c.truth === 'A' ? (r < .4 ? 'A' : 'none') : (r < .3 ? 'N' : 'none');
      K.addDoc({ id: 'phoneDoc', title: 'スマートフォン解析結果', kind: 'neu', evid: true, body: c.phone === 'A' ? P('1月5日の検索履歴：「灯油　火事　証拠」「火災保険　放火　調査」') : c.phone === 'N' ? P('12月20日の検索履歴：「石油ストーブ　倒れても消えない」「KT-2300　修理」') : P('事件に関係する検索履歴・通信は見当たらない。') });
      return [['oka', c.phone === 'A' ? '……検索履歴です。「灯油 火事 証拠」。' : c.phone === 'N' ? '12月に「ストーブ 倒れても消えない」と検索してます。' : 'スマホには、関係しそうなものは何も。', { scene: sc('oka') }]]; } });
  A.push({ id: 'warrant', who: 'self', label: '逮捕状の請求を課長に上げる', sub: '罪名を決めて請求する', primary: true, cond: S => S.c.arrest == null && !S.c.warrantPending && !S.c.warrantReady && !(kit.charge(S) || {}).noArrest, run: async S => {
    const ch = await kit.chooseCharge(S, C, 'warrant'); if (!ch) return false;
    if (!ch.noArrest) kit.forms.request(S, C);
    if (ch.noArrest) { await G.talk([['todo', ch.label + 'で、身柄を取る気か。', { scene: sc('todo') }], ['todo', '住居も分かってる、母親の世話もある男だ。逃げも隠れもせん。……逮捕の必要がないと、裁判官に突き返されるぞ。'], ['', '（逮捕状は請求しなかった。在宅のまま捜査を続け、送致することになる。）']]); return; }
    if (!K.doc('kanteiP') && !(K.doc('insurance') && K.doc('debt'))) { await G.talk([['todo', '放火だと言える材料がない。鑑定を待て。', { scene: sc('todo') }]]); return false; }
    await G.talk([['todo', '請求する。', { scene: sc('todo') }], ['', '（逮捕状は翌日発付される。）']]); S.c.warrantPending = S.day;
  } });
  A.push({ id: 'arrest', who: 'self', label: '大塚を逮捕する', primary: true, cond: S => S.c.warrantReady && S.c.arrest == null, run: async S => {
    G.drawScene(sc('otsuka', 'street', 0));
    S.c.recorded = !!kit.charge(S).saibanin;
    await G.talk([['you', '大塚茂さん。' + kit.charge(S).label + 'の容疑で逮捕します。'], ['otsuka', '……母は、どうなるんですか。'], ['', '（逮捕。' + (S.c.recorded ? 'この罪名は裁判員裁判の対象。ここから先の取調べは、録音・録画される。' : 'この罪名では、取調べの録音・録画の義務はない。') + '）', { sfx: 'metal' }]]);
    S.c.arrest = S.day; S.c.warrantReady = false;
  } });
  A.push(kit.releaseAction(S => G.trial.estimate(S, TRIAL), (S, how) => finish(S, how)));
  A.push({ id: 'interro', who: 'self', once: false, label: '大塚を取り調べる', sub: '録画されている', primary: true, cond: S => inC(S), run: async S => kit.interro(S, ICFG) });

  const ICFG = {
    who: 'otsuka', guiltyKey: 'A', recorded: true,
    first: [['', '（大塚茂。58歳。手の甲に、包帯が巻かれている。）'], ['otsuka', '……火はつけてません。']],
    labels: { A: ['黙秘権を告げ、弁解を聴く', 'そのまま聴き取る'], B: ['鑑定結果を突きつける', '「灯油を撒いた跡がある」'], D: ['「認めれば、お母さんの面会ができる」と言う', '取引を持ちかける'] },
    inc: { A: { G: 8, I: 4 }, B: { G: 18, I: 14 }, C: { G: 30, I: 28 }, D: { G: 30, I: 30 }, E: { G: 26, I: 24 } },
    pools: {
      A: [S => [['you', '言いたくないことは、言わなくていい。'], ['otsuka', 'ストーブは、消したと思います。……思う、としか言えない。']],
        S => [['otsuka', '母は、夜中に何度も起きるんです。寒い、寒いって。だから、居間のストーブを遅くまで。']],
        S => [['otsuka', '保険を増やしたのは、本当です。でも、母を家に置いて、火をつける人間がいますか。']],
        S => [['otsuka', '工務店が潰れて、半年。……疲れてたのは、本当です。']]],
      B: [S => K.doc('kanteiP') ? [['you', '床に、灯油を撒いた跡がある。科捜研の鑑定だ。'], ['otsuka', '撒いてません。ストーブの灯油じゃないんですか。']] : null,
        S => K.doc('insurance') ? [['you', '2か月前に、保険を2000万にしたな。'], ['otsuka', '……家財を、見直しただけです。']] : null,
        S => K.doc('neighbor') ? [['you', '1時半、家の前で何をしていた。'], ['otsuka', '自販機です。お茶を買いに。']] : null,
        S => [['you', '言い逃れはできないぞ。'], ['otsuka', '……']]],
      C: [S => [['', '（録画装置が回り続けている。午後10時。）'], ['otsuka', '母は、施設でちゃんと眠れてるんでしょうか。']], S => [['', '（13時間目。）'], ['otsuka', '……もう、何でもいいです。']]],
      D: [S => [['you', '認めれば、お母さんに会えるよう、検事に頼んでやる。'], ['otsuka', '……母に。']]],
      E: [S => [['you', '寝たきりの母親がいる家に火をつけたんだぞ！', { sfx: 'thud' }], ['otsuka', '……っ、つけてない……！']]]
    },
    confess: confess,
    afterConfession: S => kit.afterConfession(S, {
      who: 'otsuka', guiltyKey: 'A',
      topics: [
        { k: 'lighter', label: '何で火をつけたか聞く', run: async S => { S.c.qLighter = true; await G.talk(S.c.truth === 'A' ? [['otsuka', '台所の、ガスライター。……使ったあと、流しの下に戻しました。']] : [['otsuka', '……ライター、です。どの、と言われても……']]); } },
        { k: 'where', label: '灯油をどこに撒いたか聞く', run: async S => { await G.talk(S.c.truth === 'A' ? [['otsuka', 'ストーブの前から、テレビの方へ。ポリタンクから直接。']] : [['otsuka', '……居間の、床に。……全体に。']]); } },
        { k: 'mother', label: 'なぜ母親を寝かせたままだったのか聞く', run: async S => { await G.talk([['otsuka', '…………'], ['otsuka', '母を、置いていくつもりなんか、なかった。']]); } }
      ],
      chat: [S => [['otsuka', '工務店で、30年。大工でした。この家も、半分は自分で直したんです。']], S => [['otsuka', '母は、夜中によく這って居間に来るんです。寒い、寒いって。']], S => [['otsuka', '施設の母は、私のこと、分かってますかね。']]]
    })
  };
  async function confess(S, voluntary, opt) {
    const c = S.c; opt = opt || {};
    if (opt.by === 'todo') await G.talk([['todo', '認めたぞ。', { scene: sc('todo') }]]);
    else await G.talk([['otsuka', '……撒きました。灯油を、居間の床に。'], ['otsuka', '……ライターで。']]);
    c.confession = { voluntary, by: opt.by || 'you', day: S.day };
    K.addDoc({ id: 'confession', title: '大塚の供述調書（自白）', kind: 'neu', evid: true, body: P('私は、1月18日午前2時半ころ、自宅1階の居間の床に灯油を撒き、ライターで火をつけました。保険金が欲しかったからです。') + note('取調べは録画されている。') });
    await G.talk([['', '（調書が作られ、大塚は署名した。）', { sfx: 'pen' }]]);
  }
  async function finish(S, how) { S._ended = true; S.c.how = how; await kit.soutchi(C, S); K.end(how); }

  const TRIAL = {
    accusedName: '大塚茂', name: '本町三丁目火災', court: '北見坂地方裁判所（裁判員裁判：裁判官3人・裁判員6人）', truthText: '大塚が火をつけた世界か、ストーブの事故だった世界か。',
    issue: { pro: '本件火災が被告人の放火によることを示す事情', yes: '以上によれば、本件火災は被告人の放火によるものと認められる。', no: '以上によれば、本件火災が被告人の放火によるものであることについて、合理的な疑いが残る。刑訴法336条により、被告人に対し無罪の言渡しをする。' },
    retract(S) { const c = S.c; if (c.confession) c.retract = c.confession.voluntary ? false : c.truth === 'N' ? rnd() < .85 : rnd() < .4; },
    lines(S, charge) { const c = S.c; return [['kenji', c.confession ? (c.retract ? '大塚は自白を撤回しました。' : '大塚は放火を認めています。') : '大塚は否認しています。頼みは鑑定です。'], ['kenji', charge ? '起訴します。' : '……鑑定だけでは、放火と言い切れません。嫌疑不十分で不起訴とします。'], ['', charge ? '（大塚茂は、現住建造物等放火で起訴された。裁判員裁判である。）' : '（大塚茂は釈放された。）']]; },
    weigh(S, ids, trial) {
      const c = S.c, has = id => ids.includes(id); let pos = 0, neg = 0; const pros = [], cons = [];
      const add = (v, why) => { if (v > 0) { pos += v; if (why) pros.push(why); } else if (v < 0) { neg -= v; if (why) cons.push(why); } };
      if (has('kanteiP')) add(has('kanteiR') ? 1 : 2.5, has('kanteiR') ? '科捜研の鑑定は、床に灯油を撒いた可能性が高いとする' : '科捜研の鑑定によれば、床面に液体を撒いた痕跡が認められ、灯油成分が検出されている');
      if (has('kanteiR')) add(-1.5, '別の専門家の鑑定は、床の焼け跡はフラッシュオーバー後にも生じうるもので、液体の散布を推認できないとする');
      if (has('insurance')) add(.7, '被告人は事件の2か月前に保険金額を増額している');
      if (has('debt')) add(.5, '被告人は多額の借金を抱えていた');
      if (has('neighbor')) add(.4, '被告人は出火の約1時間前、自宅の外にいた');
      if (has('vend')) add(-.3, '被告人の外出は、自販機での購入記録と合う');
      if (has('stove')) add(-.5, 'ストーブは横倒しで、給油タンクの口金が緩んでいた');
      if (has('neighborCam')) { add(.3, '出火の前後、被告人宅に出入りした第三者はいない'); add(-.2, ''); }
      if (has('kerosene')) add(-.2, '灯油の購入は、冬の間の習慣どおりであった');
      if (has('doctor')) add(-.8, '被告人の母は、夜間に這ってストーブに近づくことがあった');
      if (has('experiment')) add(-1.5, '再現実験では、ストーブの転倒だけで本件と類似の焼け跡が生じた');
      if (has('recall')) add(-1, '同型のストーブで、転倒時に消火装置が作動しない事故が報告されている');
      if (has('phoneDoc') && c.phone === 'A') add(2.5, '被告人は事件の約2週間前、「灯油 火事 証拠」と検索している');
      if (has('phoneDoc') && c.phone === 'N') add(-1, '被告人は事件の1か月前、ストーブの不具合について検索している');
      if (has('confession') && c.confession) add(c.retract && trial ? 2 : 3.5, '被告人は捜査段階で放火を認めた' + (c.retract && trial ? '。公判では撤回している' : ''));
      return { pos, neg, pros, cons };
    },
    admit(S, admit, drop) { const c = S.c;
      if (c.confession && (c.recordedAbuse || 0) > 0 && rnd() < .9) drop('confession', '録画によれば、自白は長時間の追及、脅迫的な言動又は利益の約束の下でされたもので、任意性に疑いがある（刑訴法319条1項）');
      if (admit.includes('kiyo')) drop('kiyo', '大塚キヨの供述は、認知症の影響により意味内容を特定できず、証拠として採用しない'); },
    decide(S, r) { return (r.pos - r.neg >= 4 && r.neg <= 1.2) ? { verdict: '有罪', main: '被告人を拘禁刑7年に処する。' } : { verdict: '無罪', main: '被告人は無罪。' }; },
    nothing: v => v.startsWith('有罪') ? '大塚茂の母キヨは、息子の服役中に施設で亡くなった。' : '大塚茂は、母の暮らす施設の近くに移り住んだという。',
    finale: '本件は裁判員裁判の対象事件であり、逮捕後の取調べは録画されていた（刑訴法301条の2）。<br>火災の原因をめぐる鑑定は、科学の進歩によって評価が変わることがある。',
    async reveal(S, verdict) {
      const c = S.c, guilty = verdict.startsWith('有罪');
      if (guilty && c.truth === 'N' && rnd() < .55) {
        await G.curtain([{ html: '<div class="big">5年後</div>', wait: 1200 },
          { html: '<div class="doc-s"><h3>リコール</h3>石油ストーブKT-2300について、転倒時に自動消火装置が作動しない欠陥が確認され、メーカーはリコールを発表した。同型の火災は全国で11件に上っていた。<br><br>弁護人は、新たな証拠として再審を請求した。</div>', wait: 3400 },
          { html: '<div class="doc-s"><h3>再審</h3>再審で、大塚茂は無罪となった。<br>母キヨは、その2年前、施設で亡くなっていた。<br><br>「最後に会ったのは、あの夜、背負って外に出たときです。……背中が、温かかった。」</div>', wait: 3600 }]);
        return true;
      }
      if (!guilty && c.truth === 'A' && rnd() < .55) {
        await G.curtain([{ html: '<div class="big">2年後</div>', wait: 1200 },
          { html: '<div class="doc-s"><h3>判決（裁判員裁判）</h3>大塚茂は、隣の市のアパートの自室に灯油を撒いて火をつけ、2階に住む男性（71歳）を死亡させた。火災保険金を請求していた。<br><br>男性は、足が不自由だった。避難の途中、階段で倒れていた。</div>', wait: 3600 },
          { html: '<div class="doc-s"><h3>取調べ（録音録画記録より）</h3>「本町の家も、おれです。あのときは、鑑定で助かった。」</div>', wait: 3000 },
          { html: '<div class="law">本町三丁目火災について、大塚茂は' + (verdict === '無罪' ? 'すでに無罪の判決を受け、確定している。<br><br>何人も、既に無罪とされた行為については、刑事上の責任を問はれない。</div><div class="cite">日本国憲法　第39条</div>' : '起訴されていなかった。</div>'), wait: 3000 }]);
        return true;
      }
      return false;
    }
  };

  G.cases = G.cases || {};
  G.cases.kasai = {
    title: '本町三丁目火災', sub: '放火・火事か放火か', trial: TRIAL,
    run: async function () {
      const S = { c: { truth: rnd() < .5 ? 'A' : 'N', sess: { A: 0, B: 0, C: 0, D: 0, E: 0 } } };
      G.audio.cue('main'); G.audio.ambient('office');
      await G.curtain(['<div class="big">本町三丁目火災</div><div class="small">未明の住宅火災。出火原因は分からない</div>']);
      G.auditCtx = { suspect: 'otsuka', inCustody: () => inC(S) };
      await K.start(C, S);
      G.audio.ambient(null);
      return S;
    }
  };
})();
