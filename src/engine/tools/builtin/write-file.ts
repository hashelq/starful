/**
 * Write File Tool - Write content to a file in the filesystem
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { ToolDefinition } from "../types.js";

/**
 * Write file tool definition
 */
export const writeFileTool: ToolDefinition = {
  type: "function",
  function: {
    name: "write_file",
    description: "Write content to a file. Creates the file if it doesn't exist, or overwrites it if it does. Use this to create or modify code files, config files, or any text content.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the file to write (relative to project root or absolute path)",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
        createDirs: {
          type: "boolean",
          description: "Create parent directories if they don't exist (default: true)",
        },
      },
      required: ["path", "content"],
    },
  },
};

/**
 * Handler for write_file tool
 */
export async function writeFileHandler(args: Record<string, unknown>): Promise<string> {
  const path = args.path as string;
  const content = args.content as string;
  const createDirs = (args.createDirs as boolean) ?? true;

  if (!path) {
    return "Error: path is required";
  }
  if (content === undefined || content === null) {
    return "Error: content is required";
  }

  try {
    // Resolve relative paths from project root
    const absolutePath = path.startsWith("/") ? path : resolve(process.cwd(), path);
    
    // Create parent directories if needed
    if (createDirs) {
      const dir = dirname(absolutePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
    
    writeFileSync(absolutePath, content, "utf-8");
    
    const fileSize = Buffer.byteLength(content, "utf-8");
    return `Successfully wrote ${fileSize} bytes to: ${absolutePath}`;
  } catch (error) {
    if (error instanceof Error) {
      return `Error writing file: ${error.message}`;
    }
    return `Error writing file: ${String(error)}`;
  }
}
