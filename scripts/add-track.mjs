#!/usr/bin/env node
// Usage : npm run add-track -- "<url YouTube OU terme de recherche>" "<Titre>" "<Artiste>"
//
// Si le premier argument n'est pas une URL (ne commence pas par "http"), il
// est traité comme une recherche YouTube — yt-dlp cherche lui-même et prend
// le premier résultat (ytsearch1:), au lieu d'exiger un lien exact.
//
// Pré-requis sur ta machine :
//   - yt-dlp et ffmpeg (brew install yt-dlp ffmpeg)
//   - Python 3 + faster-whisper (pip3 install -r scripts/requirements.txt)
//
// Si BLOB_READ_WRITE_TOKEN est défini (.env.local), les fichiers sont uploadés sur
// Vercel Blob. Sinon ils sont copiés dans public/ pour un test en local.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdtemp, rm, readdir, copyFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { vttToLrc } from "./lib/vttToLrc.mjs";
import { parseLrc } from "./lib/lrc.mjs";
import { assignWordTimes } from "./lib/alignWords.mjs";
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
    "5", // ~128kbps VBR — largement suffisant, garde des fichiers légers
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

  console.log("→ Normalisation du volume (loudnorm, -14 LUFS — niveau standard streaming)…");
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    rawMp3Path,
    "-af",
    "loudnorm=I=-14:TP=-1.5:LRA=11",
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

