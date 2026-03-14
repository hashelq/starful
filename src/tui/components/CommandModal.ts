import {
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  ScrollBoxRenderable,
  InputRenderableEvents,
  createTextAttributes,
  CliRenderer,
} from "@opentui/core";
import { COLORS } from "../constants.js";
import type { Command, CommandRegistry } from "../commands.js";

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

    // Create overlay (full screen semi-transparent)
    this._overlay = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      position: "absolute",
      top: 0,
      left: 0,
    });

    // Create modal box (centered)
    this._modalBox = new BoxRenderable(renderer, {
      width: 60,
      height: "auto",
      backgroundColor: COLORS.darkBackground,
      border: true,
      borderStyle: "rounded",
      borderColor: COLORS.assistantText,
      position: "absolute",
      top: "50%",
      left: "50%",
      flexDirection: "column",
      padding: 1,
    });
    this._overlay.add(this._modalBox);

    // Create search input
    this._searchInput = new InputRenderable(renderer, {
      width: "100%",
      placeholder: "Search commands...",
      textColor: COLORS.inputText,
      placeholderColor: COLORS.placeholderText,
      backgroundColor: COLORS.codeBackground,
    });
    this._searchInput.on(InputRenderableEvents.CHANGE, (value) => {
      this._filterCommands(value);
    });
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
    // Handle Enter key - execute selected command
    this._searchInput.onKeyDown = (key) => {
      if (key.name === "enter") {
        this._executeSelected();
        return true;
      }
      if (key.name === "escape") {
        this.close();
        return true;
      }
      if (key.name === "arrowup") {
        this._moveSelection(-1);
        return true;
      }
      if (key.name === "arrowdown") {
        this._moveSelection(1);
        return true;
      }
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
        item.bg = COLORS.copyButtonBg;
        item.fg = COLORS.copyButtonText;
      } else {
        item.bg = undefined;
        item.fg = COLORS.dimText;
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
      
      const item = new TextRenderable(this._renderer, {
        content: displayText,
        width: "100%",
        height: 1,
        fg: index === this._selectedIndex ? COLORS.copyButtonText : COLORS.dimText,
        bg: index === this._selectedIndex ? COLORS.copyButtonBg : undefined,
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
    this._renderer.requestRender?.();
  }

  /**
   * Hide the modal
   */
  close(): void {
    this._visible = false;
    this._overlay.visible = false;
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
