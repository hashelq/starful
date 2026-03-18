/**
 * Abstract Base Tool - Base class for all LLM tools
 * Provides common functionality and enforces consistent interface
 */

import { resolve } from "node:path";
import type { ToolDefinition, ToolOutput } from "../types.js";

/**
 * Parameter schema definition
 */
export interface ParameterSchema {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  default?: unknown;
}

/**
 * Abstract base class for all tools
 */
export abstract class BaseTool {
  /** Tool name (e.g., "read_file") */
  abstract readonly name: string;
  
  /** Human-readable description for the LLM */
  abstract readonly description: string;
  
  /** Parameter schemas */
  protected abstract readonly parameters: ParameterSchema[];

  /**
   * Execute the tool with given arguments
   */
  abstract execute(args: Record<string, unknown>): Promise<ToolOutput>;

  /**
   * Get the tool definition for LLM function calling
   */
  get definition(): ToolDefinition {
    const required = this.parameters.filter(p => p.required).map(p => p.name);
    
    const properties: Record<string, { type: string; description: string }> = {};
    for (const param of this.parameters) {
      properties[param.name] = {
        type: param.type,
        description: param.description,
      };
    }

    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: "object",
          properties,
          required: required.length > 0 ? required : undefined,
        },
      },
    };
  }

  /**
   * Resolve path relative to project root or keep absolute
   */
  protected resolvePath(path: string): string {
    return path.startsWith("/") ? path : resolve(process.cwd(), path);
  }

  /**
   * Get required parameter value or throw error
   */
  protected requireParam<T>(args: Record<string, unknown>, name: string): T {
    const value = args[name] as T | undefined;
    if (value === undefined || value === null) {
      throw new Error(`${name} is required`);
    }
    return value;
  }

  /**
   * Get optional parameter with default value
   */
  protected getParam<T>(args: Record<string, unknown>, name: string, defaultValue: T): T {
    const value = args[name];
    return (value !== undefined ? value : defaultValue) as T;
  }

  /**
   * Format error as ToolOutput
   */
  protected formatError(error: unknown, context: string): ToolOutput {
    const message = error instanceof Error ? error.message : String(error);
    return {
      message: `Error: ${context}`,
      content: `Error: ${message}`,
    };
  }
}
