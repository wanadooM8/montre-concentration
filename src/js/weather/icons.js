/**
 * Icônes météo en SVG (chaînes de balises), dessinées autour de (0, 0).
 * Formes simples, contour encré épais et couleurs franches,
 * pour rester lisibles même quand la montre est petite.
 */

const INK = '#2f2618';
const SUN = '#f6c945';
const MOON = '#f3e3a0';
const STAR = '#fff6c8';
const CLOUD = { white: '#fdfbf4', grey: '#c3cad1', dark: '#7f8995' };
const RAIN = { light: '#3f86d1', heavy: '#2f74c4' };

const CLOUD_SHAPES = '<circle cx="-10" cy="2" r="8"/><circle cx="0" cy="-4" r="11"/>'
  + '<circle cx="11" cy="1" r="8"/><rect x="-18" y="1" width="37" height="9.5" rx="4.7"/>';

const place = (x, y, s, body) => `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;

/**
 * Nuage : les formes sont tracées une première fois en encre un peu plus épaisse,
 * puis remplies de couleur par-dessus. On obtient un seul contour extérieur propre.
 */
function cloud(x, y, s, fill) {
  return place(x, y, s,
    `<g fill="${INK}" stroke="${INK}" stroke-width="3.4">${CLOUD_SHAPES}</g>`
    + `<g fill="${fill}">${CLOUD_SHAPES}</g>`);
}

function sun(x, y, s) {
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const c = Math.cos(a);
    const si = Math.sin(a);
    rays += `<line x1="${(14 * c).toFixed(1)}" y1="${(14 * si).toFixed(1)}" `
      + `x2="${(20 * c).toFixed(1)}" y2="${(20 * si).toFixed(1)}"/>`;
  }
  return place(x, y, s,
    `<g class="sunRays" stroke="${INK}" stroke-width="3.2" stroke-linecap="round">${rays}</g>`
    + `<circle r="10.5" fill="${SUN}" stroke="${INK}" stroke-width="2.2"/>`);
}

function moon(x, y, s) {
  return place(x, y, s,
    `<path d="M 3 -12 A 12 12 0 1 0 12 5 A 9.5 9.5 0 1 1 3 -12 Z" fill="${MOON}" `
    + `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`);
}

/** Étoile à 4 branches de rayon r. */
function star(x, y, r) {
  const k = r * 0.3;
  return `<path transform="translate(${x} ${y})" fill="${STAR}" d="M 0 ${-r} L ${k} ${-k} L ${r} 0 `
    + `L ${k} ${k} L 0 ${r} L ${-k} ${k} L ${-r} 0 L ${-k} ${-k} Z"/>`;
}

/** Gouttes animées sous le nuage (3 pour la bruine, 4 pour la pluie). */
function drops(count, color) {
  const xs = count === 3 ? [-8, 1, 10] : [-11, -3.5, 4, 11.5];
  return xs.map((x, i) =>
    `<line class="wDrop" style="animation-delay:${(-i * 0.27).toFixed(2)}s" `
    + `x1="${x}" y1="14" x2="${x - 3}" y2="23" stroke="${color}" stroke-width="3.6" stroke-linecap="round"/>`
  ).join('');
}

/** Trois flocons à 6 branches : contour encré puis blanc par-dessus. */
function flakes() {
  const arms = [0, 60, 120]
    .map((a) => `<line x1="0" y1="-4.8" x2="0" y2="4.8" transform="rotate(${a})"/>`)
    .join('');
  return [-9, 0, 9].map((x, i) => {
    const pos = `translate(${x} ${i === 1 ? 22 : 17})`;
    return `<g class="wFlake" style="animation-delay:${(-i * 0.8).toFixed(1)}s">`
      + `<g transform="${pos}" stroke="${INK}" stroke-width="4.2" stroke-linecap="round">${arms}</g>`
      + `<g transform="${pos}" stroke="#ffffff" stroke-width="2" stroke-linecap="round">${arms}</g></g>`;
  }).join('');
}

function fogLines() {
  return [16, 22].map((y, i) =>
    `<line class="wFogLine" style="animation-delay:${-i * 2}s" x1="-16" y1="${y}" x2="16" y2="${y}" `
    + `stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
  ).join('');
}

function bolt() {
  return `<path class="wBoltBlink" d="M 2 6 L -6 18 L 0 18 L -4 28 L 9 13 L 3 13 L 7 6 Z" `
    + `fill="${SUN}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
}

/**
 * Icône pour un type de temps.
 * @param {string} kind clear | partly | overcast | fog | drizzle | rain | snow | storm
 * @param {boolean} night soleil remplacé par la lune et des étoiles
 */
export function weatherIcon(kind, night) {
  switch (kind) {
    case 'clear':
      return night
        ? moon(2, 2, 1.25) + star(-16, -12, 3.5) + star(16, -16, 2.6) + star(-12, 14, 2.2)
        : sun(0, 2, 1.25);
    case 'partly':
      return (night ? moon(-8, -6, 1) + star(16, -14, 2.6) : sun(-8, -6, 0.9))
        + cloud(5, 8, 0.9, CLOUD.white);
    case 'overcast':
      return cloud(-7, -4, 0.8, CLOUD.grey) + cloud(4, 6, 1, CLOUD.white);
    case 'fog':
      return cloud(0, -2, 0.95, CLOUD.grey) + fogLines();
    case 'drizzle':
      return cloud(0, -2, 0.95, CLOUD.white) + drops(3, RAIN.light);
    case 'rain':
      return cloud(0, -2, 0.95, CLOUD.grey) + drops(4, RAIN.heavy);
    case 'snow':
      return cloud(0, -3, 0.95, CLOUD.white) + flakes();
    case 'storm':
      return cloud(0, -3, 1, CLOUD.dark) + bolt();
    default:
      return cloud(0, 0, 1, CLOUD.white);
  }
}
