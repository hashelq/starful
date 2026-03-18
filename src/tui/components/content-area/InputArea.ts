import { BoxRenderable, CliRenderer, TextRenderable, createTextAttributes } from "@opentui/core";
import { PromptInput } from "../PromptInput.js";
import { SearchSuggestionsOverlay } from "../SearchSuggestionsOverlay.js";
import { COLORS } from "../../../engine/colors.js";

export interface InputAreaOptions {
  centeredWidth?: number | "100%";
  provider?: string;
  model?: string;
  isGenerating?: () => boolean;
  onExit?: () => void;
  onSubmit?: (value: string) => Promise<void>;
}

/**
 * InputArea - Contains the input field and model display
 * Displayed below the chat history
 */
export class InputArea {
  public readonly container: BoxRenderable;
  public readonly modelDisplayContainer: BoxRenderable;
  public readonly modelDisplay: TextRenderable;
  public readonly promptInput: PromptInput;
  private _centeredWidth: number | "100%";

  constructor(
    renderer: CliRenderer,
    searchSuggestions: SearchSuggestionsOverlay,
    options: InputAreaOptions,
  ) {
    const centeredWidth = options.centeredWidth ?? "100%";
    this._centeredWidth = centeredWidth;

    // Input container - box with border wrapping the text input
    this.container = new BoxRenderable(renderer, {
      width: "100%",
      maxWidth: centeredWidth,
      paddingX: 2,
      paddingY: 1,
      height: 3,
      backgroundColor: COLORS.surfaceAlt,
      marginBottom: 0,
      overflow: "visible",
    });

    // Create PromptInput (all options are required)
    this.promptInput = new PromptInput(renderer, searchSuggestions, {
      isGenerating: options.isGenerating ?? (() => false),
      onExit: options.onExit ?? (() => {}),
      onSubmit: options.onSubmit ?? (async () => {}),
    });

    // Add input to container
    this.container.add(this.promptInput.input);

    // Model display container
    this.modelDisplayContainer = new BoxRenderable(renderer, {
      width: "100%",
      maxWidth: centeredWidth,
      paddingX: 2,
      paddingY: 0,
      height: 1,
    });

    // Model display - shows current provider/model
    this.modelDisplay = new TextRenderable(renderer, {
      content: `${options.provider ?? "ollama"}/${options.model ?? "llama3"}`,
      fg: COLORS.accent,
      attributes: createTextAttributes({ bold: true }),
    });

    this.modelDisplayContainer.add(this.modelDisplay);
  }

  /**
   * Focus the input
   */
  focus(): void {
    this.promptInput.focus();
  }

  /**
   * Update the model display text
   */
  setModelDisplay(provider: string, model: string): void {
    this.modelDisplay.content = `${provider}/${model}`;
  }

  /**
   * Update maxWidth (for centered mode)
   */
  setMaxWidth(width: number | "100%"): void {
    this._centeredWidth = width;
    this.container.maxWidth = width;
    this.modelDisplayContainer.maxWidth = width;
  }
}
