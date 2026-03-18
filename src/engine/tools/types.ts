/**
 * Tool calling types and interfaces
 */

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
}

/**
 * Tool handler function signature
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

/**
 * Registered tool with metadata and handler
 */
export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
