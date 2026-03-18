import { SyntaxStyle } from "@opentui/core";
import { getTheme, getThemeNames, type Theme } from "./themes.js";
import { getTheme as getUITheme, setTheme as setUITheme } from "./ui-config.js";
import { themeService, type ThemeEventPayload } from "./theme.js";

// Re-export for convenience
export { getTheme, getThemeNames, type Theme } from "./themes.js";
export { getTheme as getCurrentTheme, setTheme as setUITheme } from "./ui-config.js";

/**
 * Color palette interface
 */
export interface ColorPalette {
  // Special - base terminal colors
  foreground: string;
  background: string;

  // Backgrounds
  surface: string;
  surfaceAlt: string;
  inputBg: string;
  codeBackground: string;

  // Text
  text: string;
  textDim: string;
  textMuted: string;
  textInput: string;
  textPlaceholder: string;
  inputText: string;

  // User/Assistant text colors
  userText: string;
  assistantText: string;
  dimText: string;

  // Input
  placeholderText: string;

  // Accents
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;

  // UI Elements
  border: string;
  buttonBg: string;
  buttonText: string;

  // Code block specific
  languageLabel: string;
  copyButtonBg: string;
  copyButtonText: string;

  // Syntax colors
  keyword: string;
  string: string;
  number: string;
  type: string;
  function: string;
  comment: string;
  operator: string;
  constant: string;
  variable: string;
}

/**
 * Get current theme from UI config, default to catppuccin
 */
function getCurrentTheme(): Theme {
  const themeName = getUITheme() || "catppuccin";
  return getTheme(themeName);
}

/**
 * Synthesize a gray color from background color
 * Mixes background with a small amount of white to create a comfortable gray
 * that works with any theme (light or dark)
 */
function synthesizeGray(background: string, amount: number = 0.15): string {
  // Parse hex color
  const hex = background.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Mix with white to create gray
  const mixedR = Math.round(r + (255 - r) * amount);
  const mixedG = Math.round(g + (255 - g) * amount);
  const mixedB = Math.round(b + (255 - b) * amount);
  
  return `#${mixedR.toString(16).padStart(2, '0')}${mixedG.toString(16).padStart(2, '0')}${mixedB.toString(16).padStart(2, '0')}`;
}

/**
 * Synthesize a darker gray (for code blocks) from background
 */
function synthesizeDarkGray(background: string, amount: number = 0.08): string {
  const hex = background.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Mix with black to create darker gray
  const mixedR = Math.round(r * (1 - amount));
  const mixedG = Math.round(g * (1 - amount));
  const mixedB = Math.round(b * (1 - amount));
  
  return `#${mixedR.toString(16).padStart(2, '0')}${mixedG.toString(16).padStart(2, '0')}${mixedB.toString(16).padStart(2, '0')}`;
}

/**
 * Map theme colors to UI color aliases
 */
function buildPalette(theme: Theme): ColorPalette {
  const c = theme.colors;

  return {
    // Special - base terminal colors
    foreground: c.foreground,
    background: c.background,

    // Backgrounds - use synthesized grays for consistency
    surface: c.background,
    surfaceAlt: synthesizeGray(c.background, 0.05),
    inputBg: synthesizeGray(c.background, 0.12),
    codeBackground: synthesizeDarkGray(c.background, 0.06),

    // Text
    text: c.foreground,
    textDim: synthesizeGray(c.background, 0.25),
    textMuted: synthesizeGray(c.background, 0.35),
    textInput: c.foreground,
    textPlaceholder: synthesizeGray(c.background, 0.3),

    // User/Assistant text colors
    userText: synthesizeGray(c.background, 0.35),
    assistantText: c.foreground,
    dimText: synthesizeGray(c.background, 0.25),

    // Input
    placeholderText: synthesizeGray(c.background, 0.3),
    inputText: c.foreground,

    // Accents
    primary: synthesizeGray(c.background, 0.35),
    secondary: c.base0e,
    accent: c.base0c,
    success: c.base02,
    warning: c.base09,
    error: c.base01,

    // UI Elements
    border: synthesizeGray(c.background, 0.1),
    buttonBg: synthesizeGray(c.background, 0.12),
    buttonText: c.base05,

    // Code block specific
    languageLabel: c.base0c,
    copyButtonBg: c.foreground,
    copyButtonText: c.background,

    // Syntax colors
    keyword: c.base0e,
    string: c.base0a,
    number: c.base0d,
    type: c.base0c,
    function: c.base0b,
    comment: c.base03,
    operator: c.base05,
    constant: c.base0d,
    variable: c.base09,
  };
}

// ============================================================================
// Color System - Initialize once at startup
// ============================================================================

let _palette: ColorPalette | null = null;
let _syntaxStyle: SyntaxStyle | null = null;

/**
 * Initialize the color system with the current theme.
 * Call this once at app startup.
 */
