/**
 * Read File Tool - Read contents of a file from the filesystem
 */

import { readFileSync } from "node:fs";
import { BaseTool, type ParameterSchema } from "./base-tool.js";
import type { ToolOutput } from "../types.js";

export class ReadFileTool extends BaseTool {
  readonly name = "read_file";
  readonly description = "Read the contents of a file from the filesystem. Use this to view code, config files, or any text file.";

  protected readonly parameters: ParameterSchema[] = [
    {
      name: "path",
      type: "string",
      description: "The path to the file to read (relative to project root or absolute path)",
      required: true,
    },
  ];

  async execute(args: Record<string, unknown>): Promise<ToolOutput> {
    const path = this.requireParam<string>(args, "path");

    try {
      const absolutePath = this.resolvePath(path);
      const content = readFileSync(absolutePath, "utf-8");
      const lines = content.split("\n");

      return {
        message: `${absolutePath} (${lines.length})`,
        content,
      };
    } catch (error) {
      return this.formatError(error, path);
    }
  }
}
