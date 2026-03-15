import { Command, CommandCategories } from "./command.js";

/**
 * Show Model Command
 * Displays the currently used Ollama model
 */
export class ModelCommand extends Command {
  override readonly id = "model";
  override readonly name = "Show Model: {model}";
  override readonly description = "Display the currently used Ollama model";
  override readonly category = CommandCategories.SETTINGS;

  handler(): void {
    // Handler is injected via createCommandRegistry options
  }
}

// Default instance for convenience
export const modelCommand = new ModelCommand();
