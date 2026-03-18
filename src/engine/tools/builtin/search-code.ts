/**
 * Search Code Tool - Search for text patterns in files
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ToolDefinition } from "../types.js";

/**
 * Search code tool definition
 */
export const searchCodeTool: ToolDefinition = {
  type: "function",
  function: {
    name: "search_code",
    description: "Search for text patterns in files within a directory. Useful for finding code, configuration, or any text across your project.",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The text pattern to search for (supports basic regex)",
        },
        path: {
          type: "string",
          description: "Directory to search in (defaults to project root)",
        },
        filePattern: {
          type: "string",
          description: "File pattern to match (e.g., '*.ts', '*.js', '*')",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of matches to return (default: 50)",
        },
        caseSensitive: {
          type: "boolean",
          description: "Whether to match case exactly (default: false)",
        },
      },
      required: ["pattern"],
    },
  },
};

/**
 * Recursively get all files matching a pattern
 */
function getFiles(dir: string, pattern: RegExp, files: string[] = []): string[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      
      // Skip node_modules, .git, etc.
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }
      
      if (entry.isDirectory()) {
        getFiles(fullPath, pattern, files);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Skip directories we can't read
  }
  
  return files;
}

/**
 * Search for pattern in a file
 */
function searchInFile(filePath: string, pattern: string, caseSensitive: boolean): { line: number; content: string }[] {
  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const regex = new RegExp(pattern, caseSensitive ? "g" : "gi");
    
    const matches: { line: number; content: string }[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined && regex.test(line)) {
        matches.push({
          line: i + 1,
          content: line.substring(0, 200), // Truncate long lines
        });
      }
    }
    
    return matches;
  } catch {
    return [];
  }
}

/**
 * Handler for search_code tool
 */
export async function searchCodeHandler(args: Record<string, unknown>): Promise<string> {
  const pattern = args.pattern as string;
  const path = (args.path as string) || process.cwd();
  const filePattern = (args.filePattern as string) || "*";
  const maxResults = (args.maxResults as number) || 50;
  const caseSensitive = (args.caseSensitive as boolean) || false;

  if (!pattern) {
    return "Error: pattern is required";
  }

  try {
    // Convert glob pattern to regex
    const ext = filePattern.startsWith("*.") ? filePattern.slice(1) : filePattern;
    const fileRegex = ext.startsWith(".") 
      ? new RegExp(`\\${ext}$`)
      : new RegExp(filePattern.replace(/\*/g, ".*"));
    
    // Get all matching files
    const files = getFiles(path, fileRegex);
    
    if (files.length === 0) {
      return `No files matching "${filePattern}" found in ${path}`;
    }
    
    // Search in each file
    const allMatches: { file: string; line: number; content: string }[] = [];
    
    for (const file of files) {
      const matches = searchInFile(file, pattern, caseSensitive);
      for (const match of matches) {
        allMatches.push({
          file: file.replace(process.cwd(), "."),
          line: match.line,
          content: match.content,
        });
      }
    }
    
    if (allMatches.length === 0) {
      return `No matches found for "${pattern}"`;
    }
    
    // Limit results
    const limited = allMatches.slice(0, maxResults);
    const showing = limited.length;
    const total = allMatches.length;
    
    // Format results
    const results = limited.map(m => 
      `${m.file}:${m.line}: ${m.content}`
    ).join("\n");
    
    const suffix = total > maxResults 
      ? `\n\n... (showing ${showing}/${total} matches)` 
      : "";
    
    return `Found ${total} matches for "${pattern}":\n\n\`\`\`\n${results}\n\`\`\`${suffix}`;
  } catch (error) {
    if (error instanceof Error) {
      return `Error searching: ${error.message}`;
    }
    return `Error searching: ${String(error)}`;
  }
}
