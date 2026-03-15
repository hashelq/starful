import { Command, CommandCategories } from "./command.js";

/**
 * Revert Command
 * Removes the last assistant message from the chat
 */
export class RevertCommand extends Command {
  override readonly id = "revert";
  override readonly name = "Revert Last";
  override readonly description = "Remove the last assistant message";
  override readonly category = CommandCategories.CHAT;
  override readonly shortcut = "Ctrl+Z";

  handler(): void {
    // Handler is injected via createCommandRegistry options
  }
}

// Default instance for convenience
export const revertCommand = new RevertCommand();
