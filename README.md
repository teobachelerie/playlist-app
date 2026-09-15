# Playlist

Lecteur web mono-playlist : une liste de titres, un lecteur, les paroles synchronisées. Pas de recherche, pas de bibliothèque, pas de shuffle.

## Pré-requis sur ta machine (pour le script d'ajout de titre)

```bash
brew install yt-dlp ffmpeg
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
```

Le script détecte automatiquement `.venv` et l'utilise pour Whisper/WhisperX — pas besoin d'activer l'environnement virtuel avant de lancer `npm run add-track`.

**WhisperX** (alignement forcé du texte officiel sur l'audio, plus précis que l'ancienne méthode) est essayé en premier automatiquement ; en cas d'échec ou d'absence, le script retombe sur l'ancienne méthode (Whisper + recalage approximatif) sans bloquer l'ajout du titre. Dépendance lourde (torch inclus, plusieurs centaines de Mo à quelques Go au premier téléchargement des modèles).

La première fois que tu ajoutes un titre, `faster-whisper` télécharge son modèle (~500 Mo, modèle "small") — ça prend un peu de temps mais **une seule fois pour toujours**, il est ensuite mis en cache sur ta machine et réutilisé pour tous les titres suivants. Le calcul d'alignement lui-même (10-30s par titre) tourne une fois par titre, à l'ajout — jamais à la lecture.

## ⚠️ Comment appliquer une mise à jour sans perdre tes données

À partir de maintenant, mes zips ne contiennent **jamais** `data/manifest.json` ni le contenu de `public/audio`, `public/lyrics`, `public/covers` — seulement le code (composants, scripts, config). Tu peux dézipper par-dessus ton dossier existant sans risque : ta playlist et tes fichiers restent intacts.

Si jamais tu repars d'un dossier neuf (pas de `data/manifest.json` du tout) : copie `data/manifest.example.json` vers `data/manifest.json` avant de lancer `npm run add-track`.

## 1. Installation

```bash
npm install
```

## 2. Ajouter un titre

Tant que `BLOB_READ_WRITE_TOKEN` n'est pas défini, le script copie les fichiers dans `public/` — parfait pour tester en local.

```bash
npm run add-track -- "https://youtube.com/watch?v=XXXX" "Titre du morceau" "Nom de l'artiste"
```

## 3. Supprimer un titre

```bash
npm run remove-track -- "Titre ou artiste"
```

Recherche insensible à la casse sur le titre et l'artiste. Si plusieurs titres correspondent, le script les liste sans rien supprimer — relance avec une recherche plus précise. Supprime aussi les fichiers locaux associés (mp3, lrc, words.json, cover) si le titre est en mode local ; si le titre a été uploadé sur Blob, ces fichiers restent sur Vercel et doivent être supprimés manuellement depuis le dashboard (Storage → Blob) si tu veux libérer l'espace.

Le script :
1. extrait l'audio en mp3 (~128kbps) et la miniature YouTube avec yt-dlp,
2. normalise le volume à -14 LUFS (niveau standard streaming) pour une intensité sonore cohérente entre les titres,
3. cherche les paroles synchronisées sur lrclib.net,
4. si rien n'est trouvé, essaie les sous-titres YouTube de la vidéo (qualité variable selon la vidéo — voir le commentaire dans `scripts/lib/vttToLrc.mjs`),
5. si des paroles ont été trouvées, aligne les mots avec Whisper pour l'animation mot par mot (voir `scripts/lib/alignWords.mjs` pour le détail de la méthode et ses limites),
6. cherche la pochette d'album sur iTunes (repli sur la miniature YouTube si rien trouvé),
7. extrait les couleurs dominantes de la pochette (assombries, + variantes claire/foncée pour les reliefs néomorphiques du lecteur) pour le fond dynamique de l'app,
8. ajoute le titre dans `data/manifest.json`.

Recommencer la commande pour chacun de tes 108 titres actuels, puis 1-2 fois par mois pour les nouveaux.

## 4. Lancer en local

```bash
npm run dev
```

→ http://localhost:3000

## 5. Passer sur Vercel

**a) Créer le store Blob** (une fois) : dashboard Vercel → ton projet → onglet Storage → Create Database → Blob. Vercel génère un `BLOB_READ_WRITE_TOKEN`.

**b) En local**, crée `.env.local` (déjà ignoré par Git) avec ce token :
```
BLOB_READ_WRITE_TOKEN=le_token_copié_depuis_vercel
```

**c) Ré-uploade tes titres existants sur Blob** en relançant `npm run add-track -- ...` pour chacun (le script détecte le token et bascule automatiquement sur l'upload Blob au lieu de la copie locale). Si tu préfères ne pas re-télécharger depuis YouTube, tu peux aussi écrire un petit script d'upload direct à partir des fichiers déjà présents dans `public/audio` — dis-le-moi si tu veux que je l'ajoute.

**d) Déployer** :
```bash
git init
git add .
git commit -m "Init playlist app"
git push
```
Puis import du repo dans Vercel (une fois), en ajoutant `BLOB_READ_WRITE_TOKEN` dans les variables d'environnement du projet Vercel (Settings → Environment Variables) — sinon les fonctions serveur de production n'auront pas accès au token.

Ensuite, à chaque nouveau titre : `npm run add-track -- ...` en local (avec le token dans `.env.local`) puis `git add . && git commit -m "..." && git push`. Le manifest se met à jour, le déploiement se redéclenche automatiquement.

## Limites connues

- Le stockage Blob gratuit (Hobby) est de 1 Go, **partagé avec tes autres projets Vercel**. Vérifie l'usage actuel de Cap Finances avant de migrer tes 108 titres (~400-500 Mo estimés à 128kbps).
- Les paroles récupérées via les sous-titres YouTube (fallback) peuvent être imprécises ou absentes selon le type de vidéo — voir le commentaire dans `scripts/lib/vttToLrc.mjs`.
- Le timing mot par mot est une approximation : Whisper donne des instants de prononciation réels, mais le texte affiché reste celui de lrclib (fiable), donc le mapping entre les deux n'est pas toujours parfait (mots regroupés si Whisper en loupe, retour au linéaire si Whisper ne détecte rien sur une ligne). Voir `scripts/lib/alignWords.mjs`.
- Le fond dynamique reprend la logique d'Apple Music (couleur dominante de la pochette, assombrie pour rester lisible) mais reste une approximation simple (pixel le plus saturé + moyenne de l'image) — pas l'algorithme exact d'Apple.
- Design néomorphique appliqué (tokens Cap Finances) : mode clair/sombre manuel (bouton dans l'en-tête, persisté dans `localStorage`), playlist en surfaces neutres, lecteur plein écran en relief teinté par la couleur de la pochette (`colorLight`/`colorDark`, calculés à l'ingestion).
- Les titres ajoutés avant cette mise à jour n'ont pas `colorLight`/`colorDark` dans le manifest — repli neutre automatique en attendant une ré-ingestion.
- Le geste de glissement de la feuille (lecteur) est une translation simple avec seuil de bascule à 30% de l'écran — pas de physique d'inertie façon iOS natif.
- Le bouton de sortie audio (icône cast) n'apparaît que dans Safari (iOS/Mac) — c'est une API spécifique à WebKit, absente de Chrome/Firefox.
