# CLAUDE.md — Extension Edge : Outils Formateur Techno-Pédagogique

## Contexte projet

Extension Microsoft Edge destinée à un formateur techno-pédagogique. Elle s'ouvre sous forme de **panneau latéral** (side panel) au clic sur l'icône de l'extension. Elle est conçue pour être **projetée à l'écran** en formation : lisibilité maximale, friction minimale, zéro chargement externe.

---

## Architecture générale

- **Type :** Extension Edge (Manifest V3)
- **Interface :** Side Panel (API `chrome.sidePanel`)
- **Fichiers principaux :**
  - `manifest.json`
  - `sidepanel.html` — interface principale
  - `sidepanel.js` — logique
  - `sidepanel.css` — styles (charte graphique à intégrer séparément)
  - `background.js` — gestion ouverture side panel au clic icône
  - `/sounds/` — fichiers audio (alerte 1min, fin de timer)

---

## Fonctionnalités

### 1. Indicateur de phase pédagogique

**Rôle :** Signaler visuellement à l'audience dans quelle phase on se trouve.

**3 phases :**
| Phase | Icône | Label |
|---|---|---|
| Observation / Démonstration | 👀 | Observation |
| Écoute / Apport théorique | 👂 | Écoute |
| Pratique / Activité | 🙌 | Pratique |

**Comportement :**
- 3 boutons toujours visibles
- La phase active est mise en surbrillance (style `active`)
- Les phases inactives sont atténuées (style `inactive`)
- Un seul état actif à la fois
- Pas de phase sélectionnée par défaut au démarrage
- La phase active persiste tant qu'on n'en choisit pas une autre

---

### 2. Compte à rebours paramétrable

**Rôle :** Gérer le temps des activités de façon visible.

**Paramètre unique :** durée en minutes (input numérique, min: 1, max: 99)

**États :**
- `idle` — formulaire affiché, timer non démarré
- `running` — décompte actif, affichage grand format MM:SS
- `ended` — timer terminé, état visuel de fin

**Comportement :**
- Boutons : Démarrer / Pause / Reprendre / Réinitialiser
- À **1 minute restante** : jouer `sounds/alerte.mp3` + changement visuel (ex: couleur orange)
- À **0:00** : jouer `sounds/fin.mp3` + changement visuel marqué (ex: rouge, clignotement bref)
- Après la fin, le bouton Réinitialiser ramène à l'état `idle`

**Sons synthétisés via Web Audio API** (aucun fichier externe, 100% offline) :

```javascript
function playAlert() {
  // Alerte 1min : bip doux, discret
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
}

function playEnd() {
  // Fin de timer : 3 bips descendants, plus marqués
  const ctx = new AudioContext();
  [520, 440, 360].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.35;
    gain.gain.setValueAtTime(0.4, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}
```

---

### 3. Parking Lot

**Rôle :** Capturer les questions et idées en suspens sans interrompre le fil de la formation.

**Comportement :**
- Champ texte + bouton "Ajouter"
- Validation aussi au `Enter`
- Chaque entrée s'affiche sous forme de carte/item dans une liste
- Chaque item a un bouton de suppression (❌ ou icône poubelle)
- Les items persistent pendant toute la session (pas besoin de persistance entre sessions)
- Pas de limite imposée au nombre d'items
- Ordre d'affichage : chronologique (le plus récent en bas)

---

## UX & Contraintes d'affichage

- Le panneau est **projeté à l'écran** : tailles de police généreuses (min 16px pour le contenu, 48px+ pour le timer)
- **Pas de scroll horizontal**
- Les 3 sections sont toujours visibles sans scroll si possible (layout flex colonne avec sections compactes)
- Si le panneau est trop court, le parking lot est scrollable en interne
- **Zéro dépendance externe** : pas de CDN, pas d'API distante, pas de framework JS lourd
- Vanilla JS uniquement (ou module ES natif)

---

## Charte graphique

> ⚠️ À définir et intégrer dans `sidepanel.css` par l'utilisateur.
> Le code doit utiliser des **variables CSS** pour toutes les couleurs et typographies afin de faciliter la personnalisation.

```css
:root {
  --color-primary: /* à définir */;
  --color-accent: /* à définir */;
  --color-bg: /* à définir */;
  --color-text: /* à définir */;
  --color-phase-active: /* à définir */;
  --color-phase-inactive: /* à définir */;
  --color-timer-warning: /* à définir */; /* 1min restante */
  --color-timer-end: /* à définir */;    /* temps écoulé */
  --font-main: /* à définir */;
  --font-display: /* à définir */;       /* pour le timer */
}
```

---

## Structure des fichiers

