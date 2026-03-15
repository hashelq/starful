/**
 * Known command placeholders that can be dynamically replaced
 */
export interface CommandPlaceholders {
  model?: string;
  theme?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Command category for grouping
 */
export interface CommandCategory {
  id: string;
  name: string;
  icon?: string;
}

/**
 * Built-in command categories
 */
export const CommandCategories = {
  CHAT: { id: "chat", name: "Chat", icon: "💬" },
  VIEW: { id: "view", name: "View", icon: "👁" },
  SETTINGS: { id: "settings", name: "Settings", icon: "⚙" },
  INFO: { id: "info", name: "Info", icon: "ℹ" },
} as const;

/**
 * Abstract base class for all commands
 * Provides nominal typing for command identification
 */
export abstract class Command {
  /** Unique identifier for the command */
  abstract readonly id: string;
  
  /** Display name of the command */
  abstract readonly name: string;
  
  /** Description of what the command does */
  abstract readonly description: string;
  
  /** Category for grouping */
  abstract readonly category: CommandCategory;
  
  /** Optional keyboard shortcut */
  readonly shortcut?: string;
  
  /** Placeholders for dynamic text replacement */
  readonly placeholders?: CommandPlaceholders;
  
  /** Handler function executed when command is invoked */
  abstract handler(): void | Promise<void>;

  constructor(options?: { shortcut?: string; placeholders?: CommandPlaceholders }) {
    this.shortcut = options?.shortcut;
    this.placeholders = options?.placeholders;
  }
}
