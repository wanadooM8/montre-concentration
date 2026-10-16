/**
 * Musique de fond : un fichier choisi par l'utilisateur sur son ordinateur, joué en boucle.
 * Aucune musique n'est fournie avec l'appli (droits d'auteur) : seul le chemin est mémorisé.
 * Une vidéo convient aussi : seul son son est joué.
 */

const player = new Audio();
player.loop = true;
player.preload = 'metadata';

/** Change le fichier joué (adresse lisible par la page), sans le lancer. */
export function setMusic(url) {
  if (player.src.startsWith('blob:')) URL.revokeObjectURL(player.src);
  player.pause();
  player.src = url;
}

export const hasMusic = () => Boolean(player.getAttribute('src'));
export const isPlaying = () => !player.paused;

/**
 * Lance la musique (elle reprend là où elle s'était arrêtée).
 * @returns {Promise<boolean>} faux si le fichier est illisible (déplacé, supprimé…)
 */
export async function playMusic() {
  try {
    await player.play();
    return true;
  } catch {
    return false;
  }
}

export function stopMusic() {
  player.pause();
}

/** Appelle `fn(enLecture)` à chaque lancement ou arrêt. */
export function onMusicChange(fn) {
  player.addEventListener('play', () => fn(true));
  player.addEventListener('pause', () => fn(false));
}
