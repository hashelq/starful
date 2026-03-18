import { EventEmitter } from "../EventEmitter.js";

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

/**
 * MessageManager - Manages conversation message history
 */
export class MessageManager extends EventEmitter {
  private messages: ChatMessage[] = [];
  private systemPrompt: string;

  constructor() {
    super();
    
    // Default system prompt
    this.systemPrompt = 
      "You are a helpful AI assistant integrated into Starful, an AI-powered terminal IDE. " +
      "You can help with coding tasks, explaining concepts, answering questions, and more. " +
      "Provide detailed, accurate responses.";
  }

  // ─────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────

  /**
   * Add a message to history
   */
  addMessage(role: "user" | "assistant", content: string): ChatMessage {
    const message: ChatMessage = {
      role,
      content,
      timestamp: Date.now(),
    };
    this.messages.push(message);
    this.emit("messageAdded", message);
    return message;
  }

  /**
   * Get all messages
   */
  getHistory(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Get messages formatted for LLM (includes system prompt + optional limit)
   */
  getHistoryForLLM(limit?: number): Array<{ role: "user" | "assistant" | "system"; content: string }> {
    const result: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: this.systemPrompt },
    ];

    // Add conversation history (optionally limited)
    const history = limit ? this.messages.slice(-limit) : this.messages;
    for (const msg of history) {
      // Only include user and assistant messages in LLM context
      if (msg.role === "user" || msg.role === "assistant") {
        result.push({ role: msg.role, content: msg.content });
      }
    }

    return result;
  }

  /**
   * Clear all messages (except system)
   */
  clear(): void {
    this.messages = [];
    this.emit("historyCleared");
  }

  /**
   * Get message count
   */
  count(): number {
    return this.messages.length;
  }

  /**
   * Get last message
   */
  getLastMessage(): ChatMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  /**
   * Get message by index
   */
  getMessage(index: number): ChatMessage | undefined {
    return this.messages[index];
  }

  // ─────────────────────────────────────────
  // System Prompt
  // ─────────────────────────────────────────

  /**
   * Set system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    this.emit("systemPromptChanged", prompt);
  }

  /**
   * Get system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  // ─────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────

  /**
   * Events:
   * - messageAdded: (message: ChatMessage) => void
   * - historyCleared: () => void
   * - systemPromptChanged: (prompt: string) => void
   */
}
