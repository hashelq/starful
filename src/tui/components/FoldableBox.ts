import {
  BoxRenderable,
  TextRenderable,
  createTextAttributes,
} from "@opentui/core";
import type { RenderContext, Renderable, CliRenderer } from "@opentui/core";

export interface FoldableBoxOptions {
  /** Initial folded state */
  folded?: boolean;
  /** Title/header shown when folded */
  foldTitle?: string;
  /** Color for the fold indicator */
  foldColor?: string;
  /** Whether the box is focusable (clickable) */
  focusable?: boolean;
}

/**
 * FoldableBox - A collapsible box component.
 * Click to toggle between folded and unfolded states.
 */
export class FoldableBox extends BoxRenderable {
  private _folded: boolean;
  private _foldTitle: string;
  private _foldColor: string;
  private _header: TextRenderable;
  private _content: Renderable | null = null;
  private _mouseDownPos: { x: number; y: number } | null = null;
  private _hasSelection: boolean = false;

  constructor(ctx: RenderContext, options: FoldableBoxOptions) {
    super(ctx, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      ...options,
    });

    this._folded = options.folded ?? true;
    this._foldTitle = options.foldTitle ?? "Click to expand";
    this._foldColor = options.foldColor ?? "#8be9fd";

    // Create header with fold indicator
    this._header = new TextRenderable(ctx, {
      content: this._getHeaderContent(),
      fg: this._foldColor,
      attributes: createTextAttributes({ bold: true }),
    });

    super.add(this._header);

    // Track mouse down position to detect selection vs click
    this.onMouseDown = (event: any) => {
      this._mouseDownPos = { x: event.x, y: event.y };
      this._hasSelection = false;
    };

    // Toggle only if no significant movement (not a drag/selection)
    this.onMouseUp = (event: any) => {
      if (this._mouseDownPos) {
        const dx = Math.abs(event.x - this._mouseDownPos.x);
        const dy = Math.abs(event.y - this._mouseDownPos.y);
        
        // If moved less than 5 pixels, consider it a click
        if (!dx && !dy) {
          this.toggle();
        }
      }
      this._mouseDownPos = null;
      this._hasSelection = false;
    };
  }

  private _getHeaderContent(): string {
    const indicator = this._folded ? "▶" : "▼";
    return `${indicator} ${this._foldTitle}`;
  }

  /**
   * Toggle between folded and unfolded states
   */
  toggle(): void {
    this._folded = !this._folded;
    this._header.content = this._getHeaderContent();
    
    if (this._folded) {
      // Hide content
      if (this._content) {
        this._content.visible = false;
      }
    } else {
      // Show content
      if (this._content) {
        this._content.visible = true;
      }
    }
    
    // Request re-render
    (this as any)._ctx.requestRender?.();
  }

  /**
   * Set the content to show when unfolded
   */
  setContent(content: Renderable): void {
    // Remove old content if exists
    if (this._content) {
      super.remove(this._content.id);
    }
    
    this._content = content;
    content.visible = !this._folded;
    
    super.add(content);
  }

  /**
   * Get current folded state
   */
  get folded(): boolean {
    return this._folded;
  }

  /**
   * Set folded state programmatically
   */
  set folded(value: boolean) {
    if (this._folded !== value) {
      this.toggle();
    }
  }

  /**
   * Set the fold title
   */
  set foldTitle(title: string) {
    this._foldTitle = title;
    this._header.content = this._getHeaderContent();
  }
}
