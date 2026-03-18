import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  MarkdownRenderable,
  TreeSitterClient,
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
import {
  createPromptModal,
  type PromptModal,
} from "./components/PromptModal.js";
import {
  LeftSideBar,
  registerDefaultLeftSidebarCategories,
} from "./components/left-sidebar/LeftSideBar.js";
import { RightSideBar } from "./components/right-sidebar/RightSideBar.js";
import { ContentArea } from "./components/content-area/index.js";
import {
  createCommandRegistry,
  type CommandRegistry,
} from "../engine/commands/index.js";
import { COLORS, initColors } from "../engine/colors.js";
import { getTheme as getThemeFromConfig, isCentered, getCenteredWidth } from "../engine/ui-config.js";
import { subscribeToThemeChanges } from "../engine/theme.js";
import { TUIState } from "./state.js";
import { loadConfig, parseDefaultModel, getProviderConfig } from "../engine/config.js";
import { Engine } from "../engine/Engine.js";
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
  y?: number;       // Y position in container
  height?: number;  // Message height
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

  // AGENT: Create Engine instance (for commands and future migration)
  const engine = new Engine({
    systemPrompt: "You are a helpful AI assistant integrated into Starful, an AI-powered terminal IDE. You can help with coding tasks, explaining concepts, answering questions, and more. Provide detailed, accurate responses.",
  });
  console.log(`[main] Engine created`);

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
          if (key.ctrl && key.name === "c" && !contentArea.inputArea.promptInput.input.value.trim()) {
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
          contentArea.focusInput();
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
    // Add to inputContainer for relative positioning (allows overflow above)
    // We'll add it after inputContainer is created
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
        contentArea.focusInput();
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
      contentArea.scrollBox.maxWidth = newWidth;
      
      // Update inputContainer maxWidth
      contentArea.inputArea.container.maxWidth = newWidth;
      
      // Update model display container maxWidth
      contentArea.inputArea.modelDisplayContainer.maxWidth = newWidth;
      
      // Update contentContainer alignItems
      contentArea.container.alignItems = centered ? "center" : "stretch";
      
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
      
      // Update model display
      contentArea.setModelDisplay(provider, model);
      
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
        contentArea.focusInput();
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

  // AGENT: Content Area - Contains banner, welcome, chat history, input, model display
  const isCenteredMode = isCentered();
  const centeredWidth: number | "100%" = isCenteredMode ? getCenteredWidth() : "100%";

  // Helper function to update active prompt based on scroll position
  function updateActivePromptOnScroll() {
    const viewportTop = contentArea.scrollBox.scrollTop;
    const viewportHeight = 20; // Approximate visible height
     
    // Find visible user message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || msg.role !== "user") continue;
      
      const msgY = msg.renderable.y;
      const msgHeight = msg.height || 1;
      const msgBottom = msgY + msgHeight;
      
      // Check if message is in viewport
      const isVisible = msgBottom > viewportTop && msgY < viewportTop + viewportHeight;
      
      if (isVisible) {
        rightSideBar.setActivePrompt(i);
        break;
      }
    }
  }

  // Create ContentArea - combines banner, welcome, chat history, input, and model display
  const contentArea = new ContentArea(renderer, searchSuggestions, {
    centeredWidth,
    provider: provider,
    model: model,
    treeSitterClient,
    isGenerating: () => appState.isGenerating,
    onExit: () => cleanup(),
    onSubmit: async (value: string) => {
      // Check if it's a command (starts with /)
      if (value.startsWith("/")) {
        const result = await engine.executeCommandString(value);
        if (!result.success) {
          addStaticMessage("assistant", ` Error: ${result.error || "Unknown error"}`);
        }
        return;
      }

      // Add user message to history (includes adding to right sidebar)
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
    onScroll: updateActivePromptOnScroll,
  });
    
    // AGENT: Streams LLM response from Ollama - handles both thinking and content phases
  async function streamOllamaResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  ): Promise<void> {
    if (appState.isGenerating) return;
    appState.isGenerating = true;

    // Declare at function scope so catch block can access them
    let thinkingStarted = false;
    let contentStarted = false;

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
              contentArea.chatHistory.container,
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

            contentArea.addToHistory(streamingMarkdownContent);

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
                contentArea.focusInput(),
              );
              const codeBlockDecorated = new BoxRenderable(renderer, {
                border: true,
                borderColor: COLORS.foreground,
              });
              codeBlockDecorated.add(codeBlock.renderable);
              contentArea.addToHistory(codeBlockDecorated);

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

              contentArea.addToHistory(streamingMarkdownContent);
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
          contentArea.addToHistory(cancelMsg);
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
        contentArea.addToHistory(errorMsg);
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

    // Check if this is the last message
    const isLastMessage = messages.length === 0;

    if (role === "user") {
      // User message: row with content on left, timestamp on right
      const messageRow = new BoxRenderable(renderer, {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 1,
      });

      const messageText = new TextRenderable(renderer, {
        content: "> " + content,
        fg: COLORS.userText,
        attributes: createTextAttributes({ bold: isLastMessage }),
        flexGrow: 1,
      });

      // Flow position hash (blue highlight) - right side
      const flowHash = generateFlowHash();
      const hashText = new TextRenderable(renderer, {
        content: ` ${flowHash}`,
        fg: "#55aaff", // Blue color (color 4)
        attributes: createTextAttributes({ bold: isLastMessage }),
      });

      const timestamp = new TextRenderable(renderer, {
        content: " " + time,
        fg: COLORS.dimText,
        attributes: createTextAttributes({ bold: isLastMessage }),
      });

      // Subscribe message colors to theme changes
      subscribeToThemeChanges([
        { renderable: messageText, prop: "fg", colorKey: "userText" },
        { renderable: hashText, prop: "fg", colorKey: "accent" },
        { renderable: timestamp, prop: "fg", colorKey: "dimText" },
      ]);

      messageRow.add(messageText);
      contentArea.addToHistory(messageRow);
       
      // Store spatial data for scroll tracking
      const msgIndex = messages.length;
      const newMessage = { role, content, renderable: messageText };
      messages.push(newMessage);
      // Note: y and height will be updated after render via onUpdate or scroll

      // Update right sidebar with this message index
      rightSideBar.addPrompt(content, msgIndex);

      renderer.requestRender?.();
      return messageText;
    } else {
      // Assistant message: container with padding
      const messageContainer = new BoxRenderable(renderer, {
        width: "100%",
        padding: 1,
      });

      const messageText = new TextRenderable(renderer, {
        content: content,
        fg: COLORS.assistantText,
        attributes: createTextAttributes({ bold: isLastMessage }),
      });

      // Subscribe message colors to theme changes
      subscribeToThemeChanges([
        { renderable: messageText, prop: "fg", colorKey: "assistantText" },
      ]);

      messageContainer.add(messageText);
      contentArea.addToHistory(messageContainer);
      messages.push({ role, content, renderable: messageText });

      // Update right sidebar history
      rightSideBar.updateHistory(messages);

      renderer.requestRender?.();

      return messageText;
    }
  }

  // Focus the input
  contentArea.focusInput();

  // Set input container reference for suggestions overlay positioning
  searchSuggestions.setInputContainerReference(contentArea.inputArea.container);

  // AGENT: Main container - root layout with flexbox row (leftPane | content)
  const mainContainer = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    backgroundColor: COLORS.background,
    gap: 1,
  });

  // Left pane - hides on narrow terminals, with navigation callback
  // Register default left sidebar categories first
  registerDefaultLeftSidebarCategories();

  const sideBar = new LeftSideBar(renderer, {
    width: 35,
    threshold: 128,
    onNavigate: (section: string) => {
      notifications.show({ message: `Navigate to: ${section}`, type: "info" });
    },
    isGeneratingFn: () => appState.isGenerating,
  });

  // Right sidebar - shows file explorer, git status, etc.
  const rightSideBar = new RightSideBar(renderer, {
    width: 30,
    threshold: 128,
    onPromptClick: (index: number) => {
      // Scroll to the message in the main scrollBox
      const targetMessage = messages[index];
      if (targetMessage?.renderable) {
        // Get the Y position of the message and scroll to it
        contentArea.scrollBox.scrollTop = targetMessage.renderable.y;
        // Set this prompt as active (bold) in right sidebar
        rightSideBar.setActivePrompt(index);
      }
    },
  });

  // Add content area and sidebars to main container
  mainContainer.add(sideBar.renderable);
  mainContainer.add(contentArea.container);
  mainContainer.add(rightSideBar.renderable);

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
      renderable: contentArea.inputArea.container,
      prop: "backgroundColor",
      colorKey: "surfaceAlt",
    },
    // Input colors - no background when typing
    { renderable: contentArea.inputArea.promptInput.input, prop: "textColor", colorKey: "inputText" },
    {
      renderable: contentArea.inputArea.promptInput.input,
      prop: "placeholderColor",
      colorKey: "placeholderText",
    },
    // Figlet banner
    { renderable: contentArea.banner.figletBanner, prop: "color", colorKey: "dimText" },
    // Title text
    { renderable: contentArea.banner.titleText, prop: "fg", colorKey: "dimText" },
    // Model display
    { renderable: contentArea.inputArea.modelDisplay, prop: "fg", colorKey: "accent" },
    // History container (if has background)
    {
      renderable: contentArea.chatHistory.container,
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
