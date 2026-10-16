/**
 * Point d'entrée : relie le cadran, le minuteur, la météo et le menu,
 * puis lance la boucle d'affichage.
 */
import { SIZES, PRESET_DURATIONS, MIN_DURATION, WEATHER_REFRESH_MS } from './config.js';
import { byId } from './dom.js';
import { settings, setSetting } from './settings.js';
import { parseDuration, formatDuration } from './duration.js';
import { timer, toggle, reset, setDuration, remainingMs, update } from './timer.js';
import { buildDial, DialView } from './dial.js';
import { setupInteractions } from './interactions.js';
import { chime } from './sound.js';
import { dropPetals, startBlinking, startStormFlashes } from './effects.js';
import { setupContextMenu } from './ui/menu.js';
import { ask, setAskHooks } from './ui/ask.js';
import { isApp, setWindowSize, startDragging, closeApp, popupNativeMenu } from './platform.js';
import {
  weather, fetchWeather, findCity, locateDevice, weatherLabel, renderWeather,
} from './weather/weather.js';

/* ---------- Éléments ---------- */

const els = Object.fromEntries([
  'watch', 'dots', 'numerals', 'arc', 'arcEdge', 'readout', 'paused',
  'hourHand', 'minuteHand', 'secondHand', 'dialHit', 'hourHit', 'minuteHit',
  'crownHit', 'crownGlow', 'sky', 'wIcon', 'wFlash', 'userScene', 'userBgImg',
  'menu', 'filePick', 'hint', 'case',
].map((id) => [id, byId(id)]));

/**
 * Dans l'appli, la fenêtre épouse la montre : on recadre le dessin sur la montre
 * (sans les marges vides de l'illustration) et la fenêtre prend ces proportions.
 */
const APP_VIEWBOX = { x: 140, y: 60, width: 710, height: 860 };

/** Taille minimale de la fenêtre pendant une saisie (la fenêtre de saisie fait 240 px). */
const ASK_WINDOW = { width: 280, height: 230 };

const HINTS = {
  focus: 'Clic : démarrer / pause · Double-clic : réinitialiser · '
    + 'Tourner les aiguilles, ou molette / glisser sur la couronne : régler la durée · Clic droit : menu',
  watch: 'Mode montre : heure réelle et météo · Clic droit : menu',
};

/* ---------- Réglages d'affichage ---------- */

function setMode(mode) {
  setSetting('mode', mode);
  document.body.classList.toggle('watch-mode', mode === 'watch');
  els.hint.textContent = HINTS[mode];
}

/** Taille de la fenêtre de l'appli pour la taille de montre choisie. */
function appWindowSize(size) {
  const scale = SIZES[size] / 1000; // SIZES = largeur de l'illustration entière
  return { width: APP_VIEWBOX.width * scale, height: APP_VIEWBOX.height * scale };
}

function setSize(size) {
  setSetting('size', size);
  els.watch.style.setProperty('--size', `${SIZES[size]}px`);
  if (isApp) {
    const { width, height } = appWindowSize(size);
    els.watch.style.setProperty('--app-width', `${width}px`);
    setWindowSize(width, height);
  }
}

/** Image choisie pour la petite fenêtre (à la place de la météo), ou null. */
let backgroundUrl = null;
function setBackground(url) {
  if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
  backgroundUrl = url;
  if (url) els.userBgImg.setAttribute('href', url);
  els.userScene.setAttribute('opacity', url ? 1 : 0);
}
els.filePick.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) setBackground(URL.createObjectURL(file));
  e.target.value = ''; // permet de rechoisir la même image
});

/* ---------- Météo ---------- */

async function refreshWeather() {
  await fetchWeather(settings.place);
  renderWeather(els.sky, els.wIcon);
}

function setPlace(place) {
  setSetting('place', place);
  weather.loaded = false;
  refreshWeather();
}

function askCity() {
  const current = settings.place && settings.place.name !== 'Ma position' ? settings.place.name : '';
  ask('Ville pour la météo', current, async (name) => {
    try {
      const city = await findCity(name);
      if (!city) return `Ville introuvable : ${name}`;
      setPlace(city);
    } catch {
      return 'Impossible de joindre le service météo.';
    }
  });
}

/** Utilise la position de l'appareil ; si elle est refusée, propose de choisir une ville. */
async function useDevicePosition({ silent = false } = {}) {
  const place = await locateDevice();
  if (place) setPlace(place);
  else if (!silent) askCity();
}

