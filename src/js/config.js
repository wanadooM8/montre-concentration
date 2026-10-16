/**
 * Constantes de la montre.
 * Les coordonnées sont celles du viewBox SVG (0 0 1000 1000) de l'illustration.
 */

/** Centre du cadran dans l'illustration détourée. */
export const DIAL_CENTER = { x: 503, y: 596.5 };

/** Rayons de l'arc de progression (bande verte et liseré). */
export const ARC_RADIUS = 165;
export const ARC_EDGE_RADIUS = 181;

/** Durées de concentration, en minutes. 12 h = un tour complet de la petite aiguille. */
export const MIN_DURATION = 1;
export const MAX_DURATION = 12 * 60;
export const DEFAULT_DURATION = 25;
export const PRESET_DURATIONS = [25, 45, 60];

/** Pauses du mode Pomodoro, en minutes : une longue toutes les 4 sessions. */
export const SHORT_BREAK = 5;
export const LONG_BREAK = 15;
export const LONG_BREAK_EVERY = 4;

/** Largeur de la montre à l'écran, en pixels. */
export const SIZES = { petite: 300, moyenne: 420, grande: 600 };

/** Couleurs de l'arc selon la phase. */
export const ARC_COLORS = { focus: '#9cc98a', break: '#3e5c8a' };

/** Fraction parcourue par image vers la cible : lissage des aiguilles. */
export const HAND_SMOOTHING = 0.18;

/** Fréquence de mise à jour de la météo. */
export const WEATHER_REFRESH_MS = 15 * 60 * 1000;

/** Fichiers proposés pour la musique de fond (audio, ou vidéo dont on garde le son). */
export const MUSIC_EXTENSIONS = ['mp3', 'm4a', 'aac', 'ogg', 'opus', 'wav', 'flac', 'mp4', 'webm'];
