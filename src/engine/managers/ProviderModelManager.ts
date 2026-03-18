import { EventEmitter } from "../EventEmitter.js";
import {
  loadConfig,
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
  private currentModel: ModelEntry;
  private currentProviderConfig: ProviderConfig;

  constructor() {
    super();
    
    // Load initial model with validation
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
    const config = loadConfig();
    const defaultModel = config.getDefaultModel();
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
    const config = loadConfig();
    return config.getProvider(name);
  }

  /**
   * Find model by "provider/model" string
   */
  findModel(index: string): ModelEntry | undefined {
    const config = loadConfig();
    return config.findModel(index);
  }

  /**
   * Find model by provider and name
   */
  findModelByProviderAndName(provider: string, name: string): ModelEntry | undefined {
    const config = loadConfig();
    return config.findModelByProviderAndName(provider, name);
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
   * Set model by provider and name strings (convenience wrapper)
   */
  setModelFull(provider: string, model: string): void {
    const modelEntry = this.findModelByProviderAndName(provider, model);
    if (!modelEntry) {
      const available = this.listModelsForProvider(provider).map(m => m.name);
      throw new Error(
        `Model "${model}" not found for provider "${provider}". ` +
        `Available: ${available.join(", ")}`
      );
    }
    this.setModel(modelEntry);
  }

  /**
   * Set model by "provider/model" string
   */
  setModelByIndex(index: string): void {
    const modelEntry = this.findModel(index);
    if (!modelEntry) {
      const available = this.listAllModelsFlat();
      throw new Error(
        `Model "${index}" not found. Available: ${available.join(", ")}`
      );
    }
    this.setModel(modelEntry);
  }

  // ─────────────────────────────────────────
  // Listers (never throw)
  // ─────────────────────────────────────────

  /**
   * List all available providers (that have models)
   */
  listProviders(): string[] {
    const config = loadConfig();
    const providers = config.getProviders();
    return providers.map(p => p.name).filter(name => {
      const models = config.getModels(name);
      return models.length > 0;
    });
  }

  /**
   * List models for current provider
   */
  listModels(): ModelEntry[] {
    return this.listModelsForProvider(this.getProvider());
  }

  /**
   * List models for a specific provider
   */
  listModelsForProvider(provider: string): ModelEntry[] {
    const config = loadConfig();
    return config.getModels(provider);
  }

  /**
   * List all models grouped by provider
   */
  listAllModels(): Record<string, ModelEntry[]> {
    const config = loadConfig();
    return config.toJSON().models;
  }

  /**
   * List all models as flat array
   */
  private listAllModelsFlat(): string[] {
    const config = loadConfig();
    const allModels = config.getAllModelsFlat();
    return allModels.map(m => `${m.provider}/${m.name}`);
  }

  // ─────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────

  /**
   * Events:
   * - modelChanged: (model: ModelEntry) => void
   */
}
