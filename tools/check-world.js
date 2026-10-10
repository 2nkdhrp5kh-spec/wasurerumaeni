// 第五章の「世界」の検査：世界をたくさん作り、矛盾がないかを確かめる
//   node tools/check-world.js [作る数=500]
const W5 = require('../js/world5.js');
const N = +(process.argv[2] || 500);
let bad = 0; const kinds = {};
const stat = { parkingCam: 0, atmPlaces: {} };
for (let s = 1; s <= N; s++) {
  const W = W5.make(s), errs = W5.check(W);
  if (errs.length) { bad++; errs.forEach(e => { const k = e.split('：')[0] + '：' + e.split('：')[1].split(' ')[0]; kinds[k] = (kinds[k] || 0) + 1; }); if (bad <= 3) console.log('種 ' + s + '\n  ' + errs.join('\n  ')); }
  if (W.byId('camParking1')) stat.parkingCam++;
  const a = W.byId('atm1').place; stat.atmPlaces[a] = (stat.atmPlaces[a] || 0) + 1;
}
console.log('=== 世界の検査 ===');
console.log('作った世界', N, '／矛盾のあった世界', bad);
Object.entries(kinds).forEach(([k, v]) => console.log('  ✗ ' + k + '  ' + v + '件'));
console.log('駐車場のカメラに辻の後ろ姿が映る世界', stat.parkingCam, '／ATMの場所', JSON.stringify(stat.atmPlaces));
const W = W5.make(1);
console.log('\n例（種1）：一件目の訪問 ' + W.fmt(W.case1.visit) + '、二件目の訪問 ' + W.fmt(W.case2.visit) + '、三件目の予定 ' + W.fmt(W.case3.visit));
process.exit(bad ? 1 : 0);
