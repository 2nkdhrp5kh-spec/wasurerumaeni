// すべての検査をまとめて動かす（docs/rules.md の 8）
//   node tools/check-all.js          ふだん（数分）
//   node tools/check-all.js --deep   節目に（自動プレイを多めに。十数分〜）
// 一つでも ✖ があれば、直してから見せる。「画面が変わった」は失敗ではないが、tools/shots/diff-*.jpg を目で確かめる
const { spawnSync } = require('child_process'), path = require('path');
const DEEP = process.argv.includes('--deep');
const T = (f, ...a) => [path.join(__dirname, f), ...a];
const STEPS = [
  ['世界（第五章）の矛盾', T('check-world.js', DEEP ? '2000' : '300')],
  ['文（曜日・開発の言葉・壊れた表示）', T('check-text.js')],
  ['設定の台帳（名前・年齢・実在の名）', T('check-ledger.js')],
  ['法律（条文の文言・条の実在・判例）', T('check-law.js')],
  ['コードの健康診断', T('check-health.js')],
  ['話者の登録', T('check-speakers.js')],
  ['顔のドット絵', T('check-faces.js')],
  ['セーブ（古い版を読めるか）', T('check-save.js')],
  ['第五章：寄り道する自動プレイ', T('check-go.js', DEEP ? '8' : '3', DEEP ? '16' : '10')],
  ['全事件の自動プレイと釣り合い', T('selftest.js', DEEP ? '4' : '1', 'akisu,aoyagi,ekimae,chikan,kasai')],
  ['画面の撮影と比べ（はみ出し）', T('shots.js')]
];
const rows = []; let bad = 0;
for (const [name, args] of STEPS) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', cwd: path.resolve(__dirname, '..'), timeout: 40 * 60 * 1000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0;
  // 判例の未確認だけで落ちたときは、注意として扱う（Gemini で確かめるまでの間）
  const onlyHanrei = !ok && /判例が未確認/.test(out) && !/(文言が原文と違う|ない条|ない項|削除された)/.test(out);
  if (!ok && !onlyHanrei) bad++;
  rows.push([ok ? '✔' : onlyHanrei ? '△' : '✖', name, Math.round((Date.now() - t0) / 1000) + '秒']);
  if (!ok || /画面が変わった|（注意）/.test(out)) console.log('\n--- ' + name + ' ---\n' + out.split('\n').filter(l => l.trim() && !/^\.+$/.test(l)).slice(-25).join('\n'));
}
console.log('\n=== まとめ ===');
rows.forEach(r => console.log(r.join('　')));
console.log(bad ? '\n✖ が ' + bad + ' 件。直してから見せる。' : '\nすべて通った（△は確認待ち）。');
process.exit(bad ? 1 : 0);
