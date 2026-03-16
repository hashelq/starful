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
export type ModelIndex = `${ProviderName}/${ModelName}`;

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
 * Create ModelIndex from provider and model strings
 * Format: "provider/model"
 */
export function providerModelIndex(str: `${string}/${string}`): ModelIndex {
  return str as ModelIndex;
}

/**
 * Provider configuration types
 */
export interface ProviderConfig {
  base: string;
  host: string;
  port: number;
  timeout: number;
}

export type ProvidersConfig = Record<ProviderName, ProviderConfig>;

export interface ModelEntry {
  provider: string;
  name: string;
}

/**
 * Models as Record<modelName, { provider, name }>
 */
export type ModelsConfig = Record<ModelIndex, ModelEntry>;

/**
 * Full configuration interface (raw data)
 */
export interface ConfigData {
  providers: ProvidersConfig;
  models: ModelsConfig;
  defaultModel: ModelIndex;
}

/**
 * Config - type-safe access to configuration
 * Parses default model once and remembers it
 */
export class Config {
  private data: ConfigData;
  private _parsedDefaultModel: ({ id: ModelIndex } & ModelEntry) | undefined;
  private _isValid: boolean = false;

  constructor(data: ConfigData) {
    this.data = data;
    // Validate on construction
    this._validate();
    // Parse default model once after validation
    this._parsedDefaultModel = this._parseDefaultModel();
  }

  /**
   * Validate entire config: providers and models
   */
  private _validate(): void {
    this._validateProviders();
    this._validateModels();
    this._isValid = true;
  }

  /**
   * Validate all provider configs exist and have required fields
   */
  private _validateProviders(): void {
    const providers = Object.entries(this.data.providers);
    
    if (providers.length === 0) {
      throw new Error("No providers configured! Add at least one provider.");
    }

    for (const [name, config] of providers) {
      if (!config.host) {
        throw new Error(`Provider "${name}" missing required "host" field`);
      }
      if (!config.port || typeof config.port !== "number") {
        throw new Error(`Provider "${name}" missing required "port" field`);
      }
    }
  }

  /**
   * Validate all models reference valid providers
   */
  private _validateModels(): void {
    const modelIndices = Object.keys(this.data.models);
    
    if (modelIndices.length === 0) {
      throw new Error("No models configured! Add at least one model.");
    }

    for (const index of modelIndices) {
      const [providerNameStr] = index.split("/") as [string];
      const provider = providerName(providerNameStr);
      
      if (!this.data.providers[provider]) {
        throw new Error(
          `Model "${index}" references provider "${providerNameStr}" which is not configured!`
        );
      }
    }
  }

  private _parseDefaultModel(): ({ id: ModelIndex } & ModelEntry) | undefined {
    const defaultModel = this.data.defaultModel;
    if (!defaultModel) return undefined;

    let index = providerModelIndex(defaultModel);
    const modelEntry = this.data.models[index];

    if (!modelEntry)
      throw new Error(`Model "${index}" is default, but not configured!`);

    return {
      id: defaultModel,
      ...modelEntry,
    };
  }

  /**
   * Get provider by name - returns undefined if not found
   */
  getProvider(name: ProviderName): ProviderConfig {
    return this.data.providers[name]!;
  }

  /**
   * Check if provider exists
   */
  hasProvider(name: string): ProviderName | undefined {
    return name in this.data.providers ? providerName(name) : undefined;
  }

  /**
   * Get model by name - returns undefined if not found
   */
  getModel(index: ModelIndex): ModelEntry {
    return this.data.models[index]!;
  }

  /**
   * Check if model exists
   */
  hasModel(index: `${string}/${string}`): ModelIndex | undefined {
    return index in this.data.models ? providerModelIndex(index) : undefined;
  }

  /**
   * Get default model - returns undefined if not set or doesn't exist
   * Returns { id: ModelIndex, provider, name } or undefined
   */
  getDefaultModel(): ({ id: ModelIndex } & ModelEntry) | undefined {
    return this._parsedDefaultModel;
  }

  /**
   * Get all providers as array
   */
  getProviders(): Array<{ name: ProviderName } & ProviderConfig> {
    return Object.entries(this.data.providers).map(([name, config]) => ({
      name: name as ProviderName,
      ...config,
    }));
  }

  /**
   * Get all models as array
   */
  getModels(): Array<{ index: ModelIndex } & ModelEntry> {
    return Object.entries(this.data.models).map(([index, entry]) => ({
      index: index as ModelIndex,
      ...entry,
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
  providers: {
    [providerName("ollama")]: {
      base: "ollama",
      host: "localhost",
      port: 11434,
      timeout: 120000,
    },
  },
  models: {
    [providerModelIndex("ollama/qwen3.5:35b-better")]: {
      provider: providerName("ollama"),
      name: modelName("qwen3.5:35b-better"),
    },
  },
  defaultModel: providerModelIndex("ollama/qwen3.5:35b-better"),
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
function mergeConfig(
  defaults: ConfigData,
  loaded: Partial<ConfigData>,
): ConfigData {
  const result: any = { ...defaults };

  for (const key in loaded) {
    const loadedVal = (loaded as any)[key];
    const defaultVal = (defaults as any)[key];

    if (
      loadedVal &&
      typeof loadedVal === "object" &&
      !Array.isArray(loadedVal) &&
      defaultVal &&
      typeof defaultVal === "object" &&
      !Array.isArray(defaultVal)
    ) {
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
export function getDefaultModel(): ModelIndex | undefined {
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
  const index = providerModelIndex(`${provider}/${model}` as ModelIndex);
  rawConfig.defaultModel = index;

  // Ensure provider exists
  if (!config.hasProvider(provider)) {
    rawConfig.providers[providerName(provider)] = {
      base: provider,
      host: "localhost",
      port: 11434,
      timeout: 120000,
    };
  }

  // Ensure model exists for provider
  rawConfig.models[index] = {
    provider: providerName(provider),
    name: modelName(model),
  };

  saveConfig(rawConfig);
}

/**
 * Get provider config by type
 */
export function getProviderConfig(
  providerType: string,
): ProviderConfig | undefined {
  const config = loadConfig();
  const has = config.hasProvider(providerType);
  if (!has) return undefined;
  return config.getProvider(has);
}

/**
 * Get all models as array
 */
export function getAllModels(): Array<{ index: ModelIndex } & ModelEntry> {
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
