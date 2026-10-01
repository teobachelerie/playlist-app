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
