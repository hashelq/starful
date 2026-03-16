import fs from "node:fs";
import path from "node:path";

/**
 * Generic Brand type for creating type-safe branded types
 * Usage: type ModelName = Brand<string, "ModelName">
 */
export type Brand<T, B extends string> = T & { readonly brand: B };

/**
 * Branded types
 */
export type ProviderName = Brand<string, "ProviderName">;
export type ModelName = Brand<string, "ModelName">;
export type ProviderModelName = `${ProviderName}/${ModelName}`;

/**
 * Brand a string as ModelName
 */
export function modelName(value: string): ModelName {
  return value as ModelName;
}

/**
 * Brand a string as ProviderName  
 */
export function providerName(value: string): ProviderName {
  return value as ProviderName;
}

/**
 * Create ProviderModelName from provider and model strings
 * Format: "provider/model"
 */
export function providerModelName(provider: string, model: string): ProviderModelName {
  return `${provider}/${model}` as ProviderModelName;
}

/**
 * Parse a ProviderModelName string into provider and model strings
 */
export function parseProviderModelName(value: ProviderModelName): { provider: string; model: string } {
  const parts = (value as string).split("/");
  return {
    provider: parts[0] ?? "",
    model: parts.slice(1).join("/") ?? "",
  };
}

/**
 * Provider configuration types
 */
export interface OllamaProviderConfig {
  type: "ollama";
  host: string;
  port: number;
  timeout: number;
}

export type ProviderConfig = OllamaProviderConfig;

export interface ModelEntry {
  provider: string;
  name: string;
}

/**
 * Models as Record<modelName, { provider, name }>
 */
export type ModelsConfig = Record<ModelName, ModelEntry>;

/**
 * Full configuration interface (raw data)
 */
export interface ConfigData {
  providers: ProviderConfig[];
  models: ModelsConfig;
  defaultModel: ProviderModelName;
}

/**
 * Config - type-safe access to configuration
 * Parses default model once and remembers it
 */
export class Config {
  private data: ConfigData;
  private _parsedDefaultModel: ({ id: ProviderModelName } & ModelEntry) | undefined;

  constructor(data: ConfigData) {
    this.data = data;
    // Parse default model once
    this._parsedDefaultModel = this._parseDefaultModel();
  }

  private _parseDefaultModel(): ({ id: ProviderModelName } & ModelEntry) | undefined {
    const defaultModel = this.data.defaultModel;
    if (!defaultModel) return undefined;
    
    const { model } = parseProviderModelName(defaultModel);
    const modelEntry = this.data.models[modelName(model)];
    
    if (!modelEntry) return undefined;
    
    return {
      id: defaultModel,
      ...modelEntry,
    };
  }

  /**
   * Get provider by name - returns undefined if not found
   */
  getProvider(name: string): ProviderConfig | undefined {
    return this.data.providers.find(p => p.type === name);
  }

  /**
   * Check if provider exists
   */
  hasProvider(name: string): boolean {
    return this.data.providers.some(p => p.type === name);
  }

  /**
   * Get model by name - returns undefined if not found
   */
  getModel(name: ModelName): ModelEntry | undefined {
    return this.data.models[name];
  }

  /**
   * Check if model exists
   */
  hasModel(name: ModelName): boolean {
    return name in this.data.models;
  }

  /**
   * Get default model - returns undefined if not set or doesn't exist
   * Returns { id: ProviderModelName, provider, name } or undefined
   */
  getDefaultModel(): ({ id: ProviderModelName } & ModelEntry) | undefined {
    return this._parsedDefaultModel;
  }

  /**
   * Get all providers
   */
  getProviders(): ProviderConfig[] {
    return this.data.providers;
  }

  /**
   * Get all models
   */
  getModels(): Array<{ name: ModelName; provider: string }> {
    return Object.entries(this.data.models).map(([name, entry]) => ({
      name: name as ModelName,
      provider: entry.provider,
    }));
  }

  /**
   * Get the raw config data (for serialization)
   */
  toJSON(): ConfigData {
    return this.data;
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ConfigData = {
  providers: [
    {
      type: "ollama",
      host: "localhost",
      port: 11434,
      timeout: 120000,
    },
  ],
  models: {
    [modelName("qwen3.5:35b-better")]: {
      provider: providerName("ollama"),
      name: modelName("qwen3.5:35b-better"),
    },
  },
  defaultModel: providerModelName("ollama", "qwen3.5:35b-better"),
};

/**
 * Configuration type (for backward compatibility)
 */
export type ConfigType = Config;

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
 * Returns Config for type-safe access
 */
export function loadConfig(): Config {
  const configPath = getConfigPath();
  
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      const loaded = JSON.parse(data);
      const config = mergeConfig(DEFAULT_CONFIG, loaded);
      
      // Save to ensure all defaults are present
      saveConfig(config);
      return new Config(config);
    }
  } catch (error) {
    console.warn("Failed to load config, using defaults:", error);
  }
  
  // First run - save default config
  saveConfig(DEFAULT_CONFIG);
  return new Config({ ...DEFAULT_CONFIG });
}

/**
 * Save configuration to file
 */
export function saveConfig(config: ConfigData | Config): void {
  const configPath = getConfigPath();
  ensureConfigDir();
  
  const data = config instanceof Config ? config.toJSON() : config;
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save config:", error);
  }
}

/**
 * Deep merge two configs (defaults + loaded)
 */
function mergeConfig(defaults: ConfigData, loaded: Partial<ConfigData>): ConfigData {
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
export function getDefaultModel(): ProviderModelName | undefined {
  const config = loadConfig();
  return config.getDefaultModel()?.id;
}

/**
 * Parse default model to get provider and model name
 * Returns { provider: "ollama", model: "qwen3.5:35b-better" }
 */
export function parseDefaultModel(): { provider: string; model: string } {
  const config = loadConfig();
  const defaultModel = config.getDefaultModel();
  if (!defaultModel) {
    return { provider: "ollama", model: "qwen3.5:35b-better" };
  }
  return {
    provider: defaultModel.provider,
    model: defaultModel.name,
  };
}

/**
 * Set default model in "provider/model" format
 */
export function setDefaultModel(provider: string, model: string): void {
  const config = loadConfig();
  const rawConfig = config.toJSON();
  rawConfig.defaultModel = providerModelName(provider, model);
  
  // Ensure provider exists
  if (!config.hasProvider(provider)) {
    rawConfig.providers.push({
      type: "ollama",
      host: "localhost",
      port: 11434,
      timeout: 120000,
    } as ProviderConfig);
  }
  
  // Ensure model exists for provider
  rawConfig.models[modelName(model)] = { provider: providerName(provider), name: modelName(model) };
  
  saveConfig(rawConfig);
}

/**
 * Get provider config by type
 */
export function getProviderConfig(providerType: string): ProviderConfig | undefined {
  const config = loadConfig();
  return config.getProvider(providerType);
}

/**
 * Get all models as array
 */
export function getAllModels(): Array<{ provider: string; name: ModelName }> {
  const config = loadConfig();
  return config.getModels();
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
export function updateConfig(updates: Partial<ConfigData>): ConfigData {
  const current = loadConfig();
  const currentData = current.toJSON();
  const merged = mergeConfig(currentData, updates);
  saveConfig(merged);
  return merged;
}
