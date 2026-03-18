import { BoxRenderable, CliRenderer, ScrollBoxRenderable, type Renderable, TreeSitterClient } from "@opentui/core";
import { Banner } from "./Banner.js";
import { WelcomeMessage } from "./WelcomeMessage.js";
import { ChatHistory } from "./ChatHistory.js";
import { InputArea } from "./InputArea.js";
import { SearchSuggestionsOverlay } from "../SearchSuggestionsOverlay.js";
import { subscribeToThemeChanges } from "../../../engine/theme.js";

export interface ContentAreaOptions {
  centeredWidth?: number | "100%";
  provider?: string;
  model?: string;
  treeSitterClient?: TreeSitterClient;
  isGenerating?: () => boolean;
  onExit?: () => void;
  onSubmit?: (value: string) => Promise<void>;
  onScroll?: () => void;
}

/**
 * ContentArea - Main content area between left and right sidebars
 * Contains banner, welcome message, chat history, input, and model display
 */
export class ContentArea {
  public readonly container: BoxRenderable;
  public readonly scrollBox: ScrollBoxRenderable;
  public readonly banner: Banner;
  public readonly welcomeMessage: WelcomeMessage;
  public readonly chatHistory: ChatHistory;
  public readonly inputArea: InputArea;
  private _centeredWidth: number | "100%";
  private _centered: boolean;

  constructor(
    renderer: CliRenderer,
    searchSuggestions: SearchSuggestionsOverlay,
    options: ContentAreaOptions = {},
  ) {
    const centeredWidth = options.centeredWidth ?? "100%";
    const centered = centeredWidth !== "100%";
    this._centeredWidth = centeredWidth;
    this._centered = centered;

    // Content container for the column layout
    this.container = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      padding: 1,
      gap: 1,
      alignItems: centered ? "center" : "stretch",
    });

    // Create banner
    this.banner = new Banner(renderer);

    // Create welcome message
    this.welcomeMessage = new WelcomeMessage(
      renderer,
      options.treeSitterClient!,
    );

    // Create chat history with scroll
    this.chatHistory = new ChatHistory(renderer, {
      centeredWidth,
      onScroll: options.onScroll,
    });

    // Add banner and welcome to chat history
    this.chatHistory.add(this.banner.container);
    this.chatHistory.add(this.welcomeMessage.renderable);

    // Create input area
    this.inputArea = new InputArea(renderer, searchSuggestions, {
      centeredWidth,
      provider: options.provider,
      model: options.model,
      isGenerating: options.isGenerating,
      onExit: options.onExit,
      onSubmit: options.onSubmit,
    });

    // Add to content container in order: chat history -> input -> model display
    this.container.add(this.chatHistory.scrollBox);
    this.container.add(this.inputArea.container);
    this.container.add(this.inputArea.modelDisplayContainer);

    // Expose scrollBox directly for external access
    this.scrollBox = this.chatHistory.scrollBox;

    // Subscribe theme changes
    this.subscribeToTheme();
  }

  /**
   * Subscribe to theme changes for all color properties
   */
  private subscribeToTheme(): void {
    subscribeToThemeChanges([
      { renderable: this.banner.figletBanner, prop: "color", colorKey: "dimText" },
      { renderable: this.banner.titleText, prop: "fg", colorKey: "dimText" },
      { renderable: this.inputArea.container, prop: "backgroundColor", colorKey: "surfaceAlt" },
      { renderable: this.inputArea.modelDisplay, prop: "fg", colorKey: "accent" },
      { renderable: this.chatHistory.container, prop: "backgroundColor", colorKey: "background" },
    ]);
  }

  /**
   * Update layout for centered mode
   */
  setCentered(centered: boolean, width: number | "100%"): void {
    this._centered = centered;
    this._centeredWidth = width;
    this.container.alignItems = centered ? "center" : "stretch";
    this.chatHistory.setMaxWidth(width);
    this.inputArea.setMaxWidth(width);
  }

  /**
   * Update model display
   */
  setModelDisplay(provider: string, model: string): void {
    this.inputArea.setModelDisplay(provider, model);
  }

  /**
   * Focus the input
   */
  focusInput(): void {
    this.inputArea.focus();
  }

  /**
   * Add a renderable to chat history
   */
  addToHistory(renderable: Renderable): void {
    this.chatHistory.add(renderable);
  }
}
