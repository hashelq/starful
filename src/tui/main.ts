import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  ScrollBoxRenderable,
  InputRenderableEvents,
  MarkdownRenderable,
  SyntaxStyle,
  TreeSitterClient,
  StyledText,
  CliRenderer,
  createTextAttributes,
  TabSelectRenderable,
  ASCIIFontRenderable,
  ScrollBox,
} from "@opentui/core";
// AGENT: Mock Ollama client for testing (replace with real OllamaClient for production)
import { MockOllamaClient } from "../llm/implementations/mock-ollama-client.js";
import { FoldableBox } from "./components/FoldableBox.js";
import { getTextInRange } from "./utils/text-buffer.js";
import { NotificationsOverlay } from "./components/NotificationsOverlay.js";

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

// AGENT: Default model - change this to use a different Ollama model
const DEFAULT_MODEL = "Qwen3.5-27B.Q4_K_M__opus4.6_dist:latest";

// AGENT: Dracula-inspired syntax theme for code/markdown highlighting (via Tree-sitter)
const defaultSyntaxStyle = SyntaxStyle.fromTheme([
  // ========== Strings =========
  { scope: ["string"], style: { foreground: "#a5d6ff" } },
  { scope: ["string.quoted"], style: { foreground: "#7ee787" } },
  { scope: ["string-constant"], style: { foreground: "#ffa657" } },
  { scope: ["string.regexp"], style: { foreground: "#79c0ff" } },

  // ========== Keywords =========
  { scope: ["keyword"], style: { foreground: "#ff79c6", bold: true } },
  { scope: ["keyword.control"], style: { foreground: "#ff79c6" } },
  { scope: ["keyword.flow"], style: { foreground: "#ff79c6" } },

  // ========== Numbers, Types, Variables =========
  { scope: ["number"], style: { foreground: "#bd93f9" } },
  { scope: ["type"], style: { foreground: "#8be9fd" } },
  { scope: ["variable"], style: { foreground: "#ffb86c" } },

  // ========== Functions & Methods =========
  { scope: ["function"], style: { foreground: "#50fa7b", bold: true } },
  { scope: ["function.call"], style: { foreground: "#50fa7b" } },
  { scope: ["method"], style: { foreground: "#8be9fd" } },

  // ========== Comments =========
  { scope: ["comment"], style: { foreground: "#6272a4", italic: true } },
  { scope: ["doc-comment"], style: { foreground: "#6272a4" } },

  // ========== Operators =========
  { scope: ["operator"], style: { foreground: "#fff" } },
  { scope: ["punctuation.separator"], style: { foreground: "#f8f8f2" } },

  // ========== Classes, Constants, Namespaces =========
  { scope: ["class"], style: { foreground: "#ffb86c", bold: true } },
  { scope: ["namespace"], style: { foreground: "#50fa7b" } },
  { scope: ["constant"], style: { foreground: "#bd93f9" } },

  // ========== Markdown-specific (CLI-friendly) =========
  // Headers - bold + bright colors for visibility in terminal
  { scope: ["markup.heading"], style: { bold: true, foreground: "#50fa7b" } }, // Green bold
  {
    scope: ["markup.heading.1"],
    style: { bold: true, foreground: "#ff79c6", underline: true },
  }, // Pink bold underline
  { scope: ["markup.heading.2"], style: { bold: true, foreground: "#bd93f9" } }, // Purple bold
  { scope: ["markup.heading.3"], style: { bold: true, foreground: "#8be9fd" } }, // Cyan bold
  { scope: ["markup.heading.4"], style: { bold: true, foreground: "#ffb86c" } }, // Orange bold
  { scope: ["markup.heading.5"], style: { bold: true, foreground: "#f1fa8c" } }, // Yellow bold
  { scope: ["markup.heading.6"], style: { bold: true, foreground: "#ff5555" } }, // Red bold

  // Text formatting
  { scope: ["markup.bold"], style: { bold: true, foreground: "#f8f8f2" } }, // White bold
  { scope: ["markup.italic"], style: { italic: true, foreground: "#f8f8f2" } }, // White italic
  {
    scope: ["markup.strikethrough"],
    style: { dim: true, foreground: "#6272a4" },
  }, // Gray strikethrough
  {
    scope: ["markup.underline"],
    style: { underline: true, foreground: "#8be9fd" },
  }, // Cyan underline

  // Links
  { scope: ["markup.link"], style: { underline: true, foreground: "#8be9fd" } }, // Cyan underline
  {
    scope: ["markup.link.url"],
    style: { foreground: "#79c0ff", underline: true },
  }, // Blue underline
  { scope: ["markup.uri"], style: { foreground: "#79c0ff" } }, // Blue

  // Quotes & Lists
  { scope: ["markup.quote"], style: { italic: true, foreground: "#bd93f9" } }, // Purple italic
  { scope: ["markup.list"], style: { foreground: "#ff79c6" } }, // Pink

  // Code (inline & fences)
  {
    scope: ["markup.raw"],
    style: { foreground: "#f1fa8c", background: "#44475a" },
  }, // Yellow bg
  {
    scope: ["markup.raw.code-fence"],
    style: { bold: true, foreground: "#ff79c6" },
  }, // Pink bold fence
  {
    scope: ["markup.raw.inline"],
    style: { foreground: "#f1fa8c", background: "#282a36" },
  }, // Yellow on dark

  // ========== Code fences (```) =========
  {
    scope: ["markup.raw.code-fence"],
    style: { bold: true, foreground: "#ff5555" },
  },
  { scope: ["markup.raw"], style: { foreground: "#f1fa8c" } },
]);

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

