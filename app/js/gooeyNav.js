/* ============================================================
   gooeyNav.js — vanilla port of the React GooeyNav component.
   Enhances the existing <ul class="nav-links"> in the header:
   wraps it in a .gooey-nav-container, adds the gooey "effect"
   layers, and fires a particle burst + active pill on click.
   Exposes: window.GooeyNav.init({ navList, ...opts })
   ============================================================ */
(function () {
  const DEFAULTS = {
    navList: '.nav-links',
    animationTime: 600,
    particleCount: 15,
    particleDistances: [90, 10],
    particleR: 100,
    timeVariance: 300,
    colors: [1, 2, 3, 1, 2, 3, 1, 4],
    initialActiveIndex: 0
  };

  const noise = (n = 1) => n / 2 - Math.random() * n;

  function getXY(distance, pointIndex, totalPoints) {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  }

  function createParticle(i, t, d, r, o) {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], o.particleCount - i, o.particleCount),
      end: getXY(d[1] + noise(7), o.particleCount - i, o.particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: o.colors[Math.floor(Math.random() * o.colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    };
  }

  function makeParticles(element, o) {
    const d = o.particleDistances, r = o.particleR;
    const bubbleTime = o.animationTime * 2 + o.timeVariance;
    element.style.setProperty('--time', bubbleTime + 'ms');

    for (let i = 0; i < o.particleCount; i++) {
      const t = o.animationTime * 2 + noise(o.timeVariance * 2);
      const p = createParticle(i, t, d, r, o);
      element.classList.remove('active');

      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('particle');
        particle.style.setProperty('--start-x', p.start[0] + 'px');
        particle.style.setProperty('--start-y', p.start[1] + 'px');
        particle.style.setProperty('--end-x', p.end[0] + 'px');
        particle.style.setProperty('--end-y', p.end[1] + 'px');
        particle.style.setProperty('--time', p.time + 'ms');
        particle.style.setProperty('--scale', p.scale);
        particle.style.setProperty('--color', 'var(--color-' + p.color + ', white)');
        particle.style.setProperty('--rotate', p.rotate + 'deg');

        point.classList.add('point');
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => element.classList.add('active'));
        setTimeout(() => {
          try { element.removeChild(particle); } catch (e) { /* already gone */ }
        }, t);
      }, 30);
    }
  }

  function init(userOpts) {
    const o = Object.assign({}, DEFAULTS, userOpts);
    const ul = document.querySelector(o.navList);
    if (!ul) return;

    // wrap the existing <ul> in a .gooey-nav-container (idempotent)
    let container = ul.closest('.gooey-nav-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'gooey-nav-container';
      ul.parentNode.insertBefore(container, ul);
      container.appendChild(ul);
    }

    let filter = container.querySelector('.effect.filter');
    if (!filter) {
      filter = document.createElement('span');
      filter.className = 'effect filter';
      container.appendChild(filter);
    }
    let textEl = container.querySelector('.effect.text');
    if (!textEl) {
      textEl = document.createElement('span');
      textEl.className = 'effect text';
      container.appendChild(textEl);
    }

    // Inject the SVG "goo" filter once. feGaussianBlur + feColorMatrix(alpha
    // threshold) merges the pill + particles into gooey blobs on a TRANSPARENT
    // field — no black backdrop, no blend mode — so the effect can spill out of
    // the header without a visible field/border. The large filter region keeps
    // far-flung particles from being clipped by the filter's default bounds.
    if (!document.getElementById('gooey-nav-goo-svg')) {
      const wrap = document.createElement('div');
      wrap.id = 'gooey-nav-goo-svg';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
      wrap.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">' +
        '<defs><filter id="gooey-nav-goo" x="-150%" y="-600%" width="400%" height="1300%" ' +
        'color-interpolation-filters="sRGB">' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur"/>' +
        '<feColorMatrix in="blur" mode="matrix" ' +
        'values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -13" result="goo"/>' +
        '</filter></defs></svg>';
      document.body.appendChild(wrap);
    }

    const lis = Array.from(ul.querySelectorAll('li'));
    if (!lis.length) return;
    let activeIndex = o.initialActiveIndex;

    // map each tab's anchor target (#about, #projects, ...) to its index,
    // so the scroll-spy can drive the gooey effect as the page scrolls
    const hashToIndex = {};
    lis.forEach((li, i) => {
      const a = li.querySelector('a');
      const href = a && a.getAttribute('href');
      if (href && href.charAt(0) === '#') hashToIndex[href] = i;
    });

    function updateEffectPosition(li) {
      const cRect = container.getBoundingClientRect();
      const pos = li.getBoundingClientRect();
      const styles = {
        left: (pos.x - cRect.x) + 'px',
        top: (pos.y - cRect.y) + 'px',
        width: pos.width + 'px',
        height: pos.height + 'px'
      };
      Object.assign(filter.style, styles);
      Object.assign(textEl.style, styles);
      textEl.innerText = li.innerText;
    }

    function setActive(index, li) {
      if (index === activeIndex) return;
      const prev = lis[activeIndex];
      if (prev) prev.classList.remove('active');
      activeIndex = index;
      li.classList.add('active');

      updateEffectPosition(li);
      filter.querySelectorAll('.particle').forEach(p => filter.removeChild(p));
      textEl.classList.remove('active');
      void textEl.offsetWidth; // reflow to restart the pill animation
      textEl.classList.add('active');
      makeParticles(filter, o);
    }

    lis.forEach((li, index) => {
      li.addEventListener('click', () => setActive(index, li));
      const a = li.querySelector('a');
      if (a) {
        a.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { setActive(index, li); }
        });
      }
    });

    // initial active state — wait a frame so layout/fonts are measured
    lis[activeIndex].classList.add('active');
    requestAnimationFrame(() => {
      updateEffectPosition(lis[activeIndex]);
      textEl.classList.add('active');
    });

    const reposition = () => { if (lis[activeIndex]) updateEffectPosition(lis[activeIndex]); };
    if (window.ResizeObserver) new ResizeObserver(reposition).observe(container);
    window.addEventListener('resize', reposition);

    // let the page's scroll-spy move the gooey effect (e.g. "#projects")
    window.GooeyNav.setActiveByHash = function (hash) {
      const idx = hashToIndex[hash];
      if (idx == null || idx === activeIndex) return;
      setActive(idx, lis[idx]);
    };
  }

  window.GooeyNav = { init };
})();