/* ---------- Menu du clic droit ---------- */

function askCustomDuration() {
  ask('Durée : 90, 2h30… (jusqu’à 12h)', formatDuration(settings.duration), (text) => {
    const min = parseDuration(text);
    if (!min || min < MIN_DURATION) return 'Exemples : 25, 90, 2h30.';
    setDuration(min);
    view.flashReadout();
  });
}

function menuItems() {
  const watchMode = settings.mode === 'watch';
  const items = [
    { label: 'Mode' },
    { text: 'Concentration', mark: !watchMode, act: () => setMode('focus') },
    { text: 'Montre', mark: watchMode, act: () => setMode('watch') },
    { sep: true },
  ];

  if (!watchMode) {
    items.push(
      { label: 'Durée' },
      ...PRESET_DURATIONS.map((min) => ({
        text: `${min} min`,
        mark: settings.duration === min,
        act: () => { setDuration(min); view.flashReadout(); },
      })),
      { text: 'Personnalisée…', act: askCustomDuration },
      { sep: true },
      { text: timer.status === 'running' ? 'Pause' : 'Démarrer', act: toggle },
      { text: 'Réinitialiser', act: reset },
      { sep: true },
      { text: 'Mode Pomodoro', mark: settings.pomodoro, act: () => setSetting('pomodoro', !settings.pomodoro) },
      { sep: true },
    );
  }

  items.push(
    { label: weatherLabel(settings.place) },
    { text: 'Ville de la météo…', act: askCity },
    { text: 'Utiliser ma position', act: () => useDevicePosition() },
    { sep: true },
    { label: 'Petite fenêtre' },
    { text: 'Météo en direct', mark: !backgroundUrl, act: () => setBackground(null) },
    { text: 'Image officielle…', mark: !!backgroundUrl, act: () => els.filePick.click() },
    { label: 'Taille' },
    ...Object.keys(SIZES).map((size) => ({
      text: size[0].toUpperCase() + size.slice(1),
      mark: settings.size === size,
      act: () => setSize(size),
    })),
    { sep: true },
    // Dans le navigateur, « Quitter » cache simplement la montre.
    { text: 'Quitter', act: () => (isApp ? closeApp() : (els.watch.style.display = 'none')) },
  );
  return items;
}

/* ---------- Spécificités de l'appli de bureau ---------- */

function setupApp() {
  document.documentElement.classList.add('app');
  const { x, y, width, height } = APP_VIEWBOX;
  els.watch.querySelector('svg').setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

  // Le boîtier sert de poignée pour déplacer la montre sur le bureau.
  els.case.addEventListener('pointerdown', (e) => {
    if (e.button === 0) startDragging();
  });

  // La fenêtre s'agrandit le temps d'une saisie, puis reprend la taille de la montre.
  setAskHooks({
    onOpen: async () => {
      const { width, height } = appWindowSize(settings.size);
      await setWindowSize(Math.max(width, ASK_WINDOW.width), Math.max(height, ASK_WINDOW.height));
    },
    onClose: () => setSize(settings.size),
  });
}

/* ---------- Boucle d'affichage ---------- */

const view = new DialView(els);
let interactions;

/** Fin d'une phase : carillon, et pétales à la fin d'une session de concentration. */
function onPhaseEnd(event) {
  if (event === 'focusEnd') {
    chime();
    dropPetals(els.watch);
  } else {
    chime(true);
  }
}

function frame() {
  const event = update();
  if (event) onPhaseEnd(event);
  view.render({
    remainingMs: remainingMs(),
    status: timer.status,
    isBreak: timer.phase === 'break',
    watchMode: settings.mode === 'watch',
    dragging: interactions.isDragging(),
  });
  requestAnimationFrame(frame);
}

/* ---------- Démarrage ---------- */

if (isApp) setupApp();
buildDial(els.dots, els.numerals);
interactions = setupInteractions({ els, view });
setupContextMenu(els.menu, menuItems, isApp ? popupNativeMenu : null);
startBlinking(document.querySelectorAll('.lid'));
startStormFlashes(els.wFlash, () => weather.kind === 'storm');

setMode(settings.mode);
setSize(settings.size);
renderWeather(els.sky, els.wIcon);
if (settings.place) refreshWeather();
else useDevicePosition({ silent: true }); // au premier lancement, sans insister si c'est refusé
setInterval(refreshWeather, WEATHER_REFRESH_MS);

requestAnimationFrame(frame);
