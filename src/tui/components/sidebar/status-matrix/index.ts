import { BoxRenderable, CliRenderer, TextRenderable } from "@opentui/core";
import { COLORS } from "../../../../engine/colors.js";
import { subscribeToThemeChanges } from "../../../../engine/theme.js";
import {
  Animation,
  WaveAnimation,
  RainAnimation,
  NoiseAnimation,
  PulseAnimation,
  SpiralAnimation,
  GradientAnimation,
  // Nature animations
  FireAnimation,
  WaterAnimation,
  LightningAnimation,
  GalaxyAnimation,
  SnowAnimation,
  ClockAnimation,
  HeartbeatAnimation,
  ScannerAnimation,
  VortexAnimation,
  BounceAnimation,
  AuroraAnimation,
  TornadoAnimation,
  CometAnimation,
  EclipseAnimation,
  RainbowAnimation,
  FogAnimation,
  CloudAnimation,
  VolcanoAnimation,
  OceanAnimation,
  ForestAnimation,
  FirefliesAnimation,
  RippleAnimation,
  // Tech/Cyber animations
  MatrixAnimation,
  BinaryAnimation,
  GlitchAnimation,
  RadarAnimation,
  SignalAnimation,
  WiFiAnimation,
  LaserAnimation,
  NeonAnimation,
  HologramAnimation,
  TerminalAnimation,
  LoadingAnimation,
  BootAnimation,
  DataAnimation,
  MemoryAnimation,
  CPUAnimation,
  QuantumAnimation,
  NeuralAnimation,
  FiberAnimation,
  USBAnimation,
  SonarAnimation,
} from "./animations/index.js";

/**
 * StatusMatrix - Animated ASCII matrix at the bottom of sidebar
 * Cycles through different animations randomly
 * - Slow cycle (10s) when idle
 * - Fast cycle (1s) when generating
 */
export class StatusMatrix {
  private _container: BoxRenderable;
  private _renderer: CliRenderer;
  private _grid: TextRenderable[][] = [];
  private _animations: Animation[] = [];
  private _tick = 0;
  private _animationInterval: any = null;
  private _cycleInterval: any = null;
  private _isGeneratingFn: () => boolean;
  private _currentAnimIndex = 0;
  private _lastAnimIndex = -1;
  
  // Timing constants
  private static readonly IDLE_CYCLE_MS = 10000;
  private static readonly GENERATING_CYCLE_MS = 1000;
  private static readonly IDLE_TICK_MS = 80;
  private static readonly GENERATING_TICK_MS = 40;
  
  // Character set for intensity mapping
  private _chars = " .·:;+*#@";
  
  constructor(renderer: CliRenderer, width: number, options?: { isGeneratingFn?: () => boolean }) {
    this._renderer = renderer;
    this._isGeneratingFn = options?.isGeneratingFn ?? (() => false);
    
    // Initialize animations
    this._animations = [
      // Original
      new WaveAnimation(),
      new RainAnimation(),
      new NoiseAnimation(),
      new PulseAnimation(),
      new SpiralAnimation(),
      new GradientAnimation(),
      // Nature
      new FireAnimation(),
      new WaterAnimation(),
      new LightningAnimation(),
      new GalaxyAnimation(),
      new SnowAnimation(),
      new ClockAnimation(),
      new HeartbeatAnimation(),
      new ScannerAnimation(),
      new VortexAnimation(),
      new BounceAnimation(),
      new AuroraAnimation(),
      new TornadoAnimation(),
      new CometAnimation(),
      new EclipseAnimation(),
      new RainbowAnimation(),
      new FogAnimation(),
      new CloudAnimation(),
      new VolcanoAnimation(),
      new OceanAnimation(),
      new ForestAnimation(),
      new FirefliesAnimation(),
      new RippleAnimation(),
      // Tech/Cyber
      new MatrixAnimation(),
      new BinaryAnimation(),
      new GlitchAnimation(),
      new RadarAnimation(),
      new SignalAnimation(),
      new WiFiAnimation(),
      new LaserAnimation(),
      new NeonAnimation(),
      new HologramAnimation(),
      new TerminalAnimation(),
      new LoadingAnimation(),
      new BootAnimation(),
      new DataAnimation(),
      new MemoryAnimation(),
      new CPUAnimation(),
      new QuantumAnimation(),
      new NeuralAnimation(),
      new FiberAnimation(),
      new USBAnimation(),
      new SonarAnimation(),
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
    
    // Start cycling - will be adjusted based on generating state
    this._startCycling();
  }
  
  private _getRandomAnimIndex(): number {
    // Pick a random index different from the current one
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this._animations.length);
    } while (newIndex === this._currentAnimIndex && this._animations.length > 1);
    return newIndex;
  }
  
  private _startCycling(): void {
    // Initial random animation
    this._currentAnimIndex = this._getRandomAnimIndex();
    
    const cycle = () => {
      const isGenerating = this._isGeneratingFn();
      
      // Pick a new random animation
      this._currentAnimIndex = this._getRandomAnimIndex();
      
      // Set next cycle interval based on generating state
      const interval = isGenerating 
        ? StatusMatrix.GENERATING_CYCLE_MS 
        : StatusMatrix.IDLE_CYCLE_MS;
      
      this._cycleInterval = setTimeout(cycle, interval);
    };
    
    // Start with initial delay
    this._cycleInterval = setTimeout(cycle, StatusMatrix.IDLE_CYCLE_MS);
  }
  
  private _startAnimation(width: number, height: number): void {
    const animate = () => {
      const isGenerating = this._isGeneratingFn();
      
      // Faster tick when generating
      const tickMs = isGenerating 
        ? StatusMatrix.GENERATING_TICK_MS 
        : StatusMatrix.IDLE_TICK_MS;
      
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
      this._animationInterval = setTimeout(animate, tickMs);
    };
    
    animate();
  }
  
  get renderable(): BoxRenderable {
    return this._container;
  }
  
  destroy(): void {
    if (this._animationInterval) clearTimeout(this._animationInterval);
    if (this._cycleInterval) clearTimeout(this._cycleInterval);
  }
}
