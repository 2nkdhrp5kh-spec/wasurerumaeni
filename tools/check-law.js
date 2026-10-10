// 法律の検査：条文帳の文言を e-Gov の現行法と照らす／本文中の「◯◯法◯条」が実在するか／判例が確認済みか
//   node tools/check-law.js        （e-Gov の回答は tools/cache/law に保存し、次から使う。--fresh で取り直す）
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(__dirname, 'cache', 'law');
const FRESH = process.argv.includes('--fresh');
fs.mkdirSync(CACHE, { recursive: true });

const LAWNUM = {
  刑事訴訟法: '昭和二十三年法律第百三十一号', 刑訴法: '昭和二十三年法律第百三十一号',
  刑法: '明治四十年法律第四十五号', 日本国憲法: '昭和二十一年憲法', 憲法: '昭和二十一年憲法',
  犯罪捜査規範: '昭和三十二年国家公安委員会規則第二号', 裁判員法: '平成十六年法律第六十三号'
};
const z2h = s => s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

// 通信は curl で（この環境では、外への通信が中継を通るため）
const { execFileSync } = require('child_process');
function get(url) { return Promise.resolve(execFileSync('curl', ['-s', '--max-time', '30', url], { encoding: 'utf8' })); }
async function article(law, art) {
  const key = (law + '_' + art).replace(/[^\w一-龥]/g, '_');
  const f = path.join(CACHE, key + '.xml');
  if (!FRESH && fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const x = await get('https://laws.e-gov.go.jp/api/1/articles;lawNum=' + encodeURIComponent(LAWNUM[law]) + ';article=' + art);
  fs.writeFileSync(f, x); await new Promise(r => setTimeout(r, 150));
  return x;
}
// 条の本文：項ごとの文（号の文も含む）
function paragraphs(xml) {
  const out = {};
  for (const m of xml.matchAll(/<Paragraph Num="(\d+)"[^>]*>([\s\S]*?)<\/Paragraph>/g)) out[m[1]] = [...m[2].matchAll(/<Sentence[^>]*>([\s\S]*?)<\/Sentence>/g)].map(s => s[1].replace(/<Rt>[\s\S]*?<\/Rt>/g, '').replace(/<[^>]+>/g, '')).join('');
  return out;
}
const norm = s => z2h(String(s)).replace(/（[^（）]*略）/g, '').replace(/<br\s*\/?>/g, '').replace(/<[^>]+>/g, '').replace(/[①-⑳]/g, '').replace(/（[0-9]+）/g, '').replace(/[\s　]/g, '');

(async () => {
  global.G = {}; global.window = {};
  require(path.join(ROOT, 'js', 'law.js'));
  const problems = [], P = (k, m) => problems.push(k + '　' + m);
  let checked = 0;

  /* 1. 条文帳の文言 */
  for (const [title, text] of G.LAW) {
    const m = title.match(/^(刑事訴訟法|刑法|日本国憲法|犯罪捜査規範|裁判員法) 第(\d+)条(?:の(\d+))?/);
    if (!m) continue;
    if (/要約|要旨/.test(title)) continue;
    const art = m[2] + (m[3] ? '_' + m[3] : '');
    const xml = await article(m[1], art);
    if (!/<Code>0<\/Code>/.test(xml)) { P('条が見つからない', title); continue; }
    const official = norm(Object.values(paragraphs(xml)).join(''));
    // 抄（……で省いた所）は、残した部分がそれぞれ原文にあればよい
    // 項（①②）・改行・号（一 二）ごとに分けて、それぞれ原文にあるかを見る
    const chunks = String(text).split(/……|…|<br\s*\/?>|[①-⑳]/).map(c => norm(c).replace(/^[一二三四五六七八九十]+(?=[^一-龥]|[一-龥])/, '').replace(/^（要約）.*/, '')).filter(c => c.length >= 4);
    for (const c of chunks) {
      checked++;
      if (official.includes(c)) continue;
      // どこから食い違うかを示す
      let i = 0; const k = Math.max(0, ...[...Array(c.length).keys()].filter(j => official.includes(c.slice(0, j + 1))).map(j => j + 1)); i = k;
      P('文言が原文と違う', title + '：「…' + c.slice(Math.max(0, i - 8), i) + '【ここから】' + c.slice(i, i + 16) + '…」');
    }
  }

  /* 2. 本文中の「◯◯法◯条（◯項）」が実在するか */
  const files = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => [f, fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')]);
  const seen = new Set();
  for (const [f, src] of files) {
    for (const m of z2h(src).matchAll(/(刑事訴訟法|刑訴法|刑法|日本国憲法|憲法|犯罪捜査規範|裁判員法)[ 　]?第?(\d+)条(?:の(\d+))?(?:第?(\d+)項)?/g)) {
      const art = m[2] + (m[3] ? '_' + m[3] : ''), key = m[1] + art + '|' + (m[4] || '');
      if (seen.has(key)) continue; seen.add(key);
      const xml = await article(m[1], art);
      if (!/<Code>0<\/Code>/.test(xml) || !/<Article /.test(xml)) { P('ない条を引いている', f + '：' + m[0]); continue; }
      if (/<Article [^>]*Delete="true"/.test(xml)) P('削除された条を引いている', f + '：' + m[0]);
      if (m[4] && !paragraphs(xml)[m[4]]) P('ない項を引いている', f + '：' + m[0]);
      checked++;
    }
  }

  /* 3. 判例：docs/facts.md の判例の表で「確認済み」になっているか */
  const facts = fs.existsSync(path.join(ROOT, 'docs', 'facts.md')) ? fs.readFileSync(path.join(ROOT, 'docs', 'facts.md'), 'utf8') : '';
  const ok = new Set([...facts.matchAll(/^\|\s*✅\s*\|\s*([^|]+?)\s*\|/gm)].map(m => m[1].replace(/\s/g, '')));
  const cases = new Set();
  for (const [f, src] of files) for (const m of src.matchAll(/(最大判|最大決|最判|最決|大判|[一-龥]{1,4}(?:高判|地判|高決|地決))(昭和|平成|令和)([0-9元]+)年([0-9]+)月([0-9]+)日/g)) cases.add(m[0]);
  for (const c of cases) if (!ok.has(c)) P('判例が未確認', c + '（docs/facts.md の判例の表で確かめて ✅ を付ける）');

  console.log('=== 法律の検査 ===　照らした箇所 ' + checked + '　判例 ' + cases.size + '件');
  console.log(problems.length ? problems.join('\n') : '問題なし');
  process.exit(problems.length ? 1 : 0);
})();