```
extension/
├── manifest.json
├── background.js
├── sidepanel.html
├── sidepanel.js
├── sidepanel.css
└── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## manifest.json — points clés

```json
{
  "manifest_version": 3,
  "name": "Outils Formateur",
  "version": "1.0",
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "Outils Formateur"
  }
}
```

`background.js` doit appeler `chrome.sidePanel.open()` sur `chrome.action.onClicked`.

---

## Comportements à ne PAS implémenter (hors scope v1)

- Synchronisation entre onglets ou appareils
- Persistance des données entre sessions (localStorage ou autre)
- Sélection de texte depuis la page web vers le parking lot
- Phases enchaînées dans le timer
- Thèmes multiples switchables
- Export du parking lot

---

## Critères de qualité

- [ ] Le panneau s'ouvre instantanément au clic sur l'icône
- [ ] Le timer est lisible à 3 mètres de l'écran
- [ ] Le changement de phase prend moins de 1 clic
- [ ] L'ajout d'un item au parking lot prend moins de 5 secondes
- [ ] Aucune erreur console en utilisation normale
- [ ] Fonctionne sans connexion internet

##RETROFuturisme — Charte Graphique v3.0 (Claude Code CLI)

### Contexte d'usage

Ce fichier est conçu pour **Claude Code CLI** (2026). Contrairement aux artefacts claude.ai :
- Les fichiers externes peuvent être importés (Google Fonts, CSS, JS)
- Les assets peuvent être générés sur disque (SVG, CSS, HTML, PPTX, PDF...)
- Les dépendances npm/pip sont disponibles
- Plusieurs fichiers peuvent être créés et liés entre eux

---

### Déclencheurs

Appliquer cette charte quand l'utilisateur mentionne :
`retrofuturisme` · `retrofuturiste` · `charte retro` · `style retro`  
ou demande un visuel, une interface, une présentation, un document dans cet univers.

---

### Concept

Humanité augmentée, confiante, calme et déterminée dans un monde techno-futuriste  
inspiré du **pop-art** et des **années 70**.

**Mood** : Puissance tranquille · chaleur radiale · harmonie machine/humain

---

### Palette

```css
--retro-teal:   #127676   /* Techno, calme, intelligence — VALIDATION, STRUCTURE */
--retro-orange: #E4632E   /* Énergie, attention — ACTION, ERREUR, CTA */
--retro-jaune:  #E3A535   /* Lumière, optimisme — BONUS, HOVER, HIGHLIGHT */
--retro-ink:    #0D1617   /* Profondeur — TEXTE PRINCIPAL, FOND SOMBRE */
--retro-paper:  #F2EFE6   /* Humanité — FOND CLAIR, ZONES DE LECTURE */
```

#### Architecture chromatique : règle 60-30-10

| Proportion | Couleur | Rôle |
|---|---|---|
| 60% | `paper` ou `ink` | Fond principal, zones de contenu |
| 30% | `teal` | Structure, navigation, bordures, titres |
| 10% | `orange` + `jaune` | Points focaux, actions, highlights |

#### Règle d'or

**Toujours associer au moins une couleur froide (teal/ink) et une chaude (orange/jaune)** dans chaque composition.

---

### Typographie

```css
/* Google Fonts — importables dans un projet Claude Code */
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;700&family=Inter:wght@400;600&display=swap');

/* Titres */
font-family: 'Anton', 'Oswald', Impact, sans-serif;
text-transform: uppercase;
letter-spacing: 0.1em;

/* Corps */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Contraste minimum** : 4.5:1 (texte normal), 3:1 (texte large ≥18px bold).  
⚠️ `paper` sur `orange` = 4.3:1 — utiliser uniquement pour texte ≥18px bold, ou préférer `ink`.

---

### CSS de base (fichier `retro-base.css` à générer)

```css
:root {
  --retro-teal:   #127676;
  --retro-orange: #E4632E;
  --retro-jaune:  #E3A535;
  --retro-ink:    #0D1617;
  --retro-paper:  #F2EFE6;

  --retro-state-success:  var(--retro-teal);
  --retro-state-error:    var(--retro-orange);
  --retro-state-warning:  var(--retro-jaune);
  --retro-state-disabled: rgba(13, 22, 23, 0.4);
}

/* Bouton pill */
.retro-btn-pill {
  display: inline-flex;
  border-radius: 50px;
  border: 3px solid var(--retro-teal);
  overflow: hidden;
  cursor: pointer;
}
.retro-btn-pill .label {
  background: var(--retro-jaune);
  color: var(--retro-ink);
  padding: 0.75rem 2rem;
  font-family: 'Oswald', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.retro-btn-pill .icon {
  background: var(--retro-orange);
  color: var(--retro-paper);
  width: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

/* Carte */
.retro-card {
  background: var(--retro-paper);
  border: 3px solid var(--retro-teal);
  border-radius: 24px 8px 24px 8px;
  box-shadow: inset 0 0 0 2px var(--retro-orange);
  padding: 1.5rem;
}

/* Cadre de page */
.page-frame {
  background: var(--retro-paper);
  border: 4px solid var(--retro-orange);
  min-height: calc(100vh - 24px);
  margin: 12px;
  padding: 40px;
  position: relative;
}

/* Séparateur */
.retro-separator {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 40px 0;
  color: var(--retro-teal);
}
.retro-separator::before,
.retro-separator::after {
  content: '';
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--retro-teal) 20%, var(--retro-teal) 80%, transparent);
}

/* Feedback */
.feedback-success { background: rgba(18,118,118,0.1); border-left: 4px solid var(--retro-teal); padding: 1rem; }
.feedback-error   { background: rgba(228,99,46,0.1);  border-left: 4px solid var(--retro-orange); padding: 1rem; }
.feedback-warning { background: rgba(227,165,53,0.15); border-left: 4px solid var(--retro-jaune); padding: 1rem; }
```

