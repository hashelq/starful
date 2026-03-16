# Starful Plans

## Free Models (No License Violation)

These free models can be integrated directly without using OpenCode's proxy:

### 1. NVIDIA NIM (`nvidia`)
**API**: `https://integrate.api.nvidia.com/v1`

Free models available:
- `minimax-m2`
- `minimax-m2.1`
- Many NVIDIA NIM models (Llama, Mistral, Qwen, DeepSeek, etc.)

### 2. OpenRouter (`openrouter`)
**API**: `https://openrouter.ai/api/v1`

Free models (marked with `:free`):
- `deepseek-r1:free`
- `qwen/qwen3-32b:free`
- `meta-llama/llama-3.1-70b:free`
- `google/gemma-3-27b-it:free`
- `mistralai/mistral-7b-instruct:free`
- And many more...

### 3. Cloudflare Workers AI (`cloudflare-workers-ai`)
**API**: Free, no API key needed
**Endpoint**: `https://workers.ai`

Free models:
- `mistral-7b-instruct-v0.1-awq`
- `llama-2-7b-chat-hf-lora`
- `tinyllama-1.1b-chat-v1.0`
- `qwen1.5-0.5b-chat`
- `openchat-3.5-0106`

### 4. GitHub Models (`github-models`)
**API**: `https://models.inference.ai.azure.com`

Free models:
- `phi-4`
- `phi-4-mini-reasoning`
- `o1-mini`
- `o3-mini`
- `llama-3.1-405b-instruct`

### 5. Vercel AI (`vercel`)
**API**: `https://gateway.runpod.ai/v1` (or similar)

Free models:
- `meta/llama-3.3-70b`
- `meta/llama-4-scout`

### 6. MiniMax Direct (`minimax-coding-plan`)
**API**: MiniMax API directly

Free models:
- `MiniMax-M2`
- `MiniMax-M2.1`

### 7. AIHubMix (`aihubmix`)
**API**: Various

Free models:
- `coding-minimax-m2.1-free`
- `coding-glm-4.7-free`

---

## Implementation Priority

1. **NVIDIA NIM** - Most reliable, good free tier
2. **OpenRouter** - Most free models, good quality
3. **Cloudflare Workers AI** - Actually free, no API key needed
4. **GitHub Models** - Good free tier for Microsoft models
5. **MiniMax Direct** - For MiniMax models without proxy

---

## Integration Notes

- All use OpenAI-compatible `/v1/chat/completions` format
- Can reuse existing `RestLLMClient` base class
- Each provider just needs different `baseUrl` and `headers`
- NVIDIA NIM: Requires API key but has generous free tier
- OpenRouter: Requires API key but has free models
- Cloudflare: Truly free, no API key needed
