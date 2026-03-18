import { CliRenderer, MarkdownRenderable, TreeSitterClient } from "@opentui/core";
import { getDefaultSyntaxStyle } from "../../../engine/colors.js";

const DEFAULT_WELCOME_MESSAGE = `## Welcome to Starful

Your AI-powered terminal IDE. Here's what you can do:

### Quick Commands
- \`/theme\` - Switch color themes
- \`/model\` - Change AI model  
- \`/clear\` - Clear chat history

### AI Capabilities
- **File operations**: Read, write, edit files
- **Shell commands**: Run terminal commands
- **Code assistance**: Ask coding questions

> **Tip**: Press \`Ctrl+P\` to open the command palette

Start by asking me something!`;

/**
 * WelcomeMessage - Displays the welcome markdown message
 * Displayed after the banner, scrolls with messages
 */
export class WelcomeMessage {
  public readonly renderable: MarkdownRenderable;

  constructor(
    renderer: CliRenderer,
    treeSitterClient: TreeSitterClient,
    content?: string,
  ) {
    this.renderable = new MarkdownRenderable(renderer, {
      width: "100%",
      height: "auto",
      content: content ?? DEFAULT_WELCOME_MESSAGE,
      syntaxStyle: getDefaultSyntaxStyle(),
      conceal: true,
      treeSitterClient,
    });
  }
}
