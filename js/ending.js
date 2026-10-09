'use strict';
/* ============================================================
   刑事編の結末：NPCの検察官・裁判官、数年後、記録
   ============================================================ */
(function () {
  const P = G.P, rnd = G.rnd;
  const E = G.ending = {};

  // 証拠ごとの重み（NPCの裁判所の見方）。admit=false のものは数えない
  function weigh(S, ids, trial) {
    const c = S.c, has = id => ids.includes(id), notes = [];
    let w = 0, pos = 0, neg = 0;
    const pros = [], cons = [];
    const add = (v, why) => { w += v; if (v > 0) { pos += v; if (why) pros.push(why); } else if (v < 0) { neg -= v; if (why) cons.push(why); } if (why) notes.push(why); };
    if (has('confession') && c.confession) {
      const cf = c.confession;
      const rt = trial && c.retract ? .7 : 1;
      if (cf.form === 'qa' && c.leaks.length) add(1.5 * rt, '自白調書には、取調官の問いの中に現場の事実が含まれており、信用性は限定的である');
      else add(3.5 * rt, c.retract && trial ? '捜査段階の自白は具体的である。被告人は公判でこれを撤回しているが、撤回の理由は直ちには採用できない' : '捜査段階の自白は、具体的で、客観的状況とよく符合する');
      const d = cf.det; if (!d.tape || !d.safe || !d.light) add(-1.5, '自白には、現場の客観的状況と食い違う部分がある');
    }
    if (has('routeCam') && c.qRoute === 'main') add(-.7, '自白で述べられた帰り道の防犯カメラに、被告人は映っていない');
    // 犯人性を強く示す事情があるか（あれば、「ほかにも可能性のある人がいる」という事情の重みは小さくなる）
    const strong = (has('camera3') && c.truth === 'G') || (has('fiber') && c.truth === 'G') || (has('lineup') && c.lineupRes === 'K' && !c.lineupTaint) || (c.safeFound && has('safe'));
    // 別人（宮下）について、事件の夜は自宅にいたことが裏付けられたか
    const miyaOut = has('miyaNeighbors') && c.truth === 'G';
    if (has('customers')) add(strong ? -.2 : -.5, strong ? '' : '裏口の鍵の所在を知りえた者は少なくとも14人に及ぶ');
    if (c.safeFound && has('safe')) add(3, '自白に基づき、捜査機関の知らなかった金庫の所在が判明した（秘密の暴露）');
    else if (has('safe')) add(-.5, '自白どおりの場所から金庫は発見されていない');
    if (has('lineup')) {
      if (c.lineupRes === 'single') { const hidden = c.lineupOmit && !(trial && rnd() < .5); add(hidden ? 2 : .5, hidden ? '被害者は写真により被告人を犯人と識別した' : '被害者の識別は写真1枚によるもので、暗示の影響を否定できない'); }
      else if (c.lineupRes === 'K') add(c.lineupTaint ? 1 : 2, '被害者は複数の写真の中から被告人を選んだ');
      else if (c.lineupRes === 'unsure') add(-.5, '被害者は写真面割りで犯人を選べなかった');
      else if (c.lineupRes === 'filler') add(-1, '被害者は写真面割りで無関係の人物を選んだ');
    } else if (has('victim2')) add(.4, '');
    if (has('printK')) add(has('printM') ? 0 : .7, has('printM') ? '指紋は被告人とも別人とも同程度に合致し、犯人性の根拠とならない' : '指紋は被告人のものと矛盾しない');
    if (has('printM')) add(miyaOut ? 0 : -.5, '');
    if (has('camera')) add(.5, '');
    if (has('camera3')) add(S.c.truth === 'G' ? 1.5 : -1.2, S.c.truth === 'G' ? '犯行の約30分後、灰色の上着の男が被告人方の向かいを通っている' : '防犯カメラの男は、被告人方とは逆の方角へ、北見橋を渡っている');
    if (has('miyaNeighbors') && S.c.truth === 'I') add(-.6, '同種前歴を有する別人が、事件の夜、普段より遅く帰宅している');
    if (has('fiber')) add(c.truth === 'G' ? 1.5 : .5, c.truth === 'G' ? '押収したジャケットの袖口から、犯行に使われた布製粘着テープと同じ成分の粘着剤が検出されている' : '');
    if (has('jacket')) add(.3, '');
    if (has('loan')) add(.7, '被告人は事件の2日後、まとまった現金で借金を返済している');
    if (has('bank')) add(1, has('mother') ? '返済金の出所について、被告人と母は虚偽の説明をしていた' : '');
    else if (has('mother')) add(-.3, '');
    if (has('kandori')) add(.5, '');
    if (has('hikiatari')) add(.3, '');
    if (has('murai')) add(has('murai2') ? -.3 : -1, has('murai2') ? '' : '近隣住民は、犯人の背は高くなかったと述べている');
    if (has('regular')) add(strong ? -.2 : -.7, strong ? '' : '裏口の鍵の所在を知る者は他にも複数いた');
    if (has('miyashita')) add(miyaOut ? 0 : -.5, miyaOut ? '' : '同種前歴を有する別人の存在が示されている');
    if (has('miyaAlibi')) add(miyaOut ? 0 : -.3, '');
    if (miyaOut) add(.5, '同種前歴を有する別人については、事件の夜、自宅にいたことを示す隣人の供述がある');
    if (has('video') && c.video && c.video.exists) add(c.truth === 'I' ? -8 : .3, c.truth === 'I' ? '犯行時刻、被告人の自宅の固定回線で動画が再生され続けていた' : '');
    return { w, pos, neg, pros, cons, notes: notes.filter(Boolean) };
  }

  // 有罪の判断：犯人性を示す事情が十分で、合理的な疑いを生む事情が小さいこと
  function convict(S, r, admit) {
    const c = S.c;
    if (c.safeFound && admit.includes('safe') && admit.includes('confession') && r.neg <= 2.5) return true;
    return r.pos - r.neg >= 4 && r.neg <= 2;
  }
  E.estimate = S => { const ids = S.docs.filter(d => d.evid).map(d => d.id); const r = weigh(S, ids, false); return { w: r.pos - r.neg, neg: r.neg, ok: convict(S, r, ids) }; };
  const list = a => a.map(x => '<p class="qa">・' + x + '。</p>').join('');
  E.run = async function (S) {
    const c = S.c;
    let verdict = null, errors = [], excluded = [];
    if (c.how === 'unsolved') verdict = '未解決';
    else {
      const sent = Object.keys(c.sent || {}).filter(k => c.sent[k]);
      // 起訴後に届いた動画配信の回答
      if (c.video && c.video.arrive > S.day && c.video.exists !== undefined) {
        G.cases.aoyagi.videoArrive(S);
        await G.curtain(['<div class="law">送致から' + (c.video.arrive - S.day) + '日後。<br>動画配信事業者から、回答が届いた。</div>']);
        const d = G.keiji.doc('video');
        const v = await G.openPaper({ title: d.title, body: d.body, noClose: true, buttons: [{ label: '検察官に追送致する', value: true, cls: 'green' }, { label: '送らない', value: false, cls: 'red', small: '記録はもう検察にある' }] });
        if (v) sent.push('video'); else c.videoWithheld = true;
      }
      // 検察官
      const pressured = c.sess.C > 0 || c.sess.D > 0 || c.sess.E > 0 || !!c.custodyBad;
      if (c.confession) c.retract = c.retractCustody ? true : c.confession.voluntary ? false : c.truth === 'I' ? rnd() < .85 : rnd() < (pressured ? .6 : .3);
      const est = weigh(S, sent, false).w;
      G.layout({ role: '検察', date: '', info: '北見坂地方検察庁', scene: { bg: 'pros', who: 'kenji' } });
      G.audio.ambient(null);
      const charge = c.how === 'release' ? false : (c.confession && !c.retract) || est >= 3;
      if (c.how === 'release') await G.talk([['kenji', '主任の意見は読みました。……この記録では、起訴できるだけのものはない。'], ['kenji', '釈放します。嫌疑不十分で、不起訴とします。'], ['', '（久住透は釈放された。）']]);
      else await G.talk(G.kit.mismatchLines(S, G.keiji.C()).concat([['kenji', c.confession ? (c.retract ? '検事調べで、久住は自白を撤回しました。「警察で言わされた」と。' : '久住は、私の前でも自白を維持しました。') : '久住は、一貫して否認しています。'],
        ['kenji', charge ? '起訴します。' : '……これでは公判を維持できません。嫌疑不十分で、不起訴とします。'],
        ['', charge ? '（久住透は、建造物侵入・強盗で起訴された。）' : '（久住透は釈放された。）']]));
      if (!charge) verdict = c.how === 'release' ? '釈放（不起訴）' : '不起訴';
      else {
        // 公判
        G.audio.cue('trial');
        const admit = sent.slice();
        const drop = (id, why) => { const i = admit.indexOf(id); if (i >= 0) { admit.splice(i, 1); excluded.push(why); if (/任意性|違法|潜脱/.test(why)) c.excludedIllegal = (c.excludedIllegal || 0) + 1; } };
        if (c.search === 'illegal') { drop('jacket', 'ジャケットは、令状も承諾もない居室への立入りで押収されたもので、令状主義の精神を没却する重大な違法がある。証拠能力を否定する'); drop('fiber', '繊維鑑定は、違法に押収されたジャケットに基づくもので、同様に証拠能力を否定する'); }
        drop('hearsay', '捜査報告書（近隣の噂）は伝聞であり、原供述者も特定されていない');
        if (c.confession) {
          if (pressured && rnd() < .8) drop('confession', '自白は、長時間の取調べ、脅迫的な言動又は利益の約束の下でされたもので、任意性に疑いがある（刑訴法319条1項）');
          else if (c.arrest_kind === 'bekken' && !c.rearrest && c.bekkenInterro) {
            c.stance = rnd() < .5 ? 'honken' : 'bekken';
            if (c.stance === 'honken') drop('confession', '賭博による逮捕・勾留は、実質的には本件の取調べのための身柄拘束であり、令状主義を潜脱する違法なものである（いわゆる本件基準説の立場）。この間に得た自白の証拠能力を否定する');
          }
        }
        const r = weigh(S, admit, true);
        const corro = admit.includes('confession') ? admit.some(x => x !== 'confession' && ['safe', 'lineup', 'printK', 'loan', 'bank', 'camera', 'fiber', 'kandori'].includes(x)) : true;
        const guilty = convict(S, r, admit) && corro;
        verdict = guilty ? '有罪' : '無罪';
        await G.curtain([{ html: '<div class="big">公判</div><div class="small">北見坂地方裁判所</div>', sfx: 'crowd' }]);
        const body = '<p><b>主文</b>　' + (guilty ? '被告人を拘禁刑6年に処する。' : '被告人は無罪。') + '</p><h4>理由の要旨</h4>'
          + (excluded.length ? '<p>（証拠の採否）</p>' + excluded.map(x => '<p class="qa">・' + x + '。</p>').join('') : '')
          + (guilty
            ? '<p>（被告人が犯人であることを示す事情）</p>' + list(r.pros) + (r.cons.length ? '<p>（弁護人の指摘する疑問について）</p>' + list(r.cons) + '<p class="qa">　これらは、いずれも上記の認定を左右するものではない。</p>' : '')
              + '<p>以上を総合すれば、被告人が本件の犯人であることは、合理的な疑いを差し挟む余地なく認められる。</p>'
            : '<p>（検察官の主張する事情）</p>' + (r.pros.length ? list(r.pros) : '<p class="qa">・被告人と犯行を結びつける証拠は乏しい。</p>')
              + (r.cons.length ? '<p>（しかし、次の事情がある）</p>' + list(r.cons) : '')
              + '<p>' + (r.pos - r.neg >= 4 ? '検察官の主張する事情は、被告人が犯人であることを疑わせるものではあるが、上記の事情に照らせば、' : '以上によれば、') + '被告人が本件の犯人であることについては、合理的な疑いが残る。刑訴法336条により、被告人に対し無罪の言渡しをする。</p>')
          + (c.withheld && c.withheld.length ? G.note('送致されなかった記録（' + c.withheld.map(id => (G.keiji.doc(id) || {}).title).join('、') + '）は、この法廷には現れていない。') : '');
        G.audio.cue('verdict');
        await G.openPaper({ title: '判決', sub: '北見坂地方裁判所 刑事部（裁判官3人の合議）', body, closeLabel: '閉じる' });
      }
    }

    // 数年後
    let revealed = null;
    const T = c.truth;
    if (verdict === '有罪' && T === 'I' && rnd() < .55) revealed = 'enzai';
    if (verdict !== '有罪' && T === 'G' && rnd() < .55) revealed = 'murai';
    if (verdict === '未解決' && T === 'I' && rnd() < .4) revealed = 'miyashita';
    // 正しかったことが、偶然分かることもある
    if (!revealed && ((verdict === '有罪' && T === 'G') || (verdict !== '有罪' && verdict !== '未解決' && T === 'I')) && rnd() < .25) revealed = 'right';
    const correct = revealed ? (revealed === 'right' || revealed === 'miyashita') : null;
    G.lastOutcome = { verdict, reveal: revealed, correct };
    G.audio.cue('years');
    if (revealed === 'right') await G.curtain(verdict === '有罪'
      ? [{ html: '<div class="big">5年後</div>', wait: 1200 }, { html: '<div class="doc-s"><h3>手提げ金庫</h3>北見川の河川改修の工事で、川底から緑色の手提げ金庫が引き上げられた。<br>中に残っていた帳面は、青柳書房のものだった。金庫の取っ手から、久住透の指紋が検出された。</div>', wait: 2600 }]
      : [{ html: '<div class="big">3年後</div>', wait: 1200 }, { html: '<div class="doc-s"><h3>強盗の常習犯</h3>隣県で強盗の現行犯として逮捕された男の部屋から、緑色の手提げ金庫が見つかった。<br>中の帳面は、青柳書房のものだった。</div>', wait: 2600 }]);
    else if (revealed === 'enzai') await enzai(S);
    else if (revealed === 'murai') await murai(S, verdict);
    else if (revealed === 'miyashita') await miyashitaOnly(S);
    else await G.curtain([{ html: '<div class="law">それから、何年かが過ぎた。<br><br>何も起きなかった。<br><br>' + (verdict === '有罪' ? '久住透は、刑期を務めて出所した。' : verdict === '未解決' ? '青柳書房事件は、未解決のままである。' : '久住透が、その後どこで何をしているのかは、分からない。') + '</div>', wait: 2200 },
      { html: '<div class="law" style="font-size:15px;color:#aaa">何も起きなかったことは、何の証明にもならない。</div>', wait: 1800 }]);

    // 終幕
    G.audio.cue('finale');
    const pages = [{ html: G.kit.honbu(S, verdict, revealed === 'enzai' ? 'wrong' : revealed === 'murai' ? 'free' : null), wait: 2400 },
      { html: '<div class="big" style="letter-spacing:.1em">あなたは、確信していましたか。</div>', wait: 2400 }];
    if (revealed && !G.meta.revealedOnce) {
      G.meta.revealedOnce = true;
      pages.push({ html: '<div class="law" style="font-size:15px">この事件の「真相」は、あなたが捜査を始めたときに、内部で決められていました。<br>久住が犯人である世界か、そうでない世界か。<br><br>あなたが集めた証拠の多くは、どちらの世界でも、まったく同じように現れます。<br><br>今回、真相が明らかになったのは、偶然です。<br>現実の事件でも、真相が明らかになるのは、多くの場合、偶然によってです。</div>', wait: 3000 });
    }
    pages.push({ html: '<div class="law" style="font-size:14px;color:#aaa">本件のような強盗事件の取調べは、現在も録音・録画の義務の対象ではない。<br>義務の対象は、裁判員裁判の対象事件と検察官独自捜査事件に限られる（刑事訴訟法301条の2、2019年施行）。<br>その範囲は、起訴される事件全体のおよそ3%にとどまると指摘されている。</div>', wait: 2600 });
    await G.curtain(pages);
    Object.assign(G.lastOutcome, G.kit.outcomeExtra(S, G.keiji.C()), { truthG: T === 'G', revealed: !!revealed });
    G.meta.runs.push({ no: G.meta.runs.length + 1, mode: '青柳書房事件', result: verdict, confession: c.confession ? (c.confession.voluntary ? 'あり（自発）' : 'あり') + (c.retract ? '・撤回' : '') : 'なし',
      illegal: (c.search === 'illegal' ? 1 : 0) + (c.sess.C ? 1 : 0) + (c.sess.D ? 1 : 0) + (c.sess.E ? 1 : 0) + (c.arrest_kind === 'bekken' ? 1 : 0), withheld: (c.withheld || []).length + (c.videoWithheld ? 1 : 0),
      revealed: revealed ? '判明' : '—', correct });
    G.saveMeta();
  };

  async function enzai(S) {
    const c = S.c;
    const place = c.safeFound ? '店の裏の用水路に捨てた。' : '北見橋の下、橋脚の脇に沈めた。';
    await G.curtain([
      { html: '<div class="big">6年後</div>', wait: 1200 },
      { html: '<div class="doc-s"><h3>隣の市で起きた強盗致傷事件</h3>宮下剛（52歳）が逮捕された。<br>強盗致傷は裁判員裁判の対象事件である。取調べは、最初から最後まで録画された。<br><br>4日目、宮下は言った。<br>「ついでに言っとく。北見坂の古本屋もおれだ。」</div>', wait: 2600 },
      { html: '<div class="doc-s"><h3>宮下剛の供述（録音録画記録より）</h3>「裏口の鍵は、植木鉢の下。前に一度、客として入ったときに見た。」<br>「ばあさんの手は、布のテープで三重に巻いた。」<br>「金庫は、' + place + '」<br><br>' + (c.safeFound ? '金庫は、6年前に見つかっていた。あの「秘密の暴露」は、久住の自白どおりの場所だった。<br>真犯人も、同じ場所に捨てていたのである。' : '北見橋の下から、錆びた緑色の手提げ金庫が引き上げられた。') + '</div>', wait: 3200 },
      { html: '<div class="doc-s"><h3>再審</h3>久住透は、刑期を務め終えて出所していた。<br>弁護人は再審を請求した（刑訴法435条6号）。裁判所は再審の開始を決定した。<br>2026年の法改正により、検察官が再審開始決定に不服を申し立てられるのは、「取り消されるべきものと認めるに足りる十分な根拠がある場合」に限られている（同法450条の2）。検察官は、不服を申し立てなかった。<br><br>再審公判で、久住透は無罪となった。逮捕から、6年と7か月が経っていた。</div>', wait: 3200 },
      { html: '<div class="doc-s"><h3>久住透の言葉（記者会見）</h3>「取調室で、ぼくは何度も『やってない』と言いました。<br>あのとき、あの部屋にいた人たちに、聞きたいことはありません。<br>ただ、あの部屋にもカメラがあったら、と思います。」</div>', wait: 3000 }
    ]);
  }
  async function miyashitaOnly(S) {
    await G.curtain([
      { html: '<div class="big">6年後</div>', wait: 1200 },
      { html: '<div class="doc-s"><h3>隣の市で起きた強盗致傷事件</h3>逮捕された宮下剛（52歳）は、録画された取調べの中で、北見坂の古書店の強盗も自分だと述べた。<br>北見橋の下から、錆びた緑色の金庫が見つかった。<br><br>青柳書房事件は、6年ぶりに解決した。<br>あのとき、誰も起訴されていなかった。</div>', wait: 3000 }
    ]);
  }
  async function murai(S, verdict) {
    const pages = [
      { html: '<div class="big">3年後</div>', wait: 1200 },
      { html: '<div class="doc-s"><h3>判決（北見坂地方裁判所・裁判員裁判）</h3><b>主文</b>　被告人を無期拘禁刑に処する。<br><br><b>罪となるべき事実</b><br>被告人久住透は、金品を強取する目的で、2月14日午後7時50分ころ、北見坂市本町一丁目所在の村井良子（当時50歳）方に、施錠されていなかった勝手口から侵入し、台所にいた同人に対し、所携の文化包丁（刃体の長さ約16センチメートル）を突き付けて「金を出せ」と申し向けた。同人が大声を上げて逃れようとするや、その背部、頸部、胸部等を多数回にわたり突き刺し、よって、同日午後8時41分ころ、搬送先の病院において、同人を左総頸動脈損傷による失血により死亡させて殺害し、その際、同人管理の現金約6万2千円在中の財布1個を強取したものである。</div>', wait: 3600 },
      { html: '<div class="doc-s"><h3>量刑の理由（抜粋）</h3>刺創は14か所に及び、そのうち3か所は、被害者が床に倒れた後に加えられたものである。<br>被害者は、倒れた後も勝手口の方へ這って逃れようとしており、その跡が台所の床に約2メートルにわたって残っていた。<br>被告人は、被害者方を選んだ理由について、「裏の家に、女の人が一人で住んでいるのを知っていた」と述べている。</div>', wait: 3600 },
      { html: '<div class="doc-s">村井良子。<br>3年前、青柳書房の裏の路地で灰色の上着の男を見て、<br>「背は、そんなに高くなかったと思う」と話した、あの人である。</div>', wait: 2600 },
      { html: '<div class="doc-s"><h3>被害者の長女の意見陳述（抜粋）</h3>「母は、あの古本屋さんの事件のあと、警察の人に話したことを、ずっと気にしていました。<br>『暗かったのに、あんなこと言わなければよかった』と。<br><br>母は、あの夜、夕飯の支度をしていました。鍋には、私の好きな豚汁が、二人分ありました。<br><br>どうして、あの人は、外にいたんですか。」</div>', wait: 3800 },
      { html: '<div class="doc-s"><h3>取調べ（録音録画記録より）</h3>強盗殺人は裁判員裁判の対象事件であり、取調べは全過程が録画された。<br>久住は、録画の中でこうも述べた。<br>「古本屋も、おれです。金庫は裏の用水路に投げた。」<br><br>' + (S.c.safeFound ? '3年前に用水路から見つかっていた金庫の内側を改めて調べると、久住の指紋が検出された。' : '用水路の泥の中から、錆びた緑色の手提げ金庫が見つかった。<br>内側から、久住の指紋が検出された。') + '</div>', wait: 3400 }
    ];
    if (verdict === '無罪') pages.push({ html: '<div class="law">青柳書房事件について、久住透はすでに無罪の判決を受け、確定している。<br><br>何人も、既に無罪とされた行為については、刑事上の責任を問はれない。</div><div class="cite">日本国憲法　第39条</div>', wait: 3200 });
    else pages.push({ html: '<div class="law">青柳書房事件は、' + (/不起訴/.test(verdict) ? '一度は不起訴となっていた。不起訴には、無罪判決のような確定の効力はない。' : '未解決のままだった。') + '<br><br>久住透は、青柳書房事件についても起訴された。<br>3年前の時点で、彼を止める方法はあったのだろうか。</div>', wait: 3000 });
    await G.curtain(pages);
  }
})();
