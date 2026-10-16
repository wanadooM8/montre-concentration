/**
 * Petits utilitaires DOM.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export const byId = (id) => document.getElementById(id);

/** Crée un élément SVG avec ses attributs. */
export function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}
