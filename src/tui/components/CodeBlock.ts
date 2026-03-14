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
import { COLORS, getDefaultSyntaxStyle } from "../colors.js";

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

  /**
   * Create a new CodeBlock component
   */
  constructor(
    renderer: CliRenderer,
    treeSitterClient: TreeSitterClient,
    inputFocus: () => void,
  ) {
    this._renderer = renderer;
    this._treeSitterClient = treeSitterClient;
    this._inputFocus = inputFocus;

    // Create the outer gray box
    this._codeBox = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      backgroundColor: COLORS.codeBackground,
      paddingX: 1,
    });

    // Create top bar with language label and copy button
    const topBar = this._createTopBar();

    // Create markdown renderables for expanded and folded views
    this._expandedMarkdown = this._createMarkdown("auto");
    this._foldedMarkdown = this._createMarkdown(8);

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
      attributes: createTextAttributes({bold: true}),
      flexDirection: "column",
      fg: COLORS.foreground
    });

    vC.add(foldedScroll);
    vC.add(label);

    this._fold.setPlaceholder(vC);

    // Set expanded content
    this._fold.setContent(this._expandedMarkdown);

    // Assemble the component
    this._codeBox.add(topBar);
    this._codeBox.add(this._fold);
  }

  /**
   * Create the top bar with language label and copy button
   */
  private _createTopBar(): BoxRenderable {
    const topBar = new BoxRenderable(this._renderer, {
      width: "100%",
      flexDirection: "row",
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

    topBar.add(this._languageLabel);
    topBar.add(rightBar);

    return topBar;
  }

  /**
   * Create a markdown renderable with consistent options
   */
  private _createMarkdown(height: number | "auto"): MarkdownRenderable {
    return new MarkdownRenderable(this._renderer, {
      width: "100%",
      height: height,
      content: "",
      syntaxStyle: getDefaultSyntaxStyle(),
      streaming: false,
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
