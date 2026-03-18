/**
 * Run Command Tool - Execute shell commands
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { ToolDefinition } from "../types.js";

const execAsync = promisify(exec);

/**
 * Run command tool definition
 */
export const runCommandTool: ToolDefinition = {
  type: "function",
  function: {
    name: "run_command",
    description: "Execute a shell command and return its output. Use this to run npm scripts, git commands, build tools, linters, or any other command-line tools. BE CAREFUL with destructive commands like rm -rf.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute",
        },
        timeout: {
          type: "number",
          description: "Maximum time to wait in milliseconds (default: 30000, max: 120000)",
        },
        cwd: {
          type: "string",
          description: "Working directory for the command (defaults to project root)",
        },
      },
      required: ["command"],
    },
  },
};

/**
 * Handler for run_command tool
 */
export async function runCommandHandler(args: Record<string, unknown>): Promise<string> {
  const command = args.command as string;
  const timeout = Math.min((args.timeout as number) ?? 30000, 120000);
  const cwd = args.cwd as string | undefined;

  if (!command) {
    return "Error: command is required";
  }

  // Security: Block obviously dangerous commands
  const dangerousPatterns = [
    /rm\s+-rf\s+\/(?:\s|$)/,  // rm -rf /
    /:(){ :|:& };:/,           // Fork bomb
    /dd\s+if=.*of=\/dev\/sd/, // Disk wipe
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return `Error: Command blocked for security reasons: potentially dangerous operation detected`;
    }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      cwd: cwd || process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB max output
    });

    let result = "";
    
    if (stdout) {
      result += `STDOUT:\n\`\`\`\n${stdout}\n\`\`\``;
    }
    
    if (stderr) {
      result += result ? "\n\n" : "";
      result += `STDERR:\n\`\`\`\n${stderr}\n\`\`\``;
    }
    
    if (!stdout && !stderr) {
      result = "(Command completed with no output)";
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error) {
      // Check for timeout
      if (error.message.includes("timeout")) {
        return `Error: Command timed out after ${timeout}ms: ${command}`;
      }
      
      // Check for maxBuffer exceeded
      if (error.message.includes("maxBuffer")) {
        return `Error: Command output exceeded 10MB limit: ${command}`;
      }
      
      // Command failed (non-zero exit)
      const match = error.message.match(/^Command failed:[\s\S]*?stderr:([\s\S]*?)(?=\n|$)/);
      if (match) {
        return `STDERR:\n\`\`\`\n${match[1]}\n\`\`\``;
      }
      
      return `Error executing command: ${error.message}`;
    }
    return `Error executing command: ${String(error)}`;
  }
}
