/**
 * OpenAIClient - OpenAI-compatible API client extending RestLLMClient.
 * Supports both native Ollama (/api/chat) and OpenAI-compatible (/v1/chat/completions) endpoints.
 */

import { RestLLMClient, type ChatResponse, type CompletionResponse, type ListModelsResponse } from "./rest-client.js";
import type {
  APIConfig,
  ChatMessage,
  ModelTool,
} from "../types/api-types.js";

/**
 * OpenAI-compatible client options
 */
export interface OpenAIConfig extends APIConfig {
  /** Endpoint type: "ollama" for native /api/chat, "openai" for /v1/chat/completions */
  endpointType?: "ollama" | "openai";
}

/**
 * OpenAIClient - extends RestLLMClient with OpenAI-compatible endpoints
 */
export class OpenAIClient extends RestLLMClient {
  private config: Required<OpenAIConfig>;

  constructor(config?: OpenAIConfig) {
    // Use baseUrl if provided, otherwise construct from host:port
    const baseUrl = config?.baseUrl ?? `http://${config?.host ?? "localhost"}:${config?.port ?? 11434}`;
    
    super(baseUrl, {
      timeout: config?.timeout ?? 60000,
      headers: config?.headers ?? {},
    });

    this.config = {
      host: config?.host ?? "localhost",
      port: config?.port ?? 11434,
      timeout: config?.timeout ?? 60000,
      basepath: config?.basepath ?? "",
      token: config?.token ?? null,
      baseUrl: config?.baseUrl ?? "",
      headers: config?.headers ?? {},
      endpointType: config?.endpointType ?? (config?.baseUrl ? "openai" : "ollama"),
    };

    if (config?.baseUrl && config?.headers && Object.keys(config.headers).length > 0) {
      console.log(`[OpenAIClient] Using custom headers:`, config.headers);
    }
  }

  /**
   * Build URL with basepath
   */
  private buildApiUrl(endpoint: string): string {
    return `${this.baseUrl}${this.config.basepath}${endpoint}`;
  }

  /**
   * Check if using OpenAI-compatible endpoint vs native Ollama
   */
  private get isOpenAICompatible(): boolean {
    // Use explicit endpointType if set, otherwise detect from baseUrl
    if (this.config.endpointType) {
      return this.config.endpointType === "openai";
    }
    // If baseUrl was explicitly provided, use OpenAI-compatible
    return !!this.config.baseUrl;
  }

  /**
   * Chat completion using appropriate endpoint:
   * - /api/chat for native Ollama (endpointType: "ollama")
   * - /v1/chat/completions for OpenAI-compatible (endpointType: "openai")
   */
  override async chat(
    model: string,
    messages?: ChatMessage[],
    tools?: ModelTool[],
    signal?: AbortSignal,
  ): Promise<AsyncIterable<ChatResponse>> {
    console.log(`[OpenAIClient] chat() - model: ${model}, isOpenAICompatible: ${this.isOpenAICompatible}`);
    console.log(`[OpenAIClient] baseUrl: ${this.baseUrl}`);
    console.log(`[OpenAIClient] endpointType: ${this.config.endpointType}`);
    
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    if (tools && Array.isArray(tools)) {
      body.tools = tools;
    }

    // Use OpenAI-compatible endpoint if baseUrl was provided
    const endpoint = this.isOpenAICompatible 
      ? "/v1/chat/completions" 
      : "/api/chat";

    console.log(`[OpenAIClient] Using endpoint: ${endpoint}`);

    return this.postStream<ChatResponse>(endpoint, body, signal);
  }

  /**
   * Text completion using /api/generate (Ollama native)
   */
  async complete(
    prompt: string,
    signal?: AbortSignal,
  ): Promise<AsyncIterable<CompletionResponse>> {
    const body = {
      model: "llama2", // Default model, should be configurable
      prompt,
      stream: true,
    };

    return this.postStream<CompletionResponse>("/api/generate", body, signal);
  }

  /**
   * List all locally available models.
   */
  async listModels(): Promise<ListModelsResponse> {
    const url = this.buildApiUrl("/api/tags");
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = await response.json() as { models: Array<{ name: string; size?: number; modified_at?: string }> };
    return { 
      models: data.models.map(m => ({
        name: m.name,
        size: m.size,
        modified_at: m.modified_at,
      })) 
    };
  }
}
