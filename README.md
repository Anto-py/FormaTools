# Outils Formateur — Extension Edge

Extension Microsoft Edge pour formateurs techno-pédagogiques.
S'ouvre en **panneau latéral** et projette des informations en temps réel dans la **fenêtre de navigation**.

---

## Fonctionnalités

### 1. Indicateur de phase pédagogique
Signale visuellement à l'audience dans quelle phase de formation on se trouve.

| Phase | Icône |
|---|---|
| Observation / Démonstration | 👀 |
| Écoute / Apport théorique | 👂 |
| Pratique / Activité | 🙌 |

### 2. Compte à rebours
- Durée paramétrable de 1 à 99 minutes
- Démarrer / Pause / Reprendre / Réinitialiser
- Alerte sonore à 1 minute restante
- Signal sonore de fin
- Sons générés via **Web Audio API** — aucun fichier audio, 100 % offline

### 3. Parking Lot
- Capture les questions et idées en suspens sans interrompre le fil de la formation
- Ajout par bouton ou touche `Entrée`
- Chaque question peut être **projetée individuellement** dans la fenêtre de navigation (bouton `▣`)

---

## Overlay dans la fenêtre de navigation

Un overlay en **Shadow DOM** (styles isolés de la page) s'affiche en haut à droite :

- **Phase active** — pill avec icône et label
- **Timer** — disque SVG animé avec arc de progression et décompte MM:SS
- **Questions projetées** — cartes apparaissant au fur et à mesure

L'overlay disparaît automatiquement quand le panneau latéral est fermé.

---

## Installation

L'extension n'est pas publiée sur le store — elle s'installe en mode développeur.

1. Cloner le dépôt
   ```bash
   git clone https://github.com/Anto-py/FormaTools.git
   ```

2. Ouvrir Edge et aller sur `edge://extensions/`

3. Activer le **Mode développeur** (toggle en bas à gauche)

4. Cliquer sur **Charger l'extension non empaquetée**

5. Sélectionner le dossier `extension/`

6. Cliquer sur l'icône de l'extension dans la barre d'outils → le panneau s'ouvre

---

## Structure du projet

```
extension/
├── manifest.json       — Manifest V3
├── background.js       — Service worker (ouverture side panel, accès storage)
├── sidepanel.html      — Interface principale
├── sidepanel.js        — Logique (phases, timer, parking lot, broadcast)
├── sidepanel.css       — Styles (charte rétrofuturisme)
├── content.js          — Overlay Shadow DOM injecté dans la page
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Charte graphique

Style **Rétrofuturisme** — humanité augmentée, années 70, pop-art.

| Variable | Couleur | Rôle |
|---|---|---|
| `--retro-teal` | `#127676` | Structure, navigation, validation |
| `--retro-orange` | `#E4632E` | Actions, erreurs, CTA |
| `--retro-jaune` | `#E3A535` | Hover, highlights, warnings |
| `--retro-ink` | `#0D1617` | Texte principal, fond sombre |
| `--retro-paper` | `#F2EFE6` | Fond clair, zones de lecture |

---

## Contraintes techniques

- **Manifest V3** — Service worker, API `chrome.sidePanel`
- **Zéro dépendance externe** — pas de CDN, pas de framework JS, pas de fichiers audio
- **Offline first** — fonctionne sans connexion internet
- **Shadow DOM** — l'overlay est isolé des styles de chaque page visitée
- **`chrome.storage.session`** — partage d'état en mémoire entre side panel et content script, effacé à la fermeture du navigateur
