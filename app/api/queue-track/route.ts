import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const QUEUE_PATH = "queue/pending.json";

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
    // On prend toujours le fichier le plus récent (par date d'upload) plutôt
    // que d'écraser un chemin fixe — évite de dépendre d'une option
    // d'écrasement dont la disponibilité varie selon la version du SDK.
    const { blobs } = await list({ prefix: QUEUE_PATH });
    const latest = blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];
    let queue: Array<{ url: string; title: string; artist: string; requestedAt: string }> = [];
    if (latest) {
      const res = await fetch(latest.url);
      if (res.ok) queue = await res.json();
    }

    queue.push({ url, title, artist, requestedAt: new Date().toISOString() });

    await put(QUEUE_PATH, JSON.stringify(queue, null, 2), {
      access: "public",
      contentType: "application/json",
    });

    return NextResponse.json({ ok: true, position: queue.length });
  } catch (err) {
    console.error("Erreur file d'attente :", err);
    return NextResponse.json({ error: "Échec de l'enregistrement, réessaie" }, { status: 500 });
  }
}
