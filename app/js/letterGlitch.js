/* ============================================================
   letterGlitch.js — vanilla port of the React LetterGlitch
   component. Renders a full-viewport grid of glitching
   monospace characters as an animated background.
   Exposes: window.LetterGlitch.init({ mount, ...opts })
   ============================================================ */
(function () {
  const DEFAULTS = {
    mount: '#letter-glitch-bg',
    // dim tones tuned to the site palette so text stays readable
    glitchColors: ['#2a2418', '#5c4a1e', '#6b6354'],
    glitchSpeed: 50,
    centerVignette: false,
    outerVignette: true,
    smooth: true,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'
  };

  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  function init(userOpts) {
    const o = Object.assign({}, DEFAULTS, userOpts);
    const container = typeof o.mount === 'string'
      ? document.querySelector(o.mount) : o.mount;
    if (!container) return;
    container.classList.add('letter-glitch-container');

    const lettersAndSymbols = Array.from(o.characters);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(canvas);

    if (o.outerVignette) {
      const v = document.createElement('div');
      v.style.cssText =
        'position:absolute;inset:0;pointer-events:none;' +
        'background:radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%);';
      container.appendChild(v);
    }
    if (o.centerVignette) {
      const v = document.createElement('div');
      v.style.cssText =
        'position:absolute;inset:0;pointer-events:none;' +
        'background:radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%);';
      container.appendChild(v);
    }

    const ctx = canvas.getContext('2d');
    let letters = [];
    const grid = { columns: 0, rows: 0 };
    let animationId = null;
    let lastGlitchTime = Date.now();
    let resizeTimer;

    const getRandomChar = () =>
      lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];

    const getRandomColor = () =>
      o.glitchColors[Math.floor(Math.random() * o.glitchColors.length)];

    function hexToRgb(hex) {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          }
        : null;
    }

    function interpolateColor(start, end, factor) {
      const r = Math.round(start.r + (end.r - start.r) * factor);
      const g = Math.round(start.g + (end.g - start.g) * factor);
      const b = Math.round(start.b + (end.b - start.b) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }

    function calculateGrid(width, height) {
      return {
        columns: Math.ceil(width / charWidth),
        rows: Math.ceil(height / charHeight)
      };
    }

    function initializeLetters(columns, rows) {
      grid.columns = columns;
      grid.rows = rows;
      const total = columns * rows;
      letters = Array.from({ length: total }, () => ({
        char: getRandomChar(),
        color: getRandomColor(),
        targetColor: getRandomColor(),
        colorProgress: 1
      }));
    }

    function resizeCanvas() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { columns, rows } = calculateGrid(rect.width, rect.height);
      initializeLetters(columns, rows);
      drawLetters();
    }

    function drawLetters() {
      if (!ctx || letters.length === 0) return;
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < letters.length; i++) {
        const x = (i % grid.columns) * charWidth;
        const y = Math.floor(i / grid.columns) * charHeight;
        ctx.fillStyle = letters[i].color;
        ctx.fillText(letters[i].char, x, y);
      }
    }

    function updateLetters() {
      if (!letters.length) return;
      const updateCount = Math.max(1, Math.floor(letters.length * 0.05));
      for (let i = 0; i < updateCount; i++) {
        const index = Math.floor(Math.random() * letters.length);
        const letter = letters[index];
        if (!letter) continue;
        letter.char = getRandomChar();
        letter.targetColor = getRandomColor();
        if (!o.smooth) {
          letter.color = letter.targetColor;
          letter.colorProgress = 1;
        } else {
          letter.colorProgress = 0;
        }
      }
    }

    function handleSmoothTransitions() {
      let needsRedraw = false;
      for (const letter of letters) {
        if (letter.colorProgress < 1) {
          letter.colorProgress += 0.05;
          if (letter.colorProgress > 1) letter.colorProgress = 1;
          const startRgb = hexToRgb(letter.color);
          const endRgb = hexToRgb(letter.targetColor);
          if (startRgb && endRgb) {
            letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
            needsRedraw = true;
          }
        }
      }
      if (needsRedraw) drawLetters();
    }

    function animate() {
      const now = Date.now();
      if (now - lastGlitchTime >= o.glitchSpeed) {
        updateLetters();
        drawLetters();
        lastGlitchTime = now;
      }
      if (o.smooth) handleSmoothTransitions();
      animationId = requestAnimationFrame(animate);
    }

    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(animationId);
        resizeCanvas();
        animate();
      }, 100);
    }

    resizeCanvas();
    animate();
    window.addEventListener('resize', handleResize);
  }

  window.LetterGlitch = { init };
})();
