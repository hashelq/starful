import {
  BoxRenderable,
  TextRenderable,
  type InputRenderable,
} from "@opentui/core";
import type { RenderContext } from "@opentui/core";
import { COLORS } from "../../engine/colors.js";

export interface SearchSuggestion {
  /** The text to display */
  text: string;
  /** Optional index for display (1-based) */
  index?: number;
}

/**
 * SearchSuggestionsOverlay - Shows search suggestions below input
 * Displays up to 8 suggestions with current selection highlighted
 */
export class SearchSuggestionsOverlay extends BoxRenderable {
  private _suggestionItems: TextRenderable[] = [];
  private _currentIndex = 0;
  private _suggestions: string[] = [];
  private _prefix = "";
  private _isOverlayVisible = false;
  private _inputReference: InputRenderable | null = null;
  
  constructor(
    public renderer: RenderContext,
  ) {
    super(renderer, {
      width: "auto",
      height: "auto",
      maxWidth: "80%",
      flexDirection: "column",
      backgroundColor: COLORS.surface,
      border: true,
      borderStyle: "rounded",
      borderColor: COLORS.border,
      position: "absolute",
      zIndex: 1000,
    });
    
    // Initially hidden
    this.hide();

    // Listen to terminal resize to update position
    renderer.on("resize", () => {
      if (this._isOverlayVisible && this._inputReference) {
        this._updatePosition();
      }
    });
  }

  /**
   * Set the input reference for positioning
   */
  setInputReference(input: InputRenderable): void {
    this._inputReference = input;
  }
  
  /**
   * Update position to follow input field
   */
  private _updatePosition(): void {
    if (!this._inputReference) return;
    
    // Get input position (after layout)
    const inputX = this._inputReference.x;
    const inputY = this._inputReference.y;
    const inputHeight = (this._inputReference as any).heightValue || 1;
    
    // Position below the input
    this.top = inputY + inputHeight;
    this.left = inputX;
  }
  
  /**
   * Show suggestions overlay
   */
  show(prefix: string, suggestions: string[]): void {
    if (suggestions.length === 0) {
      this.hide();
      return;
    }
    
    this._prefix = prefix;
    this._suggestions = suggestions.slice(0, 8); // Max 8
    this._currentIndex = 0;
    this._isOverlayVisible = true;
    
    // Update position to follow input
    this._updatePosition();
    
    // Clear existing suggestions
    for (const item of this._suggestionItems) {
      this.remove(item.id);
    }
    this._suggestionItems = [];
    
    // Add new suggestion items
    for (let i = 0; i < this._suggestions.length; i++) {
      const suggestion = this._suggestions[i];
      const isSelected = i === this._currentIndex;
      
      const item = new TextRenderable(this.renderer, {
        content: suggestion,
        fg: isSelected ? COLORS.accent : COLORS.text,
        width: "auto",
        paddingX: 1,
        paddingY: 0,
      });
      
      this._suggestionItems.push(item);
      this.add(item);
    }
    
    this.visible = true;
    this.renderer.requestRender?.();
  }
  
  /**
   * Hide suggestions overlay
   */
  hide(): void {
    this._isOverlayVisible = false;
    this._suggestions = [];
    // Clear all children
    for (const item of this._suggestionItems) {
      if (item) this.remove(item.id);
    }
    this._suggestionItems = [];
    this.renderer.requestRender?.();
  }
  
  /**
   * Check if overlay is visible
   */
  isVisible(): boolean {
    return this._isOverlayVisible;
  }
  
  /**
   * Move selection up
   */
  selectPrevious(): void {
    if (this._suggestions.length === 0) return;
    
    this._currentIndex = (this._currentIndex - 1 + this._suggestions.length) % this._suggestions.length;
    this._updateSelection();
  }
  
  /**
   * Move selection down
   */
  selectNext(): void {
    if (this._suggestions.length === 0) return;
    
    this._currentIndex = (this._currentIndex + 1) % this._suggestions.length;
    this._updateSelection();
  }
  
  /**
   * Get currently selected suggestion
   */
  getSelectedSuggestion(): string | null {
    if (this._suggestions.length === 0) return null;
    return this._suggestions[this._currentIndex] ?? null;
  }
  
  /**
   * Get current selection index
   */
  getCurrentIndex(): number {
    return this._currentIndex;
  }
  
  /**
   * Get total suggestions count
   */
  getCount(): number {
    return this._suggestions.length;
  }
  
  /**
   * Update visual selection
   */
  private _updateSelection(): void {
    for (let i = 0; i < this._suggestionItems.length; i++) {
      const item = this._suggestionItems[i];
      if (!item) continue;
      
      const isSelected = i === this._currentIndex;
      item.fg = isSelected ? COLORS.accent : COLORS.text;
    }
    this.renderer.requestRender?.();
  }
}
