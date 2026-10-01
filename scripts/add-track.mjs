#!/usr/bin/env node
// Usage : npm run add-track -- "<url YouTube OU terme de recherche>" "<Titre>" "<Artiste>"
//
// Si le premier argument n'est pas une URL (ne commence pas par "http"), il
// est traité comme une recherche YouTube — yt-dlp cherche lui-même et prend
// le premier résultat (ytsearch1:), au lieu d'exiger un lien exact.
//
// Pré-requis sur ta machine :
//   - yt-dlp et ffmpeg (brew install yt-dlp ffmpeg)
//
// Si BLOB_READ_WRITE_TOKEN est défini (.env.local), les fichiers sont uploadés sur
// Vercel Blob. Sinon ils sont copiés dans public/ pour un test en local.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdtemp, rm, readdir, copyFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fetchCoverArt } from "./lib/fetchCoverArt.mjs";
import { extractColors } from "./lib/extractColors.mjs";

const execFileAsync = promisify(execFile);

const [, , rawSource, title, artist] = process.argv;
if (!rawSource || !title || !artist) {
  console.error('Usage: npm run add-track -- "<url YouTube ou recherche>" "<Titre>" "<Artiste>"');
  process.exit(1);
}
// yt-dlp accepte "ytsearchN:requête" comme pseudo-URL et effectue lui-même
// la recherche — évite d'avoir à fournir un lien exact pour chaque titre.
const url = rawSource.startsWith("http") ? rawSource : `ytsearch1:${rawSource}`;

const ROOT = path.resolve(import.meta.dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data", "manifest.json");

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function extractAudioAndThumbnail(tmpDir, url) {
  console.log("→ Extraction audio + miniature via yt-dlp…");
  const outputTemplate = path.join(tmpDir, "track.%(ext)s");
  await execFileAsync("yt-dlp", [
    "-x",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "5",
    "--write-thumbnail",
    "--convert-thumbnails",
    "jpg",
    "-o",
    outputTemplate,
    url,
  ]);

  const files = await readdir(tmpDir);
  const thumbFile = files.find((f) => f.startsWith("track.") && f.endsWith(".jpg"));
  const rawMp3Path = path.join(tmpDir, "track.mp3");
  const normalizedPath = path.join(tmpDir, "track_norm.mp3");

  console.log("→ Normalisation du volume (loudnorm, -18 LUFS — plus proche d'Apple Music)…");
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    rawMp3Path,
    "-af",
    "loudnorm=I=-18:TP=-1.5:LRA=11",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "192k",
    normalizedPath,
  ]);
  await rename(normalizedPath, rawMp3Path);

  return {
    mp3Path: rawMp3Path,
    thumbnailPath: thumbFile ? path.join(tmpDir, thumbFile) : null,
  };
}

async function getDurationSeconds(mp3Path) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    mp3Path,
  ]);
  return Math.round(parseFloat(stdout.trim()));
}

async function storeFiles({ id, mp3Path, thumbnailPath }) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    console.log("→ Upload vers Vercel Blob…");
    const { put } = await import("@vercel/blob");

    const mp3Buffer = await readFile(mp3Path);
    const mp3Blob = await put(`audio/${id}.mp3`, mp3Buffer, {
      access: "public",
      token,
      contentType: "audio/mpeg",
    });

    let localCoverUrl = null;
    if (thumbnailPath) {
      const thumbBuffer = await readFile(thumbnailPath);
      const coverBlob = await put(`covers/${id}.jpg`, thumbBuffer, {
        access: "public",
        token,
        contentType: "image/jpeg",
      });
      localCoverUrl = coverBlob.url;
    }

    return { audioUrl: mp3Blob.url, localCoverUrl };
  }

  console.log("→ Pas de BLOB_READ_WRITE_TOKEN : copie locale dans public/ (mode dev)…");
  const audioDest = path.join(ROOT, "public", "audio", `${id}.mp3`);
  await copyFile(mp3Path, audioDest);

  let localCoverUrl = null;
  if (thumbnailPath) {
    const coverDest = path.join(ROOT, "public", "covers", `${id}.jpg`);
    await copyFile(thumbnailPath, coverDest);
    localCoverUrl = `/covers/${id}.jpg`;
  }

  return { audioUrl: `/audio/${id}.mp3`, localCoverUrl };
}

async function main() {
  const id = slugify(`${artist}-${title}`);
  const tmpDir = await mkdtemp(path.join(tmpdir(), "add-track-"));

  try {
    const { mp3Path, thumbnailPath } = await extractAudioAndThumbnail(tmpDir, url);
    const duration = await getDurationSeconds(mp3Path);

    console.log("→ Recherche de la pochette d'album (iTunes)…");
    let coverUrl = await fetchCoverArt(title, artist);
    if (coverUrl) console.log("  trouvée sur iTunes.");
    else console.log("  rien sur iTunes, utilisation de la miniature YouTube en repli.");

    console.log("→ Extraction des couleurs dominantes de la pochette…");
    let colorImageBuffer = null;
    if (coverUrl) {
      const coverRes = await fetch(coverUrl);
      if (coverRes.ok) colorImageBuffer = Buffer.from(await coverRes.arrayBuffer());
    } else if (thumbnailPath) {
      colorImageBuffer = await readFile(thumbnailPath);
    }
    const colors = colorImageBuffer
      ? await extractColors(colorImageBuffer)
      : {
          primary: "#1d1b18",
          secondary: "#0a0a0a",
          soft: "rgba(255,255,255,0)",
          colorLight: "rgba(255,255,255,0.08)",
          colorDark: "rgba(0,0,0,0.45)",
        };

    const { audioUrl, localCoverUrl } = await storeFiles({
      id,
      mp3Path,
      thumbnailPath: coverUrl ? null : thumbnailPath,
    });
    if (!coverUrl) coverUrl = localCoverUrl;

    const manifest = existsSync(MANIFEST_PATH)
      ? JSON.parse(await readFile(MANIFEST_PATH, "utf-8"))
      : [];

    if (manifest.some((t) => t.id === id)) {
      console.error(`✗ Un titre avec l'id "${id}" existe déjà dans le manifest.`);
      process.exit(1);
    }

    manifest.push({
      id,
      title,
      artist,
      duration,
      audioUrl,
      lyricsUrl: null,
      wordsUrl: null,
      coverUrl,
      colorPrimary: colors.primary,
      colorSecondary: colors.secondary,
      colorSoft: colors.soft,
      colorLight: colors.colorLight,
      colorDark: colors.colorDark,
      addedAt: new Date().toISOString(),
    });

    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
    console.log(`✓ "${title}" ajouté (${coverUrl ? "avec cover" : "sans cover"}).`);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("✗ Erreur :", err.message);
  process.exit(1);
});
