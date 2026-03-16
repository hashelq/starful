/**
 * UI Implementation interface
 * Abstracts UI operations so engine commands can work with any UI (TUI, GUI, Web, etc.)
 */

/**
 * Options for prompt select
 */
export interface PromptSelectOptions {
  /** Modal title */
  title: string;
  /** Items to select from */
  items: string[];
  /** Current selection (for highlighting) */
  current?: string;
}

/**
 * UI Implementation - must be implemented by the UI layer
 * This allows engine commands to interact with UI without coupling to specific implementation
 */
export interface UIImplementation {
  /**
   * Prompt user to select from a list
   * @param options Selection options
   * @returns Selected item or null if cancelled
   */
  promptSelect(options: PromptSelectOptions): Promise<string | null>;
  
  /**
   * Show a notification message
   * @param message Message to show
   */
  showNotification(message: string): void;
  
  /**
   * Focus the main input field
   */
  focusInput(): void;
  
  /**
   * Toggle the debug console
   */
  toggleConsole(): void;
}

/**
 * No-op UI implementation - useful for testing or headless mode
 */
export const noopUI: UIImplementation = {
  promptSelect: async () => null,
  showNotification: () => {},
  focusInput: () => {},
  toggleConsole: () => {},
};
