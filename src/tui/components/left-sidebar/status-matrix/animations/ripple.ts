import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Ripple animation - water drops spreading
 */
export class RippleAnimation extends Animation {
  name = "ripple";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Multiple ripples at different phases
    const ripple1 = Math.sin(dist * 0.8 - t * 4);
    const ripple2 = Math.sin(dist * 0.6 - t * 3 + 2);
    const ripple3 = Math.sin(dist * 0.5 - t * 2.5 + 4);
    
    // Only show ripple pattern
    const combined = (ripple1 + ripple2 + ripple3) / 3;
    const isRipple = combined > 0.5;
    
    // Fade with distance
    const fade = Math.max(0, 1 - dist / (width * 0.5));
    const intensity = isRipple ? Math.floor(8 * fade) : 0;
    
    const chars = " ·-~≡";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.max(1, intensity),
    };
  }
}
