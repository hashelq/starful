import fs from "node:fs";
import path from "node:path";

/**
 * Provider configuration types
 */
export interface OllamaProviderConfig {
  type: "ollama";
  host: string;
  port: number;
  timeout: number;
}

export interface ModelConfig {
  name: string;
}

export type ProviderConfig = OllamaProviderConfig;

export interface ModelsConfig {
  [provider: string]: ModelConfig;
}

export interface ProvidersConfig {
  [provider: string]: ProviderConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  providers: {
    ollama: {
      type: "ollama" as const,
      host: "localhost",
      port: 11434,
      timeout: 120000,
    },
  },
  models: {
    ollama: {
      name: "qwen3.5:35b-better",
    },
  },
  defaultModel: "ollama/qwen3.5:35b-better",
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
 * Creates config file with defaults on first run
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
  
  // First run - save default config
  saveConfig(DEFAULT_CONFIG);
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
 * Get default model in "provider/model" format
 */
export function getDefaultModel(): string {
  const config = loadConfig();
  return config.defaultModel;
}

/**
 * Parse default model to get provider and model name
 * Returns { provider: "ollama", model: "qwen3.5:35b-better" }
 */
export function parseDefaultModel(): { provider: string; model: string } {
  const defaultModel = getDefaultModel();
  const [provider, ...modelParts] = defaultModel.split("/");
  return {
    provider: provider || "ollama",
    model: modelParts.join("/") || "qwen3.5:35b-better",
  };
}

/**
 * Set default model in "provider/model" format
 */
export function setDefaultModel(provider: string, model: string): void {
  const config = loadConfig();
  config.defaultModel = `${provider}/${model}`;
  
  // Ensure provider exists
  if (!(config.providers as ProvidersConfig)[provider]) {
    (config.providers as ProvidersConfig)[provider] = {
      type: "ollama",
      host: "localhost",
      port: 11434,
      timeout: 120000,
    };
  }
  
  // Ensure model exists for provider
  const models = config.models as ModelsConfig;
  if (!models[provider]) {
    models[provider] = { name: model };
  } else {
    models[provider].name = model;
  }
  
  saveConfig(config);
}

/**
 * Get provider config by name
 */
export function getProviderConfig(provider: string): ProviderConfig | undefined {
  const config = loadConfig();
  return (config.providers as ProvidersConfig)[provider];
}

/**
 * Get model config by provider name
 */
export function getModelConfig(provider: string): ModelConfig | undefined {
  const config = loadConfig();
  return (config.models as ModelsConfig)[provider];
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
