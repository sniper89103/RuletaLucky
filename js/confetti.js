/* =========================================================
   CONFETI · motor de partículas sobre canvas
   ========================================================= */
(function () {
  const cv = document.getElementById('confetti');
  const cx = cv.getContext('2d');
  const colors = window.LUCKY.confettiColors;
  let parts = [], running = false, W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const rnd = (a, b) => a + Math.random() * (b - a);

  function spawn(x, y, angle, spread, power) {
    const a = angle + rnd(-spread, spread);
    const s = rnd(power * 0.4, power);
    parts.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      w: rnd(6, 12), h: rnd(8, 16),
      rot: rnd(0, 6.28), vr: rnd(-0.3, 0.3),
      wob: rnd(0, 6.28), wobSpeed: rnd(0.05, 0.15),
      color: colors[(Math.random() * colors.length) | 0],
      shape: Math.random() < 0.25 ? 'c' : 'r',
      life: 1
    });
  }

  function loop() {
    cx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += 0.28; p.vx *= 0.99; p.vy *= 0.992;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.vr; p.wob += p.wobSpeed;
      if (p.y > H + 30) p.life -= 0.08;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      cx.save();
      cx.globalAlpha = Math.max(p.life, 0);
      cx.translate(p.x, p.y);
      cx.rotate(p.rot);
      cx.scale(1, Math.cos(p.wob));
      cx.fillStyle = p.color;
      if (p.shape === 'c') { cx.beginPath(); cx.arc(0, 0, p.w / 2, 0, 6.28); cx.fill(); }
      else cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cx.restore();
    }
    if (parts.length) requestAnimationFrame(loop);
    else { running = false; cx.clearRect(0, 0, W, H); }
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  window.LuckyConfetti = {
    burst(x, y, n) {
      n = n || 120;
      for (let i = 0; i < n; i++) spawn(x, y, -Math.PI / 2, Math.PI, 14);
      start();
    },
    cannons(n) {
      n = n || 90;
      for (let i = 0; i < n; i++) {
        spawn(0, H, -Math.PI / 3, 0.45, 26);
        spawn(W, H, -Math.PI * 2 / 3, 0.45, 26);
      }
      start();
    },
    rain(ms) {
      const end = performance.now() + (ms || 2000);
      (function drop() {
        for (let i = 0; i < 6; i++) spawn(rnd(0, W), -20, Math.PI / 2, 0.5, 4);
        start();
        if (performance.now() < end) setTimeout(drop, 60);
      })();
    },
    celebrate() {
      this.cannons(90);
      this.burst(W / 2, H * 0.4, 90);
      this.rain(1800);
    },
    clear() { parts = []; }
  };
})();
