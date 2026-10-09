'use strict';
/* ============================================================
   手引き：いまの目的、進み方の道のり、画面を指し示す説明、行動の説明、用語集
   ・目的と「次にできること」は、いつも机の上に出しておく
   ・はじめての画面や機能は、その場所を指し示して説明する（一度だけ。用語集からいつでも読み返せる）
   ============================================================ */
(function () {
  const U = G.guide = {};
  const tips = () => (G.meta.tips = G.meta.tips || {});

  /* ---------- 用語集 ---------- */
  U.GLOSSARY = [
    ['逮捕', '犯罪の疑いのある人（被疑者）の身柄を、強制的に押さえること。原則として、裁判官が出す「逮捕状」が要る（憲法33条）。犯行中・直後の「現行犯」なら令状なしで誰でも逮捕できる。逮捕すると、そこから最長23日の時計が動く。'],
    ['逮捕状', '裁判官が「この人を逮捕してよい」と許可する書面。請求には、①罪を犯したと疑うに足りる相当な理由（証拠）、②逮捕の必要（逃げる・証拠を隠すおそれ）が要る。このゲームでは、課長に疎明資料（裏付けの記録）を見せて請求し、翌日に出る。'],
    ['被疑者', '犯罪の疑いをかけられ、捜査の対象になっている人。起訴されると「被告人」と呼ばれる。まだ犯人と決まったわけではない。'],
    ['任意の取調べ', '逮捕する前に、署に来てもらって話を聴くこと。相手は断れるし、いつでも帰れる（刑訴法198条1項ただし書）。録画の義務はない。長時間・強圧的になると違法になりうる。'],
    ['取調べ', '被疑者から話を聴くこと。始める前に、言いたくないことは言わなくてよい（黙秘権）と告げなければならない。逮捕・勾留中は、取調室に来ることを拒めないとされている。脅し・約束・偽り・長時間の取調べで得た自白は、裁判で証拠にできないことがある。'],
    ['黙秘権', '言いたくないことは言わなくてよい権利（憲法38条1項、刑訴法198条2項）。取調べの前に必ず告げる。'],
    ['自白', '被疑者が罪を認める供述。強い証拠だが、無理に引き出した自白は嘘のことがあり、証拠にできない（刑訴法319条1項）。自白だけでは有罪にできず、裏付け（補強証拠）が要る。'],
    ['秘密の暴露', '犯人でなければ知りえない事実（捜査側もまだ知らなかったこと）が自白に含まれ、それが後で裏付けられること。自白が本当であることを強く示す。'],
    ['送致', '警察が事件の記録や被疑者を検察官に送ること。逮捕したら48時間以内に送る。このゲームでは、満期の日（または捜査を終えると決めたとき）に、集めた記録をまとめて送る。'],
    ['勾留', '逮捕に続いて、裁判官の許可（勾留状）で被疑者の身柄を拘束し続けること。10日間。やむを得ない事由があれば、さらに最大10日延長できる。'],
    ['満期', '勾留の期間が終わる日。逮捕から最長23日目。満期までに検察官は、起訴するか、釈放するかを決めなければならない。証拠が足りなければ、犯人であっても釈放される。'],
    ['起訴', '検察官が、裁判所に裁判を求めること。証拠が足りないと判断すれば「不起訴」。日本では起訴された事件の大半が有罪になるため、検察官は確実な証拠をそろえてから起訴する。'],
    ['不起訴', '検察官が起訴しないと決めること。嫌疑不十分（証拠が足りない）などの理由がある。身柄は釈放される。'],
    ['捜索差押許可状', '裁判官が「この場所を捜し（捜索）、この物を持ち帰ってよい（差押え）」と許可する書面。家や部屋に、本人の承諾なく入って証拠を探すには、原則としてこれが要る（憲法35条、刑訴法218条）。令状なしで押収した証拠は、裁判で使えなくなることがある。'],
    ['令状', '裁判官が強制的な捜査（逮捕・捜索・差押えなど）を許可する書面の総称。捜査機関が勝手に人の自由や住まいを侵さないための仕組み（令状主義）。'],
    ['現行犯', '今まさに罪を犯している、または犯し終わったばかりの人。令状なしで誰でも逮捕できる（刑訴法212条・213条）。'],
    ['在宅', '逮捕せず、被疑者が自宅で普通に暮らしたまま捜査を進めること。逃げたり証拠を隠したりするおそれがなければ、身柄を拘束する必要はない。'],
    ['地取り', '現場の周辺を一軒ずつ回り、事件の時間に何か見聞きしなかったかを聴いて回る捜査。目撃者が見つかることがある。'],
    ['鑑取り', '被害者の人間関係（家族・知人・元従業員・取引先など）を洗い、恨みや金銭関係、内部の事情を知る者を探す捜査。'],
    ['手口照会', '犯行のやり方（手口）が似た前歴者を、警察のデータベースで探すこと。'],
    ['面割り', '目撃者や被害者に写真を見せて、犯人かどうかを確かめること。1枚だけ見せると「この人だ」と思い込みやすいので、複数枚の中から選んでもらうのが原則。'],
    ['疎明資料', '逮捕状などを請求するとき、要件を満たすことを示すために添える記録（供述調書、捜査報告書、鑑定書など）。'],
    ['弁護人の接見', '身柄を拘束された被疑者が、弁護人と立会人なしで会うこと。被疑者の大切な権利（刑訴法39条1項）。捜査のため日時を指定できるのは、取調べ中など支障が大きい場合に限られる。'],
    ['違法収集証拠', '違法な捜査で集めた証拠。違法が重大なら、裁判で証拠として使えなくなる（排除される）。'],
    ['立証すべき事実', '罪名ごとに、検察官が裁判で証明しなければならない事柄（犯人であること、行為、結果、故意など）。どれか一つでも証明できなければ、有罪にならない。'],
    ['罪名', '何の罪にあたるか（強盗、窃盗、傷害致死など）。罪名によって、証明すべき事実も、刑の重さも、録画の義務の有無も変わる。'],
    ['録音・録画', '裁判員裁判の対象事件などでは、逮捕・勾留中の取調べをすべて録音・録画しなければならない（刑訴法301条の2）。'],
    ['正当防衛', '急に不正な攻撃を受け、自分や他人を守るためにやむを得ずした行為は、罪にならない（刑法36条1項）。']
  ];
  U.openGlossary = function (focus) {
    const rows = U.GLOSSARY.map(([k, v]) => '<div class="gl' + (k === focus ? ' on' : '') + '" id="gl-' + k + '"><b>' + k + '</b><p>' + v + '</p></div>').join('');
    const p = G.openPaper({ title: '用語集', sub: '捜査と手続のことば', body: rows });
    if (focus) setTimeout(() => { const e = document.getElementById('gl-' + focus); if (e) e.scrollIntoView({ block: 'center' }); }, 60);
    return p;
  };
  U.term = k => U.GLOSSARY.find(x => x[0] === k);

  /* ---------- 行動の説明 ---------- */
  // [ラベルの正規表現, 何をするか, 利点, 注意点]
  const HELP = [
    [/^罪名を決める/, '事件にどの罪があたるかを決める。決めると「立証すべき事実」の欄に、証明すべき項目が出る。', '何を集めればよいかが見える。逮捕状を請求するときと送致するときにも決める。', '後から変えられる。違う罪名で送ると、検察官が改める（評価が下がる）。'],
    [/^地取り/, '部下が現場の周辺を一軒ずつ回り、事件の時間に何か見聞きしなかったかを聴く。', '目撃者が見つかることがある。犯人の姿や、逃げた方向が分かれば、次の捜査につながる。', '目撃の話には、見間違いや思い込みが混じる。他の記録と並べて確かめる。'],
    [/^鑑取り/, '部下が被害者の人間関係（家族・知人・元従業員など）を洗う。', '内部の事情を知る者、恨みや金銭のもつれのある者が浮かぶ。被疑者の候補が出ることが多い。', '関係があるだけでは、犯人とは言えない。'],
    [/^手口照会/, '同じやり方の前歴者を、警察のデータベースで探す。', '見知らぬ犯人でも、候補が浮かぶことがある。', '前歴があるだけでは、犯人とは言えない。'],
    [/防犯カメラ|カメラ/, '部下が周辺の防犯カメラの映像を集め、解析する。', '人の動きが時刻つきで分かる。供述の裏付けや、食い違いの発見に役立つ。', '映像は不鮮明なことが多く、顔までは分からないこともある。'],
    [/指紋/, '採取した指紋を、データベースや特定の人物の指紋と照らし合わせる。', '一致すれば強い証拠になる。', '不鮮明な指紋は「一致」とまで言えないことがある。鑑定書の言い回しをよく読む。'],
    [/鑑定|解析|照会|記録を確かめる|記録を照会|取り寄せる|調べる|受け取る/, '部下が専門の機関や会社に問い合わせ、結果を取り寄せる。', '客観的な記録が手に入る。人の記憶と違って、時間が経っても変わらない。', '結果が出るまで日数がかかる。結果が、どちらの見立てに有利かは読んで判断する。'],
    [/任意で話を聴く|話を聴き、指紋の任意提出/, '逮捕する前に、署に来てもらって話を聴く（任意の取調べ）。', '本人の言い分（弁解）が分かる。弁解と他の記録を並べると、嘘や食い違いが見えることがある。', '相手は断れるし、いつでも帰れる。長時間・強圧的に追及すると違法になる。'],
    [/逮捕状の請求|逮捕状を請求/, '課長に、裁判官へ逮捕状を請求してもらう。罪名を決め、裏付けの記録（疎明資料）を見せる。', '翌日、逮捕状が出れば、被疑者を逮捕できる。逮捕すれば、取調べや捜索がしやすくなる。', '材料が足りなければ課長に突き返される。逮捕すると最長23日の時計が動き、満期までに起訴できる証拠をそろえなければならない。早すぎる逮捕は、時間切れを招く。'],
    [/を逮捕する/, '逮捕状を示して、被疑者を逮捕する。', '身柄を押さえるので、逃げられたり証拠を隠されたりしない。取調べは毎日できる（取調室に来ることを拒めない）。', 'ここから時計が動く。48時間で送致、勾留10日、延長最大10日。満期（23日目）までに証拠をそろえなければ、釈放になる。'],
    [/を取り調べる/, '取調室で被疑者から話を聴く。最初に黙秘権を告げ（日をまたいだら改めて告げる。犯罪捜査規範169条）、それから進め方を選ぶ。', '自白や、新しい事実が得られることがある。毎日できる。', '進め方によっては違法になり、得た自白が裁判で使えなくなる。夜10時以降や1日8時間を超える取調べには承認が要る（規範168条）。どれが許されるかは、条文帳で確かめる。'],
    [/捜索差押許可状|捜索令状|部屋を捜索/, '裁判官の許可（捜索差押許可状）を得て、部屋などを捜し、証拠物を押収する。', '凶器・衣類・盗品など、物の証拠が見つかることがある。', '令状なしで人の住まいに入ることは、原則としてできない（憲法35条）。令状なしで集めた証拠は、裁判で使えなくなることがある。'],
    [/逮捕のとき、その現場を捜索/, '逮捕状を執行するとき、逮捕した場所をそのまま捜索する（刑訴法220条）。', '捜索の令状が要らない。', '逮捕した「その場」に限られる。'],
    [/被害者.*(話|供述|聴く|確かめる|尋ねる|見せる)|写真を見せる|8枚の写真/, '被害者から、事件の様子や犯人の特徴を聴く。', '何が起きたのかの土台になる。', '問いかけ方で、人の記憶は変わる。答えを含んだ問い（「この人ですね？」）は、記憶をゆがめるおそれがある。'],
    [/話を聴く|もう一度話を聴く|聞く$|確かめる$/, '関係者から話を聴く。', '新しい事実や、前の話との食い違いが出ることがある。', '聴いた話は記録に綴じられる。他の記録と並べて確かめる。'],
    [/釈放を進言/, '被疑者を釈放すべきだと課長に進言する。', '犯人でないと考えるなら、拘束を続けるべきではない。', '課長に退けられることもある。本部の評価は下がるかもしれない。'],
    [/在宅のまま送致|在宅で送致/, '逮捕せず、被疑者が自宅にいるまま、記録を検察官に送る。', '逃げたり証拠を隠すおそれがなければ、身柄を取る必要はない。', '取調べは任意になる（相手は断れる）。'],
    [/読み返してもらう/, '部下に捜査記録を全部読み返してもらう。', '並べて読むべき二つの記録を教えてくれる。その記録は机の上で光る。', '部下が一人、一日ふさがる。'],
    [/通信履歴/, '通信会社などに、通信の記録を消さないよう求める（刑訴法197条3項）。', '後で令状を取って記録を見るときまで、記録が残る。', '最大60日。'],
    [/検察官に送る/, '集めた記録をまとめて検察官に送り、捜査を終える。', '満期を待たずに区切りをつけられる。', '送った後は、もう捜査できない。足りない記録があれば、起訴されない。'],
    [/行動確認/, '部下が被疑者の行動を見張る。', '逃げる気配や、証拠を処分する動きに気づける。', '何日も人手がかかる。']
  ];
  U.help = function (a, S, C) {
    const lab = typeof a.label === 'function' ? a.label(S) : (a.label || '');
    const h = HELP.find(x => x[0].test(lab)) || [null, a.who === 'staff' ? '部下に任せる捜査。' : 'あなた自身が動く。', '', ''];
    const own = a.help || {};
    const days = typeof a.days === 'function' ? a.days(S) : a.days;
    const when = a.who === 'staff' ? '<p class="hw"><b>だれが・いつ</b>手の空いている部下が一人、この仕事に向かう。' + (days ? days + '日後の朝に報告が届き、記録が机に綴じられる。その間、その部下は他の仕事ができない。' : 'その場で終わる。') + '</p>'
      : '<p class="hw"><b>だれが・いつ</b>あなた自身が動く。' + (a.free ? '一日の行動は使わない。' : '自分で動けるのは一日に一つだけ。') + '</p>';
    return G.openPaper({ title: lab, sub: (typeof a.sub === 'function' ? a.sub(S) : a.sub) || '',
      body: '<div class="help"><p><b>何をするか</b>' + (own.what || h[1]) + '</p>' + when
        + ((own.plus || h[2]) ? '<p class="hp"><b>利点</b>' + (own.plus || h[2]) + '</p>' : '')
        + ((own.minus || h[3]) ? '<p class="hm"><b>注意</b>' + (own.minus || h[3]) + '</p>' : '') + '</div>' });
  };

  /* ---------- いまの目的と、次にできること ---------- */
  const STAGES = [['捜査', '捜査'], ['逮捕状', '逮捕状'], ['逮捕', '逮捕'], ['勾留', '勾留'], ['送致', '送致']];
  U.stage = S => { const c = S.c; if (c.arrest != null && !c.released) return G.kit.custodyDay(S) < 2 ? 2 : 3; if (c.warrantPending || c.warrantReady) return 1; return 0; };
  U.panel = function (S, C) {
    const c = S.c, st = U.stage(S), hard = G.diff() === 'hard';
    const g = C.goal ? C.goal(S) : null;
    let goal = (g && g.goal) || '', why = (g && g.why) || '';
    if (!goal) {
      if (st >= 2) {
        const left = G.kit.LIMIT - G.kit.custodyDay(S);
        goal = '満期まで、あと' + left + '日。起訴できるだけの証拠を固める';
        why = '満期の日に、集めた記録はすべて検察官に送られ、起訴するかどうかが決まる。証拠が足りなければ、犯人であっても釈放される。取調べは毎日できる。部下の捜査も続けられる。';
      } else if (c.warrantReady) { goal = '逮捕状が出た。被疑者を逮捕する'; why = '「自分で動く」の「逮捕する」から。逮捕すると、満期（最長23日）までの時計が動く。'; }
      else if (c.warrantPending) { goal = '逮捕状の発付を待つ'; why = '請求は翌日に結果が出る。今日のうちに、他の捜査を進めておける。'; }
      else { goal = C.mission || '事件の真相を明らかにする'; why = '部下に聞き込みや鑑定を指示して手がかりを集め、誰が・何をしたのかを見極める。'; }
    }
    const road = '<div class="road">' + STAGES.map((x, i) => '<button class="rs' + (i === st ? ' on' : i < st ? ' done' : '') + '" data-term="' + ({ 0: '被疑者', 1: '逮捕状', 2: '逮捕', 3: '勾留', 4: '送致' })[i] + '">' + x[1] + '</button>' + (i < 4 ? '<span class="ra">›</span>' : '')).join('') + '</div>';
    const hints = hard ? [] : U.hints(S, C, g);
    return '<div class="goal" id="goal"><div class="gh"><span>いまの目的</span><button class="gq" id="goal-why">くわしく</button></div>'
      + '<div class="gg">' + goal + '</div>' + (g && g.meter ? meter(g.meter) : '') + road
      + (hints.length ? '<ul class="gn">' + hints.map(h => '<li>' + h + '</li>').join('') + '</ul>' : '') + '<div class="gwhy" id="gwhy" hidden>' + why + '</div></div>';
  };
  function meter(m) {
    return '<div class="gm"><span class="gml">' + m.label + '</span><span class="gmb">' + Array.from({ length: m.max }, (_, i) => '<i class="' + (i < m.v ? 'on' : '') + '"></i>').join('') + '</span><span class="gmv">' + (m.v >= m.max ? '十分' : Math.min(m.v, m.max) + '／' + m.max) + '</span></div>'
      + (m.why ? '<div class="gmw">' + m.why + '</div>' : '');
  }
  U.hints = function (S, C, g) {
    const out = [], K = G.keiji, easy = G.diff() === 'easy';
    if (g && g.hints) out.push(...g.hints);
    const unread = S.docs.filter(d => d.isNew).length;
    if (unread) out.push('読んでいない記録が' + unread + '件ある（下の「捜査記録」の<span class="newb">新</span>）。タップすると開く。');
    if (S.hl && S.hl.length) { const a = K.doc(S.hl[0]), b = K.doc(S.hl[1]); if (a && b) out.push('岡が言っていた：<b>「' + a.title + '」</b>と<b>「' + b.title + '」</b>を並べて読む（光っている記録）。'); }
    else if (easy && C.pick && C.compare) {
      const open = Object.keys(C.pick).filter(k => { const [x, y] = k.split('|'); return K.doc(x) && K.doc(y) && !(S.compared || {})[k] && C.compare(S, x, y); });
      if (open.length) { const [x, y] = open[0].split('|'); out.push('（やさしい）<b>「' + K.doc(x).title + '」</b>と<b>「' + K.doc(y).title + '」</b>を並べると、何か見えてきそうだ。'); }
    }
    const free = K.freeStaff().filter(s => true);
    const staffActs = C.actions.filter(a => a.who === 'staff' && (!a.cond || a.cond(S)) && !(a.once !== false && S.done[a.id]) && !K.busy(a.id));
    if (free.length && staffActs.length) out.push('手の空いた部下がいる（' + free.map(s => s.name).join('・') + '）。「部下に指示する」から仕事を頼める。');
    const selfActs = C.actions.filter(a => a.who === 'self' && !a.free && (!a.cond || a.cond(S)) && !(a.once !== false && S.done[a.id]));
    if (!S.selfUsed && selfActs.length) out.push('今日はまだ、あなた自身が動ける（「自分で動く」）。');
    if (!out.length || (!free.length || !staffActs.length) && (S.selfUsed || !selfActs.length)) out.push(S.tasks.length ? 'できることを済ませたら「一日を終える」。部下の報告は日をまたいで届く。' : '今日できることは済んだ。「一日を終える」。');
    return out.slice(0, 4);
  };
  U.bindPanel = function () {
    const w = G.$('#goal-why'); if (w) w.onclick = () => { const x = G.$('#gwhy'); x.hidden = !x.hidden; w.textContent = x.hidden ? 'くわしく' : 'とじる'; G.audio.sfx('click'); };
    document.querySelectorAll('.road .rs').forEach(b => b.onclick = () => { G.audio.sfx('click'); U.openGlossary(b.dataset.term); });
  };

  /* ---------- 画面を指し示す説明（コーチ） ---------- */
  // steps: [{ el: セレクタ, title, text }]。要素がなければ、その手順は飛ばす。
  U.coach = function (steps, opt) {
    opt = opt || {};
    steps = steps.filter(s => !s.el || document.querySelector(s.el));
    if (!steps.length) return Promise.resolve();
    return new Promise(done => {
      const box = document.createElement('div'); box.className = 'coach'; document.body.appendChild(box);
      // 説明の間は画面を動かせないようにする（黄色い枠が、示している場所からずれないように）
      const stop = e => e.preventDefault();
      const keys = e => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) e.preventDefault(); };
      const root = document.documentElement, prevO = root.style.overflow, prevB = document.body.style.overflow;
      root.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
      window.addEventListener('wheel', stop, { passive: false }); window.addEventListener('touchmove', stop, { passive: false }); window.addEventListener('keydown', keys);
      const unlock = () => { root.style.overflow = prevO; document.body.style.overflow = prevB; window.removeEventListener('wheel', stop); window.removeEventListener('touchmove', stop); window.removeEventListener('keydown', keys); };
      let i = 0;
      const show = () => {
        if (i >= steps.length) { box.remove(); window.removeEventListener('resize', place); unlock(); done(); return; }
        const s = steps[i];
        const el = s.el ? document.querySelector(s.el) : null;
        if (el) el.scrollIntoView({ block: s.block || 'center', behavior: 'instant' });
        box.innerHTML = '<div class="ch-hole"></div><div class="ch-bub"><div class="ch-t">' + (s.title || '') + '<span>' + (i + 1) + '／' + steps.length + '</span></div><div class="ch-x">' + s.text + '</div><div class="ch-f">'
          + (i > 0 ? '<button class="ch-b" data-a="back">もどる</button>' : '') + '<button class="ch-b ch-n" data-a="next">' + (i === steps.length - 1 ? 'わかった' : 'つぎへ') + '</button></div></div>';
        place();
        box.querySelectorAll('.ch-b').forEach(b => b.onclick = e => { e.stopPropagation(); G.audio.sfx('click'); i += b.dataset.a === 'back' ? -1 : 1; show(); });
      };
      const place = () => {
        const s = steps[i]; if (!s) return;
        const el = s.el ? document.querySelector(s.el) : null, hole = box.querySelector('.ch-hole'), bub = box.querySelector('.ch-bub');
        if (!hole) return;
        const vw = window.innerWidth, vh = window.innerHeight;
        if (!el) { hole.style.cssText = 'left:50%;top:40%;width:0;height:0'; bub.style.cssText = 'left:16px;right:16px;top:30%'; return; }
        const r = el.getBoundingClientRect(), pad = 6;
        hole.style.cssText = 'left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px';
        const below = r.bottom + 12, h = bub.offsetHeight || 160;
        const top = below + h < vh ? below : r.top - 12 - h > 0 ? r.top - 12 - h : Math.max(8, vh - h - 8);
        bub.style.cssText = 'left:' + Math.max(8, Math.min(vw - Math.min(vw - 16, 460) - 8, r.left)) + 'px;top:' + top + 'px';
      };
      window.addEventListener('resize', place);
      box.onclick = e => { if (e.target === box || e.target.classList.contains('ch-hole')) { i++; show(); } };
      show();
    });
  };
  // 一度だけ見せる
  U.once = async function (key, steps) {
    if (tips()[key]) return; tips()[key] = true; G.saveMeta();
    await U.coach(steps);
  };

  /* 刑事編の机：はじめて見たとき */
  U.mainDesk = () => U.once('coachDesk', [
    { title: 'この画面の見方', text: 'あなたは事件の<b>主任</b>（捜査の責任者）。部下に仕事を割り振り、自分でも動いて、事件の真相に迫る。<br>まず、画面の各部分を順に説明する。' },
    { el: '.scene', title: '台詞', text: '人物の台詞はここに出る。<b>画面のどこをタップしても</b>、次の台詞に進む。赤い字は大事な言葉（意味は上の「用語」で引ける）。', block: 'start' },
    { el: '#goal', title: 'いまの目的', text: '<b>迷ったら、ここを見る。</b>いま何を目指しているか、次に何ができるかが書いてある。<br>下の「捜査 › 逮捕状 › 逮捕 › 勾留 › 送致」は事件の進み方。いまの段階が光る。押すと言葉の説明が出る。' },
    { el: '#p-staff', title: '捜査員', text: '部下（白井・岡・野口）と、あなた自身の状況。<b>待機中</b>の部下には仕事を頼める。頼んだ仕事は何日かかかり、終わると<b>朝に報告</b>が届く。' },
    { el: '#p-elem', title: '見立てと、立証すべき事実', text: 'バーは課長（逮捕後は検事）の見立て。記録が集まると伸びる。<br>罪名を決めると、その罪で<b>証明しなければならない事実</b>が並び、証拠がそろうと■が埋まる。' },
    { el: '#desk', title: '捜査記録', text: '集まった記録。<b>タップすると開いて読める。</b><span class="newb">新</span>はまだ読んでいない記録。<br>記録を開いて「横に並べる」と、二つの記録を見比べられる（照らし合わせ）。' },
    { el: '.tabs .tab[data-t=staff]', title: '部下に指示する', text: 'ここに並ぶ仕事を押すと、手の空いている部下が一人、その仕事に向かう。ボタンの右上の小さな数字（<b>「1日」「3日」</b>など）は、報告が届くまでの日数。<br>部下は同時に何人も動かせる。手の空いた部下を遊ばせないのがこつ。' },
    { el: '.tabs .tab[data-t=self]', title: '自分で動く', text: '被害者や関係者から話を聴く、逮捕状を請求する、取調べをする――あなた自身の行動。<b>一日に一つだけ</b>できる。' },
    { el: '.actw .q', title: '？：行動の説明', text: 'それぞれの行動の右下の<b>？</b>を押すと、何をするのか、どんな利点があり、何に注意すべきかが読める。' },
    { el: '#endday', title: '一日を終える', text: '翌朝に進む。部下の報告は日をまたいで届く。<br><b>一日ずつ進めれば、毎日自分で動ける</b>（逮捕後なら毎日取調べができ、自白も得やすい）。' },
    { el: '#b-law', title: '条文帳と用語', text: '<b>条文帳</b>：法律の条文と判例。取調べや捜索が許されるかどうかは、ここで確かめる。<br><b>用語</b>：「逮捕状」「勾留」「満期」など、手続の言葉の意味。', block: 'start' }
  ]);
  U.peopleBoard = () => U.once('coachPeople', [
    { el: '#people', title: '被疑者の候補', text: '捜査で浮かんだ人物の札。分かったことが自動で書き足されていく。<br><b>◯</b>疑わしい点　<b>×</b>疑わしくない点　<b>・</b>どちらとも言えない点<br>◯や×の<b>数は、その事情の強さ</b>。前歴やアリバイがないことは◯一つ（それだけでは犯人と言えない）。足取りや物証は◯◯◯。数の合計より、強い事情があるかどうかを見る。<br>誰を被疑者として追うかは、<b>あなたが決める</b>。決めた人物について、逮捕状を請求できるようになる。' }
  ]);
  U.skipBtn = () => U.once('coachSkip', [
    { el: '#skip', title: '次の報告まで進める', text: '部下の報告や、勾留の節目が来るまで、<b>何日かまとめて進む</b>。待つだけのときに便利。<br><b>注意</b>：その間、あなた自身は動けない。逮捕後に使うと、取調べの機会がその分減る。毎日取り調べたいときは「一日を終える」を使う。' }
  ]);
  U.firstDocs = () => U.once('coachCompare', [
    { el: '#desk', title: '照らし合わせ', text: '記録が増えてきた。捜査の要は、<b>記録どうしを並べて読む</b>こと。<br>①記録をタップして開く → ②下の「横に並べる」 → ③並べる相手の記録を選ぶ → ④左右の記録から、食い違う（またはつながる）一文を一つずつタップ → ⑤「記録する」。<br>当たれば、新しい捜査の糸口が開ける。見つけたことは「照らし合わせの記録」に書き足される。外れても記録には残らない。' }
  ]);
  U.compareView = () => U.once('coachCmpView', [
    { el: '.cmpp .paper[data-i="0"]', title: '①一つ目の記録', text: '気になる一文をタップする。<b>点線の下線</b>が引かれた一文は、照らし合わせる価値がありそうな箇所（むずかしいでは出ない）。', block: 'start' },
    { el: '.cmpp .paper[data-i="1"]', title: '②二つ目の記録', text: 'こちらからも一文を選ぶ。二つが<b>食い違っている</b>か、<b>つながっている</b>と思う組み合わせを選ぶ。', block: 'start' },
    { el: '#cmpgo', title: '③記録する', text: '二つ選んだら押す。当たりなら、部下が気づいたことを話し、「照らし合わせの記録」に書き足される。同じ物・場所・番号などが一致するだけの記載なら「一致」と出る。外れなら、そう伝えられ、選び直せる。' }
  ]);
  U.arrested = () => U.once('coachArrest', [
    { el: '.clock', title: '身柄拘束の時計', text: '逮捕した。ここから<b>最長23日</b>。<br>・48時間以内に検察官へ送致<br>・検察官は24時間以内に勾留を請求（裁判官が認めれば10日）<br>・延長は最大10日<br>・<b>満期の日</b>に、集めた記録で起訴か不起訴かが決まる。足りなければ、犯人でも釈放される。', block: 'start' },
    { el: '.tabs .tab[data-t=self]', title: '逮捕したら、できること', text: '・<b>取調べ</b>：毎日できる。被疑者は取調室に来ることを拒めない。ただし、進め方によっては違法になる。<br>・<b>捜索差押許可状</b>：裁判官の許可を得て、部屋を捜し、証拠物を押収できる。<br>・部下の捜査も続けられる。' }
  ]);
  U.warrantReady = () => U.once('coachWarrant', [
    { el: '.tabs .tab[data-t=self]', title: '逮捕状が出た', text: '「自分で動く」に<b>逮捕する</b>が出ている。逮捕状の有効期間は7日。<br>いつ逮捕するかはあなたが決める。逮捕すると23日の時計が動くので、それまでに集めておきたい記録があれば、先に集めておく手もある。' }
  ]);
})();
