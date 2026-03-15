import { BoxRenderable, CliRenderer, TextRenderable } from "@opentui/core";
import { COLORS } from "../../../../engine/colors.js";
import { subscribeToThemeChanges } from "../../../../engine/theme.js";
import { Animation, WaveAnimation, RainAnimation, NoiseAnimation } from "./animations/index.js";

/**
 * StatusMatrix - Animated ASCII matrix at the bottom of sidebar
 * Cycles through different animations every 3 seconds
 */
export class StatusMatrix {
  private _container: BoxRenderable;
  private _renderer: CliRenderer;
  private _grid: TextRenderable[][] = [];
  private _animations: Animation[] = [];
  private _currentAnimIndex = 0;
  private _tick = 0;
  private _interval: any = null;
  private _cycleInterval: any = null;
  
  // Character set for intensity mapping
  private _chars = " .·:;+*#@";
  
  constructor(renderer: CliRenderer, width: number) {
    this._renderer = renderer;
    
    // Initialize animations
    this._animations = [
      new WaveAnimation(),
      new RainAnimation(),
      new NoiseAnimation(),
    ];
    
    // Calculate grid size (1 y ≈ 1.5 x)
    const gridWidth = width - 2;
    const gridHeight = Math.floor(gridWidth / 1.5);
    
    // Create container
    this._container = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });
    
    // Create grid
    for (let y = 0; y < gridHeight; y++) {
      const row = new BoxRenderable(renderer, {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        gap: 0,
      });
      
      const rowCells: TextRenderable[] = [];
      for (let x = 0; x < gridWidth; x++) {
        const cell = new TextRenderable(renderer, {
          content: " ",
          fg: COLORS.textMuted,
        });
        rowCells.push(cell);
        row.add(cell);
      }
      this._grid.push(rowCells);
      this._container.add(row);
    }
    
    // Subscribe to theme changes
    subscribeToThemeChanges([
      { renderable: this._container, prop: 'backgroundColor', colorKey: 'surface' },
    ]);
    
    // Start animation loop
    this._startAnimation(gridWidth, gridHeight);
    
    // Cycle animations every 3 seconds
    this._cycleInterval = setInterval(() => {
      this._currentAnimIndex = (this._currentAnimIndex + 1) % this._animations.length;
    }, 3000);
  }
  
  private _startAnimation(width: number, height: number): void {
    this._interval = setInterval(() => {
      this._tick++;
      
      const anim = this._animations[this._currentAnimIndex];
      if (!anim) return;
      
      for (let y = 0; y < height; y++) {
        const row = this._grid[y];
        if (!row) continue;
        
        for (let x = 0; x < width; x++) {
          const cell = row[x];
          if (!cell) continue;
          
          const frame = anim.render(this._tick, x, y, width, height);
          const charIdx = Math.min(Math.floor(frame.intensity * this._chars.length / 10), this._chars.length - 1);
          cell.content = this._chars[charIdx] || " ";
          
          // Color based on intensity
          if (frame.intensity > 7) {
            cell.fg = COLORS.accent;
          } else if (frame.intensity > 4) {
            cell.fg = COLORS.text;
          } else {
            cell.fg = COLORS.textMuted;
          }
        }
      }
      
      this._renderer.requestRender?.();
    }, 80);
  }
  
  get renderable(): BoxRenderable {
    return this._container;
  }
  
  destroy(): void {
    if (this._interval) clearInterval(this._interval);
    if (this._cycleInterval) clearInterval(this._cycleInterval);
  }
}
