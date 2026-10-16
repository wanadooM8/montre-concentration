# CLAUDE.md

Montre de gousset de bureau pour Windows (Tauri 2) : minuteur de concentration, Pomodoro, mode montre, météo en direct. Dépôt public : https://github.com/wanadooM8/montre-concentration

## Échanges avec l'utilisateur

- Toujours en **français**, ton simple. L'utilisateur n'est pas développeur : expliquer le résultat visible, pas le code.
- Il juge sur le rendu : vérifier visuellement (capture) avant d'annoncer qu'un changement visuel est fait.

## Structure

```
src/                interface, servie telle quelle (pas de bundler, modules ES natifs)
  index.html        SVG de la montre (viewBox 1000×1000 = repère de l'illustration)
  css/watch.css     styles ; .app = appli de bureau, .watch-mode = mode montre
  js/main.js        point d'entrée : câblage, menu, boucle requestAnimationFrame
  js/config.js      constantes (géométrie, durées, tailles, couleurs)
  js/settings.js    réglages persistés (localStorage, préfixe "montre.")
  js/timer.js       minuteur : états idle/running/paused/done, phases focus/break
  js/dial.js        construction du cadran + DialView.render() à chaque image
  js/interactions.js clic cadran, couronne, glisser des aiguilles
  js/platform.js    pont Tauri (window.__TAURI__) ; ne fait rien dans un navigateur
  js/weather/       Open-Meteo (weather.js) et icônes SVG (icons.js)
  js/ui/            menu contextuel HTML, fenêtre de saisie ask()
  assets/montre_base.png  illustration détourée (boîtier, plantes, boule de suie)
src-tauri/          enveloppe Rust : fenêtre, icône de notification, plugin window-state
design/             images sources (référence IA, détourage 2000 px, source des icônes)
```

## Commandes

```bash
npm run dev                      # appli en développement
npm run build                    # installateur NSIS → src-tauri/target/release/bundle/nsis/
cargo build                      # dans src-tauri/ : vérifie juste la compilation Rust
python -m http.server 8765       # aperçu navigateur : http://localhost:8765/src/index.html
```

Prérequis installés sur ce poste : Rust, Node, Build Tools VS 2022 (C++ + SDK Windows), WebView2. `gh` est connecté au compte `wanadooM8`.

## Conventions

- JS : modules ES, `const`, guillemets simples, point-virgule, 2 espaces, camelCase. Rust : rustfmt (4 espaces).
- **Commentaires et textes d'interface en français**, commentaires d'en-tête de module en JSDoc.
- Pas de dépendance JS, pas d'outil de build : le dossier `src/` doit rester ouvrable dans un navigateur.
- Les constantes vont dans `config.js`, les réglages persistés dans `settings.js` (`setSetting`).
- Commits en français ; terminer par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Pièges connus

- **Coordonnées** : tout le dessin est dans le repère de l'illustration. Centre du cadran `DIAL_CENTER = (503, 596.5)`, rayon 211. Le cadran est redessiné par-dessus celui de l'image.
- **Appli vs navigateur** : brancher sur `isApp` (platform.js). Dans l'appli, le viewBox est recadré (`APP_VIEWBOX`) et la fenêtre épouse la montre : un menu HTML ou une fenêtre de saisie ne tiennent pas dedans. D'où le menu natif (`popupNativeMenu`) et l'agrandissement temporaire de la fenêtre pendant `ask()`.
- **Ne jamais utiliser `prompt()` / `alert()`** : bloqués dans le navigateur intégré et les webviews. Utiliser `ask()` (ui/ask.js).
- **Aiguilles** : un seul lissage (`remainingMin` dans DialView). Un second lissage sur les angles les fait tourner à l'envers lors d'un grand saut de durée. Le passage entre modes utilise une transition dédiée (`blend`).
- **Nouvelle permission Tauri** : toute API fenêtre/menu appelée depuis le JS doit être ajoutée à `src-tauri/capabilities/default.json`.
- **Tests dans un onglet en arrière-plan** : le navigateur y ralentit `requestAnimationFrame`, les mesures d'aiguilles sont fausses. Tester la logique en important les modules (`await import('/src/js/timer.js')`, mêmes instances que la page) ou `DialView` avec de faux éléments.
- Les tests touchent le `localStorage` partagé avec l'aperçu de l'utilisateur : noter ses réglages avant et les restaurer après.

## Release

1. Monter la version dans `package.json`, `src-tauri/Cargo.toml` et `src-tauri/tauri.conf.json`.
2. `npm run build`, puis copier l'installateur sous un nom sans espaces (`Montre-de-concentration_<version>_x64-setup.exe`).
3. `gh release create v<version> <installateur> --title ... --notes-file ...` (notes en français, rappeler l'avertissement SmartScreen : l'installateur n'est pas signé).

## Points d'attention

- L'illustration (style Ghibli, boule de suie proche des films) est publique : risque de droits signalé à l'utilisateur. Ne pas ajouter de personnages ou d'éléments repris des films.
- Météo : Open-Meteo, gratuit pour un usage non commercial, attribution CC BY 4.0 dans le README.
- Licence du code : MIT.
