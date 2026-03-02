/* ============================================================
   Outils Formateur — Overlay page principale (Shadow DOM)
   ============================================================ */

(function () {
  'use strict';

  if (document.getElementById('formatools-host')) return;

  // ---- Constantes SVG ----
  const R             = 52;                         // rayon de l'arc
  const CIRCUMFERENCE = 2 * Math.PI * R;            // ≈ 326.73
  const SVG_NS        = 'http://www.w3.org/2000/svg';

  // ---- Palette ----
  const C = {
    teal:   '#127676',
    orange: '#E4632E',
    jaune:  '#E3A535',
    ink:    '#0D1617',
    paper:  '#F2EFE6',
  };

  // ---- Host Shadow DOM ----
  const host = document.createElement('div');
  host.id = 'formatools-host';
  host.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;' +
    'pointer-events:none;overflow:visible;';

  const shadow = host.attachShadow({ mode: 'closed' });

  // ---- Styles ----
  const style = document.createElement('style');
  style.textContent = `
    #container {
      position: fixed;
      top: 60px;
      right: 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      pointer-events: none;
    }

    /* --- Phase pill --- */
    #phase-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${C.teal};
      color: ${C.paper};
      border: 2px solid ${C.orange};
      border-radius: 999px;
      padding: 6px 16px 6px 12px;
      font-family: 'Impact', 'Arial Narrow', sans-serif;
      white-space: nowrap;
      box-shadow: 0 3px 14px rgba(0,0,0,0.35);
      opacity: 0;
      transform: translateX(12px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    #phase-pill.visible {
      opacity: 1;
      transform: translateX(0);
    }
    #phase-emoji { font-size: 20px; line-height: 1; }
    #phase-label {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    /* --- Timer disc --- */
    #timer-disc {
      opacity: 0;
      transform: scale(0.85) translateX(12px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      filter: drop-shadow(0 4px 18px rgba(0,0,0,0.4));
    }
    #timer-disc.visible {
      opacity: 1;
      transform: scale(1) translateX(0);
    }

    /* Arc animation : 1 seconde linéaire pour lisser les sauts */
    #arc {
      transition: stroke-dashoffset 1.05s linear, stroke 0.4s ease;
    }

    /* --- Parking cards --- */
    .parking-card {
      background: ${C.paper};
      color: ${C.ink};
      border: 2px solid ${C.orange};
      border-left: 5px solid ${C.teal};
      border-radius: 8px;
      padding: 9px 14px;
      max-width: 260px;
      box-shadow: 0 3px 16px rgba(0,0,0,0.25);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.45;
      animation: card-in 0.22s ease;
    }
    .card-header {
      font-family: 'Impact', 'Arial Narrow', sans-serif;
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${C.teal};
      margin-bottom: 5px;
    }

    @keyframes card-in {
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `;

  // ---- Construction du SVG timer ----
  function makeSVG() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('width',  '130');
    svg.setAttribute('height', '130');

    // Piste (cercle fantôme)
    const track = document.createElementNS(SVG_NS, 'circle');
    track.setAttribute('cx', '60'); track.setAttribute('cy', '60');
    track.setAttribute('r', String(R));
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', 'rgba(242,239,230,0.12)');
    track.setAttribute('stroke-width', '7');

    // Arc de progression
    const arc = document.createElementNS(SVG_NS, 'circle');
    arc.setAttribute('cx', '60'); arc.setAttribute('cy', '60');
    arc.setAttribute('r', String(R));
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', C.teal);
    arc.setAttribute('stroke-width', '7');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('transform', 'rotate(-90 60 60)');
    arc.setAttribute('stroke-dasharray',  CIRCUMFERENCE.toFixed(2));
    arc.setAttribute('stroke-dashoffset', '0');
    arc.id = 'arc';

    // Disque intérieur
    const disc = document.createElementNS(SVG_NS, 'circle');
    disc.setAttribute('cx', '60'); disc.setAttribute('cy', '60');
    disc.setAttribute('r', '44');
    disc.setAttribute('fill', C.ink);

    // Texte MM:SS
    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('x', '60'); txt.setAttribute('y', '63');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.setAttribute('fill', C.paper);
    txt.setAttribute('font-family', 'Impact, Haettenschweiler, "Arial Narrow", sans-serif');
    txt.setAttribute('font-size', '26');
    txt.setAttribute('letter-spacing', '1');
    txt.id = 'timer-text';
    txt.textContent = '--:--';

    svg.appendChild(track);
    svg.appendChild(arc);
    svg.appendChild(disc);
    svg.appendChild(txt);

    return { svg, arc, txt };
  }

  // ---- DOM de l'overlay ----
  const container = document.createElement('div');
  container.id = 'container';

  const phasePill = document.createElement('div');
  phasePill.id = 'phase-pill';
  phasePill.innerHTML =
    `<span id="phase-emoji"></span><span id="phase-label"></span>`;

  const timerDisc = document.createElement('div');
  timerDisc.id = 'timer-disc';

  const { svg: timerSVG, arc: arcEl, txt: timerTxtEl } = makeSVG();
  timerDisc.appendChild(timerSVG);

  container.appendChild(phasePill);
  container.appendChild(timerDisc);

  shadow.appendChild(style);
  shadow.appendChild(container);
  document.documentElement.appendChild(host);

  // ---- Références internes ----
  const phaseEmojiEl = shadow.getElementById('phase-emoji');
  const phaseLabelEl = shadow.getElementById('phase-label');

  const ICONS  = { observation: '👀', ecoute: '👂', pratique: '🙌' };
  const LABELS = { observation: 'Observation', ecoute: 'Écoute', pratique: 'Pratique' };

  // map des cartes parking : id → <div>
  const cardMap = new Map();

  // ---- Utilitaires ----
  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function setArc(remaining, total) {
    const fraction = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
    arcEl.setAttribute('stroke-dashoffset',
      (CIRCUMFERENCE * (1 - fraction)).toFixed(2));
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ---- Rendu principal ----
  function render(state) {
    const phase = state?.phase  ?? null;
    const timer = state?.timer  ?? null;
    const items = state?.projectedItems ?? [];

    // --- Phase pill ---
    if (phase) {
      phaseEmojiEl.textContent = ICONS[phase]  ?? '';
      phaseLabelEl.textContent = LABELS[phase] ?? '';
      phasePill.style.display = '';
      requestAnimationFrame(() => phasePill.classList.add('visible'));
    } else {
      phasePill.classList.remove('visible');
      setTimeout(() => { if (!phasePill.classList.contains('visible'))
        phasePill.style.display = 'none'; }, 280);
    }

    // --- Timer disc ---
    const timerActive = timer && timer.state !== null;
    if (timerActive) {
      const rem   = timer.remainingSeconds ?? 0;
      const total = timer.totalSeconds     ?? rem;

      timerTxtEl.textContent = timer.state === 'ended' ? '00:00' : fmt(rem);
      setArc(rem, total);

      // Couleurs
      const warning = timer.state === 'ended' || rem <= 60;
      arcEl.setAttribute('stroke', warning ? C.orange : C.teal);
      timerTxtEl.setAttribute('fill',  warning ? C.jaune  : C.paper);

      timerDisc.style.display = '';
      requestAnimationFrame(() => timerDisc.classList.add('visible'));
    } else {
      timerDisc.classList.remove('visible');
      setTimeout(() => { if (!timerDisc.classList.contains('visible'))
        timerDisc.style.display = 'none'; }, 350);
    }

    // --- Parking cards ---
    const newIds = new Set(items.map(i => i.id));

    // Supprimer les cartes retirées
    for (const [id, el] of cardMap) {
      if (!newIds.has(id)) { el.remove(); cardMap.delete(id); }
    }

    // Ajouter les nouvelles cartes (à la fin du container)
    for (const item of items) {
      if (!cardMap.has(item.id)) {
        const card = document.createElement('div');
        card.className = 'parking-card';
        card.innerHTML =
          `<div class="card-header">❧ Parking Lot</div>` +
          `<div>${escHtml(item.text)}</div>`;
        container.appendChild(card);
        cardMap.set(item.id, card);
      }
    }
  }

  // ---- Lecture initiale ----
  chrome.storage.session.get('formatools', (data) => {
    if (data?.formatools) render(data.formatools);
  });

  // ---- Mises à jour temps réel ----
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session' && changes.formatools)
      render(changes.formatools.newValue);
  });

})();
