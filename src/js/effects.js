/**
 * Petites animations d'ambiance.
 */

const random = (min, max) => min + Math.random() * (max - min);

/** Pétales roses qui tombent de la montre (fin de session). */
export function dropPetals(watchEl, count = 18) {
  const box = watchEl.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.left = `${box.left + box.width * random(0.2, 0.8)}px`;
    petal.style.top = `${box.top + box.height * random(0.25, 0.55)}px`;
    petal.style.setProperty('--dx', `${random(-60, 60)}px`);
    petal.style.animationDuration = `${random(2.5, 4.5)}s`;
    petal.style.animationDelay = `${random(0, 1.2)}s`;
    petal.addEventListener('animationend', () => petal.remove());
    document.body.appendChild(petal);
  }
}

/** La boule de suie cligne des yeux à intervalles irréguliers (2,5 à 7,5 s). */
export function startBlinking(lids) {
  const blink = () => {
    lids.forEach((lid) => {
      lid.classList.remove('blink');
      void lid.getBBox(); // force le navigateur à relancer l'animation
      lid.classList.add('blink');
    });
    setTimeout(blink, random(2500, 7500));
  };
  blink();
}

/** Flashs d'éclair dans la petite fenêtre tant que `isStorm()` est vrai. */
export function startStormFlashes(flashEl, isStorm) {
  const flash = (opacity, at, duration) => {
    setTimeout(() => flashEl.setAttribute('opacity', opacity), at);
    setTimeout(() => flashEl.setAttribute('opacity', 0), at + duration);
  };
  const loop = () => {
    if (isStorm()) {
      flash(0.8, 0, 90);
      flash(0.5, 200, 70); // second éclair plus faible, juste après
    }
    setTimeout(loop, random(4000, 10000));
  };
  loop();
}
