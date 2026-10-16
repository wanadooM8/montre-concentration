# Montre de concentration

Une petite montre de gousset posée sur le bureau Windows, dans un style d'animation japonaise dessinée à la main : boîtier doré, lierre et fleurs autour du boîtier, et une petite boule de suie qui cligne des yeux.

Elle sert de minuteur de concentration, et peut aussi devenir une simple montre avec la météo en direct.

## Fonctionnalités

- **Minuteur de concentration** : les aiguilles et l'arc vert montrent le temps restant, de 1 min à 12 h.
- **Réglage de la durée** de trois façons : en tournant les aiguilles, en tournant la couronne (molette ou glisser), ou par le menu du clic droit (25, 45 ou 60 min, ou une durée libre comme « 2h30 »).
- **Mode Pomodoro** : une pause de 5 min après chaque session, et de 15 min toutes les 4 sessions.
- **Mode montre** : les aiguilles donnent l'heure réelle.
- **Trotteuse** qui tourne en continu, avec le mouvement saccadé d'une montre mécanique.
- **Météo en direct** dans la petite fenêtre du cadran, avec des icônes animées (soleil, nuages, pluie, neige, orage, brouillard).
- **Musique de fond** : le petit bouton à note sur le cadran lance ou arrête, en boucle, une musique choisie sur votre ordinateur (audio ou vidéo). Aucune musique n'est fournie avec l'appli.
- **Fin de session** : carillon doux (son synthétisé) et pétales qui tombent.
- **Fenêtre transparente**, toujours au premier plan, qu'on déplace en tenant le boîtier. Sa position est mémorisée.
- **Icône près de l'horloge Windows** : clic gauche pour afficher ou cacher la montre, clic droit pour le menu.
- **Trois tailles** : petite, moyenne, grande.

## Installation

Télécharge l’installateur `Montre-de-concentration_<version>_x64-setup.exe` depuis la page [Releases](../../releases), puis lance-le. L'installation se fait pour ton seul compte Windows et ne demande pas de droits administrateur. Windows SmartScreen peut afficher un avertissement, car l’installateur n’est pas signé : clique sur « Informations complémentaires », puis « Exécuter quand même ».

Il faut Windows 10 ou 11, avec WebView2 (déjà présent sur Windows 11).

## Utilisation

| Action | Effet |
|---|---|
| Clic sur le cadran | Démarrer / mettre en pause |
| Double-clic sur le cadran | Réinitialiser |
| Tourner la grande aiguille | Régler les minutes |
| Tourner la petite aiguille | Régler les heures |
| Molette ou glisser sur la couronne | Régler la durée par crans |
| Survol | Afficher le temps restant (ou l'heure) |
| Glisser le boîtier | Déplacer la montre |
| Clic droit | Menu : mode, durée, Pomodoro, ville de la météo, musique, taille, quitter |

## Développement

L'interface est en HTML, CSS et JavaScript (modules ES, sans outil de construction). L'enveloppe Windows utilise [Tauri 2](https://tauri.app).

```
src/              interface (s'ouvre aussi dans un navigateur)
  index.html      structure SVG de la montre
  css/watch.css   styles
  js/             minuteur, cadran, interactions, météo, menu…
  assets/         illustration détourée de la montre
src-tauri/        enveloppe de bureau (fenêtre, icône près de l'horloge)
design/           images sources
```

**Prérequis :** Rust, Node.js et les Build Tools Visual Studio (outils C++ et SDK Windows).

```bash
npm install
npm run dev      # lance l'appli en mode développement
npm run build    # produit l'installateur dans src-tauri/target/release/bundle/nsis/
```

Pour voir l'interface dans un navigateur, sers le dossier avec n'importe quel serveur statique, puis ouvre `src/index.html` :

```bash
python -m http.server 8765
```

## Crédits

- Données météo : [Open-Meteo](https://open-meteo.com), sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Police : [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (SIL Open Font License).
- Illustration de la montre : générée par IA dans le style des films d'animation japonais. Ce projet n'a aucun lien avec le Studio Ghibli.

## Licence

Le code est distribué sous licence [MIT](LICENSE). Les données météo et la police gardent leurs propres licences (voir Crédits).
