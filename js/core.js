'use strict';
/* ============================================================
   共通部品：保存、暗転、台詞、書類、判子
   ============================================================ */
const G = window.G = {};
const $ = s => document.querySelector(s);
G.$ = $;
G.rnd = () => Math.random();
G.pick = a => a[Math.floor(Math.random() * a.length)];
G.P = (...ls) => ls.map(l => '<p>' + l + '</p>').join('');
G.kv = rows => '<table class="kv">' + rows.map(([k, v]) => '<tr><th>' + k + '</th><td>' + v + '</td></tr>').join('') + '</table>';
G.note = t => '<p class="note">' + t + '</p>';
G.sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 保存 ---------- */
const META_KEY = 'chousho.meta.v1';
G.load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
G.save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
G.meta = G.load(META_KEY, null) || { seenQuote: false, runs: [], revealedOnce: false, prologueDone: false, muted: false };
G.saveMeta = () => G.save(META_KEY, G.meta);

/* ---------- 暗転の画面 ---------- */
G.curtain = function (pages, opt) {
  opt = opt || {};
  const cur = $('#curtain'), box = $('#cbox'), tap = $('#ctap');
  const token = G._ctok = (G._ctok || 0) + 1;
  return new Promise(resolve => {
    // 暗転は一瞬で。直前の部屋や人物が透けて見えないようにする
    cur.classList.add('instant'); cur.classList.add('on'); void cur.offsetWidth; cur.classList.remove('instant');
    let i = 0, ready = false;
    const show = () => {
      if (i >= pages.length) {
        cur.onclick = null; tap.classList.remove('show');
        if (opt.keep) { resolve(); return; }
        box.innerHTML = ''; resolve();
        // 呼び出し側が次の画面を描いてから、明ける
        setTimeout(() => { if (G._ctok === token) cur.classList.remove('on'); }, 80); return;
      }
      const pg = pages[i++];
      const html = typeof pg === 'string' ? pg : pg.html;
      if (pg.cue !== undefined) G.audio.cue(pg.cue);
      if (pg.sfx) G.audio.sfx(pg.sfx);
      ready = false; tap.classList.remove('show');
      box.innerHTML = '<div class="cpage">' + html + '</div>';
      requestAnimationFrame(() => requestAnimationFrame(() => { const c = box.firstChild; if (c) c.classList.add('show'); }));
      const wait = (pg.wait != null ? pg.wait : opt.wait) || 1400;
      setTimeout(() => { ready = true; tap.classList.add('show'); }, wait);
    };
    cur.onclick = () => { G.audio.unlock(); if (ready) show(); };
    setTimeout(show, opt.delay != null ? opt.delay : 600);
  });
};