export function initColors(): void {
  const theme = getCurrentTheme();
  _palette = buildPalette(theme);
  _syntaxStyle = buildSyntaxStyle(theme);
  defaultSyntaxStyle = _syntaxStyle;
}

/**
 * Internal function to emit theme change event to all subscribers
 */
function emitThemeChange(): void {
  const newPalette = _palette!;
  // Cast ColorPalette to Record<string, string> - TypeScript type workaround
  const colors: Record<string, string> = {} as any;
  Object.assign(colors, newPalette);
  const payload: ThemeEventPayload = { colors };
  themeService.notifyThemeChange(payload);
}

/**
 * Set the theme and reinitialize colors, notifying all subscribers.
 * Returns true if theme was changed.
 */
export function setTheme(themeName: string): boolean {
  const currentTheme = getUITheme();
  if (currentTheme === themeName) return false;
  
  // Update saved theme in config
  setUITheme(themeName);
  
  // Get new theme data and rebuild palette
  const newTheme = getCurrentTheme();
  _palette = buildPalette(newTheme);
  _syntaxStyle = buildSyntaxStyle(newTheme);
  defaultSyntaxStyle = _syntaxStyle;
  
  // Notify all components about theme change
  emitThemeChange();
  return true;
}

/**
 * Get the current color palette.
 * Must call initColors() first.
 */
export function getPalette(): ColorPalette {
  if (!_palette) {
    throw new Error("Colors not initialized. Call initColors() first.");
  }
  return _palette;
}

/**
 * Get theme names for config
 */
export function getAvailableThemes(): string[] {
  return getThemeNames();
}

/**
 * UI Colors - initialized color palette
 */
export const COLORS = new Proxy({} as ColorPalette, {
  get(_target, prop) {
    const palette = getPalette();
    return (palette as any)[prop];
  },
});

// ============================================================================
// Syntax Style
// ============================================================================

function buildSyntaxStyle(theme: Theme): SyntaxStyle {
  const c = theme.colors;

  return SyntaxStyle.fromTheme([
    // Default text - matches anything not matched by other scopes
    { scope: ["text"], style: { foreground: c.base05 } },
    { scope: ["plaintext"], style: { foreground: c.base05 } },

    // ========== Strings =========
    { scope: ["string"], style: { foreground: c.base0a } },
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
    {
      scope: ["markup.heading.1"],
      style: { bold: true, foreground: c.base0e, underline: true },
    },
    {
      scope: ["markup.heading.2"],
      style: { bold: true, foreground: c.base0d },
    },
    {
      scope: ["markup.heading.3"],
      style: { bold: true, foreground: c.base0c },
    },
    {
      scope: ["markup.heading.4"],
      style: { bold: true, foreground: c.base09 },
    },
    {
      scope: ["markup.heading.5"],
      style: { bold: true, foreground: c.base0a },
    },
    {
      scope: ["markup.heading.6"],
      style: { bold: true, foreground: c.base08 },
    },

    // Text formatting
    { scope: ["markup.bold"], style: { bold: true, foreground: c.base05 } },
    { scope: ["markup.italic"], style: { italic: true, foreground: c.base05 } },
    {
      scope: ["markup.strikethrough"],
      style: { dim: true, foreground: c.base03 },
    },
    {
      scope: ["markup.underline"],
      style: { underline: true, foreground: c.base0c },
    },

    // Links
    {
      scope: ["markup.link"],
      style: { underline: true, foreground: c.base0c },
    },
    {
      scope: ["markup.link.url"],
      style: { foreground: c.base0d, underline: true },
    },
    { scope: ["markup.uri"], style: { foreground: c.base0d } },

    // Quotes & Lists
    { scope: ["markup.quote"], style: { italic: true, foreground: c.base0d } },
    { scope: ["markup.list"], style: { foreground: c.base0e } },

    // Code
    {
      scope: ["markup.raw"],
      style: { foreground: c.base0a, background: c.base02 },
    },
    {
      scope: ["markup.raw.code-fence"],
      style: { bold: true, foreground: c.base0e },
    },
    {
      scope: ["markup.raw.inline"],
      style: { foreground: c.base0a, background: c.base00 },
    },

    // Code fences
    {
      scope: ["markup.raw.code-fence"],
      style: { bold: true, foreground: c.base08 },
    },
    { scope: ["markup.raw"], style: { foreground: c.base0a } },
  ]);
}

/**
 * Get the syntax highlighting style for the current theme.
 * Must call initColors() first.
 */
export function getSyntaxStyle(): SyntaxStyle {
  if (!_syntaxStyle) {
    throw new Error("Colors not initialized. Call initColors() first.");
  }
  return _syntaxStyle;
}

/**
 * Get the default syntax style (for backwards compatibility)
 */
export function getDefaultSyntaxStyle(): SyntaxStyle {
  return getSyntaxStyle();
}

/**
 * Default syntax style (for backwards compatibility)
 */
export let defaultSyntaxStyle: SyntaxStyle;
