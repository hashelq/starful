import fs from "node:fs";
import path from "node:path";

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  ollama: {
    host: "localhost",
    port: 11434,
    timeout: 120000,
  },
  model: "Qwen3.5-27B.Q4_K_M__opus4.6_dist:latest",
  ui: {
    theme: "catppuccin",
  },
};

/**
 * Configuration type
 */
export type Config = typeof DEFAULT_CONFIG;

/**
 * Get config file path
 */
function getConfigPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "/tmp";
  return path.join(home, ".starful", "config.json");
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load configuration from file or return defaults
 */
export function loadConfig(): Config {
  const configPath = getConfigPath();
  
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      const loaded = JSON.parse(data);
      return mergeConfig(DEFAULT_CONFIG, loaded);
    }
  } catch (error) {
    console.warn("Failed to load config, using defaults:", error);
  }
  
  return { ...DEFAULT_CONFIG };
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  ensureConfigDir();
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save config:", error);
  }
}

/**
 * Deep merge two configs (defaults + loaded)
 */
function mergeConfig(defaults: Config, loaded: Partial<Config>): Config {
  const result: any = { ...defaults };
  
  for (const key in loaded) {
    const loadedVal = (loaded as any)[key];
    const defaultVal = (defaults as any)[key];
    
    if (loadedVal && typeof loadedVal === "object" && !Array.isArray(loadedVal) &&
        defaultVal && typeof defaultVal === "object" && !Array.isArray(defaultVal)) {
      result[key] = mergeConfig(defaultVal, loadedVal);
    } else if (loadedVal !== undefined) {
      result[key] = loadedVal;
    }
  }
  
  return result;
}

/**
 * Get a specific config value
 */
export function getConfig(key?: string, subKey?: string): any {
  const config = loadConfig();
  if (!key) return config;
  
  const keyConfig = (config as any)[key];
  if (!keyConfig) return undefined;
  
  if (subKey) {
    return keyConfig[subKey];
  }
  return keyConfig;
}

/**
 * Update config value
 */
export function updateConfig(updates: Partial<Config>): Config {
  const current = loadConfig();
  const merged = mergeConfig(current, updates);
  saveConfig(merged);
  return merged;
}
