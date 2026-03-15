import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Ocean animation - deep sea waves
 */
export class OceanAnimation extends Animation {
  name = "ocean";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Multiple wave layers
    const wave1 = Math.sin(x * 0.15 + t * 2) * Math.cos(y * 0.1 + t);
    const wave2 = Math.sin(x * 0.2 - t * 1.5) * Math.sin(y * 0.15 + t * 0.7);
    const wave3 = Math.sin(x * 0.1 + t * 0.8) * Math.cos(y * 0.08 - t * 0.5);
    
    const combined = (wave1 + wave2 + wave3) / 3;
    
    // Deeper = darker
    const depthFactor = y / height;
    const intensity = Math.floor((combined * 0.5 + 0.5) * 8 * (1 - depthFactor * 0.5));
    
    const chars = " .·~-≡▓";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.max(1, intensity),
    };
  }
}
