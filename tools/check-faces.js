// 顔のドット絵の検査：node tools/check-faces.js
// ・透けた穴（左右と上下を塗られた画素にはさまれた空白）
// ・顔の端から離れた耳、頭から浮いた髪（どこにもつながらない画素の塊）
const fs = require('fs'), vm = require('vm');
const G = { anim: {}, rnd: Math.random };
const ctx = { G, window: { addEventListener() {} }, document: { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => {} }) }) }, setInterval() {}, performance, console, Math };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../js/portraits.js', 'utf8'), ctx);
const P = G.portraits; let bad = 0;
for (const id of Object.keys(P.PEOPLE)) for (const st of [0, 1, 2, 3]) for (const v of [{}, { blink: 1 }, { mouthOpen: 1 }]) {
  const d = P.PEOPLE[id](st); P.face.holes = 0;
  const g = P.face(Object.assign({}, d.o, v));
  if (P.face.holes) { console.log(id, st, JSON.stringify(v), '穴', P.face.holes, '（自動で埋めた）'); bad++; }
  // 横のすき間：頭の高さ（7〜44行）で、左右と上を塗られた空白があれば、髪と顔の間が透けている（とがった髪の先のすき間は除く）
  let gaps = 0; for (let y = 7; y <= 44; y++) { const row = g[y]; let l = row.findIndex(c => c), r = row.length - 1 - [...row].reverse().findIndex(c => c); for (let x = l + 1; x < r; x++) if (!row[x] && g.slice(0, y).some(rr => rr[x])) gaps++; }
  if (gaps) { console.log(id, st, JSON.stringify(v), '横のすき間', gaps); bad++; }
  // つながりの検査：塗られた画素が一つの塊になっているか
  const N = g.length, seen = g.map(r => r.map(() => false)); let parts = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (g[y][x] && !seen[y][x]) {
    parts++; const q = [[x, y]]; seen[y][x] = true;
    while (q.length) { const [a, b] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = a + dx, Y = b + dy; if (X >= 0 && Y >= 0 && X < N && Y < N && g[Y][X] && !seen[Y][X]) { seen[Y][X] = true; q.push([X, Y]); } } }
  }
  if (parts > 1) { console.log(id, st, JSON.stringify(v), '離れた塊', parts - 1); bad++; }
}
console.log(bad ? '要確認 ' + bad + '件' : '問題なし');
