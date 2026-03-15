// Ollama API Types - Comprehensive type definitions based on official Ollama API

export type Role = 'user' | 'assistant' | 'system' | 'tool';

// Base time type representing nanoseconds
export type Nanoseconds = number;

// Model name format: "model:tag" (e.g., "llama3.2", "example/model:latest")
export type ModelName = string;

// Image data in base64 format
export type Base64Image = string;

// Streaming mode toggle
export type StreamMode = boolean;

// Raw mode - bypasses templating system
export type RawMode = boolean;

// Think mode for thinking models
export type ThinkMode = boolean;

// Keep alive duration (seconds or duration string like "5m", "1h")
export type KeepAlive = number | string;

// Format options for structured outputs
export type Format = 'json' | object;

// ==================== Chat Message Types ====================

export interface ChatMessage {
  role: Role;
  content: string;
  images?: Base64Image[];
  thinking?: string;
  tool_calls?: ToolCall[];
  tool_name?: string;
}

// Tool calling structures
export interface ToolCall {
  function: FunctionDefinition;
}

export interface FunctionDefinition {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ModelTool {
  type: 'function';
  function: OllamaFunctionDefinition;
}

export interface OllamaFunctionDefinition {
  name: string;
  description?: string;
  parameters: FunctionParametersSchema;
}

// JSON Schema for tool/function parameters
export interface FunctionParametersSchema {
  type: 'object';
  properties: Record<string, FunctionParameter>;
  required?: string[];
}

export interface FunctionParameter {
  type: string;
  description?: string;
  enum?: unknown[];
}

// ==================== Generation Parameters ====================

export interface GenerationOptions {
  // Model tuning
  temperature?: number;      // [0,1] Higher = more random, lower = more deterministic
  top_k?: number;             // Constraints for logit selection
  top_p?: number;             // Cumulative probability, >1 = no effect, <1 = nucleus sampling
  min_p?: number;             // Minimum P as ratio of highest token probability, default 0.05

  // Context control
  num_keep?: number;          // Number of tokens to keep from initial prompt (for conversational memory)
  seed?: number;              // Random seed for reproducible outputs (optional)
  
  // Prediction control
  stop?: string[];            // Stop conditions, can be strings or newline-separated strings
  num_predict?: number;       // Maximum number of tokens to predict (-1 = infinite, 0 = only initial evaluation
  
  // Repetition control
  repeat_last_n?: number;     // Penalize repeating sequences of last n tokens (use -1 to disable)
  repeat_penalty?: number;    // How strongly to penalize repetition (>1.0 = punish, <1.0 = reward)
  
  // Context length control
  num_ctx?: number;           // Context size

  // Performance tuning
  num_batch?: number;         // Prompt processing batch size (should be power of 2)
  num_thread?: number;        // Number of threads to use during generation

  // GPU offloading
  num_gpu?: number;           // Number of GPUs for main processing (>1 = multi GPU inference)
  main_gpu?: number;          // Main GPU as primary device (0-indexed)
  
  // Memory control
  use_mmap?: boolean;         // Enable mmaps
  numa?: boolean;             // Enable NUMA awareness
  
  custom_tokens?: Record<string, boolean>; // Add special tokens to vocabulary
}

// ==================== Chat Parameters ====================

export interface ChatParameters {
  model: ModelName;
  messages: ChatMessage[];
  format?: Format;
  keep_alive?: KeepAlive;
  options?: GenerationOptions;
  stream?: StreamMode;
  tools?: ModelTool[];
}

// ==================== Generate Parameters ====================

export interface GenerateParameters {
  model: ModelName;
  prompt?: string;
  suffix?: string;           // Text after the response (use for code completion)
  images?: Base64Image[];     // List of base64 encoded images for multimodal models
  
  think?: ThinkMode;          // For thinking models, should model think before responding?
  
  format?: Format;
  keep_alive?: KeepAlive;
  options?: GenerationOptions;
  response?: string;          // Response from a previous request (for resuming)
  system?: string;            // System template for one-off prompts
  template?: string;          // Custom prompt template
  stream?: StreamMode;
  raw?: RawMode;               // Bypass templating
  
