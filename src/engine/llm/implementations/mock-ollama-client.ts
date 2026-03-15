/**
 * MockOllamaClient - Mock implementation for testing without a real Ollama server.
 * Returns random pre-scripted responses containing Python and TypeScript code.
 */

import type { ChatMessage } from "../types/api-types.js";

const CODE_BLOCKS = [
  {
    lang: "python",
    code: [
      "def fibonacci(n):",
      '    """Calculate the nth Fibonacci number using recursion."""',
      "    if n <= 1:",
      "        return n",
      "    return fibonacci(n - 1) + fibonacci(n - 2)",
      "",
      "# Example usage",
      "result = fibonacci(10)",
      'print(f"Fibonacci(10) = {result}")'
    ],
    desc: "Here's a Python example that calculates the 10th Fibonacci number."
  },
  {
    lang: "typescript",
    code: [
      "interface User {",
      "  id: number;",
      "  name: string;",
      "  email: string;",
      "}",
      "",
      "function getUserById(users: User[], id: number): User | undefined {",
      "  return users.find(user => user.id === id);",
      "}",
      "",
      "// Example usage",
      "const users: User[] = [",
      '  { id: 1, name: "Alice", email: "alice@example.com" },',
      '  { id: 2, name: "Bob", email: "bob@example.com" }',
      "];",
      "",
      "console.log(getUserById(users, 1));"
    ],
    desc: "Here's a TypeScript function to find a user by ID."
  },
  {
    lang: "python",
    code: [
      "import json",
      "",
      "class ConfigManager:",
      "    def __init__(self, config_path: str):",
      "        self.config_path = config_path",
      "        self._config = None",
      "    ",
      "    def load(self) -> dict:",
      "        with open(self.config_path, 'r') as f:",
      "            self._config = json.load(f)",
      "        return self._config",
      "    ",
      "    def get(self, key: str, default=None):",
      "        return self._config.get(key, default) if self._config else default",
      "",
      "# Usage",
      'config = ConfigManager(\'config.json\')',
      "print(config.get('debug', False))"
    ],
    desc: "Here's a Python configuration manager class."
  },
  {
    lang: "typescript",
    code: [
      "type Result<T, E = Error> = ",
      "  | { ok: true; value: T }",
      "  | { ok: false; error: E };",
      "",
      "function divide(a: number, b: number): Result<number, string> {",
      "  if (b === 0) {",
      '    return { ok: false, error: "Division by zero" };',
      "  }",
      "  return { ok: true, value: a / b };",
      "}",
      "",
      "const result = divide(10, 2);",
      "if (result.ok) {",
      "  console.log(result.value); // 5",
      "}"
    ],
    desc: "Here's a TypeScript Result type for error handling."
  },
  {
    lang: "python",
    code: [
      "import asyncio",
      "import aiohttp",
      "",
      "async def fetch_url(session: aiohttp.ClientSession, url: str) -> str:",
      "    async with session.get(url) as response:",
      "        return await response.text()",
      "",
      "async def main():",
      '    urls = [',
      '        "https://api.github.com/users/octocat",',
      '        "https://api.github.com/users/torvalds"',
      "    ]",
      "    ",
      "    async with aiohttp.ClientSession() as session:",
      "        tasks = [fetch_url(session, url) for url in urls]",
      "        results = await asyncio.gather(*tasks)",
      "        ",
      "    for url, result in zip(urls, results):",
      '        print(f"{url}: {len(result)} bytes")',
      "",
      "asyncio.run(main())"
    ],
    desc: "Here's a Python async example for fetching multiple URLs."
  },
  {
    lang: "typescript",
    code: [
      "class EventEmitter<T extends Record<string, any>> {",
      "  private listeners: {",
      "    [K in keyof T]?: Array<(payload: T[K]) => void>",
      "  } = {};",
      "",
      "  on<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {",
      "    this.listeners[event] = this.listeners[event] || [];",
      "    this.listeners[event]!.push(handler);",
      "  }",
      "",
      "  emit<K extends keyof T>(event: K, payload: T[K]): void {",
      "    this.listeners[event]?.forEach(handler => handler(payload));",
      "  }",
      "}",
      "",
      "// Usage",
      "interface Events {",
      "  userJoined: { userId: number; name: string };",
      "  messageSent: { text: string };",
      "}",
      "",
      "const emitter = new EventEmitter<Events>();",
      "emitter.on('userJoined', ({ userId, name }) => {",
      '  console.log("User " + name + " joined with ID " + userId);',
      "});"
    ],
    desc: "Here's a TypeScript generic EventEmitter class."
  },
  {
    lang: "python",
    code: [
      "from typing import TypeVar, Generic, List",
      "",
      "T = TypeVar('T')",
      "",
      "class Stack(Generic[T]):",
      "    def __init__(self) -> None:",
      "        self._items: List[T] = []",
      "    ",
      "    def push(self, item: T) -> None:",
      "        self._items.append(item)",
      "    ",
      "    def pop(self) -> T:",
      "        if not self._items:",
      '            raise IndexError("Stack is empty")',
      "        return self._items.pop()",
      "    ",
      "    def peek(self) -> T:",
      "        return self._items[-1]",
      "    ",
      "    def is_empty(self) -> bool:",
      "        return len(self._items) == 0",
      "",
      "# Usage",
      "stack: Stack[int] = Stack()",
      "stack.push(42)",
      "print(stack.pop())  # 42"
    ],
    desc: "Here's a Python generic Stack implementation."
  },
  {
    lang: "typescript",
    code: [
      "function logExecution(target: any, propertyKey: string, descriptor: PropertyDescriptor) {",
      "  const original = descriptor.value;",
      "  ",
      "  descriptor.value = function(...args: any[]) {",
      '    console.log("Entering " + propertyKey);',
      "    const result = original.apply(this, args);",
      '    console.log("Exiting " + propertyKey);',
      "    return result;",
      "  };",
      "  ",
      "  return descriptor;",
      "}",
      "",
      "class Calculator {",
      "  @logExecution",
      "  add(a: number, b: number): number {",
      "    return a + b;",
      "  }",
      "  ",
      "  @logExecution",
      "  multiply(a: number, b: number): number {",
      "    return a * b;",
      "  }",
      "}",
      "",
      "const calc = new Calculator();",
      "calc.add(2, 3); // Logs: Entering add, Exiting add"
    ],
    desc: "Here's a TypeScript decorator pattern example."
  },
  {
    lang: "python",
    code: [
      "from dataclasses import dataclass, field",
      "from datetime import datetime",
      "from typing import List",
      "",
      "@dataclass",
      "class Order:",
      "    order_id: str",
      "    customer_name: str",
      "    items: List[str] = field(default_factory=list)",
      "    created_at: datetime = field(default_factory=datetime.now)",
      "    total: float = 0.0",
      "    ",
      "    def add_item(self, item: str, price: float):",
      "        self.items.append(item)",
      "        self.total += price",
      "    ",
      "    def __str__(self) -> str:",
      '        return f"Order #{self.order_id} - {self.customer_name}: ${self.total:.2f}"',
      "",
      "# Usage",
      'order = Order(order_id="ORD-001", customer_name="Alice")',
      'order.add_item("Widget", 29.99)',
      'order.add_item("Gadget", 49.99)',
      "print(order)"
    ],
    desc: "Here's a Python dataclass for an Order."
  },
  {
    lang: "typescript",
    code: [
      "async function retry<T>( ",
      "  fn: () => Promise<T>,",
      "  maxAttempts: number = 3,",
      "  delayMs: number = 1000",
      "): Promise<T> {",
      "  let lastError: Error;",
      "  ",
      "  for (let attempt = 1; attempt <= maxAttempts; attempt++) {",
      "    try {",
      "      return await fn();",
      "    } catch (error) {",
      "      lastError = error as Error;",
      '      console.log("Attempt " + attempt + " failed, retrying in " + delayMs + "ms...");',
      "      await new Promise(resolve => setTimeout(resolve, delayMs));",
      "    }",
      "  }",
      "  ",
      '  throw new Error("Failed after " + maxAttempts + " attempts: " + lastError.message);',
      "}",
      "",
      "// Usage",
      "const fetchData = retry(() => fetch('/api/data').then(r => r.json()));"
    ],
    desc: "Here's a TypeScript retry function with async/await."
  },
];

