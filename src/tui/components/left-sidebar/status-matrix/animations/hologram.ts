import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Hologram animation - glitchy projection
 */
export class HologramAnimation extends Animation {
  name = "hologram";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Scanline effect
    const scanLine = Math.floor(y + t * 10) % 3 === 0;
    
    // Hologram figure (simplified)
    const cx = width / 2;
    const figureX = cx;
    const figureTop = height * 0.2;
    const figureBottom = height * 0.8;
    
    const inFigure = x > figureX - 3 && x < figureX + 3 && y > figureTop && y < figureBottom;
    
    // Glitch offset
    const glitchOffset = Math.sin(t * 20) > 0.8 ? Math.floor(Math.random() * 3) - 1 : 0;
    const isGlitched = Math.abs(x - (figureX + glitchOffset)) < 3;
    
    // Static noise
    const noise = Math.random() > 0.995;
    
    let intensity = 0;
    let char = " ";
    
    if (noise) {
      intensity = 6;
      char = Math.random() > 0.5 ? "▓" : "░";
    } else if (inFigure && isGlitched) {
      intensity = 8;
      char = "█";
    } else if (scanLine && inFigure) {
      intensity = 3;
      char = "─";
    }
    
    return { char, intensity };
  }
}
