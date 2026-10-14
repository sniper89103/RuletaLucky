/* =========================================================
   CONFIGURACIÓN · Ruleta Lucky
   Aquí se edita todo: preguntas, espacios de la ruleta, tiempos.
   ========================================================= */
window.LUCKY = {
  storageKey: 'lucky-roulette-v1',
  spinDurationMs: 5600,      // duración del giro
  questionSeconds: 30,       // tiempo para responder cada pregunta

  // Las 7 preguntas (se sortean sin repetirse)
  questions: [
    '¿Cuáles son las principales ciudades donde Grupo Lucky tiene presencia?',
    '¿Qué es Grupo Lucky y a qué se dedica?',
    '¿Cuántos años de experiencia tiene Grupo Lucky?',
    '¿Qué tipo de ofertas laborales tiene Grupo Lucky? (menciona mínimo 2)',
    '¿Qué importancia tiene el trabajo en equipo dentro de una empresa?',
    '¿Es importante tener experiencia laboral para comenzar a desarrollar tu carrera profesional?',
    '¿Qué habilidades puedes desarrollar al trabajar en equipo?'
  ],

  // Los 8 espacios de la ruleta (en orden horario desde el puntero)
  // 4 preguntas · 2 stickers · 1 sorpresa · 1 sigue participando
  segments: [
    { type: 'question', lines: ['PREGUNTA'],              icon: '❓', color: '#7A65AB', text: '#FFFFFF' },
    { type: 'sticker',  lines: ['STICKER'],               icon: '🏷️', color: '#F4F1FB', text: '#2A1F4D' },
    { type: 'question', lines: ['PREGUNTA'],              icon: '❓', color: '#5B488C', text: '#FFFFFF' },
    { type: 'retry',    lines: ['SIGUE', 'PARTICIPANDO'], icon: '😢', color: '#1E1833', text: '#FFFFFF' },
    { type: 'question', lines: ['PREGUNTA'],              icon: '❓', color: '#7A65AB', text: '#FFFFFF' },
    { type: 'surprise', lines: ['PREMIO', 'SORPRESA'],    icon: '🎁', color: '#F5B942', text: '#2A1F4D' },
    { type: 'question', lines: ['PREGUNTA'],              icon: '❓', color: '#5B488C', text: '#FFFFFF' },
    { type: 'sticker',  lines: ['STICKER'],               icon: '🏷️', color: '#F4F1FB', text: '#2A1F4D' }
  ],

  confettiColors: ['#7A65AB', '#B9AED6', '#F5B942', '#FFFFFF', '#4ADE9A', '#FF6B7D']
};
