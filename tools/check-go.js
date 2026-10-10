// 第五章の自己検査：自動の捜査官が何通りもの世界で遊び、記録と台詞を検査する
//   node tools/check-go.js [世界の数=6] [日数=12] [--shots]
// 検査すること
//   ・時間の矛盾：記録が作られた時点より後の日時が、記録に書かれていないか
//   ・推理の書き込み：記録の本文（メッセージの画面・メモは除く）や部下の報告に、結論の言葉がないか
//   ・午前／午後のあいまいさ：12以下の「◯時」の前に、朝・夜・午前・午後などがあるか
//   ・ありえない重複：同じ相手・同じものを、二人の部下に同時に頼めていないか
//   ・ページのエラー
// --shots：スマホの幅で、アプリの見出しが重なる状態をまねて、画面を撮る（scratchpad/shots へ）
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const path = require('path'), fs = require('fs');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const N = +(args[0] || 6), DAYS = +(args[1] || 12), SHOTS = process.argv.includes('--shots');
const ROOT = path.resolve(__dirname, '..');
const SHOTDIR = process.env.SHOTDIR || path.join(ROOT, 'tools', 'shots');

const INFER = /同じ|一致|つなが|と考え|可能性|矛盾は|ことが分か|示して|裏付け|と見られ|らしい|はずだ/;
const AMBIG_OK = /朝|夜|晩|昼|夕|午前|午後|深夜|未明|明け方|勤務時間|[0-9]時〜|月/;

