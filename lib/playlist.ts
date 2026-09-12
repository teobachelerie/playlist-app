export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number; // secondes
  audioUrl: string; // /audio/xxx.mp3 (local) ou URL Vercel Blob (prod)
  lyricsUrl: string | null; // /lyrics/xxx.lrc, ou null si pas trouvé
  wordsUrl: string | null; // /lyrics/xxx.words.json — timing par mot (Whisper), ou null
  coverUrl: string | null; // URL iTunes ou fichier local/Blob
  colorPrimary: string; // couleur dominante assombrie, extraite de la pochette
  colorSecondary: string; // couleur moyenne assombrie, en repli du dégradé
  addedAt: string; // ISO date
};

export function getPlaylist(): Track[] {
  // Import statique : le manifest est reconstruit à chaque build/déploiement.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const manifest = require("@/data/manifest.json") as Partial<Track>[];
  // Normalise les titres ajoutés avant l'introduction du cover/couleurs/mots
  // par mot, pour qu'ils s'affichent avec un fond neutre plutôt que de casser.
  return manifest.map((t) => ({
    ...t,
    wordsUrl: t.wordsUrl ?? null,
    coverUrl: t.coverUrl ?? null,
    colorPrimary: t.colorPrimary ?? "#1d1b18",
    colorSecondary: t.colorSecondary ?? "#0a0a0a",
  })) as Track[];
}
