// Cherche une vraie pochette d'album via l'API iTunes Search (publique,
// gratuite, sans clé). C'est une URL Apple hébergée directement — pas besoin
// de la retélécharger ni de l'uploader, on stocke juste l'URL dans le
// manifest. Renvoie null si aucun résultat.
export async function fetchCoverArt(title, artist) {
  const params = new URLSearchParams({
    term: `${artist} ${title}`,
    media: "music",
    limit: "1",
  });
  const res = await fetch(`https://itunes.apple.com/search?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const artwork = data.results?.[0]?.artworkUrl100;
  if (!artwork) return null;

  // L'URL par défaut pointe vers une image 100x100 ; iTunes sert la même
  // image en plus grande résolution si on modifie ce segment de l'URL.
  return artwork.replace("100x100bb", "600x600bb");
}
