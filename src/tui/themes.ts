/**
 * Base16 color schemes
 * Each scheme has 16 colors: 8 base + 8 bright variants
 */

// Dracula color scheme (base16)
export const dracula = {
  name: "dracula",
  colors: {
    // Base colors (0-7)
    base00: "#282a36", // Default background
    base01: "#383a59", // Lighter background (status bar, etc)
    base02: "#44475a", // Selection background
    base03: "#6272a4", // Comments, secondary text
    base04: "#8b949e", // Dark foreground
    base05: "#f8f8f2", // Default foreground
    base06: "#e6e6e6", // Light foreground
    base07: "#ffffff", // Bright foreground
    
    // Bright colors (8-15)
    base08: "#ff5555", // Red
    base09: "#ffb86c", // Orange
    base0a: "#f1fa8c", // Yellow
    base0b: "#50fa7b", // Green
    base0c: "#8be9fd", // Cyan
    base0d: "#bd93f9", // Purple
    base0e: "#ff79c6", // Pink
    base0f: "#f8f8f2", // Bright white
  },
};

// Catppuccin Mocha
export const catppuccin = {
  name: "catppuccin",
  colors: {
    base00: "#1e1e2e", // Default background (Catppuccin surface0)
    base01: "#181825",  // Darker (surface1)
    base02: "#313244",  // (surface2)
    base03: "#6c7086",  // Comments (overlay0)
    base04: "#7f849e",  // (overlay1)
    base05: "#cdd6f4",  // Default foreground (text)
    base06: "#e6e9ef",  // (subtext1)
    base07: "#ffffff",   // (subtext0)
    
    // Bright
    base08: "#f38ba8", // Red
    base09: "#fab387", // Peach/Orange
    base0a: "#f9e2af", // Yellow
    base0b: "#a6e3a1", // Green
    base0c: "#89dceb", // Sky
    base0d: "#89b4fa", // Blue
    base0e: "#f5c2e7", // Mauve/Pink
    base0f: "#eba0ac", // Flamingo
  },
};

/**
 * All available themes
 */
export const THEMES = {
  dracula,
  catppuccin,
} as const;

export type ThemeName = keyof typeof THEMES;

/**
 * Get theme by name
 */
export function getTheme(name: ThemeName): typeof dracula {
  return THEMES[name] || dracula;
}

/**
 * UI Color aliases for easier use
 */
export interface UIColors {
  // Backgrounds
  background: string;
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
  
  // Syntax highlighting
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
 * Map base16 colors to UI color aliases for a theme
 */
export function mapThemeToUIColors(theme: typeof dracula): UIColors {
  const c = theme.colors;
  return {
    // Backgrounds
    background: c.base00,
    surface: c.base01,
    surfaceAlt: c.base02,
    inputBg: c.base02,
    codeBackground: c.base00,
    
    // Text
    text: c.base05,
    textDim: c.base03,
    textMuted: c.base04,
    textInput: c.base05,
    textPlaceholder: c.base03,
    
    // Accents
    primary: c.base0d,  // Blue/Purple
    secondary: c.base0e, // Pink
    accent: c.base0c,  // Cyan
    success: c.base0b, // Green
    warning: c.base09, // Orange
    error: c.base08,   // Red
    
    // UI Elements
    border: c.base02,
    buttonBg: c.base02,
    buttonText: c.base05,
    
    // Syntax - using Dracula defaults
    keyword: "#ff79c6",
    string: "#f1fa8c",
    number: "#bd93f9",
    type: "#8be9fd",
    function: "#50fa7b",
    comment: "#6272a4",
    operator: "#f8f8f2",
    constant: "#bd93f9",
    variable: "#ffb86c",
  };
}
