import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  ScrollBoxRenderable,
  InputRenderableEvents,
  MarkdownRenderable,
  TreeSitterClient,
  ASCIIFontRenderable,
  parseKeypress,
  createTextAttributes,
} from "@opentui/core";
// AGENT: Mock Ollama client for testing (replace with real OllamaClient for production)
import { MockOllamaClient } from "../llm/implementations/mock-ollama-client.js";
import { CodeBlock } from "./components/CodeBlock.js";
import { getTextInRange } from "./utils/text-buffer.js";
import { createMarkdownRenderable, getFormattedResponse, createThinkingElement, findCodeBlockDelimiter, createErrorMessage } from "./utils/chat-helpers.js";
import { NotificationsOverlay } from "./components/NotificationsOverlay.js";
import { createPromptModal, type PromptModal } from "./components/PromptModal.js";
import { createCommandRegistry } from "../engine/commands/index.js";
import { COLORS, initColors } from "../engine/colors.js";
import { subscribeToThemeChanges } from "../engine/theme.js";
import { TUIState } from "./state.js";
import { loadConfig } from "../engine/config.js";

// ============================================================================
// Types
// ============================================================================

interface Message {
  role: "user" | "assistant";
  content: string;
  renderable: TextRenderable | MarkdownRenderable;
  isThinking?: boolean;
  thinkingContent?: string;
}

// ============================================================================
// Global State
// ============================================================================

let dist = (x: number, y: number) => Math.abs(x - y);

