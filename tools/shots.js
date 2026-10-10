// 画面の撮影と比べ：主な画面をスマホの幅で撮り、前回の基準（tools/shots-base）と比べて、変わった画面を知らせる
//   node tools/shots.js            撮って比べる（変わった画面は tools/shots/diff-*.png に、左右に並べて保存）
//   node tools/shots.js --update   いまの画面を基準にする
// どの画面でも、見た目の検査（はみ出し）もする。アプリの中で開いたときの上の帯も、まねて重ねる
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'shots'), BASE = path.join(__dirname, 'shots-base');
const UPDATE = process.argv.includes('--update');
const layoutSrc = '(' + require('./lib/layout.js').toString() + ')()';
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(BASE, { recursive: true });
const problems = [], P = (k, m) => problems.push(k + '　' + m);

// 撮る画面：[名前, ページの中で動かす準備]
const SCREENS = [
  ['title', null],
  ['law', "document.getElementById('t-law').click()"],
  ...['akisu', 'aoyagi', 'ekimae', 'chikan', 'kasai', 'go'].map(id => ['case-' + id, "G.lawMode='keiji';G.inMode=true;G.meta.prologueDone=true;G.cases['" + id + "'].run(" + (id === 'go' ? '7' : '') + ")"]),
  ['hanji-duty', "G.inMode=true;G.hanji.duty(false)"]
];

(async () => {
  const browser = await chromium.launch();
  for (const [name, prep] of SCREENS) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.route('**/fonts.googleapis.com/**', x => x.abort());
    await page.addInitScript(() => {
      window.CHOUSHO_APP = true; Math.random = (() => { let a = 7; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();   // 毎回同じ画面になるように
      const st = window.setTimeout; window.setTimeout = (f, t, ...a) => st(f, Math.min(t || 0, 3), ...a);
      localStorage.setItem('chousho.meta.v1', JSON.stringify({ v: 2, seenQuote: true, seenWarning3: true, prologueDone: true, runs: [], diff: 'normal', diffChosen: true }));
    });
    await page.goto('file://' + ROOT + '/index.html'); await page.waitForTimeout(400);
    if (prep) {
      await page.evaluate('(() => { ' + prep + '; })(), 0');   // 走らせるだけで、終わりを待たない
      // 暗転と台詞を進めて、机の画面まで
      for (let i = 0; i < 300; i++) {
        const r = await page.evaluate(() => { const q = s => document.querySelector(s); if (q('#curtain.on')) { q('#curtain').click(); return 1; } if (q('.coach .ch-n')) { q('.coach .ch-n').click(); return 1; } if (G.ui && G.ui.talking) { q('#dlg').click(); return 1; } return 0; });
        if (!r) { await page.waitForTimeout(80); const again = await page.evaluate(() => !!document.querySelector('#curtain.on') || !!document.querySelector('.coach .ch-n') || (G.ui && G.ui.talking)); if (!again) break; }
        await page.waitForTimeout(5);
      }
    }
    await page.waitForTimeout(200);
    const shotsOf = [[name, null]];
    // 事件の画面では、最初の記録を開いた画面も撮る
    if (/^case-/.test(name)) shotsOf.push([name + '-doc', "(() => { const b = document.querySelector('#docs .doc'); b && b.click(); })()"]);
    for (const [nm, act] of shotsOf) {
      if (act) { await page.evaluate(act); await page.waitForTimeout(300); }
      (await page.evaluate(layoutSrc)).forEach(b => P('見た目', nm + '：' + b));
      const file = path.join(UPDATE ? BASE : OUT, nm + '.jpg');
      await page.screenshot({ path: file, type: 'jpeg', quality: 70, fullPage: true });
      if (UPDATE) continue;
      const base = path.join(BASE, nm + '.jpg');
      if (!fs.existsSync(base)) { P('基準がない', nm + '（--update で作る）'); continue; }
      // ブラウザの中で、二枚の画像を画素ごとに比べる
      const cmp = await browser.newPage();
      const diff = await cmp.evaluate(async ([a, b]) => {
        const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
        const [A, B] = await Promise.all([load(a), load(b)]);
        const w = Math.max(A.width, B.width), h = Math.max(A.height, B.height);
        const c = document.createElement('canvas'); c.width = w * 2; c.height = h; const x = c.getContext('2d');
        x.fillStyle = '#f0f'; x.fillRect(0, 0, w * 2, h); x.drawImage(A, 0, 0); x.drawImage(B, w, 0);
        const da = x.getImageData(0, 0, w, h).data, db = x.getImageData(w, 0, w, h).data;
        let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 60) n++;
        return { ratio: n / (w * h), png: c.toDataURL('image/jpeg', .7) };
      }, ['data:image/jpeg;base64,' + fs.readFileSync(base).toString('base64'), 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64')]);
      await cmp.close();
      if (diff.ratio > 0.002) { fs.writeFileSync(path.join(OUT, 'diff-' + nm + '.jpg'), Buffer.from(diff.png.split(',')[1], 'base64')); P('画面が変わった', nm + '（' + (diff.ratio * 100).toFixed(1) + '%。左が前、右が今：tools/shots/diff-' + nm + '.jpg）'); }
    }
    errs.forEach(e => P('エラー', name + '：' + e));
    await page.close();
  }
  await browser.close();
  console.log('=== 画面の撮影 ===　' + (UPDATE ? '基準を更新した' : '基準と比べた') + '（' + SCREENS.length + '画面）');
  console.log(problems.length ? problems.join('\n') : '問題なし（変わった画面はない）');
  // 画面が変わったこと自体は失敗ではない（意図した変更か、目で確かめる）。はみ出し・エラーだけを失敗とする
  process.exit(problems.some(p => /^(見た目|エラー)/.test(p)) ? 1 : 0);
})();
