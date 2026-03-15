import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Water animation - ripples/droplets
 */
export class WaterAnimation extends Animation {
  name = "water";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Multiple overlapping ripples
    const ripple1 = Math.sin(Math.sqrt((x - width * 0.3) ** 2 + (y - height * 0.3) ** 2) * 0.5 - t * 2);
    const ripple2 = Math.sin(Math.sqrt((x - width * 0.7) ** 2 + (y - height * 0.6) ** 2) * 0.4 - t * 1.5);
    const ripple3 = Math.sin(Math.sqrt((x - width * 0.5) ** 2 + (y - height * 0.5) ** 2) * 0.6 - t * 2.5);
    
    const combined = (ripple1 + ripple2 + ripple3) / 3;
    const intensity = Math.floor((combined + 1) * 5 * this.config.colorScale);
    
    return {
      char: " ",
      intensity: Math.min(Math.max(intensity, 0), 10),
    };
  }
}
