import {
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  createTextAttributes,
  CliRenderer,
} from "@opentui/core";
import { COLORS } from "../../engine/colors.js";
import { subscribeToThemeChanges } from "../../engine/theme.js";
import type {
  ResolvedCommand,
  CommandRegistry,
  CommandCategory,
} from "../../engine/commands/index.js";
import { setFocused, setUnfocused } from "../state.js";

/**
 * Tree node for command list (can be category header or command)
 */
type PromptTreeNode =
  | { type: "category"; category: CommandCategory; index: number }
  | { type: "item"; id: string; label: string; index: number };

/**
 * Prompt mode - determines what the modal displays
 */
export type PromptMode =
  | { type: "commands"; registry: CommandRegistry }
  | { type: "select"; title: string; items: string[]; current?: string };

/**
 * Result from a prompt modal
 */
export interface PromptResult {
  /** Selected item ID or null if cancelled */
  value: string | null;
  /** Whether the selection was confirmed */
  confirmed: boolean;
}

/**
 * PromptModalOptions - Options for creating a prompt modal
 */
export interface PromptModalOptions {
  /** The prompt mode */
  mode: PromptMode;
  /** Called when modal is closed */
  onClose?: () => void;
  /** Called when an item is selected */
  onSelect?: (id: string) => void;
}

/**
 * Create a PromptModal with options
 */
export function createPromptModal(
  renderer: CliRenderer,
  options: PromptModalOptions,
): PromptModal {
  return new PromptModal(renderer, options);
}

/**
 * PromptModal - A generic modal for commands or selections
 *
 * Features:
 * - Centered overlay with semi-transparent background
 * - Search input for filtering (in commands mode)
 * - Keyboard navigation (up/down arrows, enter, escape)
 * - Tree structure with categories (in commands mode)
 * - Single selection mode for prompts
 */
export class PromptModal {
  private _renderer: CliRenderer;
  private _mode: PromptMode;
  private _onClose?: () => void;
  private _onSelect?: (id: string) => void;

  private _overlay: BoxRenderable;
  private _modalBox: BoxRenderable;
  private _searchInput: InputRenderable;
  private _itemsContainer: BoxRenderable;
  private _scrollBox: ScrollBoxRenderable;
  private _itemElements: TextRenderable[] = [];
  private _categoryHeaders: TextRenderable[] = [];
  private _filteredItems: PromptTreeNode[] = [];
  private _selectedIndex: number = 0;
  private _visible: boolean = false;

