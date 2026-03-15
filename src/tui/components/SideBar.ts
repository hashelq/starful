import {
  BoxRenderable,
  CliRenderer,
  TextRenderable,
  ScrollBoxRenderable,
  createTextAttributes,
} from "@opentui/core";
import { COLORS } from "../../engine/colors.js";
import { subscribeToThemeChanges } from "../../engine/theme.js";

/**
 * PaneButton - A clickable button for the sidebar
 */
class PaneButton {
  private _button: BoxRenderable;
  private _label: TextRenderable;
  private _onClick?: () => void;
  private _selected: boolean = false;
  private _renderer: CliRenderer;

  constructor(
    renderer: CliRenderer,
    options: {
      icon: string;
      label: string;
      onClick?: () => void;
    },
  ) {
    this._renderer = renderer;
    this._onClick = options.onClick;

    // Button container
    this._button = new BoxRenderable(renderer, {
      width: "100%",
      height: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingX: 1,
      paddingY: 0,
    });

    // Label only (no icon)
    this._label = new TextRenderable(renderer, {
      content: options.label,
      fg: COLORS.text,
    });

    this._button.add(this._label);

    // Click handler
    this._button.onMouseUp = () => {
      this._onClick?.();
    };

    // Hover effect
    this._button.onMouseOver = () => {
      this._button.backgroundColor = COLORS.surfaceAlt;
      this._renderer.requestRender?.();
    };

    this._button.onMouseOut = () => {
      this._button.backgroundColor = this._selected ? COLORS.primary : "transparent";
      this._renderer.requestRender?.();
    };
  }

  get renderable(): BoxRenderable {
    return this._button;
  }

  setSelected(selected: boolean): void {
    this._selected = selected;
    this._button.backgroundColor = selected ? COLORS.primary : "transparent";
    this._label.fg = selected ? COLORS.background : COLORS.text;
  }
}

/**
 * PaneSection - A collapsible section with a title and buttons
 * No triangle indicator, custom background colors
 */
class PaneSection {
  private _section: BoxRenderable;
  private _title: TextRenderable;
  private _buttons: PaneButton[] = [];
  private _buttonsContainer: BoxRenderable;
  private _headerBox: BoxRenderable;
  private _folded: boolean = false;
  private _renderer: CliRenderer;

  constructor(
    renderer: CliRenderer,
    options: {
      title: string;
      buttons: Array<{ icon: string; label: string; onClick?: () => void }>;
    },
  ) {
    this._renderer = renderer;

    // Section container
    this._section = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });

    // Header box - brighter background when unfolded
    this._headerBox = new BoxRenderable(renderer, {
      width: "100%",
      height: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.surfaceAlt, // lighter when folded
    });

    // Section title - brighter color
    this._title = new TextRenderable(renderer, {
      content: options.title.toUpperCase(),
      fg: COLORS.text,
      attributes: createTextAttributes({ bold: true }),
    });

    this._headerBox.add(this._title);
    this._section.add(this._headerBox);

    // Header click toggles fold
    this._headerBox.onMouseUp = () => {
      this.toggle();
    };

    // Header hover effect - brighter background
    this._headerBox.onMouseOver = () => {
      this._headerBox.backgroundColor = COLORS.buttonBg;
      this._renderer.requestRender?.();
    };

    this._headerBox.onMouseOut = () => {
      // Restore based on folded state
      this._headerBox.backgroundColor = this._folded
        ? COLORS.surfaceAlt
        : COLORS.buttonBg;
      this._renderer.requestRender?.();
    };

    // Buttons container
    this._buttonsContainer = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });

    // Add buttons
    for (const btn of options.buttons) {
      const button = new PaneButton(renderer, {
        icon: btn.icon,
        label: btn.label,
        onClick: () => {
          // Expand when button clicked
          if (this._folded) {
            this.toggle();
          }
          btn.onClick?.();
        },
      });
      this._buttons.push(button);
      this._buttonsContainer.add(button.renderable);
    }

    this._section.add(this._buttonsContainer);

    // Initially show buttons (unfolded by default)
    this._buttonsContainer.visible = true;
    this._headerBox.backgroundColor = COLORS.buttonBg; // brighter when unfolded
  }

  toggle(): void {
    this._folded = !this._folded;
    this._buttonsContainer.visible = !this._folded;

    // Brighter background when unfolded
    this._headerBox.backgroundColor = this._folded
      ? COLORS.surfaceAlt
      : COLORS.buttonBg;

    this._renderer.requestRender?.();
  }

  get renderable(): BoxRenderable {
    return this._section;
  }

  get buttons(): PaneButton[] {
    return this._buttons;
  }
}

/**
 * LeftPane - A sophisticated sidebar pane with multiple sections and interactive buttons
 */
