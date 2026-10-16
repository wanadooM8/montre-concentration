/**
 * Menu contextuel (clic droit).
 *
 * Les entrées sont reconstruites à chaque ouverture par `buildItems()`, pour
 * refléter l'état actuel (coches, libellés). Formes acceptées :
 *   { label: 'Titre' }                             titre de section
 *   { sep: true }                                  séparateur
 *   { text: 'Action', mark?: boolean, act: fn }    entrée cliquable (coche si mark)
 *
 * Si `nativePopup` est fourni (appli de bureau), il affiche un menu natif à la place
 * du menu HTML, qui ne tiendrait pas dans la petite fenêtre de la montre.
 */
export function setupContextMenu(menuEl, buildItems, nativePopup = null) {
  const close = () => {
    menuEl.style.display = 'none';
  };

  const renderItem = (item) => {
    const el = document.createElement('div');
    if (item.sep) {
      el.className = 'sep';
    } else if (item.label) {
      el.className = 'label';
      el.textContent = item.label;
    } else {
      el.className = 'item';
      el.setAttribute('role', 'menuitem');
      const text = document.createElement('span');
      const mark = document.createElement('span');
      text.textContent = item.text;
      mark.textContent = item.mark ? '✓' : '';
      el.append(text, mark);
      el.addEventListener('click', () => {
        close();
        item.act();
      });
    }
    return el;
  };

  const open = (x, y) => {
    menuEl.replaceChildren(...buildItems().map(renderItem));
    menuEl.style.display = 'block';
    // Garde le menu dans la fenêtre.
    const { width, height } = menuEl.getBoundingClientRect();
    menuEl.style.left = `${Math.min(x, innerWidth - width - 8)}px`;
    menuEl.style.top = `${Math.min(y, innerHeight - height - 8)}px`;
  };

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (nativePopup) nativePopup(buildItems());
    else open(e.clientX, e.clientY);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!menuEl.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}
