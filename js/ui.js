/* =========================================================
   UI · ventanas flotantes, toast y fondo decorativo
   ========================================================= */
(function () {
  const modal = document.getElementById('modal');
  const card = document.getElementById('modalCard');
  const body = document.getElementById('modalBody');
  const toastEl = document.getElementById('toast');
  let actionCb = function () {};
  let closeCb = function () {};
  let closable = false;
  let toastTimer = null;

  const MARK = '<svg viewBox="0 0 807 807"><use href="#lucky-mark"/></svg>';

  const SAD_FACE =
    '<svg class="sad" viewBox="0 0 120 120" aria-hidden="true">' +
    '<circle cx="60" cy="60" r="54" fill="#7A65AB" stroke="#fff" stroke-width="4"/>' +
    '<ellipse cx="42" cy="54" rx="6" ry="8" fill="#fff"/><ellipse cx="78" cy="54" rx="6" ry="8" fill="#fff"/>' +
    '<path d="M30 38 L52 45 M90 38 L68 45" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M40 90 Q60 70 80 90" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>' +
    '<path class="tear" d="M42 66 q-7 11 0 15 q7 -4 0 -15z"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  const templates = {
    question: function (d) {
      return '<div class="m-question-box">' +
        '<span class="m-badge">❓ Pregunta ' + d.n + ' de ' + d.total + '</span>' +
        '<h2 class="m-question">' + esc(d.text) + '</h2>' +
        '<div class="timer" id="timer"><svg viewBox="0 0 100 100"><circle class="t-bg" cx="50" cy="50" r="44"/>' +
        '<circle class="t-fg" id="timerArc" cx="50" cy="50" r="44"/></svg><span id="timerNum">' + d.seconds + '</span></div>' +
        '<p class="m-hint" id="timerHint">Responde en voz alta frente al equipo de reclutamiento</p>' +
        '<div class="m-actions">' +
        '<button class="btn btn-ok" data-act="correct">✅ ¡Respondió bien!</button>' +
        '<button class="btn btn-ghost" data-act="wrong">😅 Casi lo logra</button></div></div>';
    },
    correct: function () {
      return '<div class="m-result-ok"><div class="big-emoji">🎉</div>' +
        '<h2 class="m-title">¡Respuesta correcta!</h2>' +
        '<p class="m-text">Así se habla. Con esa actitud encajas perfecto en Grupo Lucky 💜</p>' +
        '<div class="m-actions"><button class="btn btn-main" data-act="close">Seguir girando 🎡</button></div></div>';
    },
    wrong: function () {
      return '<div><div class="big-emoji">💪</div>' +
        '<h2 class="m-title">¡Buen intento!</h2>' +
        '<p class="m-text">Cada respuesta cuenta. ¡Gracias por animarte a participar!</p>' +
        '<div class="m-actions"><button class="btn btn-main" data-act="close">Seguir girando 🎡</button></div></div>';
    },
    sticker: function () {
      return '<div><span class="m-badge">🏷️ Premio</span><div class="sticker">' + MARK + '</div>' +
        '<h2 class="m-title">¡Ganaste un sticker!</h2>' +
        '<p class="m-text">Pídelo en el stand de Grupo Lucky y pégalo donde más te guste.</p>' +
        '<div class="m-actions"><button class="btn btn-main" data-act="close">¡Genial! 🎡</button></div></div>';
    },
    surprise: function () {
      return '<div class="m-surprise"><span class="m-badge">🎁 Premio especial</span><br>' +
        '<div class="big-emoji">🎁</div>' +
        '<h2 class="m-title">¡Premio sorpresa!</h2>' +
        '<p class="m-text">¡La suerte está de tu lado! Acércate al equipo de reclutamiento para reclamar tu regalo.</p>' +
        '<div class="m-actions"><button class="btn btn-main" data-act="close">¡Lo quiero! 🎡</button></div></div>';
    },
    retry: function () {
      return '<div><span class="m-badge">Esta vez no</span><br>' + SAD_FACE +
        '<h2 class="m-title">¡Sigue participando!</h2>' +
        '<p class="m-text">La suerte ya viene en camino. ¡Gira de nuevo!</p>' +
        '<div class="m-actions"><button class="btn btn-main" data-act="close">Intentar otra vez 🎡</button></div></div>';
    },
    settings: function (d) {
      const presets = [15, 20, 30, 45, 60, 90];
      const chips = presets.map(function (s) {
        return '<button class="chip-btn' + (s === d.seconds ? ' on' : '') + '" data-act="time-set:' + s + '">' + s + 's</button>';
      }).join('');
      return '<div><span class="m-badge">⏱️ Configuración</span>' +
        '<h2 class="m-title">Tiempo por pregunta</h2>' +
        '<div class="stepper">' +
        '<button class="step-btn" data-act="time-minus" aria-label="Menos tiempo">−</button>' +
        '<div class="step-val"><b id="setVal">' + d.seconds + '</b><small>segundos</small></div>' +
        '<button class="step-btn" data-act="time-plus" aria-label="Más tiempo">+</button></div>' +
        '<div class="chips">' + chips + '</div>' +
        '<p class="m-hint">Rango de 5 a 120 segundos. Se guarda automáticamente.</p>' +
        '<div class="m-actions"><button class="btn btn-main" data-act="close">Listo ✔</button></div></div>';
    },
    done: function () {
      return '<div><div class="big-emoji">🏁</div>' +
        '<h2 class="m-title">¡Se acabaron las preguntas!</h2>' +
        '<p class="m-text">Ya se usaron las 7 preguntas. Los espacios de pregunta quedan fuera de juego.</p>' +
        '<div class="m-actions"><button class="btn btn-main" data-act="close">Entendido</button></div></div>';
    }
  };

  function open(type, data, isClosable) {
    closable = !!isClosable;
    body.innerHTML = templates[type](data || {});
    card.className = 'modal-card m-' + type;
    modal.hidden = false;
    // reinicia la animación de entrada
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    body.innerHTML = '';
    closeCb();
  }

  modal.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-act]');
    if (btn) { actionCb(btn.getAttribute('data-act')); return; }
    if (closable && e.target.classList.contains('modal-backdrop')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden && closable) close();
  });

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }

  // Rombos flotantes del fondo
  (function diamonds() {
    const host = document.getElementById('diamonds');
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('div');
      d.className = 'diamond';
      const s = 20 + Math.random() * 70;
      d.style.width = d.style.height = s + 'px';
      d.style.left = (Math.random() * 100) + '%';
      d.style.top = (60 + Math.random() * 60) + '%';
      d.style.animationDuration = (18 + Math.random() * 22) + 's';
      d.style.animationDelay = (-Math.random() * 30) + 's';
      host.appendChild(d);
    }
  })();

  window.LuckyUI = {
    open: open,
    close: close,
    toast: toast,
    isOpen: function () { return !modal.hidden; },
    onAction: function (cb) { actionCb = cb; },
    onClose: function (cb) { closeCb = cb; }
  };
})();
