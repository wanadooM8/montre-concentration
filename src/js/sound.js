/**
 * Sons synthétisés avec Web Audio : aucun fichier audio, donc aucun souci de droits.
 * Le contexte audio est créé au premier son (les navigateurs l'exigent après une action).
 */

let ctx = null;

function audio() {
  ctx = ctx || new AudioContext();
  return ctx;
}

/** Joue une note avec une attaque rapide et une extinction exponentielle. */
function note(ac, { freq, type = 'sine', at, volume, decay }) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(gain).connect(ac.destination);
  osc.start(at);
  osc.stop(at + decay + 0.2);
}

/**
 * Carillon de fin : arpège do-mi-sol-do (ou deux notes douces en fin de pause).
 * Chaque note ajoute deux harmoniques inharmoniques pour un timbre de cloche.
 */
export function chime(soft = false) {
  try {
    const ac = audio();
    const notes = soft ? [659.25, 523.25] : [523.25, 659.25, 783.99, 1046.5];
    const volume = soft ? 0.05 : 0.09;
    notes.forEach((freq, i) => {
      const at = ac.currentTime + i * 0.35;
      [1, 2.76, 5.4].forEach((ratio, j) => {
        note(ac, { freq: freq * ratio, at, volume: volume / (j + 1), decay: 2.2 / (j + 1) });
      });
    });
  } catch {
    // Pas de son disponible : la fin reste signalée par l'animation.
  }
}

/** Petit « tic » mécanique à chaque cran de réglage. */
export function tick() {
  try {
    const ac = audio();
    note(ac, { freq: 2400, type: 'square', at: ac.currentTime, volume: 0.025, decay: 0.03 });
  } catch {
    // Pas de son disponible.
  }
}
