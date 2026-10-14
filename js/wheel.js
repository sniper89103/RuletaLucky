/* =========================================================
   RULETA · dibujo en canvas + física del giro
   ========================================================= */
(function () {
  const TAU = Math.PI * 2;
  const mod = (a) => ((a % TAU) + TAU) % TAU;

  class Wheel {
    constructor(canvas, segments, pointerEl) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.segments = segments;
      this.pointer = pointerEl;
      this.n = segments.length;
      this.step = TAU / this.n;
      this.rot = 0;
      this.spinning = false;
      this.kick = 0;
      this.lastPeg = 0;
      this.winIndex = null;
      this.disabledTypes = {};
      this.onTick = function () {};
      this.resize();
      window.addEventListener('resize', () => this.resize());
      const loop = (t) => { this.frame(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.size = this.canvas.clientWidth || 600;
      this.canvas.width = this.canvas.height = Math.round(this.size * this.dpr);
    }

    /** Gira hasta dejar el espacio `index` bajo el puntero. */
    spin(index, opts) {
      const jitter = (Math.random() - 0.5) * this.step * 0.7;
      const targetMod = mod(-(index + 0.5) * this.step + jitter);
      const delta = mod(targetMod - mod(this.rot));
      const spins = 5 + Math.floor(Math.random() * 3);
      this.from = this.rot;
      this.to = this.rot + spins * TAU + delta;
      this.dur = opts.duration;
      this.start = performance.now();
      this.onEnd = opts.onEnd;
      this.spinning = true;
      this.winIndex = null;
      this.lastPeg = Math.floor(this.rot / this.step);
    }

    indexAtPointer() {
      return Math.floor(mod(-this.rot) / this.step) % this.n;
    }

    frame(t) {
      if (this.spinning) {
        const p = Math.min((t - this.start) / this.dur, 1);
        const e = 1 - Math.pow(1 - p, 4);
        this.rot = this.from + (this.to - this.from) * e;
        const peg = Math.floor(this.rot / this.step);
        if (peg !== this.lastPeg) {
          this.lastPeg = peg;
          this.kick = 1;
          this.onTick();
        }
        if (p >= 1) {
          this.spinning = false;
          this.winIndex = this.indexAtPointer();
          if (this.onEnd) this.onEnd(this.winIndex);
        }
      }
      this.kick *= 0.86;
      if (this.pointer) this.pointer.style.transform = 'rotate(' + (-this.kick * 28).toFixed(2) + 'deg)';
      this.draw(t);
    }

    draw(t) {
      const ctx = this.ctx, size = this.size, dpr = this.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const c = size / 2;
      const R = c - 4;
      const r = R - size * 0.055;

      // ----- Aro exterior -----
      const rim = ctx.createRadialGradient(c, c, r, c, c, R);
      rim.addColorStop(0, '#2A1F4D');
      rim.addColorStop(0.6, '#4B3A7A');
      rim.addColorStop(1, '#7A65AB');
      ctx.beginPath(); ctx.arc(c, c, R, 0, TAU);
      ctx.fillStyle = rim; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();

      // ----- Luces del aro -----
      const bulbs = 28;
      const bulbR = (R + r) / 2;
      for (let i = 0; i < bulbs; i++) {
        const a = (i / bulbs) * TAU;
        let on;
        if (this.spinning) on = ((Math.floor(t / 70) + i) % 3) === 0;
        else on = (Math.floor(t / 450) + i) % 2 === 0;
        const bx = c + Math.cos(a) * bulbR, by = c + Math.sin(a) * bulbR;
        ctx.beginPath(); ctx.arc(bx, by, size * 0.0105, 0, TAU);
        if (on) {
          ctx.fillStyle = '#FFE29A'; ctx.shadowColor = '#F5B942'; ctx.shadowBlur = size * 0.02;
        } else {
          ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ----- Espacios -----
      for (let i = 0; i < this.n; i++) {
        const seg = this.segments[i];
        const a0 = this.rot + i * this.step - Math.PI / 2;
        const a1 = a0 + this.step;
        ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a1); ctx.closePath();
        ctx.fillStyle = seg.color; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke();

        // Contenido
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(a0 + this.step / 2);
        // icono
        ctx.save();
        ctx.translate(r * 0.31, 0);
        ctx.rotate(Math.PI / 2);
        ctx.font = Math.round(r * 0.13) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(seg.icon, 0, 0);
        ctx.restore();
        // texto
        const fs = Math.round(r * 0.06);
        ctx.font = '800 ' + fs + 'px Sora, "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = seg.text;
        const lines = seg.lines;
        const lh = fs * 1.25;
        lines.forEach((ln, k) => {
          const y = (k - (lines.length - 1) / 2) * lh;
          ctx.fillText(ln, r * 0.43, y);
        });
        ctx.restore();

        // Preguntas agotadas: se atenúan
        if (this.disabledTypes[seg.type]) {
          ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a1); ctx.closePath();
          ctx.fillStyle = 'rgba(10,6,22,.62)'; ctx.fill();
        }
        // Brillo del ganador
        if (this.winIndex === i && !this.spinning) {
          ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a1); ctx.closePath();
          ctx.fillStyle = 'rgba(255,255,255,' + (0.12 + 0.2 * Math.abs(Math.sin(t / 220))).toFixed(3) + ')';
          ctx.fill();
        }
      }

      // ----- Relieve sobre las porciones -----
      const sh = ctx.createRadialGradient(c, c, r * 0.1, c, c, r);
      sh.addColorStop(0, 'rgba(255,255,255,.14)');
      sh.addColorStop(1, 'rgba(0,0,0,.28)');
      ctx.beginPath(); ctx.arc(c, c, r, 0, TAU); ctx.fillStyle = sh; ctx.fill();

      // ----- Clavijas en cada división -----
      for (let i = 0; i < this.n; i++) {
        const a = this.rot + i * this.step - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, size * 0.0125, 0, TAU);
        ctx.fillStyle = '#F5B942'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
      }

      // ----- Aro del centro (detrás del botón HTML) -----
      ctx.beginPath(); ctx.arc(c, c, size * 0.125, 0, TAU);
      ctx.fillStyle = '#2A1F4D'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = size * 0.03;
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }

  window.LuckyWheel = Wheel;
})();
