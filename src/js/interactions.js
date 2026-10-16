/**
 * Interactions à la souris sur la montre :
 * - clic sur le cadran : démarrer / mettre en pause ; double-clic : réinitialiser ;
 * - couronne : molette ou glisser pour régler la durée ;
 * - aiguilles : les faire tourner pour régler la durée.
 * En mode montre, rien de tout cela n'est actif.
 */
import { MIN_DURATION, MAX_DURATION } from './config.js';
import { crownStep } from './duration.js';
import { pointerAngle } from './dial.js';
import { settings } from './settings.js';
import { timer, toggle, reset, setDuration, remainingMs } from './timer.js';
import { tick } from './sound.js';

const DOUBLE_CLICK_DELAY = 230; // ms d'attente avant de traiter un clic simple
const CROWN_PX_PER_STEP = 16;   // déplacement de souris pour un cran de couronne

/**
 * Réglage par les aiguilles :
 * grande aiguille 6° = 1 min (pas de 1 min) ; petite aiguille 30° = 1 h (pas de 5 min).
 */
const HANDS = [
  { id: 'minuteHit', minPerDegree: 1 / 6, step: 1 },
  { id: 'hourHit', minPerDegree: 2, step: 5 },
];

/**
 * @param {object} deps
 * @param {Record<string, Element>} deps.els éléments de la montre
 * @param {import('./dial.js').DialView} deps.view
 * @returns {{ isDragging: () => boolean }}
 */
export function setupInteractions({ els, view }) {
  const isWatchMode = () => settings.mode === 'watch';
  const adjust = (min) => {
    if (min === settings.duration) return;
    setDuration(min);
    view.flashReadout();
    tick();
  };

  /* ---------- Cadran : clic et double-clic ---------- */
  let clickTimer = 0;
  els.dialHit.addEventListener('click', () => {
    if (isWatchMode()) return;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(toggle, DOUBLE_CLICK_DELAY);
  });
  els.dialHit.addEventListener('dblclick', () => {
    if (isWatchMode()) return;
    clearTimeout(clickTimer);
    reset();
    view.flashReadout();
  });

  /* ---------- Couronne ---------- */
  els.crownHit.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isWatchMode()) return;
    adjust(crownStep(settings.duration, e.deltaY < 0 ? 1 : -1));
  }, { passive: false });

  // Glisser vers le haut ou la droite augmente la durée.
  let crownDrag = null;
  els.crownHit.addEventListener('pointerdown', (e) => {
    if (isWatchMode()) return;
    crownDrag = { x: e.clientX, y: e.clientY, used: 0 };
    els.crownGlow.classList.add('active');
    e.currentTarget.setPointerCapture(e.pointerId);
  });
  els.crownHit.addEventListener('pointermove', (e) => {
    if (!crownDrag) return;
    const moved = (crownDrag.y - e.clientY) + (e.clientX - crownDrag.x);
    const steps = Math.trunc((moved - crownDrag.used) / CROWN_PX_PER_STEP);
    if (!steps) return;
    crownDrag.used += steps * CROWN_PX_PER_STEP;
    let min = settings.duration;
    for (let i = 0; i < Math.abs(steps); i++) min = crownStep(min, Math.sign(steps));
    adjust(min);
  });
  const endCrownDrag = () => {
    crownDrag = null;
    els.crownGlow.classList.remove('active');
  };
  els.crownHit.addEventListener('pointerup', endCrownDrag);
  els.crownHit.addEventListener('pointercancel', endCrownDrag);

  /* ---------- Aiguilles ----------
     Les rotations sont cumulées pour pouvoir dépasser XII (sessions de plus d'une heure).
     Saisir une aiguille arrête la session en cours : on règle une nouvelle durée. */
  const svg = els.watch.querySelector('svg');
  let handDrag = null;

  HANDS.forEach(({ id, minPerDegree, step }) => {
    const el = els[id];

    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (isWatchMode()) return;
      clearTimeout(clickTimer);
      const startMin = Math.round(
        timer.status === 'idle' ? settings.duration : remainingMs() / 60000,
      );
      reset();
      setDuration(startMin);
      handDrag = { el, minPerDegree, step, startMin, turned: 0, lastAngle: pointerAngle(svg, e) };
      el.classList.add('dragging');
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!handDrag || handDrag.el !== el) return;
      const angle = pointerAngle(svg, e);
      let delta = angle - handDrag.lastAngle;
      if (delta > 180) delta -= 360; // passage par XII : on garde le plus petit écart
      if (delta < -180) delta += 360;
      handDrag.lastAngle = angle;
      handDrag.turned += delta;
      const raw = handDrag.startMin + handDrag.turned * handDrag.minPerDegree;
      const snapped = Math.round(raw / handDrag.step) * handDrag.step;
      adjust(Math.max(MIN_DURATION, Math.min(MAX_DURATION, snapped)));
      els.readout.classList.add('show');
    });

    const endHandDrag = () => {
      if (!handDrag) return;
      handDrag.el.classList.remove('dragging');
      handDrag = null;
      view.flashReadout();
    };
    el.addEventListener('pointerup', endHandDrag);
    el.addEventListener('pointercancel', endHandDrag);
    // Un clic sur une aiguille ne doit pas démarrer / arrêter le minuteur.
    el.addEventListener('click', (e) => e.stopPropagation());
    el.addEventListener('dblclick', (e) => e.stopPropagation());
  });

  return { isDragging: () => handDrag !== null };
}
