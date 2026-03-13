/**
 * OllamaClient - Implementation of Ollama API client with all official endpoints.
 */

import type {
  APIConfig,
  ShowModelInfo,
  PsResponse,
  EmbeddingsResponse,
  GenerateImageParameters,
  GenerateImageResponse,
  ChatMessage,
  ModelTool,
  ChatResponse,
  CreateModelParameters,
  LocalModelInfo,
} from "../types/api-types.js";

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
 * Main OllamaClient class implementing the official Ollama API.
 */
export class OllamaClient {
  private config: Required<APIConfig>;

  constructor(config?: APIConfig) {
    this.config = {
      host: config?.host ?? "localhost",
      port: config?.port ?? 11434,
      timeout: config?.timeout ?? 60000,
      basepath: config?.basepath ?? "",
      token: config?.token ?? null,
    };
  }

  private async getResponse<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    streaming = false,
  ): Promise<AsyncIterable<T> | T> {
    const url = `http://${this.config.host}:${this.config.port}${this.config.basepath}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new OllamaError(
        `Ollama error ${response.status}: ${text}`,
        response.status,
        text,
      );
    }

    if (streaming || body?.stream) {
      return this._streamResponse<T>(response.body!);
    }

    return (await response.json()) as T;
  }

  private async *_streamResponse<T>(
    stream: ReadableStream<Uint8Array>,
  ): AsyncIterable<T> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        for (const line of chunk.trim().split("\n")) {
          try {
            yield JSON.parse(line);
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate a chat response with conversation history.
   * Uses POST /api/chat endpoint.
   */
  async chat(
    model: string,
    messages?: ChatMessage[],
    tools?: ModelTool[],
  ): Promise<AsyncIterable<ChatResponse>> {
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    if (tools && Array.isArray(tools)) {
      body.tools = tools;
    }

    return (await this.getResponse(
      "/api/chat",
      body,
    )) as AsyncIterable<ChatResponse>;
  }

  /**
   * List all locally available models.
   * Uses GET /api/tags endpoint.
   */
  async listModels(): Promise<LocalModelInfo> {
    const url = `http://${this.config.host}:${this.config.port}${this.config.basepath}/api/tags`;
    const res = await fetch(url, { headers: this._headers() });

    if (!res.ok) throw new OllamaError(`Failed to list models`, res.status);
    return ((await res.json()) as { models: LocalModelInfo }).models;
  }

  /**
   * Get information about a specific model.
   * Uses GET /api/show endpoint.
   */
  async showModel(model: string): Promise<ShowModelInfo> {
    const result = (await this.getResponse<any>("/api/show", { name: model })) as unknown as ShowModelInfo;
    return result;
  }

  /**
   * Pull a model from Ollama's library.
   * Uses POST /api/pull endpoint.
   */
  async pullModel(model: string, options?: { insecure?: boolean }) {
    const body = { name: model, ...options };
    return this.getResponse("/api/pull", body);
  }

  /**
   * Push a model to an Ollama library/repository.
   * Uses POST /api/push endpoint.
   */
  async pushModel(model: string, options?: { insecure?: boolean }) {
    const body = { name: model, ...options };
    return this.getResponse("/api/push", body);
  }

  /**
   * Copy a model.
   * Uses POST /api/copy endpoint.
   */
  async copyModel(
    source: string,
    destination: string,
  ): Promise<{ status: string }> {
    const result = await this.getResponse<{ status: string }>("/api/copy", { source, destination });
    return (Array.isArray(result) ? result[0] : result) as { status: string };
  }

  /**
   * Delete a model.
   * Uses DELETE /api/delete endpoint.
   */
  async deleteModel(model: string): Promise<{ status: string }> {
    const result = await this.getResponse<{ status: string }>("/api/delete", { name: model });
    return (Array.isArray(result) ? result[0] : result) as { status: string };
  }

  /**
   * Create a new model from base or GGUF file.
   * Uses POST /api/create endpoint.
   */
  async createModel(
    parameters: CreateModelParameters & { stream?: boolean },
    streamParam = false,
  ): Promise<void | AsyncIterable<void>> {
    return this.getResponse("/api/create", parameters as unknown as Record<string, unknown>, streamParam);
  }

  /**
   * Get information about running models.
   * Uses GET /api/ps endpoint.
   */
  async getRunningModels() {
    const url = `http://${this.config.host}:${this.config.port}${this.config.basepath}/api/ps`;
    const res = await fetch(url, { headers: this._headers() });

    if (!res.ok)
      throw new OllamaError(`Failed to get running models`, res.status);
    return (await res.json()) as unknown as PsResponse;
  }

  /**
   * Generate embeddings for a given prompt.
   * Uses POST /api/embed endpoint.
   */
  async generateEmbeddings(
    model: string,
    prompt: string,
  ): Promise<EmbeddingsResponse> {
    const result = await this.getResponse("/api/embed", { model, prompt });
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
    const result = await this.getResponse("/api/images", body);
    return result as unknown as GenerateImageResponse;
  }

  private _headers() {
    const headers: Record<string, string> = {};
    if (this.config.token) {
      headers["Authorization"] = `Bearer ${this.config.token}`;
    }
    return headers;
  }
}
