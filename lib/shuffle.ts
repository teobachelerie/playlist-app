import type { Track } from "@/lib/playlist";

// Tire un ordre aléatoire complet en évitant, à chaque étape, de piocher un
// titre du même artiste que le précédent — sauf si c'est la seule option
// restante (playlist très concentrée sur un artiste en fin de tirage).
export function shuffleAvoidingSameArtist(tracks: Track[]): Track[] {
  const pool = [...tracks];
  const order: Track[] = [];
  let lastArtist: string | null = null;

  while (pool.length > 0) {
    const candidates = pool.filter((t) => t.artist !== lastArtist);
    const choices = candidates.length > 0 ? candidates : pool;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    order.push(pick);
    lastArtist = pick.artist;
    pool.splice(pool.indexOf(pick), 1);
  }

  return order;
}