(async () => {
  const browser = await chromium.launch();
  const problems = []; const P = (k, m) => problems.push(k + '　' + m);
  if (SHOTS) fs.mkdirSync(SHOTDIR, { recursive: true });
  for (let w = 0; w < N; w++) {
    const seed = 1000 + w * 7919;
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOTS ? 2 : 1 });
    page.on('pageerror', e => P('エラー', '種' + seed + '：' + e.message));
    await page.route('**/fonts.googleapis.com/**', x => x.abort());
    await page.addInitScript(() => {
      window.CHOUSHO_APP = true;
      const st = window.setTimeout; window.setTimeout = (f, t, ...a) => st(f, Math.min(t || 0, 3), ...a);
      const si = window.setInterval; window.setInterval = (f, t, ...a) => si(f, Math.min(t || 0, 5), ...a);
      localStorage.setItem('chousho.meta.v1', JSON.stringify({ seenQuote: true, seenWarning3: true, prologueDone: true, runs: [], diff: 'normal', diffChosen: true }));
    });
    // アプリの中のプレビューをまねる：枠の中で開き、上に見出しの帯を重ねる
    const wrap = path.join(SHOTDIR, '..', 'wrap.html');
    if (SHOTS) {
      fs.writeFileSync(wrap, '<!doctype html><meta name=viewport content="width=device-width"><style>body{margin:0}iframe{border:0;width:100vw;height:100vh;display:block}.hd{position:fixed;top:0;left:0;right:0;height:64px;background:rgba(40,36,30,.82);color:#fff;font:600 16px system-ui;display:flex;align-items:center;justify-content:center;pointer-events:none}</style><iframe src="file://' + ROOT + '/index.html"></iframe><div class=hd>（アプリの見出し）</div>');
      await page.goto('file://' + wrap);
    } else await page.goto('file://' + ROOT + '/index.html');
    await page.waitForTimeout(400);
    const F = SHOTS ? page.frames()[1] : page.mainFrame();
    await F.evaluate(s => {
      G.lawMode = 'keiji'; G.inMode = true;
      window.__lines = [];
      const talk = G.talk; G.talk = (ls, ...a) => { (ls || []).forEach(l => window.__lines.push([l[0], l[1], !!(l[2] && l[2].report)])); return talk(ls, ...a); };
      G.cases.go.run(s);
    }, seed);
    const flush = async () => { for (let i = 0; i < 600; i++) { const r = await F.evaluate(() => { const q = s => document.querySelector(s); if (q('#curtain.on')) { q('#curtain').click(); return 1; } if (G.ui.talking) { q('#dlg').click(); return 1; } if (G.ui.busy) return 2; return 0; }); if (!r) return; await page.waitForTimeout(r === 2 ? 15 : 4); } };
    const click = (sel, re) => F.evaluate(([sel, re]) => { const b = [...document.querySelectorAll(sel)].filter(x => !x.disabled && new RegExp(re).test(x.textContent)); const x = b[Math.floor(Math.random() * b.length)]; if (x) { x.click(); return x.textContent.slice(0, 30); } return null; }, [sel, re]);
    const shot = async name => { if (SHOTS) await page.screenshot({ path: path.join(SHOTDIR, name + '.png') }); };
    await flush();
    if (w === 0 && SHOTS) {
      // 台詞の途中を撮る（顔と台詞欄が見えるか）
      await F.evaluate(() => { G.talk([['shirai', '主任。これは、台詞の欄と顔が見えるかを確かめるための台詞です。', { scene: { bg: 'office', who: 'shirai' } }]]); });
      await page.waitForTimeout(400); await shot('talk');
      await flush();
    }
    // 見た目の検査：中身が枠からはみ出していないか、画面が横にはみ出していないか
    const layout = async where => {
      const bad = await F.evaluate(() => {
        const out = [], W = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth > W + 1) out.push('画面が横にはみ出す（幅' + document.documentElement.scrollWidth + '）');
        const box = '.pcard, .paper, .panel, .elem, .act, .staff, .doc, .goal, .bub, .chat';
        // 箱ではなく、文字が実際に描かれた位置で見る（字下げなどで、箱の中の文字だけが外へ出ることがある）
        const nodes = [];
        document.querySelectorAll('.pcard, .paper, .panel, .act, .goal').forEach(root => { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) if (n.textContent.trim()) nodes.push(n); });
        nodes.forEach(n => {
          const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(), e = n.parentElement;
          if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') return;
          const p = e.closest(box); if (!p) return; const q = p.getBoundingClientRect();
          if (r.left < q.left - 2 || r.right > q.right + 2) out.push((e.className || e.tagName) + '「' + (e.textContent || '').trim().slice(0, 14) + '」が枠（' + p.className.split(' ')[0] + '）の外に ' + Math.round(Math.max(q.left - r.left, r.right - q.right)) + 'px');
        });
        return [...new Set(out)].slice(0, 8);
      });
      bad.forEach(b => P('見た目', where + '：' + b));
    };
    // 寄り道：記録を開いて、でたらめな組で並べてみる・途中でやめる
    const wander = async () => {
      const r = Math.random();
      if (r < .4) {
        const t = await click('#docs .doc', '.');
        if (!t) return; await page.waitForTimeout(20); await layout('記録「' + t + '」');
        if (Math.random() < .6 && await click('#overlay .pbtn', '横に並べる')) {
          await page.waitForTimeout(20); await click('#overlay .pbtn', '^(?!やめる|閉じる)'); await page.waitForTimeout(30);
          await F.evaluate(() => { document.querySelectorAll('.cmpp .paper').forEach(p => { const u = [...p.querySelectorAll('.u')]; const x = u[Math.floor(Math.random() * u.length)]; x && x.click(); }); const g = document.querySelector('#cmpgo'); if (g && !g.disabled && Math.random() < .7) g.click(); });
          await page.waitForTimeout(40); await F.evaluate(() => { const x = document.querySelector('#cmpx'); x && x.click(); });
        }
        await F.evaluate(() => { const ov = document.querySelector('#overlay'); if (ov && !ov.hidden) { const b = [...ov.querySelectorAll('.pbtn')].find(x => /閉じる|やめる/.test(x.textContent)); b ? b.click() : G.closePaper(); } });
        await flush();
      } else if (r < .55) {
        // 選びかけて、やめる
        if (await click('#acts .act', '聞き込み|防犯カメラ|照会|鑑定|差し押さえ|提出')) { await page.waitForTimeout(15); await click('#overlay .pbtn', 'やめる'); await flush(); }
      }
    };
    for (let d = 0; d < DAYS; d++) {
      await layout(d + '日目の机'); await wander(); await wander();
      // 0日目は自分で現場を見る
      if (d === 0) { await click('.tab', '自分で動く'); await click('.act', '現場を見る'); await flush(); await click('.tab', '部下に指示'); }
      for (let k = 0; k < 4; k++) {
        const a = await click('#acts .act', '聞き込み|防犯カメラ|照会|鑑定|差し押さえ|提出');
        if (!a) break;
        for (let j = 0; j < 3; j++) { await page.waitForTimeout(10); const o = await click('#overlay .pbtn', '^(?!やめる|閉じる)'); if (!o) break; }
        await click('#overlay .pbtn', 'やめる'); await flush();
        // ありえない重複
        const dup = await F.evaluate(() => { const S = G.keiji.state(), seen = {}, out = []; S.tasks.forEach(t => { if (!t.q) return; const k = t.aid + ':' + t.q.id; if (seen[k]) out.push(k); seen[k] = 1; }); return out; });
        dup.forEach(k => P('重複', '種' + seed + '：同時に二人に頼めた ' + k));
      }
      await click('#endday', '一日を終える'); await page.waitForTimeout(20); await flush();
    }
    // 記録を検査する
    const docs = await F.evaluate(() => {
      const S = G.keiji.state(), div = document.createElement('div');
      return S.docs.map(d => { div.innerHTML = typeof d.body === 'function' ? d.body(S) : d.body; const all = div.innerText || div.textContent; div.querySelectorAll('.chat').forEach(c => c.remove()); return { id: d.id, title: d.title, memo: d.kind === 'memo', at: d.at, text: div.textContent, all }; });
    });
    const T = await F.evaluate(() => { const w = G.world5; return null; });
    const toT = (m, d, h, mi) => { const DIM = { 11: 30, 12: 31, 1: 31 }; let n = 0; for (let mo = 11; mo !== m; mo = mo === 12 ? 1 : mo + 1) n += DIM[mo]; return (n + d - 1) * 1440 + (h || 0) * 60 + (mi || 0); };
    for (const d of docs) {
      if (!d.memo && INFER.test(d.text)) P('推理の書き込み', '「' + d.title + '」：…' + d.text.slice(Math.max(0, d.text.search(INFER) - 20), d.text.search(INFER) + 12) + '…');
      if (d.at != null) for (const m of d.all.matchAll(/(\d{1,2})月(\d{1,2})日(?:\s?(\d{1,2}):(\d{2}))?/g)) {
        const t = m[3] != null ? toT(+m[1], +m[2], +m[3], +m[4]) : toT(+m[1], +m[2]);
        if (t > d.at) P('時間の矛盾', '「' + d.title + '」：' + m[0] + ' は、記録を作った時点より後');
      }
    }
    const lines = await F.evaluate(() => window.__lines);
    const texts = lines.map(l => ['台詞', l[2] ? 'report' : l[0], l[1]]).concat(docs.map(d => ['記録「' + d.title + '」', '', d.all]));
    for (const [where, who, t] of texts) {
      for (const m of String(t).matchAll(/(\d{1,2})時(?!間)/g)) {
        if (+m[1] > 12) continue;
        const before = String(t).slice(Math.max(0, m.index - 8), m.index);
        if (!AMBIG_OK.test(before)) P('時刻のあいまいさ', where + '：…' + before + m[0] + '…');
      }
      if (who === 'report' && INFER.test(t)) P('部下の報告に推理', t);
    }
    // 最後に：人物の札がすべて出た状態にして、見た目を検査する（自動の捜査官が届かなかった画面も見る）
    await F.evaluate(() => { const C = G.cases.go.C, S = G.keiji.state(), at = S.day; [['inq', 'delivery'], ['inq', 'credit'], ['inq', 'kanriKaji'], ['inq', 'hosho'], ['hear', 'eigyosho'], ['seize', 'prepaid']].forEach(([a, id]) => { if (!G.keiji.doc((a === 'inq' ? 'q_' : a === 'hear' ? 'h_' : 's_') + id)) C.actions.find(x => x.id === a).done(S, { q: { id }, at, staff: 'oka' }); }); S.c.cmp.sameNo = true; S.c.cmp.envelope = true; G.keiji.refresh(); });
      await page.waitForTimeout(100);
    await layout('人物の札がそろった机');
    if (SHOTS && w === 0) {
      await shot('desk');
      const ids = docs.map(d => d.id);
      for (const id of ids) {
        await F.evaluate(id => { const d = G.keiji.doc(id); G.openPaper({ title: d.title, body: typeof d.body === 'function' ? d.body(G.keiji.state()) : d.body, buttons: [] }); }, id);
        await page.waitForTimeout(150); await shot('doc-' + id);
        await F.evaluate(() => G.closePaper());
      }
      await F.evaluate(() => document.querySelector('#p-elem') && document.querySelector('#p-elem').scrollIntoView());
      await shot('elem');
      await F.evaluate(() => document.querySelector('#people') && document.querySelector('#people').scrollIntoView());
      await shot('people');
    }
    await page.close();
  }
  await browser.close();
  const uniq = [...new Set(problems)];
  console.log('=== 第五章の自己検査 ===　世界 ' + N + '　日数 ' + DAYS);
  console.log(uniq.length ? uniq.join('\n') : '問題なし');
  process.exit(uniq.length ? 1 : 0);
})();
