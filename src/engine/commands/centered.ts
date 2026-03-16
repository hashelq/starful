import { Command, CommandCategories } from "./command.js";
import { isCentered, setCentered } from "../ui-config.js";

/**
 * CenteredMode Command
 * Toggles centered mode for chat history and input
 */
export class CenteredModeCommand extends Command {
  private _onToggle?: (centered: boolean) => void;
  
  constructor(onToggle?: (centered: boolean) => void) {
    super();
    this._onToggle = onToggle;
  }
  
  override readonly id = "centered";
  override readonly name = "Centered Mode: {centered}";
  override readonly description = "Toggle centered layout for chat";
  override readonly category = CommandCategories.VIEW;

  handler(): void {
    const current = isCentered();
    const next = !current;
    
    setCentered(next);
    
    // Notify UI to update
    if (this._onToggle) {
      this._onToggle(next);
    }
  }
}

// Default instance
export const centeredModeCommand = new CenteredModeCommand();
