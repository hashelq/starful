import { EventEmitter } from "../EventEmitter.js";
import type { LLMProvider } from "../llm/providers/index.js";
import type { ModelEntry, ProviderConfig } from "../config.js";
import { createLLMProvider } from "../llm/providers/index.js";

/**
 * Generation callbacks
 */
export interface GenerationCallbacks {
  onThinking?: (thinking: string) => void;
  onContent?: (content: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
  onCancelled?: () => void;
}

/**
 * Generation state
 */
export type GenerationState = "idle" | "generating" | "cancelled" | "error";

/**
 * GenerationManager - Handles LLM streaming and cancellation
 */
export class GenerationManager extends EventEmitter {
  private provider: LLMProvider | null = null;
  private state: GenerationState = "idle";
  private abortController: AbortController | null = null;
  private currentModel: ModelEntry | null = null;
  private currentProviderConfig: ProviderConfig | null = null;

  constructor() {
    super();
  }

  /**
   * Configure provider and model
   */
  configure(model: ModelEntry, providerConfig: ProviderConfig): void {
    this.currentModel = model;
    this.currentProviderConfig = providerConfig;
  }

  /**
   * Get current state
   */
  getState(): GenerationState {
    return this.state;
  }

  /**
   * Check if currently generating
   */
  isGenerating(): boolean {
    return this.state === "generating";
  }

  /**
   * Start generation
   */
  async generate(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    callbacks: GenerationCallbacks,
  ): Promise<void> {
    // Prevent concurrent generations
    if (this.state === "generating") {
      return;
    }

    if (!this.currentModel || !this.currentProviderConfig) {
      callbacks.onError?.(new Error("Provider not configured"));
      return;
    }

    this.state = "generating";
    this.abortController = new AbortController();

    let thinking = "";
    let content = "";

    try {
      // Create provider if needed
      if (!this.provider) {
        this.provider = this.createProvider();
      }

      const chatStream = await this.provider.chat(
        this.currentModel.name,
        messages,
        undefined,
        this.abortController.signal,
      );

      // Stream the response
      for await (const chunk of chatStream) {
        // Handle thinking
        if (chunk.message.thinking) {
          thinking += chunk.message.thinking;
          callbacks.onThinking?.(thinking);
        }

        // Handle content
        if (chunk.message.content) {
          content += chunk.message.content;
          callbacks.onContent?.(content);
        }
      }

      this.state = "idle";
      callbacks.onComplete?.(content);
      this.emit("complete", content);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        this.state = "cancelled";
        callbacks.onCancelled?.();
        this.emit("cancelled");
      } else {
        this.state = "error";
        const err = error instanceof Error ? error : new Error(String(error));
        callbacks.onError?.(err);
        this.emit("error", err);
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel current generation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.state = "cancelled";
    }
  }

  /**
   * Create LLM provider based on config
   */
  private createProvider(): LLMProvider {
    return createLLMProvider(
      this.currentProviderConfig!,
      this.currentModel!.name,
    );
  }

  /**
   * Events:
   * - complete: (content: string) => void
   * - cancelled: () => void
   * - error: (error: Error) => void
   */
}
