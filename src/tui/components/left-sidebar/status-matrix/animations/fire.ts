import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Fire animation - flickering flames from bottom
 */
export class FireAnimation extends Animation {
  name = "fire";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    // Fire rises from bottom, so invert y
    const invY = height - 1 - y;
    const t = tick * this.config.speed;
    
    // Multiple noise layers for flame effect
    const n1 = Math.sin(x * 0.5 + t * 2) * Math.cos(invY * 0.3 + t);
    const n2 = Math.sin(x * 0.8 - t * 1.5) * Math.sin(invY * 0.5 + t * 0.5);
    const combined = (n1 + n2) / 2;
    
    // Higher intensity at bottom
    const heightFactor = invY / height;
    const intensity = Math.floor((combined + 1) * 5 * (1 - heightFactor * 0.7) * this.config.colorScale);
    
    return {
      char: " ",
      intensity: Math.min(Math.max(intensity, 0), 10),
    };
  }
}
