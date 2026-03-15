
import type {
  APIConfig,
  ChatMessage,
  ChatResponse,
  CreateModelParameters,
  EmbeddingsResponse,
  GenerateImageParameters,
  GenerateImageResponse,
  LocalModelInfo,
  ModelTool,
  ShowModelInfo,
} from "./api-types";

/**
 * Main OllamaClient class implementing the official Ollama API.
 */
export abstract class OllamaClient {
  constructor(_config?: APIConfig) {}

  /**
   * Generate a chat response with conversation history.
   * Uses POST /api/chat endpoint.
   */
  public abstract chat(
    model: string,
    messages?: ChatMessage[],
    tools?: ModelTool[],
    options?: Record<string, unknown>,
  ): Promise<AsyncIterable<ChatResponse>>;

  /**
   * List all locally available models.
   * Uses GET /api/tags endpoint.
   */
  public abstract listModels(): Promise<LocalModelInfo[]>;

  /**
   * Get information about a specific model.
   * Uses GET /api/show endpoint.
   */
  public abstract showModel(model: string): Promise<ShowModelInfo>;

  /**
   * Pull a model from Ollama's library.
   * Uses POST /api/pull endpoint.
   */
  public abstract pullModel(
    model: string,
    options?: { insecure?: boolean },
  ): Promise<void>;

  /**
   * Push a model to an Ollama library/repository.
   * Uses POST /api/push endpoint.
   */
  public abstract pushModel(
    model: string,
    options?: { insecure?: boolean },
  ): Promise<void>;

  /**
   * Copy a model.
   * Uses POST /api/copy endpoint.
   */
  public abstract copyModel(
    source: string,
    destination: string,
  ): Promise<{ status: string }>;

  /**
   * Delete a model.
   * Uses DELETE /api/delete endpoint.
   */
  public abstract deleteModel(model: string): Promise<{ status: string }>;

  /**
   * Create a new model from base or GGUF file.
   * Uses POST /api/create endpoint.
   */
  public abstract createModel(
    parameters: CreateModelParameters & { stream?: boolean },
  ): Promise<void>;

  /**
   * Get information about running models.
   * Uses GET /api/ps endpoint.
   */
  public abstract getRunningModels(): LocalModelInfo[];

  /**
   * Generate embeddings for a given prompt.
   * Uses POST /api/embed endpoint.
   */
  public abstract generateEmbeddings(
    model: string,
    prompt: string,
  ): Promise<EmbeddingsResponse>;

  /**
   * Generate images using image generation models (experimental).
   */
  public abstract generateImage(
    model: string,
    params: Omit<GenerateImageParameters, "model">,
  ): Promise<GenerateImageResponse>;
}
