import fs from "node:fs";
import path from "node:path";

/**
 * UI Configuration
 */

export interface UIConfig {
  theme: string;
  centered: boolean;
  centeredWidth?: number;
}

/**
 * Default UI config
 */
export const DEFAULT_UI_CONFIG: UIConfig = {
  theme: "catppuccin",
  centered: false,
  centeredWidth: 90,
};

/**
 * Get ui config file path
 */
function getUIConfigPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "/tmp";
  return path.join(home, ".starful", "ui.json");
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  const configPath = getUIConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load UI configuration from file or return defaults
 * Creates ui.json with defaults on first run
 */
export function loadUIConfig(): UIConfig {
  const configPath = getUIConfigPath();
  
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      const loaded = JSON.parse(data);
      return { ...DEFAULT_UI_CONFIG, ...loaded };
    }
  } catch (error) {
    console.warn("Failed to load UI config, using defaults:", error);
  }
  
  // First run - save default UI config
  saveUIConfig(DEFAULT_UI_CONFIG);
  return { ...DEFAULT_UI_CONFIG };
}

/**
 * Save UI configuration to file
 */
export function saveUIConfig(config: UIConfig): void {
  const configPath = getUIConfigPath();
  ensureConfigDir();
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save UI config:", error);
  }
}

/**
 * Get current theme from UI config
 */
export function getTheme(): string {
  const config = loadUIConfig();
  return config.theme;
}

/**
 * Set theme in UI config
 */
export function setTheme(theme: string): void {
  const config = loadUIConfig();
  config.theme = theme;
  saveUIConfig(config);
}

/**
 * Get centered mode from UI config
 */
export function isCentered(): boolean {
  const config = loadUIConfig();
  return config.centered;
}

/**
 * Get centered width from UI config (in characters)
 */
export function getCenteredWidth(): number {
  const config = loadUIConfig();
  return config.centeredWidth ?? 90;
}

/**
 * Set centered mode in UI config
 */
export function setCentered(centered: boolean): void {
  const config = loadUIConfig();
  config.centered = centered;
  saveUIConfig(config);
}
