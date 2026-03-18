import { BoxRenderable, CliRenderer, ASCIIFontRenderable, TextRenderable } from "@opentui/core";
import { COLORS } from "../../../engine/colors.js";

export interface BannerOptions {
  title?: string;
  subtitle?: string;
}

/**
 * Banner - Contains the ASCII art logo and subtitle
 * Displayed at the top of the chat, scrolls with messages
 */
export class Banner {
  public readonly container: BoxRenderable;
  public readonly figletBanner: ASCIIFontRenderable;
  public readonly titleText: TextRenderable;

  constructor(
    renderer: CliRenderer,
    options: BannerOptions = {},
  ) {
    const title = options.title ?? "STARFUL";
    const subtitle = options.subtitle ?? "TIP: you can /revert last changes";

    // Banner container - centers the brand and subtitle
    this.container = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
    });

    // Figlet ASCII art banner
    this.figletBanner = new ASCIIFontRenderable(renderer, {
      text: title,
      font: "block",
      color: COLORS.dimText,
    });

    // Title banner
    this.titleText = new TextRenderable(renderer, {
      content: subtitle,
      fg: COLORS.dimText,
    });

    // Add to banner container (centered)
    this.container.add(this.figletBanner);
    this.container.add(this.titleText);
  }
}
