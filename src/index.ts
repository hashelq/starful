import { OllamaClient } from "./engine/llm/implementations/ollama-client";
import type { ChatMessage } from "./engine/llm/types/api-types";

let ollama = new OllamaClient({ host: "localhost", port: 11434 });

let ctx: ChatMessage[] = [];

async function ask(prompt?: string) {
  if (prompt) ctx.push({ role: "user", content: prompt });

  const r = await ollama.chat("qwen3:8b", ctx, [
    {
      type: "function",
      function: {
        name: "write",
        description: "Writes file",
        parameters: {
          type: "object",
          properties: { path: { type: "string" }, content: { type: "string" } },
        },
      },
    },
  ]);

  let toolCalls = [];

  let msg = "";
  let chunk;

  for await (chunk of r) {
    if (chunk.message.thinking) process.stdout.write(chunk.message.thinking);
    if (chunk.message.content) {
      process.stdout.write(chunk.message.content);
      msg += chunk.message.content;
    }
    if (chunk.message.tool_calls) {
      toolCalls.push(...chunk.message.tool_calls);
    }
  }

  ctx.push({ role: "assistant", content: msg, tool_calls: toolCalls });

  if (toolCalls.length) {
    console.log(toolCalls);
    ctx.push({
      role: "tool",
      content:
        '{ "status": ok }',
      tool_name: "write",
    });
  }
}

await ask("Write a python hello world to дристон.py");
await ask();
