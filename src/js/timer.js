/**
 * Minuteur de concentration (et pauses du mode Pomodoro).
 *
 * États : idle (réglé, pas lancé) → running ⇄ paused → done.
 * Phases : focus (concentration) puis, en mode Pomodoro, break (pause) en boucle.
 * Le temps est mesuré avec performance.now(), insensible aux changements d'heure du système.
 */
import { SHORT_BREAK, LONG_BREAK, LONG_BREAK_EVERY } from './config.js';
import { clampDuration } from './duration.js';
import { settings, setSetting } from './settings.js';

export const timer = {
  phase: 'focus',   // 'focus' | 'break'
  status: 'idle',   // 'idle' | 'running' | 'paused' | 'done'
  elapsedMs: 0,     // temps écoulé avant le dernier démarrage
  startedAt: 0,     // performance.now() au dernier démarrage
  focusCount: 0,    // sessions terminées (pour la pause longue)
};

/** Durée totale de la phase en cours, en millisecondes. */
export function phaseDurationMs() {
  if (timer.phase === 'break') {
    const long = timer.focusCount % LONG_BREAK_EVERY === 0;
    return (long ? LONG_BREAK : SHORT_BREAK) * 60000;
  }
  return settings.duration * 60000;
}

export function elapsedMs() {
  return timer.status === 'running'
    ? timer.elapsedMs + (performance.now() - timer.startedAt)
    : timer.elapsedMs;
}

export function remainingMs() {
  if (timer.status === 'done') return 0;
  return Math.max(0, phaseDurationMs() - elapsedMs());
}

export function start() {
  if (timer.status === 'done') reset();
  timer.startedAt = performance.now();
  timer.status = 'running';
}

export function pause() {
  timer.elapsedMs = elapsedMs();
  timer.status = 'paused';
}

export function toggle() {
  if (timer.status === 'running') pause();
  else start();
}

/** Revient au début d'une session de concentration, sans la lancer. */
export function reset() {
  timer.phase = 'focus';
  timer.status = 'idle';
  timer.elapsedMs = 0;
}

/**
 * Règle la durée de concentration (minutes) et la mémorise.
 * Une session en cours continue ; sinon le minuteur repart de zéro avec la nouvelle durée.
 */
export function setDuration(min) {
  setSetting('duration', clampDuration(min));
  if (timer.status !== 'running') reset();
}

/** Démarre une nouvelle phase immédiatement. */
function beginPhase(phase) {
  timer.phase = phase;
  timer.elapsedMs = 0;
  timer.startedAt = performance.now();
  timer.status = 'running';
}

/**
 * À appeler à chaque image : passe à la phase suivante quand le temps est écoulé.
 * Renvoie 'focusEnd' ou 'breakEnd' au moment où une phase se termine, sinon null.
 */
export function update() {
  if (timer.status !== 'running' || elapsedMs() < phaseDurationMs()) return null;

  if (timer.phase === 'break') {
    beginPhase('focus');
    return 'breakEnd';
  }
  timer.focusCount++;
  if (settings.pomodoro) {
    beginPhase('break');
  } else {
    timer.elapsedMs = phaseDurationMs();
    timer.status = 'done';
  }
  return 'focusEnd';
}
