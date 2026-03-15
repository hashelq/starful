import { BoxRenderable, CliRenderer, TextRenderable, createTextAttributes } from "@opentui/core";
import { COLORS } from "../../../engine/colors.js";
import { subscribeToThemeChanges } from "../../../engine/theme.js";
import { setFoldedSections, getFoldedSections } from "../../../engine/ui-config.js";
import type { SidebarCategoryDef } from "./types.js";
import { SidebarButton } from "./button.js";

/**
 * SidebarCategory - A collapsible category with buttons
 */
export class SidebarCategory {
  private _category: BoxRenderable;
  private _headerBox: BoxRenderable;
  private _buttonsContainer: BoxRenderable;
  private _title: TextRenderable;
  private _buttons: SidebarButton[] = [];
  private _folded: boolean;
  private _renderer: CliRenderer;
  private _id: string;

  constructor(
    renderer: CliRenderer,
    def: SidebarCategoryDef
  ) {
    this._renderer = renderer;
    this._id = def.id;
    this._folded = def.folded ?? false;

    // Category container
    this._category = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });

    // Header box
    this._headerBox = new BoxRenderable(renderer, {
      width: "100%",
      height: 1,
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      paddingX: 1,
      backgroundColor: this._folded ? COLORS.surfaceAlt : COLORS.buttonBg,
    });

    // Title
    this._title = new TextRenderable(renderer, {
      content: def.title.toUpperCase(),
      fg: COLORS.text,
      attributes: createTextAttributes({ bold: true }),
    });

    this._headerBox.add(this._title);
    this._category.add(this._headerBox);

    // Header click toggles fold
    this._headerBox.onMouseUp = () => {
      this.toggle();
    };

    // Header hover effect
    this._headerBox.onMouseOver = () => {
      this._headerBox.backgroundColor = COLORS.buttonBg;
      this._renderer.requestRender?.();
    };

    this._headerBox.onMouseOut = () => {
      this._headerBox.backgroundColor = this._folded ? COLORS.surfaceAlt : COLORS.buttonBg;
      this._renderer.requestRender?.();
    };

    // Buttons container
    this._buttonsContainer = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
      padding: 1,
    });

    // Create buttons
    for (const btnDef of def.buttons) {
      const button = new SidebarButton(renderer, {
        id: btnDef.id,
        label: btnDef.label,
        onClick: () => {
          if (this._folded) {
            this.toggle();
          }
          btnDef.onClick();
        },
      });
      this._buttons.push(button);
      this._buttonsContainer.add(button.renderable);
    }

    this._category.add(this._buttonsContainer);

    // Set initial state
    this._buttonsContainer.visible = !this._folded;

    // Subscribe colors to theme changes
    subscribeToThemeChanges([
      { renderable: this._headerBox, prop: 'backgroundColor', colorKey: this._folded ? 'surfaceAlt' : 'buttonBg' },
      { renderable: this._title, prop: 'fg', colorKey: 'text' },
      { renderable: this._buttonsContainer, prop: 'backgroundColor', colorKey: 'surface' },
    ]);
  }

  toggle(): void {
    this._folded = !this._folded;
    this._buttonsContainer.visible = !this._folded;
    this._headerBox.backgroundColor = this._folded ? COLORS.surfaceAlt : COLORS.buttonBg;
    
    // Save folded state to config
    const foldedSections = getFoldedSections();
    if (this._folded) {
      if (!foldedSections.includes(this._id)) {
        setFoldedSections([...foldedSections, this._id]);
      }
    } else {
      setFoldedSections(foldedSections.filter(id => id !== this._id));
    }
    
    this._renderer.requestRender?.();
  }

  get renderable(): BoxRenderable {
    return this._category;
  }

  get buttons(): SidebarButton[] {
    return this._buttons;
  }
}
