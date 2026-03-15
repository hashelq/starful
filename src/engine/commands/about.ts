import { Command, CommandCategories } from "./command.js";

/**
 * About Command
 * Shows information about Starful
 */
export class AboutCommand extends Command {
  override readonly id = "about";
  override readonly name = "About Starful";
  override readonly description = "Show information about Starful";
  override readonly category = CommandCategories.INFO;

  handler(): void {
    // Handler is injected via createCommandRegistry options
  }
}

// Default instance for convenience
export const aboutCommand = new AboutCommand();
