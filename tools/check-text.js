// 文の検査（docs/rules.md の 2・3）：コードの中の文字列を読んで調べる
//   node tools/check-text.js
// ・曜日：同じファイルの「M月D日（曜）」が、どれか一つの年の暦とそろうか
// ・開発の言葉：プレイヤーに見える文に、作る側の言葉が出ていないか（コメントと dev.js は見ない）
// ・壊れた表示：'undefined' 'NaN' '[object' が文の中にないか
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DEV = /世界から計算|筋書きを持たない|world5|TODO|FIXME|XXX|ダミー|lorem/i;
const BROKEN = /undefined|NaN|\[object /;
const WD = '日月火水木金土';
const problems = [], P = (k, m) => problems.push(k + '　' + m);
for (const f of fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && f !== 'dev.js')) {
  const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/ \/\/ .*$/gm, '');
  // 文字列リテラル（'…' と `…`）だけを見る
  const strs = [...src.matchAll(/'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)].map(m => m[1] || m[2] || '').filter(s => /[ぁ-んァ-ン一-龥]/.test(s));
  strs.forEach(s => { if (DEV.test(s)) P('開発の言葉', f + '：「' + s.slice(0, 50) + '」'); if (BROKEN.test(s)) P('壊れた表示', f + '：「' + s.slice(0, 50) + '」'); });
  // 曜日
  const pairs = [...strs.join('\n').matchAll(/([0-9]{1,2})月([0-9]{1,2})日[（(]([日月火水木金土])(?:曜日?)?[）)]/g)].map(m => [+m[1], +m[2], WD.indexOf(m[3])]);
  if (pairs.length) {
    let ok = false;
    for (let y = 2015; y <= 2035 && !ok; y++) {
      // 秋冬（9〜12月）が y 年、それ以外は y+1 年とみる（年をまたぐ事件のため）。全部 y 年も試す
      for (const wrap of [true, false]) if (pairs.every(([m, d, w]) => new Date((wrap && m < 9 ? y + 1 : y), m - 1, d).getDay() === w)) ok = true;
    }
    if (!ok) P('曜日がそろわない', f + '：' + pairs.map(([m, d, w]) => m + '/' + d + '(' + WD[w] + ')').join(' '));
  }
}
console.log('=== 文の検査 ===');
console.log(problems.length ? [...new Set(problems)].join('\n') : '問題なし');
process.exit(problems.length ? 1 : 0);
