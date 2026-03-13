import * as opentui from "@opentui/core";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface TUIConfig {
  title?: string;
  width?: number;
  height?: number;
}

export class MessageInput {
  private value: string = "";
  private cursorPosition: number = 0;

  setValue(value: string): void {
    this.value = value;
    this.cursorPosition = value.length;
  }

  getValue(): string {
    return this.value;
  }

  getCursorPosition(): number {
    return this.cursorPosition;
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
}

export class ChatHistory {
  private messages: Array<{ id: string; role: "user" | "assistant"; content: string }> = [];
  private idCounter = 0;

  constructor(config?: TUIConfig) {}

  add(role: "user" | "assistant", content: string): { id: string; role: "user" | "assistant"; content: string } {
    const msg = {
      id: `msg-${++this.idCounter}-${Date.now()}`,
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
}

export default class TUIApp {
  private title: string = "Starful TUI";
  private historyMessages: Array<{ id: string; role: "user" | "assistant"; content: string }> = [];
  private inputBox: MessageInput;
  private config: TUIConfig;

  constructor(config?: TUIConfig) {
    this.config = config || {};
    this.title = this.config.title || "Starful TUI";
    this.inputBox = new MessageInput();
  }

  render(): object {
    const window: any = { title: this.title, children: [] };
    
    if (this.historyMessages.length === 0) {
      window.children.push("");
      window.children.push("Starful - Terminal AI IDE");
      window.children.push("");
    }
    
    for (const msg of this.historyMessages.slice(-50)) {
      const prefix = `\x1b[36m${msg.role}:\x1b[0m`;
      window.children.push(`\n${prefix} ${msg.content}`);
    }
    
    const inputLine = `\x1b[2m> \x1b[0m${this.inputBox.getValue()}_`;
    window.children.push(inputLine);
    
    return window;
  }

  send(text: string): void {}

  appendMessage(role: "user" | "assistant", text: string): void {
    this.historyMessages.push({
      id: `msg-${Date.now()}`,
      role,
      content: text,
    });
  }

  updateInput(text: string): void {
    this.inputBox.setValue(text);
  }

  get historySize(): number {
    return this.historyMessages.length;
  }
}
