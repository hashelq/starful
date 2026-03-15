import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Rain animation - Matrix-style falling characters
 */
export class RainAnimation extends Animation {
  name = "rain";
  
  // Store column states
  private columnStates: Map<number, { y: number; speed: number }> = new Map();
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    // Initialize column if needed
    if (!this.columnStates.has(x)) {
      this.columnStates.set(x, {
        y: Math.random() * height * 0.5,
        speed: 0.3 + Math.random() * 0.5,
      });
    }
    
    const col = this.columnStates.get(x)!;
    const t = tick * this.config.speed;
    
    // Update position
    col.y += col.speed * t * 0.1;
    if (col.y > height) {
      col.y = -Math.random() * height * 0.3;
      col.speed = 0.3 + Math.random() * 0.5;
    }
    
    // Calculate intensity based on distance from drop
    const dist = y - col.y;
    let intensity: number;
    
    if (dist < 0) {
      // Above the drop - dim
      intensity = Math.max(0, 10 + dist * 2);
    } else if (dist < 3) {
      // At the drop - bright
      intensity = 10;
    } else if (dist < 8) {
      // Trail - fading
      intensity = Math.max(0, 10 - (dist - 3) * 1.5);
    } else {
      intensity = 0;
    }
    
    intensity = Math.floor(intensity * this.config.colorScale);
    
    return {
      char: " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
