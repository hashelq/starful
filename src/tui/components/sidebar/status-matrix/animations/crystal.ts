import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Crystal animation - growing structure
 */
export class CrystalAnimation extends Animation {
  name = "crystal";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const bottomY = height - 2;
    
    // Crystal growing from bottom
    const growth = ((t * 0.5) % 3);
    const crystalHeight = 3 + growth * 4;
    
    // Crystal shape (hexagonal)
    const dx = Math.abs(x - cx);
    const inCrystal = y > bottomY - crystalHeight && dx < (bottomY - y) * 0.3 + 2;
    
    // Facets
    const isFacet = (x + y) % 5 === 0 && inCrystal;
    
    // Sparkle
    const sparkle = Math.random() > 0.995;
    
    let intensity = 0;
    let char = " ";
    
    if (sparkle && inCrystal) {
      intensity = 10;
      char = "*";
    } else if (isFacet) {
      intensity = 8;
      char = "│";
    } else if (inCrystal) {
      intensity = 5;
      char = "▓";
    }
    
    return { char, intensity };
  }
}
