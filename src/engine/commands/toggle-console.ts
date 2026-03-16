import { noopUI, type UIImplementation } from "../ui.js";
import { Command, CommandCategories } from "./command.js";

/**
 * Toggle Console Command
 * Toggles the debug console visibility
 */
export class ToggleConsoleCommand extends Command {
  private _ui: UIImplementation;

  override readonly id = "toggle-console";
  override readonly name = "Toggle Console";
  override readonly description = "Toggle debug console";
  override readonly category = CommandCategories.SETTINGS;
  override readonly shortcut = "Ctrl+Shift+C";

  constructor(ui: UIImplementation = noopUI) {
    super();
    this._ui = ui;
  }

  handler(): void {
    this._ui.toggleConsole();
  }
}

// Default instance for convenience
export const toggleConsoleCommand = new ToggleConsoleCommand();