function buildResponse(item: typeof CODE_BLOCKS[0]): string {
  const codeStr = item.code.join("\n");
  return item.desc + "\n\n```" + item.lang + "\n" + codeStr + "\n```\n okay, good?";
}

export class MockOllamaClient {
  private config: { host: string; port: number; timeout: number };

  constructor(config?: { host?: string; port?: number; timeout?: number }) {
    this.config = {
      host: config?.host ?? "localhost",
      port: config?.port ?? 11434,
      timeout: config?.timeout ?? 60000,
    };
  }

  async *chat(
    model: string,
    _messages?: ChatMessage[],
    _tools?: any
  ): AsyncGenerator<{ model: string; createdAt: string; message: { thinking?: string; content?: string }; done: boolean }> {
    // Select random response
    const idx = Math.floor(Math.random() * CODE_BLOCKS.length);
    const randomItem = CODE_BLOCKS[idx];
    if (!randomItem) return;
    
    const fullResponse = buildResponse(randomItem);
    
    // Simulate thinking phase
    const thinkingPhrases = [
      "Analyzing the request",
      "Processing",
      "Computing",
      "Reasoning through the problem",
    ];
    
    for (const phrase of thinkingPhrases) {
      yield {
        model,
        createdAt: new Date().toISOString(),
        message: { thinking: phrase + "... " },
        done: false,
      };
      await this._delay(150);
    }

    // Stream response word by word
    const words = fullResponse.split(" ");
    for (const word of words) {
      yield {
        model,
        createdAt: new Date().toISOString(),
        message: { content: word + " " },
        done: false,
      };
      await this._delay(20);
    }

    // Final chunk
    yield {
      model,
      createdAt: new Date().toISOString(),
      message: { content: "" },
      done: true,
    };
  }

  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
