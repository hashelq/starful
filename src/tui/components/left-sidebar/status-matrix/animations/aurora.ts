import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Aurora animation - northern lights
 */
export class AuroraAnimation extends Animation {
  name = "aurora";
  
  override get config(): AnimationConfig {
    return { speed: 0.08, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Multiple wave layers
    const wave1 = Math.sin(x * 0.1 + t * 2) * Math.cos(y * 0.2 + t);
    const wave2 = Math.sin(x * 0.15 - t * 1.5) * Math.sin(y * 0.3 + t * 0.5);
    const wave3 = Math.sin(x * 0.08 + t) * Math.cos(y * 0.15 - t * 0.7);
    
    const combined = (wave1 + wave2 + wave3) / 3;
    
    // Aurora appears in upper portion
    const yFactor = 1 - y / height;
    const auroraMask = yFactor > 0.3 ? Math.sin(yFactor * Math.PI * 1.5) : 0;
    
    const intensity = Math.floor((combined * 0.5 + 0.5) * 8 * auroraMask);
    
    const chars = " ·~:*+█";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
