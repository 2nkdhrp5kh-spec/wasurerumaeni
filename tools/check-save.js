// セーブの検査：古い版のセーブ（tools/fixtures/save-v*.json）を新しい版で読み込み、遊べるか・中身が消えないかを確かめる
//   node tools/check-save.js
// 見本は、selftest を SAVE_OUT=tools/fixtures/save-vN.json で動かすと、実際に遊んだあとのセーブが残る。版を上げる前に一度残しておく
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), FX = path.join(__dirname, 'fixtures');
const problems = [], P = (k, m) => problems.push(k + '　' + m);

// 1. 版の番号と、直し方（MIGRATE）の抜け
const core = fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8');
const ver = +(core.match(/G\.SAVE_VERSION = (\d+)/) || [])[1];
const mig = new Set([...(core.match(/const MIGRATE = \{([\s\S]*?)\n\};/) || ['', ''])[1].matchAll(/^\s*(\d+):/gm)].map(m => +m[1]));
for (let v = 1; v < ver; v++) if (!mig.has(v)) P('直し方がない', '版' + v + '→' + (v + 1) + ' の MIGRATE がない');
const fixtures = fs.readdirSync(FX).filter(f => /^save-v\d+.*\.json$/.test(f));
const maxFx = Math.max(0, ...fixtures.map(f => +f.match(/^save-v(\d+)/)[1]));
if (maxFx < ver) P('見本が古い', '版' + ver + 'のセーブの見本がない（SAVE_OUT で残す）');

(async () => {
  const browser = await chromium.launch();
  const cases = fixtures.map(f => [f, fs.readFileSync(path.join(FX, f), 'utf8')]).concat([['壊れたセーブ', '{"runs":[{"no":1,'], ['空のセーブ', '']]);
  for (const [name, raw] of cases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.route('**/fonts.googleapis.com/**', x => x.abort());
    await page.addInitScript(raw => { window.CHOUSHO_APP = true; if (raw) localStorage.setItem('chousho.meta.v1', raw); }, raw);
    await page.goto('file://' + ROOT + '/index.html'); await page.waitForTimeout(300);
    // 注意書き・引用の暗転などを進めて、タイトルまで
    for (let i = 0; i < 60; i++) {
      const at = await page.evaluate(() => { const q = s => document.querySelector(s); if (q('#t-keiji') && !q('#curtain.on') && (!q('#overlay') || q('#overlay').hidden)) return 1; if (q('#curtain.on')) q('#curtain').click(); else { const ov = q('#overlay'); if (ov && !ov.hidden) { const b = ov.querySelector('.pbtn'); b && b.click(); } else document.body.click(); } return 0; });
      if (at) break; await page.waitForTimeout(150);
    }
    const title0 = await page.evaluate(() => !!document.querySelector('#t-keiji'));
    // タイトルの画面から、記録・記章・経歴などを開いて閉じる（画面が変わったら「戻る」で戻る）
    for (const id of ['t-rec', 't-arc', 't-diff', 't-law']) {
      const ok = await page.evaluate(id => { const b = document.getElementById(id); if (!b) return false; b.click(); return true; }, id);
      if (!ok) continue; await page.waitForTimeout(200);
      await page.evaluate(() => { const ov = document.querySelector('#overlay'); if (ov && !ov.hidden) { const b = [...ov.querySelectorAll('.pbtn')].find(x => /閉じる|戻る/.test(x.textContent)); b ? b.click() : G.closePaper(); } });
      await page.waitForTimeout(100);
      await page.evaluate(() => { if (document.querySelector('#t-keiji')) return; const b = [...document.querySelectorAll('button')].find(x => /戻る|タイトル/.test(x.textContent)); b && b.click(); });
      await page.waitForTimeout(150);
    }
    const st = await page.evaluate(() => ({ v: G.meta.v, runs: (G.meta.runs || []).length })); st.title = title0;
    errs.forEach(e => P('エラー', name + '：' + e));
    if (!st.title) P('タイトルが出ない', name);
    if (st.v !== ver) P('版が上がらない', name + '：' + st.v);
    if (/^save-v/.test(name)) { const m = JSON.parse(raw); if (st.runs !== (m.runs || []).length) P('記録が消えた', name + '：' + (m.runs || []).length + '件 → ' + st.runs + '件'); }
    await page.close();
  }
  await browser.close();
  console.log('=== セーブの検査 ===　版 ' + ver + '　見本 ' + fixtures.length);
  console.log(problems.length ? problems.join('\n') : '問題なし');
  process.exit(problems.length ? 1 : 0);
})();