  // Image generation parameters (experimental - image generation models only)
  width?: number;             // Image width in pixels
  height?: number;            // Image height in pixels
  steps?: number;             // Number of diffusion steps
}

// ==================== Chat Response Types ====================

export interface ChatResponse {
  model: ModelName;
  createdAt: string;          // RFC3339 formatted timestamp
  message: MessageContent;
  done: boolean;
  
  // Only present when streaming stops or non-streaming mode
  totalDuration?: Nanoseconds;
  loadDuration?: Nanoseconds;
  promptEvalCount?: number;
  promptEvalDuration?: Nanoseconds;
  evalCount?: number;
  evalDuration?: Nanoseconds;
}

/*
* This is a 2 step message content
*
* Both thinking and response are few tokens inside the whole response when are received through streaming.
*
* At first the bot MAY think. 
* Thats why you will see no .content and .thinking like: { ..., "thinking": ")." }
*
* At second, after the thinking process is done, you will see the response.
*
* Thats why you will see no .thinking and .content like: { ..., "thinking": ")." }
*
* A tool call may be inserted inside of any message.
*
*/
export interface MessageContent {
  /* Phase 1 */
  thinking?: string;

  /* Phase 2 */
  content?: string;

  images?: Base64Image[];
  tool_calls?: ToolCall[];
}

// ==================== Generate Response Types ====================

export interface GenerateResponse {
  model: ModelName;
  createdAt: string;          // RFC3339 formatted timestamp
  response: string;
  done: boolean;
  
  // Only present when streaming stops or non-streaming mode
  totalDuration?: Nanoseconds;
  loadDuration?: Nanoseconds;
  promptEvalCount?: number;
  promptEvalDuration?: Nanoseconds;
  evalCount?: number;
  evalDuration?: Nanoseconds;
  
  // Context from previous requests (deprecated but still used for conversational memory)
  context?: number[];
  
  // Completion reason when done=true
  doneReason?: 'stop' | 'length' | 'interrupted';
  
  // Only present in raw mode
  prompt?: string;            // Full rendered prompt (when raw=true)
}

// ==================== Model Information Types ====================

export interface ModelDetails {
  family: string;
  parameter_size: string;     // e.g., "70B", "13B"
  quantization_level: string; // e.g., "Q4_0", "F16"
}

export interface LocalModelInfo {
  name: string;
  model?: string;             // Model reference if different from filename
  modified_at: string;        // RFC3339 formatted timestamp
  size: number;               // File size in bytes
  digest: string;             // SHA256 digest of the model
  details?: ModelDetails;
}

export interface ShowModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  format?: string;            // e.g., "GGUF"
  family?: string;
  families?: string[];        // Array of model families for multi-family models
  parameter_size?: string;
  quantization_level?: string;
  parents?: string[];         // Parent model names
  template?: string;          // Template for the model (may contain {{ .Prompt }})
  parameters: string;         // Model parameters in a fixed format
  system: string;             // System prompt if defined
  
  // License block as specified in the Modelfile
  license?: string | string[]; 
  
  details?: ModelDetails;
}

// ==================== Model Operations Types ====================

export interface CreateModelParameters {
  model: string;              // Name of model to create
  from?: string;              // Base model name
  files?: Record<string, string>;   // File paths mapped to digests (SHA256)
  adapters?: Record<string, string>;  // LORA adapters file paths -> digests
  
  template?: string;          // Prompt template for the model
  license?: string | string[];  // Model license(s)
  
  system?: string;            // System prompt
  parameters?: object;        // Model parameter definitions
  messages?: ChatMessage[];   // Sample conversation for few-shot learning
  
  quantize?: string;          // Quantization type (e.g., "Q4_K_M")
  stream?: StreamMode;
}

export interface CopyModelParameters {
  source: string;             // Name of model to copy
  destination: string;        // Destination name for the copy
  stream?: StreamMode;
}

export interface DeleteModelParameters {
  name: string;               // Name of model to delete
  stream?: StreamMode;
}

// ==================== Model Pull/Push Types ====================

export interface PullModelParameters {
  model: string;              // Model name to pull (e.g., "llama3.2")
  insecure?: boolean;         // Enable insecure pulls from untrusted sources
  stream?: StreamMode;
}

