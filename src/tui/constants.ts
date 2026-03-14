import { SyntaxStyle } from "@opentui/core";

/**
 * Default Ollama model for chat
 */
export const DEFAULT_MODEL = "Qwen3.5-27B.Q4_K_M__opus4.6_dist:latest";

/**
 * UI Colors - Dracula-inspired theme
 */
export const COLORS = {
  // Backgrounds
  codeBackground: "#1e1e1e",
  darkBackground: "#282a36",
  inputBackground: "#44475a",

  // Text
  userText: "#3fb950",       // Green for user messages
  assistantText: "#a5d6ff",  // Blue for assistant messages
  dimText: "#6272a4",        // Gray for secondary text
  inputText: "#f0f6fc",      // Input text color
  placeholderText: "#90969d",

  // Accents
  header: "#50fa7b",         // Green headers
  keyword: "#ff79c6",        // Pink keywords
  string: "#a5d6ff",         // Blue strings
  number: "#bd93f9",         // Purple numbers
  function: "#50fa7b",       // Green functions
  comment: "#6272a4",        // Gray comments
  type: "#8be9fd",          // Cyan types

  // UI Elements
  copyButtonBg: "#44475a",
  copyButtonText: "#f8f8f2",
  languageLabel: "lime",

  // Errors
  error: "#f85149",

  // Borders
  border: "#44475a",
} as const;

/**
 * Syntax highlighting theme for code/markdown
 */
export const defaultSyntaxStyle = SyntaxStyle.fromTheme([
  // ========== Strings =========
  { scope: ["string"], style: { foreground: "#a5d6ff" } },
  { scope: ["string.quoted"], style: { foreground: "#7ee787" } },
  { scope: ["string-constant"], style: { foreground: "#ffa657" } },
  { scope: ["string.regexp"], style: { foreground: "#79c0ff" } },

  // ========== Keywords =========
  { scope: ["keyword"], style: { foreground: "#ff79c6", bold: true } },
  { scope: ["keyword.control"], style: { foreground: "#ff79c6" } },
  { scope: ["keyword.flow"], style: { foreground: "#ff79c6" } },

  // ========== Numbers, Types, Variables =========
  { scope: ["number"], style: { foreground: "#bd93f9" } },
  { scope: ["type"], style: { foreground: "#8be9fd" } },
  { scope: ["variable"], style: { foreground: "#ffb86c" } },

  // ========== Functions & Methods =========
  { scope: ["function"], style: { foreground: "#50fa7b", bold: true } },
  { scope: ["function.call"], style: { foreground: "#50fa7b" } },
  { scope: ["method"], style: { foreground: "#8be9fd" } },

  // ========== Comments =========
  { scope: ["comment"], style: { foreground: "#6272a4", italic: true } },
  { scope: ["doc-comment"], style: { foreground: "#6272a4" } },

  // ========== Operators =========
  { scope: ["operator"], style: { foreground: "#fff" } },
  { scope: ["punctuation.separator"], style: { foreground: "#f8f8f2" } },

  // ========== Classes, Constants, Namespaces =========
  { scope: ["class"], style: { foreground: "#ffb86c", bold: true } },
  { scope: ["namespace"], style: { foreground: "#50fa7b" } },
  { scope: ["constant"], style: { foreground: "#bd93f9" } },

  // ========== Markdown-specific (CLI-friendly) =========
  // Headers - bold + bright colors for visibility in terminal
  { scope: ["markup.heading"], style: { bold: true, foreground: "#50fa7b" } },
  { scope: ["markup.heading.1"], style: { bold: true, foreground: "#ff79c6", underline: true } },
  { scope: ["markup.heading.2"], style: { bold: true, foreground: "#bd93f9" } },
  { scope: ["markup.heading.3"], style: { bold: true, foreground: "#8be9fd" } },
  { scope: ["markup.heading.4"], style: { bold: true, foreground: "#ffb86c" } },
  { scope: ["markup.heading.5"], style: { bold: true, foreground: "#f1fa8c" } },
  { scope: ["markup.heading.6"], style: { bold: true, foreground: "#ff5555" } },

  // Text formatting
  { scope: ["markup.bold"], style: { bold: true, foreground: "#f8f8f2" } },
  { scope: ["markup.italic"], style: { italic: true, foreground: "#f8f8f2" } },
  { scope: ["markup.strikethrough"], style: { dim: true, foreground: "#6272a4" } },
  { scope: ["markup.underline"], style: { underline: true, foreground: "#8be9fd" } },

  // Links
  { scope: ["markup.link"], style: { underline: true, foreground: "#8be9fd" } },
  { scope: ["markup.link.url"], style: { foreground: "#79c0ff", underline: true } },
  { scope: ["markup.uri"], style: { foreground: "#79c0ff" } },

  // Quotes & Lists
  { scope: ["markup.quote"], style: { italic: true, foreground: "#bd93f9" } },
  { scope: ["markup.list"], style: { foreground: "#ff79c6" } },

  // Code (inline & fences)
  { scope: ["markup.raw"], style: { foreground: "#f1fa8c", background: "#44475a" } },
  { scope: ["markup.raw.code-fence"], style: { bold: true, foreground: "#ff79c6" } },
  { scope: ["markup.raw.inline"], style: { foreground: "#f1fa8c", background: "#282a36" } },

  // Code fences (```)
  { scope: ["markup.raw.code-fence"], style: { bold: true, foreground: "#ff5555" } },
  { scope: ["markup.raw"], style: { foreground: "#f1fa8c" } },
]);
