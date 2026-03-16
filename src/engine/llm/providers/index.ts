import { OllamaClient } from "./ollama-client.js";
import type { ChatResponse, ListModelsResponse } from "./rest-client.js";
import type { OllamaProviderConfig, ProviderConfig } from "../../config.js";

// Re-export for convenience
export { OllamaClient } from "./ollama-client.js";
export type { 
  ChatOptions, 
  ChatResponse, 
  CompletionOptions, 
  CompletionResponse,
  ListModelsResponse,
  ModelInfo,
} from "./rest-client.js";
export type { OllamaOptions, OllamaChatOptions, OllamaCompletionOptions } from "./ollama-client.js";

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
  ): Promise<AsyncIterable<ChatResponse>>;
   
  listModels(): Promise<ListModelsResponse>;
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
    });
  }
   
  // Default to Ollama
  return new OllamaClient({
    host: "localhost",
    port: 11434,
    timeout: 120000,
  });
}
