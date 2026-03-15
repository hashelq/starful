import { BoxRenderable, CliRenderer, ScrollBoxRenderable } from "@opentui/core";
import { COLORS } from "../../engine/colors.js";
import { subscribeToThemeChanges } from "../../engine/theme.js";
import { getSidebarRegistry, createCategoryId, createButtonId, type SidebarCategory } from "../../engine/sidebar/index.js";
import { SidebarCategory as SidebarCategoryClass } from "../../engine/sidebar/category.js";

/**
 * SideBar - Main sidebar component using the registry system
 * 
 * Supports plugins by registering categories through the registry
 */
export class SideBar {
  private _pane: BoxRenderable;
  private _scrollBox: ScrollBoxRenderable;
  private _sectionsContainer: BoxRenderable;
  private _renderer: CliRenderer;
  private _categories: SidebarCategory[] = [];
  private _width: number;
  private _threshold: number;
  private _activeButton: string = "chats";

  constructor(
    renderer: CliRenderer,
    options?: {
      width?: number;
      threshold?: number;
      onNavigate?: (section: string) => void;
    }
  ) {
    this._renderer = renderer;
    this._width = options?.width ?? 30;
    this._threshold = options?.threshold ?? 120;

    // Create the left pane container (auto height)
    this._pane = new BoxRenderable(renderer, {
      width: this._width,
      height: "auto",
      backgroundColor: COLORS.surfaceAlt,
      flexDirection: "column",
      gap: 0,
    });

    // Scroll box for categories
    this._scrollBox = new ScrollBoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      scrollY: true,
    });

    // Container for all categories
    this._sectionsContainer = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0
    });

    this._scrollBox.add(this._sectionsContainer);
    this._pane.add(this._scrollBox);

    // Build categories from registry
    this._buildCategories(options?.onNavigate);

    // Subscribe to theme changes
    subscribeToThemeChanges([
      { renderable: this._pane, prop: 'backgroundColor', colorKey: 'surfaceAlt' },
    ]);

    // Set initial visibility
    this._updateVisibility();

    // Listen for resize
    renderer.on("resize", () => {
      this._updateVisibility();
    });
  }

  private _buildCategories(onNavigate?: (section: string) => void): void {
    const registry = getSidebarRegistry();
    const categories = registry.getCategories();

    for (const catDef of categories) {
      // Wrap the button onClick to also handle navigation
      const wrappedButtons = catDef.buttons.map(btn => ({
        id: btn.id,
        label: btn.label,
        onClick: () => {
          this._activeButton = btn.id as unknown as string;
          this._updateSelection();
          onNavigate?.(btn.id as unknown as string);
        },
      }));

      const category = new SidebarCategoryClass(this._renderer, {
        ...catDef,
        buttons: wrappedButtons,
      });

      this._categories.push(category);
      this._sectionsContainer.add(category.renderable);
    }
  }

  private _updateSelection(): void {
    for (const cat of this._categories) {
      for (const button of cat.buttons) {
        button.setSelected(false);
      }
    }

    for (const cat of this._categories) {
      for (const button of cat.buttons) {
        const btnId = (button as any)._button?.id || "";
        if (btnId === this._activeButton) {
          button.setSelected(true);
        }
      }
    }
    this._renderer.requestRender?.();
  }

  private _updateVisibility(): void {
    const terminalWidth = (this._renderer as any).terminalWidth || 80;
    this._pane.visible = terminalWidth >= this._threshold;
    this._renderer.requestRender?.();
  }

  /**
   * Add a category directly (alternative to registry)
   */
  addCategory(category: SidebarCategory): void {
    this._categories.push(category);
    this._sectionsContainer.add(category.renderable);
  }

  /**
   * Get the underlying renderable
   */
  get renderable(): BoxRenderable {
    return this._pane;
  }

  /**
   * Show/hide
   */
  show(): void {
    this._pane.visible = true;
    this._renderer.requestRender?.();
  }

  hide(): void {
    this._pane.visible = false;
    this._renderer.requestRender?.();
  }
}

/**
 * Helper to register default categories
 * Call this at app startup to set up default sidebar
 */
export function registerDefaultSidebarCategories(): void {
  const registry = getSidebarRegistry();

  // This Workspace
  registry.registerCategory({
    id: createCategoryId("workspace"),
    title: "This Workspace",
    folded: false,
    buttons: [
      { id: createButtonId("chats"), label: "Chats", onClick: () => {} },
      { id: createButtonId("visualize"), label: "Visualize", onClick: () => {} },
      { id: createButtonId("projectconfig"), label: "Project Config", onClick: () => {} },
    ],
  });

  // AI & Chat
  registry.registerCategory({
    id: createCategoryId("ai-chat"),
    title: "AI & Chat",
    buttons: [
      { id: createButtonId("chat"), label: "Chat", onClick: () => {} },
      { id: createButtonId("agents"), label: "Agents", onClick: () => {} },
      { id: createButtonId("models"), label: "Models", onClick: () => {} },
      { id: createButtonId("prompts"), label: "Prompts", onClick: () => {} },
    ],
  });

  // Workflows
  registry.registerCategory({
    id: createCategoryId("workflows"),
    title: "Workflows",
    buttons: [
      { id: createButtonId("pipeline"), label: "Pipeline", onClick: () => {} },
      { id: createButtonId("tasks"), label: "Tasks", onClick: () => {} },
      { id: createButtonId("templates"), label: "Templates", onClick: () => {} },
      { id: createButtonId("runhistory"), label: "Run History", onClick: () => {} },
    ],
  });

  // Analytics
  registry.registerCategory({
    id: createCategoryId("analytics"),
    title: "Analytics",
    buttons: [
      { id: createButtonId("dashboard"), label: "Dashboard", onClick: () => {} },
      { id: createButtonId("metrics"), label: "Metrics", onClick: () => {} },
      { id: createButtonId("logs"), label: "Logs", onClick: () => {} },
      { id: createButtonId("alerts"), label: "Alerts", onClick: () => {} },
    ],
  });

  // Settings
  registry.registerCategory({
    id: createCategoryId("settings"),
    title: "Settings",
    buttons: [
      { id: createButtonId("preferences"), label: "Preferences", onClick: () => {} },
      { id: createButtonId("themes"), label: "Themes", onClick: () => {} },
      { id: createButtonId("extensions"), label: "Extensions", onClick: () => {} },
      { id: createButtonId("help"), label: "Help", onClick: () => {} },
      { id: createButtonId("about"), label: "About", onClick: () => {} },
    ],
  });
}
