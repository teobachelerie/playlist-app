"use client";

import { useEffect, useState } from "react";

// Diagnostic temporaire (?debug dans l'adresse) : mesures réelles de l'écran
// en mode écran d'accueil iOS, pour régler la bande vide en bas.
export default function DebugViewport() {
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    if (!location.search.includes("debug")) return;
    const measure = () => {
      const root = document.querySelector(".app-ecran") as HTMLElement | null;
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;top:0;left:0;width:1px;height:100lvh;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden";
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      const lvh = probe.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const safeTop = cs.paddingTop;
      const safeBottom = cs.paddingBottom;
      probe.remove();
      setLines([
        `commit ${(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7)}`,
        `standalone ${String((navigator as Navigator & { standalone?: boolean }).standalone)}`,
        `display-mode standalone ${matchMedia("(display-mode: standalone)").matches}`,
        `innerHeight ${innerHeight} / innerWidth ${innerWidth}`,
        `screen ${screen.width}×${screen.height}`,
        `visualViewport ${Math.round(visualViewport?.height ?? 0)}`,
        `100lvh ${Math.round(lvh)}`,
        `safe top ${safeTop} / bottom ${safeBottom}`,
        `--app-h ${getComputedStyle(document.documentElement).getPropertyValue("--app-h")}`,
        `html ${document.documentElement.getBoundingClientRect().height} / body ${document.body.getBoundingClientRect().height}`,
        `app-ecran ${root?.getBoundingClientRect().height ?? "?"}`,
      ]);
    };
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, []);

  if (!lines) return null;
  return (
    <pre
      className="absolute left-4 right-4 z-50 rounded-sm bg-surface-1 p-3 text-[11px] leading-snug text-ink shadow-border"
      style={{ top: "calc(env(safe-area-inset-top) + 110px)" }}
    >
      {lines.join("\n")}
    </pre>
  );
}
