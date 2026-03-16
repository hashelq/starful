import type { LLMProvider } from "./rest-client.js";
import type { ProviderConfig } from "../../config.js";

// Re-export for convenience
export { OpenAIClient } from "./openai-client.js";
export { AnthropicClient } from "./anthropic-client.js";
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

// Import providers for registration
import { OpenAIClient } from "./openai-client.js";
import { AnthropicClient } from "./anthropic-client.js";

// Register built-in providers
registerProvider("openai", OpenAIClient);
registerProvider("ollama", OpenAIClient); // Ollama uses the same client
registerProvider("anthropic", AnthropicClient);

/**
 * Extended provider config with base support
 */
export interface ExtendedProviderConfig {
  /** Provider type identifier */
  type: string;
  /** Base provider to extend from (e.g., "openai", "ollama", "anthropic") */
  base?: string;
  /** Host address */
  host?: string;
  /** Port number */
  port?: number;
  /** Full base URL (takes precedence over host:port) */
  baseUrl?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request timeout */
  timeout?: number;
  /** Endpoint type: "ollama" or "openai" */
  endpointType?: "ollama" | "openai";
}

/**
 * Create an LLM provider instance based on config
 * Auto-discovers providers from registry
 */
export function createLLMProvider(providerConfig: ProviderConfig, _model: string): LLMProvider {
  const type = providerConfig.base;
  
  console.log(`[createLLMProvider] type: ${type}`);
  console.log(`[createLLMProvider] config:`, providerConfig);
  
  // Look up provider in registry
  const ProviderClass = providerRegistry.get(type);
  
  console.log(`[createLLMProvider] ProviderClass found:`, !!ProviderClass);
  
  if (ProviderClass) {
    // Create instance with config
    const instance = new ProviderClass(providerConfig as ExtendedProviderConfig);
    console.log(`[createLLMProvider] Created provider instance:`, instance.constructor.name);
    return instance;
  }
  
  // If not found, check if it has a "base" property to extend another provider
  if ("base" in providerConfig) {
    const extendedConfig = providerConfig as ExtendedProviderConfig;
    const baseType = extendedConfig.base;
    
    if (baseType) {
      const BaseProviderClass = providerRegistry.get(baseType);
      if (BaseProviderClass) {
        // Create instance - the base provider should handle custom config
        return new BaseProviderClass(providerConfig as ExtendedProviderConfig);
      }
    }
  }
  
  // Default fallback to OpenAIClient
  console.warn(`Provider "${type}" not found, falling back to openai`);
  return new OpenAIClient({
    host: "localhost",
    port: 11434,
    timeout: 120000,
    endpointType: "ollama",
  });
}