// ============================================================================
// Main Application
// ============================================================================

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

  // AGENT: Load configuration
  const config = loadConfig();

  // AGENT: Initialize colors based on theme config
  initColors();

  // AGENT: Mock Ollama client instance for testing
  const ollama = new MockOllamaClient({
    host: config.ollama.host,
    port: config.ollama.port,
    timeout: config.ollama.timeout,
  });

  // Create CLI renderer with keyboard shortcuts
  const renderer = await createCliRenderer({
    targetFps: 60,
    useMouse: true,
    enableMouseMovement: true,
    autoFocus: true,
    exitOnCtrlC: true,
    prependInputHandlers: [
      (sequence) => {
        // Parse key with Kitty keyboard protocol support
        const key = parseKeypress(sequence, { useKittyKeyboard: true });
        
        // Check for Ctrl+P
        if (key && key.ctrl && key.name === "p") {
          commandModal?.toggle();
          return true; // Stop propagation
        }
        
         // Global keyboard handler: only focus chat input if no modal is open
        // This allows modals to capture keyboard events when visible
        if (TUIState.currentInputFocused) {
          TUIState.currentInputFocused.focus();
        } else {
          input.focus();
        }
        return false;
      },
    ],
  });

  // Implement notifications
  let notifications: NotificationsOverlay;
  {
    notifications = new NotificationsOverlay(renderer, {
      position: "top",
    });
    renderer.root.add(notifications);
  }

  // Implement command modal (Ctrl+P)
  let commandModal: PromptModal;
  {
    // Create TUI-specific UI implementation
    const tuiUI = {
      promptSelect: async (options: { title: string; items: string[]; current?: string }) => {
        return new Promise<string | null>((resolve) => {
          const modal = createPromptModal(renderer, {
            mode: {
              type: "select",
              title: options.title,
              items: options.items,
              current: options.current,
            },
            onClose: () => {
              resolve(null);
            },
            onSelect: (id) => {
              resolve(id);
              modal.destroy();
            },
          });
          renderer.root.add(modal.renderable);
          modal.show();
        });
      },
      
      showNotification: (message: string) => {
        notifications.show({ message });
      },
    };

    // Create command handlers
    const handleClearChat = () => {
      notifications.show({ message: "Chat cleared!" });
    };

    const handleRevert = () => {
      notifications.show({ message: "Reverted last message!" });
    };

    const handleShowModel = () => {
      notifications.show({ message: `Model: ${config.model}` });
    };

    // Pass UI implementation to registry (ThemeCommand will use it)
    const registry = createCommandRegistry(renderer, tuiUI, {
      onClearChat: handleClearChat,
      onRevert: handleRevert,
      onShowModel: handleShowModel,
    });

    commandModal = createPromptModal(renderer, {
      mode: {
        type: "commands",
        registry,
      },
      onClose: () => {
        input.focus();
      },
      onSelect: (commandId) => {
        const cmd = registry.get(commandId);
        if (cmd) {
          cmd.handler();
        }
        commandModal.close();
      },
    });
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
    paddingX: 2,
    gap: 1,
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

      let thinkingStarted = false;
      let thinking = "";

      let contentStarted = false;
      let content = "";

      const chatStream = await ollama.chat(config.model, messagesForOllama);
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
        }
        // Handle content phase
        if (chunk.message.content) {
          if (!contentStarted) {
            contentStarted = true;

            // AGENT: Main content markdown (without code blocks - they get extracted)
            streamingMarkdownContent = createMarkdownRenderable(renderer, treeSitterClient);

            historyContainer.add(streamingMarkdownContent);

            if (thinkingStarted) {
              // Continuation after thinking
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
              const codeBlockDecorated = new BoxRenderable(renderer, {
                border: true,
                borderColor: COLORS.foreground
              });
              codeBlockDecorated.add(codeBlock.renderable);
              historyContainer.add(codeBlockDecorated);

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
              languageLabel.content = codeLang;
            }
          }

          writeMarkDown(content);
        }

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
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    if (role === "user") {
      // User message: row with content on left, timestamp on right
      const messageRow = new BoxRenderable(renderer, {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
      });

      const messageText = new TextRenderable(renderer, {
        content: "> " + content,
        fg: COLORS.userText,
        attributes: createTextAttributes({ bold: true }),
        flexGrow: 1,
      });

      const timestamp = new TextRenderable(renderer, {
        content: time,
        fg: COLORS.dimText,
        attributes: createTextAttributes({ bold: true }),
      });

      // Subscribe message colors to theme changes
      subscribeToThemeChanges([
        { renderable: messageText, prop: 'fg', colorKey: 'userText' },
        { renderable: timestamp, prop: 'fg', colorKey: 'dimText' },
      ]);

      messageRow.add(messageText);
      messageRow.add(timestamp);
      historyContainer.add(messageRow);
      messages.push({ role, content, renderable: messageText });
      
      renderer.requestRender?.();
      return messageText;
    } else {
      // Assistant message: simple text
      const messageText = new TextRenderable(renderer, {
        content: content,
        fg: COLORS.assistantText,
      });

      // Subscribe message colors to theme changes
      subscribeToThemeChanges([
        { renderable: messageText, prop: 'fg', colorKey: 'assistantText' },
      ]);

      historyContainer.add(messageText);
      messages.push({ role, content, renderable: messageText });

      renderer.requestRender?.();

      return messageText;
    }
  }

  // AGENT: Input field - user types prompts here, CHANGE event fires on Enter
  // No background color when typing - clean minimalist look
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
    backgroundColor: COLORS.background,
    padding: 1,
    gap: 1,
  });

  // Add all children to main container in order: figlet -> title -> scroll/history -> input
  // AGENT: Add scrollable area and input to main container
  mainContainer.add(scrollBox);
  mainContainer.add(inputContainer);

  // AGENT: Mount main container to renderer's root (root is readonly, use .add())
  renderer.root.add(mainContainer);

  // AGENT: Add command modal LAST so it appears on top
  renderer.root.add(commandModal.renderable);

  // Subscribe all color properties to theme changes for automatic updates
  subscribeToThemeChanges([
    // Main container background
    { renderable: mainContainer, prop: 'backgroundColor', colorKey: 'background' },
    // Input colors - no background when typing
    { renderable: input, prop: 'textColor', colorKey: 'inputText' },
    { renderable: input, prop: 'placeholderColor', colorKey: 'placeholderText' },
    // Figlet banner
    { renderable: figletBanner, prop: 'color', colorKey: 'assistantText' },
    // Title text
    { renderable: titleText, prop: 'fg', colorKey: 'dimText' },
    // History container (if has background)
    { renderable: historyContainer, prop: 'backgroundColor', colorKey: 'background' },
  ]);

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
