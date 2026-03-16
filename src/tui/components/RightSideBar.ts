import { BoxRenderable, CliRenderer, ScrollBoxRenderable, TextRenderable } from "@opentui/core";
import { COLORS } from "../../engine/colors.js";
import { subscribeToThemeChanges } from "../../engine/theme.js";

/**
 * RightSideBar - Right sidebar component
 * 
 * Shows additional information like file explorer, git status, etc.
 */
export class RightSideBar {
  private _pane: BoxRenderable;
  private _scrollBox: ScrollBoxRenderable;
  private _renderer: CliRenderer;
  private _width: number;
  private _threshold: number;

  constructor(
    renderer: CliRenderer,
    options?: {
      width?: number;
      threshold?: number;
    }
  ) {
    this._renderer = renderer;
    this._width = options?.width ?? 30;
    this._threshold = options?.threshold ?? 100;

    // Create the right pane container
    this._pane = new BoxRenderable(renderer, {
      width: this._width,
      height: "100%",
      backgroundColor: COLORS.surfaceAlt,
      flexDirection: "column",
      gap: 0,
    });

    // Scroll box for content
    this._scrollBox = new ScrollBoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      scrollY: true,
    });

    // Add a title
    const title = new TextRenderable(renderer, {
      content: "Explorer",
      fg: COLORS.textMuted,
    });
    this._pane.add(title);

    this._pane.add(this._scrollBox);

    // Subscribe to theme changes
    subscribeToThemeChanges([
      { renderable: this._pane, prop: 'backgroundColor', colorKey: 'surfaceAlt' },
      { renderable: title, prop: 'fg', colorKey: 'textMuted' },
    ]);

    // Set initial visibility
    this._updateVisibility();

    // Listen for resize
    renderer.on("resize", () => {
      this._updateVisibility();
    });
  }

  private _updateVisibility(): void {
    const terminalWidth = (this._renderer as any).terminalWidth || 80;
    this._pane.visible = terminalWidth >= this._threshold;
    this._renderer.requestRender?.();
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
