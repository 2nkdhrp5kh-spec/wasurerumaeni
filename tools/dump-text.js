// ゲームの文をまとめて書き出す（Gemini などに「初見の読み手」として読ませるため）
//   node tools/dump-text.js   → tools/out/all-text.md
// コードの中の日本語の文字列を、ファイル（事件）ごとに並べる。台詞は「話者：文」の形で出す
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const ORDER = ['main.js', 'case-akisu.js', 'case-aoyagi.js', 'case-ekimae.js', 'case-chikan.js', 'case-kasai.js', 'case-go.js', 'world5.js', 'case-kit.js', 'keiji.js', 'trial.js', 'ending.js', 'career.js', 'hanji.js', 'hanji-gen.js', 'guide.js', 'law.js', 'core.js'];
let md = '# 「調書」（仮題）ゲームの文の書き出し\n\nコードの中の、プレイヤーに見える日本語の文を、ファイルごとに並べたもの。`話者：` が付いているのは台詞。HTMLのタグは除いた。\n';
for (const f of ORDER.filter(f => fs.existsSync(path.join(ROOT, 'js', f)))) {
  const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const out = [];
  for (const m of src.matchAll(/\[\s*'([a-zA-Z0-9]*)',\s*'((?:[^'\\\n]|\\.)*)'|'((?:[^'\\\n]|\\.)*)'/g)) {
    const s = (m[2] != null ? m[2] : m[3]).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\\n/g, ' ').trim();
    if (!/[ぁ-んァ-ン一-龥]{2,}/.test(s) || s.length < 4) continue;
    out.push(m[2] != null ? (m[1] || '地の文') + '：' + s : s);
  }
  md += '\n## ' + f + '\n\n' + [...new Set(out)].map(x => '- ' + x).join('\n') + '\n';
}
fs.writeFileSync(path.join(OUT, 'all-text.md'), md);
console.log('書き出した：tools/out/all-text.md（' + Math.round(md.length / 1000) + '千字）');
