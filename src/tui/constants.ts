import { SyntaxStyle } from "@opentui/core";
import { getTheme, mapThemeToUIColors, THEMES, type ThemeName } from "./themes.js";
import { getConfig } from "./config.js";

/**
 * Get current theme from config, default to catppuccin
 */
function getCurrentTheme() {
  const themeName = getConfig("ui", "theme") || "catppuccin";
  return getTheme(themeName as ThemeName);
}

/**
 * Get UIColors for current theme
 */
export function getColors() {
  const theme = getCurrentTheme();
  return mapThemeToUIColors(theme);
}

/**
 * Get theme names for config
 */
export function getAvailableThemes(): string[] {
  return Object.keys(THEMES);
}

/**
 * UI Colors - dynamically loaded from theme
 */
export const COLORS = new Proxy({} as any, {
  get(_target, prop) {
    const colors = getColors();
    return (colors as any)[prop];
  },
});

/**
 * Default Ollama model for chat (kept for backwards compatibility)
 */
export const DEFAULT_MODEL = "Qwen3.5-27B.Q4_K_M__opus4.6_dist:latest";

/**
 * Syntax highlighting theme - dynamically loaded from theme
 */
export function getSyntaxStyle(): SyntaxStyle {
  const theme = getCurrentTheme();
  const c = theme.colors;
  
  return SyntaxStyle.fromTheme([
    // ========== Strings =========
    { scope: ["string"], style: { foreground: "#f1fa8c" } },
    { scope: ["string.quoted"], style: { foreground: c.base0b } },
    { scope: ["string-constant"], style: { foreground: c.base09 } },
    { scope: ["string.regexp"], style: { foreground: c.base0d } },

    // ========== Keywords =========
    { scope: ["keyword"], style: { foreground: c.base0e, bold: true } },
    { scope: ["keyword.control"], style: { foreground: c.base0e } },
    { scope: ["keyword.flow"], style: { foreground: c.base0e } },

    // ========== Numbers, Types, Variables =========
    { scope: ["number"], style: { foreground: c.base0d } },
    { scope: ["type"], style: { foreground: c.base0c } },
    { scope: ["variable"], style: { foreground: c.base09 } },

    // ========== Functions & Methods =========
    { scope: ["function"], style: { foreground: c.base0b, bold: true } },
    { scope: ["function.call"], style: { foreground: c.base0b } },
    { scope: ["method"], style: { foreground: c.base0c } },

    // ========== Comments =========
    { scope: ["comment"], style: { foreground: c.base03, italic: true } },
    { scope: ["doc-comment"], style: { foreground: c.base03 } },

    // ========== Operators =========
    { scope: ["operator"], style: { foreground: c.base05 } },
    { scope: ["punctuation.separator"], style: { foreground: c.base05 } },

    // ========== Classes, Constants, Namespaces =========
    { scope: ["class"], style: { foreground: c.base09, bold: true } },
    { scope: ["namespace"], style: { foreground: c.base0b } },
    { scope: ["constant"], style: { foreground: c.base0d } },

    // ========== Markdown-specific =========
    { scope: ["markup.heading"], style: { bold: true, foreground: c.base0b } },
    { scope: ["markup.heading.1"], style: { bold: true, foreground: c.base0e, underline: true } },
    { scope: ["markup.heading.2"], style: { bold: true, foreground: c.base0d } },
    { scope: ["markup.heading.3"], style: { bold: true, foreground: c.base0c } },
    { scope: ["markup.heading.4"], style: { bold: true, foreground: c.base09 } },
    { scope: ["markup.heading.5"], style: { bold: true, foreground: c.base0a } },
    { scope: ["markup.heading.6"], style: { bold: true, foreground: c.base08 } },

    // Text formatting
    { scope: ["markup.bold"], style: { bold: true, foreground: c.base05 } },
    { scope: ["markup.italic"], style: { italic: true, foreground: c.base05 } },
    { scope: ["markup.strikethrough"], style: { dim: true, foreground: c.base03 } },
    { scope: ["markup.underline"], style: { underline: true, foreground: c.base0c } },

    // Links
    { scope: ["markup.link"], style: { underline: true, foreground: c.base0c } },
    { scope: ["markup.link.url"], style: { foreground: c.base0d, underline: true } },
    { scope: ["markup.uri"], style: { foreground: c.base0d } },

    // Quotes & Lists
    { scope: ["markup.quote"], style: { italic: true, foreground: c.base0d } },
    { scope: ["markup.list"], style: { foreground: c.base0e } },

    // Code
    { scope: ["markup.raw"], style: { foreground: c.base0a, background: c.base02 } },
    { scope: ["markup.raw.code-fence"], style: { bold: true, foreground: c.base0e } },
    { scope: ["markup.raw.inline"], style: { foreground: c.base0a, background: c.base00 } },

    // Code fences
    { scope: ["markup.raw.code-fence"], style: { bold: true, foreground: c.base08 } },
    { scope: ["markup.raw"], style: { foreground: c.base0a } },
  ]);
}

// Export syntax style - call getSyntaxStyle() to get current theme
export function getDefaultSyntaxStyle(): SyntaxStyle {
  return getSyntaxStyle();
}

// Legacy export - returns the actual SyntaxStyle
export const defaultSyntaxStyle = getSyntaxStyle();
