import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Matrix animation - digital rain
 */
export class MatrixAnimation extends Animation {
  name = "matrix";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Matrix rain - columns of falling characters
    const colPhase = (x * 0.3 + t * 5) % (height + 5);
    const charY = height - colPhase;
    
    // Distance from the "falling" position
    const dy = Math.abs(y - charY);
    
    // Character changes based on position
    const charIndex = Math.floor((x + t * 10) % 62);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
    
    let intensity = 0;
    let char = " ";
    
    if (dy < 8) {
      intensity = Math.floor(10 - dy);
      char = chars[charIndex % chars.length] || "X";
    } else if (dy < 10 && Math.random() > 0.5) {
      // Fading trail
      intensity = 2;
      char = "|";
    }
    
    return { char, intensity };
  }
}
