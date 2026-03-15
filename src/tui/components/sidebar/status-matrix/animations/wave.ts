import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Wave animation - flowing sine waves
 */
export class WaveAnimation extends Animation {
  name = "wave";
  
  override get config(): AnimationConfig {
    return { speed: 0.08, colorScale: 1.2 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const nx = x / width;
    const ny = y / height;
    
    // Multiple wave layers
    const wave1 = Math.sin(nx * 6 + t) * Math.cos(ny * 4 + t * 0.7);
    const wave2 = Math.sin(nx * 4 - t * 0.8) * Math.cos(ny * 6 - t * 0.5);
    const combined = (wave1 + wave2) / 2;
    
    const intensity = Math.floor((combined + 1) * 5 * this.config.colorScale);
    
    return {
      char: " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
