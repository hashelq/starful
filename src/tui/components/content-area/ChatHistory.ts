import { BoxRenderable, CliRenderer, ScrollBoxRenderable, type Renderable } from "@opentui/core";

export interface ChatHistoryOptions {
  centeredWidth?: number | "100%";
  onScroll?: () => void;
}

/**
 * ChatHistory - Contains the scrollable chat history
 * Holds banner, welcome message, and all chat messages
 */
export class ChatHistory {
  public readonly container: BoxRenderable;
  public readonly scrollBox: ScrollBoxRenderable;

  constructor(
    renderer: CliRenderer,
    options: ChatHistoryOptions = {},
  ) {
    const centeredWidth = options.centeredWidth ?? "100%";

    // History container - holds all chat messages in a column layout
    this.container = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      paddingX: 2,
      gap: 1,
    });

    // ScrollBox wraps history container - enables vertical scrolling for long chats
    this.scrollBox = new ScrollBoxRenderable(renderer, {
      maxWidth: centeredWidth,
      flexGrow: 1,
      scrollY: true,
      stickyScroll: true,
      stickyStart: "bottom",
      viewportCulling: true, // Only render visible items for performance
    });

    this.scrollBox.add(this.container);

    // Track scroll changes via onMouseScroll
    if (options.onScroll) {
      this.scrollBox.onMouseScroll = options.onScroll;
    }
  }

  /**
   * Add a renderable to the history container
   */
  add(renderable: Renderable): void {
    this.container.add(renderable);
  }

  /**
   * Update maxWidth (for centered mode)
   */
  setMaxWidth(width: number | "100%"): void {
    this.scrollBox.maxWidth = width;
  }
}