/* ---------- 人物 ---------- */
// voice: 声の高さ(Hz)・音色・速さ
G.CHAR = {
  you:      { name: 'あなた', voice: { f: 120, w: 'sawtooth', rate: 1 } },
  todo:     { name: '東堂課長', kana: 'とうどう', portrait: 'todo', voice: { f: 95, w: 'sawtooth', rate: .9 } },
  shirai:   { name: '白井', kana: 'しらい', portrait: 'shirai', voice: { f: 105, w: 'sawtooth', rate: .95 } },
  oka:      { name: '岡', kana: 'おか', portrait: 'oka', voice: { f: 135, w: 'triangle', rate: 1.05 } },
  noguchi:  { name: '野口', kana: 'のぐち', portrait: 'noguchi', voice: { f: 150, w: 'triangle', rate: 1.15 } },
  kuzumi:   { name: '久住', kana: 'くずみ', portrait: 'kuzumi', voice: { f: 125, w: 'triangle', rate: .95 } },
  aoyagi:   { name: '青柳', kana: 'あおやぎ', portrait: 'aoyagi', voice: { f: 340, w: 'triangle', rate: .85 } },
  murai:    { name: '村井', kana: 'むらい', portrait: 'murai', voice: { f: 370, w: 'triangle', rate: 1.1 } },
  miyashita:{ name: '宮下', kana: 'みやした', portrait: 'miyashita', voice: { f: 100, w: 'square', rate: .9 } },
  sakai:    { name: '坂井', kana: 'さかい', portrait: 'sakai', voice: { f: 115, w: 'square', rate: 1.05 } },
  regular:  { name: '常連客', voice: { f: 110, w: 'sawtooth', rate: .9 } },
  mother:   { name: '久住和子', kana: 'くずみ かずこ', voice: { f: 320, w: 'triangle', rate: 1 } },
  kenji:    { name: '担当検事', portrait: 'kenji', voice: { f: 115, w: 'triangle', rate: 1 } },
  wife:     { name: '妻', voice: { f: 350, w: 'triangle', rate: 1 } },
  daughter: { name: '娘', voice: { f: 480, w: 'triangle', rate: 1.2 } },
  kanri:    { name: '管理人', voice: { f: 130, w: 'square', rate: 1.1 } },
  clerk:    { name: '店員', voice: { f: 300, w: 'triangle', rate: 1.1 } },
  morimoto: { name: '森本', kana: 'もりもと', voice: { f: 330, w: 'triangle', rate: 1 } },
  toda:     { name: '戸田', kana: 'とだ', portrait: 'toda', voice: { f: 95, w: 'sawtooth', rate: .95 } },
  saeki:    { name: '佐伯', kana: 'さえき', portrait: 'saeki', voice: { f: 120, w: 'triangle', rate: 1 } },
  misaki:   { name: '森川', kana: 'もりかわ', portrait: 'misaki', voice: { f: 400, w: 'triangle', rate: 1.05 } },
  eto:      { name: '江藤', kana: 'えとう', portrait: 'eto', voice: { f: 100, w: 'square', rate: .9 } },
  otsuka:   { name: '大塚', kana: 'おおつか', portrait: 'otsuka', voice: { f: 110, w: 'sawtooth', rate: .9 } },
  kiyo:     { name: '大塚キヨ', kana: 'おおつか きよ', portrait: 'kiyo', voice: { f: 330, w: 'triangle', rate: .8 } },
  prof:     { name: '久我教授', kana: 'くが', portrait: 'prof', voice: { f: 115, w: 'triangle', rate: .9 } },
  kasoken:  { name: '科捜研・松浦', kana: 'まつうら', portrait: 'kasoken', voice: { f: 130, w: 'triangle', rate: 1.05 } },
  clerk2:   { name: 'コンビニ店員', portrait: 'clerk', voice: { f: 380, w: 'triangle', rate: 1.1 } },
  witnessA: { name: '目撃者・畑中', kana: 'はたなか', voice: { f: 105, w: 'sawtooth', rate: 1 } },
  stationer:{ name: '駅員', voice: { f: 140, w: 'triangle', rate: 1.1 } },
  passenger:{ name: '乗客', voice: { f: 125, w: 'triangle', rate: 1 } },
  wifeS:    { name: '佐伯の妻', voice: { f: 350, w: 'triangle', rate: 1 } },
  neighbor: { name: '隣人', voice: { f: 300, w: 'triangle', rate: 1 } },
  fireman:  { name: '消防・火災調査員', voice: { f: 120, w: 'sawtooth', rate: 1 } },
  judge:    { name: '裁判長', voice: { f: 105, w: 'sawtooth', rate: .9 } },
  bengo:    { name: '弁護人', voice: { f: 140, w: 'triangle', rate: 1 } }
};

/* ---------- 画面の骨組み ---------- */
G.ui = { talking: false, tab: 'staff' };
G.anim = { speaking: null };
G.layout = function (o) {
  const app = $('#app');
  app.innerHTML =
    '<header class="bar"><span class="role">' + o.role + '</span><span class="date">' + (o.date || '') + '</span>'
    + '<span class="info">' + (o.info || '') + '</span>'
    + '<button class="bbtn" id="b-law">条文帳</button><button class="bbtn" id="b-quit">中断</button><button class="bbtn" id="b-snd">' + (G.meta.muted ? '音：切' : '音：入') + '</button>'
    + (o.clock ? '<div class="clock">' + o.clock + '</div>' : '') + '</header>'
    + '<section class="scene"><canvas id="cv" width="480" height="210"></canvas><div class="dlg" id="dlg"><div class="who"></div><div class="say nar">' + (o.hint || '') + '</div></div></section>'
    + '<div class="tabletop">' + (o.body || '')
    + '<div id="acts-wrap"></div></div>';
  $('#b-law').onclick = () => G.openLaw();
  $('#b-quit').onclick = async () => {
    const ok = await G.openPaper({ title: '中断する', body: G.P('この事件をここでやめて、タイトルに戻る。途中の記録は残らない。', 'つらいと感じたら、いつでもやめてかまわない。'), noClose: true,
      buttons: [{ label: 'やめてタイトルに戻る', value: true, cls: 'red' }, { label: '続ける', value: false }] });
    if (ok) location.reload();
  };
  $('#b-snd').onclick = () => { G.meta.muted = !G.meta.muted; G.saveMeta(); G.audio.setMuted(G.meta.muted); $('#b-snd').textContent = G.meta.muted ? '音：切' : '音：入'; };
  G.drawScene(o.scene || { bg: 'dark' });
};
G.audit = [];
G.auditLog = m => { if (G.audit.length < 500) G.audit.push(m); };
G.drawScene = function (sc) {
  if (sc && sc.who && G.auditCtx && G.auditCtx.suspect === sc.who && G.auditCtx.inCustody() && !['interro', 'street', 'shop', 'court'].includes(sc.bg)) G.auditLog('拘束中の被疑者が場違いな場所に表示: ' + sc.who + ' @ ' + sc.bg);
  G.lastScene = sc; const cv = $('#cv'); if (cv && G.portraits) G.portraits.scene(cv, sc); };

