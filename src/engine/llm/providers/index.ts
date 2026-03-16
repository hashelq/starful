import { OllamaClient } from "./ollama-client.js";
import type { OllamaProviderConfig, ProviderConfig } from "../../config.js";

/**
 * LLM Provider interface
 * All providers must implement this interface
 */
export interface LLMProvider {
  chat(
    model: string,
    messages?: any[],
    tools?: any[],
    signal?: AbortSignal,
  ): Promise<AsyncIterable<any>>;
  
  listModels(): Promise<any>;
}

/**
 * Create an LLM provider instance based on config
 */
export function createLLMProvider(providerConfig: ProviderConfig, _model: string): LLMProvider {
  if (providerConfig.type === "ollama") {
    const ollamaConfig = providerConfig as OllamaProviderConfig;
    return new OllamaClient({
      host: ollamaConfig.host,
      port: ollamaConfig.port,
      timeout: ollamaConfig.timeout,
    }) as unknown as LLMProvider;
  }
  
  // Default to Ollama
  return new OllamaClient({
    host: "localhost",
    port: 11434,
    timeout: 120000,
  }) as unknown as LLMProvider;
}
