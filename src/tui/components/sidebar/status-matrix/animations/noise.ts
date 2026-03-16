import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Noise animation - Random static with some coherence
 */
export class NoiseAnimation extends Animation {
  name = "noise";
  
  // Seed for pseudo-random based on position
  private seed(x: number, y: number, tick: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + tick * 0.01) * 43758.5453;
    return n - Math.floor(n);
  }
  
  override get config(): AnimationConfig {
    return { speed: 1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, _width: number, _height: number): AnimationFrame {
    const t = tick * 0.5;
    
    // Coherent noise - smooth changes over time
    const n1 = this.seed(Math.floor(x / 2), Math.floor(y / 2), Math.floor(t));
    const n2 = this.seed(Math.floor(x / 3), Math.floor(y / 3), Math.floor(t * 0.7));
    const combined = (n1 + n2) / 2;
    
    const intensity = Math.floor(combined * 10 * this.config.colorScale);
    
    return {
      char: " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
