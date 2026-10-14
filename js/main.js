/* =========================================================
   MAIN · lógica del juego
   - Elige el espacio ganador (RNG) y luego anima hasta él
   - Las 7 preguntas se barajan y nunca se repiten
   - El progreso se guarda en localStorage (sobrevive a recargas)
   ========================================================= */
(function () {
  const C = window.LUCKY, A = window.LuckyAudio, F = window.LuckyConfetti, UI = window.LuckyUI;
  const $ = (s) => document.querySelector(s);

  const spinBtn = $('#spinBtn'), spinLabel = $('#spinLabel'), wrap = $('#wheelWrap');
  const TOTAL = C.questions.length;
  const modalEl = $('#modal');
  const MIN_S = 5, MAX_S = 120, STEP_S = 5;
  let seconds = (function () {
    try {
      const v = parseInt(localStorage.getItem('lucky-seconds'), 10);
      if (v >= MIN_S && v <= MAX_S) return v;
    } catch (e) {}
    return C.questionSeconds;
  })();

  /* ---------- Estado ---------- */
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function fresh() {
    return { remaining: shuffle(C.questions.map((_, i) => i)), spins: 0, correct: 0, stickers: 0, surprises: 0 };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(C.storageKey));
      if (s && Array.isArray(s.remaining) && s.remaining.length <= TOTAL) return s;
    } catch (e) {}
    return fresh();
  }
  function save() { try { localStorage.setItem(C.storageKey, JSON.stringify(state)); } catch (e) {} }
  let state = load();

  /* ---------- Ruleta ---------- */
  const wheel = new window.LuckyWheel($('#wheel'), C.segments, $('#pointer'));
  wheel.onTick = function () {
    A.tick();
    if (navigator.vibrate) navigator.vibrate(6);
  };

  /* ---------- HUD ---------- */
  function bump(id) {
    const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
  function renderHud() {
    const used = TOTAL - state.remaining.length;
    $('#qLeft').textContent = state.remaining.length;
    const dots = $('#qDots'); dots.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
      const li = document.createElement('li');
      if (i < used) li.className = 'done';
      dots.appendChild(li);
    }
    $('#stSpins').textContent = state.spins;
    $('#stCorrect').textContent = state.correct;
    $('#stStickers').textContent = state.stickers;
    $('#stSurprise').textContent = state.surprises;
    wheel.disabledTypes = { question: state.remaining.length === 0 };
  }

  function setBusy(busy, label) {
    spinBtn.disabled = busy;
    spinLabel.textContent = label || 'GIRAR';
  }

  /* ---------- Giro ---------- */
  function pickSegment() {
    const noQuestions = state.remaining.length === 0;
    const eligible = [];
    C.segments.forEach((s, i) => { if (!(noQuestions && s.type === 'question')) eligible.push(i); });
    return eligible[Math.floor(Math.random() * eligible.length)];
  }

  function spin() {
    if (wheel.spinning || UI.isOpen()) return;
    A.unlock();
    setBusy(true, '...');
    state.spins++; save(); renderHud(); bump('#stSpins');
    A.whoosh();
    wheel.spin(pickSegment(), { duration: C.spinDurationMs, onEnd: onResult });
  }

  /* ---------- Resultados ---------- */
  function onResult(index) {
    const seg = C.segments[index];
    setTimeout(function () { handle(seg); }, 650); // deja ver el espacio ganador
  }

  function handle(seg) {
    switch (seg.type) {
      case 'question': return showQuestion();
      case 'sticker':
        state.stickers++; save(); renderHud(); bump('#stStickers');
        A.win(); F.celebrate(); UI.open('sticker', {}, true);
        break;
      case 'surprise':
        state.surprises++; save(); renderHud(); bump('#stSurprise');
        A.big(); F.celebrate(); setTimeout(function () { F.cannons(80); }, 700);
        UI.open('surprise', {}, true);
        break;
      case 'retry':
        A.sad(); wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
        UI.open('retry', {}, true);
        break;
    }
  }

  /* ---------- Pregunta + temporizador ---------- */
  let timerId = null;
  function stopTimer() { clearInterval(timerId); timerId = null; }

  function showQuestion() {
    const qIdx = state.remaining.shift();     // sale del pozo: no se repite
    save(); renderHud();
    const n = TOTAL - state.remaining.length;
    A.reveal();
    modalEl.classList.remove('danger', 'panic');
    UI.open('question', { n: n, total: TOTAL, text: C.questions[qIdx], seconds: seconds }, false);

    let left = seconds;
    const arc = $('#timerArc'), num = $('#timerNum'), timer = $('#timer'), hint = $('#timerHint');
    const CIRC = 276.46;
    stopTimer();
    timerId = setInterval(function () {
      left--;
      if (num) num.textContent = Math.max(left, 0);
      if (arc) arc.style.strokeDashoffset = (CIRC * (1 - left / seconds)).toFixed(2);
      if (left <= 10 && left > 0) {            // ALERTA: últimos 10 segundos
        if (timer) { timer.classList.add('alert'); if (left <= 5) timer.classList.add('low'); }
        modalEl.classList.add('danger');
        if (left <= 3) { modalEl.classList.add('panic'); if (navigator.vibrate) navigator.vibrate(60); }
        if (num) { num.classList.remove('tick'); void num.offsetWidth; num.classList.add('tick'); }
        if (hint) hint.textContent = '⚠️ ¡Últimos segundos!';
        A.countdown(10 - left);
      }
      if (left <= 0) {
        stopTimer(); A.timeUp();
        if (hint) hint.textContent = '⏰ ¡Se acabó el tiempo!';
        modalEl.classList.remove('panic');
      }
    }, 1000);
  }

  function changeSeconds(act) {
    let v = seconds;
    if (act === 'time-minus') v -= STEP_S;
    else if (act === 'time-plus') v += STEP_S;
    else v = parseInt(act.split(':')[1], 10) || v;
    seconds = Math.min(MAX_S, Math.max(MIN_S, v));
    try { localStorage.setItem('lucky-seconds', String(seconds)); } catch (e) {}
    const val = $('#setVal'); if (val) val.textContent = seconds;
    document.querySelectorAll('.chip-btn').forEach(function (b) {
      b.classList.toggle('on', b.textContent === seconds + 's');
    });
    A.pop();
  }

  UI.onAction(function (act) {
    if (act.indexOf('time-') === 0) { changeSeconds(act); return; }
    if (act === 'correct') {
      stopTimer();
      state.correct++; save(); renderHud(); bump('#stCorrect');
      A.win(); F.celebrate(); UI.open('correct', {}, true);
    } else if (act === 'wrong') {
      stopTimer(); A.pop(); UI.open('wrong', {}, true);
    } else if (act === 'close') {
      A.pop();
      UI.close();
    }
  });

  UI.onClose(function () {
    stopTimer();
    modalEl.classList.remove('danger', 'panic');
    F.clear();
    wheel.winIndex = null;
    if (state.remaining.length === 0 && !state.doneShown) {
      state.doneShown = true; save();
      UI.toast('🏁 Ya se usaron las 7 preguntas');
    }
    setBusy(false);
  });

  /* ---------- Controles ---------- */
  spinBtn.addEventListener('click', spin);
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !e.repeat) { e.preventDefault(); spin(); }
  });

  const btnSound = $('#btnSound');
  function renderSound() {
    btnSound.innerHTML = (A.isMuted() ? '🔇' : '🔊') + ' <span>' + (A.isMuted() ? 'Silenciado' : 'Sonido') + '</span>';
  }
  btnSound.addEventListener('click', function () { A.toggleMute(); renderSound(); if (!A.isMuted()) A.pop(); });
  renderSound();

  $('#btnFull').addEventListener('click', function () {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () { return Promise.resolve(); }).call(document.documentElement).catch(function () {});
    } else {
      document.exitFullscreen();
    }
  });

  const btnTime = $('#btnTime');
  if (btnTime) btnTime.addEventListener('click', function () {
    if (wheel.spinning || UI.isOpen()) return;
    A.unlock(); A.pop();
    UI.open('settings', { seconds: seconds }, true);
  });

  $('#btnReset').addEventListener('click', function () {
    if (wheel.spinning) return;
    if (window.confirm('¿Reiniciar el juego? Se volverán a habilitar las 7 preguntas y el marcador quedará en cero.')) {
      state = fresh(); save(); renderHud();
      UI.toast('🔄 Juego reiniciado');
    }
  });

  renderHud();
  setBusy(false);
})();
