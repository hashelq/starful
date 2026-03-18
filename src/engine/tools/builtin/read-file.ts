/**
 * Read File Tool - Read contents of a file from the filesystem
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ToolDefinition } from "../types.js";

/**
 * Read file tool definition
 */
export const readFileTool: ToolDefinition = {
  type: "function",
  function: {
    name: "read_file",
    description: "Read the contents of a file from the filesystem. Use this to view code, config files, or any text file.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the file to read (relative to project root or absolute path)",
        },
        maxLines: {
          type: "number",
          description: "Maximum number of lines to read (default: 100, use 0 for unlimited)",
        },
        offset: {
          type: "number",
          description: "Line offset to start reading from (0-indexed, default: 0)",
        },
      },
      required: ["path"],
    },
  },
};

/**
 * Handler for read_file tool
 */
export async function readFileHandler(args: Record<string, unknown>): Promise<string> {
  const path = args.path as string;

  if (!path) {
    return "Error: path is required";
  }

  try {
    // Resolve relative paths from project root
    const absolutePath = path.startsWith("/") ? path : resolve(process.cwd(), path);
    
    const content = readFileSync(absolutePath, "utf-8");
    const lines = content.split("\n");
    const totalLines = lines.length;

    // Return short summary for UI display
    // Full content is NOT returned - LLM gets it via tool result format
    return `Read ${absolutePath} (${totalLines} lines)`;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("ENOENT")) {
        return `Error: File not found: ${path}`;
      }
      if (error.message.includes("EISDIR")) {
        return `Error: Path is a directory, not a file: ${path}`;
      }
      return `Error reading file: ${error.message}`;
    }
    return `Error reading file: ${String(error)}`;
  }
}
