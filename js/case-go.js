'use strict';
/* ============================================================
   第五章（試作）：二件目の現場まわり
   筋書きを持たない。捜査の結果は、すべて world5 の「世界」から計算する。
   聞き込み・カメラ・照会・鑑定・差押え は、「誰に・どこの・いつの分を」を自分で選ぶ。
   時間がたつと、記憶は薄れ（ニュースで混ざり）、映像は上書きされる。

   記録の書き方の決まり（tools/check-go.js が検査する）
   ・記録には、その記録を作った時点で分かることだけを書く（見分調書に犯行時刻を書かない）
   ・記録には事実だけを書く。「同じ」「一致」「〜と考えられる」のような結論は書かない（気づくのはプレイヤー）
   ・台詞の時刻は「夜8時」「朝9時半」のように書く。記録の時刻は 20:00 の形
   ・選択肢は、プレイヤーがすでに見た記録だけを条件に出す（答えを教える選択肢を作らない）
   ============================================================ */
(function () {
  const K = G.keiji, P = G.P, kv = G.kv, kit = G.kit, sc = kit.sc;
  let W = null, _S = null;
  const w5 = () => G.world5;
  // ゲームの日 → 世界の時刻（0日目は発見の日の午後。翌日からは朝9時）
  const dayT = d => d === 0 ? w5().T(12, 7, 15, 0) : w5().T(12, 7, 9, 0) + d * 1440;
  const fmt = t => W.fmt(t);
  const hm = t => { const m = ((t % 1440) + 1440) % 1440; return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const md = t => fmt(t).replace(/ .*/, '');
  const tr = id => W.byId(id);
  const place = id => (w5().PLACES[id] || {}).name || id;
  const has = id => !!K.doc(id);
  const seen = (...ids) => ids.forEach(id => (_S.seen[id] = true));
  // 記録を綴じる（at：その記録が作られた時刻。検査に使う）
  const add = (d, at) => K.addDoc(Object.assign({ at }, d));
  const say = (who, text) => [who, text, { scene: sc(who) }];

  // 映像に映る人の見た目
  const LOOK = { aizawa: '作業着の男（顔が映っている）', kaji: '自転車の若い男', asakura: '若い女性', tsuji: 'マスクと帽子の男。紺のコート' };

  /* ---------- メッセージアプリの画面 ---------- */
  function chat(title, msgs) {
    return '<div class="chat"><div class="chat-h">' + title + '</div>' + msgs.map(m => {
      if (m.day) return '<div class="chat-d">' + m.day + '</div>';
      return '<div class="bub ' + (m.me ? 'me' : 'them') + '"><span class="tx">' + m.tx + '</span><span class="ts">' + (m.me && m.read ? '既読 ' : '') + hm(m.t) + (!m.me && m.unread ? ' <b>未読</b>' : '') + '</span></div>';
    }).join('') + '</div>';
  }
  const callTable = rows => kv(rows.map(r => [md(r.t) + '<br>' + hm(r.t), r.who + '　' + r.len]));
  function phoneKaji() {
    const m = tr('msgKaji').t, c = tr('callKaji');
    return P('現場で押収した梶遼の携帯電話。12月1日以降の着信と、メッセージアプリの画面。') + '<p><b>着信</b></p>'
      + callTable([{ t: c.t, who: W.prepaidNo + '（登録なし）', len: c.sec + '秒' }, { t: w5().T(12, 4, 19, 12), who: '母', len: '6分' }, { t: w5().T(12, 5, 16, 41), who: '塾', len: '1分' }])
      + '<p><b>メッセージ（相手：タケ）</b></p>'
      + chat('タケ', [{ day: '12月5日（金）' }, { me: 1, read: 1, t: m, tx: '明日の飲みどうするよ' }, { me: 1, read: 1, t: m + 1, tx: 'めちゃくちゃ美味いもの食べに行こうぜ、ちょっと高級な店' },
        { t: m + 3, tx: 'あついな' }, { t: m + 3, tx: 'なんで急に？なんかいいことあったん' }, { me: 1, read: 1, t: m + 5, tx: '明日教えてやろう' },
        { t: m + 9, tx: 'おけ', unread: 1 }, { t: m + 9, tx: '何食う', unread: 1 },
        { day: '12月6日（土）' }, { t: w5().T(12, 6, 17, 2), tx: 'おーい', unread: 1 }, { t: w5().T(12, 6, 19, 30), tx: '寝てんの？', unread: 1 },
        { day: '12月7日（日）' }, { t: w5().T(12, 7, 10, 15), tx: '電話出ろ', unread: 1 }]);
  }
  function phoneAsakura() {
    const c = tr('callAsakura'), m = tr('msgAsakura').t, o = tr('msgAkiyama1').t;
    return P('一件目で保管していた朝倉真帆の携帯電話。11月以降の着信と、メッセージアプリの画面。') + '<p><b>着信</b></p>'
      + callTable([{ t: w5().T(11, 8, 20, 4), who: 'お母さん', len: '12分' }, { t: c.t, who: W.prepaidNo + '（登録なし）', len: c.sec + '秒' }, { t: w5().T(11, 13, 22, 30), who: '秋山 慎', len: '25分' }])
      + '<p><b>メッセージ（相手：秋山 慎）</b></p>'
      + chat('秋山 慎', [{ day: '11月10日（月）' }, { me: 1, read: 1, t: m, tx: '保証会社ってとこから在宅確認の電話きた、何それ' }, { t: m + 4, tx: '更新とかじゃないの？' }, { me: 1, read: 1, t: m + 5, tx: 'まだ先だよ' }, { t: m + 7, tx: '詐欺かもね、気をつけて' }, { me: 1, read: 1, t: m + 7, tx: 'こわ' },
        { day: '11月14日（金）' }, { me: 1, read: 1, t: o, tx: 'ご飯食べてくるねー' }, { t: o + 1, tx: 'はいよ' },
        { day: '11月15日（土）' }, ...['起きてる？', '今日シフト？', '電話出られる？', 'なんかあった？', '今から行く'].map((x, i) => ({ t: tr('msgAkiyama2').t + i * 40, tx: x, unread: 1 }))]);
  }

  /* ---------- 聞き込み ---------- */
  const WHO = {
    downstairs: { name: '下の階の住人', sub: '梶のアパートの一階', mem: 'downstairs' },
    shinyu: { name: '梶の親友（発見した人）', sub: '大学の同期', mem: 'shinyu' },
    tanto: { name: '管理会社の担当者', sub: '発見に立ち会った' },
    jukuColleague: { name: '塾の同僚', sub: '梶のアルバイト先', mem: 'jukuColleague' },
    teishokuClerk: { name: '定食屋の店員', sub: '一件目：朝倉がよく行った店', mem: 'teishokuClerk' },
    eigyosho: { name: '宅配の営業所長', sub: '相沢の勤め先', cond: S => has('q_delivery') },
    sewayaku: { name: '東町公民館の世話役', sub: '公民館の集まり', cond: S => S.asked.h_eigyosho, mem: 'sewayaku' }
  };
  const aizawaBack = n => (W.events.filter(e => e.who === 'aizawa' && /配達/.test(e.what))[n] || {}).to;
  function hear(S, who, at) {
    const w = WHO[who], head = P('聴いた日時：' + fmt(at) + '　聴いた者：' + w.name);
    if (who === 'tanto') return { body: head + P('「12月7日のお昼すぎ、梶さんのお友だちから、連絡がつかないので部屋を開けてほしいと電話がありました。」', '「一緒に行って、玄関のドアノブを回したら、鍵はかかっていませんでした。チェーンも。お友だちが先に入って……」', '「部屋のものには、触っていません。」') };
    if (who === 'eigyosho') {
      const b1 = aizawaBack(0), b2 = aizawaBack(1);
      return { body: head + P('「相沢ですか。旭町と栄町のあたりは、もう何年もあいつの担当です。区域の家の半分くらいには、毎月なにかしら届けてますよ。」',
        '「11月14日の金曜……運行の記録だと、夜' + (Math.floor(b1 % 1440 / 60) - 12) + '時' + (b1 % 60 < 30 ? '' : '半') + 'すぎに車を営業所に戻してます。金曜は、早めに上がるんです。東町の公民館で、何かの集まりに出てるとかで。何の集まりかは聞いてません。」',
        '「12月5日も金曜ですね。夜' + (Math.floor(b2 % 1440 / 60) - 12) + '時' + (b2 % 60 < 30 ? '' : '半') + 'すぎに戻してます。そのあとのことは知りません。」') };
    }
    const m = W.memories.find(x => x.who === w.mem);
    if (m.confidential) return { body: head + P('「どの集まりに、誰が来ているかは、お答えできません。そういう約束で、みなさん来ているので。」', '（何度か頭を下げると、世話役は少し黙ってから言った。）', '「……どうしても必要なら、ご本人に聞いてください。ご本人が話していいと言うなら、私も話します。」') };
    if ((at - m.t) / 1440 > m.fadeDays) return { body: head + P('「' + (who === 'teishokuClerk' ? 'いつも一人で来てた人ですよね。あの日のことは、もうはっきりとは。毎日、何十人も来るので' : 'ごめんなさい、もう、はっきりとは覚えていないんです') + '」'), faded: true };
    const mixed = m.newsAdds && at > W.case2.news;
    return { body: head + P('「' + m.text + '」' + (mixed ? '<br>「' + m.newsAdds + '」' : '')) };
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
    const [a, b] = winT(win), head = P(cam.pname + '　' + cam.name + '。' + win.label + 'の分。確認した日：' + md(at));
    if (at > a + cam.keep) return { gone: true, body: head + P('映像の保存は' + Math.round(cam.keep / 1440) + '日。その日の分は、上書きされて残っていなかった。') };
    const hits = W.traces.filter(t => t.cam === cam.id && t.t >= a && t.t <= b);
    // 世界の出来事から：その場所にいた人は映る（歩いて・乗って来た行事は、着いた時刻に。辻は上の痕跡で映る）
    W.events.filter(e => e.place === cam.place && e.who !== 'tsuji').forEach(e => {
      const f = e.how ? e.to - 5 : e.from;
      if (f <= b && e.to >= a) hits.push({ id: 'ev_' + e.who + e.from, t: Math.max(f, a), text: LOOK[e.who] || '人' });
    });
    hits.sort((x, y) => x.t - y.t);
    hits.forEach(h => { S.seen[h.id] = true; if (/^ev_aizawa/.test(h.id)) S.c.aizawaAtm = true; });
    return { n: hits.length, body: head + (hits.length ? kv(hits.map(h => [md(h.t) + '<br>' + hm(h.t), h.text])) : P('人の出入りで、目に留まるものはなかった。')) };
  }

  /* ---------- 照会・鑑定・差押え・任意提出 ---------- */
  const contract = (who, kanri, room, start, done) => kv([['借主', who], ['物件', room], ['管理会社', kanri], ['契約', start], ['家賃の保証会社', '北見坂ライフ保証株式会社'], ['保証の審査', done]]);
  const INQ = [
    { id: 'bankKaji', label: '銀行：梶の口座の取引', run: S => { const a = tr('atm2'); seen('atm2'); return P('梶遼名義の普通預金口座。12月1日以降の取引。') + kv([['12月1日', '入金　塾の給与　84,000円'], [md(a.t) + '<br>' + hm(a.t), '出金　' + a.yen + '0,000円（キャッシュカード。' + place(a.place) + '）'], ['照会日の残高', (a.bal - a.yen) + '0,000円台']]); } },
    { id: 'bankAsakura', label: '銀行：朝倉の口座の取引', run: S => { const a = tr('atm1'); seen('atm1'); return P('朝倉真帆名義の普通預金口座。11月1日以降の取引。') + kv([['11月4日', '出金　家賃の引き落とし　68,000円'], [md(a.t) + '<br>' + hm(a.t), '出金　' + a.yen + '0,000円（キャッシュカード。' + place(a.place) + '）'], ['照会日の残高', (a.bal - a.yen) + '0,000円台']]); } },
    { id: 'kanriKaji', label: '管理会社：梶の部屋の契約書類', run: S => P('梶遼の賃貸借契約の書類の写し。') + contract('梶遼', '旭町ハウジング', '旭町のアパート 203号室', '今年3月', '今年2月 完了') },
    { id: 'kanriAsakura', label: '管理会社：朝倉の部屋の契約書類', run: S => P('朝倉真帆の賃貸借契約の書類の写し。') + contract('朝倉真帆', '栄町不動産', '栄町のマンション 405号室', '昨年9月', '昨年8月 完了') },
    { id: 'delivery', label: '宅配会社：梶と朝倉あての配達の記録', run: S => { seen('deliveryAsakura', 'deliveryKaji'); return P('11月1日以降、朝倉真帆様・梶遼様あての荷物の配達の記録。') + kv(['deliveryAsakura', 'deliveryKaji'].map(id => [md(tr(id).t) + '<br>' + hm(tr(id).t), tr(id).text])); } },
    { id: 'credit', label: '信用情報：相沢の借入れ', cond: S => has('q_delivery'), run: S => { seen('debtAizawa'); return P('相沢湊の借入れの状況（12月1日現在）。') + kv([['借入れ', '消費者金融3社　合計 約300万円'], ['延滞', '10月まで延滞あり。11月以降は、約定どおり返済']]); } },
    { id: 'bankAizawa', label: '銀行：相沢の口座の取引', cond: S => has('q_delivery'), run: S => { const a = tr('atmAizawa'); seen('atmAizawa'); return P('相沢湊名義の普通預金口座。12月1日以降の取引。') + kv([['12月1日', '入金　給与　231,000円'], [md(a.t) + '<br>' + hm(a.t), '出金　30,000円（キャッシュカード。' + place(a.place) + '）'], [md(a.t), '出金　30,000円（振込。消費者金融あて）']]); } },
    { id: 'hosho', label: '保証会社：梶と朝倉の審査の書類と、社内での取り扱いの記録', cond: S => has('q_kanriKaji') || has('q_kanriAsakura'), run: S => {
      seen('hoshoLogAsakura', 'hoshoLogKaji'); const a = tr('hoshoLogAsakura'), k = tr('hoshoLogKaji');
      return P('北見坂ライフ保証株式会社の回答。朝倉真帆様・梶遼様の審査の書類と、社内システムで書類を開いた記録。') + kv([['朝倉様の審査', '昨年8月 完了'], ['梶様の審査', '今年2月 完了'], [md(a.t) + '<br>' + hm(a.t), '朝倉様 申込書を閲覧　ID：k.tsuji（審査課 辻圭吾）　接続元：社外'], [md(k.t) + '<br>' + hm(k.t), '梶様 申込書を閲覧　ID：k.tsuji（審査課 辻圭吾）　接続元：社外'], ['社員の勤務時間', '9:00〜17:30']]); } },
    { id: 'telco', label: '通信会社：梶の携帯の通話の記録', run: S => P('携帯電話会社の回答。') + P('「お問い合わせの通話の記録は、通信の秘密にあたるため、照会にはお答えできません。」'), refused: true }
  ];
  const EXP = [
    { id: 'autopsy', label: '梶の遺体の司法解剖', run: (S, at) => { const A = W.case2.autopsy; S.c.autopsy = true; return P('北見坂医科大学 法医学教室。' + md(at - 1440) + 'に解剖。') + kv([['死因', '頸部圧迫による窒息'], ['首の痕', 'ひも状のものによる痕。幅約1cm。首をほぼ水平に一周する'], ['抵抗の痕', '乏しい。爪の間に、他人の皮膚片はない'], ['死亡の推定', fmt(A.from) + 'ころから ' + fmt(A.to) + 'ころまでの間'], ['胃の内容', '米飯が少量。ほぼ消化されている（最後の食事から、おおむね3〜5時間）'], ['アルコール', '検出されない']]); } },
    { id: 'phoneKaji', label: '梶の携帯電話の解析', cond: S => S.c.kenbun, run: S => { seen('callKaji', 'msgKaji'); return phoneKaji(); } },
    { id: 'phoneAsakura', label: '朝倉の携帯電話の解析（一件目）', run: S => { seen('callAsakura', 'msgAsakura', 'msgAkiyama1', 'msgAkiyama2'); return phoneAsakura(); } },
    { id: 'foot', label: '玄関の足跡の鑑定', cond: S => S.c.kenbun, run: S => { seen('footprint'); return P('梶の部屋の玄関で採取した足跡（ゼラチン紙で転写）。') + kv([['靴', '作業靴「ワークライト WL-260」（量販品）'], ['大きさ', '26.5cm'], ['売れた数', 'この型は、県内で年に約3,000足'], ['すり減り', 'かかとの外側が少し減っている。履いて数か月ほど'], ['身長の推定', '靴の大きさからは、165〜180cmほど']]); } },
    { id: 'env', label: '床の紙片の鑑定', cond: S => S.c.kenbun, run: S => { seen('envelope'); return P('梶の部屋の床で見つかった紙片。') + kv([['大きさ', '約3cm×2cm。破り取られた形'], ['紙', '白の上質紙（封筒によく使われる厚さ）'], ['印刷', '紺色の一色刷り。罫線の一部（線の幅0.5mm、間隔4mm）'], ['指紋', '検出されない']]); } }
  ];
  const SEIZE = [
    { id: 'lineKaji', label: '梶の携帯の通話の記録', run: (S, at) => { seen('callKaji'); const c = tr('callKaji'); return P('梶遼の携帯電話の回線。12月1日以降の着信の記録。') + kv([[md(c.t) + '<br>' + hm(c.t), W.prepaidNo + ' から　' + c.sec + '秒'], ['12月4日<br>19:12', '梶の母の番号から　6分'], ['12月5日<br>16:41', '塾の番号から　1分']]); } },
    { id: 'lineAsakura', label: '朝倉の携帯の通話の記録', run: (S, at) => { seen('callAsakura'); const c = tr('callAsakura'); return P('朝倉真帆の携帯電話の回線。11月1日以降の着信の記録。') + kv([['11月8日<br>20:04', '朝倉の母の番号から　12分'], [md(c.t) + '<br>' + hm(c.t), W.prepaidNo + ' から　' + c.sec + '秒'], ['11月13日<br>22:30', '秋山慎の番号から　25分']]); } },
    { id: 'prepaid', label: () => '番号 ' + W.prepaidNo + ' の契約と通話の記録', cond: S => S.seen.callKaji || S.seen.callAsakura, run: (S, at) => {
      const t = tr('telcoCall2'), c1 = tr('callAsakura'); seen('telcoCall2', 'prepaidSale');
      return P('番号 ' + W.prepaidNo + ' の回線。') + kv([['契約', '払い込み式（プリペイド）。名義は県外に住む60代の男性'], ['販売', '北見坂市内の携帯電話の販売店。9月' + (62 - Math.round(-tr('prepaidSale').t / 1440)) + '日。現金。本人確認は、名義の男性の運転免許証の写し'], [md(c1.t) + '<br>' + hm(c1.t), '朝倉真帆の番号へ　' + c1.sec + '秒　発信時の基地局：桜台局'], [md(t.t) + '<br>' + hm(t.t), '梶遼の番号へ　14秒　発信時の基地局：桜台局'], ['ほかの通話', 'なし']]); } },
    { id: 'baseAizawa', label: '相沢の携帯の位置（基地局）の記録', cond: S => has('q_delivery'), run: S => { seen('baseAizawa1', 'baseAizawa2'); const a = tr('baseAizawa1'), b = tr('baseAizawa2'); return P('相沢湊の携帯電話が接続した基地局の記録（抜粋）。') + kv([[md(a.t) + '<br>' + hm(a.t) + '〜' + hm(a.until), '栄町局'], [md(a.until) + '<br>' + hm(a.until) + '〜22:00', '東町局'], [md(b.t) + '<br>' + hm(b.t) + '〜' + hm(b.until), '旭町局']]); } }
  ];
  const TEISHUTSU = [
    { id: 'hosho', label: '北見坂ライフ保証：顧客に送る書類一式の見本', cond: S => has('q_kanriKaji') || has('q_kanriAsakura'), run: S => P('北見坂ライフ保証株式会社から、任意で提出を受けたもの。') + kv([['1', '保証委託契約書の控え（A4・4枚）'], ['2', '「ご利用のしおり」（冊子）'], ['3', '社用封筒（長形3号）。白の上質紙。紺色の一色刷り。罫線（線の幅0.5mm、間隔4mm）'], ['4', '振込用紙']]) },
    { id: 'unko', label: '宅配会社：相沢の勤務と運行の記録', cond: S => has('q_delivery'), run: S => { const b1 = aizawaBack(0), b2 = aizawaBack(1); return P('宅配会社の旭町営業所から、任意で提出を受けたもの。') + kv([['11月14日', '出勤 8:00　営業所に帰着 ' + hm(b1) + '　退勤 ' + hm(b1 + 12)], ['12月5日', '出勤 8:00　営業所に帰着 ' + hm(b2) + '　退勤 ' + hm(b2 + 10)], ['担当区域', '旭町・栄町の一部（約600世帯）']]); } }
  ];

  // 部下の報告（戻ったときの一言。事実だけ）
  const back = (t, text) => [[t.staff, text, { scene: sc(t.staff), report: true }]];
  // 部下に頼む行動の共通の形
  function verb(o) {
    return Object.assign({ who: 'staff', multi: true, once: false,
      ask: async S => {
        const list = o.list(S); if (!list.length) { G.toast(o.none || 'いま頼めるものはない'); return null; }
        const v = await G.openPaper({ title: o.q, sub: o.sub0 || '', body: o.body ? P(o.body) : '', buttons: list.map(x => ({ label: typeof x.label === 'function' ? x.label() : x.label, value: x.id, small: x.small })), closeLabel: 'やめる' });
        if (!v) return null;
        const x = list.find(y => y.id === v);
        S.asked[o.key + v] = true;
        return { id: v, label: o.short + '：' + (typeof x.label === 'function' ? x.label() : x.label).replace(/（.*）$/, '') };
      } }, o.def);
  }
  const pending = (S, aid) => S.tasks.filter(t => t.aid === aid && t.q).map(t => t.q.id);

  /* ---------- 事件の定義 ---------- */
  const C = {
    id: 'go', role: '捜査官（主任）', base: { m: 12, d: 7 }, dayCard: true, noCoach: true, noReread: true, custodyEvents: false,
    staff: [{ id: 'shirai', name: '白井' }, { id: 'oka', name: '岡' }, { id: 'noguchi', name: '野口' }],
    elemTitle: 'わかってきたこと',
    info: S => ({ text: '旭町事件（試作）　発見から' + (S.day + 1) + '日' }),
    scene: S => sc(null, 'office'),
    endHint: S => '部下の報告は、明日の朝から届く',
    nextMilestone: () => null,
    elements: S => {
      const c = S.c;
      return [
        { k: 'いつ殺されたか', v: (c.autopsy ? 1 : 0) + (S.seen.msgKaji ? 1 : 0) + (has('h_downstairs') ? 1 : 0) },
        { k: '犯人の手がかり', v: (has('e_foot') ? 1 : 0) + (has('e_env') ? 1 : 0) + (S.seen.telcoCall2 ? 1 : 0) },
        { k: '二つの事件のつながり', v: (c.cmp.sameNo ? 1 : 0) + (has('q_kanriKaji') && has('q_kanriAsakura') ? 1 : 0) + (c.cmp.envelope ? 1 : 0) }
      ];
    },
    people: S => {
      const c = S.c, out = [];
      if (has('q_delivery')) out.push({ id: 'aizawa', name: '相沢　湊', sub: '宅配の配達員', facts: [
        [true, '朝倉にも梶にも、荷物を届けていた'],
        has('q_credit') && [true, '消費者金融に約300万円'],
        c.aizawaAtm && has('q_bankAizawa') && [true, '12月6日の朝、旭町駅前のATMで引き出している'],
        has('s_baseAizawa') && [true, '二件の夜、現場のある地域の基地局につながっていた'],
        has('h_eigyosho') && [false, '二人の住む地域は、何年も相沢の担当区域'],
        has('h_eigyosho') && [null, '金曜の夜は、東町公民館の集まりに出ている（何の集まりかは不明）']].filter(Boolean) });
      if (c.cmp.sameNo) out.push({ id: 'phone', name: W.prepaidNo + ' の持ち主', sub: '誰かは分からない', facts: [
        [true, '朝倉にも梶にも、事件の前に電話をかけていた'],
        S.seen.prepaidSale && [true, '払い込み式。名義は、県外に住む60代の男性'],
        S.seen.telcoCall2 && [null, 'かけた場所は、二回とも桜台局の範囲']].filter(Boolean) });
      if (has('q_hosho')) out.push({ id: 'tsuji', name: '辻　圭吾', sub: '北見坂ライフ保証・審査課', facts: [
        [true, '審査が終わった二人の申込書を、勤務時間の外に社外から開いていた']].concat(c.cmp.envelope ? [[true, '梶の部屋の紙片と、この会社の封筒は、紙・印刷の色・罫線が同じ']] : []) });
      return out;
    },
    setTarget: async (S, id) => { S.c.target = id; G.toast('追う人物を決めた（試作：この先はまだない）'); },
    goal: S => ({ goal: '梶遼さんを殺したのは誰か。三週間前の朝倉真帆さんの事件とあわせて調べる',
      why: '部下に、聞き込み・防犯カメラ・照会・鑑定・令状での差押えを頼む。どれも、誰に・どこの・いつの分かを自分で選ぶ。<br>人の記憶は日がたつほど薄れる。防犯カメラの映像は、決まった日数で上書きされる。早く当たるほど、多くが残っている。<br>記録が二つそろったら、机の上で並べて見比べられる。',
      hints: [] }),
    // 記録を並べて見比べる（気づくのはプレイヤー。記録そのものには結論を書かない）
    compare: (S, a, b) => {
      const k = [a, b].sort().join('|');
      if (k === 'e_phoneAsakura|e_phoneKaji' || k === 's_lineAsakura|s_lineKaji' || k === 'e_phoneAsakura|s_lineKaji' || k === 'e_phoneKaji|s_lineAsakura')
        return { lines: [['', '（' + W.prepaidNo + '。……朝倉の着信にも、梶の着信にも、同じ番号がある。）']], memo: { title: '二人にかかってきた同じ番号', text: W.prepaidNo + '。朝倉には11月10日、梶には12月2日。どちらも電話帳に登録がない。' }, then: S => (S.c.cmp.sameNo = true) };
      if (k === 'e_env|t_hosho')
        return { lines: [['', '（白の上質紙。紺色の一色刷り。罫線の幅0.5mm、間隔4mm。……現場の紙片と、保証会社の封筒。）']], memo: { title: '紙片と、保証会社の封筒', text: '梶の部屋の紙片と、北見坂ライフ保証の社用封筒。紙、印刷の色、罫線の幅と間隔が同じ。' }, then: S => (S.c.cmp.envelope = true) };
      if (k === 'e_phoneAsakura|q_kanriAsakura' || k === 'e_phoneAsakura|q_hosho')
        return { lines: [['', '（「保証会社ってとこから在宅確認の電話」。……朝倉の家賃の保証会社は、北見坂ライフ保証。）']], memo: { title: '朝倉への「保証会社」の電話', text: '朝倉は11月10日、「保証会社ってとこから在宅確認の電話きた」と書いている。朝倉の保証の審査は、昨年8月に終わっている。' } };
      return null;
    },
    morning: (S, first) => {
      const L = [];
      if (first) {
        L.push(['', '（12月7日、午後。旭町のアパートで、若い男性が死んでいると通報があった。）', { sfx: 'phone' }],
          ['todo', '死んでたのは梶遼（かじ りょう）、23歳。大学院生。連絡のつかない親友が、管理会社の人と部屋に入って見つけた。', { scene: sc('todo', 'kacho') }],
          ['todo', '首に、ひもの痕がある。財布からキャッシュカードだけがない。パソコンは残ってる。……三週間前の、栄町の朝倉真帆と同じだ。'],
          ['todo', '栄町の件は、まだ誰も挙がってない。主任、両方お前が持て。'],
          say('shirai', '主任。防犯カメラは、店によって一、二週間で上書きされます。聞き込みも、早いほどいい。'),
          ['shirai', 'どこの、いつの分を当たるか。……決めてください。']);
        const rp = tr('report2');
        add({ id: 'gaiyo', title: '事件の概要', body: S => kv([['事件', '旭町事件'], ['場所', '北見坂市旭町　アパート「コーポ旭」203号室（梶遼の居室）'], ['被害者', '梶遼（23歳）　大学院生。塾講師のアルバイト'], ['発見', '12月7日 ' + hm(rp.t) + 'ころ。親友（大学の同期）と管理会社の担当者が部屋に入り、発見'], ['状況', '居室で倒れ、死亡していた。首に、ひも状のものの痕。財布にキャッシュカードがない'], ['死因', S.c.autopsy ? '頸部圧迫による窒息（司法解剖）' : '未確定'], ['死亡の日時', S.c.autopsy ? fmt(W.case2.autopsy.from) + 'ころ〜' + fmt(W.case2.autopsy.to) + 'ころ（司法解剖）' : '未確定'], ['被疑者', '不明']]) }, dayT(0));
        const a1 = tr('atm1'), c1 = tr('atmCam1');
        add({ id: 'case1', title: '一件目（栄町事件）の記録の要旨', body: kv([['被害者', '朝倉真帆（24歳・会社員）'], ['場所', '北見坂市栄町　マンション405号室（朝倉の居室）'], ['発見', fmt(tr('report1').t) + 'ころ。交際相手の秋山慎と管理会社の担当者が部屋に入り、発見'], ['死因', '頸部圧迫による窒息'], ['死亡の推定', fmt(W.case1.deathFrom) + 'ころ〜' + fmt(W.case1.deathTo) + 'ころ'], ['現場', 'ノートパソコン、腕時計は残っていた。財布にキャッシュカードがない'], ['カード', fmt(a1.t) + '　朝倉のカードで' + a1.yen + '万円が引き出された（' + place(a1.place) + '）'], ['ATMの映像', c1.text], ['携帯電話', '保管中。解析はまだ'], ['被疑者', '浮かんでいない']]) }, dayT(0));
        add({ id: 'manual', title: '捜査の進め方', kind: 'memo', body: P('・部下に頼む捜査は、誰に・どこの・いつの分かを選ぶ。報告は翌朝から届く（照会・鑑定・差押えは2日）。', '・同じ相手に、二人の部下を同時に向かわせることはできない。', '・記録が二つそろったら、机の上の記録を開いて「横に並べる」で見比べられる。気づいたことは「照らし合わせの記録」に残る。') }, dayT(0));
      }
      if (!S.c.newsSeen && dayT(S.day) > W.case2.news) {
        S.c.newsSeen = true;
        L.push(['', '（昨夜のテレビのニュース：「旭町のアパートで大学院生の男性が死亡しているのが見つかり、警察は殺人事件とみて捜査しています。近所の住民によりますと、事件の夜、車が止まる音を聞いたということです」）']);
      }
      return L;
    },
    actions: [
      { id: 'kenbun', who: 'self', label: '現場を見る（実況見分）', sub: '梶の部屋', primary: true,
        run: async S => {
          S.c.kenbun = true;
          await G.talk([['', '（旭町のアパート、二階の角部屋。玄関、六畳、台所。）', { scene: sc(null, 'office') }], say('oka', '主任、玄関に足跡があります。床に紙の切れ端が一つ。携帯電話は、テーブルの上です。')]);
          add({ id: 'kenbunK', title: '実況見分調書（旭町）', body: P('見分の日時：12月7日 15:00〜17:40　場所：コーポ旭 203号室') + kv([['玄関', '施錠されていない（発見時も施錠なし、と管理会社の担当者）。たたきに、靴の跡（長さ約27cm、底に模様）が一つ'], ['居室', '被害者は、六畳の中央にあおむけに倒れている。首に、ひも状のものの痕'], ['室内', '引き出し・押入れは閉じている。荒らされた様子はない'], ['床', '机の脇に、紙片が一つ（約3cm×2cm。紺色の印刷がある）'], ['財布', '机の上。現金 12,000円が残る。キャッシュカードの差し込み口が空'], ['そのほか', 'ノートパソコン（机の上）、携帯電話（テーブルの上。電池残量4%）'], ['押収', '携帯電話、紙片、足跡（転写）']]) }, dayT(0));
        } },
      verb({ key: 'h_', q: '誰に話を聴くか', short: '聞き込み', body: '日がたつほど、記憶は薄れる。',
        list: S => Object.entries(WHO).filter(([k, w]) => (!w.cond || w.cond(S)) && !pending(S, 'hear').includes(k)).map(([k, w]) => ({ id: k, label: w.name, small: w.sub + (S.asked['h_' + k] ? '（前にも聴いた）' : '') })),
        def: { id: 'hear', days: 1, label: '人から話を聴く（聞き込み）', short: '聞き込み', sub: '誰に聴くかを選ぶ',
          done: (S, t) => {
            const at = dayT(t.at) + 240, r = hear(S, t.q.id, at), n = (S.heard[t.q.id] = (S.heard[t.q.id] || 0) + 1);
            add({ id: 'h_' + t.q.id + (n > 1 ? '_' + n : ''), title: WHO[t.q.id].name + 'の話' + (n > 1 ? '（' + md(at) + '）' : ''), body: r.body }, at);
            return back(t, r.faded ? WHO[t.q.id].name + 'に会ってきました。……あまり覚えていない、とのことです。' : WHO[t.q.id].name + 'から話を聴いてきました。記録にしてあります。');
          } } }),
      verb({ key: 'c_', q: 'どこのカメラか', short: 'カメラ', body: '保存の日数は、カメラごとに違う。',
        list: S => CAMS().filter(c => WINS.some(w => !S.asked['c_' + c.id + w.id] && !pending(S, 'cam').includes(c.id + '|' + w.id))).map(c => ({ id: c.id, label: c.pname.replace(/（.*）/, '') + '　' + c.name, small: '上書きまで' + Math.round(c.keep / 1440) + '日' })),
        def: { id: 'cam', days: 1, label: '防犯カメラの映像を集める', short: 'カメラ', sub: 'どこの・いつの分かを選ぶ',
          ask: null, done: (S, t) => {
            const cam = CAMS().find(x => x.id === t.q.cam), win = WINS.find(x => x.id === t.q.win);
            const r = watch(S, cam, win, dayT(t.at) + 240);
            add({ id: 'c_' + t.q.cam + '_' + t.q.win, title: '映像の確認（' + cam.pname.replace(/（.*）/, '') + '・' + win.label.replace(/（.*）/, '') + '）', body: r.body }, dayT(t.at) + 240);
            return back(t, r.gone ? cam.pname.replace(/（.*）/, '') + 'のカメラは、もう上書きされていました。' : cam.pname.replace(/（.*）/, '') + 'の映像、見てきました。' + (r.n ? '映っていたものを書き出してあります。' : '目に留まるものは、ありませんでした。'));
          } } }),
      verb({ key: 'q_', q: '何を照会するか', short: '照会', sub0: '捜査関係事項照会（刑訴法197条2項）', body: '会社や役所に、文書で問い合わせる。回答は2日後。',
        list: S => INQ.filter(x => (!x.cond || x.cond(S)) && !S.asked['q_' + x.id]),
        def: { id: 'inq', days: 2, label: '会社や役所に照会する', short: '照会', sub: 'どこに・何を問い合わせるかを選ぶ（回答は2日後）',
          done: (S, t) => { const x = INQ.find(y => y.id === t.q.id), at = dayT(t.at) + 2880; add({ id: 'q_' + x.id, title: '照会の回答（' + x.label.replace(/：.*/, '') + '・' + x.label.replace(/^.*：/, '') + '）', body: x.run(S) }, at); return back(t, x.refused ? '通信会社に断られました。通話の記録は、照会では出せない、と。' : '照会の回答が届きました。'); } } }),
      verb({ key: 'e_', q: '何を鑑定するか', short: '鑑定', sub0: '鑑定の嘱託（刑訴法223条）', body: '専門家に調べてもらう。結果は2日後。', none: 'いま鑑定に出せるものはない',
        list: S => EXP.filter(x => (!x.cond || x.cond(S)) && !S.asked['e_' + x.id]),
        def: { id: 'exp', days: 2, label: '鑑定を嘱託する', short: '鑑定', sub: '何を調べてもらうかを選ぶ（結果は2日後）',
          done: (S, t) => { const x = EXP.find(y => y.id === t.q.id), at = dayT(t.at) + 2880; add({ id: 'e_' + x.id, title: '鑑定書（' + x.label.replace(/の鑑定$|の解析.*$/, '').replace(/^梶の遺体の/, '') + '）', body: x.run(S, at) }, at); return back(t, '鑑定の結果が出ました。'); } } }),
      verb({ key: 's_', q: '何を差し押さえるか', short: '差押え', sub0: '差押許可状を請求する（刑訴法218条）', body: '裁判官に令状を請求し、出たら通信会社で記録を差し押さえる。2日かかる。',
        list: S => SEIZE.filter(x => (!x.cond || x.cond(S)) && !S.asked['s_' + x.id]),
        def: { id: 'seize', days: 2, label: '通信の記録を差し押さえる（令状）', short: '差押え', sub: '令状を請求して、通話や位置の記録を差し押さえる',
          done: (S, t) => {
            const x = SEIZE.find(y => y.id === t.q.id), at = dayT(t.at) + 2880, lab = typeof x.label === 'function' ? x.label() : x.label;
            add({ id: 'w_' + x.id, title: '差押許可状（' + lab + '）', body: kv([['差し押さえるべき物', lab], ['発付', md(dayT(t.at) + 1440) + '　北見坂簡易裁判所 裁判官'], ['有効期間', '7日']]) }, dayT(t.at) + 1440);
            add({ id: 's_' + x.id, title: '差押えの結果（' + lab + '）', body: x.run(S, at) }, at);
            return back(t, '令状が出て、通信会社で差し押さえてきました。');
          } } }),
      verb({ key: 't_', q: '何の提出を受けるか', short: '提出', sub0: '任意の提出（刑訴法221条）', body: '持ち主に頼んで、任意で出してもらう。',
        list: S => TEISHUTSU.filter(x => (!x.cond || x.cond(S)) && !S.asked['t_' + x.id]),
        def: { id: 'teishutsu', days: 1, label: '資料の提出を受ける（任意）', short: '提出', sub: '会社などに、資料を任意で出してもらう',
          cond: S => TEISHUTSU.some(x => (!x.cond || x.cond(S)) && !S.asked['t_' + x.id]),
          done: (S, t) => { const x = TEISHUTSU.find(y => y.id === t.q.id), at = dayT(t.at) + 240; add({ id: 't_' + x.id, title: '任意提出を受けた資料（' + x.label.replace(/：.*/, '') + '）', body: x.run(S) }, at); return back(t, '提出を受けてきました。'); } } }),
      { id: 'stop', who: 'self', free: true, once: false, label: 'ここまでにする（試作）', sub: '本当に起きたことを見て、試作を終える',
        run: async S => {
          const key = ['msgAsakura', 'callKaji', 'telcoCall2', 'hoshoLogAsakura', 'hoshoLogKaji', 'envelope', 'atm1', 'atm2'];
          const got = key.filter(id => S.seen[id]);
          const v = await G.openPaper({ title: 'ここまで（試作）', sub: '世界の種 ' + W.seed, noClose: true,
            body: P('この世界で本当に起きたこと：辻圭吾が、' + fmt(W.case1.visit) + 'に朝倉の部屋を、' + fmt(W.case2.visit) + 'に梶の部屋を訪ねた。三件目は ' + fmt(W.case3.visit) + '、榊葵の部屋の予定。')
              + kv(key.map(id => [tr(id).kind, (S.seen[id] ? '◯ 見つけた' : '× まだ')]))
              + P('辻へ届く記録：' + got.length + ' / ' + key.length + '。'),
            buttons: [{ label: '終える', value: 'end', cls: 'green' }, { label: '続ける', value: 'go' }] });
          if (v !== 'end') return false;
          S._ended = true; K.end('proto'); return false;
        } }
    ]
  };
  // カメラは「どこの」のあとに「いつの分か」も選ぶ
  const camAct = C.actions.find(a => a.id === 'cam');
  camAct.ask = async S => {
    const cams = C.actions.find(a => a.id === 'cam'), list = CAMS().filter(c => WINS.some(w => !S.asked['c_' + c.id + w.id] && !pending(S, 'cam').includes(c.id + '|' + w.id)));
    if (!list.length) { G.toast('当たれるカメラは、もうない'); return null; }
    const c = await G.openPaper({ title: 'どこのカメラか', sub: '防犯カメラ', body: P('保存の日数は、カメラごとに違う。'), buttons: list.map(x => ({ label: x.pname.replace(/（.*）/, '') + '　' + x.name, value: x.id, small: '上書きまで' + Math.round(x.keep / 1440) + '日' })), closeLabel: 'やめる' });
    if (!c) return null;
    const ws = WINS.filter(w => !S.asked['c_' + c + w.id] && !pending(S, 'cam').includes(c + '|' + w.id));
    const w = await G.openPaper({ title: 'いつの分か', sub: list.find(x => x.id === c).pname, body: '', buttons: ws.map(x => ({ label: x.label, value: x.id })), closeLabel: 'やめる' });
    if (!w) return null;
    S.asked['c_' + c + w] = true;
    return { cam: c, win: w, id: c + '|' + w, label: 'カメラ：' + list.find(x => x.id === c).pname.replace(/（.*）/, '') };
  };

  G.cases = G.cases || {};
  G.cases.go = {
    title: '旭町事件（試作）', sub: '第五章の試作',
    C,
    run: async function (seed) {
      W = w5().make(seed == null ? (Math.random() * 1e9) | 0 : seed);
      const S = { c: { cmp: {} }, seen: {}, asked: {}, heard: {}, world: W }; _S = S;
      // 並べて見比べるときに、照らし合わせる記載（下線の候補）
      const no = new RegExp(W.prepaidNo);
      C.pick = { 'e_phoneAsakura|e_phoneKaji': [no, no], 's_lineAsakura|s_lineKaji': [no, no], 'e_phoneAsakura|s_lineKaji': [no, no], 'e_phoneKaji|s_lineAsakura': [no, no], 'e_env|t_hosho': [/罫線/, /罫線/], 'e_phoneAsakura|q_kanriAsakura': [/保証会社/, /保証会社/], 'e_phoneAsakura|q_hosho': [/保証会社/, /朝倉様の審査/] };
      G.audio.cue('titleOut'); G.audio.ambient('office');
      await G.curtain(['<div class="big">旭町事件</div><div class="small">第五章（試作）</div>']);
      G.audio.cue('case_eiyu');
      await K.start(C, S);
      G.audio.ambient(null);
      return S;
    }
  };
})();
