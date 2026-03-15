import {
  InputRenderable,
  InputRenderableEvents,
} from "@opentui/core";
import type { RenderContext } from "@opentui/core";
import { COLORS } from "../../engine/colors.js";
import { getPromptHistory } from "../../engine/prompt-history.js";
import { SearchSuggestionsOverlay } from "./SearchSuggestionsOverlay.js";

export type PromptInputSubmitHandler = (value: string) => void | Promise<void>;

export interface PromptInputOptions {
  onSubmit: PromptInputSubmitHandler;
  isGenerating: () => boolean;
  onExit: () => void;
}

/**
 * PromptInput - User input component with history and search
 * Handles key navigation, prompt history, and search suggestions
 */
export class PromptInput {
  public input: InputRenderable;
  private _renderer: RenderContext;
  private _searchSuggestions: SearchSuggestionsOverlay;
  private _options: PromptInputOptions;
  
  constructor(
    renderer: RenderContext,
    searchSuggestions: SearchSuggestionsOverlay,
    options: PromptInputOptions,
  ) {
    this._renderer = renderer;
    this._searchSuggestions = searchSuggestions;
    this._options = options;
    
    // Create input
    this.input = new InputRenderable(renderer, {
      width: "100%",
      placeholder: "> Ask me anything...",
      textColor: COLORS.inputText,
      placeholderColor: COLORS.placeholderText,
    });
    
    this._setupKeyHandlers();
    this._setupEventHandlers();
  }
  
  private _setupKeyHandlers(): void {
    // Handle key events
    this.input.onKeyDown = (key) => {
      const history = getPromptHistory();
      
      // Ctrl+D - exit (only when input is empty)
      if (key.ctrl && key.name === "d" && !this.input.value.length) {
        this._options.onExit();
        return true;
      }
      
      // Ctrl+C - cancel or exit
      if (key.ctrl && key.name === "c") {
        if (this._options.isGenerating()) {
          return false; // Let parent handle abort
        } else {
          this._options.onExit();
          return true;
        }
      }
      
      // Escape - exit search
      if (key.name === "escape") {
        history.resetSearch();
        this._searchSuggestions.hide();
        return false;
      }
      
      // Up arrow - previous
      if (key.name === "up") {
        this._handleUpArrow(history);
        return true;
      }
      
      // Down arrow - next
      if (key.name === "down") {
        this._handleDownArrow(history);
        return true;
      }
      
      // Reset cycling when typing
      history.resetIndex();
      return false;
    };
  }
  
  private _handleUpArrow(history: ReturnType<typeof getPromptHistory>): void {
    // If in cycling mode or empty input
    if (history.isCycling || this.input.value === "") {
      const prev = history.previous();
      if (prev) {
        this.input.value = prev;
      }
    } else if (history.isSearching) {
      // Continue searching
      history.searchPrevious();
      const result = history.getCurrentSearchResult();
      if (result) {
        this.input.value = result;
      }
      this._searchSuggestions.selectPrevious();
    } else if (this.input.value) {
      // Start search mode
      const result = history.startSearch(this.input.value);
      if (result) {
        this.input.value = result;
      }
      this._searchSuggestions.show(this.input.value, history.getSearchMatches());
    }
  }
  
  private _handleDownArrow(history: ReturnType<typeof getPromptHistory>): void {
    if (history.isCycling) {
      const next = history.next();
      this.input.value = next;
    } else if (history.isSearching) {
      history.searchNext();
      const result = history.getCurrentSearchResult();
      this.input.value = result || "";
      this._searchSuggestions.selectNext();
    } else if (this.input.value) {
      const next = history.next();
      this.input.value = next;
    }
  }
  
  private _setupEventHandlers(): void {
    // Input changes - update search
    this.input.on(InputRenderableEvents.CHANGE, (value: string) => {
      const history = getPromptHistory();
      if (history.isSearching) {
        if (value) {
          history.updateSearch(value);
          this._searchSuggestions.show(value, history.getSearchMatches());
        } else {
          history.resetSearch();
          this._searchSuggestions.hide();
        }
      }
    });
    
    // Enter - submit
    this.input.on(InputRenderableEvents.ENTER, async (val) => {
      const value = val.trim();
      
      // Add to history
      if (value) {
        getPromptHistory().add(value);
      }
      
      // Reset search
      getPromptHistory().resetSearch();
      this._searchSuggestions.hide();
      
      // Submit
      if (value) {
        await this._options.onSubmit(value);
      }
      
      return true;
    });
  }
  
  focus(): void {
    this.input.focus();
  }
}