/* 台詞：1文字ずつ表示し、つぶやき音を鳴らす */
G.talk = function (lines, opt) {
  opt = opt || {};
  return new Promise(resolve => {
    const box = $('#dlg'); if (!box) { resolve(); return; }
    const aw = $('#acts-wrap');
    G.ui.talking = true; if (aw) aw.classList.add('wait');
    let i = 0, typing = null, full = '', waitArrive = null, startType = null;
    const finishType = () => { if (typing) { clearInterval(typing); typing = null; box.querySelector('.say').textContent = full; G.anim.speaking = null; } };
    const next = () => {
      if (waitArrive) { clearTimeout(waitArrive); waitArrive = null; G.portraits.skipArrival(); startType(); return; }
      if (typing) { finishType(); return; }
      if (i >= lines.length) {
        box.onclick = null; const m = box.querySelector('.more'); if (m) m.remove();
        G.ui.talking = false; G.anim.speaking = null; if (aw) aw.classList.remove('wait'); resolve(); return;
      }
      const L = lines[i++];
      if (typeof L === 'function') { L(); next(); return; }
      const [who, text, extra] = L;
      if (extra && extra.scene) G.drawScene(extra.scene);
      const cc = G.CHAR[who];
      if (who && !cc) G.auditLog('話者が登録されていない: ' + who + '「' + text.slice(0, 20) + '」');
      // 顔のある人物が話すときは、その人物を表示する（別人の顔のまま台詞が出ないように）
      if (cc && cc.portrait && G.lastScene && G.lastScene.who !== cc.portrait) {
        if (!(extra && extra.scene)) G.auditLog('話者と表示人物の不一致を自動修正: ' + who + ' / 表示=' + G.lastScene.who + ' / 背景=' + G.lastScene.bg);
        G.drawScene({ bg: G.lastScene.bg, who: cc.portrait });
      }
      if (extra && extra.sfx) G.audio.sfx(extra.sfx);
      const c = G.CHAR[who];
      const name = c ? c.name : (who || '');
      const nar = !who;
      G.anim.speaking = (c && c.portrait) ? c.portrait : null;
      startType = () => {
        waitArrive = null;
        G.anim.speaking = (c && c.portrait) ? c.portrait : null;
        box.innerHTML = '<div class="who">' + name + (c && c.kana ? '<span class="kana">' + c.kana + '</span>' : '') + '</div><div class="say' + (nar ? ' nar' : '') + '"></div><div class="more">▼</div>';
        const say = box.querySelector('.say');
        full = text; let k = 0;
        const step = nar ? 18 : Math.round(34 / ((c && c.voice && c.voice.rate) || 1));
        typing = setInterval(() => {
          k++; say.textContent = full.slice(0, k);
          if (!nar && c && c.voice && who !== 'you' && k % 2 === 1) G.audio.voice(c.voice, full[k - 1]);
          if (k >= full.length) { clearInterval(typing); typing = null; G.anim.speaking = null; }
        }, step);
      };
      // 人物が歩いて来ている間は、台詞を出さずに待つ（タップで飛ばせる）
      const left = G.portraits && G.portraits.arrivalLeft ? G.portraits.arrivalLeft() : 0;
      if (left > 0) { G.anim.speaking = null; box.innerHTML = '<div class="who"></div><div class="say nar"></div>'; full = ''; waitArrive = setTimeout(startType, left + 120); }
      else startType();
    };
    box.onclick = () => { G.audio.unlock(); next(); };
    next();
  });
};

