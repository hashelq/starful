import { Command, CommandCategories } from "./command.js";

/**
 * Clear Chat Command
 * Clears all chat messages from the history
 */
export class ClearCommand extends Command {
  override readonly id = "clear";
  override readonly name = "Clear Chat";
  override readonly description = "Clear all chat messages";
  override readonly category = CommandCategories.CHAT;
  override readonly shortcut = "Ctrl+L";

  handler(): void {
    // Handler is injected via createCommandRegistry options
  }
}

// Default instance for convenience
export const clearCommand = new ClearCommand();
