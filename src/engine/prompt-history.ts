import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const HISTORY_DIR = path.join(os.homedir(), ".starful", "data", "prompt-history");
const DEFAULT_HISTORY_FILE = path.join(HISTORY_DIR, "default.txt");

/**
 * PromptHistory - Manages prompt history for the CLI
 * Stores history in ~/.starful/data/prompt-history/default.txt
 */
export class PromptHistory {
  private _history: string[] = [];
  private _currentIndex = -1;
  
  constructor() {
    this._ensureDirectoryExists();
    this._load();
  }
  
  private _ensureDirectoryExists(): void {
    if (!fs.existsSync(HISTORY_DIR)) {
      fs.mkdirSync(HISTORY_DIR, { recursive: true });
    }
  }
  
  private _load(): void {
    try {
      if (fs.existsSync(DEFAULT_HISTORY_FILE)) {
        const content = fs.readFileSync(DEFAULT_HISTORY_FILE, "utf-8");
        this._history = content
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .reverse(); // Most recent first
      }
    } catch (error) {
      console.error("Failed to load prompt history:", error);
      this._history = [];
    }
  }
  
  private _save(): void {
    try {
      // Save reversed (most recent at top when reading)
      const content = [...this._history].reverse().join("\n");
      fs.writeFileSync(DEFAULT_HISTORY_FILE, content, "utf-8");
    } catch (error) {
      console.error("Failed to save prompt history:", error);
    }
  }
  
  /**
   * Add a prompt to history
   */
  add(prompt: string): void {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    
    // Remove duplicate if exists
    const existingIndex = this._history.indexOf(trimmed);
    if (existingIndex !== -1) {
      this._history.splice(existingIndex, 1);
    }
    
    // Add to beginning (most recent)
    this._history.unshift(trimmed);
    
    // Limit history size
    if (this._history.length > 1000) {
      this._history = this._history.slice(0, 1000);
    }
    
    // Reset index
    this._currentIndex = -1;
    
    // Save to file
    this._save();
  }
  
  /**
   * Get previous prompt (up arrow)
   * Returns empty string if at the beginning
   */
  previous(): string {
    if (this._history.length === 0) return "";
    
    if (this._currentIndex === -1) {
      this._currentIndex = 0;
    } else if (this._currentIndex < this._history.length - 1) {
      this._currentIndex++;
    }
    
    return this._history[this._currentIndex] ?? "";
  }
  
  /**
   * Get next prompt (down arrow)
   * Returns empty string if at the end
   */
  next(): string {
    if (this._history.length === 0 || this._currentIndex === -1) return "";
    
    if (this._currentIndex > 0) {
      this._currentIndex--;
      return this._history[this._currentIndex] ?? "";
    }
    
    // At the end, return empty to clear input
    this._currentIndex = -1;
    return "";
  }
  
  /**
   * Reset navigation index
   */
  resetIndex(): void {
    this._currentIndex = -1;
  }
  
  /**
   * Get history count
   */
  get length(): number {
    return this._history.length;
  }
}

// Singleton instance
let _instance: PromptHistory | null = null;

export function getPromptHistory(): PromptHistory {
  if (!_instance) {
    _instance = new PromptHistory();
  }
  return _instance;
}
