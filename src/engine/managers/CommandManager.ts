import { EventEmitter } from "../EventEmitter.js";

/**
 * Command history entry
 */
export interface CommandHistoryEntry {
  id: string;
  commandId: string;
  timestamp: number;
  args?: unknown[];
  result?: unknown;
  error?: string;
}

/**
 * CommandManager - Manages command registration, execution, and history
 * 
 * Responsibilities:
 * - Register/unregister commands
 * - Execute commands with history tracking
 * - Provide undo/redo functionality
 * - Search commands for autocomplete
 */
export class CommandManager extends EventEmitter {
  private commandRegistry: Map<string, CommandHandler> = new Map();
  private history: CommandHistoryEntry[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 100;

  /**
   * Register a command handler
   */
  register(id: string, handler: CommandHandler): void {
    this.commandRegistry.set(id, handler);
    this.emit("commandRegistered", id);
  }

  /**
   * Register multiple commands at once
   */
  registerMany(handlers: Map<string, CommandHandler>): void {
    for (const [id, handler] of handlers) {
      this.commandRegistry.set(id, handler);
    }
    this.emit("commandsRegistered", Array.from(handlers.keys()));
  }

  /**
   * Unregister a command
   */
  unregister(id: string): boolean {
    const result = this.commandRegistry.delete(id);
    if (result) {
      this.emit("commandUnregistered", id);
    }
    return result;
  }

  /**
   * Check if command exists
   */
  has(id: string): boolean {
    return this.commandRegistry.has(id);
  }

  /**
   * Get command handler
   */
  get(id: string): CommandHandler | undefined {
    return this.commandRegistry.get(id);
  }

  /**
   * Get all registered command IDs
   */
  listCommands(): string[] {
    return Array.from(this.commandRegistry.keys());
  }

  /**
   * Execute a command by ID
   */
  async execute(id: string, args?: unknown[]): Promise<CommandResult> {
    const handler = this.commandRegistry.get(id);
    
    if (!handler) {
      const error = `Command not found: ${id}`;
      this.addToHistory({
        id: generateId(),
        commandId: id,
        timestamp: Date.now(),
        args,
        error,
      });
      return { success: false, error };
    }

    const entry: CommandHistoryEntry = {
      id: generateId(),
      commandId: id,
      timestamp: Date.now(),
      args,
    };

    try {
      // Execute the command
      const result = await handler.execute(args);
      entry.result = result;
      
      // Add to history
      this.addToHistory(entry);
      
      this.emit("commandExecuted", { id, result });
      return { success: true, result };
    } catch (error) {
      entry.error = error instanceof Error ? error.message : String(error);
      this.addToHistory(entry);
      
      this.emit("commandError", { id, error });
      return { success: false, error: entry.error };
    }
  }

  /**
   * Execute a command by name (string) - useful for CLI input
   */
  async executeString(input: string): Promise<CommandResult> {
    // Parse command and arguments from input string
    const trimmed = input.trim();
    if (!trimmed) {
      return { success: false, error: "Empty command" };
    }
    
    const parts = trimmed.split(/\s+/);
    const commandId = parts[0] ?? "";
    const args = parts.slice(1);
    
    return this.execute(commandId, args);
  }

  /**
   * Add entry to command history
   */
  private addToHistory(entry: CommandHistoryEntry): void {
    // Remove any redo history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Add new entry
    this.history.push(entry);
    
    // Trim history if too long
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
    
    this.historyIndex = this.history.length - 1;
  }

  /**
   * Get command history
   */
  getHistory(): CommandHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get history entry at index
   */
  getHistoryEntry(index: number): CommandHistoryEntry | undefined {
    return this.history[index];
  }

  /**
   * Get current history position
   */
  getHistoryPosition(): number {
    return this.historyIndex;
  }

  /**
   * Navigate to previous command in history
   */
  historyBack(): CommandHistoryEntry | undefined {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return undefined;
  }

  /**
   * Navigate to next command in history
   */
  historyForward(): CommandHistoryEntry | undefined {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    // If at end, return "empty" to clear input
    this.historyIndex = this.history.length;
    return undefined;
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
    this.emit("historyCleared");
  }

  /**
   * Search commands by query (fuzzy match)
   */
  search(query: string): string[] {
    if (!query) {
      return this.listCommands();
    }
    
    const lowerQuery = query.toLowerCase();
    const commands = this.listCommands();
    
    // Score each command
    const scored = commands.map(id => {
      let score = 0;
      
      // Exact match
      if (id === lowerQuery) {
        score = 100;
      }
      // Starts with
      else if (id.startsWith(lowerQuery)) {
        score = 80;
      }
      // Contains
      else if (id.includes(lowerQuery)) {
        score = 50;
      }
      // Fuzzy - each char must appear in order
      else if (fuzzyMatch(id, lowerQuery)) {
        score = 30;
      }
      
      return { id, score };
    });
    
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.id);
  }

  /**
   * Events:
   * - commandRegistered: (id: string) => void
   * - commandUnregistered: (id: string) => void
   * - commandExecuted: (data: { id: string; result: unknown }) => void
   * - commandError: (data: { id: string; error: string }) => void
   * - historyCleared: () => void
   */
}

/**
 * Command handler interface
 */
export interface CommandHandler {
  /** Command ID */
  id: string;
  
  /** Command display name */
  name: string;
  
  /** Command description */
  description: string;
  
  /** Execute the command */
  execute(args?: unknown[]): Promise<unknown>;
  
  /** Optional: undo the command */
  undo?(): Promise<void>;
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * Generate unique ID for history entries
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Fuzzy match - checks if all characters of query appear in order in text
 */
function fuzzyMatch(text: string, query: string): boolean {
  let textIndex = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query[i] ?? '';
    const found = text.indexOf(char, textIndex);
    if (found === -1) return false;
    textIndex = found + 1;
  }
  return true;
}

// ─────────────────────────────────────────
// Command Handler Helpers
// ─────────────────────────────────────────

/**
 * Create a simple command handler from a function
 */
export function createCommandHandler(
  id: string,
  name: string,
  description: string,
  executeFn: (args?: unknown[]) => unknown | Promise<unknown>,
  options?: {
    undo?: () => void | Promise<void>;
  },
): CommandHandler {
  return {
    id,
    name,
    description,
    execute: async (args?: unknown[]) => {
      const result = executeFn(args);
      if (result instanceof Promise) {
        return result;
      }
      return result;
    },
    undo: options?.undo 
      ? async () => { 
          const undoResult = options.undo!();
          if (undoResult instanceof Promise) {
            await undoResult;
          }
        }
      : undefined,
  };
}
