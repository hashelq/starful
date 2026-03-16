import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  MarkdownRenderable,
  TreeSitterClient,
  ASCIIFontRenderable,
  parseKeypress,
  createTextAttributes,
} from "@opentui/core";
import { createLLMProvider, type LLMProvider } from "../engine/llm/providers/index.js";
import { CodeBlock } from "./components/CodeBlock.js";
import {
  createMarkdownRenderable,
  getFormattedResponse,
  createThinkingElement,
  findCodeBlockDelimiter,
  createErrorMessage,
} from "./utils/chat-helpers.js";
import { NotificationsOverlay } from "./components/NotificationsOverlay.js";
import { SearchSuggestionsOverlay } from "./components/SearchSuggestionsOverlay.js";
import { PromptInput } from "./components/PromptInput.js";
import {
  createPromptModal,
  type PromptModal,
} from "./components/PromptModal.js";
import {
  SideBar,
  registerDefaultSidebarCategories,
} from "./components/SideBar.js";
import {
  createCommandRegistry,
  type CommandRegistry,
} from "../engine/commands/index.js";
import { COLORS, initColors, getDefaultSyntaxStyle } from "../engine/colors.js";
import { getTheme as getThemeFromConfig, isCentered, getCenteredWidth } from "../engine/ui-config.js";
import { subscribeToThemeChanges } from "../engine/theme.js";
import { TUIState } from "./state.js";
import { loadConfig, parseDefaultModel, getProviderConfig } from "../engine/config.js";
import { copyToClipboard } from "./clipboard.js";
import type { UIImplementation } from "../engine/ui.js";

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

// ============================================================================
// Main Application
// ============================================================================

// Recursively get selected text from renderable and its children
function getSelectedTextRecursive(renderable: any): string {
  if (!renderable) return "";
  
  // If this renderable has getSelectedText, try to use it
  if (typeof renderable.getSelectedText === 'function') {
    const text = renderable.getSelectedText();
    if (text && text.trim()) {
      return text;
    }
  }
  
  // Otherwise, try to get children and recurse
  if (typeof renderable.getChildren === 'function') {
    const children = renderable.getChildren();
    if (children && children.length > 0) {
      const texts: string[] = [];
      for (const child of children) {
        const childText = getSelectedTextRecursive(child);
        if (childText.trim()) {
          texts.push(childText);
        }
      }
      if (texts.length > 0) {
        return texts.join("\n");
      }
    }
  }
  
  return "";
}

