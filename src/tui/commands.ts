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
   * Fuzzy search commands - finds partial matches in order
   * Returns sorted by match quality (exact > starts with > contains)
   */
  search(query: string): Command[] {
    if (!query) return this.getAll();
    
    const lowerQuery = query.toLowerCase();
    const allCommands = this.getAll();
    
    // Score each command by match quality
    const scored = allCommands.map(cmd => {
      const name = cmd.name.toLowerCase();
      const desc = cmd.description.toLowerCase();
      const id = cmd.id.toLowerCase();
      
      let score = 0;
      
      // Exact match
      if (name === lowerQuery || id === lowerQuery) {
        score = 100;
      }
      // Starts with query
      else if (name.startsWith(lowerQuery)) {
        score = 80;
      }
      // ID starts with
      else if (id.startsWith(lowerQuery)) {
        score = 70;
      }
      // Contains
      else if (name.includes(lowerQuery)) {
        score = 50;
      }
      else if (id.includes(lowerQuery)) {
        score = 40;
      }
      else if (desc.includes(lowerQuery)) {
        score = 20;
      }
      // Fuzzy match - each character must be found in order
      else if (_fuzzyMatch(name, lowerQuery)) {
        score = 30;
      }
      else if (_fuzzyMatch(id, lowerQuery)) {
        score = 25;
      }
      
      return { cmd, score };
    });
    
    // Filter out non-matches and sort by score descending
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.cmd);
  }

  /**
   * Get command by ID
   */
  get(id: string): Command | undefined {
    return this.commands.get(id);
  }
}

/**
 * Fuzzy match - checks if all characters of query appear in order in text
 */
function _fuzzyMatch(text: string, query: string): boolean {
  let textIndex = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query[i] ?? '';
    const found = text.indexOf(char, textIndex);
    if (found === -1) return false;
    textIndex = found + 1;
  }
  return true;
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
