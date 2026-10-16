/**
 * Météo en direct via Open-Meteo (gratuit, sans clé, usage non commercial).
 * La position vient de la ville choisie dans le menu, ou de la géolocalisation.
 */
import { weatherIcon } from './icons.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const LABELS = {
  clear: 'Ciel dégagé', partly: 'Éclaircies', overcast: 'Couvert', fog: 'Brouillard',
  drizzle: 'Bruine', rain: 'Pluie', snow: 'Neige', storm: 'Orage',
};

/** Fond de la petite fenêtre : [jour, nuit]. */
const SKY = {
  clear: ['#8fc8ee', '#24305c'], partly: ['#a9d3ef', '#2a3560'],
  overcast: ['#b4c0ca', '#323a4c'], fog: ['#cfd6db', '#3a4150'],
  drizzle: ['#a6b5c1', '#2d3444'], rain: ['#97a6b3', '#29303f'],
  snow: ['#c9d6e0', '#343d50'], storm: ['#8a95a3', '#23283a'],
};

/** Dernière météo connue. `loaded` passe à true après une réponse réussie. */
export const weather = { kind: 'partly', isDay: true, temp: null, loaded: false };

/** Code météo WMO (renvoyé par Open-Meteo) → type d'icône. */
function kindFromCode(code) {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'partly';
}

/** Met à jour `weather` pour le lieu donné. En cas d'échec, garde l'ancienne icône. */
export async function fetchWeather(place) {
  if (!place) return;
  const url = `${FORECAST_URL}?latitude=${place.lat}&longitude=${place.lon}`
    + '&current=temperature_2m,weather_code,is_day&timezone=auto';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { current } = await res.json();
    weather.kind = kindFromCode(current.weather_code);
    weather.isDay = current.is_day === 1;
    weather.temp = current.temperature_2m;
    weather.loaded = true;
  } catch {
    weather.loaded = false;
  }
}

/**
 * Cherche une ville par son nom.
 * @returns {Promise<{name: string, lat: number, lon: number} | null>} null si introuvable
 * @throws si le service ne répond pas
 */
export async function findCity(name) {
  const res = await fetch(`${GEOCODING_URL}?count=1&language=fr&name=${encodeURIComponent(name)}`);
  const { results } = await res.json();
  if (!results || !results.length) return null;
  return { name: results[0].name, lat: results[0].latitude, lon: results[0].longitude };
}

/** Position de l'appareil (arrondie à ~100 m), ou null si refusée ou indisponible. */
export function locateDevice() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        name: 'Ma position',
        lat: +coords.latitude.toFixed(3),
        lon: +coords.longitude.toFixed(3),
      }),
      () => resolve(null),
      { timeout: 10000 },
    );
  });
}

/** Libellé pour le menu : « Pau : Éclaircies, 17° ». */
export function weatherLabel(place) {
  if (!place) return 'Météo : aucune ville choisie';
  if (!weather.loaded) return `Météo : ${place.name} (chargement…)`;
  return `${place.name} : ${LABELS[weather.kind]}, ${Math.round(weather.temp)}°`;
}

/** Dessine la météo actuelle dans la petite fenêtre. */
export function renderWeather(skyEl, iconEl) {
  const night = !weather.isDay;
  skyEl.setAttribute('fill', SKY[weather.kind][night ? 1 : 0]);
  iconEl.innerHTML = weatherIcon(weather.kind, night);
}
