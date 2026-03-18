/**
 * Run Command Tool - Execute shell commands
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { BaseTool, type ParameterSchema } from "./base-tool.js";
import type { ToolOutput } from "../types.js";

const execAsync = promisify(exec);

export class RunCommandTool extends BaseTool {
  readonly name = "run_command";
  readonly description = "Execute a shell command and return its output. Use this to run npm scripts, git commands, build tools, linters, or any other command-line tools. BE CAREFUL with destructive commands like rm -rf.";

  protected readonly parameters: ParameterSchema[] = [
    {
      name: "command",
      type: "string",
      description: "The shell command to execute",
      required: true,
    },
    {
      name: "timeout",
      type: "number",
      description: "Maximum time to wait in milliseconds (default: 30000, max: 120000)",
      default: 30000,
    },
    {
      name: "cwd",
      type: "string",
      description: "Working directory for the command (defaults to project root)",
    },
  ];

  async execute(args: Record<string, unknown>): Promise<ToolOutput> {
    const command = this.requireParam<string>(args, "command");
    const timeout = Math.min(this.getParam(args, "timeout", 30000), 120000);
    const cwd = this.getParam<string | undefined>(args, "cwd", undefined);

    // Security check
    const dangerous = /rm\s+-rf\s+\//.test(command) || /:\(\){ :\|:& };:/ .test(command);
    if (dangerous) {
      return {
        message: `Command blocked`,
        content: "Error: Command blocked for security reasons",
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        cwd: cwd || process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
      });

      let output = "";
      if (stdout) output += stdout;
      if (stderr) output += (output ? "\n" : "") + stderr;
      if (!output) output = "(no output)";

      return {
        message: `${command} (${output.length})`,
        content: output,
      };
    } catch (error) {
      return {
        message: `Command failed`,
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
