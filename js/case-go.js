'use strict';
/* ============================================================
   第五章（試作）：二件目の現場まわり
   筋書きを持たない。捜査の結果は、すべて world5 の「世界」から計算する。
   聞き込み・カメラ・照会・鑑定・差押え は、「誰に・どこの・いつの分を」を自分で選ぶ。
   時間がたつと、記憶は薄れ（ニュースで混ざり）、映像は上書きされる。
   ============================================================ */
(function () {
  const K = G.keiji, P = G.P, kv = G.kv, note = G.note, kit = G.kit, sc = kit.sc;
  let W = null;
  const w5 = () => G.world5;
  // ゲームの日 → 世界の時刻（0日目は発見の日の午後。翌日からは朝9時）
  const dayT = d => d === 0 ? w5().T(12, 7, 15, 0) : w5().T(12, 7, 9, 0) + d * 1440;
  const fmt = t => W.fmt(t);
  const tr = id => W.byId(id);
  const place = id => (w5().PLACES[id] || {}).name || id;
  const has = id => !!K.doc(id);

  // 映像に映る人の見た目（顔が分かるかどうか）
  const LOOK = { aizawa: '作業着の男。顔が映っている', kaji: '自転車の若い男', asakura: '若い女性', tsuji: 'マスクと帽子の男。紺のコート' };

  /* ---------- 記録の文面の型 ---------- */
  const rowsOf = ts => kv(ts.map(t => [fmt(t.t).replace(/ 0:00$/, '').replace(/^(\d+月\d+日) /, '$1<br>'), t.text]));
  function addTraces(id, title, head, ts, tail) {
    ts.forEach(t => (S0().seen[t.id] = true));
    K.addDoc({ id, title, body: P(head) + (ts.length ? rowsOf(ts) : '') + (tail ? note(tail) : '') });
  }
  let _S = null; const S0 = () => _S;

  /* ---------- 聞き込み ---------- */
  const WHO = {
    downstairs: { name: '下の階の住人', sub: '梶のアパート', mem: 'downstairs' },
    shinyu: { name: '梶の親友（発見した人）', sub: '大学の同期', mem: 'shinyu' },
    jukuColleague: { name: '塾の同僚', sub: '梶のアルバイト先', mem: 'jukuColleague' },
    teishokuClerk: { name: '定食屋の店員', sub: '一件目：朝倉がよく来た店', mem: 'teishokuClerk' },
    eigyosho: { name: '宅配の営業所長', sub: '相沢の勤め先', cond: S => S.c.aizawa },
    sewayaku: { name: '公民館の世話役', sub: '相沢が通っていた集まり', cond: S => S.c.kominkan, mem: 'sewayaku' }
  };
  function hear(S, who, at) {
    const w = WHO[who];
    if (who === 'eigyosho') {
      S.c.eigyosho = true; S.c.kominkan = true;
      return { title: '宅配の営業所長の話', body: P('「相沢ですか。あの区域は、ずっとあいつの担当です。旭町も栄町も。区域の家の半分くらいには、毎月なにか届けてますよ。」',
        '「11月14日の金曜？　……運行の記録だと、8時ごろに車を戻してますね。金曜は早く上がるんです。公民館で何かの集まりに出てるとかで。何の集まりかは、聞いてません。」',
        '「12月5日も金曜ですね。8時半ごろ戻してる。その後は知りません。」') };
    }
    const m = W.memories.find(x => x.who === w.mem);
    const days = (at - m.t) / 1440;
    if (m.confidential) {
      S.c.sewayaku = true;
      return { title: '公民館の世話役の話', body: P('「どの集まりに誰が来ているかは、お答えできません。そういう約束で、みなさん来ているので。」',
        '（何度か頭を下げると、世話役は少し黙ってから言った。）', '「……ただ、捜査のためにどうしても必要なら、ご本人から聞いてください。ご本人が話していいと言うなら、私も話します。」') };
    }
    if (days > m.fadeDays) return { title: w.name + 'の話', body: P('「' + (who === 'teishokuClerk' ? 'あのお客さん……いつも一人で来てた人ですよね。あの日のことは、もうはっきりとは。毎日、何十人も来るので' : 'ごめんなさい、もう、はっきりとは覚えていないんです') + '」'), faded: true };
    const mixed = m.newsAdds && at > W.case2.news;
    return { title: w.name + 'の話', body: P('「' + m.text + '」' + (mixed ? '<br>「' + m.newsAdds + '」' : '')) + (mixed ? note('聴いたのは' + fmt(at).replace(/ .*/, '') + '。ニュースが流れた後だった。') : ''), mixed };
  }

  /* ---------- 防犯カメラ ---------- */
  const CAMS = () => {
    const out = [];
    Object.entries(w5().PLACES).forEach(([pid, p]) => (p.cams || []).forEach(c => out.push(Object.assign({ place: pid, pname: p.name }, c))));
    return out;
  };
  const WINS = [
    { id: 'k2n', label: '12月5日の夜（18時〜24時）', from: [12, 5, 18], to: [12, 5, 24] },
    { id: 'k2m', label: '12月6日の朝（6時〜12時）', from: [12, 6, 6], to: [12, 6, 12] },
    { id: 'k1n', label: '11月14日の夜（18時〜24時）', from: [11, 14, 18], to: [11, 14, 24] },
    { id: 'k1m', label: '11月15日の朝（6時〜12時）', from: [11, 15, 6], to: [11, 15, 12] }
  ];
  const winT = w => [w5().T(w.from[0], w.from[1], w.from[2]), w5().T(w.to[0], w.to[1], w.to[2])];
  function watch(S, cam, win, at) {
    const [a, b] = winT(win);
    const title = '映像の確認（' + cam.pname.replace(/（.*）/, '') + '・' + win.label.replace(/（.*）/, '') + '）';
    if (at > a + cam.keep) return { title, body: P(cam.pname + 'の' + cam.name + '。', '映像は' + Math.round(cam.keep / 1440) + '日で上書きされる。' + win.label + 'の分は、もう残っていなかった。') };
    const hits = W.traces.filter(t => t.cam === cam.id && t.t >= a && t.t <= b);
    // 世界の出来事から：その場所にいた人は映る（移動中を除く。辻は上の痕跡で映る）
    // 歩いて・乗って来た行事は、着いた時刻にそこにいる
    W.events.filter(e => e.place === cam.place && e.who !== 'tsuji').forEach(e => {
      const f = e.how ? e.to - 5 : e.from, g = e.to;
      if (f <= b && g >= a) hits.push({ id: 'ev_' + e.who + e.from, t: Math.max(f, a), text: LOOK[e.who] || '人' });
    });
    hits.sort((x, y) => x.t - y.t);
    hits.forEach(h => { S.seen[h.id] = true; if (/^ev_aizawa/.test(h.id)) S.c.aizawaAtm = true; });
    return { title, body: P(cam.pname + 'の' + cam.name + '。' + win.label + 'の分を確認した。') + (hits.length ? rowsOf(hits) : P('目に留まる人物は映っていない。')) };
  }

  /* ---------- 照会・鑑定・差押え ---------- */
  const INQ = [
    { id: 'bankKaji', label: '銀行：梶の口座の取引', run: S => ({ title: '照会回答（銀行・梶の口座）', ts: ['atm2'], head: '梶遼名義の普通預金口座について、12月1日以降の取引。', tail: '引き出したATM：' + place(tr('atm2').place) }) },
    { id: 'bankAsakura', label: '銀行：朝倉の口座の取引', run: S => ({ title: '照会回答（銀行・朝倉の口座）', ts: ['atm1'], head: '朝倉真帆名義の普通預金口座について、11月以降の取引。', tail: '引き出したATM：' + place(tr('atm1').place) }) },
    { id: 'kanri', label: '管理会社：二人の入居の書類', run: S => { S.c.hosho = true; return { title: '照会回答（管理会社・入居の書類）', ts: [], head: '梶遼（旭町）、朝倉真帆（栄町）の賃貸借契約の書類の写し。管理会社は別々。', tail: '家賃の保証会社は、二人とも「北見坂ライフ保証」。この市内では、借りる人の三割ほどがここを使う。' }; } },
    { id: 'delivery', label: '宅配会社：二人あての配達の記録', run: S => { S.c.aizawa = true; return { title: '照会回答（宅配会社・配達の記録）', ts: ['deliveryAsakura', 'deliveryKaji'], head: '11月1日以降、朝倉真帆様・梶遼様あての荷物の配達記録。' }; } },
    { id: 'credit', label: '信用情報：相沢の借入れ', cond: S => S.c.aizawa, run: S => ({ title: '照会回答（信用情報・相沢）', ts: ['debtAizawa'], head: '相沢湊の借入れの状況。', tail: '返済の遅れは、11月から止まっている。' }) },
    { id: 'bankAizawa', label: '銀行：相沢の口座の取引', cond: S => S.c.aizawa, run: S => ({ title: '照会回答（銀行・相沢の口座）', ts: ['atmAizawa'], head: '相沢湊名義の普通預金口座について、12月1日以降の取引。', tail: '引き出したATM：' + place('atmEkimae') }) },
    { id: 'hosho', label: '保証会社：二人の審査書類の閲覧の記録', cond: S => S.c.hosho, run: S => { S.c.tsuji = true; return { title: '照会回答（北見坂ライフ保証・閲覧の記録）', ts: ['hoshoLogAsakura', 'hoshoLogKaji'], head: '朝倉真帆様・梶遼様の入居審査の書類について、社内システムの閲覧の記録。', tail: '閲覧したのは、どちらも審査担当・辻圭吾のIDだった。どちらも勤務時間の外で、社外から。審査は、どちらも半年以上前に終わっている。' }; } },
    { id: 'telco', label: '通信会社：梶の携帯の通話の記録', run: S => { S.c.telcoNo = true; return { title: '照会回答（通信会社）', ts: [], head: '「通信の記録は、通信の秘密にあたるため、照会にはお答えできません。令状をお持ちください。」' }; } }
  ];
  const EXP = [
    { id: 'phoneKaji', label: '梶の携帯電話の解析', cond: S => S.c.kenbun, run: S => { S.c.unknownNo = true; return { title: '鑑定書（梶の携帯電話）', ts: ['callKaji', 'msgKaji'], head: '現場で押収した梶遼の携帯電話。12月1日以降の着信・メッセージ。' }; } },
    { id: 'phoneAsakura', label: '朝倉の携帯電話の解析（一件目）', run: S => { S.c.unknownNo = true; return { title: '鑑定書（朝倉の携帯電話）', ts: ['callAsakura', 'msgAsakura', 'msgAkiyama1', 'msgAkiyama2'], head: '一件目で保管していた朝倉真帆の携帯電話。11月以降の着信・メッセージ。' }; } },
    { id: 'foot', label: '足跡の鑑定', cond: S => S.c.kenbun, run: S => ({ title: '鑑定書（足跡）', ts: ['footprint'], head: '梶の部屋の玄関で採取した足跡。', tail: '靴の型は量販品で、市内の作業服店・量販店で広く売られている。' }) },
    { id: 'env', label: '封筒の切れ端の鑑定', cond: S => S.c.kenbun, run: S => ({ title: '鑑定書（封筒の切れ端）', ts: ['envelope'], head: '梶の部屋の床で見つかった紙片。', tail: '会社が使う封筒によくある型。どこの封筒かは、見本があれば比べられる。' }) },
    { id: 'envHosho', label: '封筒の切れ端と、保証会社の封筒を比べる', cond: S => S.c.kenbun && S.c.hosho, run: S => { S.c.envMatch = true; return { title: '鑑定書（封筒の比較）', ts: [], head: '梶の部屋の紙片と、北見坂ライフ保証の社用封筒（任意で提出を受けたもの）を比べた。', tail: '紺の印刷の色、罫線の幅と間隔が一致する。同じ型の封筒の一部と考えて矛盾はない。' }; } }
  ];
  const SEIZE = [
    { id: 'telcoKaji', label: '梶の携帯にかけてきた番号の記録', cond: S => S.c.unknownNo, run: (S, at) => {
      const t = tr('telcoCall2');
      if (at > t.t + t.keep) return { title: '差押えの結果（通信会社）', ts: [], head: '記録は保存の期間を過ぎ、消えていた。' };
      S.c.prepaid = true; return { title: '差押えの結果（通信会社・発信元）', ts: ['telcoCall2'], head: '梶遼の携帯電話への12月の着信のうち、登録のない番号について。', tail: 'この番号は、朝倉真帆の携帯にかけてきた番号と同じだった。' }; } },
    { id: 'baseAizawa', label: '相沢の携帯の位置の記録', cond: S => S.c.aizawa, run: S => ({ title: '差押えの結果（通信会社・基地局）', ts: ['baseAizawa1', 'baseAizawa2'], head: '相沢湊の携帯電話が接続した基地局の記録。', tail: '基地局一つの範囲は、街なかでも半径数百メートルから1キロほどある。' }) }
  ];

  /* ---------- 事件の定義 ---------- */
  const C = {
    id: 'go', role: '捜査官（主任）', base: { m: 12, d: 7 }, dayCard: true, noCoach: true, custodyEvents: false,
    staff: [{ id: 'shirai', name: '白井' }, { id: 'oka', name: '岡' }, { id: 'noguchi', name: '野口' }],
    elemTitle: '見えてきたこと',
    info: S => ({ text: '旭町事件（試作）　発見から' + (S.day + 1) + '日' }),
    scene: S => sc(null, 'office'),
    endHint: S => '部下の報告は、明日の朝に届く',
    nextMilestone: () => null,
    elements: S => {
      const c = S.c;
      return [
        { k: '二件は同じ犯人か', v: (has('q_bankKaji') && has('q_bankAsakura') ? 1 : 0) + (c.unknownNo ? 1 : 0) + (c.prepaid ? 1 : 0), src: '' },
        { k: '二人をつなぐ人', v: (c.hosho ? 1 : 0) + (c.tsuji ? 1 : 0) + (c.envMatch ? 1 : 0), src: '' },
        { k: '相沢への疑いの当否', v: (c.eigyosho ? 1 : 0) + (c.sewayaku ? 1 : 0) + (has('s_baseAizawa') ? 1 : 0), src: '' }
      ];
    },
    people: S => {
      const c = S.c, out = [];
      if (c.aizawa) out.push({ id: 'aizawa', name: '相沢　湊', sub: '宅配の配達員・31歳', facts: [
        [true, '朝倉にも梶にも、荷物を届けていた'],
        has('q_credit') && [true, '消費者金融に約300万円'],
        c.aizawaAtm && [true, '梶のカードが使われた朝、旭町駅前のATMにいた' + (has('q_bankAizawa') ? '（引き出したのは、自分の口座から）' : '')],
        has('s_baseAizawa') && [true, '二件とも、その夜、現場の近くの基地局につながっていた'],
        c.eigyosho && [false, '二人の住む区域は、ずっと相沢の担当。区域の家の半分に届けている'],
        c.eigyosho && [null, '一件目の夜は8時に車を戻し、公民館の集まりへ（何の集まりかは不明）'],
        c.sewayaku && [null, '公民館の世話役は、本人の同意がなければ話せないと言う']].filter(Boolean) });
      if (c.unknownNo) out.push({ id: 'phone', name: '登録のない番号の持ち主', sub: '誰かは分からない', facts: [
        [true, '朝倉にも梶にも、事件の数日前に電話をかけていた'],
        S.seen.msgAsakura && [true, '朝倉は「保証会社ってとこから在宅確認の電話」と書いていた'],
        c.prepaid && [true, '払い込み式の携帯。契約者の情報がない']].filter(Boolean) });
      if (c.tsuji) out.push({ id: 'tsuji', name: '辻　圭吾', sub: '北見坂ライフ保証・審査担当', facts: [
        [true, '二人の審査書類を、勤務時間外に社外から閲覧していた'],
        c.envMatch && [true, '梶の部屋の紙片は、この会社の封筒と同じ型']].filter(Boolean) });
      return out;
    },
    setTarget: async (S, id) => { S.c.target = id; G.toast('追う人物を決めた（試作：ここから先はまだない）'); },
    goal: S => ({ goal: '梶遼さんの事件と、三週間前の朝倉真帆さんの事件。二つをつなぐものを探す',
      why: '聞き込み・カメラ・照会・鑑定は、<b>誰に・どこの・いつの分を</b>、自分で選んで部下に頼む。<br>時間がたつと、人の記憶は薄れ、ニュースを見た後では混ざる。防犯カメラは、決まった日数で上書きされる。<br>結果は、すべて「本当に起きたこと」から計算される。決まった筋書きはない。',
      hints: [] }),
    morning: (S, first) => {
      const L = [];
      if (first) {
        L.push(['', '（12月7日、午後。旭町のアパートで、若い男性が死んでいると通報があった。）', { sfx: 'phone' }],
          ['todo', '死んでたのは梶遼（かじ りょう）、23歳。大学院生。連絡のつかない親友が、管理会社と部屋に入って見つけた。', { scene: sc('todo', 'kacho') }],
          ['todo', '財布からキャッシュカードだけがない。パソコンは残ってる。……三週間前の栄町と、同じだ。'],
          ['todo', '栄町の朝倉真帆の件は、まだ誰も挙がってない。主任、両方お前が持て。'],
          ['shirai', '主任。カメラの映像は、店によって一週間から一か月で消えます。聞き込みも、早いほどいい。', { scene: sc('shirai') }],
          ['shirai', 'どこの、いつの分を当たるか。……決めてください。']);
        K.addDoc({ id: 'report2', title: '通報の記録', body: P(tr('report2').text + '。', '受理：' + fmt(tr('report2').t)) });
        const a1 = tr('atm1'), c1 = tr('atmCam1');
        K.addDoc({ id: 'case1', title: '一件目（栄町事件）の記録の要旨', body: kv([['被害者', '朝倉真帆（24歳・会社員）　栄町のマンション'], ['発見', fmt(tr('report1').t) + '　' + tr('report1').text], ['死亡の推定', fmt(W.case1.deathFrom) + 'ころから ' + fmt(W.case1.deathTo) + 'ころまで'], ['現場', tr('sceneA').text], ['カード', fmt(a1.t) + '　朝倉のカードで引き出し（' + place(a1.place) + '）'], ['映像', c1.text], ['携帯電話', '保管中。解析はしていない'], ['被疑者', '浮かんでいない']]) });
        K.addDoc({ id: 'manual', title: '捜査の要点', kind: 'memo', body: P('・部下に頼む捜査は、どれも「誰に・どこの・いつの分を」を選ぶ。結果は翌朝に届く。', '・防犯カメラは、決まった日数で上書きされる。人の記憶は日ごとに薄れ、ニュースの後では、見聞きしたことが混ざる。', '・通信の記録は、照会では出てこない。令状で差し押さえる。', '・二件をつなぐものを探す。疑わしい人が浮かんでも、その人に無実の説明がないか、確かめる。') });
      }
      // ニュース（記憶が混ざりはじめる）
      if (!S.c.newsSeen && dayT(S.day) > W.case2.news) {
        S.c.newsSeen = true;
        L.push(['', '（昨夜のニュース：「旭町のアパートで大学院生が死亡。警察は殺人事件とみて捜査。近所の住民によると、事件の夜、車が止まる音がしたという」）']);
      }
      return L;
    },
    actions: [
      { id: 'kenbun', who: 'self', label: '現場を見る（実況見分）', sub: '梶の部屋。足跡・遺留品・携帯電話', primary: true,
        run: async S => {
          S.c.kenbun = true;
          await G.talk([['', '（旭町のアパート、二階の角部屋。玄関、六畳、台所。）', { scene: sc(null, 'office') }], ['oka', '主任、玄関に足跡。床に、紙の切れ端が一つ。……携帯は、テーブルの上です。', { scene: sc('oka') }]]);
          const ts = ['sceneK', 'footprint', 'envelope'].map(tr);
          addTraces('kenbunK', '実況見分調書（旭町）', '旭町のアパート、梶遼の居室。' + fmt(dayT(0)) + 'から見分。', ts, '梶の携帯電話を押収した。');
        } },
      { id: 'hear', who: 'staff', days: 1, multi: true, once: false, label: '人から話を聴く（聞き込み）', short: '聞き込み', sub: '誰に聴くかを選ぶ',
        ask: async S => {
          const v = await G.openPaper({ title: '誰に話を聴くか', sub: '聞き込み', body: P('時間がたつほど、記憶は薄れる。'), buttons: Object.entries(WHO).filter(([k, w]) => !w.cond || w.cond(S)).map(([k, w]) => ({ label: w.name, value: k, small: w.sub + (S.asked['h_' + k] ? '（聴いた）' : '') })), closeLabel: 'やめる' });
          return v ? { who: v, label: '聞き込み：' + WHO[v].name } : null;
        },
        done: (S, t) => {
          const r = hear(S, t.q.who, dayT(t.at) + 240); S.asked['h_' + t.q.who] = true;
          K.addDoc({ id: 'h_' + t.q.who + (S.asked['h2_' + t.q.who] ? '_' + t.at : ''), title: r.title + (S.asked['h2_' + t.q.who] ? '（' + K.date(t.at) + '）' : ''), body: r.body }); S.asked['h2_' + t.q.who] = true;
          return [];
        } },
      { id: 'cam', who: 'staff', days: 1, multi: true, once: false, label: '防犯カメラの映像を集める', short: 'カメラの確認', sub: 'どこの・いつの分かを選ぶ',
        ask: async S => {
          const cams = CAMS();
          const c = await G.openPaper({ title: 'どこのカメラか', sub: '防犯カメラ', body: P('保存の日数は、カメラごとに違う。'), buttons: cams.map(x => ({ label: x.pname.replace(/（.*）/, '') + '　' + x.name, value: x.id, small: '上書きまで' + Math.round(x.keep / 1440) + '日' })), closeLabel: 'やめる' });
          if (!c) return null;
          const w = await G.openPaper({ title: 'いつの分か', sub: cams.find(x => x.id === c).pname, body: '', buttons: WINS.map(x => ({ label: x.label, value: x.id })), closeLabel: 'やめる' });
          return w ? { cam: c, win: w, label: 'カメラ：' + cams.find(x => x.id === c).pname.replace(/（.*）/, '') } : null;
        },
        done: (S, t) => {
          const cam = CAMS().find(x => x.id === t.q.cam), win = WINS.find(x => x.id === t.q.win);
          const r = watch(S, cam, win, dayT(t.at) + 240);
          K.addDoc({ id: 'c_' + t.q.cam + '_' + t.q.win, title: r.title, body: r.body });
          return [];
        } },
      { id: 'inq', who: 'staff', days: 2, multi: true, once: false, label: '会社や役所に照会する', short: '照会', sub: 'どこに・何を問い合わせるかを選ぶ（回答は2日後）',
        ask: async S => {
          const v = await G.openPaper({ title: '何を照会するか', sub: '捜査関係事項照会', body: '', buttons: INQ.filter(x => (!x.cond || x.cond(S)) && !S.asked['q_' + x.id]).map(x => ({ label: x.label, value: x.id })), closeLabel: 'やめる' });
          if (!v) return null; S.asked['q_' + v] = true; return { id: v, label: '照会：' + INQ.find(x => x.id === v).label };
        },
        done: (S, t) => { const r = INQ.find(x => x.id === t.q.id).run(S); addTraces('q_' + t.q.id, r.title, r.head, r.ts.map(tr), r.tail); return []; } },
      { id: 'exp', who: 'staff', days: 2, multi: true, once: false, label: '鑑定を嘱託する', short: '鑑定', sub: '何を調べてもらうかを選ぶ（結果は2日後）',
        ask: async S => {
          const list = EXP.filter(x => (!x.cond || x.cond(S)) && !S.asked['e_' + x.id]);
          if (!list.length) { G.toast('いま鑑定に出せるものはない'); return null; }
          const v = await G.openPaper({ title: '何を鑑定するか', sub: '鑑定の嘱託', body: '', buttons: list.map(x => ({ label: x.label, value: x.id })), closeLabel: 'やめる' });
          if (!v) return null; S.asked['e_' + v] = true; return { id: v, label: '鑑定：' + EXP.find(x => x.id === v).label };
        },
        done: (S, t) => { const r = EXP.find(x => x.id === t.q.id).run(S); addTraces('e_' + t.q.id, r.title, r.head, r.ts.map(tr), r.tail); return []; } },
      { id: 'seize', who: 'staff', days: 2, multi: true, once: false, label: '通信会社の記録を差し押さえる（令状）', short: '差押え', sub: '令状を取って、通信の記録を差し押さえる',
        cond: S => SEIZE.some(x => x.cond(S) && !S.asked['s_' + x.id]),
        ask: async S => {
          const v = await G.openPaper({ title: '何を差し押さえるか', sub: '差押許可状を請求する', body: P('裁判官が、必要と認めれば令状を出す。'), buttons: SEIZE.filter(x => x.cond(S) && !S.asked['s_' + x.id]).map(x => ({ label: x.label, value: x.id })), closeLabel: 'やめる' });
          if (!v) return null; S.asked['s_' + v] = true; return { id: v, label: '差押え：' + SEIZE.find(x => x.id === v).label };
        },
        done: (S, t) => { const r = SEIZE.find(x => x.id === t.q.id).run(S, dayT(t.at) + 1440); addTraces('s_' + t.q.id, r.title, r.head, r.ts.map(tr), r.tail); return []; } },
      { id: 'stop', who: 'self', free: true, once: false, label: 'ここまでにする（試作）', sub: '見つけたことと、見落としたことを確かめる',
        run: async S => {
          const key = ['msgAsakura', 'callKaji', 'hoshoLogAsakura', 'hoshoLogKaji', 'envelope', 'atm1', 'atm2'];
          const got = key.filter(id => S.seen[id]);
          const v = await G.openPaper({ title: 'ここまで（試作）', sub: '世界の種 ' + W.seed, noClose: true,
            body: P('この世界で本当に起きたこと：辻圭吾が、' + fmt(W.case1.visit) + 'に朝倉の部屋を、' + fmt(W.case2.visit) + 'に梶の部屋を訪ねた。三件目は ' + fmt(W.case3.visit) + '、榊葵の部屋の予定。')
              + kv(key.map(id => [tr(id).kind, (S.seen[id] ? '◯ ' : '× ') + tr(id).text.slice(0, 40)]))
              + P('辻へ届く記録：' + got.length + ' / ' + key.length + '。' + (S.c.tsuji ? '辻の名前にたどり着いた。' : '辻の名前には、まだ届いていない。') + (S.c.aizawa ? '　相沢には、' + (S.c.eigyosho || S.c.sewayaku ? '無実の説明の手がかりにも触れた。' : '疑わしい事実だけが並んでいる。') : '')),
            buttons: [{ label: '終える', value: 'end', cls: 'green' }, { label: '続ける', value: 'go' }] });
          if (v !== 'end') return false;
          S._ended = true; K.end('proto'); return false;
        } }
    ]
  };

  G.cases = G.cases || {};
  G.cases.go = {
    title: '旭町事件（試作）', sub: '第五章の試作：世界から計算する捜査',
    run: async function (seed) {
      W = w5().make(seed == null ? (Math.random() * 1e9) | 0 : seed);
      const S = { c: {}, seen: {}, asked: {}, world: W }; _S = S;
      G.audio.cue('titleOut'); G.audio.ambient('office');
      await G.curtain(['<div class="big">旭町事件</div><div class="small">第五章（試作）</div>']);
      G.audio.cue('case_eiyu');
      await K.start(C, S);
      G.audio.ambient(null);
      return S;
    }
  };
})();
