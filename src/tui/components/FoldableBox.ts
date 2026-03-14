import {
  BoxRenderable,
  TextRenderable,
  createTextAttributes,
} from "@opentui/core";
import type { RenderContext, Renderable, CliRenderer } from "@opentui/core";
import { COLORS } from "../colors.js";

export interface FoldableBoxOptions {
  /** Initial folded state */
  folded?: boolean;
  /** Title/header shown when folded */
  foldTitle?: string;
  /** Color for the fold indicator */
  foldColor?: string;
  /** How to show collapse button: "section" (default), "button", or false to hide */
  collapseButton?: "section" | "button" | false;
  /** Button text when collapseButton is "button" */
  collapseButtonText?: string;
  /** Whether the box is focusable (clickable) */
  focusable?: boolean;
  /** If true, can only expand (cannot fold back) */
  expandOnly?: boolean;
}

/**
 * FoldableBox - A collapsible box component.
 * Click to toggle between folded and unfolded states.
 */
export class FoldableBox extends BoxRenderable {
  private _folded: boolean;
  private _foldTitle: string;
  private _foldColor: string;
  private _collapseButton: "section" | "button" | false;
  private _collapseButtonText: string;
  private _expandOnly: boolean;
  private _header: TextRenderable | null = null;
  private _collapseButtonEl: TextRenderable | null = null;
  private _content: Renderable | null = null;
  private _placeholder: Renderable | null = null;
  private _showPlaceholder: boolean = false;
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
    this._foldColor = options.foldColor ?? COLORS.accent;
    this._collapseButton = options.collapseButton ?? "section";
    this._collapseButtonText = options.collapseButtonText ?? "▲ Collapse";
    this._expandOnly = options.expandOnly ?? false;

    // Create header/button based on collapseButton option
    this._createCollapseControl(ctx);

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

  private _createCollapseControl(ctx: RenderContext): void {
    if (this._collapseButton === "section") {
      // Create header with fold indicator
      this._header = new TextRenderable(ctx, {
        content: this._getHeaderContent(),
        fg: this._foldColor,
        attributes: createTextAttributes({ bold: true }),
      });
      super.add(this._header);
    } else if (this._collapseButton === "button") {
      // Create gray button at bottom
      this._collapseButtonEl = new TextRenderable(ctx, {
        content: this._getButtonText(),
        fg: COLORS.textMuted,
        bg: COLORS.buttonBg,
      });
      super.add(this._collapseButtonEl);
    }
    // if false, no collapse control is created
  }

  private _getHeaderContent(): string {
    // When expandOnly, show static indicator (no toggle)
    if (this._expandOnly) {
      return `▶ ${this._foldTitle}`;
    }
    const indicator = this._folded ? "▶" : "▼";
    return `${indicator} ${this._foldTitle}`;
  }

  private _getButtonText(): string {
    // When expandOnly, always show expand text
    if (this._expandOnly) {
      return "▼ Expand";
    }
    return this._folded ? "▼ Expand" : this._collapseButtonText;
  }

  /**
   * Toggle between folded and unfolded states
   */
  toggle(): void {
    // If expandOnly is set, can only expand (not fold back)
    if (this._expandOnly && !this._folded) {
      return;
    }
    
    this._folded = !this._folded;
    
    this._updateVisibility();
    
    // Request re-render
    (this as any)._ctx.requestRender?.();
  }

  private _updateVisibility(): void {
    // Update collapse control visibility
    if (this._header) {
      this._header.visible = !this._showPlaceholder && this._collapseButton === "section";
      if (this._header.visible) {
        this._header.content = this._getHeaderContent();
      }
    }
    if (this._collapseButtonEl) {
      this._collapseButtonEl.visible = this._collapseButton === "button";
      if (this._collapseButtonEl.visible) {
        this._collapseButtonEl.content = this._getButtonText();
      }
    }
    
    if (this._folded) {
      // Show placeholder when folded (if set), otherwise show header
      if (this._placeholder && this._showPlaceholder) {
        this._placeholder.visible = true;
        if (this._content) this._content.visible = false;
      } else if (this._collapseButton === "section" && this._header) {
        this._header.visible = true;
        this._header.content = this._getHeaderContent();
        if (this._content) this._content.visible = false;
      } else if (this._collapseButton === "button") {
        // Button always visible, content hidden when folded
        if (this._content) this._content.visible = false;
      }
    } else {
      // Show main content when unfolded
      if (this._header) this._header.visible = false;
      if (this._collapseButtonEl) this._collapseButtonEl.visible = this._collapseButton === "button";
      if (this._placeholder) this._placeholder.visible = false;
      if (this._content) this._content.visible = true;
    }
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
    content.visible = this._folded ? false : true;
    
    super.add(content);
    this._updateVisibility();
  }

  /**
   * Set placeholder shown when folded (replaces the header/label)
   * When placeholder is set, header and triangle are hidden
   */
  setPlaceholder(placeholder: Renderable): void {
    // Remove old placeholder if exists
    if (this._placeholder) {
      super.remove(this._placeholder.id);
    }
    
    this._placeholder = placeholder;
    placeholder.visible = this._folded;
    this._showPlaceholder = true;
    
    super.add(placeholder);
    this._updateVisibility();
  }

  /**
   * Remove placeholder and restore header/label
   */
  removePlaceholder(): void {
    if (this._placeholder) {
      super.remove(this._placeholder.id);
      this._placeholder = null;
      this._showPlaceholder = false;
      this._updateVisibility();
    }
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
   * Set the fold title (only works if no placeholder is set)
   */
  set foldTitle(title: string) {
    this._foldTitle = title;
    if (!this._showPlaceholder && this._header) {
      this._header.content = this._getHeaderContent();
    }
  }
}