/* ---------- 書類 ---------- */
G.openPaper = function (o) {
  const ov = $('#overlay');
  const stamps = (o.stamps || []).map(s => '<span class="stamp ' + s.c + (s.round ? ' round' : '') + '">' + s.t + '</span>').join('');
  ov.innerHTML = '<div class="paper' + (o.red ? ' red' : '') + '"><div class="stamps" id="stamps">' + stamps + '</div><div class="paper-h">' + o.title + '</div>'
    + (o.sub ? '<div class="paper-sub">' + o.sub + '</div>' : '') + '<div class="paper-b">' + o.body + '</div><div class="paper-f" id="pf"></div></div>';
  const pf = $('#pf');
  return new Promise(resolve => {
    (o.buttons || []).forEach(b => {
      const e = document.createElement('button'); e.className = 'pbtn ' + (b.cls || '');
      e.innerHTML = b.label + (b.small ? '<small>' + b.small + '</small>' : '');
      if (b.disabled) e.disabled = true;
      e.onclick = () => { G.audio.sfx('click'); resolve(b.value !== undefined ? b.value : b.label); if (!b.keep) G.closePaper(); };
      pf.appendChild(e);
    });
    if (!o.noClose) {
      const c = document.createElement('button'); c.className = 'pbtn'; c.textContent = o.closeLabel || '閉じる';
      c.onclick = () => { G.closePaper(); resolve(null); }; pf.appendChild(c);
      ov.onclick = e => { if (e.target === ov) { G.closePaper(); resolve(null); } };
    } else ov.onclick = null;
    ov.hidden = false; ov.scrollTop = 0; G.audio.sfx('paper');
  });
};
G.closePaper = () => { const ov = $('#overlay'); ov.hidden = true; ov.innerHTML = ''; };
G.stampOn = function (t, c, round) {
  const st = $('#stamps'); if (!st) return;
  const s = document.createElement('span'); s.className = 'stamp hit ' + c + (round ? ' round' : ''); s.textContent = t;
  s.style.transform = 'rotate(' + (-12 + G.rnd() * 8).toFixed(1) + 'deg)'; st.appendChild(s); G.audio.sfx('stamp');
};
G.toast = function (t) {
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1800);
};

/* 違法・不適切な行動の確認（赤い付箋） */
/* 注意書き（起動時・タイトル・性犯罪を扱う事件の前） */
G.SUPPORT = '<div class="howto"><b>相談窓口（全国共通）</b>性犯罪被害相談電話　<b>#8103</b>（最寄りの警察の相談窓口につながる）<br>性犯罪・性暴力被害者のためのワンストップ支援センター　<b>#8891</b></div>';
G.WARNING = G.P('<b>本作はフィクションです。</b>登場する人物・団体・地名・条例は架空のものです。',
  '刑事事件を題材にしています。<b>暴力、人の死、火災、取調べでの威圧的な言動</b>の描写があります。',
  '<b>性犯罪（電車内での痴漢）の被害を扱う事件があります。</b>被害の具体的な描写は避けていますが、被害を訴える人への聴取や、その人の供述の信用性が疑われる場面があります。性暴力の被害に遭ったことのある方にとっては、つらい記憶を呼び起こすおそれがあります。この事件は、選ぶ前にもう一度確認します。無理をせず、選ばない、途中でやめる（画面上の「中断」）といった選択をしてください。',
  '手続は現行法に基づいていますが、日数や手順を簡略化しています。法律相談・法的な助言ではありません。') + G.SUPPORT;
G.showWarning = (first) => G.openPaper({ title: '注意', sub: 'はじめに、お読みください', body: G.WARNING, noClose: !!first, red: true,
  buttons: first ? [{ label: '読んだ。はじめる', value: true }] : [] });

G.confirmRisk = function (risk) {
  const first = !G.meta['risk_' + risk.id];
  const body = (risk.lure ? '<p style="font-family:DotGothic16,sans-serif">' + risk.lure + '</p>' : '') + '<div class="riskbox"><b>' + risk.title + '</b><br>根拠：' + risk.law
    + (first || risk.always ? '<br>起こりうること：<ol>' + risk.effects.map(e => '<li>' + e + '</li>').join('') + '</ol>' : '')
    + '</div>' + (risk.note ? G.note(risk.note) : '');
  return G.openPaper({ title: '確認', red: true, body, noClose: true,
    buttons: [{ label: 'それでも行う', cls: 'red', value: true }, { label: 'やめる', value: false }] })
    .then(v => { if (v) { G.meta['risk_' + risk.id] = true; G.saveMeta(); } return v; });
};
