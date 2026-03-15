import { BoxRenderable, CliRenderer, TextRenderable, createTextAttributes } from "@opentui/core";
import { COLORS } from "../../engine/colors.js";
import { subscribeToThemeChanges } from "../../engine/theme.js";

/**
 * PaneButton - A clickable button for the sidebar
 */
class PaneButton {
  private _button: BoxRenderable;
  private _icon: TextRenderable;
  private _label: TextRenderable;
  private _onClick?: () => void;
  private _selected: boolean = false;

  constructor(
    renderer: CliRenderer,
    options: {
      icon: string;
      label: string;
      onClick?: () => void;
    }
  ) {
    this._onClick = options.onClick;

    // Button container
    this._button = new BoxRenderable(renderer, {
      width: "100%",
      height: 3,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
      paddingX: 1,
      paddingY: 0,
    });

    // Icon
    this._icon = new TextRenderable(renderer, {
      content: options.icon,
      fg: COLORS.text,
    });

    // Label
    this._label = new TextRenderable(renderer, {
      content: options.label,
      fg: COLORS.text,
    });

    this._button.add(this._icon);
    this._button.add(this._label);

    // Click handler
    this._button.onMouseUp = () => {
      this._onClick?.();
    };
  }

  get renderable(): BoxRenderable {
    return this._button;
  }

  setSelected(selected: boolean): void {
    this._selected = selected;
    this._button.backgroundColor = selected ? COLORS.primary : "transparent";
    this._icon.fg = selected ? COLORS.background : COLORS.text;
    this._label.fg = selected ? COLORS.background : COLORS.text;
  }
}

/**
 * PaneSection - A section with a title and buttons
 */
class PaneSection {
  private _section: BoxRenderable;
  private _title: TextRenderable;
  private _buttons: PaneButton[] = [];

