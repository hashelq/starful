import { BoxRenderable, TextRenderable, CliRenderer } from "@opentui/core";
import { COLORS } from "./constants.js";

/**
 * Command definition
 */
export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  handler: () => void | Promise<void>;
}

/**
 * Command registry - holds all available commands
 */
export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  /**
   * Register a command
   */
  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  /**
   * Get all commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Search commands by name (fuzzy search)
   */
  search(query: string): Command[] {
    if (!query) return this.getAll();
    
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(cmd => 
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery) ||
      cmd.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get command by ID
   */
  get(id: string): Command | undefined {
    return this.commands.get(id);
  }
}

/**
 * Create the default command registry
 */
export function createCommandRegistry(
  renderer: CliRenderer,
  options: {
    onClearChat?: () => void;
    onRevert?: () => void;
    onShowModel?: () => void;
    onToggleTheme?: () => void;
  } = {}
): CommandRegistry {
  const registry = new CommandRegistry();

  // /clear - Clear chat history
  registry.register({
    id: "clear",
    name: "Clear Chat",
    description: "Clear all chat messages",
    shortcut: "Ctrl+L",
    handler: () => {
      options.onClearChat?.();
    },
  });

  // /revert - Revert last response
  registry.register({
    id: "revert",
    name: "Revert Last",
    description: "Remove the last assistant message",
    shortcut: "Ctrl+Z",
    handler: () => {
      options.onRevert?.();
    },
  });

  // /model - Show current model
  registry.register({
    id: "model",
    name: "Show Model",
    description: "Display the currently used Ollama model",
    handler: () => {
      options.onShowModel?.();
    },
  });

  // /theme - Toggle theme (placeholder)
  registry.register({
    id: "theme",
    name: "Toggle Theme",
    description: "Switch between light and dark themes",
    handler: () => {
      options.onToggleTheme?.();
    },
  });

  // /help - Show help
  registry.register({
    id: "help",
    name: "Help",
    description: "Show keyboard shortcuts and commands",
    handler: () => {
      // Could show a help modal
    },
  });

  // /about - Show about
  registry.register({
    id: "about",
    name: "About Starful",
    description: "Show information about Starful",
    handler: () => {
      // Could show an about modal
    },
  });

  return registry;
}
