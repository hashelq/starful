/**
 * Tool calling types and interfaces
 */

/**
 * Structured tool output
 */
export interface ToolOutput {
  /** Human-readable display message for UI */
  message: string;
  /** Machine-readable content for LLM (file content, search results, etc.) */
  content: string;
}

/**
 * JSON Schema for tool parameters (OpenAI-compatible format)
 */
export interface ToolParameters {
  type: "object";
  properties?: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
  }>;
  required?: string[];
}

/**
 * Tool definition (OpenAI-compatible format)
 */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: ToolParameters;
  };
}

/**
 * Tool call made by the LLM
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string | Record<string, unknown>; // JSON string or object
  };
}

/**
 * Result of tool execution
 */
export interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
  /** Structured output for UI */
  structuredOutput?: ToolOutput;
}

/**
 * Tool handler function signature (returns structured output)
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolOutput>;

/**
 * Legacy tool handler (returns string) - kept for backwards compatibility
 */
export type LegacyToolHandler = (args: Record<string, unknown>) => Promise<string>;

/**
 * Registered tool with metadata and handler
 */
export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
