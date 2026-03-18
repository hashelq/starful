/**
 * Built-in Tools - Register all available tools
 */

import { toolRegistry } from "../tool-registry.js";
import { ReadFileTool } from "./read-file.js";
import { WriteFileTool } from "./write-file.js";
import { RunCommandTool } from "./run-command.js";
import { SearchCodeTool } from "./search-code.js";

/**
 * Register all built-in tools with the registry
 */
export function registerBuiltinTools(): void {
  // File operations
  toolRegistry.register(new ReadFileTool());
  toolRegistry.register(new WriteFileTool());
  
  // Command execution
  toolRegistry.register(new RunCommandTool());
  
  // Code search
  toolRegistry.register(new SearchCodeTool());
  
  console.log(`[Tools] Registered ${toolRegistry.size} built-in tools`);
}

// Re-export classes
export { ReadFileTool } from "./read-file.js";
export { WriteFileTool } from "./write-file.js";
export { RunCommandTool } from "./run-command.js";
export { SearchCodeTool } from "./search-code.js";
export { BaseTool, type ParameterSchema } from "./base-tool.js";
