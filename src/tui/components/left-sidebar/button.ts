import { BoxRenderable, CliRenderer, TextRenderable, createTextAttributes } from "@opentui/core";
import { COLORS } from "../../../engine/colors.js";
import { subscribeToThemeChanges } from "../../../engine/theme.js";
import type { SidebarButtonId } from "./types.js";

/**
 * SidebarButton - A clickable button for the sidebar
 */
export class SidebarButton {
  private _button: BoxRenderable;
  private _label: TextRenderable;
  private _onClick?: () => void;
  private _selected: boolean = false;
  private _hovered: boolean = false;
  private _renderer: CliRenderer;

  constructor(
    renderer: CliRenderer,
    options: {
      id: SidebarButtonId;
      label: string;
      onClick?: () => void;
    }
  ) {
    this._renderer = renderer;
    this._onClick = options.onClick;

    // Button container
    this._button = new BoxRenderable(renderer, {
      width: "100%",
      height: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingX: 1,
      paddingY: 0,
    });

    // Label
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
      this._hovered = true;
      this._updateAppearance();
    };

    this._button.onMouseOut = () => {
      this._hovered = false;
      this._updateAppearance();
    };

    // Subscribe colors to theme changes
    subscribeToThemeChanges([
      { renderable: this._button, prop: 'backgroundColor', colorKey: 'surface' },
      { renderable: this._label, prop: 'fg', colorKey: 'text' },
    ]);
  }

  private _updateAppearance(): void {
    if (this._selected) {
      this._button.backgroundColor = COLORS.primary;
      this._label.fg = COLORS.background;
    } else if (this._hovered) {
      this._button.backgroundColor = COLORS.surfaceAlt;
      this._label.fg = COLORS.text;
      this._label.attributes = createTextAttributes({ bold: true });
    } else {
      this._button.backgroundColor = "transparent";
      this._label.fg = COLORS.text;
      this._label.attributes = createTextAttributes({ bold: false });
    }
    this._renderer.requestRender?.();
  }

  get renderable(): BoxRenderable {
    return this._button;
  }

  setSelected(selected: boolean): void {
    this._selected = selected;
    this._updateAppearance();
  }
}
