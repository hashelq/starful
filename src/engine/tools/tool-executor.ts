/**
 * Tool Executor - Handles tool calling in LLM streaming responses
 */

import { toolRegistry, type ToolCall, type ToolResult } from "./index.js";

/**
 * Parse tool calls from LLM response chunk
 * Tool calls can come in different formats depending on provider
 */
export function parseToolCalls(response: unknown): ToolCall[] {
  // Handle OpenAI-compatible format
  if (typeof response === "object" && response !== null) {
    const resp = response as Record<string, unknown>;
    
    // Check for OpenAI-style tool_calls
    if (Array.isArray(resp.tool_calls)) {
      return resp.tool_calls.map((tc: unknown, index: number) => {
        const toolCall = tc as Record<string, unknown>;
        return {
          id: (toolCall.id as string) || `call_${Date.now()}_${index}`,
          type: "function",
          function: {
            name: (toolCall.function as Record<string, unknown>)?.name as string || "",
            arguments: JSON.stringify((toolCall.function as Record<string, unknown>)?.arguments || {}),
          },
        };
      });
    }
  }
  
  return [];
}

/**
 * Check if response contains tool calls
 */
export function hasToolCalls(response: unknown): boolean {
  if (typeof response === "object" && response !== null) {
    const resp = response as Record<string, unknown>;
    return Array.isArray(resp.tool_calls) && resp.tool_calls.length > 0;
  }
  return false;
}

/**
 * Format tool results for LLM consumption (OpenAI format)
 */
export function formatToolResults(toolResults: ToolResult[]): Array<{
  role: "tool";
  tool_call_id: string;
  content: string;
}> {
  return toolResults.map(result => ({
    role: "tool" as const,
    tool_call_id: result.toolCallId,
    content: result.error ? `Error: ${result.error}` : result.output,
  }));
}

/**
 * ToolExecutor - Manages tool calling in a streaming conversation
 */
export class ToolExecutor {
  private pendingToolCalls: ToolCall[] = [];
  private toolResults: ToolResult[] = [];
  private isExecuting = false;

  /**
   * Process a streaming chunk for tool calls
   * Returns true if tool calls were found and are being processed
   */
  async processChunk(
    chunk: unknown,
    onToolCall?: (toolCall: ToolCall) => void,
    onToolResult?: (result: ToolResult) => void,
    onAllResultsReady?: (results: ToolResult[]) => void,
  ): Promise<boolean> {
    const toolCalls = parseToolCalls(chunk);
    
    if (toolCalls.length === 0) {
      // No new tool calls, check if we have pending ones to execute
      return false;
    }

    // Found new tool calls
    this.pendingToolCalls.push(...toolCalls);
    
    // Notify about new tool call
    for (const toolCall of toolCalls) {
      onToolCall?.(toolCall);
    }

    // If not already executing, start execution
    if (!this.isExecuting) {
      this.isExecuting = true;
      await this.executePendingTools(onToolResult, onAllResultsReady);
      this.isExecuting = false;
    }

    return true;
  }

  /**
   * Execute all pending tool calls
   */
  private async executePendingTools(
    onToolResult?: (result: ToolResult) => void,
    onAllResultsReady?: (results: ToolResult[]) => void,
  ): Promise<void> {
    while (this.pendingToolCalls.length > 0) {
      const toolCall = this.pendingToolCalls.shift()!;
      
      const result = await toolRegistry.executeToolCall(toolCall);
      this.toolResults.push(result);
      
      onToolResult?.(result);
    }

    // All results ready
    onAllResultsReady?.(this.toolResults);
  }

  /**
   * Get accumulated tool results
   */
  getResults(): ToolResult[] {
    return [...this.toolResults];
  }

  /**
   * Format results for continuation message
   */
  getFormattedResults(): Array<{ role: "tool"; tool_call_id: string; content: string }> {
    return formatToolResults(this.toolResults);
  }

  /**
   * Check if any tools were called
   */
  hasResults(): boolean {
    return this.toolResults.length > 0;
  }

  /**
   * Clear state for new conversation turn
   */
  reset(): void {
    this.pendingToolCalls = [];
    this.toolResults = [];
    this.isExecuting = false;
  }
}
