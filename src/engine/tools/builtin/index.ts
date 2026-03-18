/**
 * Built-in Tools - Register all available tools
 */

import { toolRegistry } from "../tool-registry.js";
import { readFileTool, readFileHandler } from "./read-file.js";
import { writeFileTool, writeFileHandler } from "./write-file.js";
import { runCommandTool, runCommandHandler } from "./run-command.js";
import { searchCodeTool, searchCodeHandler } from "./search-code.js";

/**
 * Register all built-in tools with the registry
 */
export function registerBuiltinTools(): void {
  // File operations
  toolRegistry.register(readFileTool, readFileHandler);
  toolRegistry.register(writeFileTool, writeFileHandler);
  
  // Command execution
  toolRegistry.register(runCommandTool, runCommandHandler);
  
  // Code search
  toolRegistry.register(searchCodeTool, searchCodeHandler);
  
  console.log(`[Tools] Registered ${toolRegistry.size} built-in tools`);
}

// Re-export for convenience
export { readFileTool, readFileHandler } from "./read-file.js";
export { writeFileTool, writeFileHandler } from "./write-file.js";
export { runCommandTool, runCommandHandler } from "./run-command.js";
export { searchCodeTool, searchCodeHandler } from "./search-code.js";
