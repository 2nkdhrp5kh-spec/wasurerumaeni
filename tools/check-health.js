// コードの健康診断：AIが書いたコードで増えがちなものを数え、前回の基準（tools/health-base.json）より増えたら知らせる
//   node tools/check-health.js            検査
//   node tools/check-health.js --update   いまの数を基準として保存（減らしたとき・理由があって増やしたとき）
// ・ESLint：未定義の名前・到達しないコード・重複したキーなど（エラーは常に不合格）／使われていない変数（警告の数）
// ・空の catch（エラーの握りつぶし）
// ・書き写し：同じ4行のまとまりが、別の場所にもあるか
// ・大きさ：js の行数、音声の合計
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), BASE = path.join(__dirname, 'health-base.json');
const ESL = fs.existsSync('/opt/node-tools/node_modules/.bin/eslint') ? '/opt/node-tools/node_modules/.bin/eslint' : 'npx';
const files = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => [f, fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')]);
const now = {};

// ESLint
let out = '';
try { out = execFileSync(ESL, (ESL === 'npx' ? ['eslint'] : []).concat(['-c', path.join(__dirname, 'eslint.config.js'), '-f', 'json', 'js']), { cwd: ROOT, encoding: 'utf8' }); }
catch (e) { out = e.stdout || '[]'; }
const res = JSON.parse(out || '[]');
const errs = [], warns = [];
res.forEach(r => r.messages.forEach(m => (m.severity === 2 ? errs : warns).push(path.basename(r.filePath) + ':' + m.line + ' ' + m.message)));
now.eslintWarnings = warns.length;

// 空の catch
now.emptyCatch = files.reduce((n, [f, s]) => n + (s.match(/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g) || []).length, 0);

// 書き写し（短い行・括弧だけの行は数えない）
const seen = new Map(); let dups = 0; const dupEx = [];
files.forEach(([f, s]) => {
  const L = s.split('\n').map(x => x.trim()).filter(x => x.length >= 30 && !/^[\]\)}{;,]+$/.test(x) && !/^\/\//.test(x));
  for (let i = 0; i + 4 <= L.length; i++) {
    const k = L.slice(i, i + 4).join('\n');
    if (seen.has(k) && seen.get(k) !== f + ':' + i) { dups++; if (dupEx.length < 5) dupEx.push(f + ' と ' + seen.get(k).split(':')[0] + '：' + L[i].slice(0, 50)); }
    else seen.set(k, f + ':' + i);
  }
});
now.duplicateBlocks = dups;
now.jsLines = files.reduce((n, [f, s]) => n + s.split('\n').length, 0);
const audioDir = path.join(ROOT, 'audio');
now.audioMB = fs.existsSync(audioDir) ? Math.round(fs.readdirSync(audioDir).filter(f => /\.(mp3|ogg|m4a)$/.test(f)).reduce((n, f) => n + fs.statSync(path.join(audioDir, f)).size, 0) / 1048576) : 0;

if (process.argv.includes('--update')) { fs.writeFileSync(BASE, JSON.stringify(now, null, 2) + '\n'); console.log('基準を保存した', now); process.exit(0); }
const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : {};
const problems = [];
errs.forEach(e => problems.push('ESLintのエラー　' + e));
[['eslintWarnings', '使われていない変数など（ESLintの警告）'], ['emptyCatch', '空の catch（エラーの握りつぶし）'], ['duplicateBlocks', '書き写した4行のまとまり']].forEach(([k, label]) => {
  if (base[k] != null && now[k] > base[k]) problems.push('増えた　' + label + '：' + base[k] + ' → ' + now[k] + (k === 'duplicateBlocks' ? '（例：' + dupEx.join('／') + '）' : k === 'eslintWarnings' ? '（' + warns.slice(-3).join('／') + '）' : ''));
});
console.log('=== コードの健康診断 ===　' + Object.entries(now).map(([k, v]) => k + ' ' + v).join('　'));
if (now.audioMB > 150) console.log('（注意）音声の合計が ' + now.audioMB + 'MB。配信の前に小さくする');
console.log(problems.length ? problems.join('\n') : '問題なし（基準より増えていない）');
process.exit(problems.length ? 1 : 0);
