/**
 * Write File Tool - Write content to a file in the filesystem
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { BaseTool, type ParameterSchema } from "./base-tool.js";
import type { ToolOutput } from "../types.js";

export class WriteFileTool extends BaseTool {
  readonly name = "write_file";
  readonly description = "Write content to a file. Creates the file if it doesn't exist, or overwrites it if it does. Use this to create or modify code files, config files, or any text content.";

  protected readonly parameters: ParameterSchema[] = [
    {
      name: "path",
      type: "string",
      description: "The path to the file to write (relative to project root or absolute path)",
      required: true,
    },
    {
      name: "content",
      type: "string",
      description: "The content to write to the file",
      required: true,
    },
    {
      name: "createDirs",
      type: "boolean",
      description: "Create parent directories if they don't exist (default: true)",
      default: true,
    },
  ];

  async execute(args: Record<string, unknown>): Promise<ToolOutput> {
    const path = this.requireParam<string>(args, "path");
    const content = this.requireParam<string>(args, "content");
    const createDirs = this.getParam(args, "createDirs", true);

    try {
      const absolutePath = this.resolvePath(path);
      
      // Create parent directories if needed
      if (createDirs) {
        const dir = dirname(absolutePath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      }
      
      writeFileSync(absolutePath, content, "utf-8");
      
      const fileSize = Buffer.byteLength(content, "utf-8");
      return {
        message: `${absolutePath} (${fileSize})`,
        content: `Wrote ${fileSize} bytes to ${absolutePath}`,
      };
    } catch (error) {
      return {
        message: `Error writing ${path}`,
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
