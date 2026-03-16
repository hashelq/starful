import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Perlin animation - smooth noise
 */
export class PerlinAnimation extends Animation {
  name = "perlin";
  
  override get config(): AnimationConfig {
    return { speed: 0.08, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, _width: number, _height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Simplified Perlin-like noise
    const noise1 = Math.sin(x * 0.1 + t) * Math.cos(y * 0.1 + t * 0.7);
    const noise2 = Math.sin(x * 0.2 - t * 0.5) * Math.sin(y * 0.15 + t * 0.3);
    const noise3 = Math.sin(x * 0.05 + t * 0.3) * Math.cos(y * 0.08 - t * 0.2);
    const noise4 = Math.sin(x * 0.3 + t * 0.8) * Math.cos(y * 0.2 - t * 0.6);
    
    const combined = (noise1 + noise2 + noise3 + noise4) / 4;
    const intensity = Math.floor((combined + 1) * 5);
    
    const chars = " ·:-=*#@";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
