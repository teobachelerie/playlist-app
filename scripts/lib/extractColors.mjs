import { Jimp } from "jimp";

// Assombrit une couleur pour garder un fond sombre et lisible façon Apple
// Music (leur fond n'est pas la couleur brute de la pochette, mais une
// version assombrie/désaturée qui laisse le texte clair lisible dessus).
function darken([r, g, b], factor = 0.5) {
  return [Math.round(r * factor), Math.round(g * factor), Math.round(b * factor)];
}

function toHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }
  return [0, s, l];
}

// Renvoie deux couleurs assombries dérivées de la pochette :
// - primary : le pixel le plus "vibrant" (saturé, ni trop sombre ni trop clair)
// - secondary : la couleur moyenne de l'image, en repli/fondu
export async function extractColors(imageBuffer) {
  const image = await Jimp.read(imageBuffer);
  image.resize({ w: 24, h: 24 });

  let avgR = 0,
    avgG = 0,
    avgB = 0,
    count = 0;
  let bestSaturation = -1;
  let vibrant = [128, 128, 128];

  const { width, height, data } = image.bitmap;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    avgR += r;
    avgG += g;
    avgB += b;
    count++;

    const [, s, l] = rgbToHsl(r, g, b);
    if (s > bestSaturation && l > 0.15 && l < 0.85) {
      bestSaturation = s;
      vibrant = [r, g, b];
    }
  }

  const average = [Math.round(avgR / count), Math.round(avgG / count), Math.round(avgB / count)];

  return {
    primary: toHex(darken(vibrant, 0.55)),
    secondary: toHex(darken(average, 0.45)),
  };
}
