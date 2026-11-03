import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tokens D.A
        "surface-0": "var(--surface-0)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        border: "var(--border-token)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        orange: "var(--accent-orange)",
        "orange-bright": "var(--accent-orange-bright)",
        // Alias historiques de l'app, redirigés vers les tokens D.A
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
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", '"SF Pro Text"', "system-ui", "sans-serif"],
        display: ["Inter", "-apple-system", '"SF Pro Display"', "system-ui", "sans-serif"],
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
        sm: "var(--radius-sm)",
        md: "var(--radius-field)",
        field: "var(--radius-field)",
        control: "16px",
        lg: "var(--radius-card)",
        card: "var(--radius-card)",
        xl: "var(--radius-sheet)",
        sheet: "var(--radius-sheet)",
      },
      boxShadow: {
        border: "var(--elev-border)",
        float: "var(--elev-float)",
        overlay: "var(--elev-overlay)",
      },
      transitionDuration: {
        micro: "150ms",
        base: "200ms",
        slow: "250ms",
        stack: "280ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.33, 0, 0.15, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        sheet: "cubic-bezier(0.32, 0.72, 0, 1)",
        stack: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
