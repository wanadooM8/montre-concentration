/**
 * Le cadran : construction (points, chiffres romains) et affichage à chaque image
 * (aiguilles, trotteuse, arc de progression, texte au survol).
 */
import { DIAL_CENTER, ARC_RADIUS, ARC_EDGE_RADIUS, ARC_COLORS, HAND_SMOOTHING } from './config.js';
import { formatRemaining, formatClock } from './duration.js';
import { svgEl } from './dom.js';

const ROMANS = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const SUBDIAL_HOUR = 6; // le VI est caché par la petite fenêtre

/** Dessine les 60 points des minutes et les chiffres romains (tournés vers le centre). */
export function buildDial(dotsEl, numeralsEl) {
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    dotsEl.appendChild(svgEl('circle', {
      cx: (196 * Math.sin(a)).toFixed(1),
      cy: (-196 * Math.cos(a)).toFixed(1),
      r: i % 5 === 0 ? 5 : 2.3,
      fill: '#1d1a16',
    }));
  }
  ROMANS.forEach((label, hour) => {
    if (hour === SUBDIAL_HOUR) return;
    const g = svgEl('g', { transform: `rotate(${hour * 30}) translate(0 -150)` });
    const text = svgEl('text', {
      class: 'numeral',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      transform: 'scale(.82 1.12)', // chiffres étroits et hauts, comme sur l'illustration
    });
    text.textContent = label;
    g.appendChild(text);
    numeralsEl.appendChild(g);
  });
}

/** Chemin SVG d'un arc partant de XII, couvrant `frac` (0 à 1) du cadran. */
export function arcPath(r, frac) {
  if (frac <= 0) return '';
  if (frac >= 0.9999) return `M 0 ${-r} A ${r} ${r} 0 1 1 -0.01 ${-r} Z`;
  const a = frac * 2 * Math.PI;
  const x = (r * Math.sin(a)).toFixed(2);
  const y = (-r * Math.cos(a)).toFixed(2);
  return `M 0 ${-r} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y}`;
}

