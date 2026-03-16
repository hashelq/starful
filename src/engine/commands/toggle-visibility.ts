import { Command, CommandCategories } from "./command.js";

/**
 * Toggleable interface - any component with show/hide methods
 */
interface Toggleable {
  show(): void;
  hide(): void;
}

/**
 * Toggleable interface - any component with show/hide methods
 */
interface Toggleable {
  show(): void;
  hide(): void;
}

/**
 * ToggleVisibilityCommand - Toggles visibility of a UI element
 * 
 * Accepts a toggleable component and toggles its visibility
 */
export class ToggleVisibilityCommand extends Command {
  private _target: Toggleable;
  private _displayName: string;
  private _isVisible: boolean = true;
  
  constructor(
    displayName: string,
    target: Toggleable,
  ) {
    super();
    this._displayName = displayName;
    this._target = target;
  }
  
  // Use getter to avoid initialization order issues
  get id(): string { 
    return `toggle-${this._displayName.toLowerCase().replace(/\s+/g, "-")}`;
  }
  
  get name(): string { 
    return `Toggle ${this._displayName}`;
  }
  
  override readonly description = `Toggle visibility`;
  override readonly category = CommandCategories.SETTINGS;
  override readonly shortcut = "Ctrl+B";

  handler(): void {
    this._isVisible = !this._isVisible;
    if (this._isVisible) {
      this._target.show();
    } else {
      this._target.hide();
    }
  }
}