  constructor(
    renderer: CliRenderer,
    options: {
      title: string;
      buttons: Array<{ icon: string; label: string; onClick?: () => void }>;
    }
  ) {
    // Section container
    this._section = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });

    // Section title
    this._title = new TextRenderable(renderer, {
      content: options.title.toUpperCase(),
      fg: COLORS.dimText,
      attributes: createTextAttributes({ bold: true }),
      paddingY: 1,
      paddingX: 2,
    });
    this._section.add(this._title);

    // Add buttons
    for (const btn of options.buttons) {
      const button = new PaneButton(renderer, {
        icon: btn.icon,
        label: btn.label,
        onClick: btn.onClick,
      });
      this._buttons.push(button);
      this._section.add(button.renderable);
    }
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
export class LeftPane {
  private _pane: BoxRenderable;
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
    }
  ) {
    this._renderer = renderer;
    this._width = options?.width ?? 30;
    this._threshold = options?.threshold ?? 120;

    // Create the left pane container
    this._pane = new BoxRenderable(renderer, {
      width: this._width,
      height: "100%",
      backgroundColor: COLORS.surfaceAlt,
      flexDirection: "column",
      gap: 0,
    });

    // Build all sections
    this._buildSections(options?.onNavigate);

    // Subscribe to theme changes
    subscribeToThemeChanges([
      { renderable: this._pane, prop: 'backgroundColor', colorKey: 'surfaceAlt' },
    ]);

    // Set initial visibility
    this._updateVisibility();

    // Listen for resize
    renderer.on("resize", () => {
      this._updateVisibility();
    });
  }

  private _buildSections(onNavigate?: (section: string) => void): void {
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
    this._pane.add(aiSection.renderable);

    // === WORKFLOWS ===
    const workflowsSection = new PaneSection(this._renderer, {
      title: "Workflows",
      buttons: [
        { icon: "🔄", label: "Pipeline", onClick: () => this._handleNav("pipeline", onNavigate) },
        { icon: "⚙️", label: "Tasks", onClick: () => this._handleNav("tasks", onNavigate) },
        { icon: "📋", label: "Templates", onClick: () => this._handleNav("templates", onNavigate) },
        { icon: "▶️", label: "Run History", onClick: () => this._handleNav("runhistory", onNavigate) },
      ],
    });
    this._sections.push(workflowsSection);
    this._pane.add(workflowsSection.renderable);

    // === DEVELOPMENT ===
    const devSection = new PaneSection(this._renderer, {
      title: "Development",
      buttons: [
        { icon: "📁", label: "Files", onClick: () => this._handleNav("files", onNavigate) },
        { icon: "💻", label: "Terminal", onClick: () => this._handleNav("terminal", onNavigate) },
        { icon: "🔧", label: "Debug", onClick: () => this._handleNav("debug", onNavigate) },
        { icon: "🐙", label: "Git", onClick: () => this._handleNav("git", onNavigate) },
        { icon: "📦", label: "Packages", onClick: () => this._handleNav("packages", onNavigate) },
      ],
    });
    this._sections.push(devSection);
    this._pane.add(devSection.renderable);

    // === AUTOMATION ===
    const autoSection = new PaneSection(this._renderer, {
      title: "Automation",
      buttons: [
        { icon: "🔌", label: "API Test", onClick: () => this._handleNav("apitest", onNavigate) },
        { icon: "🗄️", label: "Database", onClick: () => this._handleNav("database", onNavigate) },
        { icon: "🔐", label: "Secrets", onClick: () => this._handleNav("secrets", onNavigate) },
        { icon: "📨", label: "Webhooks", onClick: () => this._handleNav("webhooks", onNavigate) },
        { icon: "⏰", label: "Cron Jobs", onClick: () => this._handleNav("cron", onNavigate) },
      ],
    });
    this._sections.push(autoSection);
    this._pane.add(autoSection.renderable);

    // === ANALYTICS ===
    const analyticsSection = new PaneSection(this._renderer, {
      title: "Analytics",
      buttons: [
        { icon: "📊", label: "Dashboard", onClick: () => this._handleNav("dashboard", onNavigate) },
        { icon: "📈", label: "Metrics", onClick: () => this._handleNav("metrics", onNavigate) },
        { icon: "🔍", label: "Logs", onClick: () => this._handleNav("logs", onNavigate) },
        { icon: "🚨", label: "Alerts", onClick: () => this._handleNav("alerts", onNavigate) },
      ],
    });
    this._sections.push(analyticsSection);
    this._pane.add(analyticsSection.renderable);

    // === SETTINGS ===
    const settingsSection = new PaneSection(this._renderer, {
      title: "Settings",
      buttons: [
        { icon: "⚙️", label: "Preferences", onClick: () => this._handleNav("preferences", onNavigate) },
        { icon: "🎨", label: "Themes", onClick: () => this._handleNav("themes", onNavigate) },
        { icon: "🔌", label: "Extensions", onClick: () => this._handleNav("extensions", onNavigate) },
        { icon: "❓", label: "Help", onClick: () => this._handleNav("help", onNavigate) },
        { icon: "ℹ️", label: "About", onClick: () => this._handleNav("about", onNavigate) },
      ],
    });
    this._sections.push(settingsSection);
    this._pane.add(settingsSection.renderable);

    // Set initial selection
    this._updateSelection();
  }

  private _handleNav(section: string, onNavigate?: (section: string) => void): void {
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
      "Chat": "chat", "Agents": "agents", "Models": "models", "Prompts": "prompts",
      "Pipeline": "pipeline", "Tasks": "tasks", "Templates": "templates", "Run History": "runhistory",
      "Files": "files", "Terminal": "terminal", "Debug": "debug", "Git": "git", "Packages": "packages",
      "API Test": "apitest", "Database": "database", "Secrets": "secrets", "Webhooks": "webhooks", "Cron Jobs": "cron",
      "Dashboard": "dashboard", "Metrics": "metrics", "Logs": "logs", "Alerts": "alerts",
      "Preferences": "preferences", "Themes": "themes", "Extensions": "extensions", "Help": "help", "About": "about",
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
    this._pane.add(section.renderable);
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
