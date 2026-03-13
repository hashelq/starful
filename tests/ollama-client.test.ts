import { describe, it, expect, beforeEach } from "bun:test";
import {
  OllamaClient,
  OllamaError,
} from "../src/ollama/implementations/ollama-client.js";
import type { ChatMessage } from "../src/ollama/types/api-types.js";

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
        if (chatResponse.message?.response) {
          fullResponse += chatResponse.message.response;
        }
        if (chatResponse.message?.thinking) {
          fullResponse += chatResponse.message.thinking;
        }
      }
    } catch (err) {
      hasError = true;
      console.error(err);
    }

    expect(hasError).toBe(false);
    expect(fullResponse).toContain("Hello, world!");
  }, 60e3);
});
