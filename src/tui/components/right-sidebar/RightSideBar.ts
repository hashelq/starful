import { BoxRenderable, CliRenderer, ScrollBoxRenderable, TextRenderable, createTextAttributes } from "@opentui/core";
import { COLORS } from "../../../engine/colors.js";
import { subscribeToThemeChanges } from "../../../engine/theme.js";

/**
 * Message entry in history
 */
interface MessageEntry {
  role: "user" | "assistant";
  content: string;
}

/**
 * RightSideBar - Right sidebar component
 * 
 * Shows additional information like file explorer, git status, etc.
 */
export class RightSideBar {
  private _pane: BoxRenderable;
  private _scrollBox: ScrollBoxRenderable;
  private _contentContainer: BoxRenderable;
  private _renderer: CliRenderer;
  private _width: number;
  private _threshold: number;
  private _messageItems: TextRenderable[] = [];

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

    // Container for history items
    this._contentContainer = new BoxRenderable(renderer, {
      width: "100%",
      flexDirection: "column",
      gap: 0,
    });

    // Add a title
    const title = new TextRenderable(renderer, {
      content: "History",
      fg: COLORS.textMuted,
      padding: 1,
      attributes: createTextAttributes({ bold: true }),
    });
    this._pane.add(title);

    this._scrollBox.add(this._contentContainer);
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

  /**
   * Update the chat history display
   */
  updateHistory(messages: MessageEntry[]): void {
    // Remove existing message items
    for (const item of this._messageItems) {
      this._contentContainer.remove(item.id);
    }
    this._messageItems = [];

    // Add messages in reverse order (newest at top)
    const reversedMessages = [...messages].reverse();

    for (const msg of reversedMessages) {
      const isUser = msg.role === "user";
      const prefix = isUser ? "> " : "";
      const content = prefix + msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : "");
      
      const msgText = new TextRenderable(this._renderer, {
        content: content,
        fg: isUser ? COLORS.userText : COLORS.assistantText,
        padding: 1,
        width: "100%",
      });

      subscribeToThemeChanges([
        { renderable: msgText, prop: "fg", colorKey: isUser ? "userText" : "assistantText" },
      ]);

      this._contentContainer.add(msgText);
      this._messageItems.push(msgText);
    }

    this._renderer.requestRender?.();
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
