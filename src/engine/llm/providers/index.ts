import { OllamaClient } from "./ollama-client.js";
import type { LLMProvider } from "./rest-client.js";
import type { ProviderConfig } from "../../config.js";

// Re-export for convenience
export { OllamaClient } from "./ollama-client.js";
export { RestLLMClient } from "./rest-client.js";
export type { 
  ChatOptions, 
  ChatResponse, 
  CompletionOptions, 
  CompletionResponse,
  ListModelsResponse,
  ModelInfo,
  LLMProvider,
} from "./rest-client.js";
export type { OllamaOptions, OllamaChatOptions, OllamaCompletionOptions } from "./ollama-client.js";

/**
 * Provider constructor type
 */
type ProviderConstructor = new (...args: any[]) => LLMProvider;

/**
 * Provider registry - maps type string to provider class
 */
const providerRegistry = new Map<string, ProviderConstructor>();

/**
 * Register a provider implementation
 */
export function registerProvider(type: string, constructor: ProviderConstructor): void {
  providerRegistry.set(type, constructor);
}

/**
 * Get all registered provider types
 */
export function getRegisteredProviders(): string[] {
  return Array.from(providerRegistry.keys());
}

// Register built-in providers
registerProvider("ollama", OllamaClient);

/**
 * Extended provider config with base support
 */
export interface ExtendedProviderConfig {
  /** Provider type identifier */
  type: string;
  /** Base provider to extend from (e.g., "ollama") */
  base?: string;
  /** Host address */
  host?: string;
  /** Port number */
  port?: number;
  /** Request timeout */
  timeout?: number;
}

/**
 * Create an LLM provider instance based on config
 * Auto-discovers providers from registry
 */
export function createLLMProvider(providerConfig: ProviderConfig, _model: string): LLMProvider {
  const type = providerConfig.type;
  
  // Look up provider in registry
  const ProviderClass = providerRegistry.get(type);
  
  if (ProviderClass) {
    // Create instance with config
    return new ProviderClass(providerConfig);
  }
  
  // If not found, check if it has a "base" property to extend another provider
  if ("base" in providerConfig) {
    const extendedConfig = providerConfig as ExtendedProviderConfig;
    const baseType = extendedConfig.base;
    
    if (baseType) {
      const BaseProviderClass = providerRegistry.get(baseType);
      if (BaseProviderClass) {
        // Create instance - the base provider should handle custom config
        return new BaseProviderClass(providerConfig);
      }
    }
  }
  
  // Default fallback to Ollama
  console.warn(`Provider "${type}" not found, falling back to ollama`);
  return new OllamaClient({
    host: "localhost",
    port: 11434,
    timeout: 120000,
  });
}
