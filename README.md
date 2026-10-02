# Playlist

Lecteur web mono-playlist perso : une liste de titres, un lecteur compact en bas d'écran (lecture, précédent/suivant, progression, aléatoire/répéter, file d'attente). Pas de recherche, pas de bibliothèque, pas de paroles.

## Pré-requis sur ta machine (pour ajouter des titres)

```bash
brew install yt-dlp ffmpeg
```

Plus besoin de Python/Whisper — l'app n'affiche plus de paroles, donc plus d'étape d'alignement à l'ajout. Les fichiers `scripts/align_words.py`, `scripts/align_words_forced.py` et `scripts/requirements.txt` restent dans le repo mais ne sont plus utilisés.

## ⚠️ Comment appliquer une mise à jour sans perdre tes données

Mes zips ne contiennent **jamais** `data/manifest.json` ni le contenu de `public/audio`, `public/covers` — seulement le code (composants, scripts, config). Tu peux dézipper par-dessus ton dossier existant sans risque : ta playlist et tes fichiers restent intacts.

Si jamais tu repars d'un dossier neuf (pas de `data/manifest.json` du tout) : copie `data/manifest.example.json` vers `data/manifest.json` avant d'ajouter un titre.

## 1. Installation

```bash
npm install
```

## 2. Ajouter des titres

**Depuis le site lui-même** : bouton "+" en haut à côté de "Playlist" — colle un lien, un titre et un artiste. Ça n'ajoute pas le titre tout de suite (télécharger/convertir l'audio n'est pas quelque chose que le site peut faire lui-même, de façon fiable) : ça enregistre juste la demande dans une file d'attente, traitée automatiquement la prochaine fois que tu lances `npm run studio` sur ton Mac.

**En local — mode interactif**, pas besoin de revenir en discuter à chaque fois :
```bash
npm run studio
```
Traite d'abord tout ce qui a été demandé depuis l'app (file d'attente), puis colle un lien YouTube directement ici — le titre est détecté automatiquement (tu confirmes ou corriges), ça boucle pour le titre suivant. Ctrl+C pour arrêter.

**Ou un par un, en une commande** :
```bash
npm run add-track -- "https://youtube.com/watch?v=XXXX" "Titre du morceau" "Nom de l'artiste"
```

**Ou par recherche** (pas de lien, yt-dlp cherche lui-même sur YouTube et prend le premier résultat) :
```bash
npm run add-track -- "Titre Artiste" "Titre du morceau" "Nom de l'artiste"
```

Tant que `BLOB_READ_WRITE_TOKEN` n'est pas défini, les fichiers sont copiés dans `public/` — parfait pour tester en local.

Le script :
1. extrait l'audio en mp3 (~128kbps) et la miniature YouTube avec yt-dlp,
2. normalise le volume à -18 LUFS (plus proche d'Apple Music que les -14 LUFS d'avant),
3. cherche la pochette d'album sur iTunes (repli sur la miniature YouTube si rien trouvé),
4. extrait les couleurs dominantes de la pochette pour la légère teinte du lecteur,
5. ajoute le titre dans `data/manifest.json`.

## 3. Supprimer un titre

```bash
npm run remove-track -- "Titre ou artiste"
```

Recherche insensible à la casse sur le titre et l'artiste. Si plusieurs titres correspondent, le script les liste sans rien supprimer — relance avec une recherche plus précise. Supprime aussi les fichiers locaux associés si le titre est en mode local ; si le titre a été uploadé sur Blob, ces fichiers restent sur Vercel et doivent être supprimés manuellement depuis le dashboard (Storage → Blob) si tu veux libérer l'espace.

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

**c) Déployer** :
```bash
git init
git add .
git commit -m "Init playlist app"
git push
```
Puis import du repo dans Vercel (une fois), en ajoutant `BLOB_READ_WRITE_TOKEN` dans les variables d'environnement du projet Vercel (Settings → Environment Variables) — sinon les fonctions serveur de production n'auront pas accès au token.

Ensuite, à chaque nouveau titre : `npm run studio` (ou `add-track`) en local avec le token chargé (`export $(cat .env.local | xargs)`), puis `git add . && git commit -m "..." && git push`. Le manifest se met à jour, le déploiement se redéclenche automatiquement.

## Limites connues

- Le stockage Blob gratuit (Hobby) est de 1 Go, **partagé avec tes autres projets Vercel**.
- Le fond du lecteur reprend la logique d'Apple Music (couleur dominante de la pochette, assombrie pour rester lisible) mais reste une approximation simple (pixel le plus saturé + moyenne de l'image) — pas l'algorithme exact d'Apple.
- Design néomorphique (tokens Cap Finances) : mode clair/sombre manuel (bouton dans l'en-tête, persisté dans `localStorage`).
- Pas de paroles — retiré à la demande (prenait trop de place, peu utilisé). Les fichiers `lib/lrc.ts`, `components/Lyrics.tsx`, `components/PlayerSheet.tsx` restent dans le repo mais ne sont plus utilisés par l'app ; `lyricsUrl`/`wordsUrl` restent dans le manifest (toujours `null` pour les nouveaux titres) pour ne pas casser les titres existants.
- Le bouton de sortie audio (icône cast) n'apparaît que dans Safari (iOS/Mac) — c'est une API spécifique à WebKit, absente de Chrome/Firefox.
