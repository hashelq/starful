import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Fibonacci animation - golden spiral
 */
export class FibonacciAnimation extends Animation {
  name = "fibonacci";
  
  override get config(): AnimationConfig {
    return { speed: 0.08, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Golden spiral - exponential growth
    const goldenRatio = 1.618;
    const spiral = angle + Math.log(dist + 0.1) * goldenRatio - t;
    const spiralVal = Math.sin(spiral);
    
    const intensity = Math.floor((spiralVal * 0.5 + 0.5) * 8);
    
    const chars = " ·:-=*#@";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
