export abstract class LLMProvider {
  protected model: string;

  constructor(model: string) {
    this.model = model;
  }

  abstract chat(messages: Array<{ role: string; content: string }>): Promise<string>;

  abstract chatStream(
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): void;

  abstract complete(prompt: string): Promise<string>;

  abstract completeStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): void;

  async listModels(): Promise<string[]> {
    const res = await this._fetchFromOllama("/api/tags");
    if (typeof res === "string") return [];
    const rawModels = (res as { models?: unknown[] })?.models ?? [];
    const modelList: string[] = Array.isArray(rawModels)
      ? rawModels.map((m) => (typeof m === "object" && m !== null && "name" in m && typeof m.name === "string") ? m.name : "")
      : [];
    return modelList;
  }

  protected abstract _fetchFromOllama(endpoint: string): Promise<unknown>;

  protected buildEndpoint(endpoint: string): URL {
    return new URL(`http://localhost:11434${endpoint}`);
  }
}
