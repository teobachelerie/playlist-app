#!/usr/bin/env node
// Reprend les titres du manifest dont les fichiers sont encore en local
// (audioUrl commençant par "/") et les envoie sur Vercel Blob, sans refaire
// tout le pipeline (yt-dlp, Whisper, iTunes) — juste un envoi de fichiers
// déjà présents dans public/.
//
// Usage : export $(cat .env.local | xargs) && node scripts/upload-existing.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data", "manifest.json");

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("✗ BLOB_READ_WRITE_TOKEN n'est pas chargé dans cette session.");
  console.error('  Lance : export $(cat .env.local | xargs)  puis relance ce script.');
  process.exit(1);
}

async function uploadIfLocal(localUrl, blobPath, contentType) {
  if (!localUrl || !localUrl.startsWith("/")) return localUrl; // déjà distant (ou absent)
  const { put } = await import("@vercel/blob");
  const filePath = path.join(ROOT, "public", localUrl);
  const buffer = await readFile(filePath);
  const blob = await put(blobPath, buffer, { access: "public", token, contentType });
  return blob.url;
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf-8"));
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const track of manifest) {
    if (!track.audioUrl?.startsWith("/")) {
      skipped++;
      continue;
    }
    try {
      console.log(`→ ${track.title} — ${track.artist}`);
      track.audioUrl = await uploadIfLocal(track.audioUrl, `audio/${track.id}.mp3`, "audio/mpeg");
      track.lyricsUrl = await uploadIfLocal(track.lyricsUrl, `lyrics/${track.id}.lrc`, "text/plain");
      track.wordsUrl = await uploadIfLocal(
        track.wordsUrl,
        `lyrics/${track.id}.words.json`,
        "application/json"
      );
      track.coverUrl = await uploadIfLocal(track.coverUrl, `covers/${track.id}.jpg`, "image/jpeg");
      uploaded++;
      // Écrit après chaque titre — en cas d'interruption, le travail déjà
      // fait n'est pas perdu.
      await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
    } catch (err) {
      console.error(`  ✗ Échec : ${err.message}`);
      failed++;
    }
  }

  console.log("");
  console.log("===================================");
  console.log(`Terminé : ${uploaded} envoyés, ${skipped} déjà distants, ${failed} échecs.`);
}

main();