// AGENT: Placeholder function - can be extended to format thinking vs content differently
function getFormattedResponse(data: string, t: "content" | "thinking"): string {
  switch (t) {
    case "content":
      return data;
    case "thinking":
      return data;
  }
}

function mergeLLMResponse(...data: string[]): string {
  return data.join("\n");
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
    color: "#a5d6ff",
  });

  // AGENT: Title banner - added to history so it scrolls with chat
  const titleText = new TextRenderable(renderer, {
    content: "TIP: you can /revert last changes",
    fg: "#8b949e",
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
            streamingThinkingElement = new TextRenderable(renderer, {
              width: "100%",
              height: "auto",
              content: "",
              fg: "gray",
            });
            historyContainer.add(streamingThinkingElement);
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
            streamingMarkdownContent = createMD(renderer, treeSitterClient);

            historyContainer.add(streamingMarkdownContent);

            if (thinkingStarted) {
              fullResponse += "\n";
            }
          }
          content += chunk.message.content;

          // AGENT: Parse ahead - extract complete code blocks immediately as they arrive
          const codeTagIndex = content.lastIndexOf("```");
          if (codeTagIndex !== -1) {
            writeMarkDown(content.substring(0, codeTagIndex));

            if (!inCode) {
              content = content.substring(codeTagIndex + 3);
              let topBar = new BoxRenderable(renderer, {
                width: "100%",
                flexDirection: "row",
              });
              let buttonCopy = new TextRenderable(renderer, {
                content: " COPY ",
                paddingRight: 1,
                bg: "#44475a",
                fg: "#f8f8f2",
              });
              let codeMarkdown: MarkdownRenderable;
              buttonCopy.onMouseUp = () => {
                if (codeMarkdown.content) {
                  // Strip markdown code fences: ```language at start and ``` at end
                  let code = codeMarkdown.content;
                  // Remove opening fence with optional language
                  code = code.replace(/^```\w*\n?/, "");
                  // Remove closing fence
                  code = code.replace(/```$/, "");
                  renderer.copyToClipboardOSC52?.(code);
                  input.focus();
                  buttonCopy.content = " COPIED! ";
                  renderer.requestRender?.();
                  setTimeout(() => {
                    buttonCopy.content = " COPY ";
                    renderer.requestRender?.();
                  }, 1500);
                }
              };
              let rightBar = new BoxRenderable(renderer, {
                alignItems: "flex-end",
                flexGrow: 1,
              });
              rightBar.add(buttonCopy);

              languageLabel = new TextRenderable(renderer, {
                content: "",
                fg: "lime",
                attributes: createTextAttributes({ bold: true }),
              });
              codeLang = "";

              // AGENT: Create Box with gray bg for code block - IMMEDIATELY when detected
              const codeBox = new BoxRenderable(renderer, {
                width: "100%",
                height: "auto",
                backgroundColor: "#1e1e1e",
                padding: 1,
              });

              // AGENT: Markdown renderable for the code block
              codeMarkdown = new MarkdownRenderable(renderer, {
                width: "100%",
                height: "auto",
                content: "",
                syntaxStyle: defaultSyntaxStyle,
                streaming: false,
                conceal: true,
                treeSitterClient,
              });

              streamingMarkdownContent2Fold = new MarkdownRenderable(renderer, {
                width: "100%",
                height: "auto",
                content: "",
                syntaxStyle: defaultSyntaxStyle,
                streaming: false,
                conceal: true,
                treeSitterClient,
              });

              topBar.add(languageLabel);
              topBar.add(rightBar);
              codeBox.add(topBar);
              let fold = new FoldableBox(renderer, { 
                foldTitle: "code",
                expandOnly: true 
              });
              fold.setContent(codeMarkdown);

              // implement folded view
              {
                let foldedScroll = new ScrollBoxRenderable(renderer, {
                  width: "100%",
                  height: 4,
                  scrollY: true,
                  stickyScroll: true,
                });
                foldedScroll.add(streamingMarkdownContent2Fold);
                fold.setPlaceholder(foldedScroll);
              }
              codeBox.add(fold);
              historyContainer.add(codeBox);

              streamingMarkdownContent = codeMarkdown;
            } else {
              content = content.substring(codeTagIndex + 3);

              streamingMarkdownContent = createMD(renderer, treeSitterClient);
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
      const errorMsg = new TextRenderable(renderer, {
        content: `Error: ${error instanceof Error ? error.message : "Failed to connect to Ollama. Make sure it's running on localhost:11434"}`,
        fg: "#f85149", // Red for errors
      });
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
      fg: role === "user" ? "#3fb950" : "#a5d6ff", // Green for user, Blue for assistant
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
    textColor: "#f0f6fc",
    placeholderColor: "#90969d",
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
