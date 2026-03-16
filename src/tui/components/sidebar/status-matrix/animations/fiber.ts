import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Fiber animation - light through fiber cable
 */
export class FiberAnimation extends Animation {
  name = "fiber";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Fiber optic cable (curved lines)
    const curves = [
      { y: height * 0.3, amp: 3 },
      { y: height * 0.5, amp: 4 },
      { y: height * 0.7, amp: 3 },
    ];
    
    let intensity = 0;
    let char = " ";
    
    for (const curve of curves) {
      const fiberY = curve.y + Math.sin(x * 0.1 + t) * curve.amp;
      const dy = Math.abs(y - fiberY);
      
      if (dy < 1) {
        // Light pulse traveling through
        const pulseX = ((t * 10 + x) % width);
        const distToPulse = Math.abs(x - pulseX);
        
        if (distToPulse < 3) {
          intensity = 10;
          char = "●";
        } else {
          intensity = 5;
          char = "─";
        }
        break;
      }
    }
    
    return { char, intensity };
  }
}
