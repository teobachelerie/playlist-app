#!/usr/bin/env node
// Usage : npm run remove-track -- "<titre ou artiste>"
// Cherche dans le manifest (insensible à la casse), supprime si une seule
// correspondance, liste les options si plusieurs.

import { readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data", "manifest.json");

const [, , query] = process.argv;
if (!query) {
  console.error('Usage: npm run remove-track -- "<titre ou artiste>"');
  process.exit(1);
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error("✗ Aucun manifest trouvé.");
    process.exit(1);
  }

  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf-8"));
  const q = query.toLowerCase();
  const matches = manifest.filter(
    (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    console.log("Aucun titre trouvé pour cette recherche.");
    return;
  }

  if (matches.length > 1) {
    console.log(`${matches.length} titres correspondent, précise ta recherche :`);
    for (const t of matches) console.log(`  - "${t.title}" — ${t.artist}`);
    return;
  }

  const track = matches[0];
  const updated = manifest.filter((t) => t.id !== track.id);
  await writeFile(MANIFEST_PATH, JSON.stringify(updated, null, 2) + "\n", "utf-8");

  // Supprime aussi les fichiers locaux (mode dev sans Blob). Si le titre a été
  // uploadé sur Vercel Blob, ces chemins ne commencent pas par "/" et sont
  // ignorés ici — il faudra les supprimer manuellement depuis le dashboard
  // Vercel (Storage → Blob) si besoin.
  const localFiles = [track.audioUrl, track.lyricsUrl, track.wordsUrl, track.coverUrl]
    .filter((url) => url && url.startsWith("/"))
    .map((url) => path.join(ROOT, "public", url));

  for (const file of localFiles) {
    await unlink(file).catch(() => {});
  }

  console.log(`✓ "${track.title}" — ${track.artist} supprimé.`);
}

main();
