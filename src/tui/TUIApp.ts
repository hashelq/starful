export interface TUIConfig {
  title?: string;
  width?: number;
  height?: number;
}

export class InteractiveInput {
  private value: string = "";
  private cursorPosition: number = 0;
  private focused: boolean = false;

  constructor() {}

  setValue(value: string): void {
    this.value = value;
    this.cursorPosition = Math.min(value.length, Math.max(0, this.cursorPosition));
  }

  getValue(): string {
    return this.value;
  }

  getCursorPosition(): number {
    return this.cursorPosition;
  }

  focus(): void {
    this.focused = true;
  }

  blur(): void {
    this.focused = false;
  }

  isFocused(): boolean {
    return this.focused;
  }

  insertChar(char: string): void {
    const before = this.value.slice(0, this.cursorPosition);
    const after = this.value.slice(this.cursorPosition);
    this.value = `${before}${char}${after}`;
    this.cursorPosition += char.length;
  }

  deleteBackwards(): void {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
      const before = this.value.slice(0, this.cursorPosition);
      const after = this.value.slice(this.cursorPosition + 1);
      this.value = `${before}${after}`;
    }
  }

  deleteForwards(): void {
    if (this.cursorPosition < this.value.length) {
      const before = this.value.slice(0, this.cursorPosition);
      const after = this.value.slice(this.cursorPosition + 1);
      this.value = `${before}${after}`;
    }
  }

  moveCursorLeft(): void {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
    }
  }

  moveCursorRight(): void {
    if (this.cursorPosition < this.value.length) {
      this.cursorPosition++;
    }
  }

  clearSelection(): void {
    this.value = "";
    this.cursorPosition = 0;
  }
}

export class ChatHistoryManager {
  private messages: Array<{ id: string; role: "user" | "assistant"; content: string }> = [];

  add(role: "user" | "assistant", content: string): { id: string; role: "user" | "assistant"; content: string } {
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
    };
    this.messages.push(msg);
    return msg;
  }

  getMessages(): Array<{ id: string; role: "user" | "assistant"; content: string }> {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }

  getLastMessage(role?: "user" | "assistant"): { id: string; role: "user" | "assistant"; content: string } | null {
    const filtered = role 
      ? this.messages.filter((m) => m.role === role)
      : this.messages;
    return filtered[filtered.length - 1] || null;
  }

  size(): number {
    return this.messages.length;
  }
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default class TUIApp {
  private historyManager: ChatHistoryManager;
  private input: InteractiveInput;
  private focused: boolean = true;
  private config: TUIConfig;
  private title: string;

  constructor(config?: TUIConfig) {
    this.config = config || {};
    this.title = config?.title || "Starful TUI";
    this.historyManager = new ChatHistoryManager();
    this.input = new InteractiveInput();
  }

  buildDisplay(): string {
    const lines: string[] = [];

    if (this.historyManager.size() === 0) {
      lines.push("Starful - Terminal AI IDE");
      lines.push("");
    }

    const messages = this.historyManager.getMessages().slice(-20);
    for (const msg of messages) {
      const colorPrefix = msg.role === "user" ? "\x1b[36m" : "\x1b[35m";
      const reset = "\x1b[0m";
      lines.push(`\n${colorPrefix}[${msg.role}]${reset} ${msg.content}`);
    }

    const cursorChar = this.focused ? "▋" : "_";
    lines.push(`\x1b[33m>\x1b[0m ${this.input.getValue()}${cursorChar}`);

    return lines.join("\n");
  }

  render(): void {
    console.clear();
    console.log(this.buildDisplay());
  }

  handleKey(key: string | undefined): boolean {
    if (!this.focused && key) {
      this.focused = true;
      this.input.focus();
      this.render();
      return false;
    }

    switch (key) {
      case "Escape":
        if (this.input.getValue()) {
          this.focused = false;
          this.input.blur();
          this.render();
          return false;
        }
        break;

      case "Tab":
        this.switchFocus();
        return false;

      case "Enter":
      case "\n":
        this.submitInput();
        return true;

      default:
        if (key && key.length === 1) {
          this.input.insertChar(key);
          return false;
        } else if (key === "Backspace") {
          this.input.deleteBackwards();
          return false;
        } else if (key === "Delete" || key === "\x7F") {
          this.input.deleteForwards();
          return false;
        } else if (key === "ArrowLeft") {
          const oldPos = this.input.getCursorPosition();
          this.input.moveCursorLeft();
          if (oldPos === 0 && this.historyManager.getLastMessage("user")) {
            this.submitInput();
          }
          return false;
        } else if (key === "ArrowRight") {
          this.input.moveCursorRight();
          return false;
        } else if (key === "ArrowUp") {
          const prev = this.historyManager.getLastMessage("user");
          if (prev && prev.content) {
            this.input.setValue(prev.content);
            this.input.moveCursorRight();
            this.render();
          }
          return false;
        } else if (key === "ArrowDown") {
          if (!this.input.getValue().trim()) {
            this.input.clearSelection();
          }
          return false;
        }
    }

    this.render();
    return false;
  }

  private switchFocus(): void {
    this.focused = !this.focused;
    if (this.focused) {
      this.input.focus();
    } else {
      this.input.blur();
    }
    this.render();
  }

  private submitInput(): void {
    const text = this.input.getValue().trim();
    if (text) {
      this.historyManager.add("user", text);
      this.input.clearSelection();
      
      // Simulated assistant response
      setTimeout(() => {
        this.historyManager.add("assistant", 
          `[Demo: received "${text}" - real LLM would respond here]`
        );
      }, 500);
    }
  }

  getInputState(): { focused: boolean; value: string; cursorPos: number } {
    return {
      focused: this.focused && this.input.isFocused(),
      value: this.input.getValue(),
      cursorPos: this.input.getCursorPosition()
    };
  }

  static get title(): string {
    return "*Starful TUI - Interactive*";
  }
}