/** Interpole de l'angle `from` vers `to` par le plus court chemin (t de 0 à 1). */
function lerpAngle(from, to, t) {
  to += 360 * Math.round((from - to) / 360);
  return from + (to - from) * t;
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Progression par image de la transition entre les modes (≈ 0,3 s à 60 images/s). */
const MODE_BLEND_STEP = 0.05;

/** Angle (degrés, 0 = XII, sens horaire) du pointeur par rapport au centre du cadran. */
export function pointerAngle(svg, event) {
  const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
  return (Math.atan2(pt.x - DIAL_CENTER.x, -(pt.y - DIAL_CENTER.y)) * 180) / Math.PI;
}

/**
 * Affichage du cadran. render() est appelée à chaque image ; pour rester léger,
 * un attribut n'est réécrit dans le DOM que si sa valeur a changé.
 */
export class DialView {
  /** @param {Record<string, Element>} els éléments SVG du cadran (voir main.js) */
  constructor(els) {
    this.els = els;
    this.remainingMin = 0; // temps restant lissé (minutes), suit l'arc
    this.minAngle = 0;     // angles affichés des aiguilles (degrés)
    this.hourAngle = 0;
    // Transition douce quand on passe d'un mode à l'autre (et au démarrage).
    this.lastWatchMode = null;
    this.blend = 1;
    this.blendFrom = { min: 0, hour: 0 };
    this.cache = new Map();
    this.flashTimer = 0;
  }

  set(el, attr, value) {
    const key = el.id + '.' + attr;
    if (this.cache.get(key) === value) return;
    this.cache.set(key, value);
    if (attr === 'text') el.textContent = value;
    else el.setAttribute(attr, value);
  }

  /**
   * @param {object} p
   * @param {number}  p.remainingMs  temps restant de la phase
   * @param {string}  p.status       état du minuteur
   * @param {boolean} p.isBreak      pause Pomodoro en cours
   * @param {boolean} p.watchMode    mode montre : aiguilles à l'heure réelle
   * @param {boolean} p.dragging     une aiguille est tenue : pas de lissage
   */
  render({ remainingMs, status, isBreak, watchMode, dragging }) {
    const { els } = this;
    const now = new Date();

    // Temps restant lissé : les aiguilles tournent en douceur après un réglage.
    const target = remainingMs / 60000;
    const d = target - this.remainingMin;
    this.remainingMin = dragging || Math.abs(d) < 0.01 ? target : this.remainingMin + d * HAND_SMOOTHING;

    // Aiguilles : temps restant lu comme une heure (1:30 = 1 h 30 restante),
    // ou heure réelle en mode montre. Le lissage vient de remainingMin :
    // les angles en découlent directement, sans second lissage (qui ferait
    // tourner l'aiguille à l'envers lors d'un grand saut de durée).
    let minTarget;
    let hourTarget;
    if (watchMode) {
      const m = now.getMinutes() + now.getSeconds() / 60;
      minTarget = m * 6;
      hourTarget = ((now.getHours() % 12) + m / 60) * 30;
    } else {
      minTarget = this.remainingMin * 6;
      hourTarget = this.remainingMin / 2;
    }

    // Changement de mode : les aiguilles glissent de leur position vers la nouvelle.
    if (watchMode !== this.lastWatchMode) {
      this.lastWatchMode = watchMode;
      this.blend = 0;
      this.blendFrom = { min: this.minAngle, hour: this.hourAngle };
    }
    if (this.blend < 1 && !dragging) {
      this.blend = Math.min(1, this.blend + MODE_BLEND_STEP);
      const t = easeInOut(this.blend);
      this.minAngle = lerpAngle(this.blendFrom.min, minTarget, t);
      this.hourAngle = lerpAngle(this.blendFrom.hour, hourTarget, t);
    } else {
      this.blend = 1;
      this.minAngle = minTarget;
      this.hourAngle = hourTarget;
    }
    const minRot = `rotate(${this.minAngle.toFixed(2)})`;
    const hourRot = `rotate(${this.hourAngle.toFixed(2)})`;
    this.set(els.minuteHand, 'transform', minRot);
    this.set(els.minuteHit, 'transform', minRot);
    this.set(els.hourHand, 'transform', hourRot);
    this.set(els.hourHit, 'transform', hourRot);

    // Trotteuse : secondes réelles, 8 battements par seconde comme une montre mécanique.
    const beats = Math.floor(((Date.now() % 60000) / 1000) * 8);
    this.set(els.secondHand, 'transform', `rotate(${(beats / 8) * 6})`);

    // Arc : la part restante du cadran, de XII à la grande aiguille (masqué en mode montre).
    const frac = watchMode ? 0 : Math.min(1, this.remainingMin / 60);
    const fracKey = frac.toFixed(4);
    this.set(els.arc, 'd', arcPath(ARC_RADIUS, +fracKey));
    this.set(els.arcEdge, 'd', arcPath(ARC_EDGE_RADIUS, +fracKey));
    this.set(els.arc, 'stroke', isBreak ? ARC_COLORS.break : ARC_COLORS.focus);
    this.set(els.arc, 'stroke-opacity', status === 'paused' ? '0.45' : '0.8');

    // Texte au survol : heure en mode montre, sinon temps restant.
    let readout;
    if (watchMode) readout = formatClock(now);
    else readout = status === 'done' ? 'terminé' : formatRemaining(remainingMs);
    this.set(els.readout, 'text', readout);
    els.paused.classList.toggle('show', !watchMode && status === 'paused');
  }

  /** Affiche le texte central un court instant (après un réglage). */
  flashReadout(ms = 1200) {
    this.els.readout.classList.add('show');
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.els.readout.classList.remove('show'), ms);
  }
}
