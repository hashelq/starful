import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Plasma animation - charged particles
 */
export class PlasmaAnimation extends Animation {
  name = "plasma";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Plasma turbulence
    const p1 = Math.sin(x * 0.2 + t * 2) * Math.cos(y * 0.15 + t);
    const p2 = Math.sin(x * 0.15 - t * 1.5) * Math.sin(y * 0.2 + t * 0.7);
    const p3 = Math.sin((x + y) * 0.1 + t * 0.8);
    
    const combined = (p1 + p2 + p3) / 3;
    const intensity = Math.floor((combined + 1) * 5);
    
    const chars = " .·:+*#@█";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
