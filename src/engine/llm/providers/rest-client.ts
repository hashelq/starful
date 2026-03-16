/**
 * RestLLMClient - Generic REST API client for LLM providers.
 * Base class that handles HTTP/fetch logic for OpenAI-compatible APIs.
 */

import type {
  ChatMessage,
  ModelTool,
} from "../types/api-types.js";

/**
 * LLM Provider interface
 * All providers must implement this interface
 */
export interface LLMProvider {
  /** Unique provider identifier */
  name: string;
  chat(
    model: string,
    messages?: ChatMessage[],
    modelTools?: ModelTool[],
    signal?: AbortSignal,
  ): Promise<AsyncIterable<ChatResponse>>;
   
  listModels(): Promise<ListModelsResponse>;
}

/**
 * Common options for chat completion
 */
export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  modelTool?: ModelTool[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  seed?: number;
  stop?: string | string[];
  stream?: boolean;
  signal?: AbortSignal;
  // Provider-specific options will be passed through
  [key: string]: unknown;
}

/**
 * Chat response from provider
 */
export interface ChatResponse {
  message: {
    content: string;
    role: string;
    thinking?: string;  // For thinking models (e.g., DeepSeek)
    tool_calls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Completion options
 */
export interface CompletionOptions {
  model: string;
  prompt: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  seed?: number;
  stop?: string | string[];
  stream?: boolean;
  signal?: AbortSignal;
  [key: string]: unknown;
}

/**
 * Completion response
 */
export interface CompletionResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Model info from listModels
 */
export interface ModelInfo {
  name: string;
  size?: number;
  modified_at?: string;
  digest?: string;
}

/**
 * List models response
 */
export interface ListModelsResponse {
  models: ModelInfo[];
}

/**
 * Base REST client for LLM providers
 */
export abstract class RestLLMClient implements LLMProvider {
  /** Unique identifier for this provider implementation */
  name: string = "generic";

  protected baseUrl: string;
  protected headers: Record<string, string>;
  protected timeout: number;

  constructor(
    baseUrl: string,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
    }
  ) {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
      ...options?.headers,
    };
    this.timeout = options?.timeout ?? 60000;
  }

  /**
   * Build the full URL for an endpoint
   */
  protected buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * Combine timeout signal with custom signal
   */
  protected combineSignal(signal?: AbortSignal): AbortSignal {
    const timeoutSignal = AbortSignal.timeout(this.timeout);
    return signal
      ? AbortSignal.any([timeoutSignal, signal])
      : timeoutSignal;
  }

  /**
   * Make a POST request
   */
  protected async post<T>(
    endpoint: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const combinedSignal = this.combineSignal(signal);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
        signal: combinedSignal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw err;
    }
  }

  /**
   * Make a streaming POST request
   */
  protected async *postStream<T>(
    endpoint: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): AsyncIterable<T> {
    const url = this.buildUrl(endpoint);
    const combinedSignal = this.combineSignal(signal);

    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
      signal: combinedSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        for (const line of chunk.trim().split("\n")) {
          if (!line.trim()) continue;
          try {
            yield JSON.parse(line) as T;
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * GET request (e.g., for listing models)
   */
  protected async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    const url = this.buildUrl(endpoint);
    const combinedSignal = this.combineSignal(signal);

    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
      signal: combinedSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return (await response.json()) as T;
  }

  // Abstract methods - must be implemented by subclasses
  
  /**
   * Chat completion (with message history)
   * Default implementation for OpenAI-compatible APIs using /v1/chat/completions
   */
  async chat(
    model: string,
    messages?: ChatMessage[],
    modelTools?: ModelTool[],
    signal?: AbortSignal,
  ): Promise<AsyncIterable<ChatResponse>> {
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    if (modelTools && modelTools.length > 0) {
      body.tools = modelTools;
    }

    return this.postStream<ChatResponse>("/v1/chat/completions", body, signal);
  }

  /**
   * List available models
   */
  abstract listModels(): Promise<ListModelsResponse>;

  /**
   * Text completion (single prompt)
   */
  abstract complete(
    prompt: string,
    signal?: AbortSignal,
  ): Promise<AsyncIterable<CompletionResponse>>;
}
