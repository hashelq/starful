import { describe, it, expect, beforeEach } from "bun:test";
import { OllamaClient } from "../src/llm/implementations/ollama-client.js";
import type { ChatMessage, ModelTool } from "../src/llm/types/api-types.js";

describe("OllamaClient Qwen Model", async () => {
  let client: OllamaClient;

  beforeEach(async () => {
    client = new OllamaClient({ host: "localhost", port: 11434 });
  });

  it("should ask ollama client with model qwen3.5:35b-better to generate Hello, world! exactly", async () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content:
          'Please write "Hello, world!" exactly. Do not add any extra text.',
      },
    ];

    let fullResponse = "";
    let hasError = false;

    try {
      const chatStream = await client.chat("qwen3.5:35b-better", messages);
      for await (const chatResponse of chatStream) {
        if ((chatResponse.message as any)?.response) {
          fullResponse += (chatResponse.message as any).response;
        }
        if ((chatResponse.message as any)?.thinking) {
          fullResponse += (chatResponse.message as any).thinking;
        }
      }
    } catch (err) {
      hasError = true;
      console.error(err);
    }

    expect(hasError).toBe(false);
    expect(fullResponse).toContain("Hello, world!");
  }, 60e3);

  it("should check tool use with write and read tools", async () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "What would you do to create a file named test.txt containing data?" },
    ];

    const tools: ModelTool[] = [
      {
        type: "function",
        function: {
          name: "write",
          description: "Write data to a file. This is virtual and does not write to real storage.",
          parameters: {
            type: "object" as const,
            properties: {
              filename: { type: "string" },
              content: { type: "string" },
            },
            required: ["filename", "content"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "read",
          description: "Read data from a file. This is virtual and does not read from real storage.",
          parameters: {
            type: "object" as const,
            properties: {
              filename: { type: "string" },
            },
            required: ["filename"],
          },
        },
      },
    ];

    let hasError = false;
    let toolCallsUsed = false;
    let toolCallData: unknown[] = [];

    try {
      const chatStream = await client.chat(
        "qwen3.5:35b-better",
        messages,
        tools,
      );
      for await (const chatResponse of chatStream) {
        if ((chatResponse.message as any)?.tool_calls && (chatResponse.message as any).tool_calls.length > 0) {
          toolCallsUsed = true;
          console.log("Tool calls detected:", JSON.stringify((chatResponse.message as any).tool_calls));
          toolCallData.push(...(chatResponse.message as any).tool_calls);
          for (const toolCall of (chatResponse.message as any).tool_calls) {
            expect(toolCall.function.name).toBe("write");
            expect(toolCall.function.arguments?.filename).toBe("test.txt");
            expect(typeof toolCall.function.arguments?.content).toBe("string");
          }
        }
      }
      expect(toolCallsUsed).toBe(true);
    } catch (err) {
      hasError = true;
      console.error(err);
    }

    expect(hasError).toBe(false);
  }, 60e3);
});