async function fetchFromLrclib(title, artist, duration) {
  console.log("→ Recherche des paroles sur lrclib.net…");
  const params = new URLSearchParams({
    track_name: title,
    artist_name: artist,
    duration: String(duration),
  });
  const res = await fetch(`https://lrclib.net/api/get?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.syncedLyrics || null;
}

async function fetchFromYoutubeSubs(tmpDir, url) {
  console.log("→ Pas de résultat lrclib, tentative via les sous-titres YouTube…");
  try {
    await execFileAsync("yt-dlp", [
      "--write-subs",
      "--write-auto-sub",
      "--sub-lang",
      "fr,en",
      "--skip-download",
      "--sub-format",
      "vtt",
      "-o",
      path.join(tmpDir, "subs.%(ext)s"),
      url,
    ]);
  } catch {
    return null; // pas de sous-titres disponibles, ce n'est pas une erreur bloquante
  }

  const files = await readdir(tmpDir);
  const vttFile = files.find((f) => f.endsWith(".vtt"));
  if (!vttFile) return null;

  const vttContent = await readFile(path.join(tmpDir, vttFile), "utf-8");
  const lrc = vttToLrc(vttContent);
  return lrc.length > 0 ? lrc : null;
}

async function runWhisperAlignment(mp3Path) {
  console.log("→ Alignement Whisper (peut prendre 10-30s, une seule fois pour ce titre)…");
  const scriptPath = path.join(ROOT, "scripts", "align_words.py");
  const venvPython = path.join(ROOT, ".venv", "bin", "python3");
  const pythonBin = existsSync(venvPython) ? venvPython : "python3";
  if (!existsSync(venvPython)) {
    console.log("  (pas d'environnement virtuel .venv trouvé, utilisation de python3 global — voir README)");
  }
  const { stdout } = await execFileAsync(pythonBin, [scriptPath, mp3Path], {
    maxBuffer: 1024 * 1024 * 20, // transcriptions longues = beaucoup de JSON
  });
  return JSON.parse(stdout);
}

async function runForcedAlignment(tmpDir, mp3Path, lines, duration) {
  const segments = lines.map((line, i) => ({
    text: line.text,
    start: line.time,
    end: lines[i + 1]?.time ?? duration,
  }));
  const segmentsPath = path.join(tmpDir, "segments.json");
  await writeFile(segmentsPath, JSON.stringify(segments), "utf-8");

  const scriptPath = path.join(ROOT, "scripts", "align_words_forced.py");
  const venvPython = path.join(ROOT, ".venv", "bin", "python3");
  const pythonBin = existsSync(venvPython) ? venvPython : "python3";
  const { stdout } = await execFileAsync(pythonBin, [scriptPath, mp3Path, segmentsPath], {
    maxBuffer: 1024 * 1024 * 20,
  });
  return JSON.parse(stdout);
}

async function storeFiles({ id, mp3Path, lrcContent, wordsContent, thumbnailPath }) {
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

    let lyricsUrl = null;
    if (lrcContent) {
      const lrcBlob = await put(`lyrics/${id}.lrc`, lrcContent, {
        access: "public",
        token,
        contentType: "text/plain",
      });
      lyricsUrl = lrcBlob.url;
    }

    let wordsUrl = null;
    if (wordsContent) {
      const wordsBlob = await put(`lyrics/${id}.words.json`, wordsContent, {
        access: "public",
        token,
        contentType: "application/json",
      });
      wordsUrl = wordsBlob.url;
    }

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

    return { audioUrl: mp3Blob.url, lyricsUrl, wordsUrl, localCoverUrl };
  }

  console.log("→ Pas de BLOB_READ_WRITE_TOKEN : copie locale dans public/ (mode dev)…");
  const audioDest = path.join(ROOT, "public", "audio", `${id}.mp3`);
  await copyFile(mp3Path, audioDest);

  let lyricsUrl = null;
  if (lrcContent) {
    const lrcDest = path.join(ROOT, "public", "lyrics", `${id}.lrc`);
    await writeFile(lrcDest, lrcContent, "utf-8");
    lyricsUrl = `/lyrics/${id}.lrc`;
  }

  let wordsUrl = null;
  if (wordsContent) {
    const wordsDest = path.join(ROOT, "public", "lyrics", `${id}.words.json`);
    await writeFile(wordsDest, wordsContent, "utf-8");
    wordsUrl = `/lyrics/${id}.words.json`;
  }

  let localCoverUrl = null;
  if (thumbnailPath) {
    const coverDest = path.join(ROOT, "public", "covers", `${id}.jpg`);
    await copyFile(thumbnailPath, coverDest);
    localCoverUrl = `/covers/${id}.jpg`;
  }

  return { audioUrl: `/audio/${id}.mp3`, lyricsUrl, wordsUrl, localCoverUrl };
}

async function main() {
  const id = slugify(`${artist}-${title}`);
  const tmpDir = await mkdtemp(path.join(tmpdir(), "add-track-"));

  try {
    const { mp3Path, thumbnailPath } = await extractAudioAndThumbnail(tmpDir, url);
    const duration = await getDurationSeconds(mp3Path);

    let lrcContent = await fetchFromLrclib(title, artist, duration);
    if (!lrcContent) {
      lrcContent = await fetchFromYoutubeSubs(tmpDir, url);
    }
    if (!lrcContent) {
      console.log("→ Aucune parole trouvée — le titre sera ajouté sans paroles ni animation mot par mot.");
    }

    let wordsContent = null;
    if (lrcContent) {
      const lines = parseLrc(lrcContent);
      let wordTimes = null;
      try {
        console.log("→ Alignement forcé (WhisperX) — texte officiel calé directement sur l'audio…");
        wordTimes = await runForcedAlignment(tmpDir, mp3Path, lines, duration);
      } catch (err) {
        console.log(`  WhisperX indisponible ou en échec (${err.message}), repli sur l'ancienne méthode…`);
        const whisperWords = await runWhisperAlignment(mp3Path);
        const starts = whisperWords.map((w) => w.start);
        wordTimes = assignWordTimes(lines, starts, duration);
      }
      wordsContent = JSON.stringify(wordTimes);
    }

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

    const { audioUrl, lyricsUrl, wordsUrl, localCoverUrl } = await storeFiles({
      id,
      mp3Path,
      lrcContent,
      wordsContent,
      thumbnailPath: coverUrl ? null : thumbnailPath, // pas besoin d'uploader si iTunes a déjà donné une URL
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
      lyricsUrl,
      wordsUrl,
      coverUrl,
      colorPrimary: colors.primary,
      colorSecondary: colors.secondary,
      colorSoft: colors.soft,
      colorLight: colors.colorLight,
      colorDark: colors.colorDark,
      addedAt: new Date().toISOString(),
    });

    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
    console.log(
      `✓ "${title}" ajouté (${lyricsUrl ? "paroles + mot par mot" : "sans paroles"}, ${
        coverUrl ? "avec cover" : "sans cover"
      }).`
    );
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("✗ Erreur :", err.message);
  process.exit(1);
});
