import {
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  ScrollBoxRenderable,
  createTextAttributes,
  CliRenderer,
} from "@opentui/core";
import { COLORS } from "../constants.js";
import type { Command, CommandRegistry } from "../commands.js";
import { openModal, closeModal } from "../state.js";

/**
 * CommandModal - A modal dialog for executing commands
 * 
 * Features:
 * - Centered overlay with semi-transparent background
 * - Search input for filtering commands
 * - Keyboard navigation (up/down arrows, enter, escape)
 * - Fuzzy search filtering
 */
export class CommandModal {
  private _renderer: CliRenderer;
  private _registry: CommandRegistry;
  private _overlay: BoxRenderable;
  private _modalBox: BoxRenderable;
  private _searchInput: InputRenderable;
  private _commandsContainer: BoxRenderable;
  private _commandItems: TextRenderable[] = [];
  private _filteredCommands: Command[] = [];
  private _selectedIndex: number = 0;
  private _onClose: () => void;
  private _visible: boolean = false;

  constructor(
    renderer: CliRenderer,
    registry: CommandRegistry,
    onClose: () => void = () => {},
  ) {
    this._renderer = renderer;
    this._registry = registry;
    this._onClose = onClose;
    this._filteredCommands = registry.getAll();

    // Create outer container
    this._overlay = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      position: "absolute",
      top: 0,
      left: 0,
    });

    // Background layer - solid dark (simulates overlay)
    const backgroundLayer = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      backgroundColor: "#000000",
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: 100,
    });
    this._overlay.add(backgroundLayer);

    // Centered wrapper for modal
    const centerWrapper = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      zIndex: 200,
    });
    this._overlay.add(centerWrapper);

    // Shadow box (creates depth effect)
    const shadowBox = new BoxRenderable(renderer, {
      width: 60,
      height: "auto",
      backgroundColor: "#000000",
      padding: 1,
    });
    centerWrapper.add(shadowBox);

    // Modal box (the actual content)
    this._modalBox = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      backgroundColor: "#1e1e2e", // Catppuccin-like dark
      flexDirection: "column",
    });
    shadowBox.add(this._modalBox);

    // Create search input with fancy styling
    this._searchInput = new InputRenderable(renderer, {
      width: "100%",
      placeholder: "Search commands...",
      textColor: "#cdd6f4", // Light text
      placeholderColor: "#6c7086", // Dim placeholder
      backgroundColor: "#181825", // Dark input bg
    });
    // Keyboard handler will trigger fuzzy search with defer
    this._modalBox.add(this._searchInput);

    // Create commands container (scrollable)
    this._commandsContainer = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });
    this._modalBox.add(this._commandsContainer);

    // Render initial command list
    this._renderCommands();

    // Set up keyboard handling
    this._setupKeyboardHandling();

    // Initially hidden
    this._overlay.visible = false;
  }

  /**
   * Set up keyboard event handling
   */
  private _setupKeyboardHandling(): void {
    // Handle keyboard events on the search input
    this._searchInput.onKeyDown = (key) => {
      const keyName = key.name;
      
      // Enter - execute selected command
      if (keyName === "enter" || keyName === "return") {
        this._executeSelected();
        return true;
      }
      
      // Escape - close modal
      if (keyName === "escape") {
        this.close();
        return true;
      }
      
      // Arrow Up - move selection up
      if (keyName === "up" || keyName === "arrowup") {
        this._moveSelection(-1);
        return true;
      }
      
      // Arrow Down - move selection down
      if (keyName === "down" || keyName === "arrowdown") {
        this._moveSelection(1);
        return true;
      }
      
      // Allow default input behavior for character keys
      // and defer fuzzy search
      setTimeout(() => {
        const query = this._searchInput.value;
        this._filterCommands(query);
      }, 0);
      
      return false;
    };
  }

  /**
   * Filter commands based on search query
   */
  private _filterCommands(query: string): void {
    this._filteredCommands = this._registry.search(query);
    this._selectedIndex = 0;
    this._renderCommands();
  }

  /**
   * Move selection up or down
   */
  private _moveSelection(delta: number): void {
    const max = this._filteredCommands.length - 1;
    this._selectedIndex = Math.max(0, Math.min(max, this._selectedIndex + delta));
    this._updateSelection();
  }

  /**
   * Update visual selection state
   */
  private _updateSelection(): void {
    this._commandItems.forEach((item, index) => {
      if (index === this._selectedIndex) {
        item.bg = "#89b4fa"; // Blue highlight
        item.fg = "#1e1e2e"; // Dark text
      } else {
        item.bg = undefined;
        item.fg = "#cdd6f4"; // Light text
      }
    });
    this._renderer.requestRender?.();
  }

  /**
   * Render the command list
   */
  private _renderCommands(): void {
    // Clear existing
    this._commandItems.forEach(item => {
      this._commandsContainer.remove(item.id);
    });
    this._commandItems = [];

    // Add filtered commands
    this._filteredCommands.forEach((cmd, index) => {
      const displayText = cmd.shortcut 
        ? `${cmd.name} ${cmd.shortcut}`
        : cmd.name;
      
      // Catppuccin-inspired colors
      const isSelected = index === this._selectedIndex;
      const item = new TextRenderable(this._renderer, {
        content: displayText,
        width: "100%",
        height: 1,
        fg: isSelected ? "#1e1e2e" : "#cdd6f4", // Dark text when selected, light otherwise
        bg: isSelected ? "#89b4fa" : undefined, // Blue highlight when selected
        paddingX: 1,
      });

      // Click to execute
      item.onMouseUp = () => {
        this._selectedIndex = index;
        this._executeSelected();
      };

      this._commandItems.push(item);
      this._commandsContainer.add(item);
    });

    this._renderer.requestRender?.();
  }

  /**
   * Execute the currently selected command
   */
  private _executeSelected(): void {
    const cmd = this._filteredCommands[this._selectedIndex];
    if (cmd) {
      cmd.handler();
      this.close();
    }
  }

  /**
   * Show the modal
   */
  show(): void {
    this._visible = true;
    this._overlay.visible = true;
    this._searchInput.value = "";
    this._filteredCommands = this._registry.getAll();
    this._selectedIndex = 0;
    this._renderCommands();
    this._searchInput.focus();
    openModal();
    this._renderer.requestRender?.();
  }

  /**
   * Hide the modal
   */
  close(): void {
    this._visible = false;
    this._overlay.visible = false;
    closeModal();
    this._onClose();
    this._renderer.requestRender?.();
  }

  /**
   * Toggle visibility
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

  /**
   * Get the overlay renderable to add to parent
   */
  get renderable(): BoxRenderable {
    return this._overlay;
  }
}
