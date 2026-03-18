import { EventEmitter } from "../EventEmitter.js";
import {
  loadConfig,
  type Config,
  type ProviderConfig,
  type ModelEntry,
} from "../config.js";

/**
 * ProviderModelManager - Manages provider and model configuration
 * Uses Config internally but provides a cleaner API
 * 
 * Key principles:
 * - Getters return valid objects (never undefined)
 * - Finders return optional (can be undefined)
 * - Setters accept ModelEntry (type-safe)
 */
export class ProviderModelManager extends EventEmitter {
  private config: Config;
  private currentModel!: ModelEntry;
  private currentProviderConfig!: ProviderConfig;

  /**
   * @param config Optional Config instance. If not provided, loads from disk.
   */
  constructor(config?: Config) {
    super();
    
    // Use provided config or load from disk
    this.config = config ?? loadConfig();
    
    // Initialize with default model
    this.initializeDefaultModel();
  }

  /**
   * Reinitialize with a new Config (after config save)
   */
  reloadConfig(config: Config): void {
    this.config = config;
    // Re-validate current model still exists
    const modelExists = this.config.findModel(
      `${this.currentModel.provider}/${this.currentModel.name}`
    );
    if (!modelExists) {
      // Fall back to default
      this.initializeDefaultModel();
    }
  }

  /**
   * Initialize with default model from config
   */
  private initializeDefaultModel(): void {
    const { provider, name } = this.parseDefaultModel();
    const modelEntry = this.findModel(`${provider}/${name}`);
    
    if (!modelEntry) {
      throw new Error(`Default model "${provider}/${name}" not found`);
    }
    
    const providerConfig = this.findProviderConfig(provider);
    if (!providerConfig) {
      throw new Error(`Default provider "${provider}" not found`);
    }
    
    this.currentModel = modelEntry;
    this.currentProviderConfig = providerConfig;
  }

  /**
   * Parse default model from config
   */
  private parseDefaultModel(): { provider: string; name: string } {
    const defaultModel = this.config.getDefaultModel();
    if (!defaultModel) {
      return { provider: "ollama", name: "qwen3.5:35b-better" };
    }
    return defaultModel;
  }

  // ─────────────────────────────────────────
  // Getters (never return undefined)
  // ─────────────────────────────────────────

  /**
   * Get current provider name
   */
  getProvider(): string {
    return this.currentModel.provider;
  }

  /**
   * Get current model entry
   */
  getModel(): ModelEntry {
    return this.currentModel;
  }

  /**
   * Get current provider config
   */
  getProviderConfig(): ProviderConfig {
    return this.currentProviderConfig;
  }

  // ─────────────────────────────────────────
  // Finders (return optional - NO throws!)
  // ─────────────────────────────────────────

  /**
   * Find provider config by name
   */
  findProvider(name: string): ProviderConfig | undefined {
    return this.findProviderConfig(name);
  }

  /**
   * Find provider config by name (internal)
   */
  private findProviderConfig(name: string): ProviderConfig | undefined {
    return this.config.getProvider(name);
  }

  /**
   * Find model by "provider/model" string
   */
  findModel(index: `${string}/${string}`): ModelEntry | undefined {
    return this.config.findModel(index);
  }

  // ─────────────────────────────────────────
  // Setters (accept ModelEntry - already validated!)
  // ─────────────────────────────────────────

  /**
   * Set current model by ModelEntry
   * No validation needed - user got this from the manager!
   */
  setModel(model: ModelEntry): void {
    this.currentModel = model;
    this.currentProviderConfig = this.findProviderConfig(model.provider)!;
    this.emit("modelChanged", model);
  }

  /**
   * Set model by "provider/model" string index
   */
  setModelByIndex(index: string): void {
    const model = this.findModel(index as `${string}/${string}`);
    if (!model) {
      throw new Error(`Model "${index}" not found`);
    }
    this.setModel(model);
  }

  /**
   * Get all models as flat array
   */
  listModels(): ModelEntry[] {
    return this.config.getAllModelsFlat();
  }

  // ─────────────────────────────────────────
  // Listers (never throw)
  // ─────────────────────────────────────────

  /**
   * List all available providers (that have models)
   */
  listProviders(): Array<{ name: string } & ProviderConfig> {
    return this.config.getProviders();
  }

  /**
   * List all models grouped by provider
   */
  listAllModels(): Record<string, ModelEntry[]> {
    return this.config.toJSON().models;
  }

  // ─────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────

  /**
   * Events:
   * - modelChanged: (model: ModelEntry) => void
   */
}
