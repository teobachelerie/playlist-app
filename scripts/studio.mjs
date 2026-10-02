#!/usr/bin/env node
// Mode interactif : colle un lien YouTube, le titre de la vidéo est détecté
// automatiquement (et découpé en "Artiste - Titre" quand le format s'y
// prête) pour que tu n'aies qu'à confirmer ou corriger. Boucle jusqu'à
// Ctrl+C.
//
// Usage : npm run studio

import { createInterface } from "node:readline/promises";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rl = createInterface({ input: process.stdin, output: process.stdout });

const QUEUE_PATH = "queue/pending.json";

// Traite les titres demandés depuis l'app (bouton "+" sur le site) avant de
// passer en mode interactif — nécessite BLOB_READ_WRITE_TOKEN (même que pour
// add-track). Si le token n'est pas chargé, ou si la file est vide, on passe
// directement à la suite sans bloquer.
async function processRemoteQueue() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.log("(BLOB_READ_WRITE_TOKEN non chargé — file d'attente distante ignorée)\n");
    return;
  }

  const { list, put } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: QUEUE_PATH, token });
  // On prend toujours le fichier le plus récent plutôt que d'écraser un
  // chemin fixe — évite de dépendre d'une option d'écrasement dont la
  // disponibilité varie selon la version du SDK.
  const latest = blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )[0];
  if (!latest) return;

  const res = await fetch(latest.url);
  const pending = res.ok ? await res.json() : [];
  if (pending.length === 0) return;

  console.log(`📥 ${pending.length} titre(s) en attente depuis l'app :\n`);
  for (const { url, title, artist } of pending) {
    console.log(`→→→ ${title} — ${artist}`);
    await runAddTrack(url, title, artist);
    console.log("");
  }

  await put(QUEUE_PATH, "[]", {
    access: "public",
    contentType: "application/json",
    token,
  });
  console.log("---\n");
}

async function getYoutubeTitle(url) {
  try {
    const { stdout } = await execFileAsync("yt-dlp", ["--get-title", url], {
      timeout: 20000,
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

// Les titres YouTube suivent souvent "Artiste - Titre" — on tente de
// découper là-dessus, sans certitude (beaucoup de vidéos ne suivent pas ce
// format, d'où la confirmation manuelle juste après).
function guessArtistTitle(rawTitle) {
  const parts = rawTitle.split(/\s[-–]\s/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "", title: rawTitle };
}

function runAddTrack(url, title, artist) {
  return new Promise((resolve) => {
    const child = spawn("npm", ["run", "add-track", "--", url, title, artist], {
      stdio: "inherit",
    });
    child.on("close", resolve);
  });
}

async function main() {
  console.log("🎵 Ajout rapide de titres — Ctrl+C pour arrêter à tout moment.\n");

  await processRemoteQueue();

  while (true) {
    const url = (await rl.question("Lien YouTube : ")).trim();
    if (!url) continue;
    if (!url.startsWith("http")) {
      console.log("✗ Ça ne ressemble pas à un lien, réessaie.\n");
      continue;
    }

    console.log("  (recherche du titre sur YouTube…)");
    const rawTitle = await getYoutubeTitle(url);
    let guess = { artist: "", title: "" };
    if (rawTitle) {
      guess = guessArtistTitle(rawTitle);
      console.log(`  Trouvé : "${rawTitle}"`);
    } else {
      console.log("  (impossible de détecter le titre automatiquement, entre-le à la main)");
    }

    const titleAnswer = (
      await rl.question(`Titre${guess.title ? ` [${guess.title}]` : ""} : `)
    ).trim();
    const title = titleAnswer || guess.title;

    const artistAnswer = (
      await rl.question(`Artiste${guess.artist ? ` [${guess.artist}]` : ""} : `)
    ).trim();
    const artist = artistAnswer || guess.artist;

    if (!title || !artist) {
      console.log("✗ Titre et artiste sont obligatoires, ce titre est ignoré.\n");
      continue;
    }

    console.log("");
    await runAddTrack(url, title, artist);
    console.log("\n---\n");
  }
}

main();
