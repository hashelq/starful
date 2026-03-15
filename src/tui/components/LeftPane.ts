import { BoxRenderable, CliRenderer, TextRenderable } from "@opentui/core";
import { COLORS } from "../../engine/colors.js";
import { subscribeToThemeChanges } from "../../engine/theme.js";

/**
 * LeftPane - A sidebar pane component that can contain navigation, tools, etc.
 * Automatically hides when terminal width is less than the threshold.
 */
export class LeftPane {
  private _pane: BoxRenderable;
  private _renderer: CliRenderer;
  private _width: number;
  private _threshold: number;

  constructor(
    renderer: CliRenderer,
    options?: {
      /** Width in characters (default: 3) */
      width?: number;
      /** Terminal width threshold to show/hide (default: 70) */
      threshold?: number;
    }
  ) {
    this._renderer = renderer;
    this._width = options?.width ?? 3;
    this._threshold = options?.threshold ?? 70;

    // Create the left pane container
    this._pane = new BoxRenderable(renderer, {
      width: this._width,
      height: "100%",
      backgroundColor: COLORS.surfaceAlt,
      flexDirection: "column",
      alignItems: "center",
      paddingY: 1,
      gap: 1,
    });

    // Subscribe to theme changes
    subscribeToThemeChanges([
      { renderable: this._pane, prop: 'backgroundColor', colorKey: 'surfaceAlt' },
    ]);

    // Add STARFUL text vertically
    const starfulText = new TextRenderable(renderer, {
      content: "STARFUL",
      fg: COLORS.primary,
    });
    this._pane.add(starfulText);

    // Subscribe text color to theme changes
    subscribeToThemeChanges([
      { renderable: starfulText, prop: 'fg', colorKey: 'primary' },
    ]);

    // Set initial visibility based on terminal width
    this._updateVisibility();

    // Listen for resize events
    renderer.on("resize", (_width: number, _height: number) => {
      this._updateVisibility();
    });
  }

  /**
   * Update visibility based on terminal width
   */
  private _updateVisibility(): void {
    const terminalWidth = (this._renderer as any).terminalWidth || 80;
    this._pane.visible = terminalWidth >= this._threshold;
    this._renderer.requestRender?.();
  }

  /**
   * Add a child renderable to the pane
   */
  add(child: BoxRenderable | TextRenderable): void {
    this._pane.add(child);
  }

  /**
   * Get the underlying renderable
   */
  get renderable(): BoxRenderable {
    return this._pane;
  }

  /**
   * Show the pane (override visibility)
   */
  show(): void {
    this._pane.visible = true;
    this._renderer.requestRender?.();
  }

  /**
   * Hide the pane (override visibility)
   */
  hide(): void {
    this._pane.visible = false;
    this._renderer.requestRender?.();
  }
}
