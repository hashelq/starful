/**
 * ThemeEventPayload - Data passed when theme changes
 */
export interface ThemeEventPayload {
  colors: Record<string, string>;
  syntaxStyle?: any;
}

/**
 * ThemeChangeHandler - Callback function for theme changes
 */
export type ThemeChangeHandler = (payload: ThemeEventPayload) => void;

/**
 * Global Theme Service - Manages theme state and notifies subscribers
 */
export class ThemeService {
  private static instance: ThemeService;
  
  private themeName: string = "default";
  private currentColors: Record<string, string> = {};
  private handlers: Set<ThemeChangeHandler> = new Set();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  /**
   * Subscribe to theme changes - called by components that need color updates
   */
  public onThemeChange(handler: ThemeChangeHandler): () => void {
    this.handlers.add(handler);
    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Set new theme - notifies all subscribers
   */
  public setColors(colors: Record<string, string>): void {
    this.currentColors = colors;
    
    // Notify all subscribers with full payload
    const payload: ThemeEventPayload = {
      colors,
    };
    
    this.handlers.forEach(handler => handler(payload));
  }

  /**
   * Get current colors
   */
  public getColors(): Record<string, string> {
    return { ...this.currentColors };
  }

  /**
   * Get specific color by name
   */
  public getColor(name: string): string | undefined {
    return this.currentColors[name];
  }

  /**
   * Expose handlers for external notification (used by colors.ts)
   */
  public notifyThemeChange(payload: ThemeEventPayload): void {
    this.handlers.forEach(handler => handler(payload));
  }

  /**
   * Get current theme name
   */
  public getThemeName(): string {
    return this.themeName;
  }
}

/**
 * Convenience function to get theme service instance
 */
export const themeService = ThemeService.getInstance();

/**
 * Helper interface for subscribing a renderable property to theme updates
 */
export interface ThemeSubscriptionConfig {
  renderable: any; // Renderable type
  prop: string;    // Property name (e.g., "fg", "backgroundColor")
  colorKey: string; // Color key from palette (e.g., "userText", "error")
}

/**
 * Subscribe multiple renderable properties to automatic theme updates.
 * 
 * @example
 * ```typescript
 * import { subscribeToThemeChanges } from "./theme.js";
 * 
 * subscribeToThemeChanges([
 *   { renderable: myText, prop: 'fg', colorKey: 'userText' },
 *   { renderable: myBox, prop: 'backgroundColor', colorKey: 'surface' },
 * ]);
 * ```
 */
export function subscribeToThemeChanges(subscriptions: ThemeSubscriptionConfig[]): () => void {
  const unsubscribeFuncs: (() => void)[] = [];
  
  // Subscribe once and update all properties on each theme change
  const unsub = themeService.onThemeChange((payload) => {
    const colors = payload.colors;
    
    for (const sub of subscriptions) {
      if (colors[sub.colorKey]) {
        sub.renderable[sub.prop] = colors[sub.colorKey];
      }
    }
  });
  
  unsubscribeFuncs.push(unsub);
  
  // Return cleanup function
  return () => {
    for (const unsub of unsubscribeFuncs) {
      unsub();
    }
  };
}

/**
 * Example usage from a component that needs dynamic color updates:
 * 
 * ```typescript
 * import { InputRenderable } from "@opentui/core";
 * import { subscribeToThemeChanges } from "./theme.js";
 * 
 * // Option 1: Use helper for multiple properties
 * subscribeToThemeChanges([
 *   { renderable: myInput, prop: 'bg', colorKey: 'inputBg' },
 *   { renderable: myInput, prop: 'textColor', colorKey: 'inputText' },
 * ]);
 * 
 * // Option 2: Manual subscription (more control)
 * themeService.onThemeChange((payload) => {
 *   myInput.bg = payload.colors.inputBg;
 *   myInput.fg = payload.colors.textInput;
 * });
 * ```
 */
