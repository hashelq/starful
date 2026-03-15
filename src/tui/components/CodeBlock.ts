import {
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  MarkdownRenderable,
  TreeSitterClient,
  createTextAttributes,
  CliRenderer,
} from "@opentui/core";
import { FoldableBox } from "./FoldableBox.js";
import { COLORS, getDefaultSyntaxStyle, getSyntaxStyle } from "../../engine/colors.js";
import { subscribeToThemeChanges, themeService } from "../../engine/theme.js";

/**
 * CodeBlock - A collapsible code block component with:
 * - Gray background
 * - Language label
 * - Copy button
 * - FoldableBox with folded (4-line preview) and expanded views
 * - Synchronized content between both views
 */
export class CodeBlock {
  private _codeBox: BoxRenderable;
  private _expandedMarkdown: MarkdownRenderable;
  private _foldedMarkdown: MarkdownRenderable;
  private _languageLabel!: TextRenderable;
  private _copyButton!: TextRenderable;
  private _fold: FoldableBox;
  private _renderer: CliRenderer;
  private _treeSitterClient: TreeSitterClient;
  private _inputFocus: () => void;

  constructor(
    renderer: CliRenderer,
    treeSitterClient: TreeSitterClient,
    inputFocus: () => void,
  ) {
    this._renderer = renderer;
    this._treeSitterClient = treeSitterClient;
    this._inputFocus = inputFocus;

    // Create the outer gray box - no border, uses base02 (gray) background
    this._codeBox = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "row",
      backgroundColor: COLORS.inputBg,
      paddingX: 1,
      border: false,
    });

    // Create header bar with language label and copy button  
    const headerBar = this._createHeaderBar();

    // Create markdown renderables for expanded and folded views
    // Both need streaming: true to update during code streaming
    this._expandedMarkdown = this._createMarkdown("auto", true);
    this._foldedMarkdown = this._createMarkdown(8, true);

    // Create FoldableBox with both states
    this._fold = new FoldableBox(renderer, {
      foldTitle: "code",
      expandOnly: true,
    });

    // Create folded scroll view (4-line preview)
    const foldedScroll = new ScrollBoxRenderable(renderer, {
      width: "100%",
      height: 8,
      scrollY: true,
      stickyScroll: true,
    });
    foldedScroll.add(this._foldedMarkdown);

    const vC = new BoxRenderable(renderer, {
      flexDirection: "column",
      gap: 1,
    });

    const label = new TextRenderable(renderer, {
      content: "Scroll or click to expand.",
      attributes: createTextAttributes({ bold: true }),
      flexDirection: "column",
      fg: COLORS.foreground,
    });

    vC.add(foldedScroll);
    vC.add(label);

    this._fold.setPlaceholder(vC);

    // Set expanded content
    this._fold.setContent(this._expandedMarkdown);

    // Assemble the component
    this._codeBox.add(this._fold);
    this._codeBox.add(headerBar);

    // Subscribe all color properties to theme changes for automatic updates  
    subscribeToThemeChanges([
      { renderable: this._codeBox, prop: 'backgroundColor', colorKey: 'inputBg' },
      { renderable: this._languageLabel, prop: 'fg', colorKey: 'languageLabel' },
      { renderable: this._copyButton, prop: 'bg', colorKey: 'copyButtonBg' },
      { renderable: this._copyButton, prop: 'fg', colorKey: 'copyButtonText' },
    ]);

    // Subscribe to syntax style updates when theme changes
    themeService.onThemeChange(() => {
      this._expandedMarkdown.syntaxStyle = getSyntaxStyle();
      this._foldedMarkdown.syntaxStyle = getSyntaxStyle();
      this._renderer.requestRender?.();
    });
  }

  /**
   * Create the header bar with language label and copy button
   */
  private _createHeaderBar(): BoxRenderable {
    const topBar = new BoxRenderable(this._renderer, {
      width: "auto",
      flexDirection: "column",
    });

    // Language label
    this._languageLabel = new TextRenderable(this._renderer, {
      content: "",
      fg: COLORS.languageLabel,
      attributes: createTextAttributes({ bold: true }),
    });

    // Copy button
    this._copyButton = new TextRenderable(this._renderer, {
      content: " COPY ",
      paddingRight: 1,
      bg: COLORS.copyButtonBg,
      fg: COLORS.copyButtonText,
    });

    this._copyButton.onMouseUp = () => {
      this._copyToClipboard();
    };

    // Right-aligned bar for copy button
    const rightBar = new BoxRenderable(this._renderer, {
      alignItems: "flex-end",
      flexGrow: 1,
    });
    rightBar.add(this._copyButton);

    topBar.add(rightBar);
    topBar.add(this._languageLabel);

    return topBar;
  }

  /**
   * Create a markdown renderable with consistent options
   */
  private _createMarkdown(height: number | "auto", streaming: boolean = false): MarkdownRenderable {
    return new MarkdownRenderable(this._renderer, {
      width: "100%",
      height: height,
      content: "",
      syntaxStyle: getDefaultSyntaxStyle(),
      streaming: streaming,
      conceal: true,
      treeSitterClient: this._treeSitterClient,
    });
  }

  /**
   * Copy code content to clipboard
   */
  private _copyToClipboard(): void {
    const content = this._expandedMarkdown.content;
    if (!content) return;

    // Strip markdown code fences  
    let code = content;
    code = code.replace(/^```\w*\n?/, "");
    code = code.replace(/```$/, "");

    this._renderer.copyToClipboardOSC52?.(code);
    this._inputFocus();

    // Show "COPIED!" feedback
    this._copyButton.content = " COPIED! ";
    this._renderer.requestRender?.();
    setTimeout(() => {
      this._copyButton.content = " COPY ";
      this._renderer.requestRender?.();
    }, 1500);
  }

  /**
   * Update the language label
   */
  setLanguage(lang: string): void {
    this._languageLabel.content = `Code: ${lang}`;
  }

  /**
   * Update content in both folded and expanded views
   */
  setContent(content: string): void {
    this._expandedMarkdown.content = content;
    this._foldedMarkdown.content = content;
  }

  /**
   * Finalize construction
   * If content fits within folded height (8 lines), unfold automatically
   */
  finalize(): void {
    const content = this._foldedMarkdown.content || "";
    // Count lines (excluding the code fence line if present)
    const lines = content.split("\n");
    console.log({lines: lines.length});
    
    // If content fits within 8 lines, unfold automatically
    if (lines.length <= 8) {
      this._fold.folded = false;
    }
  }

  /**
   * Get the renderable box to add to parent
   */
  get renderable(): BoxRenderable {
    return this._codeBox;
  }

  /**
   * Get the expanded markdown for streaming updates
   */
  get expandedMarkdown(): MarkdownRenderable {
    return this._expandedMarkdown;
  }

  /**
   * Get the folded markdown for preview updates
   */
  get foldedMarkdown(): MarkdownRenderable {
    return this._foldedMarkdown;
  }

  /**
   * Get language label for external updates
   */
  get languageLabel(): TextRenderable {
    return this._languageLabel;
  }
}