---

### Cohérence sémantique

| État | Couleur | Jamais |
|---|---|---|
| Succès / Correct | `teal` | orange, jaune |
| Erreur / Incorrect | `orange` | teal, jaune |
| Avertissement / Nuance | `jaune` | teal pour erreur |
| Action principale (CTA) | `orange` + `jaune` | paper seul |
| Hover / Focus | `jaune` | ink (trop froid) |
| Désactivé | `ink` 40% opacité | orange (confusion avec action) |

---

### Instructions par type de sortie

#### Pages web / HTML

1. Créer `retro-base.css` avec les variables et composants ci-dessus
2. Importer Google Fonts via `<link>` dans `<head>`
3. Appliquer la structure `.page-frame` comme wrapper principal
4. Composition asymétrique : illustration gauche · contenu centre · déco droite
5. Coins ornés : SVG floral en `teal` en `position: absolute` aux 4 coins du `.page-frame`
6. Vérifier contraste avec un outil (ex: `npx axe-cli` ou validation manuelle)

#### Composants React / TypeScript

1. Créer `retro-tokens.ts` exportant les couleurs comme constantes
2. Utiliser Tailwind ou CSS Modules avec les variables
3. Storybook recommandé pour documenter les composants

#### Présentations (PPTX via python-pptx)

```python
RETRO = {
    "teal":   (18, 118, 118),
    "orange": (228, 99, 46),
    "jaune":  (227, 165, 53),
    "ink":    (13, 22, 23),
    "paper":  (242, 239, 230),
}
##### Slides alternent fond paper (clair) et ink (sombre)
##### Max 3 couleurs par slide
##### Titres toujours teal ou orange, uppercase
```

#### Documents / PDF (WeasyPrint ou reportlab)

- En-tête : bandeau `teal` + titre blanc uppercase
- Corps : `ink` sur `paper`
- Callouts : fond `orange` + texte `ink` (≥18px)
- Pied de page : filet `teal`

#### Images / Affiches (Pillow, Cairo, SVG)

- Fond dominant : `ink` (thème sombre) ou `paper` (thème clair)
- Motifs géométriques et courbes organiques en `teal`
- Titre en typographie d'impact massive, `orange` ou `jaune`
- Éléments humains / silhouettes si pertinent

---

### Ornements Art Nouveau (SVG réutilisable)

```svg
<!-- Motif floral coin (à placer en top-left, rotation pour les autres coins) -->
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" opacity="0.6">
  <path d="M5,5 C5,5 20,5 30,15 C40,25 35,40 35,40 C35,40 25,30 15,30 C5,30 5,5 5,5 Z"
        fill="none" stroke="#127676" stroke-width="1.5"/>
  <circle cx="8" cy="8" r="3" fill="#127676"/>
  <path d="M15,15 Q20,10 25,18" fill="none" stroke="#127676" stroke-width="1"/>
</svg>
```

Caractères décoratifs séparateurs : `❧` `✿` `❀` `⚘` `✾` `❁`

---

### Checklist de validation

#### Obligatoire (tous artefacts)

- [ ] Tension froid/chaud présente (teal/ink + orange/jaune)
- [ ] Contraste texte/fond ≥ 4.5:1 (vérifiable via `npx lighthouse` ou axe)
- [ ] Titres en typographie géométrique uppercase espacée
- [ ] Ratio ~60% neutre / ~30% teal / ~10% orange+jaune respecté
- [ ] Succès = teal · Erreur = orange · Warning = jaune (sans inversion)
- [ ] Fond principal neutre (paper ou ink), jamais une couleur saturée

#### Pages web

- [ ] `retro-base.css` généré et lié
- [ ] Cadre `.page-frame` avec bordure orange et coins ornés
- [ ] Google Fonts importé (Anton/Oswald + Inter)
- [ ] Boutons pill avec section jaune+orange
- [ ] Séparateurs ornementaux entre sections

#### Documents / Présentations

- [ ] Max 3 couleurs par slide/page
- [ ] Alternance thème clair/sombre si multi-pages
- [ ] Callouts avec couleur sémantique correcte

---

### Anti-patterns à bannir

| ❌ | ✅ |
|---|---|
| `orange` pour succès | `teal` pour succès |
| `teal` pour erreur | `orange` pour erreur |
| Fond saturé (orange/teal plein) comme fond principal | `paper` ou `ink` comme fond |
| Paper sur orange en petit texte | Ink sur orange, ou paper ≥18px bold |
| Gradients orange→teal | Gradients teal→orange→jaune |
| Trop de jaune (fatigue) | Jaune réservé aux highlights ponctuels |
| Même couleur = deux sens opposés | Une couleur = un sens constant |

## Adaptations du fichier CLAUDE.md

Adapte toujours ce fichier CLAUDE.md quand l'utilisateur prend une décision qui modifie son contenu

