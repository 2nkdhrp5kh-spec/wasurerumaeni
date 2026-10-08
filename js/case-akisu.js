'use strict';
/* ============================================================
   序章　事件1「空き巣」（本当に有罪。操作の練習を兼ねる）
   ============================================================ */
(function () {
  const K = G.keiji;
  const sc = (who, bg) => ({ bg: bg || 'office', who });

  const C = {
    id: 'akisu', role: '捜査官', base: { m: 9, d: 9 }, dayCard: true,
    staff: [{ id: 'shirai', name: '白井' }, { id: 'oka', name: '岡' }, { id: 'noguchi', name: '野口' }],
    elemTitle: '立証すべき事実',
    info: S => ({ text: '住宅侵入窃盗（空き巣）' + (S.c.arrest != null ? '　・逮捕' + (S.day - S.c.arrest) + '日目' : '') }),
    scene: S => sc(null, 'office'),
    endHint: S => S.tasks.length ? '部下の報告は日をまたいで届く' : '',
    elements: S => {
      const d = id => !!K.doc(id), c = S.c;
      const who = c.found ? 3 : (c.confess ? 3 : (d('camera') ? 2 : 0) + (d('kobutsu') ? 1 : 0));
      return [
        { k: '犯人性', v: Math.min(3, who), conf: c.confess && !c.found, src: c.found ? '秘密の暴露' : '' },
        { k: '被害', v: d('higai') ? 2 : 0, src: '' },
        { k: '犯行状況', v: c.confess ? 3 : d('kikikomi') ? 1 : 0, conf: c.confess }
      ];
    },
    morning: (S, first) => {
      const L = [];
      if (first) {
        L.push(['', '（9月9日。北見坂警察署、刑事課。朝。）', { sfx: 'phone' }],
          ['todo', '空き巣だ。本町三丁目、森本さん方。昨日の午後、留守の間に貴金属と現金をやられた。', { scene: sc('todo') }],
          ['todo', 'お前が主任だ。白井、岡、野口を使え。'],
          ['shirai', '……主任、まずやり方を確認しておきましょう。', { scene: sc('shirai') }],
          ['shirai', '下の「部下に指示する」から、俺たちに仕事を割り振ってください。終わるまでに何日かかかります。'],
          ['shirai', '「自分で動く」は、主任ご自身の行動です。1日にひとつ。'],
          ['shirai', '指示を出し終えたら「一日を終える」。報告は翌朝以降に届きます。'],
          ['shirai', '「立証すべき事実」の欄は、検察に送るまでに固めるべき事実です。証拠が揃うと埋まっていきます。'],
          ['shirai', 'まずは被害者の話と、盗品の行方ですかね。']);
      }
      if (S.c.warrant === 'issued' && !S.c.warrantTold) { S.c.warrantTold = true; L.push(['todo', '逮捕状が出た。行ってこい。', { scene: sc('todo') }]); }
      return L;
    },
    actions: [
      { id: 'higai', who: 'self', label: '被害者から話を聴く', sub: '森本さん方へ', run: async S => {
          G.drawScene({ bg: 'home' });
          await G.talk([['morimoto', '昼の1時に出かけて、4時過ぎに戻ったら、勝手口のガラスが割られていて……'], ['morimoto', '寝室の引き出しから、金のネックレスと指輪、それから封筒の現金が12万円。'], ['morimoto', 'ネックレスは、母の形見なんです。']]);
          K.addDoc({ id: 'higai', title: '被害届', kind: 'inc', evid: true, body: G.kv([['被害者', '森本 佳子（55歳）'], ['日時', '9月8日 午後1時ころから午後4時10分ころまでの間'], ['場所', '北見坂市本町三丁目 被害者方'], ['手口', '勝手口のガラスを割って侵入（ガラス破り）'], ['被害品', '金のネックレス1本、金の指輪2個、現金12万円']]) });
        } },
      { id: 'kikikomi', who: 'staff', days: 1, label: '近所の聞き込み', short: '聞き込み', sub: '不審な人物を見た人はいないか',
        done: S => { K.addDoc({ id: 'kikikomi', title: '聞き込み結果', kind: 'inc', evid: true, body: G.P('隣家の主婦：「2時40分ごろ、灰色の野球帽をかぶった男の人が、森本さんの家の裏から出てきて、駅の方へ歩いていった。40代くらい」') });
          return [['oka', '隣の奥さんが、2時40分ごろ灰色の帽子の男を見てます。', { scene: sc('oka') }]]; } },
      { id: 'kobutsu', who: 'staff', days: 2, label: '古物商の買取記録を照会する', short: '古物台帳の照会', sub: '盗品が売られていないか',
        done: S => { K.addDoc({ id: 'kobutsu', title: '古物台帳の照会結果', kind: 'inc', evid: true, body: G.kv([['店', 'リサイクルショップ「ハナマル」北見坂駅前店'], ['日時', '9月8日 午後3時52分'], ['品目', '金のネックレス1本（被害品と特徴が一致）'], ['売主', '坂井 稔（43歳）　運転免許証で本人確認']]) });
          return [['noguchi', '出ました！ 盗まれたネックレス、駅前のリサイクルショップに売られてます。', { scene: sc('noguchi') }], ['noguchi', '売ったのは坂井稔、43歳。免許証で確認されてます。']]; } },
      { id: 'zenreki', who: 'staff', days: 1, label: '坂井の前歴を照会する', short: '前歴照会', cond: S => !!K.doc('kobutsu'),
        done: S => { K.addDoc({ id: 'zenreki', title: '前歴照会結果', kind: 'memo', body: G.P('坂井稔：窃盗（住宅侵入）の前歴2件。いずれも手口はガラス破り。') });
          return [['shirai', '同じ手口の前が2件。……まあ、そういうことでしょうな。', { scene: sc('shirai') }]]; } },
      { id: 'ninni', who: 'self', label: '坂井から任意で話を聴く', sub: '署に来てもらう', cond: S => !!K.doc('kobutsu'), run: async S => {
          G.drawScene({ bg: 'interro', who: 'sakai' });
          await G.talk([['you', '9月8日の午後、どこにいましたか。'], ['sakai', 'パチンコですよ。「ゴールド北見」。昼から夕方までずっと。'], ['you', 'ネックレスを売りましたね。'], ['sakai', 'あれは死んだお袋の形見ですよ。金がなくて、仕方なく。'], ['', '（言い淀みはない。慣れているようにも見える。）']]);
          S.c.claim = true;
          K.addDoc({ id: 'sakaiclaim', title: '坂井の弁解', kind: 'memo', body: G.P('「9月8日は昼から夕方まで、パチンコ店『ゴールド北見』にいた」', '「ネックレスは母の形見」') });
        } },
      { id: 'pachinko', who: 'staff', days: 2, label: 'パチンコ店の防犯カメラを確認する', short: 'パチンコ店のカメラ', cond: S => S.c.claim,
        done: S => { K.addDoc({ id: 'camera', title: '防犯カメラ映像の確認結果', kind: 'inc', evid: true, body: G.kv([['入店', '9月8日 午後0時55分'], ['退店', '<b>午後2時10分</b>'], ['再入店', '午後3時35分']]) + G.P('退店時、灰色の野球帽をかぶっている。') });
          return [['oka', '坂井、2時10分にいったん店を出てます。戻ったのが3時35分。', { scene: sc('oka') }], ['oka', '出るときは、灰色の帽子をかぶってますね。'], ['shirai', '「ずっといた」は嘘だったわけだ。', { scene: sc('shirai') }]]; } },
      { id: 'warrant', who: 'self', label: '逮捕状の請求を課長に上げる', sub: '請求できるのは警部以上', cond: S => !!K.doc('kobutsu') && !S.c.warrant, run: async S => {
          G.drawScene(sc('todo'));
          if (!K.doc('camera')) { await G.talk([['todo', '売ったってだけじゃ弱い。拾ったと言われたらどうする。'], ['todo', 'あいつの言い分を潰してから持ってこい。']]); return false; }
          await G.talk([['todo', '盗品を売った。アリバイは嘘。同じ手口の前もある。'], ['todo', '十分だ。請求しておく。'], ['', '（逮捕状は翌日発付される。）']]);
          S.c.warrant = 'requested'; S.c.warrantDay = S.day;
        } },
      { id: 'arrest', who: 'self', label: '坂井を逮捕する', sub: '逮捕状を執行する', primary: true, cond: S => S.c.warrant === 'issued' && S.c.arrest == null, run: async S => {
          G.audio.sfx('door');
          G.drawScene({ bg: 'street', who: 'sakai' });
          await G.talk([['you', '坂井稔さん。窃盗の容疑で逮捕状が出ています。'], ['sakai', '……'], ['', '（午前9時12分、通常逮捕。）', { sfx: 'metal' }]]);
          S.c.arrest = S.day;
        } },
      { id: 'torishirabe', who: 'self', once: false, label: '坂井を取り調べる', sub: '黙秘権を告げてから', primary: true, cond: S => S.c.arrest != null && !S.c.confess, run: async S => {
          G.audio.ambient('interro'); G.drawScene({ bg: 'interro', who: 'sakai' });
          S.c.ts = (S.c.ts || 0) + 1;
          if (S.c.ts === 1) await G.talk([['you', 'あなたには、言いたくないことは言わなくていい権利があります。'], ['sakai', 'だから、パチンコ屋にいたって。'], ['you', '2時10分に店を出ていますね。カメラに映っています。'], ['sakai', '……タバコ買いに出ただけですよ。'], ['you', '1時間半も？'], ['sakai', '……']]);
          else {
            await G.talk([['sakai', '……刑事さん。'], ['sakai', 'やりました。森本さんの家。勝手口のガラス割って。'], ['you', '盗ったものは、ネックレスのほかには。'], ['sakai', '指輪は……北見坂駅の、東口のコインロッカーです。23番。鍵は、うちの靴箱の中。'], ['', '（指輪の行方は、まだ誰も知らなかった。）']]);
            S.c.confess = true; G.audio.cue('prologueSolve');
            K.addDoc({ id: 'confess', title: '坂井の供述調書', kind: 'inc', evid: true, body: G.P('私は、9月8日の午後2時半ころ、森本さん方の勝手口のガラスを割って中に入り、寝室の引き出しから金のネックレス、指輪2個、現金12万円を盗みました。', 'ネックレスは駅前のリサイクルショップに売りました。指輪は北見坂駅東口のコインロッカー23番に入れ、鍵は自宅の靴箱に隠しました。') });
          }
          G.audio.ambient(null);
        } },
      { id: 'locker', who: 'staff', days: 1, label: 'コインロッカーを確認する', short: 'ロッカーの確認', cond: S => S.c.confess,
        done: S => { S.c.found = true; K.addDoc({ id: 'locker', title: '捜索差押調書（ロッカー）', kind: 'inc', evid: true, stamps: [{ t: '秘密の暴露', c: 'red' }], body: G.P('被疑者方の靴箱から鍵を差し押さえ、北見坂駅東口コインロッカー23番を開披。金の指輪2個を発見した。被害者が自分のものと確認した。') + G.note('捜査側が知らなかった事実が、自白どおりに裏付けられた。これを「秘密の暴露」という。') });
          return [['noguchi', 'ありました！ 23番、指輪2個！', { scene: sc('noguchi') }], ['shirai', '自白どおりだ。……これで固い。', { scene: sc('shirai') }]]; } },
      { id: 'soutchi', who: 'self', label: '事件を検察官に送る', sub: '送致（刑訴法246条）', primary: true, cond: S => S.c.found, run: async S => {
          G.drawScene(sc('todo'));
          await G.talk([['todo', 'よくやった。'], ['todo', '見たか。嘘をつく奴は、何かを隠してる。'], ['todo', '覚えておけ。この仕事は、それがすべてだ。']]);
          K.end('done');
        } }
    ],
    after: S => {
      if (S.c.warrant === 'requested' && S.day > S.c.warrantDay) S.c.warrant = 'issued';
      return [];
    }
  };
  // 逮捕状の発付を朝の処理で
  const origMorning = C.morning;
  C.morning = (S, first) => { if (S.c.warrant === 'requested' && S.day > S.c.warrantDay) S.c.warrant = 'issued'; return origMorning(S, first); };

  G.cases = G.cases || {};
  G.cases.akisu = {
    run: async function () {
      G.audio.cue('prologue'); G.audio.ambient('office');
      const S = { c: {} };
      await K.start(C, S);
      G.audio.ambient(null);
      await G.curtain(['<div class="law">坂井稔は起訴され、拘禁刑1年10月の判決を受けた。<br><br>否認から9日。<br>事件は、教科書どおりに片づいた。</div>']);
      G.meta.prologueDone = true; G.saveMeta();
    }
  };
})();
