import { Command, CommandCategories } from "./command.js";
import { type UIImplementation, noopUI } from "../ui.js";
import { getAvailableThemes, setTheme, getCurrentTheme } from "../colors.js";

/**
 * Theme Command
 * Switches to a different theme using the UI implementation
 */
export class ThemeCommand extends Command {
  private _ui: UIImplementation;
  private _onThemeChange?: (theme: string) => void;
  
  constructor(ui: UIImplementation = noopUI, onThemeChange?: (theme: string) => void) {
    super();
    this._ui = ui;
    this._onThemeChange = onThemeChange;
  }
  
  override readonly id = "theme";
  override readonly name = "Switch Theme: {theme}";
  override readonly description = "Switch to the next theme";
  override readonly category = CommandCategories.SETTINGS;

  handler(): void {
    const themes = getAvailableThemes();
    const currentTheme = getCurrentTheme();
    
    // Use UI to prompt for theme selection
    this._ui.promptSelect({
      title: "Select Theme",
      items: themes,
      current: currentTheme,
    }).then((selected) => {
      if (selected) {
        setTheme(selected);
        this._ui.showNotification(`Theme: ${selected}`);
        
        // Notify to update placeholders
        if (this._onThemeChange) {
          this._onThemeChange(selected);
        }
      }
    });
  }
}

// Default instance - will use noopUI until properly instantiated with real UI
export const themeCommand = new ThemeCommand();
