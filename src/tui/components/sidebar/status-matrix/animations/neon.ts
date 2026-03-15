import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Neon animation - flickering neon signs
 */
export class NeonAnimation extends Animation {
  name = "neon";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Horizontal neon line
    const lineY = Math.floor(height / 2);
    const isLine = y === lineY;
    
    // Vertical lines
    const line1X = Math.floor(width * 0.3);
    const line2X = Math.floor(width * 0.7);
    const isVLine = (x === line1X || x === line2X) && y > lineY - 3 && y < lineY + 3;
    
    // Flicker effect
    const flicker = Math.sin(t * 15) > 0.3 ? 1 : Math.sin(t * 7) > 0 ? 0.7 : 0.3;
    
    let intensity = 0;
    let char = " ";
    
    if (isLine || isVLine) {
      intensity = Math.floor(10 * flicker);
      char = isLine ? "─" : "│";
    }
    
    return { char, intensity };
  }
}
