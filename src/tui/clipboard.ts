import { platform } from "os";
import { spawn, execSync } from "child_process";

interface CopyMethod {
  (text: string): Promise<void>;
}

/**
 * Check if a command exists in PATH
 */
function commandExists(cmd: string): boolean {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the appropriate copy method based on the platform
 */
function getCopyMethod(): CopyMethod | null {
  const os = platform();

  // macOS
  if (os === "darwin") {
    return async (text: string) => {
      const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      try {
        await new Promise<void>((resolve, reject) => {
          const proc = spawn("osascript", ["-e", `set the clipboard to "${escaped}"`], {
            stdio: "ignore",
          });
          proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Exit code: ${code}`))));
          proc.on("error", reject);
        });
      } catch {
        // Ignore errors - fallback failed
      }
    };
  }

  // Linux
  if (os === "linux") {
    // Wayland
    if (process.env["WAYLAND_DISPLAY"]) {
      return async (text: string) => {
        try {
          await new Promise<void>((resolve, reject) => {
            const proc = spawn("wl-copy", [], { stdio: "pipe" });
            if (proc.stdin) {
              proc.stdin.write(text);
              proc.stdin.end();
            }
            proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Exit code: ${code}`))));
            proc.on("error", reject);
          });
        } catch {
          // Fallback to xclip or xsel - ignore
        }
      };
    }

    // X11 - try xclip first, then xsel
    if (commandExists("xclip")) {
      return async (text: string) => {
        try {
          await new Promise<void>((resolve, reject) => {
            const proc = spawn("xclip", ["-selection", "clipboard"], { stdio: "pipe" });
            if (proc.stdin) {
              proc.stdin.write(text);
              proc.stdin.end();
            }
            proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Exit code: ${code}`))));
            proc.on("error", reject);
          });
        } catch {
          // Ignore
        }
      };
    }

    if (commandExists("xsel")) {
      return async (text: string) => {
        try {
          await new Promise<void>((resolve, reject) => {
            const proc = spawn("xsel", ["--clipboard", "--input"], { stdio: "pipe" });
            if (proc.stdin) {
              proc.stdin.write(text);
              proc.stdin.end();
            }
            proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Exit code: ${code}`))));
            proc.on("error", reject);
          });
        } catch {
          // Ignore
        }
      };
    }
  }

  // Windows
  if (os === "win32") {
    return async (text: string) => {
      try {
        await new Promise<void>((resolve, reject) => {
          const proc = spawn(
            "powershell.exe",
            [
              "-NonInteractive",
              "-NoProfile",
              "-Command",
              "[Console]::InputEncoding = [System.Text.Encoding]::UTF8; Set-Clipboard -Value ([Console]::In.ReadToEnd())",
            ],
            { stdio: "pipe" }
          );
          if (proc.stdin) {
            proc.stdin.write(text);
            proc.stdin.end();
          }
          proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Exit code: ${code}`))));
          proc.on("error", reject);
        });
      } catch {
        // Ignore
      }
    };
  }

  return null;
}

// Cache the copy method
let cachedCopyMethod: CopyMethod | null = null;

/**
 * Copy text to clipboard with fallback support.
 * First tries OSC 52 (if supported), then falls back to platform-specific tools.
 * 
 * @param text - Text to copy to clipboard
 * @param isOsc52Supported - Whether the terminal supports OSC 52
 */
export async function copyToClipboard(text: string, isOsc52Supported: boolean = false): Promise<void> {
  // Try OSC 52 first if supported
  if (isOsc52Supported) {
    const base64 = Buffer.from(text).toString("base64");
    const osc52 = `\x1b]52;c;${base64}\x07`;
    const passthrough = process.env["TMUX"] || process.env["STY"];
    const sequence = passthrough ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52;
    
    try {
      if (process.stdout.isTTY) {
        process.stdout.write(sequence);
      }
    } catch {
      // OSC 52 failed, continue to fallback
    }
  }

  // Use fallback copy method if available
  if (!cachedCopyMethod) {
    cachedCopyMethod = getCopyMethod();
  }

  if (cachedCopyMethod) {
    try {
      await cachedCopyMethod(text);
    } catch {
      // Ignore fallback errors
    }
  }
}
