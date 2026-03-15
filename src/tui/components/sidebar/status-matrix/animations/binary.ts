import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Binary animation - falling binary code
 */
export class BinaryAnimation extends Animation {
  name = "binary";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Binary rain - similar to matrix but with only 0s and 1s
    const colPhase = (x * 0.4 + t * 8) % (height + 3);
    const charY = height - colPhase;
    
    const dy = Math.abs(y - charY);
    
    // Determine binary value based on position
    const binaryVal = Math.floor((x + y + t * 20) % 2);
    
    let intensity = 0;
    let char = " ";
    
    if (dy < 6) {
      intensity = Math.floor(10 - dy * 1.5);
      char = binaryVal.toString();
    }
    
    return { char, intensity };
  }
}
