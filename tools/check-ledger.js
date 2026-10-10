// 設定の台帳の検査：docs/ledger.json と、ゲームの文の食い違いを探す
//   node tools/check-ledger.js
// ・人物の年齢：「名前（N歳）」が台帳の年齢（＋前にある「◯年後」）と合うか
// ・名前の書き違い：姓が同じで、名が台帳と違う書き方
// ・第五章の人物の名前が、ほかの人物と漢字を共有していないか（G.CHAR の名前も含む）
// ・実在の会社・団体の名前を使っていないか
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'ledger.json'), 'utf8'));
const files = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => [f, fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')]);
const problems = [], P = (k, m) => problems.push(k + '　' + m);
const KN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
// 姓の長さ：台帳の名前の先頭の、二字または一字（梶・辻・榊は一字）
const fam = p => p.fam || (/^(梶|辻|榊|岡)/.test(p.name) ? p.name[0] : p.name.slice(0, 2));
for (const p of L.people) {
  const f = fam(p), given = p.name.slice(f.length);
  for (const [file, s] of files) {
    for (const m of s.matchAll(new RegExp(f + '[　 ]?([一-龥]{1,3})?(?:（[ぁ-ん　 ]+[、・）])?(?:（|、|・)?(当時)?([0-9]+)歳', 'g'))) {
      if (m[1] && m[1] !== given && !given.startsWith(m[1]) && !L.people.some(q => q.name === f + m[1])) P('名前の書き違い', file + '：' + m[0] + '（台帳：' + p.name + '）');
      if (p.age == null || (m[1] && m[1] !== given && !given.startsWith(m[1]))) continue;   // 名が違う＝別人
      const before = s.slice(Math.max(0, m.index - 500), m.index);
      const yy = [...before.matchAll(/([0-9]+|[一二三四五六七八九十])年後/g)].pop();
      const plus = yy && !m[2] ? (+yy[1] || KN[yy[1]] || 0) : 0;   // 「当時」は事件のときの年齢
      const want = p.age + plus;
      if (+m[3] !== want) P('年齢の食い違い', file + '：' + m[0] + '（台帳：' + p.age + '歳' + (plus ? '＋' + plus + '年後＝' + want + '歳' : '') + '）');
    }
    // 名だけ違う書き方（例：樋口和哉）
    if (given.length >= 2) for (const m of s.matchAll(new RegExp(f + '[　 ]?([一-龥]{2})(?=[（、。」\'　 ]|$)', 'g'))) {
      if (m[1] !== given && !L.people.some(q => q.name === f + m[1]) && /[一-龥]{2}/.test(m[1]) && !/^(さん|の|は|が)/.test(m[1]) && given[0] === m[1][0]) P('名前の書き違い', file + '：' + m[0] + '（台帳：' + p.name + '）');
    }
  }
}
// 第五章の名前の漢字の重なり
global.window = {}; global.document = { querySelector: () => null }; global.localStorage = { getItem: () => null, setItem: () => {} };
try { eval(fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8')); } catch (e) {}
const others = L.people.filter(p => !p.ch5).map(p => p.name).concat(Object.values((window.G && window.G.CHAR) || {}).map(c => c.name || ''));
const CONTROL = /[課長教授当時検事店員主任妻娘人客駅乗隣消防火災調査裁判弁護科捜研・あ-んア-ン]/g;
for (const p of L.people.filter(p => p.ch5)) for (const ch of p.name) {
  const hit = others.filter(o => o.replace(CONTROL, '').includes(ch));
  if (hit.length) P('名前の漢字の重なり', p.name + 'の「' + ch + '」が、' + hit.join('・') + ' と重なる');
}
// 実在の名
for (const [file, s] of files) for (const w of L.realBlock) if (s.includes(w)) P('実在の名', file + '：「' + w + '」');
console.log('=== 台帳の検査 ===　人物 ' + L.people.length);
console.log(problems.length ? [...new Set(problems)].join('\n') : '問題なし');
process.exit(problems.length ? 1 : 0);
