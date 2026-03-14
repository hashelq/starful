import { MarkdownRenderable, TreeSitterClient, CliRenderer } from "@opentui/core";
import { defaultSyntaxStyle } from "../constants.js";

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
    syntaxStyle: defaultSyntaxStyle,
    streaming,
    conceal: true,
    treeSitterClient,
  });
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
