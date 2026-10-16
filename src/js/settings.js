/**
 * Réglages mémorisés d'une ouverture à l'autre (localStorage).
 * Le stockage peut être indisponible (navigation privée…) : on retombe alors
 * sur les valeurs par défaut sans planter.
 */
import { DEFAULT_DURATION } from './config.js';

const PREFIX = 'montre.';

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Stockage indisponible : le réglage vaut pour cette ouverture seulement.
  }
}

export const settings = {
  duration: load('duration', DEFAULT_DURATION), // minutes de concentration
  pomodoro: load('pomodoro', false),            // enchaîner pauses et sessions
  size: load('size', 'moyenne'),                // clé de SIZES
  mode: load('mode', 'focus'),                  // 'focus' (concentration) | 'watch' (montre)
  place: load('place', null),                   // { name, lat, lon } pour la météo
};

/** Change un réglage et le mémorise. */
export function setSetting(key, value) {
  settings[key] = value;
  save(key, value);
}
