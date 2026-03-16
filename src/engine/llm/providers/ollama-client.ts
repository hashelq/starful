/**
 * OllamaClient - Implementation of Ollama API client extending RestLLMClient.
 * Supports all Ollama-specific endpoints and parameters.
 */

import { RestLLMClient, type ChatResponse, type CompletionResponse, type ListModelsResponse } from "./rest-client.js";
import type {
  APIConfig,
  ShowModelInfo,
  PsResponse,
  EmbeddingsResponse,
  GenerateImageParameters,
  GenerateImageResponse,
  ChatMessage,
  ModelTool,
  CreateModelParameters,
  LocalModelInfo,
} from "../types/api-types.js";

/**
 * Ollama-specific options that get wrapped in "options" object
 */
export interface OllamaOptions {
  num_gpu?: number;
  num_thread?: number;
  num_ctx?: number;
  num_keep?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  repeat_penalty?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  tfs_z?: number;
  typical_p?: number;
  stop?: string | string[];
  seed?: number;
}

/**
 * Full chat options extending base with Ollama-specific options
 */
export interface OllamaChatOptions {
  model: string;
  messages: ChatMessage[];
  tools?: ModelTool[];
  stream?: boolean;
  signal?: AbortSignal;
  // Ollama-specific options (will be wrapped in "options" object)
  options?: OllamaOptions;
  format?: "json" | undefined;
  template?: string;
  context?: number[];
  raw?: boolean;
}

/**
 * Completion options for /api/generate
 */
export interface OllamaCompletionOptions {
  model: string;
  prompt: string;
  stream?: boolean;
  signal?: AbortSignal;
  options?: OllamaOptions;
  format?: "json" | undefined;
  template?: string;
  context?: number[];
  raw?: boolean;
  keep_alive?: number | string;
}

/**
 * Custom error class for Ollama API errors.
 */
export class OllamaError extends Error {
  override name = "OllamaError";

  constructor(
    message: string,
    public status?: number,
    public response?: string,
  ) {
    super(message);
  }
}

/**
 * OllamaClient - extends RestLLMClient with Ollama-specific endpoints
 */
export class OllamaClient extends RestLLMClient {
  /** Unique provider identifier */
  override name: string = "ollama";

  private config: Required<APIConfig>;

  constructor(config?: APIConfig) {
    const host = config?.host ?? "localhost";
    const port = config?.port ?? 11434;
    const baseUrl = `http://${host}:${port}`;
    
    super(baseUrl, {
      timeout: config?.timeout ?? 60000,
    });

    this.config = {
      host,
      port,
      timeout: config?.timeout ?? 60000,
      basepath: config?.basepath ?? "",
      token: config?.token ?? null,
    };
  }

  /**
   * Build URL with basepath
   */
  private buildOllamaUrl(endpoint: string): string {
    return `${this.baseUrl}${this.config.basepath}${endpoint}`;
  }

  /**
   * Chat completion using /api/chat endpoint
   * Wraps Ollama-specific options in "options" object
   */
  async chat(
    model: string,
    messages?: ChatMessage[],
    tools?: ModelTool[],
    signal?: AbortSignal,
  ): Promise<AsyncIterable<ChatResponse>> {
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    if (tools && Array.isArray(tools)) {
      body.tools = tools;
    }

    return this.postStream<ChatResponse>("/api/chat", body, signal);
  }

  /**
   * Chat with full Ollama options support
   */
  async chatWithOptions(
    opts: OllamaChatOptions,
  ): Promise<AsyncIterable<ChatResponse>> {
    const body: Record<string, unknown> = {
      model: opts.model,
      messages: opts.messages,
      stream: opts.stream ?? true,
    };

    if (opts.tools && Array.isArray(opts.tools)) {
      body.tools = opts.tools;
    }

    // Wrap Ollama-specific options in "options" object
    if (opts.options) {
      body.options = { ...opts.options };
    }

    if (opts.format) body.format = opts.format;
    if (opts.template) body.template = opts.template;
    if (opts.context) body.context = opts.context;
    if (opts.raw !== undefined) body.raw = opts.raw;

    return this.postStream<ChatResponse>("/api/chat", body, opts.signal);
  }

