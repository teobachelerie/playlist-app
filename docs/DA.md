# Direction artistique — Playlist

Même D.A que **Finelio** (suivi de dépenses) : éditorial, chaud, « papier et encre ».
Un seul accent fort, l'orange en dégradé. Peu d'éléments, beaucoup d'air.
Répartition cible : 60 % fond, 25 % papier, 10 % encre, 5 % orange.

Source : prompt « Aligner la D.A de mon app de musique sur celle de Finelio »
(fait foi sur le PDF *Teo Bach - Direction artistique v3*, qui parle encore
d'Apple Garamond, abandonné le 2 novembre 2026). **Écart voulu avec Finelio :
Inter seule, pas de Source Serif** (décision de Téo, 3 novembre 2026).

Toutes les valeurs vivent en variables CSS dans `app/globals.css`, relayées
par `tailwind.config.ts`. **Aucun hex dans les composants.**

## Couleurs

| Rôle | Token | Clair | Sombre |
|---|---|---|---|
| Fond de l'app | `--surface-0` | `#E9E6E2` | `#161412` |
| Papier (cartes, feuilles) | `--surface-1` | `#F2EFEA` | `#211E1B` |
| Papier enfoncé (état choisi) | `--surface-2` | `#E3DFD9` | `#2B2724` |
| Bordure fine | `--border-token` | `#DAD5CE` | `#36312C` |
| Encre | `--ink` | `#2B2724` | `#F2EFEA` |
| Texte secondaire | `--text-secondary` | `#5A534D` | `#C9C2BA` |
| Gris chaud | `--ink-muted` | `#8C8580` | `#9C948C` |
| Orange vif | `--accent-orange-bright` | `#EE7B26` | idem |
| Orange en texte | `--accent-orange` | `#B8541F` | `#EE7B26` |
| Dégradé signature | `--grad-signature` | `#EE7B26 → #B8541F` | idem |
| Rouge | `--red` | `#C8372D` | `#E5574A` |
| Voile | `--surface-scrim` | `rgba(43,39,36,.38)` | `rgba(0,0,0,.6)` |
| Verre | `--surface-glass` | papier à 84 % | papier à 84 % |

Thème sombre : `[data-theme="dark"]` sur `<html>` (clé `expenses-theme` en
localStorage), pas seulement `prefers-color-scheme`. `theme-color` suit
(`#E9E6E2` / `#161412`), posé au démarrage dans `app/layout.tsx` et au
basculement dans `lib/theme.ts`.

### Règles non négociables

- L'orange n'est **jamais** un fond plein. Il sert aux mots forts, chiffres,
  éléments actifs fins (progression, barres « en cours », icône active).
- Petit texte orange : `--accent-orange` plein. Dégradé seulement en grand.
- Actions principales et Lecture/Pause : **pilule encre** (`.btn-encre`),
  inversée en sombre.
- Rouge réservé aux erreurs et suppressions.
- Jamais un état par la couleur seule : morceau en cours = orange + barres ;
  icône active = orange + point (`.actif-point`) + `aria-pressed`.

## Typo

- **Inter seule**, partout (400 à 900). Aucune serif, même pour les mots forts.
- `.titre-encre` : Inter Black, `-0.035em`, interligne 1,05 (titres, titre du
  morceau en lecture, paroles).
- `.mot-fort` : Inter Black en dégradé signature, **un ou deux mots par écran,
  en grand seulement** (« Ma **playlist** », « Rien à **écouter** »).
- `.chiffre-fort` : gros chiffres Inter Black en dégradé.
- `.label-section` : 12 px, capitales, gris chaud.
- Durées et compteurs en `tabular-nums`. Champs ≥ 16 px.
- Interdits : toute autre police (Source Serif, Garamond, Helvetica, Didot, manuscrites). Aucun emoji ; icônes lucide.

## Surfaces et formes

- Élévation par **bordure fine** (`--elev-border`). Seules feuilles et éléments
  flottants ont une ombre douce (`--elev-float`, `--elev-overlay`).
- Rayons : 12 px pastilles (`rounded-sm`), 14 px champs (`rounded-field`),
  20 px cartes (`rounded-card`), 28 px feuilles (`rounded-sheet`), pilule.
- Primitives : `.btn-encre`, `.btn-rond`, `.champ`, `.carte`, `.feuille`,
  `.pochette` (bordure fine, aucun filtre).
- Fond `.fin-backdrop` : base unie, grille 120 px à 4 % d'encre, ombres de
  fenêtre diagonales qui dérivent par `transform` sur un pseudo-élément non
  répété (jamais `background-position` sur un fond répété).
- `.verre` (lecteur compact, mini-barre) : papier 84 %, `blur(28px)
  saturate(170%)`, repli opaque sous `prefers-reduced-transparency` ou sans
  `backdrop-filter`. Pas de verre sur le lecteur plein écran (coûteux à l'ouverture).
- Les pochettes apportent leurs couleurs ; aucune teinte de pochette sur l'UI.

## Mouvement

| Usage | Valeur |
|---|---|
| Micro | 150 ms |
| Base | 200 ms |
| Lent | 250 ms |
| Piles | 280 ms `cubic-bezier(0.2,0.8,0.2,1)` |
| Courbe standard | `cubic-bezier(0.33,0,0.15,1)` |
| Courbe de sortie | `cubic-bezier(0.16,1,0.3,1)` |

- Retour au toucher : échelle 0,97 ou opacité 0,55.
- Intro une fois par session (`data-intro`, `.intro-monte` / `.intro-fondu`), < 1 s.
- Toute animation CSS sous `prefers-reduced-motion: no-preference`.
- Pas d'animation sur les actions fréquentes (suivant, scrubber).

## Contournements iOS à ne pas toucher sans prévenir

`position: fixed` sur `html, body` ; `h-dvh` et `env(safe-area-inset-bottom)`
dans `PlayerSheet` ; `statusBarStyle: black-translucent` ; `touch-action:
manipulation` ; masque de fondu de la liste.
