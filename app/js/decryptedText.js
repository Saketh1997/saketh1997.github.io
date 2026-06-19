/* ============================================================
   decryptedText.js — vanilla port of the React DecryptedText
   component. Scrambles a heading's letters then resolves them
   left-to-right. Works on text NODES, so inline markup inside
   the target (<br>, <em>, ...) is preserved.
   Exposes: window.DecryptedText.init({ selector, ...opts })
   ============================================================ */
(function () {
  const DEFAULTS = {
    // the Name (brand + hero) and every section title
    selector: '.logo, h1.name, h2.sec-title',
    speed: 45,          // ms between scramble frames
    revealStep: 1,      // letters locked-in per frame
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-',
    animateOn: 'view',  // 'view' (reveal on scroll-in) | 'load'
    reanimateOnHover: true
  };

  function collectTextNodes(el) {
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.replace(/\s/g, '').length) nodes.push(n);
    }
    return nodes;
  }

  function scrambleNode(entry, opts) {
    const node = entry.node, original = entry.original, len = original.length;
    if (entry.timer) clearInterval(entry.timer);
    let revealed = 0;
    const chars = opts.characters;
    const rand = () => chars[(Math.random() * chars.length) | 0];

    entry.timer = setInterval(() => {
      let out = '';
      for (let i = 0; i < len; i++) {
        const c = original[i];
        if (c === ' ' || c === '\n' || c === '\t') { out += c; continue; }
        out += i < revealed ? c : rand();
      }
      node.nodeValue = out;
      revealed += opts.revealStep;
      if (revealed > len) {
        clearInterval(entry.timer);
        entry.timer = null;
        node.nodeValue = original;
      }
    }, opts.speed);
  }

  function animate(el, opts) {
    const store = el._decNodes;
    if (!store) return;
    store.forEach(entry => scrambleNode(entry, opts));
  }

  function init(userOpts) {
    const opts = Object.assign({}, DEFAULTS, userOpts);
    const els = document.querySelectorAll(opts.selector);

    els.forEach(el => {
      // cache the pristine text up-front, before any scramble runs
      el._decNodes = collectTextNodes(el).map(node => ({ node, original: node.nodeValue, timer: null }));
      if (opts.reanimateOnHover) {
        el.addEventListener('mouseenter', () => animate(el, opts));
      }
    });

    if (opts.animateOn === 'view' && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting) { animate(e.target, opts); obs.unobserve(e.target); }
        });
      }, { threshold: 0.2 });
      els.forEach(el => io.observe(el));
    } else {
      els.forEach(el => animate(el, opts));
    }
  }

  window.DecryptedText = { init, animate };
})();
