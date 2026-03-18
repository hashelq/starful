/**
 * Search Code Tool - Search for text patterns in files
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BaseTool, type ParameterSchema } from "./base-tool.js";
import type { ToolOutput } from "../types.js";

export class SearchCodeTool extends BaseTool {
  readonly name = "search_code";
  readonly description = "Search for text patterns in files within a directory. Useful for finding code, configuration, or any text across your project.";

  protected readonly parameters: ParameterSchema[] = [
    {
      name: "pattern",
      type: "string",
      description: "The text pattern to search for (supports basic regex)",
      required: true,
    },
    {
      name: "path",
      type: "string",
      description: "Directory to search in (defaults to project root)",
      default: ".",
    },
    {
      name: "filePattern",
      type: "string",
      description: "File pattern to match (e.g., '*.ts', '*.js', '*')",
      default: "*",
    },
    {
      name: "caseSensitive",
      type: "boolean",
      description: "Whether to match case exactly (default: false)",
      default: false,
    },
  ];

  async execute(args: Record<string, unknown>): Promise<ToolOutput> {
    const pattern = this.requireParam<string>(args, "pattern");
    const path = this.getParam(args, "path", ".");
    const filePattern = this.getParam(args, "filePattern", "*");
    const caseSensitive = this.getParam(args, "caseSensitive", false);

    try {
      const files = this.getFiles(path, filePattern);
      
      if (files.length === 0) {
        return {
          message: `"${pattern}" (0 files)`,
          content: `No files matching "${filePattern}" found in ${path}`,
        };
      }
      
      const allMatches = this.searchFiles(files, pattern, caseSensitive);
      
      if (allMatches.length === 0) {
        return {
          message: `"${pattern}" (0 matches)`,
          content: `No matches found for "${pattern}"`,
        };
      }
      
      const results = allMatches.map(m => 
        `${m.file}:${m.line}: ${m.content}`
      ).join("\n");
      
      return {
        message: `"${pattern}" (${allMatches.length} matches)`,
        content: results,
      };
    } catch (error) {
      return {
        message: `Error searching`,
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private getFiles(dir: string, filePattern: string, files: string[] = []): string[] {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      const pattern = new RegExp(filePattern.replace(/\*/g, ".*") + "$");
      
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        
        const fullPath = resolve(dir, entry.name);
        
        if (entry.isDirectory()) {
          this.getFiles(fullPath, filePattern, files);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip
    }
    
    return files;
  }

  private searchFiles(files: string[], pattern: string, caseSensitive: boolean): { file: string; line: number; content: string }[] {
    const allMatches: { file: string; line: number; content: string }[] = [];
    
    for (const filePath of files) {
      try {
        const content = readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        const regex = new RegExp(pattern, caseSensitive ? "g" : "gi");
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line !== undefined && regex.test(line)) {
            allMatches.push({
              file: filePath.replace(process.cwd(), "."),
              line: i + 1,
              content: line.substring(0, 200),
            });
          }
        }
      } catch {
        // Skip
      }
    }
    
    return allMatches;
  }
}
