/**
 * Animation types for the status matrix
 */

export interface AnimationFrame {
  char: string;
  intensity: number; // 0-10 for color mapping
}

export interface AnimationConfig {
  speed: number;
  colorScale: number;
}

export abstract class Animation {
  abstract name: string;
  abstract render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame;
  
  // Default config
  get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
}
