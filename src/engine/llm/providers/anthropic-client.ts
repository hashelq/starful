/**
 * AnthropicClient - Anthropic-compatible API client extending RestLLMClient.
 * Uses /v1/messages endpoint (Anthropic format).
 */

import { RestLLMClient, type ChatResponse, type ListModelsResponse } from "./rest-client.js";
import type { APIConfig, ChatMessage, ModelTool } from "../types/api-types.js";

/**
 * Anthropic-specific config
 */
export interface AnthropicConfig extends APIConfig {
  /** Max tokens to generate */
  maxTokens?: number;
}

/**
 * Anthropic message response
 */
export interface AnthropicMessageResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: "text";
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * AnthropicStreaming event
 */
export interface AnthropicStreamEvent {
  type: "message_start" | "content_block_start" | "content_block_delta" | "content_block_stop" | "message_delta" | "message_stop";
  message?: AnthropicMessageResponse;
  index?: number;
  content_block?: {
    type: string;
    text?: string;
  };
  usage?: {
    output_tokens: number;
  };
  delta?: {
    text: string;
  };
}

/**
 * AnthropicClient - extends RestLLMClient with Anthropic-compatible /v1/messages endpoint
 */
export class AnthropicClient extends RestLLMClient {
  private config: Required<AnthropicConfig>;

  constructor(config?: AnthropicConfig) {
    // Use baseUrl if provided, otherwise construct from host:port
    const baseUrl = config?.baseUrl ?? `https://api.anthropic.com`;
    
    super(baseUrl, {
      timeout: config?.timeout ?? 60000,
      headers: config?.headers,
    });

    this.config = {
      host: config?.host ?? "api.anthropic.com",
      port: config?.port ?? 443,
      timeout: config?.timeout ?? 60000,
      basepath: config?.basepath ?? "",
      token: config?.token ?? null,
      baseUrl: config?.baseUrl ?? "",
      headers: config?.headers ?? {},
      maxTokens: config?.maxTokens ?? 4096,
    };

    if (config?.baseUrl && config?.headers && Object.keys(config.headers).length > 0) {
      console.log(`[AnthropicClient] Using custom headers:`, config.headers);
    }
  }

  /**
   * Build URL with basepath
   */
  private buildApiUrl(endpoint: string): string {
    return `${this.baseUrl}${this.config.basepath}${endpoint}`;
  }

  /**
   * Convert ChatMessage to Anthropic format
   */
  private toAnthropicMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    return messages.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));
  }

  /**
   * Chat completion using Anthropic /v1/messages endpoint
   */
  override async chat(
    model: string,
    messages?: ChatMessage[],
    _tools?: ModelTool[],
    signal?: AbortSignal,
  ): Promise<AsyncIterable<ChatResponse>> {
    console.log(`[AnthropicClient] chat() - model: ${model}`);
    console.log(`[AnthropicClient] baseUrl: ${this.baseUrl}`);
    
    // Anthropic requires specific headers - temporarily override
    const originalHeaders = { ...this.headers };
    this.headers = {
      ...this.headers,
      "anthropic-version": "2023-06-01",
      "x-api-key": this.config.token ?? "",
    };

    const body: Record<string, unknown> = {
      model,
      messages: this.toAnthropicMessages(messages ?? []),
      max_tokens: this.config.maxTokens,
      stream: true,
    };

    const endpoint = "/v1/messages";
    console.log(`[AnthropicClient] Using endpoint: ${endpoint}`);

    try {
      return await this.postStream<ChatResponse>(endpoint, body, signal);
    } finally {
      // Restore original headers
      this.headers = originalHeaders;
    }
  }

  /**
   * List models - Anthropic doesn't have a standard list endpoint
   * Returns empty list (models are predetermined by API key)
   */
  async listModels(): Promise<ListModelsResponse> {
    return { models: [] };
  }

  /**
   * Complete is not supported in Anthropic format
   */
  async complete(
    _prompt: string,
    _signal?: AbortSignal,
  ): Promise<AsyncIterable<any>> {
    throw new Error("Anthropic API does not support /generate endpoint. Use chat() instead.");
  }
}
