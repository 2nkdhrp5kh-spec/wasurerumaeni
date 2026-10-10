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
// 保存先は G.store を通す。ブラウザでは localStorage。将来アプリにするときは、ここだけを差し替える
// （例：Steam のクラウドセーブ、スマホの保存領域）。窓口を一つにしておけば、ほかのコードは変えなくてよい
const META_KEY = 'chousho.meta.v1';
G.store = window.CHOUSHO_STORE || {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  remove: k => { try { localStorage.removeItem(k); } catch (e) {} }
};
G.load = (k, d) => { try { const v = G.store.get(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
G.save = (k, v) => { try { G.store.set(k, JSON.stringify(v)); } catch (e) {} };
// セーブデータの版。形を変えたら番号を上げ、MIGRATE に「前の版からの直し方」を足す（古いセーブを壊さないため）
// 開発用（?dev=1 の「場面へ飛ぶ」）：真相と、数年後の出来事を決め打ちにする。ふだんは null
G.devTruth = null; G.devReveal = null;
G.devHit = p => G.devReveal != null ? G.devReveal : G.rnd() < p;
G.SAVE_VERSION = 2;
const MIGRATE = {
  // 1 → 2：版番号を持たない最初の形。中身はそのまま使える
  1: m => m
};
G.newMeta = () => ({ v: G.SAVE_VERSION, seenQuote: false, runs: [], revealedOnce: false, prologueDone: false, muted: false });
G.meta = (() => {
  const m = G.load(META_KEY, null); if (!m) return G.newMeta();
  let v = m.v || 1; while (v < G.SAVE_VERSION && MIGRATE[v]) { MIGRATE[v](m); v++; }
  m.v = G.SAVE_VERSION; return m;
})();
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
    cur.onclick = e => { if (e && e.target && e.target.id === 'cquit') return; G.audio.unlock(); if (ready) show(); };
    // 暗転の画面でも中断できる（二度押し）
    const cq = $('#cquit'); if (cq) { cq.hidden = !G.inMode; cq.textContent = '中断'; cq.onclick = e => { e.stopPropagation(); if (cq.dataset.arm === '1') { cq.dataset.arm = ''; G.quit(); return; } cq.dataset.arm = '1'; cq.textContent = 'もう一度押すと中断'; setTimeout(() => { cq.dataset.arm = ''; cq.textContent = '中断'; }, 3000); }; }
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
// 枠の中で開かれたとき（アプリの中のプレビューなど）は、上に見出しの帯が重なる
try { if (window.self !== window.top) { G.topInset = 64; document.documentElement.style.setProperty('--top-inset', '64px'); } } catch (e) { G.topInset = 64; document.documentElement.style.setProperty('--top-inset', '64px'); }
G.layout = function (o) {
  const app = $('#app');
  app.innerHTML =
    '<header class="bar"><span class="role">' + o.role + '</span><span class="date">' + (o.date || '') + '</span>'
    + '<span class="info">' + (o.info || '') + '</span>'
    + '<button class="bbtn" id="b-law">条文帳</button>' + (G.guide ? '<button class="bbtn" id="b-gl">用語</button>' : '') + '<button class="bbtn" id="b-quit">中断</button><button class="bbtn" id="b-snd">' + (G.meta.muted ? '音：切' : '音：入') + '</button>'
    + (o.clock ? '<div class="clock">' + o.clock + '</div>' : '') + '</header>'
    + '<section class="scene"><canvas id="cv" width="480" height="210"></canvas><div class="dlg" id="dlg"><div class="who"></div><div class="say nar">' + (o.hint || '') + '</div></div></section>'
    + '<div class="tabletop">' + (o.body || '')
    + '<div id="acts-wrap"></div>' + (o.after || '') + '</div>';
  $('#b-law').onclick = () => G.openLaw();
  if ($('#b-gl')) $('#b-gl').onclick = () => G.guide.openGlossary();
  $('#b-quit').onclick = async () => {
    const ok = await G.openPaper({ title: '中断する', body: G.P('この事件をここでやめて、タイトルに戻る。途中の記録は残らない。', 'つらいと感じたら、いつでもやめてかまわない。'), noClose: true,
      buttons: [{ label: 'やめてタイトルに戻る', value: true, cls: 'red' }, { label: '続ける', value: false }] });
    if (ok) G.quit();
  };
  $('#b-snd').onclick = () => { G.meta.muted = !G.meta.muted; G.saveMeta(); G.audio.setMuted(G.meta.muted); $('#b-snd').textContent = G.meta.muted ? '音：切' : '音：入'; };
  G.drawScene(o.scene || { bg: 'dark' });
};
G.audit = [];
G.auditLog = m => { if (G.audit.length < 500) G.audit.push(m); };
G.drawScene = function (sc) {
  // 課長と話すときは、こちらが課長の机まで行く
  if (sc && sc.who === 'todo' && (!sc.bg || sc.bg === 'office')) sc = Object.assign({}, sc, { bg: 'kacho' });
  if (sc && sc.who && G.auditCtx && G.auditCtx.suspect === sc.who && G.auditCtx.inCustody() && !['interro', 'street', 'shop', 'court'].includes(sc.bg)) G.auditLog('拘束中の被疑者が場違いな場所に表示: ' + sc.who + ' @ ' + sc.bg);
  G.lastScene = sc; const cv = $('#cv'); if (cv && G.portraits) G.portraits.scene(cv, sc); };

/* 台詞の重要語：*…* で囲んだ語と、登場人物の台詞に出る用語を赤くする */
G.KEYWORDS = ['録音・録画', '録画の義務', '録画', '黙秘権', '供述拒否権', '逮捕状', '捜索差押許可状', '令状', '勾留延長', '勾留', '満期', '48時間', '72時間', '23日', '任意', '強制', '違法収集証拠', '違法', '証拠能力', '任意性',
  '自白', '秘密の暴露', '送致', '在宅', '釈放', '不起訴', '起訴', '正当防衛', '過剰防衛', '殺意', '故意', '伝聞', '別件', '現行犯', '略式', '再審', '訴因', '弁護人', '準抗告', '相当な理由', '逮捕の必要', '罪証隠滅', '逃亡'];
G.markup = function (text, auto) {
  // 返り値：[{ ch, red }]（1文字ずつ）
  const out = []; let red = false;
  for (const ch of text) { if (ch === '*') { red = !red; continue; } out.push({ ch, red }); }
  if (auto) {
    const plain = out.map(o => o.ch).join(''), used = new Set();
    G.KEYWORDS.forEach(k => { if (used.size > 3) return; const i = plain.indexOf(k); if (i < 0 || [...used].some(u => u[0] <= i + k.length && i <= u[1])) return; used.add([i, i + k.length]); for (let j = i; j < i + k.length; j++) out[j].red = true; });
  }
  return out;
};
G.renderMarked = (arr, k) => { let h = '', red = false; for (let i = 0; i < Math.min(k, arr.length); i++) { const o = arr[i]; if (o.red !== red) { h += red ? '</span>' : '<span class="kw">'; red = o.red; } h += o.ch === '<' ? '&lt;' : o.ch === '&' ? '&amp;' : o.ch; } return h + (red ? '</span>' : ''); };

/* 台詞：1文字ずつ表示し、つぶやき音を鳴らす */
G.talk = function (lines, opt) {
  opt = opt || {};
  return new Promise(resolve => {
    const box = $('#dlg'); if (!box) { resolve(); return; }
    const aw = $('#acts-wrap');
    G.ui.talking = true; if (aw) aw.classList.add('wait');
    // 台詞欄が画面の外にあれば、見える位置まで動かす（終わったら元の位置に戻す）
    // 続けて別の台詞が始まるなら、戻らずにそのまま（戻るのは、最後の台詞が終わってから）
    let backTo = null;
    if (G._scrollBack) { clearTimeout(G._scrollBack.t); backTo = G._scrollBack.y; G._scrollBack = null; }
    // 背景・人物・台詞欄のすべて（.scene 全体）が画面に収まっていなければ、そこまで動かす
    // 上に重なる帯（アプリの見出しなど）の高さ G.topInset を除いた範囲に、顔の上から台詞欄の下までを収める
    const sc = box.closest('.scene') || box, r0 = sc.getBoundingClientRect(), top = G.topInset || 0;
    if (r0.top < top || r0.bottom > window.innerHeight) {
      if (backTo == null) backTo = window.scrollY;
      const y0 = window.scrollY + r0.top;
      // ページの一番上に戻しても台詞欄まで見えるなら、一番上へ
      const want = (y0 + r0.height <= window.innerHeight) ? 0 : Math.max(0, y0 - top - 6);
      window.scrollTo({ top: want, behavior: 'smooth' });
    }
    let i = 0, typing = null, full = '', waitArrive = null, startType = null;
    const tok = G._qtok;   // 中断（G.quit）されたら、この台詞は死ぬ：画面の押下を横取りせず、声も止める
    const dead = () => G._qtok !== tok;
    let marked = [];
    const finishType = () => { if (typing) { clearInterval(typing); typing = null; box.querySelector('.say').innerHTML = G.renderMarked(marked, marked.length); G.anim.speaking = null; } };
    const next = () => {
      if (waitArrive) { clearTimeout(waitArrive); waitArrive = null; G.portraits.skipArrival(); startType(); return; }
      if (typing) { finishType(); return; }
      if (i >= lines.length) {
        box.onclick = null; document.removeEventListener('click', anyTap, true); const m = box.querySelector('.more'); if (m) m.remove();
        if (backTo != null && !lines.noReturn) {
          const y = backTo;
          // 書類が開いている間や説明の間は待ち、閉じてから戻る。その前に次の台詞が始まれば、そちらに引き継ぐ
          const tryBack = () => { const ov = $('#overlay'); if (G.ui.talking) return; if ((ov && !ov.hidden) || document.querySelector('.coach') || $('#curtain.on')) { G._scrollBack = { y, t: setTimeout(tryBack, 400) }; return; } G._scrollBack = null; if ($('#acts-wrap')) window.scrollTo({ top: y, behavior: 'smooth' }); };
          G._scrollBack = { y, t: setTimeout(tryBack, 450) };
        }
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
      if (extra && extra.cue) G.audio.cue(extra.cue);
      const c = G.CHAR[who];
      const name = c ? c.name : (who || '');
      const nar = !who;
      G.anim.speaking = (c && c.portrait) ? c.portrait : null;
      startType = () => {
        waitArrive = null;
        G.anim.speaking = (c && c.portrait) ? c.portrait : null;
        box.innerHTML = '<div class="who">' + name + (c && c.kana ? '<span class="kana">' + c.kana + '</span>' : '') + '</div><div class="say' + (nar ? ' nar' : '') + '"></div><div class="more">▼</div>';
        const say = box.querySelector('.say');
        marked = G.markup(text, !nar); full = marked.map(o => o.ch).join(''); let k = 0;
        const step = nar ? 18 : Math.round(34 / ((c && c.voice && c.voice.rate) || 1));
        typing = setInterval(() => {
          if (dead()) { clearInterval(typing); typing = null; return; }
          k++; say.innerHTML = G.renderMarked(marked, k);
          if (!nar && c && c.voice && who !== 'you' && k % 2 === 1) G.audio.voice(c.voice, full[k - 1]);
          if (k >= full.length) { clearInterval(typing); typing = null; G.anim.speaking = null; }
        }, step);
      };
      // 人物が歩いて来ている間は、台詞を出さずに待つ（タップで飛ばせる）
      const left = G.portraits && G.portraits.arrivalLeft ? G.portraits.arrivalLeft() : 0;
      if (left > 0) { G.anim.speaking = null; box.innerHTML = '<div class="who"></div><div class="say nar"></div>'; full = ''; waitArrive = setTimeout(startType, left + 120); }
      else startType();
    };
    // 画面のどこを押しても進む（書類・暗転・上の帯のボタン・説明の吹き出しは除く）
    const anyTap = e => {
      if (dead()) { document.removeEventListener('click', anyTap, true); if (typing) { clearInterval(typing); typing = null; } if (waitArrive) { clearTimeout(waitArrive); waitArrive = null; } return; }
      const t = e.target;
      if (t.closest && (t.closest('#overlay:not([hidden])') || t.closest('#curtain.on') || t.closest('.bar') || t.closest('.coach'))) return;
      const ov = $('#overlay'); if (ov && !ov.hidden) return;
      e.preventDefault(); e.stopPropagation(); G.audio.unlock(); next();
    };
    document.addEventListener('click', anyTap, true);
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
  // 前の紙が開いたままなら、閉じたものとして終わらせる（待っている処理が止まらないように）
  if (G._paperDone) { const d = G._paperDone; G._paperDone = null; d(null); }
  return new Promise(resolve0 => {
    let fin = false; const resolve = v => { if (fin) return; fin = true; if (G._paperDone === resolve) G._paperDone = null; resolve0(v); };
    G._paperDone = resolve;
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
G.closePaper = () => { const ov = $('#overlay'); ov.hidden = true; ov.innerHTML = ''; if (G._paperDone) { const d = G._paperDone; G._paperDone = null; d(null); } };
G.stampOn = function (t, c, round) {
  const st = $('#stamps'); if (!st) return;
  // 判子は紙の上のほうに押す。スマホで下までスクロールしていても見えるように、上へ戻す
  const ov = $('#overlay'); if (ov && ov.scrollTop > 0) ov.scrollTo({ top: 0, behavior: 'smooth' });
  const s = document.createElement('span'); s.className = 'stamp hit ' + c + (round ? ' round' : ''); s.innerHTML = G.sealSvg(t, round ? 'round' : 'rect');
  s.style.transform = 'rotate(' + (-12 + G.rnd() * 8).toFixed(1) + 'deg)'; st.appendChild(s); G.audio.sfx('stamp');
};
// 判子の絵（SVG）。二重の枠、篆書風の字、朱肉のかすれ（ノイズで欠けさせ、縁を揺らす）
let sealN = 0;
G.sealSvg = function (t, kind) {
  const id = 'sl' + (++sealN), seed = Math.floor(G.rnd() * 999);
  const flt = '<filter id="' + id + '" x="-5%" y="-5%" width="110%" height="110%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="' + seed + '" result="n"/>'
    + '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.8 1.8" result="m"/>'
    + '<feComposite in="SourceGraphic" in2="m" operator="in" result="ink"/>'
    + '<feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="1" seed="' + (seed + 7) + '" result="w"/>'
    + '<feDisplacementMap in="ink" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>';
  const font = "font-family=\"'Yuji Syuku','Noto Serif JP',serif\" fill=\"currentColor\"";
  if (kind === 'round') {
    // 裁判官の印：外周に庁名、中に「裁判官」
    return '<svg viewBox="0 0 80 80" width="64" height="64"><defs>' + flt + '<path id="' + id + 'p" d="M40,40 m-27,0 a27,27 0 1,1 54,0 a27,27 0 1,1 -54,0"/></defs>'
      + '<g filter="url(#' + id + ')"><circle cx="40" cy="40" r="37" fill="none" stroke="currentColor" stroke-width="3.6"/><circle cx="40" cy="40" r="31.5" fill="none" stroke="currentColor" stroke-width="1"/>'
      + '<circle cx="40" cy="40" r="19" fill="none" stroke="currentColor" stroke-width="1.2"/>'
      + '<text ' + font + ' font-size="8.5" letter-spacing="1.2"><textPath href="#' + id + 'p" startOffset="2%">北見坂地方裁判所　　令状部　　</textPath></text>'
      + '<text ' + font + ' x="40" y="38" font-size="13" text-anchor="middle" font-weight="700">' + (t === '印' ? '裁判' : t.slice(0, 2)) + '</text>'
      + '<text ' + font + ' x="40" y="52" font-size="13" text-anchor="middle" font-weight="700">' + (t === '印' ? '官印' : t.slice(2, 4)) + '</text></g></svg>';
  }
  // 角印：太い外枠と細い内枠、上に庁名、中に文言
  const n = [...t].length, w = Math.max(84, 30 + n * 26);
  return '<svg viewBox="0 0 ' + w + ' 60" width="' + w + '" height="60"><defs>' + flt + '</defs><g filter="url(#' + id + ')">'
    + '<rect x="2" y="2" width="' + (w - 4) + '" height="56" rx="3" fill="none" stroke="currentColor" stroke-width="4"/>'
    + '<rect x="7" y="7" width="' + (w - 14) + '" height="46" rx="1" fill="none" stroke="currentColor" stroke-width="1"/>'
    + '<line x1="7" y1="18" x2="' + (w - 7) + '" y2="18" stroke="currentColor" stroke-width="1"/>'
    + '<text ' + font + ' x="' + (w / 2) + '" y="15.5" font-size="7.5" text-anchor="middle" letter-spacing="1.5">北見坂地方裁判所</text>'
    + '<text ' + font + ' x="' + (w / 2) + '" y="45" font-size="25" text-anchor="middle" font-weight="700" letter-spacing="' + (n <= 2 ? 6 : 2) + '">' + t + '</text></g></svg>';
};
// 判を押した紙を、相手（書記官など）に渡す：紙が机から離れていく
G.handOff = async function (msg) {
  const p = document.querySelector('#overlay .paper'); if (p) p.classList.add('handoff');
  G.audio.sfx('paper'); await G.sleep(650); G.closePaper(); if (msg) G.toast(msg);
};
G.toast = function (t) {
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1800);
};

/* 違法・不適切な行動の確認（赤い付箋） */
/* 難しさ：easy（やさしい）／normal（ふつう）／hard（むずかしい） */
G.diff = () => (G.meta && G.meta.diff) || 'easy';   // はじめての人は「やさしい」から
G.DIFF_LABEL = { easy: '初学者', normal: '既習者', hard: '実務家' };
G.DIFF_DESC = {
  easy: ['刑事訴訟法・刑法・憲法を学んだことがない人向け。', 'まずは刑事手続の流れ（捜査→逮捕→勾留→送致→起訴）をつかもう。いまの目的と次にできることが示され、照らし合わせの手がかりも出る。危うい手段を選ぶと、その前に確認の付箋が出る。'],
  normal: ['刑事訴訟法・刑法・憲法を学んだことがある人向け。', '根拠となる条文を確かめ、どの学説を採るかで結論がどう分かれるかを考えてみよう。危うい手段に確認は出ない。適法かどうかは、条文帳で自分で判断する。'],
  hard: ['刑事手続を一通り学んだ人向け。ヒントはない。', '次にできることの案内、照らし合わせの下線、部下の読み返し、見立ての目盛りは出ない。部下も一人少ない。逮捕・令状・取調べ・照会・鑑定などの前には、根拠になる条文を条文帳から自分で選ぶ（間違えると差し戻され、その日はもう同じことはできない）。']
};
// 難しさを選ぶ画面
G.chooseDiff = async function (first) {
  const v = await G.openPaper({ title: '難しさを選ぶ', sub: first ? 'はじめに、あなたに合った難しさを選ぶ。あとからタイトル画面で変えられる。' : 'いまは「' + G.DIFF_LABEL[G.diff()] + '」', noClose: !!first,
    body: '', buttons: ['easy', 'normal', 'hard'].map(k => ({ label: G.DIFF_LABEL[k] + (G.diff() === k && !first ? '（いま）' : ''), value: k, small: G.DIFF_DESC[k][0] + G.DIFF_DESC[k][1], cls: k === 'easy' ? 'green' : '' })) });
  if (!v) return;
  G.meta.diff = v; G.meta.diffChosen = true; G.saveMeta(); G.audio.sfx('click');
};

/* 初めてのときだけの説明 */
G.tip = function (key, lines) { G.meta.tips = G.meta.tips || {}; if (G.meta.tips[key]) return Promise.resolve(); G.meta.tips[key] = true; G.saveMeta(); return G.talk(lines); };

/* 中断：どの画面からでも、タイトルに戻る（ページの再読み込みに頼らない） */
G.inMode = false;
G.quit = function () {
  G.inMode = false; const cq = $('#cquit'); if (cq) cq.hidden = true;
  G._ctok = (G._ctok || 0) + 1;                       // 進行中の暗転を無効に
  G._qtok = (G._qtok || 0) + 1;                       // 進行中の台詞を無効に
  const cur = $('#curtain'); cur.classList.remove('on'); cur.onclick = null; $('#cbox').innerHTML = '';
  G.closePaper(); G.ui.talking = false; G.ui.busy = false; G.anim.speaking = null;
  if (G.keiji && G.keiji.abort) G.keiji.abort();
  G.audio.ambient(null); G.audio.cue('silence');
  G.auditCtx = null; G.lawMode = null;
  if (G.main && G.main.title) G.main.title(); else location.reload();
};

/* 注意書き（起動時・タイトル・性犯罪を扱う事件の前） */
G.WARNING = G.P('<b>本作はフィクションです。</b>登場する人物・団体・地名・条例は架空のものです。',
  '<b>犯罪とその被害の描写を含みます。</b>暴力、人の死、性犯罪、火災、取調べでの威圧的な言動などが出てきます。被害を訴える人の話が疑われる場面もあります。犯罪の被害に遭ったことのある方にとっては、つらい記憶を呼び起こすおそれがあります。無理をせず、途中でやめる（画面上の「中断」）、事件を選ばない、といった選択をしてください。',
  '手続は現行法に基づいていますが、日数や手順を簡略化しています。法律相談・法的な助言ではありません。');
G.showWarning = (first) => G.openPaper({ title: '注意', sub: 'はじめに、お読みください', body: G.WARNING, noClose: !!first, red: true,
  buttons: first ? [{ label: '読んだ。はじめる', value: true }] : [] });

// 違法かどうかは、プレイヤーが条文から判断する。印も確認もしない（「やさしい」のときだけ、確認の付箋を出す）
// 誘い文句（lure）は、台詞として聞こえる
G.confirmRisk = function (risk) {
  // ふつう・むずかしい：確認も誘いの台詞もなく、そのまま実行される（誘いは、選ぶ前に聞かされる）
  if (G.diff() !== 'easy') { G.meta['risk_' + risk.id] = true; return Promise.resolve(true); }
  return G.confirmRiskBox(risk);
};
G.confirmRiskBox = function (risk) {
  const first = !G.meta['risk_' + risk.id];
  const body = (risk.lure ? '<p style="font-family:DotGothic16,sans-serif">' + risk.lure + '</p>' : '')
    + (risk.gain ? '<div class="gainbox"><b>うまくいけば</b><ul>' + risk.gain.map(g => '<li>' + g + '</li>').join('') + '</ul></div>' : '')
    + '<div class="riskbox"><b>' + risk.title + '</b><br>根拠：' + risk.law
    + (first || risk.always ? '<br>起こりうること：<ol>' + risk.effects.map(e => '<li>' + e + '</li>').join('') + '</ol>' : '')
    + '</div>' + (risk.note ? G.note(risk.note) : '');
  return G.openPaper({ title: '確認', red: true, body, noClose: true,
    buttons: [{ label: 'それでも行う', cls: 'red', value: true }, { label: 'やめる', value: false }] })
    .then(v => { if (v) { G.meta['risk_' + risk.id] = true; G.saveMeta(); } return v; });
};
