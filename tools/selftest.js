// 自動テスト：ブラウザで実際にゲームを動かし、問題を数える
//   node tools/selftest.js [1事件あたりの回数=4] [事件id,...]
// 調べること
//   ・ページのエラー、話者と表示人物の不一致（G.audit）
//   ・進行が止まる（同じ画面が続く）
//   ・照らし合わせの組（C.pick）：両方の記録がそろったとき、下線の正規表現が実際の記載に当たるか、compare が結果を返すか
//   ・「並べて読む」の光が、並べ終えたあとも残っていないか
//   ・事件の終わりまで進むか
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const path = require('path');
const RUNS = +(process.argv[2] || 4);
const CASES = (process.argv[3] || 'akisu,aoyagi,ekimae,chikan,kasai').split(',');
const LABEL = { aoyagi: '青柳', ekimae: '北見坂駅前', chikan: '7時16分', kasai: '本町三丁目' };
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  const browser = await chromium.launch();
  const report = { runs: 0, ended: 0, errors: [], audit: new Set(), stalls: [], pairs: {}, hlStuck: 0, outcomes: [] };
  for (const cid of CASES) for (let r = 0; r < RUNS; r++) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message + ' @' + ((e.stack || '').split('\n')[1] || '').trim()));
    await page.route('**/fonts.googleapis.com/**', x => x.abort());
    await page.addInitScript(({ pro }) => {
      window.CHOUSHO_APP = true;   // 起動時の「画面を押して、はじめる」を出さない
      const st = window.setTimeout; window.setTimeout = (f, t, ...a) => st(f, Math.min(t || 0, 3), ...a);
      const si = window.setInterval; window.setInterval = (f, t, ...a) => si(f, Math.min(t || 0, 5), ...a);
      localStorage.setItem('chousho.meta.v1', JSON.stringify({ seenQuote: true, seenWarning3: true, prologueDone: !pro, runs: [], diff: ['easy', 'normal', 'hard'][Math.floor(Math.random() * 3)] }));
    }, { pro: cid === 'akisu' });
    await page.goto(URL);
    const thorough = r % 2 === 0;   // 偶数回：手を尽くす捜査官（違法な手段・早い打ち切りをしない）
    await page.evaluate(t => { window.__thorough = t; }, thorough);
    let steps = 0, ended = false, last = '', same = 0; const log = [];
    while (steps++ < 9000) {
      const st = await page.evaluate(({ cid, label }) => {
        const q = s => document.querySelector(s);
        if (q('#r-t') && !q('#curtain.on')) return 'end';
        if (q('.coach .ch-n')) { q('.coach .ch-n').click(); return 'coach'; }
        if (q('#curtain.on')) { q('#curtain').click(); return 'c'; }
        const ov = q('#overlay');
        if (ov && !ov.hidden) {
          // 照らし合わせの画面：候補の下線から一つずつ選んで記録する
          if (q('.cmpv')) {
            const ps = [...document.querySelectorAll('.cmpp .paper')].map(p => { const c = [...p.querySelectorAll('.u.cand')]; const all = [...p.querySelectorAll('.u')]; const pool = c.length && Math.random() < .8 ? c : all; return pool[Math.floor(Math.random() * pool.length)]; });
            if (ps[0] && ps[1]) { ps[0].click(); ps[1].click(); }
            if (Math.random() < .7 && !q('#cmpgo').disabled) { q('#cmpgo').click(); return 'cmp'; }
            q('#cmpx').click(); return 'cmpx';
          }
          const bs = [...ov.querySelectorAll('.pbtn:not(:disabled)')].filter(b => !/タイトルに戻る|やめてタイトル/.test(b.textContent));
          if (!bs.length) return 'wait';
          const seq = [/^事件を選ぶ/, /^本章から/, new RegExp('^' + label)];
          for (const re of seq) { const b = bs.find(x => re.test(x.textContent)); if (b) { b.click(); return 'seq'; } }
          if (window.__thorough) {
            const good = [/^住居侵入・強盗刑法/, /^傷害致死/, /^現住建造物等放火/, /^迷惑行為防止条例/, /^逮捕しない/, /^黙秘権を告げる/, /^すぐに会わせる/, /^余罪には触れない/, /^断る/, /^証拠を示して/, /^私人による現行犯逮捕/, /^休憩を入れて/, /^弁解を聴く/, /^言い分を聴く/, /^8枚の写真/, /^「示した写真は1枚」/, /^送る$/, /^まだ続ける/, /^一問一答/, /^自分にやらせて/];
            for (const re of good) { const b = bs.find(x => re.test(x.textContent)); if (b) { b.click(); return 'p:good'; } }
          }
          const pref = bs.filter(b => !/閉じる|やめる|やめておく|条文帳を開く/.test(b.textContent) && !(window.__thorough && /告げずに|夜まで|怒鳴り|認めれば|指紋が出た|明日の午後|中心に聴く|指示に従う|任せる|帰ってくる前|連れて行き、部屋を捜す|その場で中身|押さえて採取|改めて現行犯|緊急逮捕に切り替/.test(b.textContent)));
          const b = pref.length && Math.random() < .85 ? pref[Math.floor(Math.random() * pref.length)] : bs[Math.floor(Math.random() * bs.length)];
          b.click(); return 'p:' + b.textContent.slice(0, 16);
        }
        if (G.ui.talking) { q('#dlg').click(); return 'd'; }
        if (q('#t-keiji')) { q('#t-keiji').click(); return 'title'; }
        const pc = [...document.querySelectorAll('.pc-b')];
        window.__tried = window.__tried || {};
        if (pc.length && window.__thorough) {
          // 札の◯と×を数え、疑わしい点が多いほうを追う（主要な裏付けがそろってから）
          const S = G.keiji.state(), has = id => !!G.keiji.doc(id);
          if (!S.c.target && (has('camera3') && has('miyaNeighbors') || S.day >= 13)) {
            const score = card => [...card.querySelectorAll('.pf-y .pf-s')].reduce((n, e) => n + e.textContent.length, 0) - [...card.querySelectorAll('.pf-n .pf-s')].reduce((n, e) => n + e.textContent.length, 0) * 1.2;
            const cards = [...document.querySelectorAll('.pcard')].filter(c => c.querySelector('.pc-b')).sort((a, b) => score(b) - score(a));
            if (cards[0]) { cards[0].querySelector('.pc-b').click(); return 'pc'; }
          }
        } else if (pc.length && Math.random() < .3) { pc[Math.floor(Math.random() * pc.length)].click(); return 'pc'; }
        // 光っている記録や、まだ読んでいない記録を開く
        const docs = [...document.querySelectorAll('#docs .doc')];
        const hl = docs.filter(d => d.classList.contains('hl'));
        if (hl.length && Math.random() < (window.__thorough ? .15 : .5)) { hl[0].click(); return 'doc:hl'; }
        if (docs.length > 1 && Math.random() < (window.__thorough ? .04 : .12)) { docs[Math.floor(Math.random() * docs.length)].click(); return 'doc'; }
        if (Math.random() < .3) { const t = document.querySelectorAll('.tab'); if (t.length) t[Math.floor(Math.random() * t.length)].click(); }
        let acts = [...document.querySelectorAll('#acts .act:not(:disabled)')];
        if (window.__thorough) acts = acts.filter(a => !/釈放を進言|在宅|切り上げ|管理人に部屋|賭博の容疑|現場に連れて|もう一度話を聴く.*久住さんはどうか|写真を1枚/.test(a.textContent));
        const sd = q('#send'); if (sd && Math.random() < .5) { sd.click(); return 'send'; }
        const sk = q('#skip'); if (sk && Math.random() < (window.__thorough ? .05 : .2)) { sk.click(); return 'skip'; }
        const ed = q('#endday'); if (ed && (Math.random() < .2 || !acts.length)) { ed.click(); return 'endday'; }
        if (!acts.length) return 'none';
        // まだ試していない行動を優先する（記録を多くそろえ、照らし合わせの組を検査できるように）
        window.__tried = window.__tried || {};
        if (window.__thorough) {
          // 手を尽くす：手の空いた部下がいれば、まず部下に新しい仕事を。次に自分の行動（同じ日に同じ行動は一度だけ試す）
          const S = G.keiji.state(), day = S.day; window.__today = window.__today || {};
          const freeStaff = G.keiji.freeStaff().length;
          const tab = G.ui.tab;
          if (freeStaff && tab !== 'staff' && window.__staffDay !== day) { window.__staffDay = day; q('.tab[data-t=staff]').click(); return 'tab'; }
          if (tab === 'staff') {
            const fr = acts.filter(x => !window.__tried[x.querySelector('.l').textContent]);
            if (freeStaff && fr.length) { const a = fr[0]; window.__tried[a.querySelector('.l').textContent] = 1; a.click(); return 'a:' + a.textContent.slice(0, 16); }
            window.__staffDay = day;
            if (!S.selfUsed) { q('.tab[data-t=self]').click(); return 'tab'; }
            q('#endday').click(); return 'endday';
          }
          const notToday = acts.filter(x => window.__today[x.querySelector('.l').textContent] !== day);
          const lab = x => x.querySelector('.l').textContent;
          const order = [...notToday.filter(x => /逮捕状の請求|を逮捕する|金庫を捜す/.test(lab(x))), ...notToday.filter(x => !window.__tried[lab(x)]), ...notToday.filter(x => x.classList.contains('primary')), ...notToday];
          if (order.length && !S.selfUsed) { const a = order[0]; const l = a.querySelector('.l').textContent; window.__today[l] = day; window.__tried[l] = 1; a.click(); return 'a:' + l.slice(0, 16); }
          q('#endday').click(); return 'endday';
        }
        const prim = acts.filter(x => x.classList.contains('primary'));
        if (window.__thorough && prim.length && Math.random() < .7) { const a = prim[Math.floor(Math.random() * prim.length)]; a.click(); return 'a:' + a.querySelector('.l').textContent.slice(0, 16); }
        const fresh = acts.filter(x => !window.__tried[x.querySelector('.l').textContent]);
        const a = (fresh.length && Math.random() < .8 ? fresh : acts)[Math.floor(Math.random() * (fresh.length && Math.random() < .8 ? fresh : acts).length)] || acts[0];
        window.__tried[a.querySelector('.l').textContent] = 1; a.click(); return 'a:' + a.querySelector('.l').textContent.slice(0, 16);
      }, { cid, label: LABEL[cid] || '' });
      // 「並べて読む」の光が、並べ終えた組に残っていないか
      if (st === 'cmp' || st.startsWith('doc') || steps % 50 === 0) {
        const stuck = await page.evaluate(() => { const S = G.keiji.state && G.keiji.state(); const ov = document.querySelector('#overlay'); if (G.ui.talking || G.ui.busy || (ov && !ov.hidden)) return false; return !!(S && S.hl && (S.compared || {})[S.hl.slice().sort().join('|')] && document.querySelector('.doc.hl')); });
        if (stuck) report.hlStuck++;
      }
      if (/^(a:|p:|pc)/.test(st)) log.push(st);
      if (st === 'end') { ended = true; break; }
      const sig = st + '|' + await page.evaluate(() => { const S = G.keiji.state && G.keiji.state(); return S ? S.day + ':' + (S.docs || []).length : ''; });
      same = sig === last ? same + 1 : 0; last = sig;
      if (same > 400) { report.stalls.push(cid + ' run' + r + ' at ' + sig); break; }
      await page.waitForTimeout(2);
    }
    // 照らし合わせの組の検査（最後の事件の状態で）
    const pr = await page.evaluate(() => {
      const K = G.keiji, C = K.C && K.C(), S = K.state && K.state(); if (!C || !S || !C.pick) return {};
      const units = d => { const el = document.createElement('div'); el.innerHTML = typeof d.body === 'function' ? d.body(S) : d.body; return [...el.querySelectorAll('p, td, li')].filter(u => !u.querySelector('p, td, li')).map(u => { const tr = u.closest('tr'); return tr ? tr.textContent : u.textContent; }); };
      const out = {};
      Object.entries(C.pick).forEach(([k, [ra, rb]]) => {
        const [x, y] = k.split('|'), dx = K.doc(x), dy = K.doc(y);
        if (!dx || !dy) { out[C.id + ':' + k] = 'docs-missing'; return; }
        const ux = units(dx), uy = units(dy);
        const ok = (ux.some(u => ra.test(u)) && uy.some(u => rb.test(u))) || (ux.some(u => rb.test(u)) && uy.some(u => ra.test(u)));
        let res = null; try { res = C.compare(S, x, y); } catch (e) { res = 'ERR ' + e.message; }
        // 下線が当たらず、compare も何も返さない＝その状態ではこの組は成り立たない（記録が消去済みなど）
        out[C.id + ':' + k] = !ok && !res ? 'n/a' : !ok ? 'regex-unmatched' : !res ? 'compare-null' : (typeof res === 'string' ? res : 'ok');
      });
      return out;
    });
    Object.entries(pr).forEach(([k, v]) => { const o = report.pairs[k] = report.pairs[k] || {}; o[v] = (o[v] || 0) + 1; });
    const aud = await page.evaluate(() => G.audit || []); aud.forEach(a => report.audit.add(a));
    const lastRun = await page.evaluate(() => { const m = JSON.parse(localStorage.getItem('chousho.meta.v1') || '{}'); return (m.runs || []).slice(-1)[0] || null; });
    report.runs++; if (ended) report.ended++;
    if (errs.length) report.errors.push(cid + ' run' + r + ': ' + errs.slice(0, 3).join(' / '));
    const tr = await page.evaluate(() => { const S = G.keiji.state && G.keiji.state(); if (!S) return ''; const C = G.keiji.C(); let est = ''; try { const e = C.gauge ? C.gauge(S) : ''; const m = String(e).match(/「([^」]+)」/); est = m ? ' 見立て「' + m[1] + '」' : ''; } catch (e) {} return (S.c.truth || '') + (S.c.target ? '→' + S.c.target : '') + ' 記録' + S.docs.length + ' 逮捕' + (S.c.arrest != null ? S.c.arrest + '日目' : 'なし') + est; });
    if (process.env.LOG) report.outcomes.push('   log: ' + log.filter(x => !/^p:good/.test(x)).slice(-60).join(' / '));
    report.outcomes.push((thorough ? '[尽] ' : '[乱] ') + cid + ' ' + tr + ' ' + (ended ? (lastRun ? lastRun.result : '序章おわり') : '終わらず') + (lastRun && lastRun.confession ? ' 自白:' + lastRun.confession : ''));
    process.stdout.write('.');
    await page.close();
  }
  await browser.close();
  console.log('\n=== 自動テストの結果 ===');
  console.log('遊んだ回数', report.runs, '／終わりまで進んだ', report.ended);
  console.log('ページのエラー', report.errors.length); report.errors.forEach(e => console.log('  ' + e));
  console.log('話者と表示の不一致', report.audit.size); [...report.audit].slice(0, 20).forEach(a => console.log('  ' + a));
  console.log('進行の停止', report.stalls.length); report.stalls.forEach(s => console.log('  ' + s));
  console.log('並べ終えたのに光る記録', report.hlStuck);
  console.log('照らし合わせの組（両方の記録がそろった回で検査）');
  Object.entries(report.pairs).sort().forEach(([k, v]) => { const bad = Object.keys(v).filter(x => x !== 'ok' && x !== 'docs-missing' && x !== 'n/a'); console.log((bad.length ? '  ✗ ' : '  　 ') + k + ' ' + JSON.stringify(v)); });
  console.log('結末'); report.outcomes.forEach(o => console.log('  ' + o));
  const fail = report.errors.length || report.stalls.length || report.hlStuck || report.ended < report.runs || Object.values(report.pairs).some(v => Object.keys(v).some(x => x !== 'ok' && x !== 'docs-missing' && x !== 'n/a'));
  process.exit(fail ? 1 : 0);
})();
