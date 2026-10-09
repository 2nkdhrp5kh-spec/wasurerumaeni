'use strict';
/* ============================================================
   令状当番：請求の自動生成
   二回目以降の令状当番は、ここで作った請求で三夜を組む。
   ・計画（plan）は保存できる素のデータ。請求の定義（defs）は計画から作る。
   ・罪種 × 問題点 の組み合わせは、遊んだものを記録し、まだ出ていないものから選ぶ。
     人名・住所・日付・金額などは毎回変わる。
   bad：'deny'（要件を欠く。却下すべき）／'fix'（請求書の誤り。電話で直れば発付してよい）／なし（問題なし）
   ============================================================ */
(function () {
  G.hanjiGen = {};
  // ---- 乱数（計画を作るときだけ使う。計画を保存すれば、同じ夜を作り直せる） ----
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---- 素材 ----
  const SUR = [['今井', 'いまい'], ['大西', 'おおにし'], ['片桐', 'かたぎり'], ['小松', 'こまつ'], ['佐久間', 'さくま'], ['杉浦', 'すぎうら'], ['高梨', 'たかなし'], ['津田', 'つだ'], ['富岡', 'とみおか'], ['中垣', 'なかがき'],
    ['西尾', 'にしお'], ['野村', 'のむら'], ['羽田', 'はねだ'], ['平松', 'ひらまつ'], ['福永', 'ふくなが'], ['堀江', 'ほりえ'], ['前原', 'まえはら'], ['三浦', 'みうら'], ['村瀬', 'むらせ'], ['森下', 'もりした'],
    ['安田', 'やすだ'], ['吉岡', 'よしおか'], ['和泉', 'いずみ'], ['岩崎', 'いわさき'], ['上野', 'うえの'], ['江川', 'えがわ'], ['落合', 'おちあい'], ['金子', 'かねこ'], ['菊池', 'きくち'], ['久保', 'くぼ'],
    ['桑原', 'くわばら'], ['小池', 'こいけ'], ['坂口', 'さかぐち'], ['島田', 'しまだ'], ['関', 'せき'], ['田辺', 'たなべ'], ['土屋', 'つちや'], ['戸川', 'とがわ'], ['長尾', 'ながお'], ['根本', 'ねもと']];
  const MEN = [['健太', 'けんた'], ['大輔', 'だいすけ'], ['拓也', 'たくや'], ['翔太', 'しょうた'], ['和也', 'かずや'], ['浩之', 'ひろゆき'], ['誠一', 'せいいち'], ['勇気', 'ゆうき'], ['隆', 'たかし'], ['正人', 'まさと'],
    ['博', 'ひろし'], ['康介', 'こうすけ'], ['亮', 'りょう'], ['俊介', 'しゅんすけ'], ['直樹', 'なおき'], ['竜也', 'たつや'], ['一郎', 'いちろう'], ['光男', 'みつお'], ['剛志', 'つよし'], ['秀樹', 'ひでき']];
  const WOM = [['美穂', 'みほ'], ['由香', 'ゆか'], ['恵子', 'けいこ'], ['真由美', 'まゆみ'], ['千尋', 'ちひろ'], ['佳奈', 'かな'], ['幸子', 'さちこ'], ['綾', 'あや'], ['陽子', 'ようこ'], ['理恵', 'りえ']];
  const TOWN = ['本町', '栄町', '港町', '西浜', '緑ヶ丘', '東町', '川端町', '旭町', '桜台', '白鳥町', '大橋', '若葉町'];
  const KANJI = ['一', '二', '三', '四', '五', '六', '七'];
  const JOB = ['会社員', 'アルバイト', '無職', '建設作業員', '飲食店従業員', '配送業', '自営業（内装業）', '契約社員', '大学生', 'パート従業員', 'タクシー運転手', '派遣社員'];
  const SHOP = ['スーパー「まるやま」', 'ドラッグストア「サクラ薬局」', 'コンビニエンスストア「ハッピーマート」', 'ホームセンター「カネタ」', '書店「北見坂ブックス」', '家電量販店「デンキのタツミ」'];
  const ITEM = [['化粧品3点', 4280], ['ウイスキー1本', 3980], ['電動歯ブラシ1個', 6800], ['食料品など12点', 3120], ['イヤホン1個', 8900], ['漫画本5冊', 2970], ['育毛剤2本', 9600]];

  // ---- 罪種 ----
  // need: 逮捕の必要を否定しやすい軽微なものか
  const CRIME = {
    manbiki: { charge: '窃盗', light: true }, jitensha: { charge: '窃盗', light: true }, okibiki: { charge: '窃盗' }, shajo: { charge: '窃盗' },
    shogai: { charge: '傷害' }, boko: { charge: '暴行', light: true }, ukeko: { charge: '詐欺' }, shinnyu: { charge: '住居侵入' }, kibutsu: { charge: '器物損壊', light: true },
    kakusei: { charge: '覚醒剤取締法違反' }
  };
  // 種類ごとの問題点
  const FLAWS = {
    arrest: ['none', 'none', 'date', 'identity', 'wrongDoc', 'noNeed', 'thin'],
    search: ['none', 'none', 'vague', 'place', 'noLink'],
    koryu: ['none', 'none', 'timeLimit', 'noGrounds', 'illegalArrest'],
    encho: ['none', 'otherCase', 'abstract', 'interroOnly'],
    body: ['none', 'needCond']
  };
  // ---- 段階：令状当番の回と夜ごとに、出てくる請求と問題点が増えていく ----
  // kinds：その夜の請求の数（種類ごと）／add：この段階で新しく出てくる問題点／memo：部総括判事からのメモ／laws：条文帳に加わる条文（見出しの先頭）
  const CURRICULUM = [
    null,
    { kinds: { arrest: 4 }, add: { arrest: ['none', 'none', 'date', 'identity'] }, laws: ['刑事訴訟法 第199条2項', '刑事訴訟規則 第143条の3'],
      memo: ['今夜は、逮捕状の請求だけが回ってくる。', '見るところは三つ。①被疑者が罪を犯したと疑うに足りる*相当な理由*があるか（刑訴法199条）。②*逮捕の必要*があるか。③請求書の記載が、添付の資料と合っているか。', '請求書の*被疑事実*（日時・場所・被害者）と、*被疑者*（氏名・年齢・住居）は、必ず被害届や住民票と照らし合わせること。誤記は、電話で訂正させればよい。'] },
    { kinds: { arrest: 5 }, add: { arrest: ['wrongDoc', 'thin'] }, laws: [],
      memo: ['添付された資料が、本当にその事件のものかを確かめること。被害届の日付・被害者・被害品が、請求書と違うことがある。', '*匿名の通報*だけでは、相当な理由の疎明にならない。通報を裏付ける資料があるかを見る。'] },
    { kinds: { arrest: 5 }, add: { arrest: ['noNeed'] }, laws: [],
      memo: ['罪を犯したと疑う理由があっても、*明らかに逮捕の必要がない*ときは、逮捕状を出さない（刑事訴訟規則143条の3）。', '軽い罪で、住居も勤め先も定まり、呼出しに応じている。そういう被疑者を、なぜ逮捕する必要があるのか。請求書の「逮捕の必要」の欄を読むこと。'] },
    { kinds: { arrest: 3, koryu: 2 }, add: { koryu: ['none', 'none', 'noGrounds'] }, laws: ['刑事訴訟法 第207条', '刑事訴訟法 第60条', '刑事訴訟法 第61条', '刑事訴訟法 第87条'],
      memo: ['今夜から、*勾留請求*も回ってくる（刑訴法207条1項）。', '勾留には、罪を犯したと疑う相当な理由に加え、60条1項の*各号*のどれかが要る。①住居不定　②罪証隠滅のおそれ　③逃亡のおそれ。さらに、勾留する必要があるか。', '勾留する前には、必ず*勾留質問*をすること（61条）。被疑者の言い分は、裁判官が自分で聴く。', '請求書が「1号（住居不定）」を挙げていても、資料を読めば住居があることがある。'] },
    { kinds: { arrest: 2, koryu: 3 }, add: { koryu: ['timeLimit'] }, laws: ['刑事訴訟法 第205条', '刑事訴訟法 第206条'],
      memo: ['*時間の制限*を確かめること。警察は逮捕から48時間以内に送致し、検察官は24時間以内に勾留を請求する。逮捕から通じて72時間を超えてはならない（203条・205条）。', '遅れたときは、遅延がやむを得ない事由によるものと認められなければ、勾留はできない（206条）。請求書の「逮捕」「送致」「受付」の時刻を、必ず計算すること。'] },
    { kinds: { arrest: 2, koryu: 2, search: 2 }, add: { search: ['none', 'none', 'vague', 'place'] }, laws: ['刑事訴訟法 第218条1項', '刑事訴訟法 第219条1項', '刑事訴訟法 第102条', '判例　差し押さえるべき物の明示'],
      memo: ['今夜から、*捜索差押許可状*の請求も回ってくる。', '令状には、*捜索すべき場所*と*差し押さえるべき物*を明示しなければならない（憲法35条、刑訴法219条）。', '「本件に関係ありと思料される一切の物件」だけでは、何を差し押さえてよいのか分からない。具体的な物を挙げさせること。場所も、部屋まで特定させること。'] },
    { kinds: { arrest: 1, koryu: 2, search: 2, encho: 1 }, add: { search: ['noLink'], encho: ['none', 'abstract'] }, laws: ['刑事訴訟法 第208条'],
      memo: ['他人の住居を捜索するには、そこに差し押さえるべき物があると認めるに足りる状況が要る（102条2項）。被疑者とその場所の*結びつき*を確かめること。', '今夜から、*勾留期間の延長*の請求も回ってくる。延長には「*やむを得ない事由*」が要る（208条2項）。「捜査未了」とだけ書いてある請求は、何が未了なのかを読むこと。'] },
    { kinds: { arrest: 1, koryu: 3, search: 1, encho: 1 }, add: { koryu: ['illegalArrest'], encho: ['otherCase'] }, laws: ['学説　違法な逮捕と勾留', '刑事訴訟法 第210条1項'],
      memo: ['勾留請求の前の*逮捕が違法*だったときは、その逮捕を前提とする勾留の請求は、却下されうる。逮捕手続書を読み、令状なしに住居に入っていないか、緊急逮捕のあと令状を直ちに請求しているかを確かめること。', '延長の理由が、実は*別の事件（余罪）*の捜査のためになっていないか。本件の捜査がどこまで進んでいるかを読むこと。'] },
    { kinds: { arrest: 1, koryu: 2, search: 1, encho: 1, body: 1 }, add: { body: ['none', 'needCond'], encho: ['interroOnly'] }, laws: ['刑事訴訟法 第218条8項・9項', '刑事訴訟法 第131条'],
      memo: ['今夜から、*身体検査令状*の請求も回ってくる（218条）。身体の検査は、被検査者の名誉を害しないように行わなければならない。必要なら、令状に*条件*を付けること（218条9項）。', '延長の請求が、*取調べのため*の身柄拘束になっていないか。連日の長時間の取調べ、自白を求めることだけが延長の理由になっていないかを確かめること。'] }
  ];
  G.hanjiGen.CURRICULUM = CURRICULUM;
  // その段階までに出てきた問題点の一覧
  G.hanjiGen.allowed = step => { const a = {}; for (let i = 1; i <= Math.min(step, 9); i++) Object.entries(CURRICULUM[i].add).forEach(([k, v]) => { a[k] = (a[k] || []).concat(v); }); return a; };
  G.hanjiGen.lawsUpTo = step => { const l = []; for (let i = 1; i <= Math.min(step, 9); i++) l.push(...CURRICULUM[i].laws); return l; };
  const CRIMES_FOR = {
    arrest: ['manbiki', 'jitensha', 'okibiki', 'shajo', 'shogai', 'boko', 'ukeko', 'shinnyu', 'kibutsu'],
    search: ['ukeko', 'kakusei', 'shajo', 'okibiki'],
    koryu: ['okibiki', 'shajo', 'shogai', 'ukeko', 'shinnyu', 'kibutsu', 'manbiki'],
    encho: ['shogai', 'ukeko', 'shajo', 'okibiki'],
    body: ['shogai', 'kakusei']
  };

  // ---- 計画 ----
  G.hanjiGen.plan = function (seed, used, steps) {   // steps：[第一夜の段階, 第二夜, 第三夜]。null なら全部
    const R = rng(seed), pick = a => a[Math.floor(R() * a.length)], ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    used = used || {};
    const names = new Set();
    const person = (female) => {
      let n, tries = 0; do { const s = pick(SUR), g = pick(female ? WOM : MEN); n = { name: s[0] + ' ' + g[0], kana: s[1] + ' ' + g[1] }; } while ((names.has(n.name) || used['n:' + n.name]) && ++tries < 400); names.add(n.name); used['n:' + n.name] = 1;   // 前の夜までに出た名前は使わない
      return Object.assign(n, { age: ri(19, 68), job: pick(JOB), town: pick(TOWN), cho: ri(1, 7), ban: ri(1, 24), go: ri(1, 18) });
    };
    // まだ出ていない組み合わせを優先して選ぶ
    const choose = (kind, night) => {
      const all = [], fl = steps ? (G.hanjiGen.allowed(steps[night - 1])[kind] || ['none']) : FLAWS[kind];
      CRIMES_FOR[kind].forEach(c => [...new Set(fl)].forEach(f => { if (f === 'noNeed' && !CRIME[c].light) return; all.push(c + ':' + f); }));
      const fresh = all.filter(k => !used[kind + ':' + k]);   // 名前の記録（n:）とは別に数える
      // 問題のない請求も、それなりに混ぜる
      if (R() < (steps ? .38 : .25)) { const ok = all.filter(x => x.endsWith(':none')); if (ok.length) { const k = pick(ok); const [crime] = k.split(':'); return { crime, flaw: 'none' }; } }
      const k = pick(fresh.length ? fresh : all); used[kind + ':' + k] = 1;
      const [crime, flaw] = k.split(':'); return { crime, flaw };
    };
    const specs = []; let no = 0;
    const add = (night, kind, extra) => { const cf = extra && extra.crime ? { crime: extra.crime, flaw: extra.flaw || 'none' } : choose(kind, night); const p = (extra && extra.p) || person(cf.flaw === 'needCond' ? true : kind === 'body' ? false : R() < .18 && cf.crime !== 'shogai');
      specs.push(Object.assign({ id: 'g' + (++no), night, kind, crime: cf.crime, flaw: cf.flaw, p, at: 0, v: { amount: ri(3, 60) * 1000, item: pick(ITEM), shop: pick(SHOP), victim: person(R() < .5), hour: ri(8, 22), min: pick([0, 10, 15, 20, 30, 40, 45, 50]), back: ri(2, 9), inj: ri(1, 4), town2: pick(TOWN), cho2: ri(1, 7) } }, extra || {})); };
    // 連なる事件：一人の被疑者の逮捕状 → 勾留 → 延長
    // 夜ごとの請求の数（段階があればそれに従う）
    const kindsOf = n => steps ? CURRICULUM[Math.min(steps[n - 1], 9)].kinds : { 1: { arrest: 4, search: 2 }, 2: { koryu: 3, arrest: 2, search: 1 }, 3: { koryu: 2, encho: 1, arrest: 2, search: 1, body: 1 } }[n];
    const has = (n, k) => (kindsOf(n)[k] || 0) > 0;
    // 連なる事件：一人の被疑者の逮捕状 → 勾留 → 延長（その夜に出てくる種類だけ）
    const chainCrime = pick(['shogai', 'ukeko', 'okibiki', 'shajo']), cp = person(false), took = { 1: {}, 2: {}, 3: {} };
    const okFlaw = (n, k, wish) => { const al = steps ? (G.hanjiGen.allowed(steps[n - 1])[k] || ['none']) : FLAWS[k]; const w = wish.filter(f => al.includes(f)); return w.length ? pick(w) : 'none'; };
    if (has(1, 'arrest')) { add(1, 'arrest', { crime: chainCrime, flaw: okFlaw(1, 'arrest', ['none', 'none', 'date']), p: cp, chain: 'c1' }); took[1].arrest = 1;
      if (has(2, 'koryu')) { add(2, 'koryu', { crime: chainCrime, flaw: okFlaw(2, 'koryu', ['none', 'none', 'noGrounds']), p: cp, chain: 'c2', when: 'c1' }); took[2].koryu = 1;
        if (has(3, 'encho')) { add(3, 'encho', { crime: chainCrime, flaw: okFlaw(3, 'encho', ['none', 'otherCase', 'abstract']), p: cp, chain: 'c3', when: 'c2' }); took[3].encho = 1; } } }
    // 各夜の残り
    [1, 2, 3].forEach(n => Object.entries(kindsOf(n)).forEach(([k, cnt]) => { for (let i = 0; i < cnt - (took[n][k] || 0); i++) add(n, k); }));
    // 連なる事件は、同じ事件の話（日時・被害者などをそろえる）
    const c1 = specs.find(x => x.chain === 'c1'); if (c1) specs.filter(x => x.chain && x.chain !== 'c1').forEach(x => { x.v = c1.v; });
    // 受付の時刻（夜の始まりからの分）
    [1, 2, 3].forEach(n => { const list = specs.filter(s => s.night === n); list.sort(() => R() - .5).forEach((s, i) => { s.at = 15 + i * ri(26, 40); }); });
    return { seed, specs, used };
  };

  // ---- 計画から、請求の定義を作る ----
  G.hanjiGen.defs = function (plan, L) {
    const { D, REQ, kv, P, note, replaceDoc, NIGHTS, qa } = L;
    const R = rng(plan.seed ^ 0x5bd1e995), pick = a => a[Math.floor(R() * a.length)];
    const md = (base, back) => { const m = base.match(/(\d+)月(\d+)日/); const d = new Date(2026, +m[1] - 1, +m[2] - back); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; };
    const tm = (h, mi) => (h < 12 ? '午前' : '午後') + ((h % 12) || 12) + '時' + (mi ? mi + '分' : '') + 'ころ';
    const addr = p => '北見坂市' + p.town + KANJI[p.cho - 1] + '丁目' + p.ban + '番' + p.go + '号';
    const susLine = p => p.name + '（' + p.kana + '）　' + p.age + '歳　' + p.job;
    const vname = v => v.name.replace(' ', ' ') + '（' + v.kana + '）';

    return plan.specs.map(s => {
      const p = s.p, v = s.v, nd = NIGHTS[s.night].date, cr = CRIME[s.crime];
      const c1 = plan.specs.find(x => x.chain === 'c1');
      const day = s.chain && c1 ? md(NIGHTS[1].date, c1.v.back) : md(nd, s.kind === 'arrest' || s.kind === 'search' ? v.back : s.kind === 'koryu' ? 3 : 14);
      const wrongDay = md(nd, v.back + (v.back > 5 ? -3 : 3));
      const vic = v.victim;
      const place2 = '北見坂市' + v.town2 + KANJI[v.cho2 - 1] + '丁目';
      // 被疑事実
      const fact = (d) => {
        const head = '被疑者は、' + d + tm(v.hour, v.min) + '、' + place2;
        switch (s.crime) {
          case 'manbiki': return head + '所在の' + v.shop + 'において、同店店長' + vname(vic) + '管理の' + v.item[0] + '（販売価格合計' + v.item[1].toLocaleString() + '円）を窃取したものである。';
          case 'jitensha': return head + '所在の北見坂駅' + pick(['東口', '西口', '南口']) + '自転車駐輪場において、' + vname(vic) + '所有の自転車1台（時価' + (v.amount / 2 | 0).toLocaleString() + '円相当）を窃取したものである。';
          case 'okibiki': return head + '所在の飲食店「' + pick(['とり政', 'さくら食堂', '喫茶ミモザ', '居酒屋はなび']) + '」店内において、' + vname(vic) + 'が座席に置いていた現金' + v.amount.toLocaleString() + '円在中の財布1個を窃取したものである。';
          case 'shajo': return head + '所在のコインパーキングにおいて、駐車中の普通乗用自動車内から、' + vname(vic) + '所有の手提げバッグ1個（現金' + v.amount.toLocaleString() + '円ほか在中）を窃取したものである。';
          case 'shogai': return head + 'の路上において、' + vname(vic) + 'に対し、その顔面を手拳で数回殴打する暴行を加え、よって、同人に加療約' + v.inj + '週間を要する顔面打撲等の傷害を負わせたものである。';
          case 'boko': return head + 'の路上において、' + vname(vic) + 'に対し、その胸部を両手で突き飛ばす暴行を加えたものである。';
          case 'ukeko': return '被疑者は、氏名不詳者らと共謀の上、' + d + tm(v.hour, v.min) + '、' + place2 + 'の' + vname(vic) + '方において、同人に対し、同人の親族を装った者からの電話で「会社の金を使い込んだ。今日中に返さないといけない」などと嘘を言い、その旨誤信させ、同人から現金' + (v.amount * 10).toLocaleString() + '円の交付を受けたものである。';
          case 'shinnyu': return head + 'の' + vname(vic) + '方に、無施錠の勝手口から、正当な理由がないのに侵入したものである。';
          case 'kibutsu': return head + 'の' + vname(vic) + '方前路上において、同人所有の普通乗用自動車のサイドミラー1個を足で蹴って破損し（損害額' + (v.amount / 2 | 0).toLocaleString() + '円）、もって他人の物を損壊したものである。';
          case 'kakusei': return '被疑者は、法定の除外事由がないのに、' + d + 'ころ、' + addr(p) + 'の被疑者方において、覚醒剤若干量を所持したものである。';
        }
      };
      const charge = cr.charge, sus = [p.name, p.kana, p.age + '歳'];
      const def = { id: s.id, night: s.night, at: s.at, kind: s.kind, from: s.kind === 'koryu' || s.kind === 'encho' ? 'pro' : 'pol', sus, charge, bad: null };
      if (s.when) def.when = S => S.eff[plan.specs.find(x => x.chain === s.when).id] === 'grant';
      const docs = [];
      const victimDoc = (d) => D('higai', '被害届（' + vic.name.replace(' ', '') + '）', 5, kv([['被害者', vic.name + '　' + vic.age + '歳'], ['日時', d + tm(v.hour, v.min)], ['場所', place2],
        ['被害', { manbiki: v.item[0], jitensha: '自転車1台', okibiki: '財布1個（現金' + v.amount.toLocaleString() + '円在中）', shajo: '手提げバッグ1個（現金' + v.amount.toLocaleString() + '円ほか）', shogai: '顔面打撲等（加療約' + v.inj + '週間の診断書あり）', boko: '突き飛ばされた（けがなし）', ukeko: '現金' + (v.amount * 10).toLocaleString() + '円', shinnyu: '自宅に侵入された（物の被害なし）', kibutsu: 'サイドミラーの破損', kakusei: '—' }[s.crime]]]));
      const evidence = () => {
        if (s.crime === 'manbiki') return D('ev', '捜査報告書（防犯カメラ）', 10, P('同店の防犯カメラに、商品を上着の内側に入れて精算せずに店外へ出る男が映っている。', '同店の会員カードの記録から、映像の男は被疑者と認められる（顔貌・着衣・会員カードの利用時刻）。'));
        if (s.crime === 'jitensha') return D('ev', '捜査報告書（職務質問の状況）', 10, P('被害自転車に乗っていた被疑者に職務質問した。防犯登録の照会で被害品と判明した。', '被疑者は「駐輪場に放置されていたので乗っていった」と述べた。'));
        if (s.crime === 'okibiki') return D('ev', '捜査報告書（店内カメラ）', 10, P('店内カメラに、被害者が席を離れた間に、隣の席の男が財布を取り上げて上着に入れる様子が映っている。', '店の予約記録と、被疑者のカードの利用記録により、男は被疑者と認められる。'));
        if (s.crime === 'shajo') return D('ev', '捜査報告書（駐車場カメラ）', 10, P('駐車場のカメラに、被害車両の窓から車内に手を入れ、バッグを持ち去る男が映っている。', '付近のカメラをつなぎ、男が被疑者方に入るまでを確認した。'));
        if (s.crime === 'shogai' || s.crime === 'boko') return D('ev', '目撃者の供述調書', 10, P('口論の末、' + (s.crime === 'shogai' ? '一方の男が相手の顔を何度も殴った' : '一方の男が相手を突き飛ばした') + 'のを見ました。殴った（突き飛ばした）方の男は、近くの店でよく見かける人です。', '写真を見せられ、この人だと思います、と答えました。'));
        if (s.crime === 'ukeko') return D('ev', '捜査報告書（防犯カメラのリレー捜査）', 15, P('被害者方付近から駅までのカメラ映像をつなぎ、現金を受け取ったスーツ姿の男の足取りを追った。', '男は、' + addr(p) + 'に出入りする被疑者と同一人物と認められる。'));
        if (s.crime === 'shinnyu') return D('ev', '捜査報告書（足跡・遺留物）', 10, P('勝手口付近の足跡は、被疑者が任意提出した運動靴と靴底の模様が一致する。', '近所の住人が、当夜、被疑者が被害者方の裏手にいるのを見ている。'));
        if (s.crime === 'kibutsu') return D('ev', '捜査報告書（ドライブレコーダー）', 10, P('被害車両のドライブレコーダーに、サイドミラーを蹴る男が映っている。', '男は近所に住む被疑者と認められる。被疑者は、事情聴取に対し「腹が立ってやった。弁償する」と述べている。'));
        return D('ev', '捜査報告書（行動確認）', 15, P('被疑者方に短時間の来訪者が繰り返し出入りしている。', '被疑者には覚醒剤の前科がある。'));
      };
      const kyo = D('jukyo', '捜査報告書（居住・生活状況）', 5, P(s.flaw === 'noNeed' || s.flaw === 'noGrounds'
        ? '被疑者は、' + addr(p) + 'に家族と' + (10 + (p.ban % 20)) + '年以上居住している。' + (p.job === '無職' ? '年金で生活している。' : p.job + 'として勤務している。') + '事件後、警察の呼出しに応じて二度出頭している。'
        : '被疑者は、' + addr(p) + 'に単身で居住している。' + (p.ban % 3 === 0 ? '最近は帰宅しないことが多い、と近所の者は話している。' : '')));
      const rowsBase = (d, who) => [['被疑者', who || susLine(p)], ['住居', addr(p)], ['罪名', charge], ['被疑事実の要旨', fact(d)]];

      if (s.kind === 'arrest') {
        const shownDay = s.flaw === 'date' ? wrongDay : day;
        const wrongSus = s.flaw === 'identity' ? Object.assign({}, p, { age: p.age > 40 ? p.age - 21 : p.age + 23, job: '無職' }) : null;
        docs.push(D('req', '逮捕状請求書', 10, REQ('逮捕状請求書', rowsBase(shownDay, wrongSus ? susLine(wrongSus) : null).concat([
          ['逮捕の理由', s.flaw === 'thin' ? '匿名の通報により、被疑者が上記の罪を犯したことを疑うに足りる相当な理由がある。' : '被害届、捜査報告書等により、被疑者が上記の罪を犯したことを疑うに足りる相当な理由がある。'],
          ['逮捕の必要', s.flaw === 'noNeed' ? '被疑者は罪証を隠滅するおそれがある。' : '被疑者は、罪証を隠滅し、又は逃亡するおそれがある。'], ['引致すべき場所', '北見坂警察署'], ['前の請求', 'なし']])), 'req'));
        docs.push(s.flaw === 'wrongDoc' ? D('higai', '被害届（' + v.victim.name.split(' ')[0] + '）', 5, kv([['被害者', person2(R).name + '　' + (30 + (v.amount / 1000 | 0)) + '歳'], ['日時', md(nd, v.back + 11) + '午後2時ころ'], ['場所', '北見坂市' + pick(TOWN) + '一丁目'], ['被害', '現金' + (v.amount * 2).toLocaleString() + '円在中の封筒']])) : victimDoc(day));
        if (s.flaw !== 'thin') docs.push(evidence());
        else docs.push(D('ev', '捜査報告書（通報の状況）', 5, P('事件の翌日、匿名の男性から「やったのは' + p.name.split(' ')[0] + 'だ。あいつはそういう奴だ」との電話があった。', '通報者は名乗らず、それ以上の話はなかった。被疑者と事件を結びつける資料は、ほかに得られていない。')));
        if (s.flaw === 'identity') docs.push(D('jumin', '住民票照会回答書', 5, kv([['氏名', p.name], ['生年月日・年齢', wrongSus.age + '歳'], ['住所', addr(p)]]) + note('照会は氏名と町名で行った。')));
        docs.push(kyo);
        def.bad = s.flaw === 'noNeed' || s.flaw === 'thin' ? 'deny' : s.flaw === 'none' ? null : 'fix';
        if (def.bad === 'fix') def.call = () => ({ who: 'hj_keibu', cost: 40, lines: [['hj_keibu', '北見坂署です。……' + ({ date: '被疑事実の日付ですね。', identity: '被疑者の年齢と、住民票ですか。', wrongDoc: '被害届が、別の事件のもの……ですか。' })[s.flaw]], ['hj_keibu', '確認します。少しお待ちください。'], ['', '（しばらくして、訂正した書類がファクスで届いた。）', { sfx: 'type' }]],
          apply: Rr => { replaceDoc(Rr, 'req', D('req2', '逮捕状請求書（訂正）', 5, REQ('逮捕状請求書', rowsBase(day).concat([['逮捕の必要', '被疑者は、罪証を隠滅し、又は逃亡するおそれがある。'], ['引致すべき場所', '北見坂警察署']])), 'req'));
            if (s.flaw === 'wrongDoc') replaceDoc(Rr, 'higai', victimDoc(day)); if (s.flaw === 'identity') replaceDoc(Rr, 'jumin', D('jumin', '住民票照会回答書（再照会）', 5, kv([['氏名', p.name], ['年齢', p.age + '歳'], ['住所', addr(p)]]) + note('生年月日で再照会した。')));
            Rr.fixed = true; } });
        else def.call = () => ({ who: 'hj_keibu', cost: 35, lines: [['hj_keibu', '北見坂署です。……' + (s.flaw === 'thin' ? '資料ですか。通報の裏付けは、まだ取れていません。' : s.flaw === 'noNeed' ? '逮捕の必要、ですか。……本人は認めていますが、念のためです。' : '請求書のとおりです。')], ['hj_keibu', 'それ以上の資料は、いまはありません。']] });
        def.after = (S, Rr) => Rr.eff === 'grant'
          ? (def.bad === 'deny' ? [p.name.replace(' ', '') + 'は逮捕された。' + (s.flaw === 'noNeed' ? '翌日、勾留の請求はされずに釈放されたと聞いた。家族が迎えに来ていたという。' : '取調べで、事件の日は別の場所にいたと述べている、と聞いた。'), p.name.replace(' ', '') + 'は逮捕された。勤め先には、何と説明したのだろう。']
            : def.bad === 'fix' && !Rr.fixed ? [p.name.replace(' ', '') + 'は逮捕された。後日、弁護人が、逮捕状の記載の誤りを指摘したらしい。'] : [p.name.replace(' ', '') + 'は逮捕された。' + pick(['認めている、と聞いた。', '否認している、と聞いた。', '黙秘しているという。'])])
          : [p.name.replace(' ', '') + 'の逮捕状は出なかった。' + pick(['捜査は在宅で続けられている、と聞いた。', '翌週、書き直された請求が、別の裁判官のもとに出されたらしい。', 'それきり、その名前を聞くことはなかった。'])];
      }

      if (s.kind === 'search') {
        const goodItems = { ukeko: '携帯電話機、キャッシュカード、預金通帳、手帳・メモ類、名簿類、現金、スーツ', kakusei: '覚醒剤、注射器、計量器、チャック付きビニール袋、携帯電話機、手帳・メモ類', shajo: '手提げバッグ、財布、現金、カード類、工具類', okibiki: '財布、現金、カード類、上着' }[s.crime] + '、その他本件に関係ありと思料される文書及び物件';
        const goodPlace = addr(p) + '（被疑者方）';
        def.items = s.flaw === 'vague' ? '本件に関係ありと思料される一切の物件' : goodItems;
        def.place = s.flaw === 'place' ? '北見坂市' + p.town + '所在の、被疑者が出入りする建物' : goodPlace;
        docs.push(D('req', '捜索差押許可状請求書', 10, REQ('捜索差押許可状請求書', [['被疑者', susLine(p)], ['罪名', charge], ['捜索すべき場所', def.place], ['差し押さえるべき物', def.items], ['被疑事実の要旨', fact(day)]]), 'req'));
        if (s.crime !== 'kakusei') docs.push(victimDoc(day));
        docs.push(evidence());
        docs.push(D('jukyo', '捜査報告書（場所と被疑者の結びつき）', 5, s.flaw === 'noLink'
          ? P('請求に係る場所の賃借人は、被疑者の知人である。', '被疑者がこの場所に出入りし、又は物を置いていることを示す資料は、得られていない。')
          : P('請求に係る場所の賃借人は被疑者本人であり、単身で居住している（管理会社への照会による）。')));
        def.bad = s.flaw === 'noLink' ? 'deny' : s.flaw === 'none' ? null : 'fix';
        if (def.bad === 'fix') def.call = () => ({ who: 'hj_keibu', cost: 40, lines: [['hj_keibu', '北見坂署です。……' + (s.flaw === 'vague' ? '差し押さえるべき物ですね。書き直します。' : '捜索すべき場所ですか。……号室まで特定します。')], ['', '（四十分後、訂正された請求書が届いた。）', { sfx: 'type' }]],
          apply: Rr => { Rr.items = goodItems; Rr.place = goodPlace; replaceDoc(Rr, 'req', D('req2', '捜索差押許可状請求書（訂正）', 5, REQ('捜索差押許可状請求書', [['被疑者', susLine(p)], ['罪名', charge], ['捜索すべき場所', goodPlace], ['差し押さえるべき物', goodItems + '<br><small>（訂正印あり）</small>']]), 'req')); Rr.fixed = true; } });
        else def.call = () => ({ who: 'hj_keibu', cost: 35, lines: [['hj_keibu', '北見坂署です。……' + (s.flaw === 'noLink' ? '知人宅に物を隠している、というのは、捜査員の見立てです。裏付けは、まだ。' : '請求書のとおりです。')]] });
        def.after = (S, Rr) => Rr.eff === 'grant'
          ? (def.bad === 'deny' ? ['知人の部屋の捜索では、何も出なかったと聞いた。部屋の主は、弁護士に相談しているという。'] : def.bad === 'fix' && !Rr.fixed ? ['捜索で押収された物は段ボール箱で十箱を超えた。弁護人が準抗告を申し立てたらしい。'] : [pick(['捜索で、' + ({ ukeko: '別の被害者の名前を並べたメモ', kakusei: '小分けの袋と計量器', shajo: '被害品のカード', okibiki: '被害品の財布' })[s.crime] + 'が見つかったと聞いた。', '捜索では、目ぼしい物は見つからなかったという。'])])
          : ['その夜の捜索は行われなかった。' + pick(['翌週、請求は書き直されて出されたらしい。', '部屋は、ほどなく引き払われたという。'])];
      }

      if (s.kind === 'koryu') {
        const arrested = md(nd, s.flaw === 'timeLimit' ? 4 : 2);
        const rows = [['被疑者', susLine(p)], ['住居', addr(p)], ['罪名', charge], ['被疑事実の要旨', fact(day)], ['刑訴法60条1項各号', s.flaw === 'noGrounds' ? '第1号、第2号' : '第2号、第3号'],
          ['逮捕', arrested + '午後' + (s.flaw === 'timeLimit' ? '1時10分' : '5時40分') + '（通常逮捕）'], ['送致', md(nd, s.flaw === 'timeLimit' ? 2 : 1) + '午前10時'], ['受付', nd + '午後9時' + (s.flaw === 'timeLimit' ? '50分' : '')]];
        if (s.flaw === 'timeLimit') rows.push(['添付', '遅延理由書（刑訴法206条1項）']);
        def.koryuTo = md(nd, -10);
        docs.push(D('req', '勾留請求書', 10, REQ('勾留請求書', rows), 'req'));
        docs.push(evidence());
        docs.push(kyo);
        if (s.flaw === 'timeLimit') docs.push(D('chien', '遅延理由書', 10, P('司法警察員において、被疑者の取調べ及び関係者の所在確認に時間を要したため、送致が遅れた。')));
        if (s.flaw === 'illegalArrest') docs.push(D('taiho', '緊急逮捕手続書', 10, P('被疑者は、' + md(nd, 2) + '午前5時10分ころ、' + addr(p) + 'の被疑者方において緊急逮捕した。',
          '逮捕に際し、被疑者が応答しなかったため、管理人に依頼して玄関の鍵を開けさせ、室内に立ち入った。', '逮捕状の請求は、同日午後4時30分に行った（逮捕から約11時間後）。') + note('刑訴法210条1項：緊急逮捕をしたときは「直ちに」逮捕状を求める手続をしなければならない。'))) ;
        if (s.flaw === 'noGrounds') docs.push(D('hosoku', '捜査報告書（住居について）', 5, P('被疑者は、事件の数日前から知人宅に泊まることがあり、住居が定まっていないと認められる。', '（住民登録地には妻子が居住しており、被疑者も週の大半はそこで寝泊まりしている。）')));
        docs.push(D('benkai', '弁解録取書', 5, P(pick(['やりました。申し訳ありません。', 'やっていません。', '覚えていません。酒を飲んでいたので。']))));
        def.iv = [pick(['家族に連絡させてください。', '仕事があるんです。', '言うことは、警察で言ったとおりです。']), pick(['逃げたりしません。', '……はい。', '弁護士を呼べますか。'])];
        def.bad = s.flaw === 'none' ? null : 'deny';
        def.call = () => ({ who: 'hj_kenji', cost: 30, lines: [['hj_kenji', '検察庁です。……' + (s.flaw === 'timeLimit' ? '時間の件ですね。遅延理由書のとおりです。' : s.flaw === 'noGrounds' ? '住居の件ですか。……報告書以上の資料はありません。' : s.flaw === 'illegalArrest' ? '逮捕の手続ですか。……警察からは、早朝で裁判所に連絡がつかなかった、と聞いています。' : '請求書のとおりです。')], ['hj_kenji', '判断はお任せします。']] });
        def.after = (S, Rr) => Rr.eff === 'grant'
          ? (def.bad ? [p.name.replace(' ', '') + 'の勾留について、弁護人が準抗告を申し立てた。' + pick(['勾留は取り消され、釈放されたと聞いた。', '申立ては退けられたと聞いた。'])] : [p.name.replace(' ', '') + 'は勾留された。' + pick(['満期の前に起訴されたと聞いた。', '処分保留のまま釈放されたと聞いた。'])])
          : [p.name.replace(' ', '') + 'は釈放された。' + pick(['在宅のまま捜査が続けられているという。', '翌月、被害者に弁償したと聞いた。', 'その後のことは、分からない。'])];
      }

      if (s.kind === 'encho') {
        def.base = md(nd, -1); def.ask = 10;
        const why = s.flaw === 'interroOnly' ? '1　被疑者は否認を続けており、真相を解明するため、さらに取調べを要する。<br>2　被疑者の供述の変遷について、追及を要する。' : s.flaw === 'otherCase' ? '1　被疑者には、同種の余罪（' + md(nd, 40) + 'ころの別件）があり、その取調べを要する。<br>2　被疑者は否認している。'
          : s.flaw === 'abstract' ? '1　捜査未了。<br>2　関係者の取調べ未了。'
          : '1　' + pick(['被害品の鑑定結果が未着である（' + md(nd, 4) + '嘱託、結果は' + md(nd, -6) + 'ころの見込み）。', '共犯者と思われる人物の所在を捜査中である（所在の手がかりを得ている）。']) + '<br>2　被害者の再聴取を要する（被害者は入院中で、' + md(nd, -3) + 'に聴取の予定）。';
        docs.push(D('req', '勾留期間延長請求書', 10, REQ('勾留期間延長請求書', [['被疑者', susLine(p)], ['罪名', charge], ['勾留の期間', md(nd, 9) + 'から' + md(nd, 0) + 'まで'], ['延長を求める期間', '10日'], ['刑訴法60条1項各号', '第2号、第3号'], ['やむを得ない事由', why]]), 'req'));
        docs.push(D('jokyo', '捜査状況報告書', 15, s.flaw === 'interroOnly' ? P('物的証拠・関係者の供述調書の収集は終えている。', '被疑者の取調べ時間：1日あたり約13時間（午前9時から午後10時ころまで）。連日。被疑者は「何度聞かれても同じです」と述べている。') + note('延長を求める理由は、取調べのみである。')
          : s.flaw === 'otherCase' ? P('本件（' + charge + '）については、被害者・目撃者の供述調書、物的証拠の収集をおおむね終えた。', 'この10日間の取調べの大半は、余罪についてのものである。')
          : s.flaw === 'abstract' ? P('本件の捜査を継続中である。') : P('本件の捜査の状況は、請求書記載のとおり。', '被疑者の取調べは、1日あたり約3時間。')));
        def.bad = s.flaw === 'none' ? null : 'deny';
        def.call = () => ({ who: 'hj_kenji', cost: 30, lines: [['hj_kenji', '検察庁です。……' + (s.flaw === 'abstract' ? '具体的に、ですか。……いま、お答えできる資料はありません。' : s.flaw === 'interroOnly' ? '否認していますから。話を聞く時間が、もう少し要ります。' : s.flaw === 'otherCase' ? '余罪の件も、本件と同じ手口ですから。' : '請求書のとおりです。')]] });
        def.after = (S, Rr) => Rr.eff === 'grant'
          ? [p.name.replace(' ', '') + 'の勾留は延長された。' + (s.flaw === 'otherCase' ? '延長の間に、余罪を認めたと聞いた。' : pick(['満期に起訴されたと聞いた。', '満期に、処分保留のまま釈放されたという。']))]
          : [p.name.replace(' ', '') + 'は、延長されずに釈放された。' + pick(['のちに在宅のまま起訴されたと聞いた。', 'のちに不起訴になった、と聞いた。'])];
      }

      if (s.kind === 'body') {
        const fem = s.flaw === 'needCond';
        def.place = '被疑者の身体（上半身）';
        docs.push(D('req', '身体検査令状請求書', 10, REQ('身体検査令状請求書', [['被疑者', susLine(p) + '（' + md(nd, 1) + '逮捕、北見坂警察署に留置中）'], ['罪名', charge], ['被疑事実の要旨', fact(day)],
          ['検査すべき身体', '被疑者の身体（上半身）'], ['身体の検査を必要とする理由', s.crime === 'kakusei' ? '被疑者の両腕に注射痕があるかを確認し、写真撮影する必要がある。' : '被害者は、犯人ともみ合った際に犯人の胸を引っかいたと述べており、被疑者の胸部の傷の有無を確認し、写真撮影する必要がある。'],
          ['性別', fem ? '女' : '男'], ['健康状態', '良好（留置担当官による）']]), 'req'));
        docs.push(evidence());
        def.bad = fem ? 'cond' : null;
        def.call = () => ({ who: 'hj_keibu', cost: 30, lines: [['hj_keibu', '北見坂署です。……検査の方法ですか。' + (fem ? '当署には、当直の女性警察官がいます。医師の手配もできます。' : '男性の捜査員が、留置施設の一室で行います。')]] });
        def.after = (S, Rr) => Rr.eff === 'grant'
          ? (fem && Rr.how !== 'cond' ? ['身体検査は行われた。後日、弁護人から、検査のやり方について抗議があったと聞いた。'] : ['身体検査は行われ、写真が撮られた。' + pick(['傷は、確かにあったという。', '傷は見つからなかったという。'])])
          : ['身体検査令状は出なかった。' + pick(['警察は、本人の承諾を得ようとしたらしい。', 'それきりになった。'])];
      }
      def.docs = docs;
      return def;
    });
    function person2(r) { const s = SUR[Math.floor(r() * SUR.length)], g = MEN[Math.floor(r() * MEN.length)]; return { name: s[0] + ' ' + g[0] }; }
  };
})();
