/**
 * Theme loading from JSON files
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface PywalColors {
  special: {
    background: string;
    foreground: string;
    cursor: string;
  };
  colors: Record<string, string>;
}

interface ThemeColors {
  background: string;
  foreground: string;
  base00: string;
  base01: string;
  base02: string;
  base03: string;
  base04: string;
  base05: string;
  base06: string;
  base07: string;
  base08: string;
  base09: string;
  base0a: string;
  base0b: string;
  base0c: string;
  base0d: string;
  base0e: string;
  base0f: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

// Cache for loaded themes
const loadedThemes: Map<string, Theme> = new Map();

/**
 * Get themes directory path
 */
function getThemesDir(): string {
  // Get the directory of this file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.join(__dirname, "themes");
}

/**
 * Load a theme from JSON file
 */
function loadThemeFromFile(name: string): Theme | null {
  const themesDir = getThemesDir();
  const filePath = path.join(themesDir, `${name}.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = fs.readFileSync(filePath, "utf-8");
    const pywal: PywalColors = JSON.parse(data);
    const colors = pywal.colors;
    
    // Convert pywal format to base16
    return {
      name,
      colors: {
        foreground: pywal.special.foreground,
        background: pywal.special.background,
        base00: colors.color0 || pywal.special.background,
        base01: colors.color1 || colors.color0 || pywal.special.background,
        base02: colors.color2 || colors.color1 || pywal.special.background,
        base03: colors.color3 || colors.color2 || pywal.special.foreground || "#000000",
        base04: colors.color4 || colors.color3 || pywal.special.foreground || "#000000",
        base05: colors.color5 || pywal.special.foreground || "#ffffff",
        base06: colors.color6 || colors.color5 || pywal.special.foreground || "#ffffff",
        base07: colors.color7 || pywal.special.foreground || "#ffffff",
        base08: colors.color8 || colors.color4 || "#ff0000",
        base09: colors.color9 || colors.color5 || "#ff0000",
        base0a: colors.color10 || colors.color6 || "#ffff00",
        base0b: colors.color11 || colors.color7 || "#00ff00",
        base0c: colors.color12 || colors.color8 || "#00ffff",
        base0d: colors.color13 || colors.color9 || "#0000ff",
        base0e: colors.color14 || colors.color10 || "#ff00ff",
        base0f: colors.color15 || colors.color11 || "#ffff00",
      },
    };
  } catch {
    return null;
  }
}

/**
 * Get all available theme names
 */
export function getThemeNames(): string[] {
  const themesDir = getThemesDir();
  try {
    const files = fs.readdirSync(themesDir);
    return files
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Get theme by name, loaded from JSON file
 */
export function getTheme(name: string): Theme {
  // Check cache first
  if (loadedThemes.has(name)) {
    return loadedThemes.get(name)!;
  }
  
  // Try to load from file
  const theme = loadThemeFromFile(name);
  if (theme) {
    loadedThemes.set(name, theme);
    return theme;
  }
  
  // Default fallback - catppuccin if available, otherwise first available
  const available = getThemeNames();
  const firstTheme = available[0];
  if (available.includes("catppuccin")) {
    return getTheme("catppuccin");
  }
  if (firstTheme) {
    return getTheme(firstTheme);
  }
  
  // Ultimate fallback - hardcoded minimal theme
  return {
    name: "fallback",
    colors: {
      base00: "#1e1e2e",
      base01: "#181825",
      base02: "#313244",
      base03: "#6c7086",
      base04: "#7f849e",
      base05: "#cdd6f4",
      base06: "#e6e9ef",
      base07: "#ffffff",
      base08: "#f38ba8",
      base09: "#fab387",
      base0a: "#f9e2af",
      base0b: "#a6e3a1",
      base0c: "#89dceb",
      base0d: "#89b4fa",
      base0e: "#f5c2e7",
      base0f: "#eba0ac",
    },
  };
}
