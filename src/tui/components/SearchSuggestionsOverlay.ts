import {
  BoxRenderable,
  TextRenderable,
  type InputRenderable,
  type BoxRenderable as BoxType,
  type CliRenderer,
} from "@opentui/core";
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
  private _inputContainerReference: BoxType | null = null;

  constructor(public renderer: CliRenderer) {
    super(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column-reverse",
      backgroundColor: COLORS.surface,
      border: true,
      borderStyle: "rounded",
      borderColor: COLORS.border,
      position: "absolute",
      bottom: "100%",
      left: 0,
      zIndex: 1000,
    });

    // Initially hidden
    this.hide();

    // No need to listen to resize since position is relative to parent
  }

  /**
   * Set the input reference for positioning
   */
  setInputReference(input: InputRenderable): void {
    this._inputReference = input;
  }

  /**
   * Set the input container reference for width
   */
  setInputContainerReference(container: BoxType): void {
    this._inputContainerReference = container;
  }

  /**
   * Update position to follow input field (relative to parent container)
   */
  private _updatePosition(): void {
    // Position above the container using bottom: 100% (relative to parent)
    this.bottom = "100%";
    this.left = 0;
    this.width = "100%";
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

    // Update position relative to parent container
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

    this._currentIndex =
      (this._currentIndex - 1 + this._suggestions.length) %
      this._suggestions.length;
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
