import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// Un fichier par demande (le SDK ajoute un suffixe aléatoire au nom) :
// pas de lecture-modification-écriture, donc deux ajouts rapprochés ne
// s'écrasent pas. npm run studio traite tout le dossier queue/.
const QUEUE_PATH = "queue/titre.json";

export async function POST(req: Request) {
  let body: { url?: string; title?: string; artist?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const url = body.url?.trim();
  const title = body.title?.trim();
  const artist = body.artist?.trim();

  if (!url || !title || !artist) {
    return NextResponse.json({ error: "url, title et artist sont requis" }, { status: 400 });
  }
  if (!url.startsWith("http")) {
    return NextResponse.json({ error: "L'URL ne ressemble pas à un lien valide" }, { status: 400 });
  }

  try {
    const item = { url, title, artist, requestedAt: new Date().toISOString() };
    await put(QUEUE_PATH, JSON.stringify(item, null, 2), {
      access: "public",
      contentType: "application/json",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur file d'attente :", err);
    return NextResponse.json({ error: "Échec de l'enregistrement, réessaie" }, { status: 500 });
  }
}