  // AGENT: The fuzzy search happen automatically whenever user presses a key inside the input field. Be careful when changing this code.
  constructor(renderer: CliRenderer, options: PromptModalOptions) {
    this._renderer = renderer;
    this._mode = options.mode;
    this._onClose = options.onClose;
    this._onSelect = options.onSelect;

    // Create outer container
    this._overlay = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      position: "absolute",
      top: 0,
      left: 0,
    });

    // Background layer
    const backgroundLayer = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      backgroundColor: COLORS.background,
      opacity: 0.5,
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: 100,
    });
    this._overlay.add(backgroundLayer);

    // Centered wrapper
    const centerWrapper = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      zIndex: 200,
    });
    this._overlay.add(centerWrapper);

    // Shadow box
    const shadowBox = new BoxRenderable(renderer, {
      width: 60,
      height: "auto",
      backgroundColor: COLORS.background,
      padding: 1,
    });
    centerWrapper.add(shadowBox);

    // Modal box
    this._modalBox = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      maxHeight: "80%",
      backgroundColor: COLORS.background,
      flexDirection: "column",
      paddingY: 1,
      paddingX: 3,
      gap: 1,
    });
    shadowBox.add(this._modalBox);

    // Title (for select mode)
    let titleText = "";
    if (this._mode.type === "select") {
      titleText = this._mode.title;
    }

    if (titleText) {
      const title = new TextRenderable(renderer, {
        content: titleText,
        width: "100%",
        fg: COLORS.primary,
        attributes: createTextAttributes({ bold: true }),
        paddingX: 1,
      });
      this._modalBox.add(title);
    }

    // Search input
    this._searchInput = new InputRenderable(renderer, {
      width: "100%",
      placeholder:
        this._mode.type === "commands" ? "Search commands..." : "Filter...",
      textColor: COLORS.textInput,
      placeholderColor: COLORS.textInput,
      backgroundColor: COLORS.surface,
      attributes: createTextAttributes({ bold: true }),
    });
    this._modalBox.add(this._searchInput);

    // Scroll box wrapper for items (max 70% height)
    this._scrollBox = new ScrollBoxRenderable(renderer, {
      width: "100%",
      height: 10,
      scrollY: true,
    });

    // Items container inside scroll box
    this._itemsContainer = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });

    this._scrollBox.add(this._itemsContainer);
    this._modalBox.add(this._scrollBox);

    // Set up keyboard handling
    this._setupKeyboardHandling();

    // Set up search filtering
    this._setupSearchFiltering();

    // Subscribe to theme changes for all modal colors
    subscribeToThemeChanges([
      { renderable: backgroundLayer, prop: 'backgroundColor', colorKey: 'background' },
      { renderable: shadowBox, prop: 'backgroundColor', colorKey: 'background' },
      { renderable: this._modalBox, prop: 'backgroundColor', colorKey: 'background' },
      { renderable: this._searchInput, prop: 'textColor', colorKey: 'textInput' },
      { renderable: this._searchInput, prop: 'placeholderColor', colorKey: 'textInput' },
      { renderable: this._searchInput, prop: 'backgroundColor', colorKey: 'surface' },
    ]);

    // Initially hidden
    this._overlay.visible = false;
  }

  /**
   * Get the renderable for adding to root
   */
  get renderable(): BoxRenderable {
    return this._overlay;
  }

  /**
   * Set up keyboard event handling
   */
  private _setupKeyboardHandling(): void {
    this._searchInput.onKeyDown = (key) => {
      const keyName = key.name;

      // Enter - select current item
      if (keyName === "enter" || keyName === "return") {
        this._executeSelected();
        return true;
      }

      // Escape - close modal
      if (keyName === "escape") {
        this.close();
        return true;
      }

      // Arrow Up
      if (keyName === "up" || keyName === "k") {
        this._moveSelection(-1);
        return true;
      }

      // Arrow Down
      if (keyName === "down" || keyName === "j") {
        this._moveSelection(1);
        return true;
      }

      // Allow other keys (characters) to pass through to input
      return false;
    };
  }

  /**
   * Set up search input filtering
   */
  private _setupSearchFiltering(): void {
    // Listen to input changes
    this._searchInput.on(InputRenderableEvents.CHANGE, () => {
      const query = this._searchInput.value;
      this._filterItems(query);
    });

    // Also filter on keydown to catch changes immediately
    const originalHandler = this._searchInput.onKeyDown;
    this._searchInput.onKeyDown = (key) => {
      const result = originalHandler?.(key);
      // After key is processed, filter items
      if (
        key.name.length === 1 ||
        key.name === "backspace" ||
        key.name === "delete"
      ) {
        // Small delay to let value update
        setTimeout(() => {
          this._filterItems(this._searchInput.value);
        }, 0);
      }
      return result;
    };
  }

  /**
   * Filter items based on search query
   */
  private _filterItems(query: string): void {
    if (this._mode.type === "commands") {
      const registry = this._mode.registry;
      this._filteredItems = query
        ? this._buildTree(registry.search(query))
        : this._buildTree(registry.getAll());
    } else {
      // Select mode - filter items
      const items = this._mode.items;
      const lowerQuery = query.toLowerCase();

      if (!lowerQuery) {
        this._filteredItems = items.map((item, index) => ({
          type: "item" as const,
          id: item,
          label: item,
          index,
        }));
      } else {
        this._filteredItems = items
          .filter((item) => item.toLowerCase().includes(lowerQuery))
          .map((item, index) => ({
            type: "item" as const,
            id: item,
            label: item,
            index,
          }));
      }
    }

    // Find first selectable item (not a category)
    const firstItemIndex = this._filteredItems.findIndex(
      (item) => item.type === "item"
    );
    this._selectedIndex = firstItemIndex >= 0 ? firstItemIndex : 0;
    this._renderItems();
    this._updateSelection();
  }

  /**
   * Move selection up/down - skips category headers
   */
  private _moveSelection(delta: number): void {
    let newIndex = this._selectedIndex;
    const max = this._filteredItems.length - 1;
    
    // Keep moving until we find a valid item (not a category)
    do {
      newIndex = Math.max(0, Math.min(max, newIndex + delta));
      const node = this._filteredItems[newIndex];
      
      // If it's an item, we're done. If it's a category, continue searching.
      if (node && node.type === "item") {
        break;
      }
      
      // Prevent infinite loop if all items are filtered out
      if (newIndex === 0 || newIndex === max) break;
    } while (true);
    
    this._selectedIndex = newIndex;
    this._updateSelection();
  }

  /**
   * Update visual selection
   */
  private _updateSelection(scroll: boolean = true): void {
    // Update category headers (no change - they are never selectable)

    // Update item selection
    this._itemElements.forEach((item, _index) => {
      // Map to filtered index - only match items, not categories
      const nodeIndex = this._filteredItems.findIndex(
        (n) => n.type === "item" && item.id === n.id,
      );

      if (nodeIndex === this._selectedIndex && nodeIndex !== -1) {
        item.bg = COLORS.foreground;
        item.fg = COLORS.background;
      } else {
        item.bg = undefined;
        item.fg = COLORS.text;
      }
    });

    // Auto-scroll to selected item
    if (scroll) {
      this._scrollToSelection();
    }

    this._renderer.requestRender?.();
  }

  /**
   * Scroll to make selected item visible
   */
  private _scrollToSelection(): void {
    // Count items before selected index (to get visual position)
    let visualIndex = 0;
    for (let i = 0; i < this._filteredItems.length; i++) {
      const node = this._filteredItems[i]!;
      if (node.type === "item") {
        if (i === this._selectedIndex) break;
        visualIndex++;
      }
    }

    // Get current scroll
    const currentScroll = this._scrollBox.scrollTop;

    // Simple approach: if selected is above visible area, scroll up; if below, scroll down
    if (visualIndex < currentScroll) {
      // Selected is above - scroll up to show it at top
      this._scrollBox.scrollTop = visualIndex;
    } else if (visualIndex > currentScroll + 5) {
      // Selected is below visible area (assuming ~5 items visible) - scroll down
      this._scrollBox.scrollTop = visualIndex - 4;
    }
  }

  /**
   * Build tree structure from commands
   */
  private _buildTree(commands: ResolvedCommand[]): PromptTreeNode[] {
    const tree: PromptTreeNode[] = [];
    const categories = new Map<
      string,
      { category: CommandCategory; commands: ResolvedCommand[] }
    >();

    // Group by category
    for (const cmd of commands) {
      const catId = cmd.category.id;
      if (!categories.has(catId)) {
        categories.set(catId, { category: cmd.category, commands: [] });
      }
      categories.get(catId)!.commands.push(cmd);
    }

    // Build tree
    let cmdIndex = 0;
    for (const [, group] of categories) {
      tree.push({
        type: "category",
        category: group.category,
        index: cmdIndex,
      });
      cmdIndex++;

      for (const cmd of group.commands) {
        tree.push({
          type: "item",
          id: cmd.id,
          label: cmd.resolvedName + (cmd.shortcut ? ` ${cmd.shortcut}` : ""),
          index: cmdIndex,
        });
        cmdIndex++;
      }
    }

    return tree;
  }

  /**
   * Build select mode items
   */
  private _buildSelectItems(): void {
    if (this._mode.type !== "select") return;

    this._filteredItems = this._mode.items.map((item, index) => ({
      type: "item" as const,
      id: item,
      label: item,
      index,
    }));
  }

  /**
   * Render the items
   */
  private _renderItems(): void {
    // Clear existing
    this._itemElements.forEach((item) => {
      this._itemsContainer.remove(item.id);
    });
    this._categoryHeaders.forEach((item) => {
      this._itemsContainer.remove(item.id);
    });
    this._itemElements = [];
    this._categoryHeaders = [];

    // Render nodes
    for (const node of this._filteredItems) {
      if (node.type === "category") {
        const header = new TextRenderable(this._renderer, {
          content: `  ${node.category.icon || ""} ${node.category.name}`,
          width: "100%",
          flexGrow: 1,
          flexShrink: 0,
          height: 1,
          fg: COLORS.primary,
          attributes: createTextAttributes({ bold: true }),
          paddingX: 1,
        });
        this._categoryHeaders.push(header);
        this._itemsContainer.add(header);
      } else {
        const item = new TextRenderable(this._renderer, {
          content: `    ${node.label}`,
          width: "100%",
          flexGrow: 1,
          flexShrink: 0,
          height: 1,
          fg: COLORS.text,
          paddingX: 1,
          id: node.id,
        });

        // Hover to select
        item.onMouseOver = () => {
          const idx = this._filteredItems.findIndex(
            (n) => n.type === "item" && n.id === node.id,
          );
          if (idx !== -1) {
            this._selectedIndex = idx;
            this._updateSelection(false);
          }
        };

        // Click to execute
        item.onMouseUp = () => {
          const idx = this._filteredItems.findIndex(
            (n) => n.type === "item" && n.id === node.id,
          );
          if (idx !== -1) {
            this._selectedIndex = idx;
            this._executeSelected();
          }
        };

        this._itemElements.push(item);
        this._itemsContainer.add(item);
      }
    }

    this._renderer.requestRender?.();
  }

  /**
   * Execute selected item
   */
  private _executeSelected(): void {
    const node = this._filteredItems[this._selectedIndex];
    if (node && node.type === "item") {
      this._onSelect?.(node.id);
    }
  }

  /**
   * Show the modal - with proper focus handling similar to input.focus() on line 96 of main.ts
   */
  show(): void {
    setFocused(this._searchInput);
    this._visible = true;

    // Initialize items based on mode FIRST
    if (this._mode.type === "commands") {
      this._filteredItems = this._buildTree(this._mode.registry.getAll());
    } else {
      this._buildSelectItems();
    }

    this._selectedIndex = 0;
    this._renderItems();

    // Set visibility AFTER content is rendered
    this._overlay.visible = true;

    // Clear search input
    this._searchInput.value = "";

    // Focus the search input - like input.focus() on line 96 of main.ts
    this._searchInput.focus();


    // Request render to show everything
    this._renderer.requestRender?.();
  }

  /**
   * Hide the modal
   */
  close(): void {
    setUnfocused(this._searchInput);
    this._visible = false;
    this._overlay.visible = false;
    this._onClose?.();
    this._renderer.requestRender?.();
  }

  /**
   * Destroy the modal - removes from renderer
   */
  destroy(): void {
    this.close();
    this._renderer.root.remove(this._overlay.id);
  }

  /**
   * Toggle the modal
   */
  toggle(): void {
    if (this._visible) {
      this.close();
    } else {
      this.show();
    }
  }

  /**
   * Check if modal is visible
   */
  get isVisible(): boolean {
    return this._visible;
  }
}
