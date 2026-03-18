import fs from "node:fs";
import path from "node:path";

/**
 * Provider configuration types
 */
export interface ProviderConfig {
  base: string;
  host?: string;
  port?: number;
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Model entry - contains model metadata
 */
export interface ModelEntry {
  provider: string;
  name: string;
}

/**
 * Full configuration interface (raw data)
 * Models are now keyed by provider: Record<provider, ModelEntry[]>
 */
export interface ConfigData {
  providers: Record<string, ProviderConfig>;
  models: Record<string, ModelEntry[]>;  // Keyed by provider name
  defaultModel: { provider: string; name: string };
}

/**
 * Config - type-safe access to configuration
 */
export class Config {
  private data: ConfigData;
  private _validated: boolean = false;

  constructor(data: ConfigData) {
    this.data = data;
    this.validate();
  }

  /**
   * Validate entire config
   */
  private validate(): void {
    if (this._validated) return;
    
    this.validateProviders();
    this.validateModels();
    
    this._validated = true;
  }

  /**
   * Validate all provider configs exist and have required fields
   */
  private validateProviders(): void {
    const providers = Object.entries(this.data.providers);
    
    if (providers.length === 0) {
      throw new Error("No providers configured! Add at least one provider.");
    }

    for (const [name, config] of providers) {
      const hasHostPort = config.host && config.port;
      const hasBaseUrl = config.baseUrl;
      
      if (!hasHostPort && !hasBaseUrl) {
        throw new Error(
          `Provider "${name}" must have either "host"+"port" or "baseUrl"`
        );
      }
    }
  }

  /**
   * Validate all models reference valid providers
   */
  private validateModels(): void {
    const allModels = this.getAllModelsFlat();
    
    if (allModels.length === 0) {
      throw new Error("No models configured! Add at least one model.");
    }

    for (const model of allModels) {
      if (!this.data.providers[model.provider]) {
        throw new Error(
          `Model "${model.name}" references provider "${model.provider}" which is not configured!`
        );
      }
    }
  }

  // ─────────────────────────────────────────────
  // Provider Methods
  // ─────────────────────────────────────────────

  /**
   * Get provider config by name
   */
  getProvider(name: string): ProviderConfig | undefined {
    return this.data.providers[name];
  }

  /**
   * Check if provider exists
   */
  hasProvider(name: string): boolean {
    return name in this.data.providers;
  }

  /**
   * Get all providers as array
   */
  getProviders(): Array<{ name: string } & ProviderConfig> {
    return Object.entries(this.data.providers).map(([name, config]) => ({
      name,
      ...config,
    }));
  }

  // ─────────────────────────────────────────────
  // Model Methods
  // ─────────────────────────────────────────────

  /**
   * Find model by "provider/model" string
   */
  findModel(index: string): ModelEntry | undefined {
    const lastSlash = index.lastIndexOf("/");
    if (lastSlash === -1) return undefined;
    
    const provider = index.slice(0, lastSlash);
    const name = index.slice(lastSlash + 1);
    
    return this.findModelByProviderAndName(provider, name);
  }

  /**
   * Find model by provider and name
   */
  findModelByProviderAndName(provider: string, name: string): ModelEntry | undefined {
    const models = this.data.models[provider];
    if (!models) return undefined;
    
    return models.find(m => m.name === name);
  }

  /**
   * Check if model exists
   */
  hasModel(index: string): boolean {
    return this.findModel(index) !== undefined;
  }

  /**
   * Get models for a specific provider
   */
  getModels(provider: string): ModelEntry[] {
    return this.data.models[provider] ?? [];
  }

  /**
   * Get all models as flat array
   */
  getAllModelsFlat(): ModelEntry[] {
    const result: ModelEntry[] = [];
    for (const models of Object.values(this.data.models)) {
      result.push(...models);
    }
    return result;
  }

  /**
   * Get default model
   */
  getDefaultModel(): { provider: string; name: string } | undefined {
    return this.data.defaultModel;
  }

  // ─────────────────────────────────────────────
  // Serialization
  // ─────────────────────────────────────────────

  /**
   * Get the raw config data
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
    ollama: {
      base: "ollama",
      host: "localhost",
      port: 11434,
      timeout: 120000,
    },
  },
  models: {
    ollama: [
      { provider: "ollama", name: "qwen3.5:35b-better" },
    ],
  },
  defaultModel: { provider: "ollama", name: "qwen3.5:35b-better" },
};

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
      const config = mergeConfig(DEFAULT_CONFIG, loaded);
      saveConfig(config);
      return new Config(config);
    }
  } catch (error) {
    console.warn("Failed to load config, using defaults:", error);
  }

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
 * Deep merge two configs
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

// ─────────────────────────────────────────────
// Convenience Helper Functions
// ─────────────────────────────────────────────

/**
 * Get default model
 */
export function getDefaultModel(): { provider: string; name: string } | undefined {
  const config = loadConfig();
  return config.getDefaultModel();
}

/**
 * Parse default model (backward compatible)
 */
export function parseDefaultModel(): { provider: string; model: string } {
  const defaultModel = getDefaultModel();
  if (!defaultModel) {
    return { provider: "ollama", model: "qwen3.5:35b-better" };
  }
  return {
    provider: defaultModel.provider,
    model: defaultModel.name,
  };
}

/**
 * Set default model
 */
export function setDefaultModel(provider: string, model: string): void {
  const config = loadConfig();
  const rawConfig = config.toJSON();
  
  // Ensure provider exists
  if (!rawConfig.providers[provider]) {
    rawConfig.providers[provider] = {
      base: provider,
      host: "localhost",
      port: 11434,
      timeout: 120000,
    };
  }

  // Ensure model array exists for provider
  if (!rawConfig.models[provider]) {
    rawConfig.models[provider] = [];
  }

  // Add model if not exists
  const exists = rawConfig.models[provider].some(m => m.name === model);
  if (!exists) {
    rawConfig.models[provider].push({ provider, name: model });
  }

  rawConfig.defaultModel = { provider, name: model };
  saveConfig(rawConfig);
}

/**
 * Get provider config
 */
export function getProviderConfig(provider: string): ProviderConfig | undefined {
  const config = loadConfig();
  return config.getProvider(provider);
}

/**
 * Get all models
 */
export function getAllModels(): ModelEntry[] {
  const config = loadConfig();
  return config.getAllModelsFlat();
}
