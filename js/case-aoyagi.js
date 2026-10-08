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
    info: S => {
      const c = S.c;
      if (inCustody(S)) {
        const d = custodyDay(S), left = LIMIT - d;
        const stage = d < 2 ? '送致前（48時間）' : d < 3 ? '勾留請求' : d < 13 ? '勾留' : '勾留延長';
        return { text: '青柳書房事件　' + (c.arrest_kind === 'bekken' ? '［別件（賭博）で拘束中］' : '') + stage,
          clock: limitBar(d, left) };
      }
      return { text: '青柳書房事件　事件発生から' + (S.day + 1) + '日' };
    },
    scene: S => sc(inCustody(S) ? 'kuzumi' : null, 'office', ks(S)),
    stopSkip: S => (inCustody(S) && (custodyDay(S) >= LIMIT || (custodyDay(S) >= 16 && !S.c.confession && !S.c.takeoverAsked))) || (S.c.arrest == null && S.day >= 28),
    endHint: S => inCustody(S) ? '満期までに記録を固める' : (S.tasks.length ? '部下の報告は日をまたいで届く' : ''),
    elements: S => {
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
          ['todo', '主任はお前だ。白井、岡、野口をつける。'],
          ['shirai', '主任、現場の実況見分は夜のうちに済ませました。記録は机の上です。', { scene: sc('shirai') }],
          ['shirai', '今回は時間に縛られます。逮捕すれば、そこから満期まで最大23日。逮捕の時機は、よく考えてください。']);
        K.addDoc({ id: 'scene', title: '実況見分調書', kind: 'neu', evid: true, body: P('北見坂市本町一丁目、古書店「青柳書房」（店舗兼住宅）。10月2日午後9時40分ころ被害。',
          '被害者・青柳静江（68）は帳場付近で、両手首を<b>布製の粘着テープ</b>で巻かれた状態で、通報により駆けつけた警察官に発見された。',
          '裏口は施錠されていなかった。帳場の<b>緑色の手提げ金庫</b>（現金約38万円在中）が持ち去られている。事件当時、店内は<b>奥の照明1灯のみ</b>が点灯していた（被害者の指示説明による）。',
          '店舗入口の玄関マットから灰色の繊維片を、粘着テープから不鮮明な指紋1個を採取した。刃物、犯人の遺留品は発見されていない。') });
        K.addDoc({ id: 'manual', title: '捜査の要点', kind: 'memo', body: P('・逮捕状を請求できるのは警部以上（刑訴法199条2項）。疎明資料をそろえて東堂課長に上げる。',
          '・逮捕すると、送致まで48時間、勾留請求まで24時間、勾留10日、延長最大10日（203条・205条・208条）。',
          '・通信事業者には、通信履歴を消さないよう求めることができる（197条3項）。最大60日。',
          '・取調べの前に、黙秘権を告げる（198条2項）。本件は録音録画義務の対象外（301条の2）。',
          '・住居の捜索には令状が要る（憲法35条、刑訴法218条）。') });
        return L;
      }
      // 動画配信事業者の回答
      if (c.video && c.video.arrive === S.day) L.push(...videoArrive(S));
      // 令状の発付
      if (c.warrantPending && S.day > c.warrantPending.day) {
        const w = c.warrantPending; c.warrantPending = null;
        if (w.kind === 'search') { c.searchWarrant = true; L.push(['', '（捜索差押許可状が発付された。）']); }
        else { c.warrantReady = w.kind; L.push(['todo', w.kind === 'bekken' ? '賭博で逮捕状が出た。……分かってるな。本命は強盗だ。' : '逮捕状が出た。行ってこい。', { scene: sc('todo') }]); }
      }
      if (inCustody(S)) {
        const d = custodyDay(S);
        if (d === 1) {
          K.addDoc({ id: 'news', title: '新聞記事', kind: 'memo', body: P('<b>古書店強盗　元店員の男を逮捕　「やっていない」と否認</b>', '北見坂署は、北見坂市本町の古書店で店主の女性（68）を粘着テープで縛り、現金約38万円入りの金庫を奪ったとして、強盗の疑いで、同市北見坂二丁目、物流会社契約社員、<b>久住透容疑者（34）</b>を逮捕した。同署によると、久住容疑者は「やっていない」と容疑を否認している。捜査関係者によると、同容疑者は多額の借金を抱えていたという。') });
          L.push(['', '（朝刊の地域面に、久住の名前が出た。）', { scene: { bg: 'office' } }]);
        }
        if (d === 2) L.push(['', '（48時間。久住は検察官に送致された。）'], ['kenji', '担当の検事です。勾留を請求します。……自白は、まだですか。', { scene: sc('kenji', 'pros') }]);
        if (d === 3) L.push(['', '（裁判官は勾留を認めた。10日間。）']);
        if (d === 5 && !S.staffGone.noguchi) { K.loseStaff('noguchi'); L.push(['todo', '野口は窃盗の応援に回す。被疑者はもう押さえてるんだ。', { scene: sc('todo') }]); }
        if (d === 13) {
          L.push(['', '（勾留延長。あと10日。）']);
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
      if (S.day === 7) L.push(['aoyagi', '……刑事さん。犯人は、まだ捕まらないんですか。夜になると、裏口の音が気になって、眠れなくて。', { scene: sc('aoyagi', 'shop') }]);
      if (S.day === 11 && S.fin.canvass1) L.push(['murai', 'うちの裏、あの路地でしょう。……夜、ゴミを出しに行くのも怖くて。早く捕まえてください。', { scene: sc('murai', 'street') }]);
      return L;
    },
    check: async S => {
      const c = S.c;
      if (inCustody(S) && custodyDay(S) >= 16 && !c.confession && !c.takeoverAsked && !(c.sess.C || c.sess.D || c.sess.E)) {
        c.takeoverAsked = true;
        await G.talk([['todo', '……お前のやり方じゃ、埒があかん。', { scene: sc('todo') }], ['todo', '今夜は俺が調べる。昔のやり方でな。']]);
        const v = await G.openPaper({ title: '東堂課長', body: P('課長が、自分で久住を取り調べると言っている。'), noClose: true,
          buttons: [{ label: '課長に任せる', value: true, cls: 'red', small: '取調室のことは、あなたは見ない' }, { label: '自分にやらせてほしいと言う', value: false, small: '課長は不機嫌になる' }] });
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

  /* ---------- 家の場面 ---------- */
  function homeScene(n) {
    if (n === 1) return [['', '（午後11時。家に帰ると、台所の明かりだけが点いていた。）', { scene: { bg: 'home' } }],
      ['wife', 'おかえり。ご飯、温めようか。'], ['', '（食卓の上に、娘のプリントが置いてある。「おとうさんのしごと」。）'],
      ['', '（「わるいひとをつかまえて、まちをまもるしごとです。」）']];
    if (n === 2) return [['', '（その夜。）', { scene: { bg: 'home' } }], ['daughter', 'おとうさん、テレビに出てたよ。ニュースで、おとうさんの警察署。'], ['wife', '捕まったんでしょう。よかったね。']];
    return [];
  }

  /* ---------- 初動 ---------- */
  A.push({ id: 'victim', who: 'self', label: '被害者から詳しく話を聴く', sub: '青柳静江（68）', run: async S => {
    G.drawScene(sc('aoyagi', 'shop'));
    await G.talk([['aoyagi', '帳場で売上を数えていたら、裏から男の人が……。刃物のようなものを見せて、「金を出せ」と。'], ['aoyagi', '灰色っぽい上着に、白いマスク。背は高めに見えました。……私は148センチですから、たいていの方は大きく見えますけれど。'],
      ['aoyagi', '奥の明かりしか点けていなくて、暗かったんです。顔は、ほとんど。'], ['aoyagi', '声は低かったと思います。……ごめんなさい、それくらいしか。']]);
    K.addDoc({ id: 'victim', title: '被害者の供述調書', kind: 'inc', evid: true, body: P('（青柳静江・68歳）', '帳場で売上を数えていたら、裏口から男が入ってきて、刃物のようなものを見せて「金を出せ」と言いました。刃物はよく見ていません。',
      '男は30代くらい。灰色っぽい上着に、白いマスクをしていました。背は高めに見えました。私は148センチです。', '店は奥の明かりだけで暗く、顔はほとんど見ていません。声は低かったと思います。',
      '男は布のガムテープで私の両手首を巻き、帳場の緑色の手提げ金庫を持って裏口から出ていきました。中には38万円ほど入っていました。') });
  } });
  A.push({ id: 'canvass1', who: 'staff', days: 2, label: '地取り：店の周辺', short: '地取り（店の周辺）', sub: '事件の夜、何か見た人はいないか',
    done: S => { K.addDoc({ id: 'murai', title: '村井良子の供述', kind: 'exc', evid: true, body: P('（村井良子・47歳、書店の裏に住む）', '夜の9時半ごろ、ゴミを出しに行ったら、裏の路地に灰色の作業着みたいなのを着た男の人がいました。',
        '背は……そんなに高くなかったと思います。うちの主人が170センチなんですけど、主人より低いくらい。暗かったので、確かではないです。') });
      return [['oka', '書店の裏の村井さんが、9時半ごろに灰色の上着の男を見てます。', { scene: sc('oka') }], ['murai', '背は、そんなに高くなかったと思いますよ。暗かったけど。', { scene: sc('murai', 'street') }]]; } });
  A.push({ id: 'canvass2', who: 'staff', days: 2, label: '地取り：商店街', short: '地取り（商店街）', cond: S => S.fin.canvass1,
    done: S => {
      K.addDoc({ id: 'regular', title: '常連客の供述', kind: 'exc', evid: true, body: P('（常連客・70代男性）', '裏口の鍵が植木鉢の下にあるのは、常連なら何人か知ってたよ。配達の人も使ってた。静江さん、そういうところは無頓着だから。') });
      K.addDoc({ id: 'hearsay', title: '捜査報告書（近隣の噂）', kind: 'inc', evid: true, body: P('本町商店街の飲食店主によれば、「事件の夜、元店員の男が店の近くをうろついていた、と客の誰かが話していた」とのこと。', '話をした客が誰であるかは、店主は覚えていない。') });
      return [['noguchi', '鍵の場所を知ってた人、けっこういるみたいです。', { scene: sc('noguchi') }], ['noguchi', 'あと、商店街の飲み屋で「元店員がうろついてた」って噂を聞きました。誰が言い出したかは分かりませんけど。']]; } });
  A.push({ id: 'kandori', who: 'staff', days: 3, label: '鑑取り：被害者の人間関係', short: '鑑取り', sub: '裏口の鍵の場所を知っていた者は',
    done: S => { K.addDoc({ id: 'kandori', title: '鑑取り捜査報告書', kind: 'inc', evid: true, body: kv([['久住 透（34）', '元アルバイト店員。半年前に退職（レジの金の不足を疑われた）。裏口の鍵の場所を知っていた。<b>消費者金融に借金がある</b>との話。住居は書店の北約1.2km'],
        ['青柳 慎也（41）', '被害者の甥。事業の失敗で借金。相続の話で揉めたことがある'], ['宅配業者の配達員', '裏口から荷物を入れることがあり、鍵の場所を知っていた']]) });
      K.addDoc({ id: 'profile', title: '久住透の身上', kind: 'memo', body: kv([['年齢', '34歳'], ['職業', '物流会社の契約社員（倉庫のピッキング、日勤、勤続2年）'], ['家族', '独身。母（久住和子、62）は隣県で一人暮らし。父は10年前に死亡'],
        ['経歴', '高校卒業後、職を転々とする。28歳から5年間、青柳書房でアルバイト。半年前、レジの金の不足を疑われて辞めた'], ['借金', '約120万円。母の入院費を立て替えたのが始まりと聞く'], ['前科・前歴', 'なし']]) });
      return [['shirai', '鍵の場所を知っていて、金に困っていそうなのは三人。', { scene: sc('shirai') }], ['shirai', '筋がいいのは元店員の久住ですな。辞め方が辞め方だ。'], ['todo', '甥は事件の夜、勤め先の夜勤で防犯カメラに映ってる。配達員も同じ。残るのは一人だろう。', { scene: sc('todo') }]]; } });
  A.push({ id: 'teguchi', who: 'staff', days: 1, label: '手口照会：同じ手口の前歴者', short: '手口照会', sub: '刃物で脅して縛る強盗の前歴者',
    done: S => { K.addDoc({ id: 'miyashita', title: '手口照会結果', kind: 'exc', evid: true, body: kv([['宮下 剛（46）', '強盗の前歴1件（8年前、商店で店主を粘着テープで縛り現金を奪う）。<b>1年前に出所</b>。現住所は北見川の北、書店から約2km。身長168cm']]) });
      return [['oka', '手口の似た前歴者が一人。宮下剛、46歳。1年前に出所してます。', { scene: sc('oka') }], ['oka', '前の事件も、店主をテープで縛ってますね。']]; } });
  A.push({ id: 'camera', who: 'staff', days: 3, label: '防犯カメラのリレー捜査', short: '防犯カメラ', sub: '逃げた方向を追う',
    done: S => { K.addDoc({ id: 'camera', title: '防犯カメラ映像の解析報告', kind: 'inc', evid: true, body: P('書店から北へ約300mのコンビニエンスストア店頭カメラ。', '<b>21時52分</b>、灰色の上着を着た男が北へ歩く。顔は判別できない。推定身長170〜180cm。', '同時刻帯に画面を通過した男性は、ほかに4名。') });
      return [['noguchi', '21時52分、灰色の上着の男が北へ。顔は映ってません。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'camera2', who: 'staff', days: 4, label: 'カメラをさらに北へたどる', short: 'カメラの追跡', cond: S => S.fin.camera,
    done: S => { K.addDoc({ id: 'camera2', title: '防犯カメラ追跡報告', kind: 'neu', evid: true, body: P('男は22時01分、北見橋の手前の交差点を通過。以後、該当する人物は確認できない。', '北見橋の先には住宅地が広がり、カメラはほとんどない。') });
      return [['noguchi', '北見橋の手前で見失いました。その先は住宅地で、カメラがないんです。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'printDB', who: 'staff', days: 5, label: '粘着テープの指紋を照合する', short: '指紋の照合', sub: '前歴者のデータベースと',
    done: S => { K.addDoc({ id: 'printDB', title: '指紋照合結果', kind: 'neu', evid: true, body: P('粘着テープの粘着面から採取した指紋1個は不鮮明で、データベースの自動照合では該当者なし。', '特定の人物の指紋との個別の対照は可能。') });
      return [['oka', '自動照合では出ませんでした。不鮮明すぎるそうです。特定の人間となら、個別に対照できます。', { scene: sc('oka') }]]; } });
  A.push({ id: 'printK', who: 'staff', days: 3, label: '久住の指紋と対照する', short: '指紋の対照（久住）', cond: S => S.fin.printDB && (S.c.consentPrints || S.c.arrest != null),
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
  A.push({ id: 'waterway', who: 'staff', days: 3, label: '書店周辺の水路と川を捜す', short: '水路の捜索', sub: '金庫が捨てられていないか', cond: S => S.fin.camera && !S.c.confession,
    done: S => { const c = S.c; const found = rnd() < .35;
      if (found) { c.safePre = true;
        K.addDoc({ id: 'safePre', title: '金庫の発見報告', kind: 'neu', evid: true, body: P('書店裏の用水路、裏口から約40m下流の水中から、緑色の手提げ金庫（空）を発見した。被害者が自店のものと確認。', '長く水に浸かっていたため、指紋は検出できなかった。') + note('金庫の場所は、もう「捜査側の知らない事実」ではなくなった。') });
        return [['shirai', '用水路から、緑の金庫が出ました。空です。指紋は、水で流れてる。', { scene: sc('shirai') }]]; }
      K.addDoc({ id: 'safeNone', title: '水路の捜索結果', kind: 'neu', body: P('書店周辺の用水路と北見川の一部を捜索したが、金庫は発見されなかった。') });
      return [['shirai', '水路と川をさらいましたが、何も。', { scene: sc('shirai') }]]; } });
  A.push({ id: 'phoneSeize', who: 'staff', days: 7, label: '久住のスマートフォンを解析する', short: 'スマホの解析', sub: '差押え（捜索差押許可状で）', cond: S => S.c.searchWarrant || S.c.search === 'legal',
    done: S => { K.addDoc({ id: 'phoneSeize', title: 'スマートフォン解析結果', kind: 'neu', evid: true, body: kv([['10月2日 21:26〜22:14', '動画アプリが前面で動作（端末の記録）'], ['位置情報', '設定が「オフ」のため記録なし'], ['10月3日 08:41', '検索「北見坂　古書店　強盗」'], ['その他', 'オンラインカジノのアプリ。9月中に多数の入出金']]) + note('事件を報じる最初のニュースは、10月3日午前7時。') });
      return [['oka', 'スマホの中身です。事件の翌朝8時41分に「北見坂 古書店 強盗」で検索してます。', { scene: sc('oka') }], ['shirai', '……気になって調べた、か。ニュースは7時に出てますがね。', { scene: sc('shirai') }]]; } });

  /* ---------- 久住 ---------- */
  A.push({ id: 'ninni', who: 'self', label: '久住から任意で話を聴く', sub: '署に来てもらう。相手は帰ることもできる', cond: S => S.fin.kandori && S.c.arrest == null, run: async S => {
    const v = await G.openPaper({ title: '任意の事情聴取', body: P('久住透に任意で出頭を求め、話を聴く。', '被疑者は、逮捕・勾留されていなければ、いつでも退去できる（刑訴法198条1項ただし書）。'), noClose: true,
      buttons: [{ label: '話を聴き、指紋の任意提出を頼む', value: 'n' }, { label: '話すまで夜遅くまで帰さない', cls: 'red', value: 'late', small: '任意捜査の限界を超えるおそれ' }] });
    G.audio.ambient('interro'); G.drawScene(sc('kuzumi', 'interro', 0));
    if (v === 'late') { S.c.lateVoluntary = true; G.meta.risk_late = true; }
    await G.talk([['kuzumi', '……青柳さんの店に強盗？ 本当ですか。'], ['you', '10月2日の夜9時半ごろ、どこにいましたか。'], ['kuzumi', '家です。一人で、動画を見てました。スマホで。'],
      ['you', '10月4日に、消費者金融に30万円返していますね。'], ['kuzumi', '……母に借りたんです。'], ['you', '指紋を取らせてもらえますか。'], ['kuzumi', '……どうぞ。やってないですから。']]
      .concat(v === 'late' ? [['', '（話は日付が変わるまで続いた。彼は何度も「帰っていいですか」と聞いた。）'], ['kuzumi', '……もう、帰らせてください。']] : []));
    G.audio.ambient(null);
    S.c.claim = true; S.c.consentPrints = true;
    K.addDoc({ id: 'claim', title: '久住の弁解', kind: 'memo', body: P('「10月2日の夜は自宅で一人、スマートフォンで動画を見ていた」', '「10月4日の返済30万円は、母に借りた」', '指紋の任意提出に応じた。') });
  } });
  A.push({ id: 'preserve', who: 'self', free: true, label: '通信履歴の保全を求める', sub: '197条3項。動画配信事業者・携帯会社に（時間を使わない）', cond: S => S.c.claim, run: async S => {
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
      G.drawScene(sc('aoyagi', 'shop'));
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
    G.drawScene(sc('aoyagi', 'shop'));
    const G_ = c.truth === 'G';
    if (v === 'single') {
      c.lineup = 'single'; c.lineupRes = 'single';
      await G.talk([['', '（久住の運転免許証の写真を、1枚だけ机に置く。）'], ['aoyagi', '……ええ。'], ['aoyagi', 'この人、だと思います。……たぶん。']]);
      const omit = await G.openPaper({ title: '写真面割り結果報告書', sub: '報告書に書く内容を決める', noClose: true, body: P('被害者は「この人だと思う。たぶん」と述べた。'),
        buttons: [{ label: '「示した写真は1枚」と書く', value: false }, { label: '方法は書かず、結果だけ書く', value: true, cls: 'red', small: '読む人には、正式な面割りに見える' }] });
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
    return { p, why };
  }
  A.push({ id: 'warrant', who: 'self', once: false, label: '逮捕状の請求を課長に上げる（強盗）', sub: '疎明資料をそろえて', primary: true,
    cond: S => S.fin.kandori && !S.c.warrantPending && S.c.warrantReady !== 'honken' && (S.c.arrest == null || S.c.arrest_kind === 'bekken' || S.c.released) && !S.c.honkenArrested, run: async S => {
      G.drawScene(sc('todo'));
      const s = soumei(S);
      if (s.p < 3) { await G.talk([['todo', '……これで裁判官を説得できると思うか。'], ['todo', s.why.length ? s.why.join('、') + '。それだけじゃ弱い。' : '何もないじゃないか。'], ['todo', 'もう少し固めてこい。']]); return false; }
      await G.talk([['todo', s.why.join('、') + '。'], ['todo', '十分だ。請求する。'], ['', '（逮捕状は翌日発付される。）']]);
      S.c.warrantPending = { kind: 'honken', day: S.day };
    } });
  A.push({ id: 'warrantB', who: 'self', label: '賭博の容疑で逮捕状を請求する', sub: '別件。本命は強盗', cond: S => S.c.casino && S.c.arrest == null && !S.c.warrantPending && !S.c.warrantReady,
    risk: { id: 'bekken', lure: '課長「強盗で令状が取れないなら、賭博で引っ張れ。身柄さえ押さえれば、取調べの時間は手に入る」', title: '別件逮捕：本件（強盗）の取調べのために、別の罪で身柄を拘束する', law: '刑訴法199条。適法かどうかは学説・裁判例で判断が分かれる（条文帳「学説　別件逮捕・勾留」）',
      effects: ['裁判所が本件基準説などの立場を採れば、身柄拘束は違法とされ、その間に得た自白は証拠から外される', '別件基準説を採る裁判所なら、適法とされうる', 'どちらの立場が採られるかは、事前には分からない'], always: true },
    run: async S => {
      G.drawScene(sc('todo'));
      await G.talk([['todo', 'カジノか。……賭博で引っ張れるな。'], ['todo', '形式は整う。あとは取調室で、本命を聞けばいい。'], ['', '（賭博の逮捕状は翌日発付される。）']]);
      S.c.warrantPending = { kind: 'bekken', day: S.day };
    } });
  A.push({ id: 'arrestAct', who: 'self', once: false, label: '久住を逮捕する', sub: '逮捕状を執行する', primary: true, cond: S => !!S.c.warrantReady, run: async S => {
    const c = S.c, kind = c.warrantReady; c.warrantReady = null;
    G.audio.sfx('door'); G.drawScene(sc('kuzumi', 'street', 0));
    await G.talk([['you', '久住透さん。' + (kind === 'bekken' ? '賭博' : '強盗') + 'の容疑で、逮捕状が出ています。'], ['kuzumi', '……え。'], ['kuzumi', 'やってません。僕は、やってません。'], ['', '（午前7時03分、通常逮捕。）', { sfx: 'metal' }]]);
    if (kind === 'honken' && c.arrest != null && !c.released) { c.honkenArrested = true; c.rearrest = true; }
    if (kind === 'honken') c.honkenArrested = true;
    c.arrest = S.day; c.arrest_kind = kind; c.released = false;
    G.audio.cue('arrest');
    await G.talk(homeScene(2));
  } });
  // 別件で拘束中の再逮捕（本件）は warrant から

  /* ---------- 逮捕後 ---------- */
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
    K.addDoc({ id: 'jacket', title: kind === 'legal' ? '捜索差押調書' : '捜査報告書（居室の確認）', kind: 'inc', evid: true, illegal: kind === 'illegal', body:
      (kind === 'legal' ? P('捜索差押許可状に基づき、被疑者方居室を捜索した。') : P('管理人の承諾を得て、被疑者方居室に立ち入り、室内を確認した。<b>令状はない。本人の承諾もない。</b>'))
      + kv([['発見したもの', '灰色のナイロンジャケット1着（量販店の製品）'], ['発見されなかったもの', '刃物（台所の包丁を除く）、粘着テープ、多額の現金、手提げ金庫']]) });
    return [['shirai', '押入れに灰色のジャケットがありました。金も、金庫も、テープもなし。', { scene: sc('shirai') }]];
  }
  A.push({ id: 'fiber', who: 'staff', days: 7, label: 'ジャケットの繊維鑑定', short: '繊維鑑定', cond: S => !!S.c.search,
    done: S => { K.addDoc({ id: 'fiber', title: '繊維鑑定書', kind: 'inc', evid: true, derive: 'jacket', body: P('現場の玄関マットの灰色の繊維片と、押収したジャケットの繊維は、色調・材質（ナイロン）・断面形状が<b>類似する</b>。', 'ただし量販品であり、同種の製品は全国で大量に流通している。同一の衣服に由来するかは判断できない。') });
      return [['oka', '繊維は「類似」。ただ量販品で、同じ物は日本中にあるそうです。', { scene: sc('oka') }]]; } });
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
      return found ? [['', '（胴長を履いた白井が、泥の中から何かを引き上げた。）', { scene: { bg: 'street' } }], ['shirai', '……ありました。緑の金庫だ。'], ['shirai', '秘密の暴露ですな。これで決まりだ。']]
        : [['', '（2日間、水の中を捜した。）', { scene: { bg: 'street' } }], ['shirai', '……出ません。流されたか。']]; } });
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
  async function interro(S) {
    const c = S.c; c.sess = c.sess || { A: 0, B: 0, C: 0, D: 0, E: 0 }; c.sess.E = c.sess.E || 0; c.leaks = c.leaks || [];
    G.audio.ambient('interro'); G.drawScene(sc('kuzumi', 'interro', ks(S)));
    if (c.confession) {
      await G.talk([['kuzumi', c.confession.voluntary ? '……書いてあるとおりです。' : '……そう書いたんなら、そうなんでしょう。'], ['', '（それ以上、彼は何も言わなかった。）']]);
      G.audio.ambient(null); return;
    }
    const total = c.sess.A + c.sess.B + c.sess.C + c.sess.D + c.sess.E;
    await G.talk(total === 0 ? [['', '（久住透。34歳。痩せている。）'], ['kuzumi', '……何回聞かれても、やってないです。']] : [['kuzumi', G.pick(['……また、ですか。', '……おはようございます。', '……'])]]);
    const k = await G.openPaper({ title: '取調べ', sub: c.arrest_kind === 'bekken' ? '拘束の理由は賭博。だが、聞くのは強盗のことだ。' : '', noClose: true, body: P('どう進めるか。'),
      buttons: [{ label: '黙秘権を告げ、弁解を聴く', value: 'A', small: '言い分をそのまま聴き取る' },
        { label: '証拠を示して追及する', value: 'B', small: c.leaks.length < 3 ? '現場の写真や、集めた証拠を突きつける' : '集めた証拠を突きつける' },
        { label: '夜まで取調べを続ける', value: 'C', cls: 'red', small: '朝9時から、話すまで' },
        { label: '怒鳴りつけ、追い詰める', value: 'E', cls: 'red', small: '机を叩く。家族のことを持ち出す' },
        { label: '「認めれば、すぐ出られる」と言う', value: 'D', cls: 'red', small: '取引を持ちかける' }] });
    const RISK = {
      C: { id: 'long', title: '長時間の取調べ', law: '憲法38条2項、刑訴法319条1項', lure: (c.meter || 0) >= 55 ? '白井「あいつ、もう限界ですよ。今夜詰めれば、落ちます」' : '白井「時間をかければ、人は話すもんです」', effects: ['得た自白が、任意性を欠くとして証拠から外されうる', '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] },
      D: { id: 'promise', title: '利益を約束して自白を求める', law: '刑訴法319条1項（判例：約束による自白）', lure: '白井「家族の話をすると、たいてい落ちますよ」', effects: ['得た自白が、任意性を欠くとして証拠から外されうる', '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] },
      E: { id: 'threat', title: '脅迫的な取調べ', law: '憲法38条2項、刑訴法319条1項', lure: '課長「否認してる奴に遠慮してどうする」', effects: ['得た自白が、脅迫による自白として証拠から外されうる', '公判で、取調官として追及される', '虚偽の自白を生む原因になる'] }
    };
    if (RISK[k] && !(await G.confirmRisk(RISK[k]))) { G.audio.ambient(null); return false; }
    c.sess[k]++; if (c.arrest_kind === 'bekken') c.bekkenInterro = (c.bekkenInterro || 0) + 1;
    const n = c.sess[k]; let lines;
    if (k === 'A' && n === 1) lines = [['you', 'あなたには、言いたくないことは言わなくていい権利がある。そのうえで聞く。'], ['kuzumi', 'やってません。あの夜は、家で動画を見てました。'], ['kuzumi', '青柳さんには、世話になったんです。辞めたのだって……僕が盗ったわけじゃない。']];
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

  /* ---------- 終わり：送致記録 ---------- */
  async function finishCase(S, how) {
    const c = S.c; S._ended = true;
    c.how = how;
    if (how === 'soutchi') {
      G.audio.cue('soutchi');
      await G.curtain([{ html: '<div class="big">勾留満期</div>', wait: 1000 }]);
      K.render('（送致記録をまとめる。）');
      const ev = S.docs.filter(d => d.evid && !(d.id === 'video' && d.late));
      const tags = { inc: '被疑者に不利', exc: '被疑者に有利', neu: '中立' };
      const res = await G.openPaper({ title: '送致書（証拠品・書類目録）', sub: '検察官に送る記録を確かめる。チェックを外したものは送られない。', noClose: true,
        body: ev.map(d => '<label class="check"><input type="checkbox" data-id="' + d.id + '" checked><span>' + d.title + '<span class="tag' + (d.kind === 'exc' ? ' red' : '') + '">' + tags[d.kind] + '</span></span></label>').join('')
          + note('司法警察員は、捜査をしたときは、書類及び証拠物とともに事件を検察官に送致しなければならない（刑訴法246条）。'),
        buttons: [{ label: 'この内容で送致する', cls: 'green', value: 'ok', keep: true }] });
      const sent = {}; document.querySelectorAll('#overlay input[type=checkbox]').forEach(i => { sent[i.dataset.id] = i.checked; });
      G.closePaper();
      c.sent = sent; c.withheld = Object.keys(sent).filter(k => !sent[k]);
      await G.talk([['todo', 'ご苦労だった。あとは検察の仕事だ。', { scene: sc('todo') }]]);
    }
    K.end(how);
  }

  G.cases = G.cases || {};
  G.cases.aoyagi = {
    run: async function () {
      const S = { c: { truth: rnd() < .5 ? 'G' : 'I', leaks: [], sess: { A: 0, B: 0, C: 0, D: 0, E: 0 } } };
      G.audio.cue('main'); G.audio.ambient('office');
      await G.curtain(['<div class="big">本章</div><div class="small">青柳書房事件</div>']);
      const how = await K.start(C, S);
      G.audio.ambient(null);
      return S;
    },
    videoArrive
  };
})();
