'use strict';
/* ============================================================
   令状・請求書の書式
   実務で使われている様式の項目と並びにならう（裁判所の様式・刑事訴訟規則142条・
   刑訴法200条、64条、219条などが定める記載事項）。人名・地名・事件は架空。
   ============================================================ */
(function () {
  const ERA = '令和8年';
  const esc = s => String(s == null ? '' : s);
  const row = (h, v, opt) => '<tr><th' + (opt && opt.span ? ' colspan="2"' : '') + '>' + h + '</th><td>' + esc(v) + '</td></tr>';
  const box = on => '<span class="fchk">' + (on ? '■' : '□') + '</span>';
  const blank = n => '<span class="fblank">' + '　'.repeat(n || 8) + '</span>';
  const seal = (txt, cls) => '<span class="fseal ' + (cls || '') + '">' + (txt || '印') + '</span>';
  const date = d => ERA + (d || '　月　日');

  // 被疑者の欄（氏名・年齢・住居・職業を一つの枠に）
  function suspect(d) {
    return '<tr><th rowspan="4" class="fv">被<br>疑<br>者</th><th>氏　名</th><td>' + esc(d.name) + (d.kana ? '<span class="fkana">（' + d.kana + '）</span>' : '') + '</td></tr>'
      + '<tr><th>年　齢</th><td>' + esc(d.age || '') + '</td></tr>'
      + '<tr><th>住　居</th><td>' + esc(d.addr || '') + '</td></tr>'
      + '<tr><th>職　業</th><td>' + esc(d.job || '') + '</td></tr>';
  }
  function judge(d) {
    return '<p class="fdate">' + date(d.date) + '</p><p class="fsign">' + (d.court || '北見坂地方裁判所') + '<br>裁判官　' + (d.judgeName || blank(5)) + '　' + seal(d.sealed ? '印' : '印', d.sealed ? 'on' : '') + '</p>';
  }

  const F = G.forms = {};

  // 逮捕状（通常逮捕）
  F.arrest = d => '<div class="form">'
    + '<h2 class="ftitle">逮　捕　状<small>（通常逮捕）</small></h2>'
    + '<table class="ftbl">' + suspect(d)
    + row('罪　名', d.charge, { span: 1 }) + row('被疑事実の要旨', d.facts || '別紙のとおり', { span: 1 })
    + row('引致すべき場所', d.place || '北見坂警察署', { span: 1 }) + row('有効期間', date(d.valid) + 'まで', { span: 1 }) + '</table>'
    + '<p class="fnote">有効期間経過後は、この令状により逮捕に着手することができない。この場合には、これを当裁判所に返還しなければならない。<br>有効期間内であっても、逮捕の必要がなくなったときは、直ちにこれを当裁判所に返還しなければならない。</p>'
    + '<p class="fmain">上記の被疑事実により、被疑者を逮捕することを許可する。</p>' + judge(d)
    + '<div class="fback"><div class="fbh">（裏面）</div><table class="ftbl">'
    + row('請求者の官公職氏名', d.requester || '北見坂警察署　司法警察員　警部　' + blank(4))
    + row('逮捕者の官公職氏名', d.arrester || blank(10)) + row('逮捕の年月日時及び場所', d.arrestAt || blank(14))
    + row('記名押印', blank(6) + seal('印', d.arrester ? 'on' : '')) + row('引致の年月日時', d.intoAt || blank(10))
    + row('送致する手続をした年月日時', blank(10)) + row('送致を受けた年月日時', blank(10)) + '</table></div></div>';

  // 勾留状（被疑者）
  F.koryu = d => '<div class="form">'
    + '<h2 class="ftitle">勾　留　状</h2>'
    + '<table class="ftbl">' + suspect(d)
    + row('被疑事実の要旨', d.facts || '別紙のとおり', { span: 1 }) + row('罪　名', d.charge, { span: 1 })
    + row('勾留すべき刑事施設', d.place || '北見坂警察署留置施設', { span: 1 }) + row('有効期間', date(d.valid) + 'まで', { span: 1 })
    + '<tr><th colspan="2">刑事訴訟法60条1項各号に定める事由</th><td>'
    + box((d.grounds || []).includes(1)) + '被疑者が定まった住居を有しない。<br>'
    + box((d.grounds || []).includes(2)) + '被疑者が罪証を隠滅すると疑うに足りる相当な理由がある。<br>'
    + box((d.grounds || []).includes(3)) + '被疑者が逃亡し又は逃亡すると疑うに足りる相当な理由がある。</td></tr></table>'
    + '<p class="fnote">この令状は、有効期間経過後は、その執行に着手することができない。この場合には、これを当裁判所に返還しなければならない。</p>'
    + '<p class="fmain">被疑者に対する上記被疑事件について、同被疑者を上記刑事施設に勾留する。</p>' + judge(d)
    + '<div class="fback"><div class="fbh">（裏面）</div><table class="ftbl">'
    + row('勾留請求の年月日', date(d.reqDate)) + row('執行した年月日時及び場所', blank(14)) + row('執行者の官公職氏名', blank(8) + seal())
    + '<tr><th>勾留期間の延長</th><td>' + (d.ext ? '延長する期間　' + d.ext.days + '日（' + date(d.ext.to) + 'まで）<br>理由　' + d.ext.why + '<br>' + date(d.ext.date) + '　北見坂地方裁判所　裁判官　' + seal('印', 'on') : '延長する期間　' + blank(4) + '<br>理由　' + blank(12)) + '</td></tr>'
    + '</table></div></div>';

  // 捜索差押許可状
  F.search = d => '<div class="form">'
    + '<h2 class="ftitle">捜索差押許可状</h2>'
    + '<table class="ftbl">' + row('被疑者の氏名', esc(d.name) + (d.age ? '　' + d.age : '')) + row('罪　名', d.charge)
    + row('捜索すべき場所、身体又は物', d.place) + row('差し押さえるべき物', d.items)
    + row('請求者の官公職氏名', d.requester || '北見坂警察署　司法警察員　警部　' + blank(4)) + row('有効期間', date(d.valid) + 'まで')
    + (d.note ? row('備　考', d.note) : '') + '</table>'
    + '<p class="fnote">有効期間経過後は、この令状により捜索又は差押えに着手することができない。この場合には、これを当裁判所に返還しなければならない。</p>'
    + '<p class="fmain">被疑者に対する上記被疑事件について、上記のとおり捜索及び差押えをすることを許可する。</p>' + judge(d) + '</div>';

  // 身体検査令状
  F.body = d => '<div class="form">'
    + '<h2 class="ftitle">身体検査令状</h2>'
    + '<table class="ftbl">' + row('被疑者の氏名', esc(d.name) + (d.age ? '　' + d.age : '')) + row('罪　名', d.charge)
    + row('検査すべき身体', d.place) + row('身体の検査に関する条件', d.cond || 'なし')
    + row('請求者の官公職氏名', d.requester || '北見坂警察署　司法警察員　警部　' + blank(4)) + row('有効期間', date(d.valid) + 'まで') + '</table>'
    + '<p class="fnote">有効期間経過後は、この令状により身体の検査に着手することができない。この場合には、これを当裁判所に返還しなければならない。</p>'
    + '<p class="fmain">被疑者に対する上記被疑事件について、上記の身体の検査をすることを許可する。</p>' + judge(d) + '</div>';

  // 請求書（逮捕状・勾留・延長・捜索差押・身体検査）
  // rows: [[項目, 内容], ...]（判事編の各請求の項目をそのまま、標準の並びに置き直す）
  const ORDER = ['被疑者', '住居', '罪名', '被疑事実の要旨', '逮捕の理由', '逮捕の必要', '刑訴法60条1項各号', '勾留の期間', '延長を求める期間', 'やむを得ない事由',
    '捜索すべき場所', '捜索すべき場所・身体・物', '差し押さえるべき物', '検査すべき身体', '身体の検査を必要とする理由', '引致すべき場所', '前の請求'];
  const LABEL = { '逮捕の理由': '被疑者が罪を犯したことを疑うに足りる相当な理由', '逮捕の必要': '被疑者の逮捕を必要とする事由', '刑訴法60条1項各号': '刑事訴訟法60条1項各号に定める事由',
    '前の請求': '同一の犯罪事実又は現に捜査中である他の犯罪事実について、前に逮捕状の請求又はその発付があったときは、その旨及びその犯罪事実', '引致すべき場所': '引致すべき官公署その他の場所' };
  F.request = (title, rows, d) => {
    d = d || {};
    const pros = /勾留/.test(title);
    const sorted = rows.slice().sort((a, b) => { const ia = ORDER.indexOf(a[0]), ib = ORDER.indexOf(b[0]); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    const kind = /逮捕状/.test(title) ? '逮捕状' : /延長/.test(title) ? '勾留期間の延長' : /勾留/.test(title) ? '勾留' : /身体検査/.test(title) ? '身体検査令状' : '捜索差押許可状';
    const lead = /逮捕状/.test(title) ? '下記被疑者に対し、' + '通常逮捕状の発付を請求する。' : /延長/.test(title) ? '下記被疑者に対する勾留の期間を、下記のとおり延長されたく請求する。' : /勾留/.test(title) ? '下記被疑者に対し、勾留を請求する。' : '下記被疑事件について、' + kind + 'の発付を請求する。';
    const extra = /逮捕状/.test(title) && !rows.some(r => r[0] === '前の請求') ? [['七日を超える有効期間を必要とするときは、その旨及び事由', 'なし'], ['逮捕状を数通必要とするときは、その旨及び事由', 'なし']] : [];
    return '<div class="form freq">'
      + '<p class="fdate">' + date(d.date) + '</p>'
      + '<p class="fto">北見坂地方裁判所<br>裁判官　殿</p>'
      + '<p class="ffrom">' + (pros ? '北見坂地方検察庁<br>検察官　検事　' + (d.who || blank(4)) : '北見坂警察署<br>司法警察員　警部　' + (d.who || blank(4))) + '　' + seal('印', 'on') + '</p>'
      + '<h2 class="ftitle">' + title + '</h2>'
      + '<p class="fmain">' + lead + '</p><p class="fki">記</p>'
      + '<table class="ftbl">' + sorted.map((r, i) => '<tr><th><span class="fno">' + (i + 1) + '</span>' + (LABEL[r[0]] || r[0]) + '</th><td>' + r[1] + '</td></tr>').join('')
      + extra.map((r, i) => '<tr><th><span class="fno">' + (sorted.length + i + 1) + '</span>' + r[0] + '</th><td>' + r[1] + '</td></tr>').join('') + '</table></div>';
  };
})();
