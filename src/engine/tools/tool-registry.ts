/**
 * Tool Registry - Manages available tools for LLM function calling
 */

import type { ToolDefinition, ToolHandler, RegisteredTool, ToolResult, ToolCall } from "./types.js";
import { BaseTool } from "./builtin/base-tool.js";

/**
 * ToolRegistry - Singleton for managing available tools
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, RegisteredTool> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Register a tool instance (class-based)
   */
  public register(tool: BaseTool): void;
  
  /**
   * Register a tool with definition and handler (legacy)
   */
  public register(definition: ToolDefinition, handler: ToolHandler): void;
  
  /**
   * Register implementation
   */
  public register(definitionOrTool: ToolDefinition | BaseTool, handler?: ToolHandler): void {
    if (definitionOrTool instanceof BaseTool) {
      // Class-based tool
      const tool = definitionOrTool;
      if (this.tools.has(tool.name)) {
        console.warn(`[ToolRegistry] Tool "${tool.name}" already registered, overwriting`);
      }
      this.tools.set(tool.name, {
        definition: tool.definition,
        handler: (args) => tool.execute(args),
      });
      console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
    } else {
      // Legacy function-based tool
      const definition = definitionOrTool;
      if (handler === undefined) {
        throw new Error("Handler is required for legacy registration");
      }
      if (this.tools.has(definition.function.name)) {
        console.warn(`[ToolRegistry] Tool "${definition.function.name}" already registered, overwriting`);
      }
      this.tools.set(definition.function.name, { definition, handler });
      console.log(`[ToolRegistry] Registered tool: ${definition.function.name}`);
    }
  }

  /**
   * Get a tool by name
   */
  public get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tool definitions (for LLM)
   */
  public getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * Execute a tool call
   */
  public async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.function.name);
    
    if (!tool) {
      return {
        toolCallId: toolCall.id,
        output: "",
        error: `Tool "${toolCall.function.name}" not found`,
      };
    }

    try {
      // Parse arguments - handle both string (JSON) and object formats
      let args: Record<string, unknown>;
      try {
        if (typeof toolCall.function.arguments === "string") {
          args = JSON.parse(toolCall.function.arguments);
        } else if (typeof toolCall.function.arguments === "object" && toolCall.function.arguments !== null) {
          args = toolCall.function.arguments as Record<string, unknown>;
        } else {
          throw new Error("Arguments must be a string or object");
        }
      } catch (parseError) {
        return {
          toolCallId: toolCall.id,
          output: "",
          error: `Invalid JSON arguments: ${parseError instanceof Error ? parseError.message : String(toolCall.function.arguments)}`,
        };
      }

      // Execute handler
      const result = await tool.handler(args);
      
      // message is for UI display, content is for LLM
      return {
        toolCallId: toolCall.id,
        output: result.content, // For LLM
        structuredOutput: result, // For UI
      };
    } catch (error) {
      return {
        toolCallId: toolCall.id,
        output: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute multiple tool calls
   */
  public async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(toolCalls.map(call => this.executeToolCall(call)));
  }

  /**
   * Check if a tool is registered
   */
  public has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get tool count
   */
  public get size(): number {
    return this.tools.size;
  }

  /**
   * Clear all tools (mainly for testing)
   */
  public clear(): void {
    this.tools.clear();
  }
}

/**
 * Convenience export
 */
export const toolRegistry = ToolRegistry.getInstance();
