import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Boot animation - startup sequence
 */
export class BootAnimation extends Animation {
  name = "boot";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Boot progress lines
    const lines = [
      "BIOS check...",
      "Loading kernel...",
      "Mounting filesystems...",
      "Starting services...",
      "Ready!"
    ];
    
    const currentLine = Math.floor(t * 0.8) % lines.length;
    const lineY = Math.floor(height / 2) + currentLine - 2;
    
    // Draw current and past lines
    let intensity = 0;
    let char = " ";
    
    if (y === lineY) {
      // Current line - typing effect
      const typeProgress = (t * 5) % (width - 4);
      if (x > 2 && x < 2 + typeProgress) {
        intensity = 10;
        char = "█";
      }
    } else if (y < lineY && y > lineY - lines.length) {
      // Completed lines
      if (x > 2 && x < width - 2) {
        intensity = 6;
        char = "─";
      }
    }
    
    return { char, intensity };
  }
}