export class SideBar {
  private _pane: BoxRenderable;
  private _scrollBox: ScrollBoxRenderable;
  private _sectionsContainer: BoxRenderable;
  private _renderer: CliRenderer;
  private _sections: PaneSection[] = [];
  private _width: number;
  private _threshold: number;
  private _activeButton: string = "chat";

  constructor(
    renderer: CliRenderer,
    options?: {
      width?: number;
      threshold?: number;
      onNavigate?: (section: string) => void;
    },
  ) {
    this._renderer = renderer;
    this._width = options?.width ?? 30;
    this._threshold = options?.threshold ?? 120;

    // Create the left pane container (auto height, not stretch)
    this._pane = new BoxRenderable(renderer, {
      width: this._width,
      height: "auto",
      backgroundColor: COLORS.surfaceAlt,
      flexDirection: "column",
      gap: 0,
    });

    // Scroll box for sections
    this._scrollBox = new ScrollBoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      scrollY: true,
    });

    // Container for all sections
    this._sectionsContainer = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });

    this._scrollBox.add(this._sectionsContainer);
    this._pane.add(this._scrollBox);

    // Build all sections
    this._buildSections(options?.onNavigate);

    // Subscribe to theme changes
    subscribeToThemeChanges([
      {
        renderable: this._pane,
        prop: "backgroundColor",
        colorKey: "surfaceAlt",
      },
    ]);

    // Set initial visibility
    this._updateVisibility();

    // Listen for resize
    renderer.on("resize", () => {
      this._updateVisibility();
    });
  }

  private _buildSections(onNavigate?: (section: string) => void): void {
    // === THIS WORKSPACE ===
    const workspaceSection = new PaneSection(this._renderer, {
      title: "This Workspace",
      buttons: [
        { icon: "💬", label: "Chats", onClick: () => this._handleNav("chats", onNavigate) },
        { icon: "📊", label: "Visualize", onClick: () => this._handleNav("visualize", onNavigate) },
        { icon: "⚙️", label: "Project Config", onClick: () => this._handleNav("projectconfig", onNavigate) },
      ],
    });
    this._sections.push(workspaceSection);
    this._sectionsContainer.add(workspaceSection.renderable);

    // === AI & CHAT ===
    const aiSection = new PaneSection(this._renderer, {
      title: "AI & Chat",
      buttons: [
        { icon: "💬", label: "Chat", onClick: () => this._handleNav("chat", onNavigate) },
        { icon: "🤖", label: "Agents", onClick: () => this._handleNav("agents", onNavigate) },
        { icon: "🧠", label: "Models", onClick: () => this._handleNav("models", onNavigate) },
        { icon: "⚡", label: "Prompts", onClick: () => this._handleNav("prompts", onNavigate) },
      ],
    });
    this._sections.push(aiSection);
    this._sectionsContainer.add(aiSection.renderable);

    // === WORKFLOWS ===
    const workflowsSection = new PaneSection(this._renderer, {
      title: "Config",
      buttons: [
        {
          icon: "🤖",
          label: "Agents",
          onClick: () => this._handleNav("agents", onNavigate),
        },
        {
          icon: "🧠",
          label: "Models",
          onClick: () => this._handleNav("models", onNavigate),
        },
        {
          icon: "⚡",
          label: "Aliases",
          onClick: () => this._handleNav("aliases", onNavigate),
        },
        {
          icon: "🔄",
          label: "Pipelines",
          onClick: () => this._handleNav("pipelines", onNavigate),
        },
        {
          icon: "📋",
          label: "Templates",
          onClick: () => this._handleNav("templates", onNavigate),
        },
        {
          icon: "▶️",
          label: "Run History",
          onClick: () => this._handleNav("runhistory", onNavigate),
        },
      ],
    });
    this._sections.push(workflowsSection);
    this._sectionsContainer.add(workflowsSection.renderable);

    // === DEVELOPMENT ===
    const devSection = new PaneSection(this._renderer, {
      title: "Development",
      buttons: [
        {
          icon: "📁",
          label: "Files",
          onClick: () => this._handleNav("files", onNavigate),
        },
        {
          icon: "💻",
          label: "Terminal",
          onClick: () => this._handleNav("terminal", onNavigate),
        },
        {
          icon: "🔧",
          label: "Debug",
          onClick: () => this._handleNav("debug", onNavigate),
        },
        {
          icon: "🐙",
          label: "Git",
          onClick: () => this._handleNav("git", onNavigate),
        },
        {
          icon: "📦",
          label: "Packages",
          onClick: () => this._handleNav("packages", onNavigate),
        },
      ],
    });
    this._sections.push(devSection);
    this._sectionsContainer.add(devSection.renderable);

    // === AUTOMATION ===
    const autoSection = new PaneSection(this._renderer, {
      title: "Automation",
      buttons: [
        {
          icon: "🔌",
          label: "API Test",
          onClick: () => this._handleNav("apitest", onNavigate),
        },
        {
          icon: "🗄️",
          label: "Database",
          onClick: () => this._handleNav("database", onNavigate),
        },
        {
          icon: "🔐",
          label: "Secrets",
          onClick: () => this._handleNav("secrets", onNavigate),
        },
        {
          icon: "📨",
          label: "Webhooks",
          onClick: () => this._handleNav("webhooks", onNavigate),
        },
        {
          icon: "⏰",
          label: "Cron Jobs",
          onClick: () => this._handleNav("cron", onNavigate),
        },
      ],
    });
    this._sections.push(autoSection);
    this._sectionsContainer.add(autoSection.renderable);

    // === ANALYTICS ===
    const analyticsSection = new PaneSection(this._renderer, {
      title: "Analytics",
      buttons: [
        {
          icon: "📊",
          label: "Dashboard",
          onClick: () => this._handleNav("dashboard", onNavigate),
        },
        {
          icon: "📈",
          label: "Metrics",
          onClick: () => this._handleNav("metrics", onNavigate),
        },
        {
          icon: "🔍",
          label: "Logs",
          onClick: () => this._handleNav("logs", onNavigate),
        },
        {
          icon: "🚨",
          label: "Alerts",
          onClick: () => this._handleNav("alerts", onNavigate),
        },
      ],
    });
    this._sections.push(analyticsSection);
    this._sectionsContainer.add(analyticsSection.renderable);

    // === SETTINGS ===
    const settingsSection = new PaneSection(this._renderer, {
      title: "Settings",
      buttons: [
        {
          icon: "⚙️",
          label: "Preferences",
          onClick: () => this._handleNav("preferences", onNavigate),
        },
        {
          icon: "🎨",
          label: "Themes",
          onClick: () => this._handleNav("themes", onNavigate),
        },
        {
          icon: "🔌",
          label: "Extensions",
          onClick: () => this._handleNav("extensions", onNavigate),
        },
        {
          icon: "❓",
          label: "Help",
          onClick: () => this._handleNav("help", onNavigate),
        },
        {
          icon: "ℹ️",
          label: "About",
          onClick: () => this._handleNav("about", onNavigate),
        },
      ],
    });
    this._sections.push(settingsSection);
    this._sectionsContainer.add(settingsSection.renderable);

    // Set initial selection
    this._updateSelection();
  }

  private _handleNav(
    section: string,
    onNavigate?: (section: string) => void,
  ): void {
    this._activeButton = section;
    this._updateSelection();
    onNavigate?.(section);
  }

  private _updateSelection(): void {
    // Reset all buttons to unselected
    for (const section of this._sections) {
      for (const button of section.buttons) {
        button.setSelected(false);
      }
    }

    // Find and select the active button
    const sectionMap: Record<string, string> = {
      Chat: "chat",
      Agents: "agents",
      Models: "models",
      Prompts: "prompts",
      Pipeline: "pipeline",
      Tasks: "tasks",
      Templates: "templates",
      "Run History": "runhistory",
      Files: "files",
      Terminal: "terminal",
      Debug: "debug",
      Git: "git",
      Packages: "packages",
      "API Test": "apitest",
      Database: "database",
      Secrets: "secrets",
      Webhooks: "webhooks",
      "Cron Jobs": "cron",
      Dashboard: "dashboard",
      Metrics: "metrics",
      Logs: "logs",
      Alerts: "alerts",
      Preferences: "preferences",
      Themes: "themes",
      Extensions: "extensions",
      Help: "help",
      About: "about",
    };

    for (const section of this._sections) {
      for (const button of section.buttons) {
        const label = (button as any)._label?.content || "";
        if (sectionMap[label] === this._activeButton) {
          button.setSelected(true);
        }
      }
    }

    this._renderer.requestRender?.();
  }

  private _updateVisibility(): void {
    const terminalWidth = (this._renderer as any).terminalWidth || 80;
    this._pane.visible = terminalWidth >= this._threshold;
    this._renderer.requestRender?.();
  }

  /**
   * Add a custom section
   */
  addSection(section: PaneSection): void {
    this._sections.push(section);
    this._sectionsContainer.add(section.renderable);
  }

  /**
   * Get the underlying renderable
   */
  get renderable(): BoxRenderable {
    return this._pane;
  }

  /**
   * Show/hide
   */
  show(): void {
    this._pane.visible = true;
    this._renderer.requestRender?.();
  }

  hide(): void {
    this._pane.visible = false;
    this._renderer.requestRender?.();
  }
}
