"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getStoredTheme, toggleTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  return (
    <button
      onClick={() => setTheme(toggleTheme())}
      className="press-tactile w-11 h-11 rounded-full bg-surface shadow-raised-sm flex items-center justify-center text-text shrink-0"
      aria-label="Basculer le thème clair/sombre"
    >
      {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
