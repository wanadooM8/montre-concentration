/**
 * Pont vers l'appli de bureau (Tauri).
 *
 * Le même code tourne dans un navigateur (aperçu) et dans l'appli Tauri.
 * Dans l'appli, `window.__TAURI__` est fourni (option app.withGlobalTauri) :
 * on l'utilise pour le menu natif, la taille et le déplacement de la fenêtre,
 * et pour choisir puis lire un fichier de musique sur le disque.
 * Dans le navigateur, ces fonctions ne font rien.
 */

const tauri = window.__TAURI__;

/** Vrai quand la page tourne dans l'appli de bureau. */
export const isApp = Boolean(tauri);

const appWindow = () => tauri.window.getCurrentWindow();

/** Redimensionne la fenêtre (pixels logiques, indépendants de la mise à l'échelle Windows). */
export async function setWindowSize(width, height) {
  if (!isApp) return;
  const LogicalSize = tauri.dpi?.LogicalSize ?? tauri.window.LogicalSize;
  await appWindow().setSize(new LogicalSize(Math.round(width), Math.round(height)));
}

/** Commence à déplacer la fenêtre avec la souris (à appeler sur un appui du bouton). */
export function startDragging() {
  if (isApp) appWindow().startDragging();
}

/** Ferme la fenêtre ; c'est la seule, donc l'appli se termine. */
export function closeApp() {
  if (isApp) appWindow().close();
}

/**
 * Affiche un menu natif à l'emplacement de la souris.
 * Accepte les mêmes entrées que le menu HTML (voir ui/menu.js).
 */
export async function popupNativeMenu(items) {
  const entries = items.map((item) => {
    if (item.sep) return { item: 'Separator' };
    if (item.label) return { text: item.label, enabled: false };
    if (typeof item.mark === 'boolean') return { text: item.text, checked: item.mark, action: item.act };
    return { text: item.text, action: item.act };
  });
  const menu = await tauri.menu.Menu.new({ items: entries });
  await menu.popup();
}

/**
 * Fait choisir un fichier de musique dans une fenêtre Windows.
 * @param {string[]} extensions extensions proposées
 * @returns {Promise<string|null>} chemin du fichier, ou null si annulé
 */
export async function pickFile(title, extensions) {
  const path = await tauri.dialog.open({
    title,
    multiple: false,
    directory: false,
    filters: [{ name: title, extensions }],
  });
  return path ?? null;
}

/** Adresse lisible par la page pour un fichier du disque (protocole « asset » de Tauri). */
export function fileUrl(path) {
  return tauri.core.convertFileSrc(path);
}
