import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Spiral animation - rotating spiral pattern
 */
export class SpiralAnimation extends Animation {
  name = "spiral";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const cx = width / 2;
    const cy = height / 2;
    
    // Distance and angle from center
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const t = tick * this.config.speed;
    
    // Spiral arms
    const spiral = Math.sin(dist * 0.5 - t * 3 + angle * 2);
    const intensity = Math.floor((spiral + 1) * 5 * (1 - dist / Math.max(width, height) * 0.5) * this.config.colorScale);
    
    return {
      char: " ",
      intensity: Math.min(Math.max(intensity, 0), 10),
    };
  }
}
