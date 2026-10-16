/**
 * Petite fenêtre de saisie, dans le style de la montre.
 * Remplace prompt()/alert(), bloqués dans certains navigateurs et webviews.
 */
import { byId } from '../dom.js';

const form = byId('ask');
const input = byId('askInput');
const message = byId('askMsg');

/** Appelés à l'ouverture et à la fermeture (l'appli agrandit sa fenêtre le temps de la saisie). */
const hooks = { onOpen: async () => {}, onClose: () => {} };
export function setAskHooks({ onOpen, onClose }) {
  if (onOpen) hooks.onOpen = onOpen;
  if (onClose) hooks.onClose = onClose;
}

function close() {
  if (form.style.display === 'none') return;
  form.style.display = 'none';
  form.onsubmit = null;
  hooks.onClose();
}

byId('askCancel').addEventListener('click', close);
input.addEventListener('input', () => {
  message.textContent = '';
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') close();
});

/**
 * Ouvre la fenêtre de saisie.
 * @param {string} title question affichée
 * @param {string} value valeur proposée
 * @param {(text: string) => (string | void | Promise<string | void>)} validate
 *   applique la saisie ; renvoie un message d'erreur pour garder la fenêtre ouverte
 */
export async function ask(title, value, validate) {
  await hooks.onOpen();
  byId('askTitle').textContent = title;
  input.value = value || '';
  message.textContent = '';
  form.style.display = 'block';
  input.focus();
  input.select();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) {
      message.textContent = 'Écris une valeur d’abord.';
      return;
    }
    const error = await validate(text);
    if (error) message.textContent = error;
    else close();
  };
}
