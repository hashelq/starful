import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Lightning animation - jagged electrical strikes
 */
export class LightningAnimation extends Animation {
  name = "lightning";
  
  override get config(): AnimationConfig {
    return { speed: 0.3, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Lightning bolt pattern
    const centerX = width * 0.5;
    const boltX = centerX + Math.sin(y * 0.8 + t * 5) * width * 0.3;
    const isBolt = Math.abs(x - boltX) < 1.5 + Math.random() * 2;
    
    // Random flash
    const flash = Math.random() > 0.95 ? 10 : 0;
    
    const intensity = isBolt ? (8 + flash) : (Math.random() > 0.97 ? 3 : 0);
    
    return {
      char: isBolt ? "│" : " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
