/**
 * Fonctions pures autour des durées : saisie, affichage, crans de la couronne.
 */
import { MIN_DURATION, MAX_DURATION } from './config.js';

const pad2 = (n) => String(n).padStart(2, '0');

/** Ramène une durée (minutes) entre les limites autorisées. */
export function clampDuration(min) {
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, min));
}

/**
 * Lit une durée saisie : "90" → 90, "2h30" / "2 h 30" → 150, "2h" → 120.
 * Renvoie null si le texte n'est pas compris.
 */
export function parseDuration(text) {
  const t = String(text || '').trim().toLowerCase();
  const hours = t.match(/^(\d+)\s*h\s*(\d+)?\s*(min)?$/);
  if (hours) return Number(hours[1]) * 60 + (hours[2] ? Number(hours[2]) : 0);
  const minutes = parseInt(t, 10);
  return Number.isFinite(minutes) ? minutes : null;
}

/** Durée en minutes pour un champ de saisie : 25 → "25", 150 → "2h30", 120 → "2h". */
export function formatDuration(min) {
  if (min < 60) return String(min);
  return Math.floor(min / 60) + 'h' + (min % 60 ? pad2(min % 60) : '');
}

/** Temps restant affiché : "24:59", ou "1:30:00" au-delà d'une heure. */
export function formatRemaining(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 3600) return `${Math.floor(s / 3600)}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}`;
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

/** Heure affichée en mode montre : "09:05". */
export function formatClock(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Durée après un cran de couronne dans le sens `dir` (+1 ou -1).
 * Le pas grandit avec la durée pour atteindre vite les longues sessions :
 * 5 min jusqu'à 1 h, 15 min jusqu'à 3 h, puis 30 min.
 * On s'aligne sur le pas (23 → 25 et non 28).
 */
export function crownStep(min, dir) {
  const ref = dir > 0 ? min : min - 1;
  const step = ref < 60 ? 5 : ref < 180 ? 15 : 30;
  const next = dir > 0
    ? Math.floor(min / step) * step + step
    : Math.ceil(min / step) * step - step;
  return clampDuration(next);
}
