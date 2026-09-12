import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#141311",      // fond, quasi noir chaud
        surface: "#1d1b18",   // panneaux
        line: "#2c2924",      // séparateurs
        text: "#eae6df",      // texte principal
        muted: "#948d80",     // texte secondaire
        accent: "#c98b3c",    // ambre — la seule couleur vive de l'app
      },
      fontFamily: {
        // Pile de polices système : affiche réellement San Francisco (SF Pro)
        // sur Mac/iPhone/iPad. On n'embarque pas les fichiers SF Pro eux-mêmes :
        // leur licence Apple interdit l'auto-hébergement web hors plateformes Apple.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
