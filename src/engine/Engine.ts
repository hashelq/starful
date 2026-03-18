import { EventEmitter } from "./EventEmitter.js";
import { loadConfig, type Config } from "./config.js";
import { ProviderModelManager } from "./managers/ProviderModelManager.js";
import { MessageManager } from "./managers/MessageManager.js";
import { GenerationManager, type GenerationCallbacks } from "./managers/GenerationManager.js";
import { CommandManager } from "./managers/CommandManager.js";
import { createEngineCommands } from "./managers/DefaultCommands.js";
import type { UIImplementation } from "./ui.js";
import type { ModelEntry, ProviderConfig } from "./config.js";

/**
 * Engine configuration options
 */
export interface EngineOptions {
  ui?: UIImplementation;
  systemPrompt?: string;
}

/**
 * Engine - Main orchestrator for the application
 * Coordinates all managers and provides a clean API
 */
export class Engine extends EventEmitter {
  private config: Config;
  private providerModel: ProviderModelManager;
  private messages: MessageManager;
  private generation: GenerationManager;
  private commands: CommandManager;
  private ui: UIImplementation;

  constructor(options: EngineOptions = {}) {
    super();
    
    this.ui = options.ui ?? {
      promptSelect: async () => null,
      showNotification: () => {},
      focusInput: () => {},
      toggleConsole: () => {},
    };

    // Load config once and share with managers
    this.config = loadConfig();
    
    // Initialize managers with shared config
    this.providerModel = new ProviderModelManager(this.config);
    this.messages = new MessageManager();
    this.generation = new GenerationManager();
    this.commands = new CommandManager();

    // Register default commands
    const defaultCommands = createEngineCommands(
      {
        getMessages: () => this.messages,
        getCommands: () => this.commands,
        notify: (msg) => this.ui.showNotification(msg),
        listModels: () => this.providerModel.listModels(),
        listAllModels: () => this.providerModel.listAllModels(),
        findModel: (index) => this.providerModel.findModel(index as `${string}/${string}`),
        setModel: (index) => this.providerModel.setModelByIndex(index),
      },
      () => this.config,
    );
    this.commands.registerMany(defaultCommands);

    // Set system prompt
    if (options.systemPrompt) {
      this.messages.setSystemPrompt(options.systemPrompt);
    }

    // Configure generation with current provider/model
    this.updateGenerationConfig();

    // Listen to provider/model changes
    this.providerModel.on("modelChanged", () => {
      this.updateGenerationConfig();
      this.emit("modelChanged", this.providerModel.getModel());
    });

    // Listen to command events and relay them
    this.commands.on("commandExecuted", (data) => {
      this.emit("commandExecuted", data);
    });
    this.commands.on("commandError", (data) => {
      this.emit("commandError", data);
    });
  }

  /**
   * Reload configuration (call after config file is updated)
   */
  reloadConfig(): void {
    this.config = loadConfig();
    this.providerModel.reloadConfig(this.config);
    this.emit("configReloaded");
  }

  /**
   * Update generation manager with current provider/model config
   */
  private updateGenerationConfig(): void {
    const model = this.providerModel.getModel();
    const providerConfig = this.providerModel.getProviderConfig();
    this.generation.configure(model, providerConfig);
  }

  // ─────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────

  /**
   * Send a message and get AI response
   */
  async sendMessage(prompt: string, callbacks?: GenerationCallbacks): Promise<void> {
    // Add user message
    this.messages.addMessage("user", prompt);

    // Build messages for LLM
    const llmMessages = this.messages.getHistoryForLLM(10);

    // Default callbacks if not provided
    const wrappedCallbacks: GenerationCallbacks = {
      onThinking: (thinking) => {
        callbacks?.onThinking?.(thinking);
        this.emit("thinking", thinking);
      },
      onContent: (content) => {
        callbacks?.onContent?.(content);
        this.emit("content", content);
      },
      onComplete: (fullContent) => {
        this.messages.addMessage("assistant", fullContent);
        callbacks?.onComplete?.(fullContent);
        this.emit("complete", fullContent);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
        this.emit("error", error);
      },
      onCancelled: () => {
        callbacks?.onCancelled?.();
        this.emit("cancelled");
      },
    };

    // Start generation
    await this.generation.generate(llmMessages, wrappedCallbacks);
  }

  /**
   * Cancel current generation
   */
  cancel(): void {
    this.generation.cancel();
  }

  /**
   * Check if currently generating
   */
  isGenerating(): boolean {
    return this.generation.isGenerating();
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messages.clear();
    this.emit("historyCleared");
  }

  // ─────────────────────────────────────────
  // Provider/Model Access
  // ─────────────────────────────────────────

  /**
   * Get current provider
   */
  getProvider(): string {
    return this.providerModel.getProvider();
  }

  /**
   * Get current model
   */
  getModel(): ModelEntry {
    return this.providerModel.getModel();
  }

  /**
   * Get current provider config
   */
  getProviderConfig(): ProviderConfig {
    return this.providerModel.getProviderConfig();
  }

  /**
   * Set model by "provider/model" string
   */
  setModel(index: string): void {
    this.providerModel.setModelByIndex(index);
  }

  /**
   * Find model by string
   */
  findModel(index: string): ModelEntry | undefined {
    return this.providerModel.findModel(index as `${string}/${string}`);
  }

  /**
   * List available models
   */
  listModels(): ModelEntry[] {
    return this.providerModel.listModels();
  }

  /**
   * List all models grouped by provider
   */
  listAllModels(): Record<string, ModelEntry[]> {
    return this.providerModel.listAllModels();
  }

  // ─────────────────────────────────────────
  // Messages Access
  // ─────────────────────────────────────────

  /**
   * Get message history
   */
  getHistory() {
    return this.messages.getHistory();
  }

  // ─────────────────────────────────────────
  // UI Access
  // ─────────────────────────────────────────

  /**
   * Get UI implementation
   */
  getUI(): UIImplementation {
    return this.ui;
  }

  /**
   * Show notification
   */
  notify(message: string): void {
    this.ui.showNotification(message);
  }

  /**
   * Focus input
   */
  focusInput(): void {
    this.ui.focusInput();
  }

  /**
   * Toggle console
   */
  toggleConsole(): void {
    this.ui.toggleConsole();
  }

  // ─────────────────────────────────────────
  // Commands Access
  // ─────────────────────────────────────────

  /**
   * Get command manager
   */
  getCommands(): CommandManager {
    return this.commands;
  }

  /**
   * Register a single command
   */
  registerCommand(id: string, handler: import("./managers/CommandManager.js").CommandHandler): void {
    this.commands.register(id, handler);
  }

  /**
   * Register multiple commands at once
   */
  registerCommands(handlers: Map<string, import("./managers/CommandManager.js").CommandHandler>): void {
    this.commands.registerMany(handlers);
  }

  /**
   * Execute a command by ID
   */
  async executeCommand(id: string, args?: unknown[]) {
    return this.commands.execute(id, args);
  }

  /**
   * Execute a command from string input
   */
  async executeCommandString(input: string) {
    return this.commands.executeString(input);
  }

  // ─────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────

  /**
   * Events:
   * - thinking: (thinking: string) => void
   * - content: (content: string) => void
   * - complete: (content: string) => void
   * - error: (error: Error) => void
   * - cancelled: () => void
   * - modelChanged: (model: ModelEntry) => void
   * - historyCleared: () => void
   * - commandExecuted: (data: { id: string; result: unknown }) => void
   * - commandError: (data: { id: string; error: string }) => void
   */
}
