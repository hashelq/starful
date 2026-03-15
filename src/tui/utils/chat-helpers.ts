import { MarkdownRenderable, TreeSitterClient, CliRenderer, TextRenderable, BoxRenderable } from "@opentui/core";
import { getDefaultSyntaxStyle, COLORS } from "../../engine/colors.js";
import { subscribeToThemeChanges } from "../../engine/theme.js";

/**
 * Create a streaming MarkdownRenderable for chat content
 */
export function createMarkdownRenderable(
  renderer: CliRenderer,
  treeSitterClient: TreeSitterClient,
  streaming: boolean = true,
): MarkdownRenderable {
  const md = new MarkdownRenderable(renderer, {
    width: "100%",
    height: "auto",
    content: "",
    syntaxStyle: getDefaultSyntaxStyle(),
    streaming,
    conceal: true,
    treeSitterClient,
  });
  return md;
}

/**
 * Create a thinking element for displaying LLM reasoning
 */
export function createThinkingElement(
  renderer: CliRenderer,
  historyContainer: BoxRenderable,
): TextRenderable {
  const thinkingElement = new TextRenderable(renderer, {
    width: "100%",
    height: "auto",
    content: "",
    fg: COLORS.dimText,
  });
  historyContainer.add(thinkingElement);
  
  // Subscribe to theme changes for dimText color updates
  subscribeToThemeChanges([
    { renderable: thinkingElement, prop: 'fg', colorKey: 'dimText' },
  ]);
  
  return thinkingElement;
}

/**
 * Create an error message element
 */
export function createErrorMessage(
  renderer: CliRenderer,
  message: string,
): TextRenderable {
  const errorText = new TextRenderable(renderer, {
    content: message,
    fg: COLORS.error,
  });
  
  // Subscribe to theme changes for error color updates
  subscribeToThemeChanges([
    { renderable: errorText, prop: 'fg', colorKey: 'error' },
  ]);
  
  return errorText;
}

/**
 * Find the last code block delimiter (```) in content
 * Returns the index or -1 if not found
 */
export function findCodeBlockDelimiter(content: string): number {
  return content.lastIndexOf("```");
}

/**
 * Check if content is inside a code block (odd number of ```)
 */
export function isInsideCodeBlock(content: string): boolean {
  const matches = (content.match(/```/g) || []).length;
  return matches % 2 === 1;
}

/**
 * Extract language from code block opening (e.g., ```typescript -> typescript)
 */
export function extractCodeLanguage(codeContent: string): string {
  const match = codeContent.match(/^(\w+)\n/);
  return match?.[1] ?? "";
}

/**
 * Format LLM response based on type
 */
export function getFormattedResponse(
  data: string,
  type: "content" | "thinking",
): string {
  switch (type) {
    case "content":
      return data;
    case "thinking":
      return data;
  }
}

/**
 * Merge multiple LLM response strings
 */
export function mergeLLMResponse(...data: string[]): string {
  return data.join("\n");
}
