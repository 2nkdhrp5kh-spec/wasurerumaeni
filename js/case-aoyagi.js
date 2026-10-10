'use strict';
/* ============================================================
   本章　青柳書房事件
   真相（S.c.truth）は内部で決まり、表示しない。
   真相によって変わるのは：自白の出やすさと中身、8枚面割りの結果、
   金庫の発見確率、動画配信の接続元、宮下（犯人でない世界では真犯人）。
   ============================================================ */
(function () {
  const K = G.keiji, P = G.P, kv = G.kv, note = G.note;
  const rnd = G.rnd;
  const sc = (who, bg, stage) => ({ bg: bg || 'office', who, stage });
  // 条文帳から使う手段
  function setLawTools(S) {
    const c = S.c;
    const wrap = fn => async () => { if (G.ui.talking || G.ui.busy) return; G.ui.busy = true; try { await fn(); } finally { G.ui.busy = false; } K.render(); };
    G.lawTools = {
      k197: { label: '通信履歴を消さないよう求める', avail: () => !S._ended && c.claim && c.preserveDay == null,
        run: wrap(async () => { c.preserveDay = S.day; await G.talk([['', '（刑訴法197条3項。動画配信事業者と携帯電話会社に、通信履歴を消去しないよう書面で求めた。最大60日。）', { sfx: 'type' }], ['oka', '……そんな手がありましたか。動画の会社の記録、普通は30日で消えるそうですから。', { scene: sc('oka') }]]); }) },
      k220: { label: '逮捕のとき、その現場を捜索する', avail: () => !S._ended && c.target === 'K' && c.arrest == null && !c.use220,
        run: wrap(async () => { c.use220 = true; await G.talk([['', '（逮捕状を執行するとき、久住の部屋で逮捕すれば、その現場は令状なしで捜索できる（刑訴法220条1項2号・3項）。）'], ['shirai', '朝、部屋で押さえましょう。それなら捜索も一緒にできる。', { scene: sc('shirai') }]]); }) },
      k226: { label: '宮下の証人尋問を検事に頼む', avail: () => !S._ended && S.fin.miyaTalk && !c.asked226,
        run: wrap(async () => { c.asked226 = true; await G.talk([['kenji', '226条ですか。……宮下が、事件について「欠くことのできない知識」を持っていると、明らかに言えますか。', { scene: sc('kenji', 'pros') }], ['kenji', '前歴があって、アリバイがない。それは「知識」ではなく「疑い」です。疑いのある人間を証人として呼べば、黙秘権の問題にもなる。'], ['kenji', '請求はできません。'], ['', '（宮下は、被疑者として扱うだけの理由もなく、証人として呼ぶ理由もない。）']]); }) }
    };
  }
  const ks = S => { // 久住の顔の段階
    const c = S.c; if (c.arrest == null) return 0;
    const d = S.day - c.arrest; return d < 4 ? 0 : d < 9 ? 1 : d < 16 ? 2 : 3;
  };
  const inCustody = S => S.c.arrest != null && !S.c.released;
  const custodyDay = S => S.day - S.c.arrest;
  const LIMIT = 23;
  function limitBar(d, left) {
    const seg = (cls, w, t) => '<span class="seg ' + cls + '" style="width:' + (w / LIMIT * 100) + '%">' + t + '</span>';
    return '<div class="limit"><div class="row"><span>身柄拘束 ' + d + '日目</span><span>勾留満期まで あと' + left + '日</span></div>'
      + '<div class="segs"><span class="done" style="width:' + Math.min(100, d / LIMIT * 100) + '%"></span>'
      + seg('s1', 3, '送致・請求') + seg('s2', 10, '勾留 10日') + seg('s3', 10, '延長 10日')
      + '<span class="now" style="left:calc(' + Math.min(100, d / LIMIT * 100) + '% - 1px)"></span></div>'
      + '<div style="margin-top:2px">逮捕から48時間で送致、24時間以内に勾留請求、勾留10日、延長は最大10日（刑訴法203・205・208条）</div></div>';
  }

  const C = {
    id: 'aoyagi', role: '捜査官', base: { m: 10, d: 3 }, dayCard: true,
    staff: [{ id: 'shirai', name: '白井' }, { id: 'oka', name: '岡' }, { id: 'noguchi', name: '野口' }],
    get suspect() { const S = K.state(); return S && S.c && S.c.target === 'M' ? { name: '宮下　剛', kana: 'みやした つよし', age: '46歳', job: '無職（日雇い）', addr: '北見坂市川北三丁目2番8号 第二川北荘105号室' } : { name: '久住　透', kana: 'くずみ とおる', age: '34歳', job: '物流会社契約社員', addr: '北見坂市北見坂二丁目9番5号 コーポ北見202号室' }; },
    koryuGrounds: [2, 3],
    factsOf: (S, bekken) => {
      if (bekken) return '被疑者は、9月中、北見坂市北見坂二丁目9番5号コーポ北見202号室の被疑者方において、インターネットを介して海外のオンラインカジノに接続し、金銭を賭けて賭博をしたものである。';
      const id = S.c.charge, head = '被疑者は、10月2日午後9時40分ころ、北見坂市本町一丁目の古書店「青柳書房」（青柳静江方）に、裏口から侵入し、同店帳場において、';
      if (id === 'setto') return head + '同人管理の現金約38万円在中の手提げ金庫1個を窃取したものである。';
      return head + '同人（当時68歳）に対し、刃物様の物を示して「金を出せ」と申し向け、布製粘着テープでその両手首を緊縛するなどの暴行・脅迫を加えてその反抗を抑圧し、同人管理の現金約38万円在中の手提げ金庫1個を強取したものである。' + (id === 'chisho' ? 'その際、同人に傷害を負わせた。' : '');
    },
    chargeHint: '金を奪う罪を分けるのは<b>手段</b>。相手の反抗を抑えるほどの暴行・脅迫（刃物を見せる、縛る）を使えば強盗。使わずにこっそり取れば窃盗。強盗の際に人がけがをすれば強盗致傷になる。けがの有無は、診断書などの記録で確かめる。',
    charges: [
      { id: 'goto', label: '住居侵入・強盗', law: '刑法130条前段・236条1項', fit: true, arts: ['刑法 第130条', '刑法 第236条'], req: ['正当な理由なく入る', '反抗を抑えるほどの暴行・脅迫', '財物を奪う', '故意'] },
      { id: 'setto', label: '住居侵入・窃盗', law: '刑法130条前段・235条', arts: ['刑法 第235条'], req: ['財物を盗む', '暴行・脅迫は使わない'], els: (S, e) => e.filter(x => !/暴行|脅迫/.test(x.k)) },
      { id: 'chisho', label: '住居侵入・強盗致傷', law: '刑法130条前段・240条（裁判員裁判の対象）', arts: ['刑法 第240条'], req: ['強盗', '人にけがをさせた'], els: (S, e) => e.concat([{ k: '被害者のけが', v: 0 }]) }
    ],
    info: S => {
      const c = S.c;
      if (inCustody(S)) {
        const d = custodyDay(S), left = LIMIT - d;
        const stage = d < 2 ? '送致前（48時間）' : d < 3 ? '勾留請求' : d < 13 ? '勾留' : '勾留延長';
        return { text: G.kit.title(S, '青柳書房事件') + '　' + (c.arrest_kind === 'bekken' ? '［別件（賭博）で拘束中］' : '') + stage,
          clock: limitBar(d, left) };
      }
      return { text: G.kit.title(S, '青柳書房事件') + '　事件発生から' + (S.day + 1) + '日' };
    },
    scene: S => sc(null, 'office'),
    nextMilestone: S => G.kit.nextMilestone(S),
    stopSkip: S => (inCustody(S) && (custodyDay(S) >= LIMIT || (custodyDay(S) >= 16 && !S.c.confession && !S.c.takeoverAsked))) || (S.c.arrest == null && S.day >= 28),
    endHint: S => inCustody(S) ? '満期までに記録を固める' : (S.tasks.length ? '部下の報告は日をまたいで届く' : ''),
    gauge: S => {
      if (S.c.target === 'M') return G.trial.gauge(S, TRIAL_M);
      if (!G.ending || !G.ending.estimate) return '';
      const e = G.ending.estimate(S), w = e.w, c = S.c;
      let lv = w < 1 ? 1 : w < 3 ? 2 : w < 4 ? 3 : w < 6 ? 4 : 5;
      if (!e.ok && lv > 3) lv = 3;
      const who = inCustody(S) && custodyDay(S) >= 2 ? '担当検事の見立て' : '東堂課長の見立て';
      const words = ['', 'これでは起訴できない', '起訴は難しい。もっと固めろ', e.neg > 1.2 && w >= 4 ? '起訴はできる。だが、弁護人に突かれる穴が多い' : '起訴はできる。だが公判は危うい', '公判でも有罪を取れるだろう', '固い'];
      return '<div class="gauge"><div class="gt">' + who + '（集めた記録を、すべて証拠にできると仮定した場合）</div><div class="gb">' + [1, 2, 3, 4, 5].map(i => '<span class="' + (i <= lv ? 'on' : '') + '"></span>').join('') + '</div><div class="gw">「' + words[lv] + '」</div></div>';
    },
    elements: S => {
      if (S.c.target === 'M') return elementsM(S);
      const c = S.c, d = id => !!K.doc(id);
      let who = 0, src = [];
      if (c.safeFound) { who = 3; src.push('金庫'); }
      else {
        if (c.lineupRes === 'K') { who += 2; src.push('面割り'); } else if (c.lineupRes === 'single') { who += 1; src.push('面割り'); } else if (c.victimSuggested) { who += 1; src.push('被害者'); }
        if (d('printK')) { who += 1; src.push('指紋'); }
        if (d('camera')) who += .5;
        if (d('fiber')) who += .5;
        if (c.casino) who += .5;
      }
      const conf = !!c.confession;
      return [
        { k: '犯人性', v: conf ? 3 : Math.min(3, Math.floor(who)), conf: conf && !c.safeFound, src: src.join('・') },
        { k: '犯行態様', v: conf ? 3 : d('victim') ? 2 : 1, conf },
        { k: '被害', v: c.safeFound ? 3 : d('victim') ? 2 : 1, src: '' },
        { k: '動機', v: Math.min(3, (d('kandori') ? 1 : 0) + (d('loan') ? 1 : 0) + (conf ? 1 : 0)), conf: false }
      ];
    },

    /* ---------- 朝 ---------- */
    morning: (S, first) => {
      const c = S.c, L = [];
      if (first) {
        L.push(['', '（10月3日。午前0時を少し過ぎたころ、刑事課の電話が鳴った。）', { sfx: 'phone' }],
          ['todo', '本町の古書店に強盗だ。店主のばあさんが縛られた。金庫を持っていかれてる。', { scene: sc('todo') }],
          ['', '（午前1時。青柳書房。帳場の明かりの下で、店主の青柳静江が、毛布にくるまって座っていた。）', { scene: sc('aoyagi', 'shop') }],
          ['aoyagi', '……ごめんなさいね。手が、まだ震えて。'],
          ['aoyagi', 'あのお金は、主人が遺したこの店を、年を越して続けるための……。'],
          ['', '（細い手首に、粘着テープの跡が赤く残っていた。68歳。店の奥で、一人で暮らしている。）'],
          ['todo', '……見ただろう。年寄りを縛り上げて、金を持っていく。そういう奴が、この町を歩いてる。', { scene: sc('todo') }],
          ['todo', '「検挙に勝る防犯なし」だ。挙げなきゃ、次がある。……主任はお前だ。白井、岡、野口をつける。'],
          ['todo', 'ただし、挙げるのは*犯人*だ。間違った奴を挙げたら、本物は今夜もどこかで寝てる。それを忘れるな。'],
          ['shirai', '主任、現場の実況見分は夜のうちに済ませました。記録は机の上です。', { scene: sc('shirai') }],
          ['shirai', '一つだけ。逮捕すれば、そこから満期まで最大23日です。その間に起訴できるだけの証拠がそろわなければ、検事は起訴できず、釈放するしかない。'],
          ['shirai', '早く逮捕しすぎると、時間切れになる。遅すぎると、逃げられたり、証拠を捨てられたりする。……逮捕の時機は、よく考えてください。']);
        K.addDoc({ id: 'scene', title: '実況見分調書', kind: 'neu', evid: true, body: P('北見坂市本町一丁目、古書店「青柳書房」（店舗兼住宅）。10月2日午後9時40分ころ被害。',
          '被害者・青柳静江（あおやぎ しずえ・68歳）は帳場付近で、両手首を<b>布製の粘着テープ</b>で巻かれた状態で、通報により駆けつけた警察官に発見された。',
          '裏口は施錠されていなかった。帳場の<b>緑色の手提げ金庫</b>（現金約38万円在中）が持ち去られている。事件当時、店内は<b>奥の照明1灯のみ</b>が点灯していた（被害者の指示説明による）。',
          '店舗入口の玄関マットから灰色の繊維片を、粘着テープから不鮮明な指紋1個を採取した。刃物、犯人の遺留品は発見されていない。') });
        K.addDoc({ id: 'manual', title: '捜査の要点', kind: 'memo', body: P('・逮捕状を請求できるのは警部以上（刑訴法199条2項）。疎明資料をそろえて東堂課長に上げる。',
          '・逮捕すると、送致まで48時間、勾留請求まで24時間、勾留10日、延長最大10日（203条・205条・208条）。',
          '・通信事業者には、通信履歴を消さないよう求めることができる（197条3項）。最大60日。',
          '・取調べの前に、黙秘権を告げる（198条2項）。本件は録音録画義務の対象外（301条の2）。',
          '・住居の捜索には令状が要る（憲法35条、刑訴法218条）。',
          '・条文帳には、ここに並んでいない手段が書かれていることがある。使える規定には「この規定を使う」が現れる。',
          '・記録を開いて「横に並べる」と、二枚を見比べられる。それぞれから気になる記載を一か所ずつ選んで記録する。食い違いやつながりに気づけば、新しい捜査の糸口になる。書き込みは捜査メモとして残り、課長も検事も目を通す。並べた紙のうち、うすく下線のある記載が、照らし合わせる手がかりになる。行き詰まったら、部下に記録を読み返してもらうこともできる。',
          '・記録が有利か不利かは、誰も教えてくれない。読んで判断する。') });
        return L;
      }
      // 動画配信事業者の回答
      if (c.video && c.video.arrive === S.day) L.push(...videoArrive(S));
      // 令状の発付
      if (c.warrantPending && S.day > c.warrantPending.day) {
        const w = c.warrantPending; c.warrantPending = null;
        if (w.kind === 'search') { c.searchWarrant = true; const fd = G.kit.forms.data(S, C); K.addDoc({ id: 'searchWarrant', title: '捜索差押許可状', kind: 'neu', body: G.forms.search(Object.assign(fd, { place: '北見坂市北見坂二丁目9番5号 コーポ北見202号室（被疑者方居室）', items: '灰色の上着、白色マスク、刃物、布製粘着テープ、手提げ金庫（緑色）、現金、金銭の出入りを記録した帳簿・メモ類、携帯電話機その他本件に関係する通信の記録' })) }); L.push(['', '（捜索差押許可状が発付された。）']); }
        else { c.warrantReady = w.kind; G.kit.forms.issued(S, C, w.kind === 'bekken'); L.push(['todo', w.kind === 'bekken' ? '賭博で逮捕状が出た。……分かってるな。本命は強盗だ。' : '逮捕状が出た。行ってこい。', { scene: sc('todo') }]); }
      }
      if (inCustody(S) && c.target === 'M') return morningM(S, L);
      if (inCustody(S)) {
        const d = custodyDay(S);
        if (d === 1) {
          K.addDoc({ id: 'news', title: '新聞記事', kind: 'memo', body: P('<b>古書店強盗　元店員の男を逮捕　「やっていない」と否認</b>', '北見坂署は、北見坂市本町の古書店で店主の女性（68歳）を粘着テープで縛り、現金約38万円入りの金庫を奪ったとして、強盗の疑いで、同市北見坂二丁目、物流会社契約社員、<b>久住透容疑者（34歳）</b>を逮捕した。同署によると、久住容疑者は「やっていない」と容疑を否認している。捜査関係者によると、同容疑者は多額の借金を抱えていたという。') });
          L.push(['', '（朝刊の地域面に、久住の名前が出た。）', { scene: { bg: 'office' } }]);
        }
        if (d === 2) L.push(['', '（48時間。久住は検察官に送致された。）'], ['kenji', '担当の検事です。勾留を請求します。……自白は、まだですか。', { scene: sc('kenji', 'pros') }]);
        if (d === 3) { L.push(['', '（裁判官は勾留を認めた。10日間。勾留状が届いた。）']); G.kit.forms.koryu(S, C); }
        if (d === 5 && !S.staffGone.noguchi) { K.loseStaff('noguchi'); L.push(['todo', '野口は窃盗の応援に回す。被疑者はもう押さえてるんだ。', { scene: sc('todo') }]); }
        if (d === 13) {
          L.push(['', '（勾留延長。あと10日。）']); G.kit.forms.ext(S, C);
          if (!S.staffGone.oka) { K.loseStaff('oka'); L.push(['todo', '岡も外す。残りは白井とお前でやれ。', { scene: sc('todo') }]); }
        }
        if (d === 8 && !c.confession) L.push(['todo', '検事が電話してきた。自白はまだか、とな。', { scene: sc('todo') }]);
        if (d === 15 && !c.confession) L.push(['todo', 'やり方は任せる。結果を出せ。', { scene: sc('todo') }]);
        if (d === 6) { c.fired = true; L.push(['shirai', '久住の会社、契約を打ち切ったそうです。新聞に名前と勤め先が出ましたからね。', { scene: sc('shirai') }], ['shirai', '……まあ、起訴されるまで待ってくれる会社なんて、ありゃしません。']); }
        if (d === 10) L.push(['shirai', '久住のアパートの管理会社が、母親に「退去してほしい」と電話してきたそうです。', { scene: sc('shirai') }], ['', '（久住には接見禁止が付いている。母親は、まだ一度も息子に会えていない。）']);
        if (d === 20) L.push(['shirai', '主任、満期まであと3日です。', { scene: sc('shirai') }]);
        return L;
      }
      // 逮捕前の圧力
      if (S.day === 4) L.push(['todo', 'そろそろ絞れ。被害者は年寄りだ。近所も怖がってる。', { scene: sc('todo') }]);
      if (S.day === 9 && c.arrest == null) L.push(['todo', '逮捕状はまだか。新聞に「捜査難航」と書かれたら、署長が黙ってないぞ。', { scene: sc('todo') }]);
      if (S.day === 18 && c.arrest == null) L.push(['todo', '上からせっつかれてる。あと10日で目処をつけろ。', { scene: sc('todo') }]);
      if (S.day === 5) L.push(...homeScene(1));
      // 逮捕を遅らせると：罪証隠滅・逃亡のおそれ（真相によらず起こりうる）
      if (c.claim && c.arrest == null) {
        c.claimDay = c.claimDay == null ? S.day - 1 : c.claimDay;
        const since = S.day - c.claimDay;
        if (since === 3 && !c.search && rnd() < .45) { c.jacketGone = true; L.push(['noguchi', '主任、久住のアパートのごみ置き場に、久住の部屋のごみ袋が出てました。……灰色の服が、のぞいてたそうです。回収車はもう行きました。', { scene: sc('noguchi') }], ['todo', '話を聴かれて、慌てて捨てたか。……だから早く押さえろと言ったんだ。', { scene: sc('todo') }]); }
        if (since === 6 && rnd() < .35) { c.fled = true; L.push(['shirai', '久住、隣県の母親の家に移ったようです。アパートは空けたまま。', { scene: sc('shirai') }], ['todo', '逃げられたら終わりだぞ。逮捕の必要性は十分だ。', { scene: sc('todo') }]); }
      }
      if (S.day === 7) L.push(['aoyagi', '……刑事さん。犯人は、まだ捕まらないんですか。夜になると、裏口の音が気になって、眠れなくて。', { scene: sc('aoyagi', 'shop') }]);
      if (S.day === 11 && S.fin.canvass1) L.push(['murai', 'うちの裏、あの路地でしょう。……夜、ゴミを出しに行くのも怖くて。早く捕まえてください。', { scene: sc('murai', 'street') }]);
      return L;
    },
    check: async S => {
      const c = S.c;
      if (inCustody(S) && c.target !== 'M' && custodyDay(S) >= 16 && !c.confession && !c.takeoverAsked && !(c.sess.C || c.sess.D || c.sess.E)) {
        c.takeoverAsked = true;
        await G.talk([['todo', '……お前のやり方じゃ、埒があかん。', { scene: sc('todo') }], ['todo', '今夜は俺が調べる。昔のやり方でな。']]);
        const v = await G.openPaper({ title: '東堂課長', body: P('課長が、自分で久住を取り調べると言っている。'), noClose: true,
          buttons: [{ label: '課長に任せる', value: true, small: '取調室のことは、あなたは見ない' }, { label: '自分にやらせてほしいと言う', value: false, small: '課長は不機嫌になる' }] });
        if (v) {
          c.todoTook = true; c.sess.C += 2; c.sess.E = (c.sess.E || 0) + 1; ['tape', 'safe', 'light'].forEach(x => { if (!c.leaks.includes(x)) c.leaks.push(x); });
          c.meter = (c.meter || 0) + 75;
          await G.talk([['', '（その夜、取調室の明かりは、午前1時過ぎまで消えなかった。）', { scene: { bg: 'interro' } }], ['', '（廊下まで、課長の声が聞こえた。）', { sfx: 'thud' }]]);
          if (c.meter >= 100) await makeConfession(S, false, { by: 'todo' });
          else await G.talk([['todo', '……しぶとい奴だ。', { scene: sc('todo') }]]);
        } else {
          await G.talk([['todo', 'なら、満期までに結果を出せ。白井も外す。', { scene: sc('todo') }]]);
          K.loseStaff('shirai');
        }
        K.render();
      }
      if (inCustody(S) && custodyDay(S) >= LIMIT) {
        if (c.arrest_kind === 'bekken') {
          await G.talk([['', '（賭博での勾留が満期を迎えた。久住は釈放された。）']]);
          c.released = true; c.bekkenEnded = true;
          if (!c.confession) { K.render(); return; }
        }
        await finishCase(S, 'soutchi'); return 'end';
      }
      if (c.arrest == null && S.day >= 28) {
        await G.talk([['todo', 'これ以上は人を割けん。帳場は縮小だ。', { scene: sc('todo') }], ['', '（青柳書房事件は、被疑者不詳のまま継続捜査となった。）']]);
        await finishCase(S, 'unsolved'); return 'end';
      }
    },

    actions: []
  };
  const A = C.actions;

  /* ---------- 照合：二つの記録を照らし合わせる ---------- */
  // 照合：二枚のどの記載を選べば、つながりに気づくか（記録の組は名前順）
  C.pick = {
    'camera|murai': [/170〜180/, /高くなかった|主人より低い/],
    'kandori|regular': [/常連なら/, /鍵|アルバイト/],
    'profile|regular': [/常連なら/, /鍵|アルバイト/],
    'printK|printM': [/特徴点|12点|断定/, /特徴点|12点|断定/],
    'news|phoneSeize': [/強盗/, /08:41|検索/],
    'bank|mother': [/320,000|決済代行|ペイロード/, /30万円|母に借り/],
    'bank|claim': [/320,000|決済代行|ペイロード/, /30万円|母に借り/],
    'claim|video': [/動画/, /再生|接続元/],
    'confession|scene': [/明か|明る|暗|テープ|ひも|金庫/, /照明|明かり|暗|テープ|金庫/],
    'confession|victim': [/明か|明る|暗|テープ|ひも|金庫/, /照明|明かり|暗|テープ|金庫/],
    'camera2|miyashita': [/北見橋|交差点/, /北見川|km/],
    'camera2|kandori': [/北見橋|交差点/, /北見川|km/],
    'kandori|register': [/不足/, /計算違い/],
    'profile|register': [/不足/, /計算違い/],
    'claim|neighborsK': [/動画|再生/, /野球|聞こえて/],
    'neighborsK|video': [/動画|再生/, /野球|聞こえて/]
  };
  C.compare = (S, a, b) => {
    const c = S.c, has = (x, y) => (a === x && b === y) || (a === y && b === x);
    const any = (x, list) => list.some(y => has(x, y));
    if (has('murai', 'camera')) return { lines: [['', '（村井さんは「背はそんなに高くなかった」。カメラの男は「170〜180cm」。）'], ['shirai', '……同じ男なら、どっちかが間違ってる。別の男なら、話は変わる。', { scene: sc('shirai') }], ['shirai', '村井さんに、もう一度聞いてみますか。']],
      memo: { title: '目撃とカメラの食い違い', text: '村井の「背は高くなかった」と、防犯カメラの「推定170〜180cm」が合わない。同一人物か、別人か。' }, then: S => { c.muraiLead = true; } };
    if (any('regular', ['kandori', 'profile'])) return { lines: [['', '（鑑取りの「鍵の場所を知っていた者」は三人。だが常連客は「常連なら何人も知っていた」と言う。）'], ['oka', '鑑取りの三人に絞ったのは、早すぎたかもしれませんね。', { scene: sc('oka') }]],
      memo: { title: '鍵を知る者は三人ではない', text: '鍵の隠し場所を知っていた者は、鑑取りで挙がった三人に限られない。常連客や出入りの業者を洗い直す必要がある。' }, then: S => { c.customerLead = true; } };
    if (has('printK', 'printM')) return { lines: [['', '（久住と8点。宮下と7点。どちらも相違点なし。）'], ['shirai', 'この指紋じゃ、誰でもありうるってことですな。', { scene: sc('shirai') }]], memo: { title: '指紋では決められない', text: '粘着テープの指紋は、久住とも宮下とも同程度に合致する。犯人の特定には使えない。' } };
    if (has('phoneSeize', 'news')) return { lines: [['', '（「北見坂 古書店 強盗」の検索は8時41分。最初のニュースは7時。）'], ['oka', 'ニュースを見てから調べた、とも読めますね。元の勤め先ですから。', { scene: sc('oka') }]], memo: { title: '翌朝の検索', text: '久住の検索（8時41分）は、最初の報道（7時）の後。報道を見て元の勤め先を調べたとしても矛盾はない。' } };
    if (any('bank', ['mother', 'claim'])) return { lines: [['', '（母は「家にあった金を渡した」。口座には10月1日、決済代行から32万円。）'], ['shirai', '母親まで嘘をついてる。……何を隠してるんですかね。', { scene: sc('shirai') }]], memo: { title: '返済金の出所', text: '返済の30万円について、久住と母は「母に借りた」と説明したが、口座にはオンラインカジノの決済代行からの入金がある。二人は嘘をついていた。' } };
    if (has('video', 'claim') && c.video && c.video.exists) return c.truth === 'I'
      ? { lines: [['', '（久住は「家で動画を見ていた」。回答は「自宅の固定回線から再生」。）'], ['oka', '……主任。これ、家にいたってことじゃないですか。', { scene: sc('oka') }]], memo: { title: '動画の接続元', text: '犯行時刻、久住の自宅の固定回線で動画が再生され続けていた。久住の弁解と合う。' } }
      : { lines: [['', '（回答は「携帯電話回線から再生」。家の中でも、外でも見られる。）'], ['oka', '家にいたとも、外にいたとも言えませんね。', { scene: sc('oka') }]], memo: { title: '動画の接続元', text: '再生は携帯電話回線。場所は分からない。' } };
    if (any('confession', ['scene', 'victim'])) {
      const cf = c.confession; if (!cf || !cf.det) return null;
      const bad = []; if (!cf.det.tape) bad.push('縛ったもの（調書：ビニールひも／現場：布の粘着テープ）'); if (!cf.det.safe) bad.push('金庫の色（調書：黒っぽい／現場：緑）'); if (!cf.det.light) bad.push('店の明るさ（調書：明るかった／現場：奥の1灯のみ）');
      if (bad.length) return { lines: [['', '（自白と現場の記録を並べる。合わないところがある。）'], ['', '（' + bad.join('、') + '）'], ['shirai', '……思い違いですかね。それとも。', { scene: sc('shirai') }]], memo: { title: '自白と現場の食い違い', text: '自白の内容が現場の状況と合わない点：' + bad.join('、') + '。' } };
      return { lines: [['', '（自白と現場の記録は、よく合っている。）']].concat(c.leaks.length ? [['', '（……取調べで現場の写真を見せたことを、除けば。）']] : []), memo: { title: '自白と現場', text: '自白は現場の状況とよく合う。' + (c.leaks.length ? 'ただし、自白の前に取調べで現場の写真を示している（' + c.leaks.map(x => ({ tape: '粘着テープ', safe: '金庫', light: '照明' })[x]).join('、') + '）。' : '') } };
    }
    if (any('camera2', ['miyashita', 'kandori'])) return { lines: [['', '（男は北見橋の手前の交差点で見えなくなる。久住の家は橋の手前、宮下の家は橋の先。）'], ['noguchi', 'どっちの家にも行けちゃいますね……。', { scene: sc('noguchi') }]], memo: { title: '逃走方向', text: 'カメラの男が消えた交差点からは、久住の家（橋の手前）にも、宮下の家（橋の先）にも行ける。' } };
    if (any('register', ['kandori', 'profile'])) return { lines: [['', '（鑑取りでは「レジの金の不足を疑われて辞めた」。だが、それは青柳さんの計算違いだった。）'], ['oka', '恨む理由にもなるし、恨む筋合いはない、とも言えますね。', { scene: sc('oka') }]], memo: { title: '辞めた理由', text: '久住が疑われたレジの不足は、被害者の計算違いだった。本人はそれを知らされていない。' } };
    if (any('neighborsK', ['claim', 'video'])) return { lines: [['', '（隣人は「毎晩、野球の音」。あの夜も「たぶん」。）'], ['shirai', '裏付けとしちゃ弱い。でも、否定もできない。', { scene: sc('shirai') }]], memo: { title: '隣人の話', text: '隣人の話は久住の弁解と矛盾しないが、その夜に限った裏付けにはならない。' } };
    return null;
  };

  /* ---------- 家の場面 ---------- */
  function homeScene(n) {
    if (n === 1) return [['', '（午後11時。家に帰ると、台所の明かりだけが点いていた。）', { scene: { bg: 'home' } }],
      ['wife', 'おかえり。ご飯、温めようか。'], ['', '（食卓の上に、娘のプリントが置いてある。「おとうさんのしごと」。）'],
      ['', '（「わるいひとをつかまえて、まちをまもるしごとです。」）']];
    if (n === 2) return [['', '（その夜。）', { scene: { bg: 'home' } }], ['daughter', 'おとうさん、テレビに出てたよ。ニュースで、おとうさんの警察署。'], ['wife', '捕まったんでしょう。よかったね。']];
    return [];
  }

  /* ---------- 初動 ---------- */
  A.push({ id: 'victim', who: 'self', label: '被害者から詳しく話を聴く', sub: '署に来てもらい、調書を作る', run: async S => {
    G.drawScene(sc('aoyagi', 'soudan'));
    await G.talk([['', '（署の相談室。青柳さんに来てもらい、あの夜のことを一つずつ聴いて、調書にまとめる。）']]);
    await G.talk([['aoyagi', '帳場で売上を数えていたら、裏から男の人が……。刃物のようなものを見せて、「金を出せ」と。'], ['aoyagi', '灰色っぽい上着に、白いマスク。背は高めに見えました。……私は148センチですから、たいていの方は大きく見えますけれど。'],
      ['aoyagi', '奥の明かりしか点けていなくて、暗かったんです。顔は、ほとんど。'], ['aoyagi', '声は低かったと思います。……ごめんなさい、それくらいしか。']]);
    K.addDoc({ id: 'victim', title: '被害者の供述調書', kind: 'inc', evid: true, body: P('（青柳静江・68歳）', '帳場で売上を数えていたら、裏口から男が入ってきて、刃物のようなものを見せて「金を出せ」と言いました。刃物はよく見ていません。',
      '男は30代くらい。灰色っぽい上着に、白いマスクをしていました。背は高めに見えました。私は148センチです。', '店は奥の明かりだけで暗く、顔はほとんど見ていません。声は低かったと思います。',
      '男は布のガムテープで私の両手首を巻き、帳場の緑色の手提げ金庫を持って裏口から出ていきました。中には38万円ほど入っていました。') });
  } });
  A.push({ id: 'canvass1', who: 'staff', days: 2, label: '地取り：店の周辺', short: '地取り（店の周辺）', sub: '事件の夜、何か見た人はいないか',
    done: S => { K.addDoc({ id: 'murai', title: '村井良子の供述', kind: 'exc', evid: true, body: P('（村井良子〈むらい よしこ〉・47歳、書店の裏に住む）', '夜の9時半ごろ、ゴミを出しに行ったら、裏の路地に灰色の作業着みたいなのを着た男の人がいました。',
        '背は……そんなに高くなかったと思います。うちの主人が170センチなんですけど、主人より低いくらい。暗かったので、確かではないです。') });
      return [['oka', '書店の裏の村井さんが、9時半ごろに灰色の上着の男を見てます。', { scene: sc('oka') }], ['murai', '背は、そんなに高くなかったと思いますよ。暗かったけど。', { scene: sc('murai', 'street') }]]; } });
  A.push({ id: 'canvass2', who: 'staff', days: 2, label: '地取り：商店街', short: '地取り（商店街）', cond: S => S.fin.canvass1,
    done: S => {
      K.addDoc({ id: 'regular', title: '常連客の供述', kind: 'exc', evid: true, body: P('（常連客・70代男性）', '裏口の鍵が植木鉢の下にあるのは、常連なら何人か知ってたよ。配達の人も使ってた。静江さん、そういうところは無頓着だから。') });
      K.addDoc({ id: 'hearsay', title: '捜査報告書（近隣の噂）', kind: 'inc', evid: true, body: P('本町商店街の飲食店主によれば、「事件の夜、元店員の男が店の近くをうろついていた、と客の誰かが話していた」とのこと。', '話をした客が誰であるかは、店主は覚えていない。') });
      return [['noguchi', '鍵の場所を知ってた人、けっこういるみたいです。', { scene: sc('noguchi') }], ['noguchi', 'あと、商店街の飲み屋で「元店員がうろついてた」って噂を聞きました。誰が言い出したかは分かりませんけど。']]; } });
  A.push({ id: 'kandori', who: 'staff', days: 3, label: '鑑取り：被害者の人間関係', short: '鑑取り', sub: '裏口の鍵の場所を知っていた者は',
    done: S => { K.addDoc({ id: 'kandori', title: '鑑取り捜査報告書', kind: 'inc', evid: true, body: kv([['久住 透（くずみ とおる・34歳）', '元アルバイト店員。半年前に退職（レジの金の不足を疑われた）。裏口の鍵の場所を知っていた。<b>消費者金融に借金がある</b>との話。住居は書店の北約1.2km'],
        ['青柳 慎也（あおやぎ しんや・41歳）', '被害者の甥。事業の失敗で借金。相続の話で揉めたことがある'], ['宅配業者の配達員', '裏口から荷物を入れることがあり、鍵の場所を知っていた']]) });
      K.addDoc({ id: 'profile', title: '久住透の身上', kind: 'memo', body: kv([['年齢', '34歳'], ['職業', '物流会社の契約社員（倉庫のピッキング、日勤、勤続2年）'], ['家族', '独身。母（久住和子、62）は隣県で一人暮らし。父は10年前に死亡'],
        ['経歴', '高校卒業後、職を転々とする。28歳から5年間、青柳書房でアルバイト。半年前、レジの金の不足を疑われて辞めた'], ['借金', '約120万円。母の入院費を立て替えたのが始まりと聞く'], ['前科・前歴', 'なし']]) });
      return [['shirai', '鍵の場所を知っていて、金に困っていそうなのは三人。', { scene: sc('shirai') }], ['shirai', '筋がいいのは元店員の久住ですな。辞め方が辞め方だ。'], ['todo', '甥は事件の夜、勤め先の夜勤で防犯カメラに映ってる。配達員も同じ。残るのは一人だろう。', { scene: sc('todo') }]]; } });
  A.push({ id: 'teguchi', who: 'staff', days: 1, label: '手口照会：同じ手口の前歴者', short: '手口照会', sub: '刃物で脅して縛る強盗の前歴者',
    done: S => { K.addDoc({ id: 'miyashita', title: '手口照会結果', kind: 'exc', evid: true, body: kv([['宮下 剛（みやした つよし・46歳）', '強盗の前歴1件（8年前、商店で店主を粘着テープで縛り現金を奪う）。<b>1年前に出所</b>。現住所は北見川の北、書店から約2km。身長168cm']]) });
      return [['oka', '手口の似た前歴者が一人。宮下剛、46歳。1年前に出所してます。', { scene: sc('oka') }], ['oka', '前の事件も、店主をテープで縛ってますね。']]; } });
  A.push({ id: 'camera', who: 'staff', days: 3, label: '防犯カメラのリレー捜査', short: '防犯カメラ', sub: '逃げた方向を追う',
    done: S => { K.addDoc({ id: 'camera', title: '防犯カメラ映像の解析報告', kind: 'inc', evid: true, body: P('書店から北へ約300mのコンビニエンスストア店頭カメラ。', '<b>21時52分</b>、灰色の上着を着た男が北へ歩く。顔は判別できない。推定身長170〜180cm。', '同時刻帯に画面を通過した男性は、ほかに4名。') });
      return [['noguchi', '21時52分、灰色の上着の男が北へ。顔は映ってません。', { scene: sc('noguchi') }]]; } });
  // 真相によって結果が変わる捜査：足を使えば、どちらの道かが見えてくる
  A.push({ id: 'camera3', who: 'staff', days: 4, label: '交差点から先のカメラを一軒ずつ当たる', short: '交差点の先のカメラ', sub: '住宅地の個人宅・店のカメラまで', cond: S => S.fin.camera2,
    done: S => { const G_ = S.c.truth === 'G';
      K.addDoc({ id: 'camera3', title: '防犯カメラ追跡報告（2）', kind: 'neu', evid: true, body: G_
        ? P('交差点から西へ約400m、コインランドリー店頭のカメラ（北見坂二丁目）：<b>22時09分</b>、灰色の上着の男が通過。両手に何も持っていない。', '同店の向かいは、久住透の住むコーポ北見。男が建物に入るところは画角の外。')
        : P('北見橋の歩道を照らす市のカメラ：<b>22時03分</b>、灰色の上着の男が橋を北へ渡る。<b>脇に緑色の四角い物</b>を抱えている。', '橋の北側（川北）は、宮下剛の住むアパートの方角。') });
      return [['noguchi', G_ ? '交差点から西に行ってます。コインランドリーのカメラに映ってました。……向かいが、久住のアパートです。' : '北見橋を渡ってます。脇に、緑色の箱みたいなものを抱えて。……橋の向こうは、宮下の家の方角です。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'miyaNeighbors', who: 'staff', days: 2, label: '宮下のアパートの聞き込み', short: '宮下宅周辺の聞き込み', sub: '事件の夜の出入り', cond: S => S.fin.teguchi,
    done: S => { const I = S.c.truth === 'I';
      K.addDoc({ id: 'miyaNeighbors', title: '宮下宅周辺の聞き込み結果', kind: 'neu', evid: true, body: I
        ? P('（隣室の住人・60代男性）', '10月2日は、夜の10時過ぎに宮下さんが帰ってきた。いつもは9時前には戻って、すぐ寝るのに。', 'ドアの前で、何か硬い物を置くような音がした。')
        : P('（隣室の住人・60代男性）', '10月2日？ 宮下さんは、夕方6時ごろ帰ってきて、それからは出ていないと思う。壁が薄いから、出入りは分かる。', '夜の10時ごろも、いびきが聞こえていた。') });
      return [['oka', I ? '宮下、事件の夜は10時過ぎに帰ってきてるそうです。いつもより遅かった。' : '宮下は、夕方に帰ってからは出ていないと。隣の人は、いびきまで聞いてます。', { scene: sc('oka') }]]; } });
  A.push({ id: 'camera2', who: 'staff', days: 4, label: 'カメラをさらに北へたどる', short: 'カメラの追跡', cond: S => S.fin.camera,
    done: S => { K.addDoc({ id: 'camera2', title: '防犯カメラ追跡報告', kind: 'neu', evid: true, body: P('男は22時01分、北見橋の手前の交差点を通過。以後、該当する人物は確認できない。', '北見橋の先には住宅地が広がり、カメラはほとんどない。') });
      return [['noguchi', '北見橋の手前で見失いました。その先は住宅地で、カメラがないんです。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'printDB', who: 'staff', days: 5, label: '粘着テープの指紋を照合する', short: '指紋の照合', sub: '前歴者のデータベースと',
    done: S => { K.addDoc({ id: 'printDB', title: '指紋照合結果', kind: 'neu', evid: true, body: P('粘着テープの粘着面から採取した指紋1個は不鮮明で、データベースの自動照合では該当者なし。', '特定の人物の指紋との個別の対照は可能。') });
      return [['oka', '自動照合では出ませんでした。不鮮明すぎるそうです。特定の人間となら、個別に対照できます。', { scene: sc('oka') }]]; } });
  A.push({ id: 'printK', who: 'staff', days: 3, label: '久住の指紋と対照する', short: '指紋の対照（久住）', cond: S => S.fin.printDB && (S.c.consentPrints || (S.c.arrest != null && S.c.target !== 'M')),
    done: S => { K.addDoc({ id: 'printK', title: '指紋鑑定書（久住）', kind: 'inc', evid: true, body: P('粘着テープの指紋と、久住透の左手中指の指紋は、<b>特徴点8点で合致</b>する。相違点は認められない。', '同一と判断する基準（12点）には達しない。', '結論：同一人のものと断定することはできない。') });
      return [['oka', '久住と8点合致。相違点なし。ただ、基準の12点には届きません。', { scene: sc('oka') }]]; } });
  A.push({ id: 'printM', who: 'staff', days: 3, label: '宮下の指紋と対照する', short: '指紋の対照（宮下）', cond: S => S.fin.printDB && S.fin.teguchi,
    done: S => { K.addDoc({ id: 'printM', title: '指紋鑑定書（宮下）', kind: 'exc', evid: true, body: P('粘着テープの指紋と、宮下剛の右手人差し指の指紋は、<b>特徴点7点で合致</b>する。相違点は認められない。', '同一と判断する基準（12点）には達しない。') });
      return [['oka', '……宮下とも7点合致です。こっちも相違点なし。', { scene: sc('oka') }], ['shirai', 'つまり、あの指紋じゃ誰とも決められないってことだ。', { scene: sc('shirai') }]]; } });
  A.push({ id: 'miyaAlibi', who: 'staff', days: 2, label: '宮下のアリバイを確かめる', short: '宮下の所在確認', cond: S => S.fin.teguchi,
    done: S => { K.addDoc({ id: 'miyaAlibi', title: '宮下の所在確認', kind: 'exc', evid: true, body: P('宮下は単身でアパートに住む。日雇いの仕事。', '本人は「10月2日の夜は家で寝ていた」と言う。裏付ける者はいない。否定する者もいない。') });
      return [['shirai', '宮下は「家で寝てた」と。一人暮らしで、確かめようがありません。', { scene: sc('shirai') }]]; } });
  A.push({ id: 'miyaTalk', who: 'self', label: '宮下に話を聴く', sub: '任意。相手は断れる', cond: S => S.fin.teguchi, run: async S => {
    G.drawScene(sc('miyashita', 'street'));
    await G.talk([['miyashita', '……また俺か。出てきてから、何かあるたびにこれだ。'], ['miyashita', '話すことはない。用があるなら令状を持ってこい。'], ['', '（ドアは閉められた。任意である以上、それ以上はできない。）']]);
  } });
  A.push({ id: 'miyaWarrant', who: 'self', label: '宮下の部屋の捜索令状を求める', sub: '課長に相談する', cond: S => S.fin.miyaAlibi && !S.c.miyaRefused, run: async S => {
    G.drawScene(sc('todo'));
    await G.talk([['todo', '宮下で令状？ 何を根拠に。前があって、アリバイがない。それだけだろう。'], ['todo', 'そんなもので部屋に入れたら、この国の前科者は全員捜索の対象だ。'], ['todo', '……それに、こっちには久住がいる。']]);
    S.c.miyaRefused = true;
  } });

  A.push({ id: 'neighborsK', who: 'staff', days: 2, label: '久住の自宅周辺の聞き込み', short: '久住宅周辺の聞き込み', sub: '事件の夜の様子', cond: S => S.fin.kandori,
    done: S => { K.addDoc({ id: 'neighborsK', title: '久住宅周辺の聞き込み結果', kind: 'neu', evid: true, body: P('（隣室の住人・20代男性）', 'あの人の部屋、夜はいつも野球の実況が聞こえてくるんですよ。壁が薄いんで。', '10月2日？ ……聞こえてた、と思います。いや、毎晩のことなんで、その日だったかと言われると……。') });
      return [['noguchi', '隣の部屋の人が「毎晩、野球の音がしてる」と。あの夜もたぶん、だそうです。……「たぶん」ですけど。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'register', who: 'self', label: '久住が辞めた事情を青柳さんに聞く', sub: 'レジの金の件', cond: S => S.fin.kandori && S.fin.victim, run: async S => {
    G.drawScene(sc('aoyagi', 'shop'));
    await G.talk([['aoyagi', 'あのお金のことは……あとで分かったんです。私の計算違いでした。'], ['aoyagi', '謝ろうと思っていたんです。でも、あの子はもう来なくなって。'], ['aoyagi', '……あの子が、恨んでいたとしても、仕方ないのかもしれません。']]);
    K.addDoc({ id: 'register', title: '被害者の供述（退職の経緯）', kind: 'neu', evid: true, body: P('（青柳静江）', '久住くんが辞めるきっかけになったレジの不足金は、後になって私の計算違いだったと分かりました。本人には伝えられていません。') });
  } });
  A.push({ id: 'waterway', who: 'staff', days: 4, label: '用水路沿いを捜す', short: '用水路の捜索', sub: '村井さんが見た男の行き先', cond: S => S.c.waterLead && !S.c.confession,
    done: S => { const c = S.c; const found = rnd() < .2;
      if (found) { c.safePre = true;
        K.addDoc({ id: 'safePre', title: '金庫の発見報告', kind: 'neu', evid: true, body: P('書店裏の用水路、裏口から約40m下流の水中から、緑色の手提げ金庫（空）を発見した。被害者が自店のものと確認。', '長く水に浸かっていたため、指紋は検出できなかった。') + note('金庫の場所は、もう「捜査側の知らない事実」ではなくなった。') });
        return [['shirai', '用水路から、緑の金庫が出ました。空です。指紋は、水で流れてる。', { scene: sc('shirai') }]]; }
      K.addDoc({ id: 'safeNone', title: '水路の捜索結果', kind: 'neu', body: P('書店周辺の用水路と北見川の一部を捜索したが、金庫は発見されなかった。') });
      return [['shirai', '水路と川をさらいましたが、何も。', { scene: sc('shirai') }]]; } });
  A.push({ id: 'phoneSeize', who: 'staff', days: 7, label: '久住のスマートフォンを解析する', short: 'スマホの解析', sub: '差押え（捜索差押許可状で）', cond: S => S.c.searchWarrant || S.c.search === 'legal',
    done: S => { K.addDoc({ id: 'phoneSeize', title: 'スマートフォン解析結果', kind: 'neu', evid: true, body: kv([['10月2日 21:26〜22:14', '動画アプリが前面で動作（端末の記録）'], ['位置情報', '設定が「オフ」のため記録なし'], ['10月3日 08:41', '検索「北見坂　古書店　強盗」'], ['その他', 'オンラインカジノのアプリ。9月中に多数の入出金']]) + note('事件を報じる最初のニュースは、10月3日午前7時。') });
      return [['oka', 'スマホの中身です。事件の翌朝8時41分に「北見坂 古書店 強盗」で検索してます。', { scene: sc('oka') }], ['shirai', '……気になって調べた、か。ニュースは7時に出てますがね。', { scene: sc('shirai') }]]; } });

  A.push({ id: 'muraiAgain', who: 'self', label: '村井さんにもう一度話を聴く', sub: '背の高さの食い違い', cond: S => S.c.muraiLead, run: async S => {
    G.drawScene(sc('murai', 'street'));
    await G.talk([['murai', '背……ですか。主人より低いと思ったんですけど、少し離れてたし、暗かったし。'], ['murai', '……あ、そういえば。その人、用水路のほうへ歩いていきました。裏の、細い水路の。'], ['murai', '言ってなかったかしら。ごめんなさい。']]);
    S.c.waterLead = true;
    K.addDoc({ id: 'murai2', title: '村井良子の供述（2回目）', kind: 'neu', evid: true, body: P('背の高さについては、少し離れていて暗かったため、はっきりしない。', '男は、書店裏の用水路のほうへ歩いていった。') });
  } });
  A.push({ id: 'customers', who: 'staff', days: 3, label: '常連客と出入りの業者を洗い直す', short: '出入りの洗い直し', sub: '鍵の場所を知っていた者', cond: S => S.c.customerLead,
    done: S => { K.addDoc({ id: 'customers', title: '常連客・出入り業者の洗い直し結果', kind: 'neu', evid: true, body: P('鍵の隠し場所を知りえた者は、常連客・配達員・古紙回収業者など少なくとも14人。うち事件当夜の所在が確認できない者は5人。')
        + (S.fin.teguchi ? P('青柳静江によれば、夏ごろ、宮下に似た男が一度、客として店に来たことがある。「裏口から入ってきて、驚いた覚えがある」という。') : P('青柳静江によれば、夏ごろ、見かけない中年の男が一度、裏口から入ってきたことがある。')) });
      return [['oka', '鍵を知りえた人間は、少なくとも14人。当夜の所在が分からないのが5人です。', { scene: sc('oka') }]].concat(S.fin.teguchi ? [['oka', 'それと……夏ごろ、宮下に似た男が店に来たことがあるそうです。裏口から。']] : []); } });
  A.push({ id: 'knife', who: 'staff', days: 5, label: '包丁を押収して鑑定する', short: '包丁の鑑定', cond: S => S.c.qKnife,
    done: S => { K.addDoc({ id: 'knife', title: '包丁の鑑定書', kind: 'neu', evid: true, body: P('被疑者方台所の文化包丁1本。血痕・繊維等は検出されない。一般に流通している製品で、本件に使用されたかどうかは判断できない。') });
      return [['oka', '包丁からは何も。どこにでもある包丁です。', { scene: sc('oka') }]]; } });
  A.push({ id: 'tapeBuy', who: 'staff', days: 3, label: '粘着テープの購入先を確かめる', short: 'テープの購入先', cond: S => S.c.qTape,
    done: S => { K.addDoc({ id: 'tapeBuy', title: '購入先の確認結果', kind: 'neu', evid: true, body: P('自白で述べられた店では、9月下旬に布粘着テープの現金購入が多数ある。購入者は特定できない。防犯カメラ映像は保存期間（14日）の経過で上書きされていた。') });
      return [['noguchi', 'テープは毎日何本も売れてて、誰が買ったかまでは……。カメラも上書き済みでした。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'routeCam', who: 'staff', days: 3, label: '自白した帰り道のカメラを確かめる', short: '帰り道のカメラ', cond: S => S.c.qRoute,
    done: S => { const r = S.c.qRoute;
      K.addDoc({ id: 'routeCam', title: '帰り道の防犯カメラ確認', kind: 'neu', evid: true, body: r === 'main'
        ? P('自白で述べられた「大通り」沿いのカメラ3台（21時40分〜22時20分）を確認したが、久住らしき人物は映っていない。') : P('自白で述べられた用水路沿いの道には、防犯カメラが設置されていない。') });
      return r === 'main' ? [['noguchi', '大通りのカメラ、3台とも見ましたけど……久住らしい人は映ってません。', { scene: sc('noguchi') }], ['shirai', '……映らないように歩いた、ってこともある。', { scene: sc('shirai') }]]
        : [['noguchi', '用水路沿いの道には、カメラがありませんでした。', { scene: sc('noguchi') }]]; } });

  /* ---------- 久住 ---------- */
  A.push({ id: 'ninni', who: 'self', label: '久住から任意で話を聴く', sub: '署に来てもらう。相手は帰ることもできる', cond: S => S.fin.kandori && S.c.arrest == null, run: async S => {
    const v = await G.openPaper({ title: '任意の事情聴取', body: P('久住透に任意で出頭を求め、話を聴く。', '被疑者は、逮捕・勾留されていなければ、いつでも退去できる（刑訴法198条1項ただし書）。'), noClose: true,
      buttons: [{ label: '話を聴き、指紋の任意提出を頼む', value: 'n' }, { label: '話すまで夜遅くまで帰さない', value: 'late', small: '任意捜査の限界を超えるおそれ' }, { label: 'やめる', value: null }] });
    if (!v) return false;
    G.audio.ambient('interro'); G.drawScene(sc('kuzumi', 'interro', 0));
    if (v === 'late') { S.c.lateVoluntary = true; G.meta.risk_late = true; }
    await G.talk([['kuzumi', '……青柳さんの店に強盗？ 本当ですか。'], ['you', '10月2日の夜9時半ごろ、どこにいましたか。'], ['kuzumi', '家です。一人で、動画を見てました。スマホで。'],
      ['you', '10月4日に、消費者金融に30万円返していますね。'], ['kuzumi', '……母に借りたんです。'], ['you', '指紋を取らせてもらえますか。'], ['kuzumi', '……どうぞ。やってないですから。']]
      .concat(v === 'late' ? [['', '（話は日付が変わるまで続いた。彼は何度も「帰っていいですか」と聞いた。）'], ['kuzumi', '……もう、帰らせてください。']] : []));
    G.audio.ambient(null);
    S.c.claim = true; S.c.consentPrints = true;
    K.addDoc({ id: 'claim', title: '久住の弁解', kind: 'memo', body: P('「10月2日の夜は自宅で一人、スマートフォンで動画を見ていた」', '「10月4日の返済30万円は、母に借りた」', '指紋の任意提出に応じた。') });
  } });
  A.push({ id: 'preserve', who: 'self', free: true, label: '通信履歴の保全を求める', sub: '197条3項', cond: S => false, run: async S => {
    S.c.preserveDay = S.day;
    await G.talk([['', '（動画配信事業者と携帯電話会社に、通信履歴を消去しないよう書面で求めた。最大60日。）', { sfx: 'type' }]]);
  } });
  A.push({ id: 'videoReq', who: 'staff', days: 1, label: '動画配信事業者に照会する', short: '動画配信の照会', sub: '海外事業者。回答に数週間', cond: S => S.c.claim,
    done: S => { const c = S.c; const exists = (c.preserveDay != null && c.preserveDay <= 27) || S.day <= 25;
      c.video = { req: S.day, arrive: S.day + 21 + Math.floor(rnd() * 20), exists };
      return [['oka', '照会書を送りました。海外の会社なので、回答は早くて3週間後だそうです。', { scene: sc('oka') }]]; } });
  function videoArrive(S) {
    const c = S.c, v = c.video;
    let body;
    if (!v.exists) body = P('照会の対象期間の通信記録は、保存期間（30日）の経過により<b>消去済み</b>。');
    else body = P('10月2日21時26分〜22時14分、当該アカウントで動画の再生が継続している。',
      '接続元：' + (c.truth === 'I' ? '<b>固定回線（光回線）。回線契約者は久住透、設置場所は同人の自宅。</b>' : '<b>携帯電話回線（モバイル通信）</b>。'));
    K.addDoc({ id: 'video', title: '動画配信事業者の回答', kind: (v.exists && c.truth === 'I') ? 'exc' : 'neu', evid: true, late: !inCustody(S) && c.arrest != null, body });
    return [['oka', '動画配信の会社から、回答が届きました。', { scene: sc('oka') }]];
  }
  A.push({ id: 'tail', who: 'staff', days: 3, label: '久住の行動確認', short: '行動確認', cond: S => S.fin.kandori && S.c.arrest == null,
    done: S => { K.addDoc({ id: 'tail', title: '行動確認報告', kind: 'neu', body: P('久住は日中ほとんど外出せず、夜間はコンビニに出る程度。自室の明かりは深夜まで点いている。不審な行動は確認できない。') });
      return [['noguchi', '3日見ましたが、ほとんど家から出ません。夜中まで明かりがついてます。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'loan', who: 'staff', days: 5, label: '消費者金融に照会する', short: '消費者金融の照会', sub: '197条2項', cond: S => S.fin.kandori,
    done: S => { K.addDoc({ id: 'loan', title: '消費者金融の回答書', kind: 'inc', evid: true, body: kv([['債務残高', '約120万円（事件前）'], ['返済', '<b>10月4日</b>、店頭で<b>現金30万円</b>'], ['それ以前', '8月以降、延滞が続いていた']]) });
      return [['oka', '事件の2日後に、現金で30万返してます。それまでは延滞続きでした。', { scene: sc('oka') }], ['shirai', '……出来すぎてますな。', { scene: sc('shirai') }]]; } });
  A.push({ id: 'mother', who: 'staff', days: 1, label: '母親に確かめる', short: '母への確認', cond: S => S.c.claim && S.fin.loan,
    done: S => { K.addDoc({ id: 'mother', title: '久住和子（母）の供述', kind: 'exc', evid: true, body: P('9月28日に、透がこっちに来たとき、現金で30万円渡しました。家に置いておいたお金です。', 'あの子は、人に刃物を向けるような子じゃありません。') });
      return [['mother', 'あの子に30万円、渡しました。家に置いてたお金です。……あの子は、そんな子じゃありません。'], ['noguchi', '口座から下ろした記録はないそうです。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'bank', who: 'staff', days: 10, label: '久住の銀行口座を照会する', short: '銀行口座の照会', sub: '197条2項。回答まで日数がかかる', cond: S => S.fin.loan,
    done: S => { S.c.casino = true;
      K.addDoc({ id: 'bank', title: '銀行の回答書', kind: 'inc', evid: true, body: kv([['10月1日', '入金　320,000円　振込人「ペイロード（カ」（決済代行業者）'], ['10月3日', '出金　300,000円　ATM'], ['9月中', '同社への送金（出金）が多数']])
        + note('同社は、海外のオンラインカジノの入出金の代行に使われていることが知られている。国内から賭ければ賭博罪（刑法185条）にあたる。') });
      const L = [['shirai', '主任、これを。10月1日に決済代行から32万入って、3日に30万下ろしてる。', { scene: sc('shirai') }], ['shirai', 'オンラインカジノですな。']];
      if (K.doc('mother')) L.push(['shirai', '「母に借りた」は嘘だ。母親も口を合わせてた。'], ['shirai', '……嘘をつく奴は、何かを隠してる。']);
      return L; } });

  // 被害者への誘導
  A.push({ id: 'victimSuggest', who: 'self', label: '被害者に「元店員の久住さんはどうか」と尋ねる', sub: '名前を出して確かめる', cond: S => S.fin.kandori && S.fin.victim,
    risk: { id: 'suggest', lure: '白井「ばあさん、本当は見当がついてるんじゃないですか。名前を出してやれば、思い出しますよ」', title: '名前を出して尋ねると、被害者の記憶が変わるおそれがある', law: '法律上の禁止規定はない。ただし、識別供述の信用性の問題になる',
      effects: ['被害者の記憶に、刑事が示した人物が混ざる', '後の面割りや法廷での証言が、その影響を受ける', '弁護人は、法廷でこの経緯を必ず尋ねる'] },
    run: async S => {
      G.drawScene(sc('aoyagi', 'soudan'));
      await G.talk([['you', '前にこちらで働いていた、久住さん。……背格好は、どうでしょう。'], ['aoyagi', '久住くん？ ……あの子が？'], ['aoyagi', '…………'], ['aoyagi', 'そう言われると……背格好は、似ていたような気がします。']]);
      S.c.victimSuggested = true;
      K.addDoc({ id: 'victim2', title: '被害者の供述調書（2通目）', kind: 'inc', evid: true, body: P('（青柳静江）', 'いま思うと、犯人の背格好は、以前うちで働いていた久住くんに似ていた気がします。') });
    } });
  // 面割り
  A.push({ id: 'lineup', who: 'self', label: '被害者に写真を見せる', sub: '面割り（犯人の識別）', cond: S => S.fin.kandori && S.fin.victim && S.c.lineup !== 'array' && S.c.lineup !== 'both', once: false, run: async S => {
    const c = S.c;
    const v = await G.openPaper({ title: '面割りの方法', body: P('被害者に写真を見せ、犯人かどうかを確かめる。') + (c.lineup === 'single' ? note('被害者はすでに久住の写真を1枚見ている。') : ''), noClose: false,
      buttons: (c.lineup ? [] : [{ label: '久住の写真を1枚だけ見せる', value: 'single', small: '早い' }]).concat([{ label: '8枚の写真から選んでもらう', value: 'array', small: '担当は誰が被疑者か知らない者にする' }]) });
    if (!v) return false;
    G.drawScene(sc('aoyagi', 'soudan'));
    const G_ = c.truth === 'G';
    if (v === 'single') {
      c.lineup = 'single'; c.lineupRes = 'single';
      await G.talk([['', '（久住の運転免許証の写真を、1枚だけ机に置く。）'], ['aoyagi', '……ええ。'], ['aoyagi', 'この人、だと思います。……たぶん。']]);
      const omit = await G.openPaper({ title: '写真面割り結果報告書', sub: '報告書に書く内容を決める', noClose: true, body: P('被害者は「この人だと思う。たぶん」と述べた。'),
        buttons: [{ label: '「示した写真は1枚」と書く', value: false }, { label: '方法は書かず、結果だけ書く', value: true, small: '読む人には、正式な面割りに見える' }] });
      c.lineupOmit = omit;
    } else {
      let res;
      if (c.lineup === 'single') res = 'K';
      else { const r = rnd() - (c.victimSuggested ? .2 : 0); res = G_ ? (r < .45 ? 'K' : r < .8 ? 'unsure' : 'filler') : (r < .25 ? 'K' : r < .7 ? 'unsure' : 'filler'); }
      c.lineupTaint = c.lineup === 'single';
      c.lineup = c.lineup === 'single' ? 'both' : 'array'; c.lineupRes = res;
      await G.talk(res === 'K' ? [['', '（8枚の写真。担当の野口は、どれが被疑者か知らない。）'], ['aoyagi', c.lineupTaint ? 'この人です。前にも見せてもらった人。' : '3番の人……だと思います。'], ['', '（3番は久住だった。）']]
        : res === 'unsure' ? [['', '（8枚の写真。担当の野口は、どれが被疑者か知らない。）'], ['aoyagi', 'ごめんなさい。暗くて……どれも違うような、どれも似ているような。']]
          : [['', '（8枚の写真。担当の野口は、どれが被疑者か知らない。）'], ['aoyagi', '6番……の人かしら。'], ['', '（6番は、捜査とは無関係の人物だった。）']]);
    }
    K.addDoc({ id: 'lineup', title: '写真面割り結果報告書', kind: (c.lineupRes === 'K' || c.lineupRes === 'single') ? 'inc' : 'exc', evid: true, body: S2 => {
      const rows = [];
      if (c.lineup === 'single' || c.lineup === 'both') rows.push([c.lineupOmit ? '面割り' : '単独面割り（写真1枚）', '被疑者の写真を示したところ、「この人だと思う。たぶん」と述べた。']);
      if (c.lineup === 'array' || c.lineup === 'both') rows.push(['写真8枚による面割り', { K: '3番（被疑者）を選んだ。', unsure: '「分からない」と述べ、選ばなかった。', filler: '6番（無関係の人物）を選んだ。' }[c.lineupRes] + (c.lineupTaint ? '<br>※事前に被疑者の写真1枚を見ている。' : '')]);
      return kv(rows); } });
  } });

  /* ---------- 逮捕 ---------- */
  function soumei(S) {
    const c = S.c, d = id => !!K.doc(id); let p = 0; const why = [];
    if (d('kandori')) { p += 1; why.push('鍵の場所を知る元店員'); }
    if (d('loan')) { p += 1; why.push('事件直後の30万円の返済'); }
    if (c.lineupRes === 'K') { p += 2; why.push('写真8枚から被害者が選んだ'); } else if (c.lineupRes === 'single') { p += 1.5; why.push('被害者の識別'); } else if (c.victimSuggested) { p += 1; why.push('被害者の「似ていた」'); }
    if (d('printK')) { p += 1; why.push('指紋8点合致'); }
    if (c.casino && d('mother')) { p += 1; why.push('返済金について嘘をついた'); }
    if (d('hearsay')) { p += .5; }
    if (d('camera3') && c.truth === 'G') { p += 1; why.push('カメラの男が久住のアパートの方へ'); }
    return { p, why };
  }
  A.push({ id: 'warrant', who: 'self', once: false, label: '逮捕状の請求を課長に上げる', sub: '罪名を決め、疎明資料をそろえて', primary: true,
    cond: S => !!S.c.target && !S.c.warrantPending && S.c.warrantReady !== 'honken' && (S.c.arrest == null || S.c.arrest_kind === 'bekken' || S.c.released) && !S.c.honkenArrested, run: async S => {
      G.drawScene(sc('todo'));
      const s = S.c.target === 'M' ? soumeiM(S) : soumei(S);
      if (S.c.target === 'M' && s.p >= 3) await G.talk([['todo', '宮下か。……前がある男だ。だが、前があるだけじゃ令状は出んぞ。']]);
      if (s.p < 3) { await G.talk([['todo', '……これで裁判官を説得できると思うか。'], ['todo', s.why.length ? s.why.join('、') + '。それだけじゃ弱い。' : '何もないじゃないか。'], ['todo', 'もう少し固めてこい。']]); return false; }
      const ch = await G.kit.chooseCharge(S, C, 'warrant'); if (!ch) return false;
      G.kit.forms.request(S, C);
      if (ch.id === 'chisho') await G.talk([['todo', '致傷？ 青柳さんにけがの診断書はないぞ。……まあいい、請求書はお前の名前だ。']]);
      await G.talk([['todo', s.why.join('、') + '。'], ['todo', '十分だ。請求する。'], ['', '（逮捕状は翌日発付される。）']]);
      S.c.warrantPending = { kind: 'honken', day: S.day };
    } });
  A.push({ id: 'warrantB', who: 'self', label: '賭博の容疑で逮捕状を請求する', sub: '別件。本命は強盗', cond: S => S.c.casino && S.c.arrest == null && !S.c.warrantPending && !S.c.warrantReady,
    risk: { id: 'bekken', lure: '課長「強盗で令状が取れないなら、賭博で引っ張れ。身柄さえ押さえれば、取調べの時間は手に入る」', title: '別件逮捕：本件（強盗）の取調べのために、別の罪で身柄を拘束する', law: '刑訴法199条。適法かどうかは学説・裁判例で判断が分かれる（条文帳「学説　別件逮捕・勾留」）',
      effects: ['裁判所が本件基準説などの立場を採れば、身柄拘束は違法とされ、その間に得た自白は証拠から外される', '別件基準説を採る裁判所なら、適法とされうる', 'どちらの立場が採られるかは、事前には分からない'], always: true },
    run: async S => {
      G.drawScene(sc('todo'));
      G.kit.forms.request(S, C, true);
      await G.talk([['todo', 'カジノか。……賭博で引っ張れるな。'], ['todo', '形式は整う。あとは取調室で、本命を聞けばいい。'], ['', '（賭博の逮捕状は翌日発付される。）']]);
      S.c.warrantPending = { kind: 'bekken', day: S.day };
    } });
  A.push({ id: 'arrestAct', who: 'self', once: false, label: S => S.c.target === 'M' && S.c.warrantReady === 'honken' ? '宮下を逮捕する' : '久住を逮捕する', sub: '逮捕状を執行する', primary: true, cond: S => !!S.c.warrantReady, run: async S => {
    if (S.c.target === 'M' && S.c.warrantReady === 'honken') return arrestM(S);
    const c = S.c, kind = c.warrantReady; c.warrantReady = null;
    G.audio.sfx('door'); G.drawScene(sc('kuzumi', 'street', 0));
    await G.talk([['you', '久住透さん。' + (kind === 'bekken' ? '賭博' : (G.kit.charge(S) || { label: '強盗' }).label) + 'の容疑で、逮捕状が出ています。'], ['kuzumi', '……え。'], ['kuzumi', 'やってません。僕は、やってません。'], ['', '（午前7時03分、通常逮捕。）', { sfx: 'metal' }]]);
    if (c.use220 && !c.search) {
      c.search = 'legal';
      await G.talk([['', '（逮捕の現場で、そのまま部屋を捜索した。刑訴法220条。令状は要らない。）', { scene: { bg: 'office' } }]].concat(searchDone(S, '220')));
    }
    if (kind === 'honken' && c.arrest != null && !c.released) { c.honkenArrested = true; c.rearrest = true; }
    if (kind === 'honken') c.honkenArrested = true;
    c.arrest = S.day; c.arrest_kind = kind; c.released = false;
    G.audio.cue('arrest');
    await G.talk(homeScene(2));
  } });
  // 別件で拘束中の再逮捕（本件）は warrant から

  /* ---------- 逮捕後 ---------- */
  // 釈放の進言（共通の部品は case-kit.js。読み込み順のため、実行時に取り出す）
  { let rel = null; const R = () => rel || (rel = G.kit.releaseAction(S => S.c.target === 'M' ? G.trial.estimate(S, TRIAL_M) : G.ending.estimate(S), (S, how) => finishCase(S, how)));
    A.push({ id: 'release', who: 'self', get label() { return R().label; }, get sub() { return R().sub; }, cond: S => R().cond(S), run: S => R().run(S) }); }
  A.push({ id: 'interro', who: 'self', once: false, label: '久住を取り調べる', sub: S => S.c.confession ? '自白の内容を確かめる' : '取調室で', primary: true, cond: S => inCustody(S), run: async S => interro(S) });
  A.push({ id: 'searchW', who: 'self', label: '捜索差押許可状を請求する', sub: '久住の部屋', cond: S => S.c.arrest != null && !S.c.search && !S.c.searchWarrant && !S.c.warrantPending, run: async S => {
    S.c.warrantPending = { kind: 'search', day: S.day };
    await G.talk([['', '（請求書を書き、裁判所へ送った。発付は翌日。）', { sfx: 'type' }]]);
  } });
  A.push({ id: 'searchLegal', who: 'staff', days: 1, label: '久住の部屋を捜索する', short: '捜索（令状あり）', cond: S => S.c.searchWarrant && !S.c.search, start: S => { S.c.search = 'legal'; },
    done: S => searchDone(S, 'legal') });
  A.push({ id: 'searchIllegal', who: 'staff', days: 1, label: '管理人に部屋を開けさせる', short: '居室の確認（令状なし）', sub: '令状を待たずに', cond: S => S.fin.kandori && !S.c.search && !S.c.searchWarrant,
    risk: { id: 'illegal', lure: '白井「令状を待ってる間に、母親が部屋を片づけに来たら終わりですよ。管理人は開けてくれます」', title: '令状なしで住居に立ち入る', law: '憲法35条、刑訴法218条1項', effects: ['見つけた物が、裁判で証拠として使えなくなる（違法収集証拠の排除）', '公判で、立ち入った捜査員が証人として追及される', '監察（内部調査）の対象になりうる', '誰かが、やっていない罪で裁かれる原因になりうる'] },
    start: S => { S.c.search = 'illegal'; }, done: S => searchDone(S, 'illegal') });
  function searchDone(S, kind) {
    K.addDoc({ id: 'jacket', title: kind !== 'illegal' ? '捜索差押調書' : '捜査報告書（居室の確認）', kind: 'inc', evid: true, illegal: kind === 'illegal', body:
      (kind === 'legal' ? P('捜索差押許可状に基づき、被疑者方居室を捜索した。') : kind === '220' ? P('被疑者方居室で被疑者を通常逮捕し、逮捕の現場において捜索差押えを行った（刑訴法220条1項2号）。スマートフォン1台も差し押さえた。') : P('管理人の承諾を得て、被疑者方居室に立ち入り、室内を確認した。<b>令状はない。本人の承諾もない。</b>'))
      + kv([['発見したもの', S.c.jacketGone ? '（灰色の上着は見当たらない）' : '灰色のナイロンジャケット1着（量販店の製品）'], ['発見されなかったもの', '刃物（台所の包丁を除く）、粘着テープ、多額の現金、手提げ金庫']]) });
    if (S.c.jacketGone) { const d = K.doc('jacket'); d.kind = 'neu'; return [['shirai', '……灰色の上着はありませんでした。捨てられた後ですな。', { scene: sc('shirai') }]]; }
    return [['shirai', '押入れに灰色のジャケットがありました。金も、金庫も、テープもなし。', { scene: sc('shirai') }]];
  }
  A.push({ id: 'fiber', who: 'staff', days: 7, label: 'ジャケットの繊維鑑定', short: '繊維鑑定', cond: S => !!S.c.search && !S.c.jacketGone,
    done: S => { const G_ = S.c.truth === 'G';
      K.addDoc({ id: 'fiber', title: '繊維鑑定書', kind: 'inc', evid: true, derive: 'jacket', body: P('現場の玄関マットの灰色の繊維片と、押収したジャケットの繊維は、色調・材質（ナイロン）・断面形状が<b>類似する</b>。', 'ただし量販品であり、同種の製品は全国で大量に流通している。同一の衣服に由来するかは判断できない。')
        + (G_ ? P('なお、ジャケットの右袖口から、<b>布製粘着テープの粘着剤と同じ成分</b>の付着物を検出した。') : P('ジャケットからは、粘着剤その他の付着物は検出されない。')) });
      return [['oka', '繊維は「類似」。量販品だそうです。' + (G_ ? '……それと、袖口に粘着テープの糊が付いてました。' : '袖口なんかにも、何も付いてません。'), { scene: sc('oka') }]]; } });
  A.push({ id: 'phoneBase', who: 'staff', days: 5, label: '携帯電話の基地局記録（令状）', short: '基地局記録', cond: S => S.c.arrest != null,
    done: S => { K.addDoc({ id: 'phoneBase', title: '携帯電話会社の回答', kind: 'neu', evid: true, body: P('10月2日21時〜22時30分、久住の携帯電話は「北見坂本町局」に接続。', 'この基地局の範囲は、<b>久住の自宅と青柳書房の双方を含む</b>。') });
      return [['oka', '基地局は、自宅と書店の両方をカバーしてる局でした。どっちとも言えません。', { scene: sc('oka') }]]; } });
  A.push({ id: 'safeSearch', who: 'staff', days: 2, label: '自白どおりに金庫を捜す', short: '金庫の捜索', cond: S => S.c.confession && S.c.confession.place !== 'none' && !S.c.safePre,
    done: S => {
      const c = S.c, cf = c.confession; let found = false;
      if (cf.place === 'yosui') found = rnd() < (c.truth === 'G' ? .6 : .25);   // 最寄りの水路。真犯人が誰であれ、捨てるならここだ
      c.safeFound = found;
      const where = cf.place === 'yosui' ? '書店裏の用水路' : '北見川（北見橋の下流）';
      K.addDoc({ id: 'safe', title: '金庫の捜索結果報告', kind: found ? 'inc' : 'exc', evid: true, stamps: found ? [{ t: '秘密の暴露', c: 'red' }] : [],
        body: found ? P(where + 'を捜索し、裏口から約40m下流の水中から<b>緑色の手提げ金庫（空）</b>を発見した。被害者が自店のものと確認した。', '金庫の所在は、捜査側が把握していなかった事実である。')
          : P('被疑者の供述に基づき、' + where + 'を2日間捜索したが、<b>金庫は発見されなかった</b>。水流で移動した可能性がある。') });
      if (found) G.audio.cue('confession');
      return found ? [['', '（胴長を履いた白井が、泥の中から何かを引き上げた。）', { scene: { bg: 'street' } }], ['shirai', '……ありました。緑の金庫だ。', { scene: sc('shirai', 'street') }], ['shirai', '秘密の暴露ですな。これで決まりだ。']]
        : [['', '（2日間、水の中を捜した。）', { scene: { bg: 'street' } }], ['shirai', '……出ません。流されたか。', { scene: sc('shirai', 'street') }]]; } });
  A.push({ id: 'hikiatari', who: 'self', label: '久住を現場に連れて行き、説明させる', sub: '引き当たり捜査', cond: S => !!S.c.confession && inCustody(S),
    risk: { id: 'hikiatari', lure: '課長「現場で説明させれば、調書に厚みが出る」', title: '現場を見せると、供述が現場に合わせて変わるおそれがある', law: '禁止規定はない。供述の信用性の問題', effects: ['現場の様子が、被疑者の供述に入り込む', '以後の供述が現場と一致しても、それが本人の記憶によるものか区別できなくなる'] },
    run: async S => {
      G.drawScene(sc('kuzumi', 'shop', ks(S)));
      await G.talk([['you', 'どこから入った。'], ['kuzumi', '……裏、から。'], ['', '（裏口、帳場、奥の照明。彼は一つずつ見て、一つずつ頷いた。）'], ['you', 'テープはどこで巻いた。'], ['kuzumi', '……ここ、ですか。']]);
      ['tape', 'safe', 'light'].forEach(x => { if (!S.c.leaks.includes(x)) S.c.leaks.push(x); });
      S.c.hikiatari = true;
      K.addDoc({ id: 'hikiatariDoc', title: '引き当たり捜査報告書', kind: 'inc', evid: true, body: P('被疑者を現場に同行させたところ、被疑者は侵入経路、被害者を縛った位置、金庫のあった場所を指示説明した。', '指示説明は、実況見分の結果とよく符合する。') });
    } });

  /* ---------- 取調べ ---------- */
  const LEAKS = {
    tape: [['', '（現場写真を机に置く。被害者の手首に巻かれた、布の粘着テープ。）'], ['you', '布のガムテープで、両手首を巻いた。そうだろう。'], ['kuzumi', '……知りません。']],
    safe: [['', '（緑色の手提げ金庫の写真を並べる。）'], ['you', 'この緑の金庫を抱えて、裏から出たんだろう。'], ['kuzumi', '知らないって……言ってるじゃないですか。']],
    light: [['you', '店は奥の明かりが一つ点いてるだけだった。暗いのを知ってたから、閉店後を狙ったんだ。'], ['kuzumi', '……']]
  };
  const POOL = {
    A: [
      S => [['kuzumi', '何度聞かれても、同じです。'], ['', '（彼は目を合わせない。それが何を意味するのかは、分からない。）']],
      S => [['you', '仕事は、物流会社の倉庫だったな。'], ['kuzumi', '朝8時から5時まで。棚から荷物を集める仕事です。'], ['kuzumi', '……会社には、何て伝わってるんですか。']],
      S => [['kuzumi', '青柳さんの店で、5年働きました。古い本の匂いが、好きで。'], ['kuzumi', 'レジの金が合わないって言われたとき、何も言い返せなかった。……それだけです。']],
      S => [['kuzumi', '母は、元気ですか。'], ['you', '……'], ['', '（接見禁止が付いている。弁護人以外とは、家族とも会えない。）']],
      S => [['kuzumi', 'あの夜見てたのは、昔のプロ野球の試合です。動画の履歴を見てもらえば分かる。'], ['you', '履歴は、どこで見ても残る。'], ['kuzumi', '……そうですね。']],
      S => [['', '（彼は黙ったまま、机の木目を指でなぞっている。）'], ['kuzumi', '弁護士さんは、話さなくていいって言ってました。'], ['kuzumi', 'でも、やってないってことだけは、言っておきます。']],
      S => S.c.casino ? [['you', 'お母さんに借りたというのは、嘘だったな。'], ['kuzumi', '……カジノのことは、すみません。母にも嘘をつかせた。'], ['kuzumi', 'でも、強盗はやってない。']] : null,
      S => S.c.fired ? [['kuzumi', '会社、契約を切られたって、弁護士さんから聞きました。'], ['kuzumi', 'やってないのに。……ここを出ても、もう何もない。']] : null,
      S => [['kuzumi', '刑事さんは、僕がやったと思ってるんですよね。'], ['you', '思っているかどうかは、関係ない。'], ['kuzumi', '……関係、ないんですか。']]
    ],
    B: [
      S => S.fin.loan ? [['you', '事件の2日後、30万円を現金で返したな。'], ['kuzumi', '……カジノで、勝ったんです。たまたま。'], ['you', 'たまたま、か。']] : null,
      S => K.doc('printK') ? [['you', 'テープの指紋が、お前の指紋と8点合っている。'], ['kuzumi', '8点って……合ってるってことなんですか。'], ['', '（12点に届かないことは、言わなかった。）']] : null,
      S => (S.c.lineupRes === 'K' || S.c.lineupRes === 'single') ? [['you', '青柳さんが、写真でお前を選んだ。'], ['kuzumi', '……青柳さんが？'], ['', '（彼の顔から、血の気が引いた。）']] : null,
      S => S.c.search ? [['you', '灰色のジャケット。お前の部屋にあった。'], ['kuzumi', 'あれは、ユニクロのです。誰でも持ってる。']] : null,
      S => [['', '（同じ写真を、もう一度並べる。）'], ['kuzumi', 'もう、見たくないです。']]
    ],
    C: [
      S => [['', '（取調べは朝9時から、午後11時過ぎまで続いた。）'], ['kuzumi', '……眠らせてください。'], ['you', '話せば終わる。']],
      S => [['', '（今日も、日付が変わる少し前まで。）'], ['kuzumi', '頭が、回らないんです。何を言ったか、もう分からない。']],
      S => [['', '（昼食の時間を除いて、13時間。）'], ['kuzumi', '同じことを何回言えばいいんですか。'], ['you', '本当のことを言うまでだ。']],
      S => [['', '（午後10時。彼は椅子の上で、何度も船を漕いだ。）'], ['you', '起きろ。']]
    ],
    D: [
      S => [['you', '認めれば、執行猶予だってありうる。すぐ出られるんだ。お母さんも安心する。'], ['kuzumi', '……本当、ですか。']],
      S => [['you', '話してくれれば、接見禁止を解くよう検事に言ってやる。お母さんに会えるぞ。'], ['kuzumi', '……母に。']],
      S => [['you', '否認を続けたら、裁判は長引く。保釈も出ない。何年も出られないぞ。'], ['kuzumi', '……']]
    ],
    E: [
      S => [['you', 'いい加減にしろ！ お前しかいないんだよ！', { sfx: 'thud' }], ['', '（机を叩く音が、取調室に響いた。）'], ['kuzumi', '……っ。']],
      S => [['you', 'お前の母親も、口裏を合わせた。母親もここに呼ぶことになるぞ。'], ['kuzumi', '母は関係ない！ やめてください……！']],
      S => [['', '（椅子のすぐ横に立ち、耳元で同じ質問を繰り返す。1時間。）'], ['kuzumi', '……もう、やめて、ください。']]
    ]
  };
  function poolLines(S, k) {
    const c = S.c; c.used = c.used || {}; const used = c.used[k] = c.used[k] || [];
    const pool = POOL[k];
    for (let i = 0; i < pool.length; i++) { if (used.includes(i)) continue; const L = pool[i](S); if (L) { used.push(i); return L; } }
    c.used[k] = []; for (let i = pool.length - 1; i >= 0; i--) { const L = pool[i](S); if (L) return L; }
    return [['kuzumi', '……']];
  }
  async function afterConfession(S) {
    const c = S.c, Gw = c.truth === 'G', cf = c.confession; c.asked = c.asked || {};
    if (c.retractCustody) { await G.talk([['kuzumi', 'やってません。前に言ったことは、本当じゃない。'], ['', '（彼はそれ以上、何も答えなかった。）']]); return; }
    const topics = [
      { k: 'knife', label: '刃物について聞く', small: '何を使い、どこにある' },
      { k: 'tape', label: '粘着テープの入手先を聞く', small: '' },
      { k: 'route', label: '店を出てからの道順を聞く', small: '' },
      { k: 'money', label: '奪った金の使い道を聞く', small: '' },
      { k: 'why', label: 'なぜ青柳書房だったのかを聞く', small: '' }
    ].filter(t => !c.asked[t.k]);
    if (!topics.length) await G.talk([['', '（自白の中身は、もう一通り聞いた。これ以上は何も話さなそうだ。）']]);
    const k = await G.openPaper({ title: '取調べ（自白の裏付け）', body: P('自白の内容を、細かく確かめる。答えが本当なら、裏付けが取れるはずだ。'), noClose: true,
      buttons: topics.map(t => ({ label: t.label, value: t.k, small: t.small })).concat([{ label: '雑談をする', value: '_chat', small: '事件以外の話' }, { label: '何か話すまで続ける', value: '_push', small: '夜まで' }, { label: '今日はやめておく', value: null, small: '時間は使わない' }]) });
    if (!k) return false;
    if (k === '_chat') {
      await G.talk(G.kit.poolLines(S, [S2 => [['kuzumi', '青柳書房の本、まだ並んでますか。……全集の棚、僕が並べたんです。']], S2 => [['kuzumi', '母、ちゃんと食べてるかな。']], S2 => [['kuzumi', '倉庫の仕事、嫌いじゃなかったんです。黙ってできるから。']]], 'chat'));
      if (!Gw && !cf.voluntary && rnd() < .2) { c.retractCustody = true; await G.talk([['kuzumi', '……刑事さん。やっぱり、やってません。'], ['', '（彼は、自白を撤回した。）']]); }
      return;
    }
    if (k === '_push') {
      if (!(await G.confirmRisk(G.kit.RISK(false, 0).C))) return false;
      c.sess.C++;
      await G.talk([['', '（夜まで続けた。）'], ['kuzumi', '……書いてあるとおりです。もう、それでいいでしょう。']]);
      return;
    }
    c.asked[k] = true;
    const vague = !Gw;  // 犯人でなければ、知らないことは曖昧になる
    let L;
    if (k === 'knife') { c.qKnife = true; L = vague ? [['kuzumi', '……包丁、だったと思います。'], ['you', 'どの包丁だ。'], ['kuzumi', '台所の……たぶん。']] : [['kuzumi', '台所の文化包丁です。終わってから、洗って戻しました。']]; }
    else if (k === 'tape') { c.qTape = true; L = vague ? [['kuzumi', '……コンビニ、だったかな。いや、ホームセンター……'], ['you', 'どっちだ。'], ['kuzumi', 'ホームセンター、です。']] : [['kuzumi', '駅前のホームセンターです。前の週に。']]; }
    else if (k === 'route') { const main = vague || rnd() < .2; c.qRoute = main ? 'main' : 'water'; L = main ? [['kuzumi', '大通りを……北に、まっすぐ。'], ['you', '大通りだな。'], ['kuzumi', '……たぶん。']] : [['kuzumi', '裏の用水路沿いの道を北へ。暗いから、人に会わないと思って。']]; }
    else if (k === 'money') L = [['kuzumi', '30万は借金に。残りは……使いました。何に使ったかは、覚えてないです。']];
    else L = vague ? [['kuzumi', '……知ってる店だったから。'], ['you', 'それだけか。'], ['kuzumi', '……それだけです。']] : [['kuzumi', '鍵の場所を知ってたから。……それに、あの人に、辞めさせられたと思ってたから。']];
    await G.talk(L);
    if (!Gw && !cf.voluntary && rnd() < .25) { c.retractCustody = true; await G.talk([['kuzumi', '……刑事さん。'], ['kuzumi', 'やっぱり、やってません。前に言ったことは、本当じゃない。'], ['', '（彼は、自白を撤回した。）']]); }
  }
  async function interro(S) {
    const c = S.c; c.sess = c.sess || { A: 0, B: 0, C: 0, D: 0, E: 0 }; c.sess.E = c.sess.E || 0; c.leaks = c.leaks || [];
    const lure = G.kit.lure(S); if (lure) await G.talk(lure);
    G.audio.ambient('interro'); G.drawScene(sc('kuzumi', 'interro', ks(S)));
    if (c.rightsDay !== S.day) { if (!(await G.kit.rights(S, 'kuzumi'))) { G.audio.ambient(null); return false; } c.rightsDay = S.day; }
    if (c.confession) { const r = await afterConfession(S); G.audio.ambient(null); return r; }
    const total = c.sess.A + c.sess.B + c.sess.C + c.sess.D + c.sess.E;
    await G.talk(total === 0 ? [['', '（久住透。34歳。痩せている。）'], ['kuzumi', '……何回聞かれても、やってないです。']] : [['kuzumi', G.pick(['……また、ですか。', '……おはようございます。', '……'])]]);
    const k0 = await G.openPaper({ title: '取調べ', sub: c.arrest_kind === 'bekken' ? '拘束の理由は賭博。だが、聞くのは強盗のことだ。' : '', noClose: true, body: P('どう進めるか。', '（どの進め方が法的に許されるかは、「条文帳を開く」で、刑訴法198条・319条と判例を確かめられる。）'),
      buttons: [{ label: '弁解を聴く', value: 'A', small: '言い分をそのまま聴き取る' },
        { label: '証拠を示して追及する', value: 'B', small: c.leaks.length < 3 ? '現場の写真や、集めた証拠を突きつける' : '集めた証拠を突きつける' },
        { label: '休憩を入れて、夕方まで追及する', value: 'F', small: '朝9時から夕方まで。昼食と休憩をはさむ' },
        { label: '夜まで取調べを続ける', value: 'C', small: '朝9時から、話すまで' },
        { label: '「現場からお前の指紋が出た」と告げる', value: 'G', small: '照合の結果は、まだはっきりしない。反応を見る' },
        { label: '怒鳴りつけ、追い詰める', value: 'E', small: '机を叩く。家族のことを持ち出す' },
        { label: '「認めれば、すぐ出られる」と言う', value: 'D', small: '取引を持ちかける' }, { label: 'やめておく', value: null, small: '時間は使わない' }, { label: '条文帳を開く', value: 'law', small: '刑訴法198条・319条、判例' }] });
    if (k0 === 'law') { await G.openLaw('判例・学説'); return interro(S); }
    if (!k0) { G.audio.ambient(null); return false; }
    const k = k0 === 'F' ? 'A' : k0 === 'G' ? 'D' : k0;   // F（休憩を入れた取調べ）は A と同じ扱い、G（偽計）は D と同じ扱い
    const RISK = {
      C: { id: 'long', title: '長時間の取調べ', law: '憲法38条2項、刑訴法319条1項', lure: (c.meter || 0) >= 55 ? '白井「あいつ、もう限界ですよ。今夜詰めれば、落ちます」' : '白井「時間をかければ、人は話すもんです」', effects: ['得た自白が、任意性を欠くとして証拠から外されうる', '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] },
      D: { id: 'promise', title: '利益を約束して自白を求める', law: '刑訴法319条1項（判例：約束による自白）', lure: '白井「家族の話をすると、たいてい落ちますよ」', effects: ['得た自白が、任意性を欠くとして証拠から外されうる', '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] },
      E: { id: 'threat', title: '脅迫的な取調べ', law: '憲法38条2項、刑訴法319条1項', lure: '課長「否認してる奴に遠慮してどうする」', effects: ['得た自白が、脅迫による自白として証拠から外されうる', '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] }
    };
    if (k0 === 'G') RISK.D = Object.assign({}, RISK.D, { id: 'trick', title: '偽計を用いた取調べ', law: '憲法38条2項、刑訴法319条1項（判例：偽計による自白）', lure: '白井「ハッタリですよ。みんなやってます」' });
    if (RISK[k] && !(await G.confirmRisk(RISK[k]))) { G.audio.ambient(null); return false; }
    if (k0 === 'G') c.trick = (c.trick || 0) + 1;
    c.sess[k]++; if (c.arrest_kind === 'bekken') c.bekkenInterro = (c.bekkenInterro || 0) + 1;
    const n = c.sess[k]; let lines;
    if (k0 === 'F') lines = [['', '（昼食と休憩をはさみ、夕方まで、あの夜の行動を一つずつ確かめた。）'], ['kuzumi', '……家にいました。何度聞かれても、同じです。']];
    else if (k0 === 'G') lines = [['you', '粘着テープから、お前の指紋が出たぞ。'], ['kuzumi', '……え。'], ['', '（久住の顔から、血の気が引いた。……照合の結果は、同一と言えるほどではなかった。）']];
    else if (k === 'A' && n === 1) lines = [['you', 'あなたには、言いたくないことは言わなくていい権利がある。そのうえで聞く。'], ['kuzumi', 'やってません。あの夜は、家で動画を見てました。'], ['kuzumi', '青柳さんには、世話になったんです。辞めたのだって……僕が盗ったわけじゃない。']];
    else if (k === 'B') { const nx = ['tape', 'safe', 'light'].find(x => !c.leaks.includes(x)); if (nx) { c.leaks.push(nx); lines = LEAKS[nx].slice(); } else lines = poolLines(S, 'B'); }
    else lines = poolLines(S, k);
    const inc = { A: { G: 8, I: 4 }, B: { G: 18, I: 14 }, C: { G: 32, I: 30 }, D: { G: 30, I: 30 }, E: { G: 28, I: 26 } }[k][c.truth] + (c.fired ? 5 : 0);
    c.meter = (c.meter || 0) + inc;
    let confess = c.meter >= 100, voluntary = false;
    if (!confess && k === 'A' && c.truth === 'G' && n >= 2 && rnd() < .18) { confess = true; voluntary = true; }
    await G.talk(lines);
    if (confess) await makeConfession(S, voluntary);
    else {
      const d = custodyDay(S);
      if (c.meter >= 70) await G.talk([['shirai', '主任……あいつ、そろそろですよ。あと一押しすれば、落ちます。', { scene: sc('shirai') }]]);
      else if (d >= 10 && c.meter < 45) await G.talk([['shirai', 'このままじゃ満期です。……やり方、考えたほうがいいんじゃないですか。', { scene: sc('shirai') }]]);
    }
    G.audio.ambient(null);
  }
  async function makeConfession(S, voluntary, opt) {
    opt = opt || {};
    const c = S.c, Gw = c.truth === 'G', det = {};
    ['tape', 'safe', 'light'].forEach(x => { det[x] = c.leaks.includes(x) ? true : (Gw ? rnd() < .8 : false); });
    const r = rnd();
    const place = Gw ? (r < .7 ? 'yosui' : r < .8 ? 'river' : 'none') : (r < .4 ? 'yosui' : r < .7 ? 'river' : 'none');
    if (opt.by === 'todo') await G.talk([['todo', '落ちたぞ。調書はお前が巻け。', { scene: sc('todo') }]]);
    else await G.talk(voluntary ? [['kuzumi', '……もう、いいです。'], ['kuzumi', '僕が、やりました。青柳さんに、謝りたい。']] : [['kuzumi', '……分かりました。'], ['kuzumi', '僕が、やりました。']]);
    G.audio.cue('confession');
    const form = opt.by === 'todo' ? 'story' : await G.openPaper({ title: '供述調書の作成', sub: 'どの形式で録取するか', noClose: true, body: P('被疑者の供述を調書にする。'),
      buttons: [{ label: '一問一答で書く', value: 'qa', small: '問いと答えをそのまま記録する。読みにくい' }, { label: '物語式で書く', value: 'story', small: '一人称の文章にまとめる。課長も検事もこちらを好む' }] });
    c.confession = { voluntary, det, place, day: S.day, form, custodyDay: custodyDay(S), by: opt.by || 'you' };
    K.addDoc({ id: 'confession', title: '被疑者の供述調書（自白）', kind: 'inc', evid: true, body: () => confessionBody(c) });
    await G.talk([['', form === 'story' ? '（あなたが文章にまとめ、読み聞かせる。彼は、言われた場所に署名した。）' : '（問いと答えを書きとめ、読み聞かせる。彼は、言われた場所に署名した。）', { sfx: 'pen' }]]);
    if (!S.staffGone.oka) { K.loseStaff('oka'); await G.talk([['todo', '自白したか。よし、岡は別件に回す。', { scene: sc('todo') }]]); }
  }
  function confessionBody(c) {
    const cf = c.confession, d = cf.det, lk = x => c.leaks.includes(x);
    const disp = { yosui: '店の裏の用水路に投げ捨てました。', river: '北見川の橋の上から投げ捨てました。', none: 'どこに捨てたかは、よく覚えていません。' }[cf.place];
    if (cf.form === 'story') {
      return P('私は、10月2日の夜9時半すぎ、青柳書房の裏口から店に入りました。裏口の鍵が植木鉢の下にあることは、働いていたころから知っていました。',
        '店の中は、' + (d.light ? '奥の明かりがひとつ点いているだけで、暗かったです。' : '電気がついていて、明るかったです。'),
        '青柳さんに家の包丁を見せて「金を出せ」と言いました。' + (d.tape ? '持っていた布のガムテープで、青柳さんの両手首を巻きました。' : '持っていたビニールひもで、青柳さんの手を縛りました。'),
        (d.safe ? '帳場の緑色の手提げ金庫' : '帳場の黒っぽい金庫') + 'を持って裏口から出ました。中には38万円くらい入っていたと思います。金庫は、' + disp, 'お金は借金の返済に使いました。',
        '<span style="font-size:13px">以上のとおり録取して読み聞かせたところ、誤りのないことを申し立て署名指印した。</span>');
    }
    const qa = (q, a) => '<p class="qa">問　' + q + '</p><p class="qa">答　' + a + '</p>';
    return qa('10月2日の夜、青柳書房に入ったのは君だな。', 'はい。') + qa('どこから入った。', '裏口です。鍵が植木鉢の下にあるのは知ってました。')
      + (lk('light') ? qa('店は奥の明かりだけで暗かったな。', '……はい。') : qa('店の中の明るさは。', d.light ? '奥のほうだけ、明かりがついてました。' : '明るかったです。'))
      + (lk('tape') ? qa('布のガムテープで両手首を巻いたな。', 'はい。') : qa('青柳さんの手は何で縛った。', d.tape ? '布のガムテープです。' : 'ビニールひもだったと思います。'))
      + (lk('safe') ? qa('緑の金庫を持って出たんだな。', 'はい。') : qa('何を盗った。', d.safe ? '緑の手提げ金庫です。' : '黒っぽい金庫です。'))
      + qa('金庫はどうした。', disp) + note('問いの中に、取調官の側から示された事実が含まれている。');
  }

  /* ---------- 被疑者を絞る：候補の札と、宮下を追う道 ----------
     c.target：'K'（久住を追う）／'M'（宮下を追う）。逮捕状の請求には、追う人物を決めておく必要がある。
     真相（c.truth）が 'I' の世界では、宮下が犯人。 */
  const has = id => !!K.doc(id);
  // 札に並べる事情：[疑わしいか（true◯／false×／null・）, 文, 強さ 1〜3]。強さは、その事情だけで犯人と言える度合い
  C.people = S => {
    const c = S.c, out = [];
    if (S.fin.kandori) {
      const f = [];
      f.push([true, '裏口の鍵の隠し場所を知っていた元店員（知っていた者はほかにもいる）', 1]);
      if (has('register')) f.push([true, 'レジの不足金を疑われて辞めた。恨んでいたかもしれない', 1]);
      if (has('loan')) f.push([true, '事件の2日後、現金30万円を返済している', 1]);
      if (c.lineupRes === 'K') f.push([true, '被害者が写真8枚から選んだ', c.lineupTaint ? 1 : 2]); else if (c.lineupRes === 'single') f.push([true, '被害者が写真1枚を見て「たぶん」', 1]); else if (c.lineupRes) f.push([false, '写真8枚の面割りで、被害者は選ばなかった', 1]);
      if (has('printK')) f.push([true, '粘着テープの指紋と8点合致（同一の基準12点には届かない）', 1]);
      if (has('claim')) f.push([null, '弁解：「その夜は家で動画を見ていた」', 0]);
      if (has('neighborsK')) f.push([false, '隣人「あの夜も野球の音がしていた……たぶん」', 1]);
      if (has('phoneSeize')) f.push([false, '21:26〜22:14、スマホで動画アプリが動いていた', 1]);
      if (has('fiber')) f.push(c.truth === 'G' ? [true, 'ジャケットの袖口に、粘着テープの糊', 3] : [false, 'ジャケットに粘着剤などの付着はない', 1]);
      if (has('camera3')) f.push(c.truth === 'G' ? [true, '22:09、灰色の上着の男が久住のアパートの向かいを通った', 3] : [false, 'カメラの男は北見橋を北へ渡った（久住の家とは逆の方角）', 3]);
      if (has('video') && c.video && c.video.exists) f.push(c.truth === 'I' ? [false, '犯行時刻、久住の自宅の固定回線で動画が再生されていた', 3] : [null, '動画は携帯回線で再生。家にいたとも外にいたとも言えない', 0]);
      out.push({ id: 'K', who: 'kuzumi', name: '久住 透', sub: '34歳・元アルバイト店員', facts: f });
    }
    if (S.fin.teguchi) {
      const f = [];
      f.push([true, '8年前、店主を粘着テープで縛る強盗の前歴。1年前に出所（前歴だけで犯人とは言えない）', 1]);
      if (has('printM')) f.push([true, '粘着テープの指紋と7点合致（同一の基準12点には届かない）', 1]);
      if (has('miyaAlibi')) f.push([true, 'その夜は「家で寝ていた」。裏付ける者はいない', 1]);
      if (has('customers')) f.push([true, '夏ごろ、宮下に似た男が裏口から店に入ってきたことがある', 1]);
      if (has('murai')) f.push([null, '身長168cm。村井さんは「背はそんなに高くなかった」', 0]);
      if (has('tailM')) f.push(c.truth === 'I' ? [true, '事件の後、パチンコ店で新しい1万円札を何枚も使っている', 2] : [false, '行動確認：日雇いの仕事に通うだけ。金回りの変化はない', 1]);
      if (S.fin.miyaTalk) f.push([null, '任意の聴取は拒んだ。「用があるなら令状を持ってこい」', 0]);
      if (has('camera3')) f.push(c.truth === 'I' ? [true, '22:03、緑色の箱を抱えた男が北見橋を北へ（宮下の家の方角）', 3] : [false, 'カメラの男は久住のアパートの方へ向かった', 3]);
      if (has('miyaNeighbors')) f.push(c.truth === 'I' ? [true, '事件の夜、いつもより遅い10時過ぎに帰宅', 2] : [false, '隣人：その夜は夕方から家にいた（いびきも聞こえた）', 3]);
      out.push({ id: 'M', who: 'miyashita', name: '宮下 剛', sub: '46歳・同じ手口の前歴者', facts: f });
    }
    return out;
  };
  C.canTarget = S => S.c.arrest == null && !S.c.warrantPending && !S.c.warrantReady;
  C.setTarget = async (S, id) => {
    S.c.target = id;
    await G.talk([id === 'M' ? ['shirai', '宮下ですか。……課長は久住で決まりだと思ってますよ。まあ、主任が決めることだ。', { scene: sc('shirai') }]
      : ['shirai', '久住ですね。了解です。', { scene: sc('shirai') }]]);
  };
  function soumeiM(S) {
    const c = S.c; let p = 0; const why = [];
    if (has('miyashita')) { p += .5; why.push('同じ手口の前歴'); }
    if (has('printM')) { p += 1; why.push('指紋7点合致'); }
    if (has('miyaAlibi')) { p += .5; why.push('アリバイがない'); }
    if (has('customers')) { p += 1; why.push('夏に裏口から入った似た男'); }
    if (has('tailM') && c.truth === 'I') { p += 1; why.push('事件後の金回り'); }
    if ((S.compared || {})['camera2|miyashita']) { p += .5; why.push('逃走方向が宮下の家に向かう'); }
    if (has('camera3') && c.truth === 'I') { p += 1; why.push('金庫らしい物を抱えて北見橋を渡った男'); }
    if (has('miyaNeighbors') && c.truth === 'I') { p += .5; why.push('事件の夜の遅い帰宅'); }
    return { p, why };
  }
  function elementsM(S) {
    const c = S.c, conf = !!c.confession;
    let who = (has('printM') ? 1 : 0) + (has('customers') ? 1 : 0) + (has('searchM') && c.truth === 'I' ? 1 : 0) + (c.safeFoundM ? 2 : 0) + (has('tailM') && c.truth === 'I' ? .5 : 0);
    return [
      { k: '犯人性', v: conf ? 3 : Math.min(3, Math.floor(who)), conf: conf && !c.safeFoundM, src: [has('printM') && '指紋', has('customers') && '出入り', c.safeFoundM && '金庫'].filter(Boolean).join('・') },
      { k: '犯行態様', v: conf ? 3 : has('victim') ? 2 : 1, conf },
      { k: '被害', v: c.safeFoundM ? 3 : has('victim') ? 2 : 1 },
      { k: '動機', v: Math.min(3, (has('tailM') ? 1 : 0) + (conf ? 1 : 0)) }
    ];
  }
  // 久住を追うときだけの捜査
  const KUZ_ONLY = 'ninni tail warrantB interro searchW searchLegal searchIllegal fiber phoneSeize phoneBase safeSearch hikiatari'.split(' ');
  A.forEach(a => { if (!a || !KUZ_ONLY.includes(a.id)) return; const old = a.cond; a.cond = S => S.c.target !== 'M' && (!old || old(S)); });
  A.push({ id: 'tailM', who: 'staff', days: 3, label: '宮下の行動確認', short: '行動確認（宮下）', sub: '金回りや、出入りする場所', cond: S => S.c.target === 'M' && S.c.arrest == null,
    done: S => { const I = S.c.truth === 'I';
      K.addDoc({ id: 'tailM', title: '宮下の行動確認報告', kind: I ? 'inc' : 'exc', evid: true, body: I ? P('宮下は日中、駅前のパチンコ店に通っている。10月5日、6日、店内で<b>新しい1万円札</b>を計9枚、玉に替えた。', '日雇いの仕事には、事件の後、一度も出ていない。') : P('宮下は毎朝6時に家を出て、市内の建設現場で日雇いの仕事をしている。夜は自宅に戻る。', '金回りに目立った変化はない。') });
      return I ? [['noguchi', '宮下、事件のあと仕事に出てません。パチンコ屋で新札をばらまいてます。', { scene: sc('noguchi') }]] : [['noguchi', '宮下は毎朝現場に出てます。……真面目なもんですよ。', { scene: sc('noguchi') }]]; } });
  async function arrestM(S) {
    const c = S.c; c.warrantReady = null;
    G.audio.sfx('door'); G.drawScene(sc('miyashita', 'street'));
    await G.talk([['you', '宮下剛さん。' + (G.kit.charge(S) || { label: '強盗' }).label + 'の容疑で、逮捕状が出ています。'], ['miyashita', '……やっぱり、こうなるか。'], ['miyashita', '前があるってのは、こういうことだ。'], ['', '（午前6時10分、通常逮捕。）', { sfx: 'metal' }]]);
    c.arrest = S.day; c.arrest_kind = 'honken'; c.honkenArrested = true; c.released = false;
    G.audio.cue('arrest');
  }
  function morningM(S, L) {
    const c = S.c, d = custodyDay(S);
    if (d === 1) { K.addDoc({ id: 'news', title: '新聞記事', kind: 'memo', body: P('<b>古書店強盗　46歳の男を逮捕　同種の前歴</b>', '北見坂署は、北見坂市本町の古書店で店主の女性（68歳）を粘着テープで縛り、現金約38万円を奪ったとして、無職宮下剛容疑者（46歳）を逮捕した。同容疑者は8年前にも同種の事件で服役している。') });
      L.push(['', '（朝刊に、宮下の名前と前歴が載った。）', { scene: { bg: 'office' } }], ['todo', '……宮下で行くと決めたのはお前だ。外したら、久住も取り逃がすぞ。', { scene: sc('todo') }]); }
    if (d === 2) L.push(['', '（48時間。宮下は検察官に送致された。）'], ['kenji', '担当の検事です。勾留を請求します。……前歴だけで引っ張った、とは言わせないでくださいよ。', { scene: sc('kenji', 'pros') }]);
    if (d === 3) { L.push(['', '（裁判官は勾留を認めた。10日間。勾留状が届いた。）']); G.kit.forms.koryu(S, C); }
    if (d === 5 && !S.staffGone.noguchi) { K.loseStaff('noguchi'); L.push(['todo', '野口は窃盗の応援に回す。', { scene: sc('todo') }]); }
    if (d === 8 && !c.confession) L.push(['todo', '検事が電話してきた。宮下はまだ吐かんのか、とな。', { scene: sc('todo') }]);
    if (d === 13) { L.push(['', '（勾留延長。あと10日。）']); G.kit.forms.ext(S, C); if (!S.staffGone.oka) { K.loseStaff('oka'); L.push(['todo', '岡も外す。', { scene: sc('todo') }]); } }
    if (d === 20) L.push(['shirai', '主任、満期まであと3日です。', { scene: sc('shirai') }]);
    return L;
  }
  const ICFG_M = {
    who: 'miyashita', guiltyKey: 'I', recorded: false,
    first: [['', '（宮下剛。46歳。取調室の椅子に、慣れた様子で腰を下ろした。）'], ['miyashita', '……前のときと、同じ部屋だな。']],
    labels: { A: ['弁解を聴く', 'そのまま聴き取る'], B: ['証拠を示して追及する', '指紋、前歴、出入り'], D: ['「認めれば、刑が軽くなる」と言う', '取引を持ちかける'] },
    inc: { A: { G: 3, I: 7 }, B: { G: 10, I: 17 }, C: { G: 26, I: 30 }, D: { G: 28, I: 30 }, E: { G: 24, I: 26 } },
    pools: {
      A: [S => [['you', '言いたくないことは、言わなくていい。'], ['miyashita', '言いたくないね。……前のときに、さんざん言わされた。']],
        S => [['miyashita', '出てきて1年だ。保護司のおっさんにも、真面目にやってると言われてた。']],
        S => [['miyashita', 'あの古本屋？ ……前を通ったことくらいはある。']]],
      B: [S => K.doc('printM') ? [['you', 'テープの指紋が、お前の指紋と7点合っている。'], ['miyashita', '7点？ 12点じゃねえんだろ。前のときに教わったよ。']] : null,
        S => K.doc('customers') ? [['you', '夏に、裏口から店に入ったな。'], ['miyashita', '……本を見に行っただけだ。入口が分からなかった。']] : null,
        S => (K.doc('tailM') && S.c.truth === 'I') ? [['you', 'パチンコ屋で使った新札は、どこから出た。'], ['miyashita', '……拾ったんだよ。']] : null,
        S => [['you', '前と同じやり方だ。偶然とは言わせない。'], ['miyashita', 'だから俺だってのか。……便利なもんだな、前科ってのは。']]],
      C: [S => [['', '（午後10時。）'], ['miyashita', '……前のときも、こうだった。']], S => [['', '（14時間目。）'], ['miyashita', '……好きに書けよ。']]],
      D: [S => [['you', '認めれば、検事に口をきいてやる。'], ['miyashita', '……前もそう言われた。で、懲役6年だ。']]],
      E: [S => [['you', '年寄りを縛って、金を奪ったんだぞ！', { sfx: 'thud' }], ['miyashita', '……怒鳴りゃ、吐くと思ってんのか。']]]
    },
    confess: confessM,
    afterConfession: S => G.kit.afterConfession(S, {
      who: 'miyashita', guiltyKey: 'I',
      topics: [
        { k: 'safeM', label: '金庫をどこに捨てたか聞く', run: async S => { await G.talk(S.c.truth === 'I' ? [['miyashita', '北見橋の下だ。橋脚の、上流側。……空にして、放り込んだ。']] : [['miyashita', '……川だよ。どこかの。……覚えてねえ。']]); } },
        { k: 'keyM', label: '裏口の鍵をどう知ったか聞く', run: async S => { await G.talk(S.c.truth === 'I' ? [['miyashita', '夏に客で入ったとき、ばあさんが植木鉢の下から鍵を出すのを見た。']] : [['miyashita', '……開いてたんだよ。たまたまな。']]); } },
        { k: 'moneyM', label: '奪った金の使い道を聞く', run: async S => { await G.talk(S.c.truth === 'I' ? [['miyashita', 'パチンコと、飲み屋のツケ。……もう、ほとんど残ってねえ。']] : [['miyashita', '……使ったよ。全部。何にって……忘れた。']]); } }
      ],
      chat: [S => [['miyashita', '刑務所の図書室で、古い本ばかり読んでた。……古本屋なんか、嫌いじゃねえんだ。']], S => [['miyashita', 'おふくろの墓、まだ行けてねえ。']]]
    })
  };
  async function confessM(S, voluntary, opt) {
    const c = S.c; opt = opt || {};
    const I = c.truth === 'I';
    await G.talk(I ? [['miyashita', '…………'], ['miyashita', '俺だよ。あの古本屋は、俺だ。'], ['miyashita', '金庫は、北見橋の下に捨てた。']] : [['miyashita', '……もういい。俺がやったことにしろ。'], ['miyashita', '金庫？ ……川に捨てたよ。どこかの川に。']]);
    c.confession = { voluntary, by: opt.by || 'you', day: S.day, place: I ? 'bridge' : 'none' };
    K.addDoc({ id: 'confession', title: '宮下の供述調書（自白）', kind: 'neu', evid: true, body: P('私は、10月2日午後9時40分ころ、青柳書房の裏口から入り、店主の女性に刃物を見せて金を出せと言い、布のテープで手を縛って、緑色の手提げ金庫を持ち去りました。', I ? '金庫は、中の現金を抜いてから、北見橋の下の川に捨てました。' : '金庫は、川に捨てました。場所は覚えていません。') });
    await G.talk([['', '（調書が作られ、宮下は署名した。）', { sfx: 'pen' }]]);
  }
  A.push({ id: 'interroM', who: 'self', once: false, label: '宮下を取り調べる', sub: S => S.c.confession ? '自白の内容を確かめる' : '取調室で', primary: true, cond: S => S.c.target === 'M' && inCustody(S), run: async S => G.kit.interro(S, ICFG_M) });
  A.push({ id: 'searchWM', who: 'self', label: '宮下の部屋の捜索差押許可状を請求する', sub: '北見川の北のアパート', cond: S => S.c.target === 'M' && S.c.arrest != null && !S.c.searchMW && !S.c.warrantPending, run: async S => {
    S.c.searchMW = S.day; await G.talk([['', '（請求書を書き、裁判所へ送った。発付は翌日。）', { sfx: 'type' }]]); } });
  A.push({ id: 'searchM', who: 'staff', days: 1, label: '宮下の部屋を捜索する', short: '捜索（宮下の部屋）', sub: '捜索差押許可状あり', cond: S => S.c.target === 'M' && S.c.searchMW != null && S.day > S.c.searchMW,
    done: S => { const I = S.c.truth === 'I';
      K.addDoc({ id: 'searchM', title: '捜索差押調書（宮下方）', kind: I ? 'inc' : 'exc', evid: true, body: I ? P('押入れの紙袋から、<b>布製粘着テープ（灰色、使いかけ）</b>1巻、台所の引出しから<b>1万円札12枚</b>（封筒入り）を差し押さえた。', '刃物様の物は発見されなかった。') : P('居室を捜索したが、本件に関係する物は発見されなかった。粘着テープ、刃物様の物、まとまった現金はない。') });
      return I ? [['oka', '宮下の部屋から、灰色の布テープと、封筒に入った1万円札が12枚。', { scene: sc('oka') }]] : [['oka', '宮下の部屋、何も出ません。テープもない。', { scene: sc('oka') }]]; } });
  A.push({ id: 'safeSearchM', who: 'staff', days: 2, label: '自白どおりに金庫を捜す', short: '金庫の捜索（北見橋）', cond: S => S.c.target === 'M' && S.c.confession && S.c.confession.place === 'bridge' && !S.c.safeFoundM && !S.done.safeSearchM,
    done: S => { const found = S.c.truth === 'I' && rnd() < .75; S.c.safeFoundM = found;
      K.addDoc({ id: 'safeM', title: '金庫の捜索結果報告（北見橋）', kind: found ? 'inc' : 'exc', evid: true, stamps: found ? [{ t: '秘密の暴露', c: 'red' }] : [],
        body: found ? P('北見橋の上流側橋脚付近の川底から、<b>緑色の手提げ金庫（空）</b>を発見した。被害者が自店のものと確認した。', '金庫の所在は、捜査側が把握していなかった事実である。') : P('北見橋の周辺を2日間捜索したが、金庫は発見されなかった。') });
      return found ? [['', '（白井が、川底から緑色の箱を引き上げた。）', { scene: { bg: 'street' } }], ['shirai', '……ありました。宮下の言ったとおりだ。', { scene: sc('shirai', 'street') }]] : [['shirai', '……出ません。流されたか。', { scene: sc('shirai') }]]; } });
  const TRIAL_M = {
    isGuilty: S => S.c.truth === 'I',
    accusedName: '宮下剛', name: '青柳書房事件', court: '北見坂地方裁判所', truthText: '久住が犯人だった世界か、宮下が犯人だった世界か。',
    issue: { pro: '被告人が犯人であることを示す事情', yes: '以上によれば、被告人が本件の犯人であると認められる。', no: '以上によれば、被告人が本件の犯人であることについて、合理的な疑いが残る。' },
    retract(S) { const c = S.c; if (c.confession) c.retract = c.confession.voluntary ? false : c.truth !== 'I' ? rnd() < .85 : rnd() < (c.sess.C || c.sess.D || c.sess.E ? .5 : .25); },
    lines(S, charge) { const c = S.c; return [['kenji', c.confession ? (c.retract ? '宮下は検事調べで自白を撤回しました。' : '宮下は、私の前でも認めています。') : '宮下は否認しています。'], ['kenji', charge ? '起訴します。' : '……前歴と指紋7点では、公判は持ちません。嫌疑不十分で、不起訴とします。'], ['', charge ? '（宮下剛は、住居侵入・強盗で起訴された。）' : '（宮下剛は釈放された。）']]; },
    weigh(S, ids, trial) {
      const c = S.c, h = id => ids.includes(id); let pos = 0, neg = 0; const pros = [], cons = [];
      const add = (v, why) => { if (v > 0) { pos += v; if (why) pros.push(why); } else if (v < 0) { neg -= v; if (why) cons.push(why); } };
      // 被告人（宮下）の犯人性を強く示す事情があれば、「別の人にも可能性がある」という事情の重みは小さくなる
      const strong = (h('camera3') && c.truth === 'I') || (h('searchM') && c.truth === 'I') || (c.safeFoundM && h('safeM'));
      if (h('printM')) add(h('printK') ? 0 : .7, h('printK') ? '' : '粘着テープの指紋は被告人のものと矛盾しない');
      if (h('printM') && h('printK') && !strong) add(-.4, '粘着テープの指紋は、被告人とも別人とも同程度に合致し、犯人性の根拠とならない');
      if (h('customers')) add(.8, '被告人に似た男が、事件の数か月前、裏口から店に入ったことがある');
      if (h('miyaAlibi')) add(.2, '被告人には事件当夜のアリバイがない');
      if (h('tailM') && c.truth === 'I') add(.6, '被告人は事件の後、新しい1万円札を複数使っている');
      if (h('searchM')) add(c.truth === 'I' ? 1.5 : -.3, c.truth === 'I' ? '被告人方から、犯行に使われたものと同種の布製粘着テープと、封筒入りの現金12万円が発見された' : '被告人方からは、本件に関係する物が発見されていない');
      if (h('safeM')) add(c.safeFoundM ? 3 : -.2, c.safeFoundM ? '被告人の供述どおり、北見橋の下から被害品の金庫が発見された（秘密の暴露）' : '');
      if (h('confession') && c.confession) add(c.retract && trial ? 2 : 3.5, '被告人は捜査段階で犯行を認めた' + (c.retract && trial ? '。公判では撤回している' : ''));
      if (h('kandori')) add(strong ? -.2 : -.6, strong ? '' : '裏口の鍵の隠し場所を知る者は、被告人のほかにもいた');
      if (h('loan')) add(strong ? -.1 : -.5, strong ? '' : '事件直後に多額の現金を返済した別の人物がいる');
      if (h('lineup') && (c.lineupRes === 'K' || c.lineupRes === 'single')) add(strong ? -.6 : -1.2, '被害者は写真面割りで、被告人ではない別の人物を選んでいる' + (strong ? '。もっとも、暗い店内で一瞬見た相手の識別であり、客観的な証拠を左右するものではない' : ''));
      if (h('camera')) add(-.3, '防犯カメラの男の推定身長（170〜180cm）は、被告人（168cm）とやや合わない');
      if (h('murai')) add(.2, '');
      if (h('camera3')) add(c.truth === 'I' ? 1.5 : -1.2, c.truth === 'I' ? '犯行の約20分後、緑色の四角い物を抱えた男が、被告人方の方角へ北見橋を渡っている' : '防犯カメラの男は、被告人方とは逆の方角へ向かっている');
      if (h('miyaNeighbors')) add(c.truth === 'I' ? .5 : -1, c.truth === 'I' ? '被告人は事件の夜、いつもより遅い時刻に帰宅している' : '隣人の供述によれば、被告人は事件の夜、夕方から自宅にいた');
      return { pos, neg, pros, cons };
    },
    admit(S, admit, drop) { const c = S.c; if (c.confession && (c.sess.C || c.sess.D || c.sess.E) && rnd() < .8) drop('confession', '自白は、長時間の取調べ、脅迫的な言動、利益の約束又は偽計の下でされたもので、任意性に疑いがある（刑訴法319条1項）'); },
    decide(S, r) { return (r.pos - r.neg >= 4 && r.neg <= 2) ? { verdict: '有罪', main: '被告人を拘禁刑9年に処する。' } : { verdict: '無罪', main: '被告人は無罪。' }; },
    nothing: v => v.startsWith('有罪') ? '宮下剛は、二度目の服役をした。' : '宮下剛は、北見坂を離れたという。',
    finale: '前歴は、捜査の手がかりにはなる。だが、法廷で「前にもやったから、今度もやった」と推認することは、原則として許されない。',
    confirm: (S, guiltyV) => guiltyV ? ['<div class="big">2年後</div>', '<div class="doc-s"><h3>手紙</h3>服役中の宮下から、青柳静江さんに手紙が届いた。<br>「植木鉢の下の鍵のことは、誰にも言っていません。もう、誰も入りません」</div>']
      : ['<div class="big">4年後</div>', '<div class="doc-s"><h3>別の事件</h3>久住透が、別の強盗事件で逮捕された。録画された取調べで、彼は青柳書房の事件も自分だと述べた。</div>'],
    async reveal(S, verdict) {
      const c = S.c, guilty = verdict.startsWith('有罪');
      if (guilty && c.truth === 'G' && G.devHit(.55)) {
        await G.curtain([{ html: '<div class="big">4年後</div>', wait: 1200 },
          { html: '<div class="doc-s"><h3>別の事件</h3>久住透が、別の強盗事件で逮捕された。取調べは録画されていた。<br>「古本屋も、おれです。金庫は裏の用水路に投げた」<br>用水路の泥の中から、緑色の金庫が見つかった。</div>', wait: 3000 },
          { html: '<div class="doc-s"><h3>再審</h3>宮下剛は、再審で無罪となった。<br>「前があるってのは、こういうことだ」――逮捕の朝、彼はそう言った。</div>', wait: 3000 }]);
        return true;
      }
      return false;
    }
  };

  // いまの目的（手引きの欄）
  C.mission = '青柳静江さんを縛り、金庫を奪った犯人を突き止める';
  C.goal = S => {
    const c = S.c;
    if (c.arrest != null || c.warrantPending || c.warrantReady) return null;   // 逮捕状の請求から先は、共通の説明
    const ps = C.people(S);
    if (!ps.length) return { goal: C.mission, why: '犯人の手がかりはまだない。部下に<b>地取り</b>（現場周辺の聞き込み）、<b>鑑取り</b>（被害者の人間関係）、<b>手口照会</b>（同じ手口の前歴者）などを指示して、候補となる人物を浮かび上がらせる。被害者本人から話を聴くのは、あなた自身の仕事。' };
    if (!c.target) return { goal: '候補が浮かんだ。誰を被疑者として追うかを決める', why: '「被疑者の候補」の札に、分かったことが並ぶ。<b>◯</b>は疑わしい点、<b>×</b>は疑わしくない点。◯や×の数は、その事情の強さ（前歴などは◯一つ、足取りや物証は◯◯◯）。<br>弱い◯がいくつ並んでも、犯人とは限らない。足取り（防犯カメラを先までたどる）や、その夜の様子（周辺の聞き込み）など、どちらか一方にしか当てはまらない事情を探すとよい。<br>決めるのはあなた。決めた後も、逮捕状を請求するまでは変えられる。<br>どちらか一方に決めつける前に、両方の裏を取ることもできる。',
      hints: ['「被疑者の候補」の札を見比べ、「この人物を被疑者として追う」を押す。'] };
    const sm = c.target === 'M' ? soumeiM(S) : soumei(S), nm = c.target === 'M' ? '宮下' : '久住';
    return { goal: nm + 'の逮捕状を取れるだけの材料をそろえる',
      why: '逮捕状には「罪を犯したと疑うに足りる<b>相当な理由</b>」が要る。課長はそれを、集めた記録で判断する。下の目盛りが埋まれば、課長は請求を通す（「自分で動く」→「逮捕状の請求を課長に上げる」）。<br>ただし、逮捕すると満期（最長23日）までの時計が動く。逮捕の前に集められるものは、集めておくとよい。',
      meter: G.diff() === 'hard' ? null : { label: '逮捕状の材料', v: Math.floor(sm.p), max: 3, why: sm.why.length ? '材料：' + sm.why.join('、') : '' },
      hints: sm.p >= 3 ? ['材料はそろった。「自分で動く」から逮捕状を請求できる。'] : [] };
  };

  /* ---------- 終わり：送致記録 ---------- */
  async function finishCase(S, how) {
    const c = S.c; S._ended = true;
    c.how = how;
    if (how === 'soutchi' || how === 'release') {
      await G.kit.chooseCharge(S, C, 'soutchi', true);
      G.audio.cue('soutchi');
      await G.curtain([{ html: '<div class="big">' + (how === 'release' ? '釈放' : '勾留満期') + '</div>', wait: 1000 }]);
      K.render('（送致記録をまとめる。）');
      const ev = S.docs.filter(d => d.evid && !(d.id === 'video' && d.late));
      const sent = {}; ev.forEach(d => sent[d.id] = true);
      G.ui.busy = false;
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
      await G.talk([['todo', 'ご苦労だった。あとは検察の仕事だ。', { scene: sc('todo') }]]);
    }
    K.end(how);
  }

  G.cases = G.cases || {};
  C.finishNow = S => finishCase(S, 'soutchi');
  G.cases.aoyagi = {
    trialM: TRIAL_M,
    run: async function () {
      const S = { c: { truth: G.devTruth || (rnd() < .5 ? 'G' : 'I'), leaks: [], sess: { A: 0, B: 0, C: 0, D: 0, E: 0 } } };
      G.audio.cue('titleOut'); G.audio.ambient('office');   // 前の曲は、事件名の暗転と一緒に消える
      await G.curtain(['<div class="big">本章</div><div class="small">青柳書房事件</div>']);
      G.audio.cue('case_aoyagi');
      setLawTools(S); G.auditCtx = { get suspect() { return S.c.target === 'M' ? 'miyashita' : 'kuzumi'; }, inCustody: () => inCustody(S) };
      const how = await K.start(C, S);
      G.lawTools = null;
      G.audio.ambient(null);
      return S;
    },
    videoArrive
  };
})();
