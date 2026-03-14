import { MarkdownRenderable, TreeSitterClient, CliRenderer, TextRenderable, BoxRenderable } from "@opentui/core";
import { getDefaultSyntaxStyle, COLORS } from "../constants.js";

/**
 * Create a streaming MarkdownRenderable for chat content
 */
export function createMarkdownRenderable(
  renderer: CliRenderer,
  treeSitterClient: TreeSitterClient,
  streaming: boolean = true,
): MarkdownRenderable {
  return new MarkdownRenderable(renderer, {
    width: "100%",
    height: "auto",
    content: "",
    syntaxStyle: getDefaultSyntaxStyle(),
    streaming,
    conceal: true,
    treeSitterClient,
  });
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
  return thinkingElement;
}

/**
 * Create an error message element
 */
export function createErrorMessage(
  renderer: CliRenderer,
  message: string,
): TextRenderable {
  return new TextRenderable(renderer, {
    content: message,
    fg: COLORS.error,
  });
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
