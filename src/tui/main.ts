import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  ScrollBoxRenderable,
  InputRenderableEvents,
  MarkdownRenderable,
  TreeSitterClient,
  CliRenderer,
  ASCIIFontRenderable,
} from "@opentui/core";
// AGENT: Mock Ollama client for testing (replace with real OllamaClient for production)
import { MockOllamaClient } from "../llm/implementations/mock-ollama-client.js";
import { CodeBlock } from "./components/CodeBlock.js";
import { getTextInRange } from "./utils/text-buffer.js";
import { createMarkdownRenderable, getFormattedResponse, createThinkingElement, findCodeBlockDelimiter, createErrorMessage } from "./utils/chat-helpers.js";
import { NotificationsOverlay } from "./components/NotificationsOverlay.js";
import { DEFAULT_MODEL, COLORS, defaultSyntaxStyle } from "./constants.js";

let notifications: NotificationsOverlay;

let dist = (x: number, y: number) => Math.abs(x - y);

// AGENT: Message interface for chat history - tracks role, content, and renderable reference
interface Message {
  role: "user" | "assistant";
  content: string;
  renderable: TextRenderable | MarkdownRenderable;
  isThinking?: boolean;
  thinkingContent?: string;
}

function createMD(renderer: CliRenderer, treeSitterClient: TreeSitterClient) {
  return new MarkdownRenderable(renderer, {
    width: "100%",
    height: "auto",
    content: "",
    syntaxStyle: defaultSyntaxStyle,
    streaming: true,
    conceal: true,
    treeSitterClient,
  });
}

