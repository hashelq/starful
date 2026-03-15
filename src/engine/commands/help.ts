import { Command, CommandCategories } from "./command.js";

/**
 * Help Command
 * Shows keyboard shortcuts and available commands
 */
export class HelpCommand extends Command {
  override readonly id = "help";
  override readonly name = "Help";
  override readonly description = "Show keyboard shortcuts and commands";
  override readonly category = CommandCategories.INFO;

  handler(): void {
    // Handler is injected via createCommandRegistry options
  }
}

// Default instance for convenience
export const helpCommand = new HelpCommand();
