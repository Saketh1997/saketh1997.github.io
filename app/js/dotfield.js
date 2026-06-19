/* ============================================================
   dotfield.js — vanilla port of the React DotField component.
   Renders an interactive dot-grid background that bulges away
   from the cursor, with a soft glow that follows the pointer.
   Exposes: window.DotField.init({ mount, ...opts })
   ============================================================ */
(function () {
  const TWO_PI = Math.PI * 2;

  const DEFAULTS = {
    mount: '#dot-field-bg',
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 500,
    bulgeStrength: 67,
    glowRadius: 160,
    // tuned to the site palette (amber → cream)
    gradientFrom: 'rgba(223,160,32,0.30)',
    gradientTo: 'rgba(238,232,213,0.16)',
    glowColor: '#1e1e25'
  };

  function init(userOpts) {
    const o = Object.assign({}, DEFAULTS, userOpts);
    const container = typeof o.mount === 'string'
      ? document.querySelector(o.mount) : o.mount;
    if (!container) return;
    container.classList.add('dot-field-container');

    // --- canvas (dots) ---
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    container.appendChild(canvas);

    // --- svg (cursor glow) ---
    const svgNS = 'http://www.w3.org/2000/svg';
    const glowId = 'dot-field-glow-' + Math.random().toString(36).slice(2, 9);
    const svg = document.createElementNS(svgNS, 'svg');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    svg.innerHTML =
      '<defs><radialGradient id="' + glowId + '">' +
      '<stop offset="0%" stop-color="' + o.glowColor + '"/>' +
      '<stop offset="100%" stop-color="transparent"/></radialGradient></defs>' +
      '<circle cx="-9999" cy="-9999" r="' + o.glowRadius +
      '" fill="url(#' + glowId + ')" style="opacity:0;will-change:opacity"/>';
    container.appendChild(svg);
    const glowEl = svg.querySelector('circle');

    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let dots = [];
    const size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
    const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    let engagement = 0, glowOpacity = 0, frame = 0, resizeTimer;

    function buildDots(w, h) {
      const step = o.dotRadius + o.dotSpacing;
      const cols = Math.floor(w / step), rows = Math.floor(h / step);
      const padX = (w % step) / 2, padY = (h % step) / 2;
      dots = new Array(rows * cols);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ax = padX + c * step + step / 2;
          const ay = padY + r * step + step / 2;
          dots[i++] = { ax, ay, sx: ax, sy: ay };
        }
      }
    }

    function doResize() {
      const rect = container.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // container is position:fixed → viewport coords map directly (no scroll offset)
      size.w = w; size.h = h;
      size.offsetX = rect.left; size.offsetY = rect.top;
      buildDots(w, h);
    }
    function resize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(doResize, 100); }

    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX - size.offsetX;
      mouse.y = e.clientY - size.offsetY;
    }, { passive: true });

    setInterval(function () {
      const dx = mouse.prevX - mouse.x, dy = mouse.prevY - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (dist - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x; mouse.prevY = mouse.y;
    }, 20);

    function tick() {
      frame++;
      const w = size.w, h = size.h, len = dots.length;

      const target = Math.min(mouse.speed / 5, 1);
      engagement += (target - engagement) * 0.06;
      if (engagement < 0.001) engagement = 0;
      glowOpacity += (engagement - glowOpacity) * 0.08;

      if (glowEl) {
        glowEl.setAttribute('cx', mouse.x);
        glowEl.setAttribute('cy', mouse.y);
        glowEl.style.opacity = glowOpacity;
      }

      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, o.gradientFrom);
      grad.addColorStop(1, o.gradientTo);
      ctx.fillStyle = grad;

      const cr = o.cursorRadius, crSq = cr * cr, rad = o.dotRadius / 2;
      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const d = dots[i];
        const dx = mouse.x - d.ax, dy = mouse.y - d.ay;
        const distSq = dx * dx + dy * dy;
        if (distSq < crSq && engagement > 0.01) {
          const dist = Math.sqrt(distSq);
          const t = 1 - dist / cr;
          const push = t * t * o.bulgeStrength * engagement;
          const angle = Math.atan2(dy, dx);
          d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
          d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
        } else {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }
        ctx.moveTo(d.sx + rad, d.sy);
        ctx.arc(d.sx, d.sy, rad, 0, TWO_PI);
      }
      ctx.fill();

      requestAnimationFrame(tick);
    }

    doResize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  }

  window.DotField = { init };
})();
