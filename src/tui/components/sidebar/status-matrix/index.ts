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
  // Abstract/Math animations
  FibonacciAnimation,
  FractalAnimation,
  VoronoiAnimation,
  PerlinAnimation,
  PolygonAnimation,
  StarAnimation,
  DiamondAnimation,
  CubeAnimation,
  SphereAnimation,
  TorusAnimation,
  // Particle/Science animations
  ElectronAnimation,
  AtomAnimation,
  DNAAnimation,
  CellAnimation,
  BlackholeAnimation,
  SupernovaAnimation,
  GravityAnimation,
  CrystalAnimation,
  PlasmaAnimation,
  BrownianAnimation,
  DiffusionAnimation,
  // Retro/Gaming animations
  TetrisAnimation,
  PongAnimation,
  SnakeAnimation,
  SpaceInvaderAnimation,
  StarfieldAnimation,
  AsteroidsAnimation,
  // Additional
  PacmanAnimation,
  BreakoutAnimation,
  GameOfLifeAnimation,
  MandelbrotAnimation,
  PulseRingsAnimation,
  LissajousAnimation,
} from "./animations/index.js";

/**
 * StatusMatrix - Animated ASCII matrix at the bottom of sidebar
 * Displays animations with automatic cycling and dynamic timing based on generation state
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
  private _labelRow: TextRenderable[] = [];
  
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
      // Abstract/Math
      new FibonacciAnimation(),
      new FractalAnimation(),
      new VoronoiAnimation(),
      new PerlinAnimation(),
      new PolygonAnimation(),
      new StarAnimation(),
      new DiamondAnimation(),
      new CubeAnimation(),
      new SphereAnimation(),
      new TorusAnimation(),
      // Particle/Science
      new ElectronAnimation(),
      new AtomAnimation(),
      new DNAAnimation(),
      new CellAnimation(),
      new BlackholeAnimation(),
      new SupernovaAnimation(),
      new GravityAnimation(),
      new CrystalAnimation(),
      new PlasmaAnimation(),
      new BrownianAnimation(),
      new DiffusionAnimation(),
      // Retro/Gaming
      new TetrisAnimation(),
      new PongAnimation(),
      new SnakeAnimation(),
      new SpaceInvaderAnimation(),
      new StarfieldAnimation(),
      new AsteroidsAnimation(),
      // Additional
      new PacmanAnimation(),
      new BreakoutAnimation(),
      new GameOfLifeAnimation(),
      new MandelbrotAnimation(),
      new PulseRingsAnimation(),
      new LissajousAnimation(),
    ];
    
    // Calculate grid size (1 y ≈ 1.5 x), leave 1 row for label
    const gridWidth = width - 2;
    const gridHeight = Math.floor(gridWidth / 1.5) - 1;
    
    // Create container
    this._container = new BoxRenderable(renderer, {
      width: "100%",
      height: "auto",
      flexDirection: "column",
      gap: 0,
    });
    
    // Create grid (animation area)
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
    
    // Create label row at bottom (1 char padding)
    const labelRow = new BoxRenderable(renderer, {
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      gap: 0,
    });
    for (let x = 0; x < gridWidth; x++) {
      const cell = new TextRenderable(renderer, {
        content: " ",
        fg: COLORS.text,
      });
      this._labelRow.push(cell);
      labelRow.add(cell);
    }
    this._container.add(labelRow);
    
    // Subscribe to theme changes
    subscribeToThemeChanges([
      { renderable: this._container, prop: 'backgroundColor', colorKey: 'surface' },
    ]);
    
    // Start animation loop
    this._startAnimation(gridWidth, gridHeight);
    
    // Start cycling animations
    this._startCycling();
  }
  
  private _startCycling(): void {
    // Pick initial random animation
    this._currentAnimIndex = Math.floor(Math.random() * this._animations.length);
    this._updateLabel();
    
    const cycle = () => {
      // Pick a new random animation
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * this._animations.length);
      } while (newIndex === this._currentAnimIndex && this._animations.length > 1);
      this._currentAnimIndex = newIndex;
      this._updateLabel();
      
      // Set next cycle interval based on generating state
      const isGenerating = this._isGeneratingFn();
      const interval = isGenerating 
        ? StatusMatrix.GENERATING_CYCLE_MS 
        : StatusMatrix.IDLE_CYCLE_MS;
      
      this._cycleInterval = setTimeout(cycle, interval);
    };
    
    // Start cycling
    const isGenerating = this._isGeneratingFn();
    const initialInterval = isGenerating 
      ? StatusMatrix.GENERATING_CYCLE_MS 
      : StatusMatrix.IDLE_CYCLE_MS;
    this._cycleInterval = setTimeout(cycle, initialInterval);
  }
  
  private _updateLabel(): void {
    const anim = this._animations[this._currentAnimIndex];
    if (!anim) return;
    
    const name = anim.name;
    const labelWidth = this._labelRow.length;
    
    // Clear row
    for (const cell of this._labelRow) {
      cell.content = " ";
    }
    
    // Center the name
    const padding = Math.floor((labelWidth - name.length) / 2);
    for (let i = 0; i < name.length; i++) {
      const cellIndex = padding + i;
      if (cellIndex >= 0 && cellIndex < this._labelRow.length) {
        const cell = this._labelRow[cellIndex];
        const char = name[i] ?? " ";
        if (cell) cell.content = char;
      }
    }
    
    this._renderer.requestRender?.();
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
      console.log(anim.name);
      
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
