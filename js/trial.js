'use strict';
/* ============================================================
   刑事編の結末（汎用）：検察官 → 公判 → 数年後 → 終幕
   T（事件ごとの設定）：
     name, accused, charge(罪名), court, issue(争点の言い方)
     retract(S), lines(S, charge) → 検事の台詞
     estimate(S, ids) → {pos, neg, pros, cons}
     admit(S, admit, drop)  証拠の採否
     decide(S, r, admit) → { verdict, main }
     reveal(S, verdict) → Promise<boolean>
     finale: 終幕に添える文
   ============================================================ */
(function () {
  const rnd = G.rnd;
  const list = a => a.map(x => '<p class="qa">・' + x + '。</p>').join('');
  G.trial = {
    estimate(S, T) { const ids = S.docs.filter(d => d.evid).map(d => d.id); const r = T.weigh(S, ids, false); const d = T.decide(S, r, ids); return { w: r.pos - r.neg, neg: r.neg, ok: d.verdict === '有罪' || d.verdict === '有罪（減軽）' }; },
    gauge(S, T) {
      const e = G.trial.estimate(S, T), w = e.w;
      let lv = w < 1 ? 1 : w < 3 ? 2 : w < 4 ? 3 : w < 6 ? 4 : 5; if (!e.ok && lv > 3) lv = 3;
      const who = G.kit.inCustody(S) && G.kit.custodyDay(S) >= 2 ? '担当検事の見立て' : '東堂課長の見立て';
      const words = ['', 'これでは起訴できない', '起訴は難しい。もっと固めろ', e.neg > 1.2 && w >= 4 ? '起訴はできる。だが、弁護人に突かれる穴が多い' : '起訴はできる。だが公判は危うい', '公判でも有罪を取れるだろう', '固い'];
      return '<div class="gauge"><div class="gt">' + who + '（集めた記録を、すべて証拠にできると仮定した場合）</div><div class="gb">' + [1, 2, 3, 4, 5].map(i => '<span class="' + (i <= lv ? 'on' : '') + '"></span>').join('') + '</div><div class="gw">「' + words[lv] + '」</div></div>';
    },
    async run(S, T) {
      const c = S.c;
      let verdict = null; const excluded = [];
      if (c.how === 'unsolved') verdict = '未解決';
      else {
        const sent = Object.keys(c.sent || {}).filter(k => c.sent[k]);
        if (T.late) await T.late(S, sent);
        T.retract(S);
        const est = T.weigh(S, sent, false);
        if (c.how === 'release') {
          G.layout({ role: '検察', date: '', info: '北見坂地方検察庁', scene: { bg: 'pros', who: 'kenji' } });
          await G.talk([['kenji', '主任の意見は読みました。……記録を見ても、起訴できるだけのものはない。'], ['kenji', '釈放します。嫌疑不十分で、不起訴とします。'], ['', '（' + T.accusedName + 'は釈放された。）']]);
        }
        G.layout({ role: '検察', date: '', info: '北見坂地方検察庁', scene: { bg: 'pros', who: 'kenji' } });
        G.audio.ambient(null);
        const charge = c.how === 'release' ? 'release' : T.charge ? T.charge(S, est) : ((c.confession && !c.retract) || est.pos - est.neg >= 3);
        if (charge !== 'release') await G.talk(G.kit.mismatchLines(S, G.keiji.C()).concat(T.lines(S, charge)));
        if (charge === 'release') verdict = '釈放（不起訴）';
        else if (charge === 'ryakushiki') verdict = '略式命令（罰金）';
        else if (!charge) verdict = '不起訴';
        else {
          G.audio.cue('trial');
          const admit = sent.slice();
          const drop = (id, why) => { const i = admit.indexOf(id); if (i >= 0) { admit.splice(i, 1); excluded.push(why); if (/任意性|違法|相当な限度/.test(why)) c.excludedIllegal = (c.excludedIllegal || 0) + 1; } };
          if (c.confession && c.custodyBad && G.rnd() < .7) drop('confession', '自白は、本件の勾留を余罪の取調べに流用し、又は期間の満了後も身柄の拘束を続ける違法な状態の下で得られたもので、証拠能力を否定する');
          // 逮捕に伴う捜索差押え（220条）で見つけた記録
          if (c.s220) (S.docs || []).filter(d => d.s220 && d.s220 !== 'legal').forEach(d => {
            if (d.s220 === 'outHome') drop(d.id, '被告人方の捜索は、逮捕の現場から離れた場所で行われたもので、刑訴法220条1項2号の「逮捕の現場」に当たらない。令状主義に反する重大な違法があり、証拠能力を否定する');
            else if (d.s220 === 'pre' && G.rnd() < .5) drop(d.id, '被告人の帰宅前に開始された捜索は、逮捕との時間的接着を欠き、「逮捕する場合」に当たらない（緊急処分説の立場）。違法な捜索により得られた証拠として、証拠能力を否定する');
            else if (d.s220 === 'phoneView' && G.rnd() < .5) drop(d.id, 'スマートフォン内の記録の閲覧は、逮捕に伴う捜索として許される範囲を超え、令状によるべきであった。証拠能力を否定する');
          });
          // 逮捕の種類（7時16分発）：改めての現行犯逮捕は時間がたっていて要件を欠き、緊急逮捕は罪名が長期3年以上に当たらなければ違法
          if (c.confession && (c.arrestBasis === 'police' || (c.arrestBasis === 'emergency' && !(G.kit.charge(S) || {}).emergencyOk)) && G.rnd() < .8)
            drop('confession', c.arrestBasis === 'police' ? '被告人の逮捕は、犯行から約50分後、警察署内で改めて現行犯逮捕としてされたもので、刑訴法212条の要件を欠く違法なものである。その身柄拘束下で得られた自白の証拠能力を否定する' : '被告人に対する緊急逮捕は、長期3年以上の拘禁刑に当たる罪についてのものではなく、刑訴法210条の要件を欠く違法なものである。その身柄拘束下で得られた自白の証拠能力を否定する');
          T.admit(S, admit, drop);
          const r = T.weigh(S, admit, true);
          const d = T.decide(S, r, admit);
          verdict = d.verdict;
          await G.curtain([{ html: '<div class="big">公判</div><div class="small">' + T.court + '</div>', sfx: 'crowd' }]);
          const guilty = verdict.startsWith('有罪');
          const body = '<p><b>主文</b>　' + d.main + '</p><h4>理由の要旨</h4>'
            + (excluded.length ? '<p>（証拠の採否）</p>' + list(excluded) : '')
            + (guilty
              ? '<p>（' + T.issue.pro + '）</p>' + list(r.pros) + (r.cons.length ? '<p>（弁護人の主張について）</p>' + list(r.cons) + '<p class="qa">　' + (d.reduce || 'これらは、いずれも上記の認定を左右するものではない。') + '</p>' : '')
                + '<p>' + T.issue.yes + '</p>'
              : '<p>（検察官の主張する事情）</p>' + (r.pros.length ? list(r.pros) : '<p class="qa">・これを認めるに足りる証拠は乏しい。</p>')
                + (r.cons.length ? '<p>（しかし、次の事情がある）</p>' + list(r.cons) : '') + '<p>' + T.issue.no + '</p>')
            + (c.withheld && c.withheld.length ? G.note('送致されなかった記録（' + c.withheld.map(id => (G.keiji.doc(id) || {}).title).join('、') + '）は、この法廷には現れていない。') : '');
          G.audio.cue('verdict');
          await G.openPaper({ title: '判決', sub: T.court, body, closeLabel: '閉じる' });
        }
      }
      G.audio.cue('years');
      let revealed = await T.reveal(S, verdict);
      const guiltyV0 = /有罪|略式/.test(verdict), truthG = T.isGuilty ? T.isGuilty(S) : null;
      let rkind = revealed ? (guiltyV0 ? 'wrong' : 'free') : null;
      // 正しかったことが、偶然分かることもある（誤っていたときほどは、明らかにならない）
      if (!revealed && truthG != null && T.confirm && guiltyV0 === truthG && verdict !== '未解決' && G.devHit(.25)) {
        await G.curtain(T.confirm(S, guiltyV0).map((h, i) => ({ html: h, wait: i ? 2600 : 1200 }))); revealed = true; rkind = 'right';
      }
      const correct = revealed && truthG != null ? guiltyV0 === truthG : null;
      G.lastOutcome = { verdict, reveal: rkind, correct };
      if (!revealed) await G.curtain([{ html: '<div class="law">それから、何年かが過ぎた。<br><br>何も起きなかった。<br><br>' + T.nothing(verdict) + '</div>', wait: 2200 },
        { html: '<div class="law" style="font-size:15px;color:#aaa">何も起きなかったことは、何の証明にもならない。</div>', wait: 1800 }]);
      G.audio.cue('finale');
      const guiltyV = /有罪|略式/.test(verdict);
      const pages = [{ html: G.kit.honbu(S, verdict, rkind === 'wrong' || rkind === 'free' ? rkind : null), wait: 2400 },
        { html: '<div class="big" style="letter-spacing:.1em">あなたは、確信していましたか。</div>', wait: 2400 }];
      if (revealed && !G.meta.revealedOnce) {
        G.meta.revealedOnce = true;
        pages.push({ html: '<div class="law" style="font-size:15px">この事件の「真相」は、あなたが捜査を始めたときに、内部で決められていました。<br>' + T.truthText + '<br><br>あなたが集めた証拠の多くは、どちらの世界でも、まったく同じように現れます。<br><br>今回、真相が明らかになったのは、偶然です。<br>現実の事件でも、真相が明らかになるのは、多くの場合、偶然によってです。</div>', wait: 3000 });
      }
      if (T.finale) pages.push({ html: '<div class="law" style="font-size:14px;color:#aaa">' + T.finale + '</div>', wait: 2600 });
      await G.curtain(pages);
      Object.assign(G.lastOutcome, G.kit.outcomeExtra(S, G.keiji.C()), { truthG, revealed: !!revealed });
      G.meta.runs.push({ no: G.meta.runs.length + 1, mode: T.name, result: verdict,
        confession: c.confession ? (c.confession.voluntary ? 'あり（自発）' : 'あり') + (c.retract ? '・撤回' : '') : 'なし',
        illegal: (c.sess && (c.sess.C ? 1 : 0) + (c.sess.D ? 1 : 0) + (c.sess.E ? 1 : 0)) + (c.illegalCount || 0), withheld: (c.withheld || []).length, revealed: revealed ? '判明' : '—', correct: G.lastOutcome.correct });
      G.saveMeta();
    }
  };
})();