async function main() {
  // AGENT: Initialize Tree-sitter for syntax highlighting in code blocks
  const treeSitterClient = new TreeSitterClient({
    dataPath: process.env.HOME
      ? `${process.env.HOME}/.local/share/opentui`
      : "/tmp/opentui",
  });
  await treeSitterClient.initialize();

  // AGENT: App state - message history and generation state
  const appState: { isGenerating: boolean } = {
    isGenerating: false,
  };
  const messages: Message[] = [];
  let currentAbortController: AbortController | null = null;

  // AGENT: Load configuration (has side effects like creating config file on first run)
  loadConfig();

  // AGENT: Initialize colors based on theme config
  initColors();

  // AGENT: Initialize LLM provider with config
  let { provider, model } = parseDefaultModel();
  console.log(`[main] parseDefaultModel() - provider: ${provider}, model: ${model}`);
  
  const providerConfig = getProviderConfig(provider);
  console.log(`[main] getProviderConfig(${provider}):`, providerConfig);
  
  let llmProvider: LLMProvider = createLLMProvider(
    providerConfig || { base: "ollama", host: "localhost", port: 11434, timeout: 120000 },
    model
  );
  console.log(`[main] llmProvider created:`, llmProvider.constructor.name);

  // Create CLI renderer with keyboard shortcuts
  const renderer = await createCliRenderer({
    targetFps: 60,
    useMouse: true,
    enableMouseMovement: true,
    autoFocus: true,
    exitOnCtrlC: false, // We'll handle Ctrl+C manually for stream cancellation
    prependInputHandlers: [
      (sequence) => {
        // Parse key with Kitty keyboard protocol support
        const key = parseKeypress(sequence, { useKittyKeyboard: true });

        // Check for Ctrl+C or Escape - cancel ongoing stream
        if (key && ((key.ctrl && key.name === "c") || key.name === "escape")) {
          if (appState.isGenerating && currentAbortController) {
            currentAbortController.abort();
            notifications.show({ message: "Stream cancelled", type: "info" });
            return true; // Stop propagation
          }
          // For Ctrl+C only: If not generating and input is empty, exit
          if (key.ctrl && key.name === "c" && !promptInput.input.value.trim()) {
            return false; // Let it propagate to exit
          }
          // Consume to prevent exit when input has content
          if (key.ctrl && key.name === "c") {
            return true;
          }
        }
        
        // Check for Ctrl+Q - quit the app
        if (key && key.ctrl && key.name === "q") {
          cleanup();
        }

        // Check for Ctrl+P
        if (key && key.ctrl && key.name === "p") {
          commandModal?.toggle();
          return true; // Stop propagation
        }

        // Global keyboard handler: focus input when typing
        // This allows modals to capture keyboard events when visible
        if (TUIState.currentInputFocused) {
          TUIState.currentInputFocused.focus();
        } else {
          promptInput.focus();
        }
        return false;
      },
    ],
  });

  // AGENT: Cleanup on exit - destroy renderer and kill process
  const cleanup = () => {
    console.log("\nShutting down Starful...\n");
    renderer.destroy();
    process.exit(0);
  };

  // Implement notifications
  let notifications: NotificationsOverlay;
  {
    notifications = new NotificationsOverlay(renderer, {
      position: "top",
    });
    renderer.root.add(notifications);
  }

  // Implement search suggestions overlay
  let searchSuggestions: SearchSuggestionsOverlay;
  {
    searchSuggestions = new SearchSuggestionsOverlay(renderer);
    renderer.root.add(searchSuggestions);
  }

  // Implement command modal (Ctrl+P)
  let commandModal: PromptModal;
  {
    // Create TUI-specific UI implementation
    const tuiUI: UIImplementation = {
      promptSelect: async (options: {
        title: string;
        items: string[];
        current?: string;
      }) => {
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

      focusInput: () => {
        promptInput.focus();
      },

      toggleConsole: () => {
        renderer.console.toggle();
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
      notifications.show({ message: `Model: ${model}` });
    };

    // Handle centered mode toggle - update UI objects
    const handleToggleCentered = (centered: boolean) => {
      const newWidth: number | "100%" = centered ? getCenteredWidth() : "100%";
      
      // Update scrollBox maxWidth
      scrollBox.maxWidth = newWidth;
      
      // Update inputContainer maxWidth
      inputContainer.maxWidth = newWidth;
      
      // Update contentContainer alignItems
      contentContainer.alignItems = centered ? "center" : "stretch";
      
      // Request render to update the UI
      renderer.requestRender?.();
    };

    // Handle model change - update the model variable for future requests
    const handleModelChange = (_newModel: string) => {
      const parsed = parseDefaultModel();
      provider = parsed.provider;
      model = parsed.model;
      
      // Reinitialize provider with new config
      const newProviderConfig = getProviderConfig(provider);
      llmProvider = createLLMProvider(
        newProviderConfig || { base: "ollama", host: "localhost", port: 11434, timeout: 120000 },
        model
      );
      
      notifications.show({ message: `Model changed to: ${model}`, type: "info" });
    };

    // Pass UI implementation to registry (ThemeCommand will use it)
    const registry = createCommandRegistry(renderer, tuiUI, {
      onClearChat: handleClearChat,
      onRevert: handleRevert,
      onShowModel: handleShowModel,
      onToggleCentered: handleToggleCentered,
      ollamaClient: llmProvider,
      onModelChange: handleModelChange,
    });

    // Set placeholders for command titles
    (registry as CommandRegistry).setPlaceholders({
      theme: getThemeFromConfig(),
      model: model,
      centered: isCentered() ? "ON" : "OFF",
    });

    commandModal = createPromptModal(renderer, {
      mode: {
        type: "commands",
        registry,
      },
      onClose: () => {
        promptInput.focus();
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

  // Implement copy selection - try mouse events with debugging
  {
    let selectionStart = { x: -1, y: -1 };
    
    renderer.root.onMouseDown = (event) => {
      selectionStart.x = event.x;
      selectionStart.y = event.y;
    };

    renderer.root.onMouseUp = async (event) => {
      // Check if there was actual mouse movement (selection)
      const hasMoved = selectionStart.x !== -1 && (
        Math.abs(event.x - selectionStart.x) > 1 || 
        Math.abs(event.y - selectionStart.y) > 1
      );
      
      if (!hasMoved) {
        selectionStart.x = -1;
        return;
      }
      
      // Get selected text recursively from root and its children
      const text = getSelectedTextRecursive(renderer.root);
      
      if (text && text.trim()) {
        const isOsc52Supported = renderer.isOsc52Supported?.() ?? false;
        await copyToClipboard(text, isOsc52Supported);
        notifications.show({ message: "Copied!", type: "info" });
      }
      
      // Always clear selection after copy attempt
      renderer.clearSelection();
      renderer.requestRender?.();
      selectionStart.x = -1;
    };
  }

  // AGENT: History container - holds all chat messages in a column layout
  // In centered mode, limit width for better readability
  const isCenteredMode = isCentered();
  const centeredWidth: number | "100%" = isCenteredMode ? getCenteredWidth() : "100%";
  const historyContainer = new BoxRenderable(renderer, {
    width: "100%",
    height: "auto",
    flexDirection: "column",
    paddingX: 2,
    gap: 1,
  });

  // AGENT: Banner container - centers the brand and subtitle
  const bannerContainer = new BoxRenderable(renderer, {
    width: "100%",
    height: "auto",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  });

  // AGENT: Figlet ASCII art banner - added to history so it scrolls with chat
  const figletBanner = new ASCIIFontRenderable(renderer, {
    text: "STARFUL",
    font: "block",
    color: COLORS.dimText,
  });

  // AGENT: Title banner - added to history so it scrolls with chat
  const titleText = new TextRenderable(renderer, {
    content: "TIP: you can /revert last changes",
    fg: COLORS.dimText,
  });

  // Add to banner container (centered)
  bannerContainer.add(figletBanner);
  bannerContainer.add(titleText);

  // Add to history container so they scroll with messages
  historyContainer.add(bannerContainer);

  // Add welcome message as markdown
  const welcomeMessage = `## Welcome to Starful

Your AI-powered terminal IDE. Here's what you can do:

### Quick Commands
- \`/theme\` - Switch color themes
- \`/model\` - Change AI model  
- \`/clear\` - Clear chat history

### AI Capabilities
- **File operations**: Read, write, edit files
- **Shell commands**: Run terminal commands
- **Code assistance**: Ask coding questions

> **Tip**: Press \`Ctrl+P\` to open the command palette

Start by asking me something!`;

  const welcomeMarkdown = new MarkdownRenderable(renderer, {
    width: "100%",
    height: "auto",
    content: welcomeMessage,
    syntaxStyle: getDefaultSyntaxStyle(),
    conceal: true,
    treeSitterClient,
  });
  historyContainer.add(welcomeMarkdown);

  // AGENT: ScrollBox wraps history container - enables vertical scrolling for long chats
  const scrollBox = new ScrollBoxRenderable(renderer, {
    maxWidth: centeredWidth,
    flexGrow: 1,
    scrollY: true,
    stickyScroll: true,
  });
  scrollBox.stickyStart = "bottom";
  scrollBox.add(historyContainer);

  // AGENT: Input container - box with border wrapping the text input
  const inputContainer = new BoxRenderable(renderer, {
    width: "100%",
    maxWidth: centeredWidth,
    paddingX: 2,
    paddingY: 1,
    height: 3,
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: 1,
  });

  // AGENT: Streams LLM response from Ollama - handles both thinking and content phases
  async function streamOllamaResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  ): Promise<void> {
    if (appState.isGenerating) return;
    appState.isGenerating = true;

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

      // Create AbortController for cancelling the stream
      currentAbortController = new AbortController();

      const chatStream = await llmProvider.chat(
        model,
        messagesForOllama,
        undefined,
        currentAbortController.signal,
      );
      let inCode: boolean = false;
      let languageLabel: null | TextRenderable = null;
      let codeLang = "";
      let codeBlock: CodeBlock | null = null;

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
            streamingThinkingElement = createThinkingElement(
              renderer,
              historyContainer,
            );
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
            streamingMarkdownContent = createMarkdownRenderable(
              renderer,
              treeSitterClient,
            );

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
              codeBlock = new CodeBlock(renderer, treeSitterClient, () =>
                promptInput.focus(),
              );
              const codeBlockDecorated = new BoxRenderable(renderer, {
                border: true,
                borderColor: COLORS.foreground,
              });
              codeBlockDecorated.add(codeBlock.renderable);
              historyContainer.add(codeBlockDecorated);

              streamingMarkdownContent = codeBlock.expandedMarkdown;
              streamingMarkdownContent2Fold = codeBlock.foldedMarkdown;
              languageLabel = codeBlock.languageLabel;
            } else {
              content = content.substring(codeTagIndex + 3);

              if (codeBlock)
                codeBlock.finalize();

              streamingMarkdownContent = createMarkdownRenderable(
                renderer,
                treeSitterClient,
              );
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

      }
    } catch (error) {
      // Check if this was an abort (Ctrl+C)
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled - don't show error, just add a note if we started streaming
        const hadContent =
          typeof contentStarted !== "undefined" && contentStarted;
        const hadThinking =
          typeof thinkingStarted !== "undefined" && thinkingStarted;

        if (hadContent || hadThinking) {
          const cancelMsg = createErrorMessage(renderer, "[Cancelled]");
          cancelMsg.fg = COLORS.textMuted; // Make it look like a muted message
          historyContainer.add(cancelMsg);
        }
        // If nothing started yet, just silently cancel
      } else {
        // Real error - show it
        let errorMessage = error instanceof Error ? error.message : "Ollama is not running";
        
        // Make error message more friendly
        if (errorMessage.includes("ECONNREFUSED")) {
          errorMessage = "Ollama is not running. Start it with 'ollama serve'";
        } else if (errorMessage.includes("fetch failed") || errorMessage.includes("network")) {
          errorMessage = "Could not connect to Ollama. Is it running on localhost:11434?";
        }
        
        const errorMsg = createErrorMessage(renderer, `Error: ${errorMessage}`);
        historyContainer.add(errorMsg);
      }
    } finally {
      appState.isGenerating = false;
      currentAbortController = null;
    }
  }

  // AGENT: Helper to generate random hash
  function generateFlowHash(): string {
    // Generate random 6-char hex hash
    const hash = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    return "#" + hash;
  }

  // AGENT: Helper to add user/assistant messages to history (non-streaming)
  function addStaticMessage(
    role: "user" | "assistant",
    content: string,
  ): TextRenderable {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

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

      // Flow position hash (blue highlight) - right side
      const flowHash = generateFlowHash();
      const hashText = new TextRenderable(renderer, {
        content: ` ${flowHash}`,
        fg: "#55aaff", // Blue color (color 4)
        attributes: createTextAttributes({ bold: true }),
      });

      const timestamp = new TextRenderable(renderer, {
        content: " " + time,
        fg: COLORS.dimText,
        attributes: createTextAttributes({ bold: true }),
      });

      // Subscribe message colors to theme changes
      subscribeToThemeChanges([
        { renderable: messageText, prop: "fg", colorKey: "userText" },
        { renderable: hashText, prop: "fg", colorKey: "accent" },
        { renderable: timestamp, prop: "fg", colorKey: "dimText" },
      ]);

      messageRow.add(messageText);
      messageRow.add(hashText);
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
        { renderable: messageText, prop: "fg", colorKey: "assistantText" },
      ]);

      historyContainer.add(messageText);
      messages.push({ role, content, renderable: messageText });

      renderer.requestRender?.();

      return messageText;
    }
  }

  // AGENT: Input field - using PromptInput component with history navigation
  const promptInput = new PromptInput(renderer, searchSuggestions, {
    isGenerating: () => appState.isGenerating,
    onExit: () => cleanup(),
    onSubmit: async (value: string) => {
      // Add user message to history
      addStaticMessage("user", ` ${value}`);

      // Build conversation history from existing messages
      const conversationHistory: Array<{
        role: "user" | "assistant";
        content: string;
      }> = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      // Stream the Ollama response
      await streamOllamaResponse(value, conversationHistory);
    },
  });

  // Focus the input
  promptInput.focus();

  // Add input to container (use the inner input renderable)
  inputContainer.add(promptInput.input);

  // AGENT: Main container - root layout with flexbox row (leftPane | content)
  const mainContainer = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    backgroundColor: COLORS.background,
    gap: 1,
  });

  // Left pane - hides on narrow terminals, with navigation callback
  // Register default sidebar categories first
  registerDefaultSidebarCategories();

  const sideBar = new SideBar(renderer, {
    width: 35,
    threshold: 80,
    onNavigate: (section: string) => {
      notifications.show({ message: `Navigate to: ${section}`, type: "info" });
    },
    isGeneratingFn: () => appState.isGenerating,
  });

  // Content container for the column layout (figlet, scrollbox, input)
  const contentContainer = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    padding: 1,
    gap: 1,
    alignItems: isCenteredMode ? "center" : "stretch",
  });

  // Add all children to content container in order: figlet -> title -> scroll/history -> input
  contentContainer.add(scrollBox);
  contentContainer.add(inputContainer);

  // Add left pane and content to main container
  mainContainer.add(sideBar.renderable);
  mainContainer.add(contentContainer);

  // AGENT: Mount main container to renderer's root (root is readonly, use .add())
  renderer.root.add(mainContainer);

  // AGENT: Add command modal LAST so it appears on top
  renderer.root.add(commandModal.renderable);

  // Subscribe all color properties to theme changes for automatic updates
  subscribeToThemeChanges([
    // Main container background
    {
      renderable: mainContainer,
      prop: "backgroundColor",
      colorKey: "background",
    },
    // Input container background
    {
      renderable: inputContainer,
      prop: "backgroundColor",
      colorKey: "surfaceAlt",
    },
    // Input colors - no background when typing
    { renderable: promptInput.input, prop: "textColor", colorKey: "inputText" },
    {
      renderable: promptInput.input,
      prop: "placeholderColor",
      colorKey: "placeholderText",
    },
    // Figlet banner
    { renderable: figletBanner, prop: "color", colorKey: "dimText" },
    // Title text
    { renderable: titleText, prop: "fg", colorKey: "dimText" },
    // History container (if has background)
    {
      renderable: historyContainer,
      prop: "backgroundColor",
      colorKey: "background",
    },
  ]);

  // AGENT: Start render loop - blocks until process exits
  renderer.auto();

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

// Export main function for external use
export { main };
