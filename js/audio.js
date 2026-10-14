/* =========================================================
   AUDIO · sonidos sintetizados con Web Audio (sin archivos)
   ========================================================= */
(function () {
  let ctx = null, master = null;
  let muted = false;
  try { muted = localStorage.getItem('lucky-muted') === '1'; } catch (e) {}

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.8;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function tone(o) {
    if (!ensure()) return;
    const f = o.f || 440, d = o.d || 0.2, v = o.v || 0.3;
    const now = ctx.currentTime + (o.t || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, now);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, now + d);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(v, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    osc.connect(g); g.connect(master);
    osc.start(now); osc.stop(now + d + 0.05);
  }

  function noise(dur, f1, f2, v) {
    if (!ensure()) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    const now = ctx.currentTime;
    bp.frequency.setValueAtTime(f1, now);
    bp.frequency.exponentialRampToValueAtTime(f2, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(v, now + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(now);
  }

  const notes = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5, G6: 1568 };

  window.LuckyAudio = {
    unlock: ensure,
    tick() { tone({ f: 1500, f2: 700, d: 0.05, type: 'triangle', v: 0.18 }); },
    whoosh() { noise(1.3, 300, 2400, 0.35); },
    pop() { tone({ f: 300, f2: 900, d: 0.14, type: 'sine', v: 0.35 }); },
    reveal() {
      tone({ f: notes.E5, d: 0.25, type: 'triangle', v: 0.3 });
      tone({ f: notes.G5, t: 0.12, d: 0.35, type: 'triangle', v: 0.3 });
    },
    win() {
      [notes.C5, notes.E5, notes.G5, notes.C6].forEach((f, i) =>
        tone({ f, t: i * 0.09, d: 0.3, type: 'triangle', v: 0.32 }));
      [notes.C5, notes.E5, notes.G5].forEach(f =>
        tone({ f, t: 0.4, d: 0.8, type: 'sine', v: 0.2 }));
    },
    big() {
      [notes.C5, notes.E5, notes.G5, notes.C6, notes.E6, notes.G6].forEach((f, i) =>
        tone({ f, t: i * 0.08, d: 0.35, type: 'triangle', v: 0.3 }));
      [notes.C6, notes.E6, notes.G6].forEach(f =>
        tone({ f, t: 0.55, d: 1.0, type: 'sine', v: 0.22 }));
      noise(0.5, 3000, 8000, 0.2);
    },
    sad() {
      tone({ f: 392, d: 0.35, type: 'triangle', v: 0.3 });
      tone({ f: 330, t: 0.35, d: 0.35, type: 'triangle', v: 0.3 });
      tone({ f: 262, t: 0.7, d: 0.4, type: 'triangle', v: 0.3 });
      tone({ f: 220, f2: 110, t: 1.1, d: 0.9, type: 'sawtooth', v: 0.18 });
    },
    correct() {
      tone({ f: notes.G5, d: 0.15, type: 'square', v: 0.14 });
      tone({ f: notes.C6, t: 0.12, d: 0.4, type: 'square', v: 0.14 });
    },
    timeUp() {
      tone({ f: 220, d: 0.25, type: 'square', v: 0.2 });
      tone({ f: 165, t: 0.25, d: 0.45, type: 'square', v: 0.2 });
    },
    countdown(level) {
      level = level || 0;                       // 0 (10 s) ... 9 (1 s): cada vez más agudo
      const f = 700 + level * 90;
      tone({ f: f, d: 0.09, type: 'square', v: 0.14 });
      if (level >= 7) tone({ f: f * 1.25, t: 0.11, d: 0.09, type: 'square', v: 0.14 }); // doble pitido final
    },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('lucky-muted', muted ? '1' : '0'); } catch (e) {}
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    },
    isMuted() { return muted; }
  };
})();
