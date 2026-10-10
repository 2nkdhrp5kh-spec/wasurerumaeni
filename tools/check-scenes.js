// 描画の検査：背景 × 人物のすべての組み合わせを描き、見た目の不自然さを数値で調べる
//   node tools/check-scenes.js [出力先ディレクトリ]
// 調べること
//   ・人物の体の下端が、手前の層（机など）に隠れているか（胴体が途中で切れて宙に浮いて見えないか）
//   ・人物の頭が画面の上で切れていないか
//   ・刑事部屋を歩く人影の頭が、天井より下にあるか（1分間の動きを0.5秒ごとに）
//   ・壁の時計が、奥の壁の上半分にあるか
// あわせて、人の目で確かめるための一覧画像（contact.png）を書き出す
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const path = require('path'), fs = require('fs');
const OUT = process.argv[2] || path.resolve(__dirname, 'out');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.route('**/fonts.googleapis.com/**', x => x.abort());
  await p.addInitScript(() => { window.CHOUSHO_APP = true; });
  await p.addInitScript(() => localStorage.setItem('chousho.meta.v1', JSON.stringify({ seenQuote: true, seenWarning3: true, runs: [] })));
  await p.goto(URL); await p.waitForTimeout(400);
  const res = await p.evaluate(() => {
    const D = G.portraits.debug, { W, H, TALL, PLACE, CLOCKS } = D, issues = [];
    const BGS = ['office', 'kacho', 'interro', 'soudan', 'pros', 'shop', 'home', 'chambers', 'street', 'court'];
    const people = Object.keys(G.portraits.PEOPLE);
    const alphaAt = (cv, x, y) => { if (!cv || x < 0 || y < 0 || x >= cv.width || y >= cv.height) return 0; return cv.getContext('2d').getImageData(x, y, 1, 1).data[3]; };
    for (const bg of BGS) {
      const fg = D.fgCanvas(bg), tall = TALL[bg] != null, py = tall ? TALL[bg] : (PLACE[bg] ?? 41), px = 88;
      for (const who of people) {
        const s = G.portraits.sprite(who, 0, { tall });
        const d = s.getContext('2d').getImageData(0, 0, s.width, s.height).data;
        // いちばん下の不透明な行と、その行で人物がいる列
        let yb = -1; for (let y = s.height - 1; y >= 0 && yb < 0; y--) for (let x = 0; x < s.width; x++) if (d[(y * s.width + x) * 4 + 3]) { yb = y; break; }
        let yt = -1; for (let y = 0; y < s.height && yt < 0; y++) for (let x = 0; x < s.width; x++) if (d[(y * s.width + x) * 4 + 3]) { yt = y; break; }
        if (yb < 0) continue;
        const bottom = py + yb;   // 画面上の、人物の下端（論理座標）
        if (bottom < H - 1) {
          // 下端の行の真下が、手前の層で隠れているか
          let open = 0, cols = 0;
          for (let x = 0; x < s.width; x++) if (d[(yb * s.width + x) * 4 + 3]) { cols++; if (alphaAt(fg, px + x, bottom + 1) < 200) open++; }
          if (open > cols * .2) issues.push({ kind: '胴体が宙に浮く', bg, who, detail: '体の下端 y=' + bottom + '、その下が隠れていない列 ' + open + '/' + cols });
        }
        if (py + yt < 0) issues.push({ kind: '頭が画面の上で切れる', bg, who, detail: 'y=' + (py + yt) });
      }
    }
    // 刑事部屋を歩く人影：頭が天井より下か
    let worst = 99;
    for (let t = 0; t < 60; t += .5) D.ambientFigures(t).forEach(f => { worst = Math.min(worst, f.head - f.ceil); });
    if (worst < 3) issues.push({ kind: '人影が天井に近すぎる', bg: 'office', who: '人影', detail: '頭と天井のすき間の最小 ' + worst.toFixed(1) + 'px（3px以上が目安）' });
    // 時計：奥の壁の上半分
    const clocks = Object.entries(CLOCKS).map(([bg, c]) => ({ bg, y: c[1], size: c[2] }));
    return { issues, worstGap: worst, clocks, people: people.length };
  });
  // 一覧画像：背景ごとに、代表の人物を並べる
  const sample = ['shirai', 'todo', 'kuzumi', 'aoyagi'];
  const bgs = ['office', 'kacho', 'interro', 'soudan', 'pros', 'shop', 'home', 'chambers', 'street', 'court'];
  await p.setContent('<html><body style="margin:0;background:#111"><div id="g" style="display:grid;grid-template-columns:repeat(4,320px);gap:4px"></div></body></html>');
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(({ sample, bgs }) => {
    document.body.innerHTML = '<div id="g" style="display:grid;grid-template-columns:repeat(4,320px);gap:4px;background:#111;padding:4px"></div>';
    const g = document.getElementById('g');
    for (const bg of bgs) for (const who of sample) {
      const wrap = document.createElement('div'); wrap.style.cssText = 'color:#ccc;font:11px sans-serif';
      const cv = document.createElement('canvas'); cv.width = 480; cv.height = 210; cv.style.width = '320px';
      wrap.appendChild(cv); wrap.appendChild(document.createTextNode(bg + ' / ' + who)); g.appendChild(wrap);
      G.portraits.scene(cv, { bg, who: bg === 'kacho' ? 'todo' : who });
    }
  }, { sample, bgs });
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(OUT, 'contact.png'), fullPage: true });
  await b.close();
  console.log('=== 描画の検査 ===');
  console.log('人物', res.people, '人 × 背景 10 種');
  console.log('人影と天井のすき間（最小）', res.worstGap.toFixed(1) + 'px');
  console.log('問題', res.issues.length);
  const by = {}; res.issues.forEach(i => { const k = i.kind + '：' + i.bg; (by[k] = by[k] || []).push(i.who + (i.detail ? '（' + i.detail + '）' : '')); });
  Object.entries(by).forEach(([k, v]) => console.log('  ✗ ' + k + '  ' + v.length + '人  例：' + v.slice(0, 2).join(' / ')));
  console.log('一覧画像', path.join(OUT, 'contact.png'));
  process.exit(res.issues.length ? 1 : 0);
})();
