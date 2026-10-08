// 台詞の話者IDが G.CHAR に登録されているかを調べる（node tools/check-speakers.js）
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'js');
global.window = {}; global.document = { querySelector: () => null }; global.localStorage = { getItem: () => null, setItem: () => {} };
eval(fs.readFileSync(path.join(dir, 'core.js'), 'utf8'));
const ids = new Set(Object.keys(window.G.CHAR));
const dataKeys = /^(n|p|A|B|C|D|E|G|I|qa|story|naguru|osu|tape|safe|light|kandori|scene|claim)$/;
let bad = 0;
for (const f of fs.readdirSync(dir).filter(f => /^case-|ending|trial/.test(f))) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const m of s.matchAll(/\[\s*'([a-zA-Z0-9]+)',\s*'/g)) if (!ids.has(m[1]) && !dataKeys.test(m[1])) { console.log(f + ': 未登録の話者 ' + m[1]); bad++; }
}
console.log(bad ? bad + '件' : '問題なし');
