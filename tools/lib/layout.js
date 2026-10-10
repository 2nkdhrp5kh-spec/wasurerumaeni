// 見た目の検査（ブラウザの中で動かす関数）：文字が枠からはみ出していないか、画面が横にはみ出していないか
// 箱ではなく、文字が実際に描かれた位置で見る（字下げなどで、箱の中の文字だけが外へ出ることがある）
module.exports = function layoutCheck() {
  const out = [], W = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > W + 1) out.push('画面が横にはみ出す（幅' + document.documentElement.scrollWidth + '）');
  const box = '.pcard, .paper, .panel, .elem, .act, .staff, .doc, .goal, .bub, .chat, .pbtn, .dlg';
  const nodes = [];
  document.querySelectorAll('.pcard, .paper, .panel, .act, .goal, .dlg, .pbtn').forEach(root => { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) if (n.textContent.trim()) nodes.push(n); });
  nodes.forEach(n => {
    const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(), e = n.parentElement;
    if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') return;
    const p = e.closest(box); if (!p) return; const q = p.getBoundingClientRect();
    if (r.left < q.left - 2 || r.right > q.right + 2) out.push((e.className || e.tagName) + '「' + (n.textContent || '').trim().slice(0, 14) + '」が枠（' + p.className.split(' ')[0] + '）の外に ' + Math.round(Math.max(q.left - r.left, r.right - q.right)) + 'px');
  });
  return [...new Set(out)].slice(0, 8);
};
