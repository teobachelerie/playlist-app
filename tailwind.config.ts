import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Alias historiques de l'app, redirigés vers les variables du design
        // system Cap Finances — les classNames existants (bg-base, text-text,
        // text-muted, bg-surface, text-accent...) continuent de marcher.
        base: "var(--surface-base)",
        surface: "var(--surface-raised)",
        highlight: "var(--surface-highlight)",
        inset: "var(--surface-inset)",
        scrim: "var(--surface-scrim)",
        dangerbg: "var(--surface-danger)",
        text: "var(--text-primary)",
        muted: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        inverse: "var(--text-inverse)",
        line: "var(--separator)",
        hairline: "var(--hairline)",
        accent: "var(--accent-bg)",
        "accent-text": "var(--accent-text)",
        red: "var(--red)",
        green: "var(--green)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        balance: "56px",
        display: "40px",
        "title-1": "28px",
        "title-2": "22px",
        "title-3": "20px",
        headline: "17px",
        body: "17px",
        callout: "16px",
        subhead: "15px",
        footnote: "13px",
        caption: "12px",
      },
      borderRadius: {
        xs: "10px",
        sm: "12px",
        md: "14px",
        control: "16px",
        lg: "20px",
        card: "24px",
        xl: "28px",
      },
      boxShadow: {
        "raised-sm": "var(--elev-raised-sm)",
        raised: "var(--elev-raised)",
        "raised-lg": "var(--elev-raised-lg)",
        "inset-sm": "var(--elev-inset-sm)",
        inset: "var(--elev-inset)",
        press: "var(--elev-press)",
        overlay: "var(--elev-overlay)",
      },
      transitionDuration: {
        micro: "150ms",
        base: "200ms",
        slow: "250ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.33, 0, 0.15, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        sheet: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
