'use strict';
/* ============================================================
   事件：北見坂駅前事件（傷害致死）
   争点は「誰がやったか」ではなく「何が起きたか」。正当防衛は成立するか。
   真相：'D'（樋口が先に襲いかかり、戸田は振り払っただけ）／'A'（戸田が先に殴った）
   裁判員裁判の対象。逮捕後の取調べは録画される。逮捕前の任意の聴取は録画されない。
   ============================================================ */
(function () {
  const K = G.keiji, P = G.P, kv = G.kv, note = G.note, rnd = G.rnd, kit = G.kit, sc = kit.sc;
  const inC = kit.inCustody, cday = kit.custodyDay;
  const C = {
    id: 'ekimae', role: '捜査官', base: { m: 11, d: 15 }, dayCard: true,
    staff: [{ id: 'shirai', name: '白井' }, { id: 'oka', name: '岡' }, { id: 'noguchi', name: '野口' }],
    elemTitle: '立証すべき事実',
    info: S => kit.info(S, '北見坂駅前事件（傷害致死）'),
    scene: S => sc(inC(S) ? 'toda' : null, 'office', kit.stage(S)),
    endHint: S => inC(S) ? '満期までに記録を固める' : '',
    stopSkip: S => (inC(S) && (cday(S) >= kit.LIMIT || (cday(S) >= 16 && !S.c.confession && !S.c.takeoverAsked))) || (S.c.arrest == null && S.day >= 21),
    gauge: S => G.trial.gauge(S, TRIAL),
    elements: S => {
      const c = S.c, d = id => !!K.doc(id);
      const first = (c.confession ? 3 : 0) || Math.min(3, (d('witA') ? 1 : 0) + (c.recorder === 'A' ? 3 : 0) + (d('autopsy') ? 1 : 0));
      return [
        { k: '暴行と死亡', v: d('autopsy') ? 3 : 1, src: d('autopsy') ? '解剖' : '' },
        { k: '先に手を出した', v: first, conf: !!c.confession && c.recorder !== 'A', src: '' },
        { k: '防衛の必要がない', v: Math.min(3, first), conf: !!c.confession },
        { k: '故意', v: d('witA') || c.confession ? 2 : 1 }
      ];
    },
    morning: (S, first) => {
      const c = S.c, L = [];
      if (first) {
        L.push(['', '（11月15日、午前1時。北見坂駅前のロータリー裏で、男が倒れたと119番通報があった。通報したのは、相手の男だった。）', { sfx: 'phone' }],
          ['todo', '倒れたのは樋口和也、28歳。会社員。頭を打って意識がない。', { scene: sc('todo') }],
          ['todo', '相手は戸田誠、41歳、タクシー運転手。「向こうが殴りかかってきたから、振り払っただけだ」と言ってる。'],
          ['todo', '署で任意で話を聴いてる。……逮捕するかどうかは、お前が決めろ。'],
          ['shirai', '主任、一つ。逮捕すれば、取調べは録画されます。死亡事件になれば裁判員裁判の対象ですから。', { scene: sc('shirai') }],
          ['shirai', '逮捕する前の任意の聴取は、録画の義務はありません。……まあ、覚えておいてください。']);
        K.addDoc({ id: 'scene', title: '実況見分調書', kind: 'neu', evid: true, body: P('北見坂駅前ロータリー裏の路地（幅約4m）。被害者は歩道の縁石付近に仰向けに倒れていた。縁石の角に血液付着。', '路地には、被害者のものとみられる眼鏡（レンズ破損）が落ちていた。現場から約3mの位置に、戸田のタクシー（客待ち中）が停車していた。') });
        K.addDoc({ id: 'manual', title: '捜査の要点', kind: 'memo', body: P('・争点は「誰が」ではなく「何が起きたか」。正当防衛（刑法36条1項）は、急迫不正の侵害に対し、自己の権利を防衛するため、やむを得ずにした行為を罰しない。',
          '・防衛の程度を超えた場合は過剰防衛（同条2項）。刑を減軽・免除できる。',
          '・被害者が死亡すれば、傷害致死（刑法205条）。裁判員裁判の対象で、逮捕・勾留中の取調べは録音録画される（刑訴法301条の2）。',
          '・二つの記録を照らし合わせると、食い違いやつながりが見つかることがある。') });
        return L;
      }
      if (S.day === 1) { c.dead = true; L.push(['', '（午前10時12分。樋口和也が、搬送先の病院で死亡した。急性硬膜下血腫。）', { sfx: 'bell' }], ['todo', '傷害致死だ。……逮捕状を取るなら、今日明日だぞ。', { scene: sc('todo') }]); }
      if (c.warrantPending && S.day > c.warrantPending) { c.warrantPending = null; c.warrantReady = true; L.push(['todo', '逮捕状が出た。', { scene: sc('todo') }]); }
      if (inC(S)) {
        L.push(...kit.custodyMorning(S, { name: '戸田', kenji2: '……正当防衛の主張は、崩せそうですか。', wantConfession: '「先に手を出した」と認めたか、とな。' }));
        if (cday(S) === 1) { K.addDoc({ id: 'news', title: '新聞記事', kind: 'memo', body: P('<b>駅前で口論、男性死亡　タクシー運転手を逮捕</b>', '北見坂署は、北見坂駅前で会社員の男性（28）を転倒させ死亡させたとして、傷害致死の疑いで、タクシー運転手の戸田誠容疑者（41）を逮捕した。同容疑者は「相手が殴りかかってきた」と話している。') }); }
        if (cday(S) === 6) { c.fired = true; L.push(['shirai', '戸田のタクシー会社、乗務停止にしたそうです。逮捕で、二種免許の更新もどうなるか。', { scene: sc('shirai') }]); }
        if (cday(S) === 9) L.push(['', '（樋口の母親が署を訪れた。「息子は、人に殴りかかるような子じゃありません」。）']);
      }
      if (S.day === 4 && c.arrest == null) L.push(['todo', '遺族が「なぜ逮捕しないのか」と言ってきてる。', { scene: sc('todo') }]);
      return L;
    },
    check: async S => {
      const c = S.c;
      if (inC(S) && cday(S) >= 16 && !c.confession && !c.takeoverAsked && !(c.sess.C || c.sess.D || c.sess.E)) await kit.takeover(S, confess);
      if (inC(S) && cday(S) >= kit.LIMIT) { await finish(S, 'soutchi'); return 'end'; }
      if (c.arrest == null && S.day >= 21) { await G.talk([['todo', 'いつまで在宅で引っ張るつもりだ。検事に送るぞ。', { scene: sc('todo') }]]); await finish(S, 'zaitaku'); return 'end'; }
    },
    actions: []
  };
  const A = C.actions;

  /* 照合 */
  C.compare = (S, a, b) => {
    const c = S.c, has = (x, y) => (a === x && b === y) || (a === y && b === x);
    if (has('witA', 'witB')) return { lines: [['', '（畑中は「背の高いほうが殴った」。コンビニの店員は「若いほうが先に掴みかかった」。）'], ['oka', '二人とも、見たのは一部だけかもしれません。順番が違うのかも。', { scene: sc('oka') }]], memo: { title: '目撃の食い違い', text: '畑中は「背の高い男（戸田）が殴った」、店員は「若い男（樋口）が先に掴みかかった」。それぞれ、別の瞬間を見ていた可能性がある。' }, then: S => { c.orderLead = true; } };
    if (has('witA', 'camera')) return { lines: [['', '（畑中がいたタクシー乗り場から現場までは約30m。カメラでは、その間をバスが横切っている。）'], ['shirai', '肝心の瞬間、畑中からは見えてなかった可能性がありますな。', { scene: sc('shirai') }]], memo: { title: '畑中の位置', text: '畑中のいた位置からは、23時19分45秒〜50秒の間、バスが視界を遮っていた。' } };
    if (has('autopsy', 'witA')) return { lines: [['', '（解剖では、左頬に打撲。「手拳による殴打の可能性があるが、転倒時の接触でも生じうる」。）'], ['oka', '殴ったとも、倒れたときの傷とも言える……。', { scene: sc('oka') }]], memo: { title: '頬の打撲', text: '左頬の打撲は、殴打によるとも、転倒によるとも説明できる。' } };
    if (has('shirt', 'claim') || has('shirt', 'witB')) return { lines: [['', '（戸田のシャツは襟元のボタンが取れ、首の後ろにひっかき傷がある。）'], ['shirai', '掴みかかられたのは、本当なんでしょうな。……その後のことは、分かりませんが。', { scene: sc('shirai') }]], memo: { title: '襟元の傷', text: '戸田の襟元の損傷とひっかき傷は、樋口が掴みかかったという供述と合う。' } };
    if (has('friend', 'witB')) return { lines: [['', '（同僚は「樋口は酔うと絡む癖があった」。店員の話とつながる。）'], ['oka', 'ただ、そういう話は……法廷では、性格の話だと言われるかもしれません。', { scene: sc('oka') }]], memo: { title: '酔うと絡む', text: '樋口は酔うと他人に絡む癖があったという。ただし、性格から行為を推認することには慎重さが求められる。' } };
    if (has('recorder', 'witA') && c.recorder) return { lines: [['', '（ドライブレコーダーの音声と、畑中の話を突き合わせる。）']].concat(c.recorder === 'D' ? [['oka', '音声では、先に怒鳴ってるのは樋口のほうです。「なんだよてめえ」……そのあと、どさっと。', { scene: sc('oka') }]] : [['oka', '音声では、戸田が「なめてんのか」と怒鳴って……殴る音のあとに、倒れる音。', { scene: sc('oka') }]]),
      memo: { title: 'ドライブレコーダーの音声', text: c.recorder === 'D' ? '音声では、先に怒鳴り、掴みかかったのは樋口。その数秒後に転倒音。' : '音声では、戸田が怒鳴った後に打撃音、続いて転倒音。' } };
    if (has('prior', 'claim')) return { lines: [['', '（戸田には10年前、客との喧嘩で傷害の前歴がある。示談で不起訴。）'], ['shirai', '前もやってる。……とはいえ、前科で今回を決めるわけにはいきませんがね。', { scene: sc('shirai') }]], memo: { title: '前歴', text: '戸田には傷害の前歴がある。ただし、前科・前歴から「今回もやった」と推認することは、原則として許されない。' } };
    if (has('confession', 'witB') && c.confession) return { lines: [['', '（調書では「先に殴った」。店員は「若いほうが先に掴みかかった」。）'], ['shirai', '……どっちが本当なんでしょうな。', { scene: sc('shirai') }]], memo: { title: '自白と目撃の食い違い', text: '戸田の自白（先に手を出した）と、店員の目撃（樋口が先に掴みかかった）は合わない。' } };
    return null;
  };

  /* 行動 */
  A.push({ id: 'claimTalk', who: 'self', label: '戸田から任意で話を聴く', sub: '逮捕前。録画の義務はない', cond: S => S.c.arrest == null && !S.fin.claimTalk, run: async S => {
    const v = await G.openPaper({ title: '任意の事情聴取', body: P('戸田は自分から119番通報し、署に来ている。逮捕はしていない。いつでも帰れる。'), noClose: true,
      buttons: [{ label: '言い分を聴く', value: 'n' }, { label: '「先に手を出したのはお前だろう」と朝まで詰める', value: 'p', cls: 'red', small: '録画されない場所で' }] });
    G.drawScene(sc('toda', 'interro', 0));
    if (v === 'p' && !(await G.confirmRisk({ id: 'ninniP', title: '任意の取調べで、長時間・強圧的に追及する', law: '刑訴法198条1項ただし書、319条1項（任意捜査の限界）', lure: '課長「逮捕したら録画だ。今のうちに、話を固めておけ」', effects: ['任意取調べでも、社会通念上相当な限度を超えれば違法となりうる', 'ここで得た供述は、任意性を欠くとして証拠から外されうる', '録画がない以上、何があったかは、あなたと戸田の言い分だけになる'] }))) return false;
    if (v === 'p') { S.c.ninniPressure = true; S.c.illegalCount = (S.c.illegalCount || 0) + 1; }
    await G.talk([['toda', '客待ちしてたら、あの若いのが窓を叩いてきたんです。「おい、乗せろ」って。予約の客を待ってるからって断ったら、ドアを開けて襟首を掴まれて。'],
      ['toda', '降りて、振り払いました。そしたら、後ろに倒れて……縁石に頭を。'], ['you', '殴ってはいないんですか。'], ['toda', '殴ってません。手で、押しただけです。']]
      .concat(v === 'p' ? [['', '（午前6時まで、同じ質問を繰り返した。戸田は何度も「帰らせてくれ」と言った。）'], ['toda', '……押した、じゃなくて、突き飛ばした、ですか。……もう、それでいいです。']] : []));
    if (v === 'p') S.c.ninniStatement = true;
    K.addDoc({ id: 'claim', title: '戸田の供述（任意）', kind: 'neu', evid: true, body: P('「樋口が窓を叩き、ドアを開けて襟首を掴んできた。降りて振り払ったら、後ろに倒れた。殴ってはいない。手で押しただけ」')
      + (v === 'p' ? P('（明け方の追加部分）「突き飛ばした、ということでいいです」') + note('この聴取は午前6時まで続いた。録画はない。') : '') });
  } });
  A.push({ id: 'shirt', who: 'staff', days: 1, label: '戸田の着衣とけがを確認する', short: '着衣・けがの確認', sub: '任意で写真を撮る', cond: S => S.fin.claimTalk,
    done: S => { K.addDoc({ id: 'shirt', title: '着衣・身体の見分結果', kind: 'neu', evid: true, body: P('戸田のワイシャツは襟元のボタンが一つ取れ、襟が裂けている。首の後ろにひっかき傷（長さ約3cm）。', '右手の甲に擦過傷。') });
      return [['noguchi', '襟がちぎれてて、首にひっかき傷。右手の甲にすり傷もありました。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'recorder', who: 'staff', days: 0, label: 'タクシーのドライブレコーダーを確保する', short: 'ドラレコの確保', sub: '上書きされる前に（任意提出）', cond: S => S.fin.claimTalk && !S.c.recorderTried,
    start: S => { S.c.recorderTried = true; },
    done: S => { const c = S.c;
      if (S.day >= 2) { K.addDoc({ id: 'recorderNone', title: 'ドライブレコーダーの確認結果', kind: 'neu', body: P('事件後もタクシーが営業を続けたため、当該時間帯の映像・音声は上書きされていた。') }); return [['oka', '……遅かったです。営業を続けてたんで、上書きされてました。', { scene: sc('oka') }]]; }
      c.recorder = c.truth;
      K.addDoc({ id: 'recorder', title: 'ドライブレコーダーの記録', kind: 'neu', evid: true, body: P('車外カメラは前方を向いており、現場は映っていない。', '車内マイクが、開いたドアから外の音声を拾っている。')
        + (c.truth === 'D' ? P('23:19:41　男の声「なんだよてめえ、乗せろっつってんだろ」（樋口とみられる）', '23:19:44　布の擦れる音、「離せ」（戸田とみられる）', '23:19:48　「離せって」', '23:19:50　鈍い音、転倒音') : P('23:19:41　男の声「乗せろよ」（樋口とみられる）', '23:19:44　「なめてんのか」（戸田とみられる）', '23:19:47　打撃音', '23:19:50　転倒音')) });
      return [['oka', 'ドラレコ、間に合いました。映像には映ってませんが、音が拾えてます。', { scene: sc('oka') }]]; } });
  A.push({ id: 'witA', who: 'staff', days: 1, label: 'タクシー乗り場の目撃者から話を聴く', short: '目撃者（乗り場）', cond: S => true,
    done: S => { K.addDoc({ id: 'witA', title: '目撃者・畑中の供述', kind: 'neu', evid: true, body: P('（畑中正樹・52歳、会社員。飲み会の帰りでタクシー乗り場に並んでいた）', '大声がしたので見たら、背の高いほうが、若いほうを殴った。若いのが倒れた。', '距離は30mくらい。結構飲んでたけど、見間違いじゃないと思う。') });
      return [['witA', '背の高いほうが殴ったんですよ。若いのがひっくり返って。', { scene: { bg: 'street' } }]]; } });
  A.push({ id: 'witB', who: 'staff', days: 2, label: 'コンビニの店員から話を聴く', short: '目撃者（コンビニ）', cond: S => true,
    done: S => { K.addDoc({ id: 'witB', title: 'コンビニ店員の供述', kind: 'neu', evid: true, body: P('（店員・22歳。店の窓から路地の入口が見える）', '若い男の人が、タクシーの運転手さんに掴みかかってるのが見えました。そのあとレジに呼ばれて、戻ったら、もう倒れてました。') });
      return [['clerk2', '若い人のほうが、運転手さんに掴みかかってました。そこまでしか、見てないです。', { scene: sc('clerk', 'street') }]]; } });
  A.push({ id: 'camera', who: 'staff', days: 2, label: '駅前の防犯カメラを集める', short: '防犯カメラ', cond: S => true,
    done: S => { K.addDoc({ id: 'camera', title: '防犯カメラ映像の解析報告', kind: 'neu', evid: true, body: P('駅前ロータリーのカメラ（約40m）。23:19:38、樋口がタクシーに近づく。23:19:44、二人がもみ合う。<b>23:19:45〜50、路線バスが通過し、二人は画面から隠れる。</b>23:19:51、樋口が路面に倒れている。') });
      return [['noguchi', '肝心のところで、バスが横切ってます。5秒間、何も見えません。', { scene: sc('noguchi') }]]; } });
  A.push({ id: 'autopsy', who: 'staff', days: 3, label: '司法解剖の結果を受け取る', short: '解剖結果', cond: S => S.c.dead,
    done: S => { K.addDoc({ id: 'autopsy', title: '解剖結果（鑑定書）', kind: 'neu', evid: true, body: P('死因：急性硬膜下血腫。後頭部を縁石の角に強打したことによる。', '左頬に打撲（直径約3cm）。手拳による殴打の可能性があるが、転倒時に路面等と接触しても生じうる。', '血中アルコール濃度：1.6mg/ml（中程度の酩酊）。') });
      return [['oka', '死因は後頭部の強打。頬の打撲は、殴られたとも、倒れたときの傷とも言える、だそうです。', { scene: sc('oka') }]]; } });
  A.push({ id: 'friend', who: 'staff', days: 2, label: '樋口の同僚から話を聴く', short: '樋口の同僚', cond: S => true,
    done: S => { K.addDoc({ id: 'friend', title: '樋口の同僚の供述', kind: 'neu', evid: true, body: P('その夜は会社の飲み会で、樋口は3軒目まで付き合った。だいぶ酔っていた。', '樋口は酔うと、店員やタクシーの運転手に絡むことがあった。普段は穏やかなやつなんです。') });
      return [['oka', '同僚の話だと、酔うと絡む癖があったそうです。', { scene: sc('oka') }]]; } });
  A.push({ id: 'prior', who: 'staff', days: 1, label: '戸田の前歴を照会する', short: '前歴照会', cond: S => true,
    done: S => { K.addDoc({ id: 'prior', title: '前歴照会結果', kind: 'neu', evid: true, body: P('戸田誠：10年前、乗客との口論で相手を殴り、傷害で検挙。示談成立により不起訴。') });
      return [['shirai', '10年前に、客を殴ってますな。示談で不起訴。', { scene: sc('shirai') }]]; } });
  A.push({ id: 'witAAgain', who: 'self', label: '畑中に、もう一度話を聴く', sub: '見た順番について', cond: S => S.c.orderLead && !S.fin.witAAgain, run: async S => {
    G.drawScene({ bg: 'street' });
    await G.talk([['witA', '順番、ですか。……大声がして、振り向いたら、もう殴ってたような。'], ['witA', 'バス？ ああ、バスは通ったかもしれない。……その前に何があったかは、正直、分からないです。']]);
    K.addDoc({ id: 'witA2', title: '目撃者・畑中の供述（2回目）', kind: 'neu', evid: true, body: P('振り向いたときには、もう背の高い男が手を出していた。それより前に何があったかは見ていない。バスが通ったかもしれない。') });
  } });
  A.push({ id: 'warrant', who: 'self', label: '逮捕状の請求を課長に上げる', sub: '傷害致死', primary: true, cond: S => S.c.arrest == null && !S.c.warrantPending && !S.c.warrantReady && S.c.dead, run: async S => {
    await G.talk([['todo', '死んでるんだ。相手は「押した」と認めてる。令状は出るさ。', { scene: sc('todo') }], ['', '（逮捕状は翌日発付される。）']]);
    S.c.warrantPending = S.day;
  } });
  A.push({ id: 'arrest', who: 'self', label: '戸田を逮捕する', primary: true, cond: S => S.c.warrantReady && S.c.arrest == null, run: async S => {
    G.drawScene(sc('toda', 'street', 0));
    await G.talk([['you', '戸田誠さん。傷害致死の容疑で逮捕します。'], ['toda', '……向こうから来たんですよ。俺は、振り払っただけだ。'], ['', '（逮捕。ここから先の取調べは、録音・録画される。）', { sfx: 'metal' }]]);
    S.c.arrest = S.day; S.c.recorded = true; S.c.warrantReady = false;
  } });
  A.push({ id: 'interro', who: 'self', once: false, label: '戸田を取り調べる', sub: '録画されている', primary: true, cond: S => inC(S), run: async S => kit.interro(S, ICFG) });
  A.push({ id: 'zaitakuSend', who: 'self', label: '逮捕せず、在宅のまま送致する', sub: '身柄は拘束しない', cond: S => S.c.arrest == null && S.c.dead && S.day >= 3, run: async S => {
    await G.talk([['todo', '……在宅で送るのか。遺族は納得しないぞ。', { scene: sc('todo') }]]); await finish(S, 'zaitaku');
  } });

  /* 取調べ */
  const ICFG = {
    who: 'toda', guiltyKey: 'A', recorded: true,
    first: [['', '（戸田誠。41歳。肩幅が広い。両手を膝の上で固く握っている。）'], ['toda', '……何度でも言いますよ。向こうが先です。']],
    labels: { A: ['黙秘権を告げ、言い分を聴く', 'そのまま聴き取る'], B: ['目撃者の話を突きつける', '「殴ったのを見た人がいる」'], D: ['「認めれば、執行猶予がつく」と言う', '取引を持ちかける'] },
    inc: { A: { G: 8, I: 4 }, B: { G: 18, I: 14 }, C: { G: 30, I: 28 }, D: { G: 28, I: 28 }, E: { G: 26, I: 24 } },
    pools: {
      A: [S => [['you', '言いたくないことは言わなくていい。そのうえで聞く。'], ['toda', '窓を叩かれて、断って、掴まれて、振り払った。それだけです。']],
        S => [['toda', '18年、タクシーやってます。酔っぱらいの扱いは慣れてる。だから、手は出さないって決めてたんです。']],
        S => [['toda', '……あの若い人、死んだんですよね。'], ['toda', '俺が手を振り払わなかったら、死ななかったのかな。'], ['', '（それが、罪を認める言葉なのかどうかは、分からない。）']],
        S => S.c.fired ? [['toda', '会社から、乗務停止だって。……家のローン、どうすればいいんですかね。']] : null,
        S => [['toda', '殴ってない。手のひらで、胸を押した。それだけです。']]],
      B: [S => K.doc('witA') ? [['you', 'タクシー乗り場の人が、お前が殴るのを見てる。'], ['toda', '30mも離れてて、何が見えるんですか。酔っぱらいでしょう。']] : null,
        S => K.doc('autopsy') ? [['you', '樋口さんの左頬に、殴られた跡がある。'], ['toda', '倒れたときに、ぶつけたんじゃないですか。……俺は、殴ってない。']] : null,
        S => K.doc('prior') ? [['you', '10年前も、客を殴ってるな。'], ['toda', '……それは、関係ないでしょう。']] : null,
        S => [['you', 'お前の言い分を裏付けるものは、何もない。'], ['toda', '……']]],
      C: [S => [['', '（録画装置が回り続けている。午後10時。）'], ['toda', 'もう、何回目ですか、この話。']], S => [['', '（13時間目。カメラの前で、戸田は何度も目をこすった。）']]],
      D: [S => [['you', '先に手を出したと認めれば、執行猶予がつくかもしれない。否認してたら、実刑だ。'], ['toda', '……執行猶予。']], S => [['you', '認めれば、検事にうまく話してやる。'], ['toda', '……カメラ、回ってますよね。']]],
      E: [S => [['you', '人が一人死んでるんだぞ！ いい加減にしろ！', { sfx: 'thud' }], ['', '（机を叩く音を、録画装置が拾った。）']], S => [['you', 'お前の嫁さんにも、話を聞くことになるぞ。'], ['toda', '……やめてください。']]]
    },
    confess: confess,
    afterConfession: async S => { await G.talk([['toda', '……調書に書いてあるとおりです。'], ['', '（彼は、それ以上答えなかった。）']]); return false; }
  };
  async function confess(S, voluntary, opt) {
    const c = S.c; opt = opt || {};
    if (opt.by === 'todo') await G.talk([['todo', '認めたぞ。調書はお前が巻け。', { scene: sc('todo') }]]);
    else await G.talk(voluntary ? [['toda', '……正直に言います。断ったとき、頭に来て。'], ['toda', '先に、殴りました。']] : [['toda', '……もう、それでいいです。'], ['toda', '先に、殴りました。']]);
    // 調書の言葉を選ぶ
    const verb = await G.openPaper({ title: '供述調書の作成', sub: '戸田の行為を、どの言葉で書くか', noClose: true, body: P('取調べは録画されている。戸田が実際に口にした言葉は「殴りました」「押した」が混ざっている。'),
      buttons: [{ label: '「右の拳で、顔面を殴りつけた」', value: 'naguru', small: '検事が好む書き方' }, { label: '「手で、強く押した」', value: 'osu', small: '本人の言い方に近い' }] });
    c.confession = { voluntary, verb, by: opt.by || 'you', day: S.day };
    K.addDoc({ id: 'confession', title: '戸田の供述調書（自白）', kind: 'neu', evid: true, body: () => P('私は、樋口さんに断ったとき、腹が立って、' + (verb === 'naguru' ? '右の拳で樋口さんの顔面を殴りつけました。' : '両手で、樋口さんの胸を強く押しました。') + '樋口さんは後ろに倒れ、縁石に頭を打ちました。', '先に手を出したのは、私です。')
      + note('取調べは録画されている。') });
    await G.talk([['', '（調書が作られ、戸田は署名した。）', { sfx: 'pen' }]]);
  }

  async function finish(S, how) {
    S._ended = true; S.c.how = how;
    if (how === 'zaitaku') S.c.zaitaku = true;
    await kit.soutchi(C, S);
    K.end(how);
  }

  /* 公判 */
  const TRIAL = {
    name: '駅前事件', court: '北見坂地方裁判所（裁判員裁判：裁判官3人・裁判員6人）', truthText: '樋口が先に襲いかかった世界か、戸田が先に殴った世界か。',
    issue: { pro: '正当防衛が成立しないことを示す事情', yes: '以上によれば、被告人の行為は正当防衛に当たらない。', no: '以上によれば、被告人の行為が正当防衛に当たらないことについて、合理的な疑いが残る。刑訴法336条により、被告人に対し無罪の言渡しをする。' },
    retract(S) { const c = S.c; if (c.confession) c.retract = c.confession.voluntary ? false : c.truth === 'D' ? rnd() < .85 : rnd() < .4; },
    lines(S, charge) { const c = S.c; return [['kenji', c.confession ? (c.retract ? '戸田は公判前に自白を撤回しました。録画を見れば、事情は分かるでしょう。' : '戸田は「先に殴った」と認めています。') : '戸田は一貫して正当防衛を主張しています。'],
      ['kenji', charge ? '傷害致死で起訴します。' : '……正当防衛の成立を否定できません。不起訴とします。'], ['', charge ? '（戸田誠は、傷害致死で起訴された。裁判員裁判である。）' : '（戸田誠は、罪に問われなかった。）']]; },
    weigh(S, ids, trial) {
      const c = S.c, has = id => ids.includes(id); let pos = 0, neg = 0; const pros = [], cons = [];
      const add = (v, why) => { if (v > 0) { pos += v; if (why) pros.push(why); } else if (v < 0) { neg -= v; if (why) cons.push(why); } };
      if (has('confession') && c.confession) add((c.retract && trial ? .7 : 1) * (c.confession.verb === 'naguru' ? (trial && c.recorded ? 2 : 3.5) : 2.5), c.confession.verb === 'naguru' && trial && c.recorded ? '被告人は捜査段階で先に手を出したと認めている。もっとも、録画では「押した」とも述べており、調書の「殴りつけた」との表現は、そのまま採用できない' : '被告人は捜査段階で、先に手を出したと認めている');
      if (has('recorder') && c.recorder === 'A') add(4, 'ドライブレコーダーの音声によれば、被告人が怒鳴った後に打撃音があり、その後に転倒音がある');
      if (has('recorder') && c.recorder === 'D') add(-5, 'ドライブレコーダーの音声によれば、先に怒鳴り、掴みかかったのは被害者であり、被告人は「離せ」と繰り返している');
      if (has('witA')) add(has('witA2') ? .5 : 1.5, has('witA2') ? '目撃者畑中は、被告人が手を出すのを見たが、それより前の経緯は見ていない' : '目撃者畑中は、被告人が被害者を殴るのを見たと述べる');
      if (has('autopsy')) add(.5, '被害者の左頬には打撲がある');
      if (has('prior') && !trial) add(.5, '');
      if (has('claim') && c.ninniStatement) add(1.5, '被告人は任意の取調べで「突き飛ばした」と述べている');
      if (has('witB')) add(-1.5, 'コンビニ店員は、被害者が先に被告人に掴みかかるのを見ている');
      if (has('shirt')) add(-1, '被告人の襟元の損傷と首のひっかき傷は、被害者に掴みかかられたとの供述と合う');
      if (has('camera')) add(-.5, '防犯カメラには、被害者が被告人に近づき、二人がもみ合う様子が写っている');
      if (has('friend')) add(-.4, '');
      if (has('autopsy')) add(-.3, '被害者は中程度に酩酊していた');
      return { pos, neg, pros, cons };
    },
    admit(S, admit, drop) {
      const c = S.c;
      if (has(admit, 'prior')) drop('prior', '被告人の前歴は、被告人の性格から本件行為を推認させるために用いることになり、証拠として採用しない');
      if (c.confession && (c.recordedAbuse || 0) > 0 && rnd() < .9) drop('confession', '録画によれば、自白は長時間の追及、脅迫的な言動又は利益の約束の下でされたもので、任意性に疑いがある（刑訴法319条1項）');
      if (c.ninniPressure) drop('claim', '任意の取調べは明け方まで続き、社会通念上相当な限度を超えていた疑いがある。この間の供述の追加部分は採用しない');
    },
    decide(S, r, admit) {
      const net = r.pos - r.neg;
      if (net >= 3.5 && r.neg <= 1.2) return { verdict: '有罪', main: '被告人を拘禁刑5年に処する。' };
      if (net >= 2 && r.neg <= 2.6) return { verdict: '有罪（減軽）', main: '被告人を拘禁刑3年に処する。この裁判確定の日から5年間その刑の執行を猶予する。', reduce: '被害者が先に掴みかかった事実は認められるが、被告人の反撃は防衛の程度を超えたものであり、過剰防衛（刑法36条2項）に当たる。' };
      return { verdict: '無罪', main: '被告人は無罪。' };
    },
    nothing: v => v.startsWith('有罪') ? '戸田誠は、タクシーには戻らなかった。' : '戸田誠は、別の会社でハンドルを握っているという。',
    finale: '本件は裁判員裁判の対象事件であり、逮捕後の取調べは録画されていた（刑訴法301条の2）。<br>逮捕される前の任意の取調べは、録画の義務の対象ではない。',
    async reveal(S, verdict) {
      const c = S.c, guilty = verdict.startsWith('有罪');
      if (guilty && c.truth === 'D' && rnd() < .55) {
        await G.curtain([{ html: '<div class="big">4年後</div>', wait: 1200 },
          { html: '<div class="doc-s"><h3>動画</h3>ある女性のスマートフォンに、古い動画が残っていた。<br>あの夜、駅前でバスを待っていた彼女は、酔った若い男がタクシーの運転手に掴みかかる様子を、面白半分に撮っていた。<br><br>動画の中で、運転手は三度「離せ」と言い、男の手を振り払っていた。<br>男は、自分の勢いで、後ろに倒れた。</div>', wait: 3400 },
          { html: '<div class="doc-s"><h3>再審</h3>戸田誠は、すでに刑を終えていた。<br>動画は新証拠と認められ、再審が開始された（刑訴法435条6号）。<br>再審公判で、戸田は無罪となった。<br><br>「あの夜、振り払わなければよかったんですかね。……じゃあ、どうすればよかったんですか」</div>', wait: 3400 }]);
        return true;
      }
      if (!guilty && c.truth === 'A' && rnd() < .55) {
        await G.curtain([{ html: '<div class="big">3年後</div>', wait: 1200 },
          { html: '<div class="doc-s"><h3>判決（隣県の地方裁判所）</h3>タクシー運転手の戸田誠は、運賃をめぐって口論になった乗客の男性（34）の顔面を拳で多数回殴り、急性硬膜下血腫等の傷害を負わせた。男性には重い後遺障害が残り、言葉を話すことができなくなった。<br><br>戸田は、取調べ（録画）でこう述べた。<br>「前にも一度、駅前でやった。あのときも、先に殴ったのは俺だ。」</div>', wait: 3600 },
          { html: '<div class="doc-s"><h3>樋口和也の母の手記（抜粋）</h3>「あの子は酔うと口が悪くなる子でした。それは知っています。<br>でも、殴られて死ぬほどのことを、あの子はしたんでしょうか。<br>『正当防衛』という言葉を、私は、たぶん一生、許せません。」</div>', wait: 3600 },
          { html: '<div class="law">駅前事件について、戸田誠は' + (verdict === '無罪' ? 'すでに無罪の判決を受け、確定している。<br><br>何人も、既に無罪とされた行為については、刑事上の責任を問はれない。</div><div class="cite">日本国憲法　第39条</div>' : '起訴されていなかった。</div>'), wait: 3000 }]);
        return true;
      }
      return false;
    }
  };
  function has(a, id) { return a.includes(id); }

  G.cases = G.cases || {};
  G.cases.ekimae = {
    title: '北見坂駅前事件', sub: '傷害致死・正当防衛は成立するか', trial: TRIAL,
    run: async function () {
      const S = { c: { truth: rnd() < .5 ? 'D' : 'A', sess: { A: 0, B: 0, C: 0, D: 0, E: 0 } } };
      G.audio.cue('main'); G.audio.ambient('office');
      await G.curtain(['<div class="big">北見坂駅前事件</div><div class="small">傷害致死</div>']);
      await K.start(C, S);
      G.audio.ambient(null);
      return S;
    }
  };
})();
