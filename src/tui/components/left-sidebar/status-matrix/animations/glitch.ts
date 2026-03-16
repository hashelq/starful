import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Glitch animation - digital corruption
 */
export class GlitchAnimation extends Animation {
  name = "glitch";
  
  override get config(): AnimationConfig {
    return { speed: 0.3, colorScale: 1 };
  }
  
  render(_tick: number, x: number, y: number, _width: number, _height: number): AnimationFrame {
    // Random glitch lines
    const glitchLine = Math.random() > 0.995;
    const horizontalGlitch = Math.random() > 0.997;
    
    // Scan lines
    const scanLine = y % 3 === 0;
    
    // Static noise
    const noise = Math.random() > 0.98;
    
    let intensity = 0;
    let char = " ";
    
    if (glitchLine) {
      // Random characters for glitch effect
      const glitchChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
      intensity = 8;
      char = glitchChars[Math.floor(Math.random() * glitchChars.length)] || "?";
    } else if (horizontalGlitch && Math.random() > 0.5) {
      intensity = 10;
      char = "▀";
    } else if (noise) {
      intensity = 4;
      char = Math.random() > 0.5 ? "▓" : "░";
    } else if (scanLine) {
      intensity = 1;
      char = "─";
    }
    
    return { char, intensity };
  }
}