  /**
   * Text completion using /api/generate endpoint
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
   * Completion with full Ollama options
   */
  async completeWithOptions(
    opts: OllamaCompletionOptions,
  ): Promise<AsyncIterable<CompletionResponse>> {
    const body: Record<string, unknown> = {
      model: opts.model,
      prompt: opts.prompt,
      stream: opts.stream ?? true,
    };

    // Wrap Ollama-specific options in "options" object
    if (opts.options) {
      body.options = { ...opts.options };
    }

    if (opts.format) body.format = opts.format;
    if (opts.template) body.template = opts.template;
    if (opts.context) body.context = opts.context;
    if (opts.raw !== undefined) body.raw = opts.raw;
    if (opts.keep_alive !== undefined) body.keep_alive = opts.keep_alive;

    return this.postStream<CompletionResponse>("/api/generate", body, opts.signal);
  }

  /**
   * List all locally available models.
   * Uses GET /api/tags endpoint.
   */
  async listModels(): Promise<ListModelsResponse> {
    const url = this.buildOllamaUrl("/api/tags");
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new OllamaError(`Failed to list models: ${response.status}`, response.status);
    }

    const data = await response.json() as { models: LocalModelInfo[] };
    return { models: data.models };
  }

  /**
   * Get information about a specific model.
   * Uses GET /api/show endpoint.
   */
  async showModel(model: string): Promise<ShowModelInfo> {
    const result = await this.post<ShowModelInfo>("/api/show", { name: model });
    return result;
  }

  /**
   * Pull a model from Ollama's library.
   * Uses POST /api/pull endpoint.
   */
  async pullModel(model: string, options?: { insecure?: boolean }) {
    const body = { name: model, ...options };
    return this.post("/api/pull", body);
  }

  /**
   * Push a model to an Ollama library/repository.
   * Uses POST /api/push endpoint.
   */
  async pushModel(model: string, options?: { insecure?: boolean }) {
    const body = { name: model, ...options };
    return this.post("/api/push", body);
  }

  /**
   * Copy a model.
   * Uses POST /api/copy endpoint.
   */
  async copyModel(
    source: string,
    destination: string,
  ): Promise<{ status: string }> {
    const result = await this.post<{ status: string }>("/api/copy", { source, destination });
    return result;
  }

  /**
   * Delete a model.
   * Uses DELETE /api/delete endpoint.
   */
  async deleteModel(model: string): Promise<{ status: string }> {
    const result = await this.post<{ status: string }>("/api/delete", { name: model });
    return result;
  }

  /**
   * Create a new model from base or GGUF file.
   * Uses POST /api/create endpoint.
   */
  async createModel(
    parameters: CreateModelParameters & { stream?: boolean },
    streamParam = false,
  ): Promise<void | AsyncIterable<void>> {
    return this.post("/api/create", parameters as unknown as Record<string, unknown>, streamParam ? undefined : undefined);
  }

  /**
   * Get information about running models.
   * Uses GET /api/ps endpoint.
   */
  async getRunningModels(): Promise<PsResponse> {
    const url = this.buildOllamaUrl("/api/ps");
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) {
      throw new OllamaError(`Failed to get running models`, res.status);
    }
    return (await res.json()) as PsResponse;
  }

  /**
   * Generate embeddings for a given prompt.
   * Uses POST /api/embed endpoint.
   */
  async generateEmbeddings(
    model: string,
    prompt: string,
  ): Promise<EmbeddingsResponse> {
    const result = await this.post("/api/embed", { model, prompt });
    return result as EmbeddingsResponse;
  }

  /**
   * Generate images using image generation models (experimental).
   */
  async generateImage(
    model: string,
    params: Omit<GenerateImageParameters, "model">,
  ): Promise<GenerateImageResponse> {
    const body = { ...params, model };
    const result = await this.post("/api/images", body);
    return result as GenerateImageResponse;
  }
}
