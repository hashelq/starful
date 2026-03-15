import type { CliRenderer } from "@opentui/core";
import type { UIImplementation } from "../ui.js";
import { noopUI } from "../ui.js";

import { Command, type CommandPlaceholders, type CommandCategory } from "./command.js";
export { Command, type CommandPlaceholders, type CommandCategory, CommandCategories } from "./command.js";

import { ClearCommand } from "./clear.js";
import { RevertCommand } from "./revert.js";
import { ModelCommand } from "./model.js";
import { ThemeCommand } from "./theme.js";
import { helpCommand } from "./help.js";
import { aboutCommand } from "./about.js";

// Re-export command instances for convenience
export { clearCommand } from "./clear.js";
export { revertCommand } from "./revert.js";
export { modelCommand } from "./model.js";
export { themeCommand } from "./theme.js";
export { helpCommand } from "./help.js";
export { aboutCommand } from "./about.js";

/**
 * Abstract command definition with placeholders
 */
export interface CommandSpec {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  shortcut?: string;
  /** Placeholders to replace in name/description, e.g. "{model}" -> "llama2" */
  placeholders?: CommandPlaceholders;
  handler: () => void | Promise<void>;
}

/**
 * Resolved command with placeholders replaced
 */
export interface ResolvedCommand extends CommandSpec {
  resolvedName: string;
  resolvedDescription: string;
}

/**
 * Check if an object is a Command instance (nominal typing)
 */
export function isCommand(obj: unknown): obj is Command {
  return obj instanceof Command;
}

/**
 * Command registry - holds all available commands
 */
export class CommandRegistry {
  private commands: Map<string, CommandSpec> = new Map();
  private placeholders: CommandPlaceholders = {};

  /**
   * Set placeholders for all commands
   */
  setPlaceholders(placeholders: CommandPlaceholders): void {
    this.placeholders = { ...this.placeholders, ...placeholders };
  }

  /**
   * Resolve placeholders in a string
   */
  private resolveString(str: string): string {
    let result = str;
    if (this.placeholders.model) {
      result = result.replace(/{model}/g, this.placeholders.model);
    }
    if (this.placeholders.theme) {
      result = result.replace(/{theme}/g, this.placeholders.theme);
    }
    if (this.placeholders.temperature !== undefined) {
      result = result.replace(/{temperature}/g, this.placeholders.temperature.toString());
    }
    if (this.placeholders.maxTokens !== undefined) {
      result = result.replace(/{maxTokens}/g, this.placeholders.maxTokens.toString());
    }
    return result;
  }

  /**
   * Resolve a command definition to get actual command with placeholders
   */
  private resolveCommand(def: CommandSpec): ResolvedCommand {
    return {
      ...def,
      resolvedName: this.resolveString(def.name),
      resolvedDescription: this.resolveString(def.description),
      handler: def.handler, // Explicitly include handler (class methods don't spread)
    };
  }

  /**
   * Register a command
   */
  register(command: CommandSpec): void {
    this.commands.set(command.id, command);
  }

  /**
   * Get all commands (resolved with placeholders)
   */
  getAll(): ResolvedCommand[] {
    return Array.from(this.commands.values()).map(def => this.resolveCommand(def));
  }

  /**
   * Fuzzy search commands - finds partial matches in order
   * Returns sorted by match quality (exact > starts with > contains)
   */
  search(query: string): ResolvedCommand[] {
    if (!query) return this.getAll();
    
    const lowerQuery = query.toLowerCase();
    const allCommands = this.getAll();
    
    // Score each command by match quality
    const scored = allCommands.map(cmd => {
      const name = cmd.resolvedName.toLowerCase();
      const desc = cmd.resolvedDescription.toLowerCase();
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
   * Get command by ID (resolved with placeholders)
   */
  get(id: string): ResolvedCommand | undefined {
    const def = this.commands.get(id);
    return def ? this.resolveCommand(def) : undefined;
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
  ui: UIImplementation = noopUI,
  options: {
    onClearChat?: () => void;
    onRevert?: () => void;
    onShowModel?: () => void;
  } = {}
): CommandRegistry {
  const registry = new CommandRegistry();

  // Create handler overrides
  const handlers = {
    clear: () => options.onClearChat?.(),
    revert: () => options.onRevert?.(),
    model: () => options.onShowModel?.(),
  };

  // Register commands - create new instances with handlers
  registry.register(new ClearCommand());
  registry.register(new RevertCommand());
  registry.register(new ModelCommand());
  registry.register(new ThemeCommand(ui, (newTheme: string) => {
    // Update theme placeholder after theme change
    registry.setPlaceholders({ theme: newTheme });
  }));
  registry.register(helpCommand);
  registry.register(aboutCommand);

  // Override handlers after registration
  const clear = registry.get("clear");
  if (clear) (clear as any).handler = handlers.clear;

  const revert = registry.get("revert");
  if (revert) (revert as any).handler = handlers.revert;

  const model = registry.get("model");
  if (model) (model as any).handler = handlers.model;

  return registry;
}
