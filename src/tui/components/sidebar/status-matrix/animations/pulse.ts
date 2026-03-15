import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Pulse animation - rhythmic breathing from center
 */
export class PulseAnimation extends Animation {
  name = "pulse";
  
  override get config(): AnimationConfig {
    return { speed: 0.12, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const cx = width / 2;
    const cy = height / 2;
    
    // Distance from center
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    
    // Normalized distance
    const normDist = dist / maxDist;
    
    // Pulse wave from center
    const t = tick * this.config.speed;
    const pulse = Math.sin(t - normDist * 8);
    const intensity = Math.floor((pulse + 1) * 5 * (1 - normDist * 0.5) * this.config.colorScale);
    
    const intensityVal = Math.floor((pulse + 1) * 5 * (1 - normDist * 0.5) * this.config.colorScale);
    const clamped = Math.max(0, Math.min(10, intensityVal));
    
    return {
      char: " ",
      intensity: clamped,
    };
  }
}
