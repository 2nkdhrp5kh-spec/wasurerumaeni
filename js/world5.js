'use strict';
/* ============================================================
   第五章：事件の「世界」
   真実（誰が、いつ、どこで、何をしたか）を先に作り、痕跡をそこから散らす。
   捜査の結果は、すべてこの世界から計算する（筋書きを持たない）。
   ブラウザでも node（tools/check-world.js）でも動くよう、画面には触れない。
   ============================================================ */
(function (root) {
  // ---- 乱数（種から毎回同じ世界を作れる） ----
  function rng(seed) {
    let a = seed >>> 0;
    const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    r.pm = (c, w) => c + r.int(-w, w);           // c ± w（分）
    r.pick = arr => arr[Math.floor(r() * arr.length)];
    r.chance = p => r() < p;
    return r;
  }

  // ---- 時刻：11月1日 0:00 からの分 ----
  const DAY0 = { m: 11, d: 1 };
  const DAYS_IN = { 11: 30, 12: 31, 1: 31 };
  const T = (m, d, hh, mm) => { let n = 0; for (let mo = 11; mo !== m; mo = mo === 12 ? 1 : mo + 1) n += DAYS_IN[mo]; return (n + d - 1) * 1440 + hh * 60 + (mm || 0); };
  function fmt(t) {
    let day = Math.floor(t / 1440), m = 11; while (day >= DAYS_IN[m]) { day -= DAYS_IN[m]; m = m === 12 ? 1 : m + 1; }
    const hm = ((t % 1440) + 1440) % 1440;
    return m + '月' + (day + 1) + '日 ' + Math.floor(hm / 60) + ':' + String(hm % 60).padStart(2, '0');
  }
  const HOUR = 60, DAYM = 1440;

  // ---- 場所（km 座標）と移動 ----
  const PLACES = {
    tsujiHome:   { name: '辻の自宅（桜台）', x: 0.0, y: 0.0 },
    hosho:       { name: '北見坂ライフ保証', x: 1.6, y: 0.4 },
    asakuraMan:  { name: '朝倉のマンション（栄町）', x: 2.4, y: 1.8, cams: [{ id: 'camEntrance', name: 'エントランスの防犯カメラ', keep: 14 * DAYM, covers: 'front' }] },
    parking:     { name: '向かいの駐車場', x: 2.45, y: 1.85, cams: [{ id: 'camParking', name: '駐車場の防犯カメラ', keep: 7 * DAYM, covers: 'back' }] },
    teishoku:    { name: '駅前の定食屋', x: 2.0, y: 1.2 },
    aizawaHome:  { name: '相沢の自宅（東町）', x: 3.4, y: 2.6 },
    kominkan:    { name: '東町公民館', x: 3.1, y: 2.9 },
    kajiApt:     { name: '梶のアパート（旭町）', x: 3.8, y: 3.0 },
    juku:        { name: '梶の塾（駅前）', x: 2.2, y: 1.4 },
    conveni:     { name: '帰り道のコンビニ', x: 3.0, y: 2.2, cams: [{ id: 'camConveni', name: 'コンビニの防犯カメラ', keep: 30 * DAYM, covers: 'road' }] },
    atmEkimae:   { name: '旭町駅前のATM', x: 3.7, y: 2.8, cams: [{ id: 'camAtmEkimae', name: 'ATMのカメラ', keep: 30 * DAYM }] },
    atmA:        { name: '南口駅のATM', x: -1.5, y: -0.8, cams: [{ id: 'camAtmA', name: 'ATMのカメラ', keep: 30 * DAYM }] },
    atmB:        { name: '港町駅のATM', x: -2.2, y: 1.0, cams: [{ id: 'camAtmB', name: 'ATMのカメラ', keep: 30 * DAYM }] },
    atmC:        { name: '西浜駅のATM', x: 0.8, y: -2.4, cams: [{ id: 'camAtmC', name: 'ATMのカメラ', keep: 30 * DAYM }] },
    sakakiApt:   { name: '榊のアパート（桜台東）', x: 0.9, y: 0.7 },
    bakery:      { name: '榊のパン屋', x: 1.3, y: 0.2 }
  };
  const SPEED = { walk: 4.8, bike: 14, car: 25, train: 30 };   // km/h
  const dist = (a, b) => Math.hypot(PLACES[a].x - PLACES[b].x, PLACES[a].y - PLACES[b].y) * 1.3;   // 道なりは直線の1.3倍
  const travel = (a, b, how) => Math.ceil(dist(a, b) / SPEED[how] * 60);

  // ---- 世界を作る ----
  function make(seed) {
    const r = rng(seed == null ? (Math.random() * 1e9) | 0 : seed);
    const W = { seed, events: [], traces: [], memories: [], fmt, PLACES };
    // ev: who がいつからいつまで、どこで何をしたか（同じ人の時刻の重なりと移動は検査する）
    const ev = (who, from, to, place, what, how) => { const e = { who, from, to, place, what, how }; W.events.push(e); return e; };
    // tr: 痕跡。keep＝消えるまでの分（null は消えない）。truth＝何を示すか、innocent＝相沢に関わる事実の無実の説明
    const tr = (id, o) => { const t = Object.assign({ id }, o); W.traces.push(t); return t; };
    const mem = (who, o) => { const m = Object.assign({ who }, o); W.memories.push(m); return m; };

    /* ===== 事件の前 ===== */
    tr('prepaidSale', { kind: '販売記録', place: '家電量販店', t: T(11, 1, 0) - r.int(36, 44) * DAYM, keep: null, about: 'tsuji', text: '払い込み式携帯電話 1台、現金払い' });
    const log1 = T(11, 7, 21, r.int(0, 30));
    tr('hoshoLogAsakura', { kind: '閲覧記録', place: 'hosho', t: log1, keep: 365 * DAYM, erasable: true, about: 'tsuji', text: '朝倉真帆 申込書 閲覧（社外から）' });
    const call1 = T(11, 10, 18, r.pm(30, 30));
    tr('callAsakura', { kind: '着信履歴', place: 'asakuraPhone', t: call1, keep: null, about: 'tsuji', text: '登録のない番号から着信 ' + r.int(40, 95) + '秒' });
    tr('msgAsakura', { kind: 'メッセージ', place: 'asakuraPhone', t: call1 + r.int(20, 120), keep: null, about: 'tsuji', key: true, text: '「保証会社ってとこから在宅確認の電話きた、何それ」' });
    tr('deliveryAsakura', { kind: '配達記録', place: '宅配会社', t: T(11, 10, 12, r.int(0, 59)), keep: null, about: 'aizawa', innocent: '担当区域。同じ区域の住人の半分近くに荷物を届けている', text: '朝倉真帆様あて 配達完了 担当：相沢' });

    /* ===== 一件目：11月14日（金） ===== */
    const d1 = (h, m) => T(11, 14, h, m);
    const outA = d1(18, r.pm(40, 15)), eatA = outA + travel('asakuraMan', 'teishoku', 'walk');
    tr('msgAkiyama1', { kind: 'メッセージ', place: 'asakuraPhone', t: outA - 2, keep: null, text: '朝倉「ご飯食べてくるねー」　秋山「はいよ」' });
    ev('asakura', outA, eatA, 'asakuraMan', '定食屋へ歩く', 'walk');
    const leaveTeishoku = Math.max(eatA + r.int(20, 30), d1(19, r.pm(15, 10)));   // 食べ終わるまで、少なくとも20分
    ev('asakura', eatA, leaveTeishoku, 'teishoku', '夕食');
    tr('receiptA', { kind: 'レシート', place: 'asakuraMan', t: leaveTeishoku - 3, keep: null, text: '駅前の定食屋 ' + fmt(leaveTeishoku - 3) });
    mem('teishokuClerk', { t: leaveTeishoku, place: 'teishoku', text: '一人で来て、焼き魚の定食を。いつもの人です', fadeDays: 20 });
    const homeA = leaveTeishoku + travel('teishoku', 'asakuraMan', 'walk');
    ev('asakura', leaveTeishoku, homeA, 'teishoku', '歩いて帰る', 'walk');
    tr('camEntrance1', { kind: '映像', place: 'asakuraMan', cam: 'camEntrance', t: homeA, keep: 14 * DAYM, text: '朝倉がエントランスを入る' });
    // 相沢：配達の最後の区域 → 自助グループ
    const routeEnd = d1(20, r.pm(0, 10));
    ev('aizawa', d1(19, 0), routeEnd, 'asakuraMan', '配達（朝倉のマンションから400mの区域）', 'car');
    tr('baseAizawa1', { kind: '基地局の記録', place: '通信会社', t: d1(19, 0), until: routeEnd, keep: null, about: 'aizawa', innocent: '配達の区域。自宅も同じ局の範囲', text: '相沢の携帯：栄町局に接続' });
    const meetFrom = d1(20, 30), meetTo = d1(22, 0);
    ev('aizawa', routeEnd, meetFrom, 'kominkan', '営業所に車を戻し、公民館へ', 'car');
    ev('aizawa', meetFrom, meetTo, 'kominkan', 'ギャンブル依存の自助グループの集まり');
    tr('kominkanBooking', { kind: '予約記録', place: 'kominkan', t: meetFrom, keep: null, about: 'aizawa', text: '集会室B　20:30〜22:00　団体名は略称のみ' });
    mem('sewayaku', { t: meetFrom, place: 'kominkan', text: '相沢さんは、その夜も来ていました。最後まで', confidential: true, fadeDays: 60 });
    // 辻
    const visitA = Math.max(homeA + 10, d1(19, r.pm(55, 20)));
    const tsujiLeave1 = d1(18, 30);
    ev('tsuji', tsujiLeave1, visitA, 'asakuraMan', '朝倉のマンションへ（裏口から）', 'train');
    const backCaught = r.chance(.5);
    if (backCaught) tr('camParking1', { kind: '映像', place: 'parking', cam: 'camParking', t: visitA - 1, keep: 7 * DAYM, about: 'tsuji', text: '紺のコートの男が、裏口へ向かう後ろ姿（顔は映らない）' });
    const doneA = visitA + r.int(15, 45);
    ev('tsuji', visitA, doneA, 'asakuraMan', '朝倉の部屋');
    ev('asakura', homeA, doneA, 'asakuraMan', '自室');
    tr('sceneA', { kind: '現場', place: 'asakuraMan', t: doneA, keep: null, text: 'ノートパソコン、腕時計は残っている。財布からキャッシュカードがない', key: true });
    ev('tsuji', doneA, doneA + 60, 'tsujiHome', '帰る', 'train');
    const atmPlace1 = r.pick(['atmA', 'atmB', 'atmC']), atmT1 = T(11, 15, 9, r.pm(5, 30));
    ev('tsuji', atmT1 - 40, atmT1 + 5, atmPlace1, 'ATMで引き出す', 'train');
    tr('atm1', { kind: '引き出し記録', place: atmPlace1, t: atmT1, keep: null, about: 'tsuji', key: true, text: '朝倉のカード ' + r.pick([3, 4, 5]) + '万円（1日の上限50万円まで引いていない）' });
    tr('atmCam1', { kind: '映像', place: atmPlace1, cam: 'cam' + atmPlace1.slice(3), t: atmT1, keep: 30 * DAYM, text: 'マスクと帽子の男。紺のコート' });
    // 秋山の未読のメッセージ、発見
    tr('msgAkiyama2', { kind: 'メッセージ', place: 'asakuraPhone', t: T(11, 15, 8, 10), keep: null, text: '秋山「起きてる？」「今日シフト？」「電話出られる？」「なんかあった？」「今から行く」（既読なし）' });
    const found1 = T(11, 16, 11, r.pm(20, 30));
    tr('report1', { kind: '通報', place: '北見坂署', t: found1, keep: null, text: '秋山慎が管理会社と部屋に入り、発見' });
    W.case1 = { deathFrom: homeA, deathTo: T(11, 15, 3, 0), found: found1, visit: visitA };

    /* ===== 二件目：12月5日（金） ===== */
    tr('hoshoLogKaji', { kind: '閲覧記録', place: 'hosho', t: T(11, 28, 20, r.pm(55, 4)), keep: 365 * DAYM, erasable: true, about: 'tsuji', text: '梶遼 申込書 閲覧（社外から）' });
    const call2 = T(12, 2, 18, r.pm(41, 20));
    tr('callKaji', { kind: '着信履歴', place: 'kajiPhone', t: call2, keep: null, about: 'tsuji', key: true, text: '登録のない番号から着信 14秒' });
    tr('telcoCall2', { kind: '通話記録', place: '通信会社', t: call2, keep: 90 * DAYM, about: 'tsuji', text: '発信元：払い込み式携帯（契約者情報なし）' });
    const d2 = (h, m) => T(12, 5, h, m);
    ev('kaji', d2(17, 0), d2(21, 30), 'juku', '塾の授業');
    const homeK = d2(21, 30) + travel('juku', 'kajiApt', 'bike') + r.int(0, 10);
    ev('kaji', d2(21, 30), homeK, 'juku', '自転車で帰る', 'bike');
    tr('camConveni2', { kind: '映像', place: 'conveni', cam: 'camConveni', t: homeK - 6, keep: 30 * DAYM, text: '自転車の梶が通り過ぎる' });
    const msgK = homeK + r.int(10, 20);
    tr('msgKaji', { kind: 'メッセージ', place: 'kajiPhone', t: msgK, keep: null, text: '梶「明日の飲みどうするよ」「めちゃくちゃ美味いもの食べに行こうぜ、ちょっと高級な店」／親友「あついな」「なんで急に？なんかいいことあったん」／梶「明日教えてやろう」／親友「おけ」「何食う」（最後の二つは既読なし）' });
    const routeEnd2 = d2(20, r.pm(30, 10));
    ev('aizawa', d2(18, 0), routeEnd2, 'kajiApt', '配達', 'car');
    ev('aizawa', routeEnd2, d2(23, 59), 'aizawaHome', '一人で家にいる（この夜はアリバイがない）');
    tr('baseAizawa2', { kind: '基地局の記録', place: '通信会社', t: routeEnd2, until: d2(23, 59), keep: null, about: 'aizawa', innocent: '自宅も、梶のアパートと同じ局の範囲', text: '相沢の携帯：旭町局に接続' });
    const visitK = Math.max(msgK + 10, d2(22, r.pm(35, 15)));
    ev('tsuji', d2(21, 30), visitK, 'kajiApt', '梶のアパートへ', 'train');
    const doneK = visitK + r.int(15, 40);
    ev('tsuji', visitK, doneK, 'kajiApt', '梶の部屋');
    ev('kaji', homeK, doneK, 'kajiApt', '自室');
    tr('footprint', { kind: '足跡', place: 'kajiApt', t: visitK, keep: null, about: 'both', innocent: '量販品の仕事靴。相沢も辻も、捜査員の一人も同じ型を持つ', text: '仕事靴（26.5cm、量販品）の足跡' });
    tr('envelope', { kind: '紙片', place: 'kajiApt', t: visitK + 2, keep: null, about: 'tsuji', key: true, text: '封筒の切れ端（紺の印刷の一部。罫線の形）' });
    tr('sceneK', { kind: '現場', place: 'kajiApt', t: doneK, keep: null, key: true, text: 'ノートパソコンは残っている。財布からキャッシュカードがない' });
    const noise = doneK - r.int(5, 15);
    mem('downstairs', { t: noise, place: 'kajiApt', text: '何かが倒れるような音', fadeDays: 6, newsAdds: '車の音もした気がする' });
    ev('tsuji', doneK, doneK + 50, 'tsujiHome', '帰る', 'train');
    const atmPlace2 = r.pick(['atmA', 'atmB', 'atmC'].filter(p => p !== atmPlace1)), atmT2 = T(12, 6, 9, r.pm(40, 30));
    ev('tsuji', atmT2 - 40, atmT2 + 5, atmPlace2, 'ATMで引き出す', 'train');
    tr('atm2', { kind: '引き出し記録', place: atmPlace2, t: atmT2, keep: null, about: 'tsuji', key: true, text: '梶のカード ' + r.pick([2, 3]) + '万円（残高は8万円あった）' });
    tr('atmCam2', { kind: '映像', place: atmPlace2, cam: 'cam' + atmPlace2.slice(3), t: atmT2, keep: 30 * DAYM, text: 'マスクと帽子の男。紺のコート' });
    const atmAizawa = T(12, 6, 9, r.pm(20, 15));
    ev('aizawa', atmAizawa - 15, atmAizawa + 5, 'atmEkimae', '自分の口座から3万円を引き出す（返済日）', 'walk');
    tr('atmAizawa', { kind: '引き出し記録', place: 'atmEkimae', t: atmAizawa, keep: null, about: 'aizawa', innocent: '自分の口座。消費者金融の返済日', text: '相沢の口座 3万円' });
    tr('debtAizawa', { kind: '信用情報', place: '信用情報機関', t: T(12, 1, 0), keep: null, about: 'aizawa', innocent: '弁護士に債務整理を相談し、返済計画を始めたばかり', text: '消費者金融3社 約300万円' });
    tr('report2', { kind: '通報', place: '北見坂署', t: T(12, 7, 13, r.pm(0, 40)), keep: null, text: '連絡がつかない親友が管理会社と部屋に入り、発見' });
    W.case2 = { visit: visitK, found: T(12, 7, 13, 0) };

    /* ===== 三件目：1月16日（金）＝ たどり着けば防げる ===== */
    tr('hoshoLogSakaki', { kind: '閲覧記録', place: 'hosho', t: T(1, 8, 21, 30), keep: 365 * DAYM, erasable: true, about: 'tsuji', text: '榊葵 申込書 閲覧（社外から）' });
    tr('callSakaki', { kind: '着信履歴', place: 'sakakiPhone', t: T(1, 12, 19, r.pm(0, 30)), keep: null, about: 'tsuji', text: '登録のない番号から着信' });
    tr('kanriSakaki', { kind: '応対記録', place: '管理会社', t: T(1, 13, 11, 0), keep: null, about: 'tsuji', key: true, text: '榊様より「保証会社を名乗る在宅確認の電話があったが、本当か」と問い合わせ' });
    const homeS = T(1, 16, 20, 30) + travel('bakery', 'sakakiApt', 'walk');
    W.case3 = { home: homeS, visit: Math.max(homeS + 10, T(1, 16, 21, r.pm(0, 20))) };

    /* ===== 辻の部屋（正しく突き止めたとき・再審で見つかる） ===== */
    tr('cashEnvelope', { kind: '物', place: 'tsujiHome', t: T(12, 6, 12, 0), keep: null, about: 'tsuji', text: '銀行の封筒に入った現金。手つかず' });
    tr('notebook', { kind: '手帳', place: 'tsujiHome', t: T(12, 6, 12, 0), keep: null, about: 'tsuji', text: '名前と日付だけが、審査の書類と同じ書式で並んでいる' });
    tr('coat', { kind: '衣類', place: 'tsujiHome', t: 0, keep: null, about: 'tsuji', text: '紺のコート' });
    tr('shoesTsuji', { kind: '靴', place: 'tsujiHome', t: 0, keep: null, about: 'tsuji', text: '量販品の仕事靴（26.5cm）' });

    W.byId = id => W.traces.find(t => t.id === id);
    // その時点で残っているか（keep：消えるまでの分）
    W.alive = (t, now) => t.keep == null || now <= t.t + t.keep;
    return W;
  }

  /* ---- 検査：同じ人が同時に二か所にいない、移動に間に合う、決め手と相沢への事実が毎回そろう ---- */
  function check(W) {
    const errs = [];
    const by = {};
    W.events.forEach(e => { (by[e.who] = by[e.who] || []).push(e); });
    Object.entries(by).forEach(([who, es]) => {
      es.sort((a, b) => a.from - b.from);
      for (let i = 0; i < es.length; i++) {
        const e = es[i];
        if (e.to < e.from) errs.push(who + '：終わりが始まりより前 ' + fmt(e.from) + ' ' + e.what);
        if (i > 0) {
          const p = es[i - 1];
          if (e.from < p.to) errs.push(who + '：時刻が重なる ' + fmt(p.from) + '「' + p.what + '」と ' + fmt(e.from) + '「' + e.what + '」');
          // 移動の行事は、前の場所から次の場所までの時間が足りているか
          if (e.how && p.place !== e.place) { const need = travel(p.place, e.place, e.how); if (e.to - e.from < need - 1) errs.push(who + '：移動が間に合わない ' + PLACES[p.place].name + '→' + PLACES[e.place].name + '（' + (e.to - e.from) + '分／必要' + need + '分）'); }
        }
      }
    });
    const need = ['msgAsakura', 'callKaji', 'hoshoLogAsakura', 'hoshoLogKaji', 'envelope', 'atm1', 'atm2', 'sceneA', 'sceneK', 'kanriSakaki'];
    need.forEach(id => { if (!W.byId(id)) errs.push('真犯人への道の痕跡がない：' + id); });
    const facts = ['deliveryAsakura', 'baseAizawa1', 'baseAizawa2', 'atmAizawa', 'debtAizawa', 'footprint'];
    facts.forEach(id => { const t = W.byId(id); if (!t) errs.push('相沢への事実がない：' + id); else if (!t.innocent) errs.push('相沢への事実に無実の説明がない：' + id); });
    // 一件目の死亡推定時刻の幅に、相沢の配達の時間帯が重なる（だから疑われる）
    const a1 = (by.aizawa || []).find(e => /配達（朝倉/.test(e.what));
    if (a1 && !(a1.to > W.case1.deathFrom)) errs.push('一件目：相沢の配達の時間帯が、死亡推定時刻の幅に重ならない');
    // 辻の訪問は、被害者の帰宅より後
    const kHome = (by.kaji || []).find(e => /自室/.test(e.what));
    if (kHome && W.case2.visit < kHome.from) errs.push('二件目：辻の訪問が梶の帰宅より前');
    if (W.case3.visit < W.case3.home) errs.push('三件目：辻の訪問が榊の帰宅より前');
    return errs;
  }

  const api = { make, check, fmt, T, PLACES, travel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.G) root.G.world5 = api;
})(typeof window !== 'undefined' ? window : globalThis);