async function main() {
  // AGENT: Initialize Tree-sitter for syntax highlighting in code blocks
  const treeSitterClient = new TreeSitterClient({
    dataPath: process.env.HOME
      ? `${process.env.HOME}/.local/share/opentui`
      : "/tmp/opentui",
  });
  await treeSitterClient.initialize();

  // AGENT: App state - message history and generation lock
  const messages: Message[] = [];
  let isGenerating = false;

  // AGENT: Mock Ollama client instance for testing
  const ollama = new MockOllamaClient({
    host: "localhost",
    port: 11434,
    timeout: 120000,
  });

  // AGENT: Create CLI renderer - core of the TUI application
  const renderer = await createCliRenderer({
    targetFps: 60,
    useMouse: true,
    enableMouseMovement: true, // Required for onMouseMove events
    autoFocus: true,
    exitOnCtrlC: true,
    prependInputHandlers: [
      (k) => {
        console.log(k);
        input.focus();
        return false;
      },
    ],
  });

  // implement notifications
  {
    notifications = new NotificationsOverlay(renderer, {
      position: "top",
    });
    renderer.root.add(notifications);
  }

  // Implement copy selection
  {
    let selectionStart = { x: -1, y: -1 };
    renderer.root.onMouseDown = (event) => {
      selectionStart.x = event.x;
      selectionStart.y = event.y;
    };

    renderer.root.onMouseUp = (event) => {
      if (selectionStart.x === -1) return;
      if (!dist(event.x, selectionStart.x) && !dist(event.y, selectionStart.y))
        return;
      let text = getTextInRange(
        renderer,
        event.x,
        event.y,
        selectionStart.x,
        selectionStart.y,
      );
      if (!text.trim()) return;
      renderer.copyToClipboardOSC52(text);
      notifications.show({
        message: "Copied!",
      });
      renderer.clearSelection();
      selectionStart.x = -1;
    };
  }

  // AGENT: History container - holds all chat messages in a column layout
  const historyContainer = new BoxRenderable(renderer, {
    width: "100%",
    height: "auto",
    flexDirection: "column",
    gap: 0,
  });

  // AGENT: Figlet ASCII art banner - added to history so it scrolls with chat
  const figletBanner = new ASCIIFontRenderable(renderer, {
    text: "STARFUL",
    font: "block",
      color: COLORS.assistantText,
  });

  // AGENT: Title banner - added to history so it scrolls with chat
  const titleText = new TextRenderable(renderer, {
    content: "TIP: you can /revert last changes",
    fg: COLORS.dimText,
  });

  // Add to history container so they scroll with messages
  historyContainer.add(figletBanner);
  historyContainer.add(titleText);

  // AGENT: ScrollBox wraps history container - enables vertical scrolling for long chats
  const scrollBox = new ScrollBoxRenderable(renderer, {
    width: "100%",
    flexGrow: 1,
    scrollY: true,
    stickyScroll: true,
  });
  scrollBox.stickyStart = "bottom";
  scrollBox.add(historyContainer);

  // AGENT: Input container - box with border wrapping the text input
  const inputContainer = new BoxRenderable(renderer, {
    width: "100%",
    paddingX: 2,
  });

  // AGENT: Streams LLM response from Ollama - handles both thinking and content phases
  async function streamOllamaResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  ): Promise<void> {
    if (isGenerating) return;
    isGenerating = true;

    try {
      // Prepare messages with system behavior injection
      const messagesForOllama: Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }> = [
        {
          role: "system",
          content:
            "You are a helpful AI assistant integrated into Starful, an AI-powered terminal IDE. You can help with coding tasks, explaining concepts, answering questions, and more. Provide detailed, accurate responses.",
        },
        ...conversationHistory.slice(-10), // Last 10 messages for context
        { role: "user", content: prompt },
      ];

      // Create placeholder markdown renderable for streaming content
      let streamingThinkingElement;
      let streamingMarkdownContent;

      let streamingMarkdownContent2Fold: MarkdownRenderable | null;

      let fullResponse = "";

      let thinkingStarted = false;
      let thinking = "";

      let contentStarted = false;
      let content = "";

      const chatStream = await ollama.chat(DEFAULT_MODEL, messagesForOllama);
      let inCode: boolean = false;
      let languageLabel: null | TextRenderable = null;
      let codeLang = "";

      let writeMarkDown = (content: string) => {
        let text = inCode ? `\`\`\`${content}\`\`\`` : content;
        streamingMarkdownContent!.content = text;
        if (streamingMarkdownContent2Fold)
          streamingMarkdownContent2Fold.content = text;
      };

      // Stream the response
      for await (const chunk of chatStream) {
        // Handle thinking phase
        if (chunk.message.thinking) {
          if (!thinkingStarted) {
            thinkingStarted = true;
            streamingThinkingElement = createThinkingElement(renderer, historyContainer);
          }
          thinking += chunk.message.thinking;
          streamingThinkingElement!.content = getFormattedResponse(
            thinking,
            "thinking",
          );
          renderer.requestRender();
          input.focus(); // AGENT: Keep input focused after render
        }
        // Handle content phase
        if (chunk.message.content) {
          if (!contentStarted) {
            contentStarted = true;

            // AGENT: Main content markdown (without code blocks - they get extracted)
            streamingMarkdownContent = createMarkdownRenderable(renderer, treeSitterClient);

            historyContainer.add(streamingMarkdownContent);

            if (thinkingStarted) {
              fullResponse += "\n";
            }
          }
          content += chunk.message.content;

          // AGENT: Parse ahead - extract complete code blocks immediately as they arrive
          const codeTagIndex = findCodeBlockDelimiter(content);
          if (codeTagIndex !== -1) {
            writeMarkDown(content.substring(0, codeTagIndex));

            if (!inCode) {
              content = content.substring(codeTagIndex + 3);

              // Create CodeBlock component
              const codeBlock = new CodeBlock(
                renderer,
                treeSitterClient,
                () => input.focus(),
              );
              historyContainer.add(codeBlock.renderable);

              streamingMarkdownContent = codeBlock.expandedMarkdown;
              streamingMarkdownContent2Fold = codeBlock.foldedMarkdown;
              languageLabel = codeBlock.languageLabel;
            } else {
              content = content.substring(codeTagIndex + 3);

              streamingMarkdownContent = createMarkdownRenderable(renderer, treeSitterClient);
              streamingMarkdownContent2Fold = null;

              historyContainer.add(streamingMarkdownContent);
            }

            inCode = !inCode;
          }

          // AGENT: This is a language detection with a language label on top.
          if (inCode && codeLang === "" && languageLabel) {
            let n = content.lastIndexOf("\n");
            if (n !== -1) {
              codeLang = content.substring(0, n + 1);
              languageLabel.content = `Code: ${codeLang}`;
            }
          }

          writeMarkDown(content);
        }

        input.focus(); // AGENT: Keep input focused after render
        renderer.requestRender();

        if (chunk.done) {
          break;
        }
      }
    } catch (error) {
      const errorMsg = createErrorMessage(
        renderer,
        `Error: ${error instanceof Error ? error.message : "Failed to connect to Ollama. Make sure it's running on localhost:11434"}`,
      );
      historyContainer.add(errorMsg);
    } finally {
      isGenerating = false;
    }
  }

  // AGENT: Helper to add user/assistant messages to history (non-streaming)
  function addStaticMessage(
    role: "user" | "assistant",
    content: string,
  ): TextRenderable {
    const messageText = new TextRenderable(renderer, {
      content: content,
      fg: role === "user" ? COLORS.userText : COLORS.assistantText,
    });

    historyContainer.add(messageText);
    messages.push({ role, content, renderable: messageText });

    renderer.requestRender?.();

    return messageText;
  }

  // AGENT: Input field - user types prompts here, CHANGE event fires on Enter
  const input = new InputRenderable(renderer, {
    width: "100%",
    placeholder: "> Ask me anything...",
    textColor: COLORS.inputText,
    placeholderColor: COLORS.placeholderText,
  });
  input.on(InputRenderableEvents.ENTER, async (val) => {
    const value = val.trim();

    if (value && !isGenerating) {
      // Add user message to history
      addStaticMessage("user", ` ${value}`);

      // Clear the input field
      input.value = "";

      // Build conversation history from existing messages
      const conversationHistory: Array<{
        role: "user" | "assistant";
        content: string;
      }> = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      // Stream the Ollama response
      await streamOllamaResponse(value, conversationHistory);

      // Focus input for next message
      setTimeout(() => input.focus(), 50);
    }

    return true; // Event handled
  });

  input.focus();

  // Add input to container
  inputContainer.add(input);

  // AGENT: Main container - root layout with flexbox column (title → scrollbox → input)
  const mainContainer = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    padding: 1,
    gap: 1,
  });

  // Add all children to main container in order: figlet -> title -> scroll/history -> input
  // AGENT: Add scrollable area and input to main container
  mainContainer.add(scrollBox);
  mainContainer.add(inputContainer);

  // AGENT: Mount main container to renderer's root (root is readonly, use .add())
  renderer.root.add(mainContainer);

  // AGENT: Start render loop - blocks until process exits
  renderer.auto();

  // AGENT: Cleanup on exit - destroy renderer and kill process
  const cleanup = () => {
    console.log("\nShutting down Starful...\n");
    renderer.destroy();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("Error starting TUI:", err);
  process.exit(1);
});
