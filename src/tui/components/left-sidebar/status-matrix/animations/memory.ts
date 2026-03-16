import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Memory animation - address blocks
 */
export class MemoryAnimation extends Animation {
  name = "memory";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, _height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Memory grid
    const blockWidth = 4;
    const blockHeight = 3;
    
    const col = Math.floor(x / blockWidth);
    const row = Math.floor(y / blockHeight);
    
    // Randomly activate blocks
    const seed = col * 7 + row * 13;
    const isActive = Math.sin(t * 2 + seed) > 0.3;
    
    // Address label at top
    const isAddress = y === 1 && x > 1 && x < width - 2;
    
    let intensity = 0;
    let char = " ";
    
    if (isActive) {
      intensity = Math.floor(6 + Math.sin(t + seed) * 4);
      char = "█";
    } else if (isAddress) {
      intensity = 5;
      char = "─";
    }
    
    return { char, intensity };
  }
}
