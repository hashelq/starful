import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Gradient animation - horizontal color bands flowing
 */
export class GradientAnimation extends Animation {
  name = "gradient";
  
  override get config(): AnimationConfig {
    return { speed: 0.08, colorScale: 1.2 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Horizontal bands moving horizontally
    const band = Math.sin((x / width) * 6 + t);
    // Add vertical variation
    const vert = Math.cos((y / height) * 4 + t * 0.7);
    const combined = (band + vert) / 2;
    
    const intensity = Math.floor((combined + 1) * 5 * this.config.colorScale);
    
    return {
      char: " ",
      intensity: Math.min(Math.max(intensity, 0), 10),
    };
  }
}