export interface PushModelParameters {
  model: string;
  insecure?: boolean;
  stream?: StreamMode;
}

// ==================== Embedding Types ====================

export interface EmbedParameters {
  model: string;              // Name of embedding model
  prompt: string;             // Prompt to generate embeddings for
  truncate?: boolean;         // Truncate prompt to fit context window
  options?: GenerationOptions;
  keep_alive?: KeepAlive;
}

export interface EmbeddingsResponse {
  model: string;
  createdAt: string;
  embeddings: number[][];     // Array of embedding vectors (float arrays)
}

// Single embedding response (deprecated but still supported)
export interface EmbeddingResponse {
  embedding: number[];
}

// ==================== Running Models Types ====================

export interface PsModel {
  name: string;               // Model name including tag
  size: number;               // Model size in bytes
  digest: string;             // SHA256 digest
  details?: ModelDetails;
  expire_at: Date;            // When the model will be unloaded
  expires: Nanoseconds;       // Time until unloading in nanoseconds
  
  slots: number;              // Number of available model inference slots
}

export interface PsResponse {
  models: PsModel[];          // List of all currently loaded/running models
}

// ==================== Image Generation Types (Experimental) ====================

export interface GenerateImageParameters {
  prompt: string;             // Prompt for image generation
  width?: number;
  height?: number;
  steps?: number;
  negative_prompt?: string;   // Negative prompt to encourage certain features
  images?: Base64Image[];     // Base64 encoded image(s) for image-to-image
  cfg_scale?: number;          // How closely the generated image should follow the prompt
  seed?: number;              // Random seed
}

export interface GenerateImageResponse {
  model: string;
  createdAt: string;
  data?: ImageData[];         // Array of generated images
  total_duration?: Nanoseconds;
  load_duration?: Nanoseconds;
  predict_duration?: Nanoseconds;
}

export interface ImageData {
  base64: Base64Image;        // Generated image as base64 string
}

// ==================== Common API Types ====================

export type APIToken = string | null;

export interface APIConfig {
  host?: string;              // Server hostname, default "localhost"
  port?: number;              // Server port, default 11434
  timeout?: number;           // Request timeout in milliseconds
  basepath?: string;          // Base path for Ollama server (default: "")
  token?: APIToken;           // Bearer authentication token
}

export interface APIStatus {
  status: string;
}

// ==================== Model Operation Status Types ====================

export interface ModelOperationStatus {
  model: string;              // Name of the model being created/copied/deleted/pulled/pushed
  digest?: string;            // Digest of blob being pulled or pushed
  remaining?: number;         // Number of bytes that remain to be downloaded/uploaded
  total?: number;             // Total bytes for download/upload operation
  status: string;             // Description of current status
}

// ==================== Type Guards and Helpers ====================
export function isChatMessage(obj: unknown): obj is ChatMessage {
  return typeof obj === 'object' && obj !== null && 'role' in obj && 'content' in obj;
}

export function isToolCall(obj: unknown): obj is ToolCall {
  return typeof obj === 'object' && obj !== null && 'function' in obj;
}

export function isGenerationOptions(obj: unknown): obj is GenerationOptions {
  return typeof obj === 'object' && obj !== null;
}

// ==================== Response Streaming Helpers ====================
export interface StreamResponse extends GenerateResponse, ChatResponse {
  // Union of all possible streaming response fields
}

export interface GenerationMetrics {
  numPromptTokens?: number;
  numGeneratedTokens?: number;
  promptEvalDuration?: Nanoseconds;
  evalDuration?: Nanoseconds;
  totalDuration?: Nanoseconds;
  loadDuration?: Nanoseconds;
}

export type CompletionTokenLogProbs = unknown;

export interface ChatRequestConfig {
  model: string;
  messages: Record<string, unknown>[];
}

export interface CreateModelParameters {
  model: string;
  from?: string;
  files?: Record<string, string>;
  adapters?: Record<string, string>;
  template?: string;
  license?: string | string[];
  system?: string;
  parameters?: object;
  messages?: ChatMessage[];
  quantize?: string;
}
