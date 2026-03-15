import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Diamond animation - gem facets
 */
export class DiamondAnimation extends Animation {
  name = "diamond";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    const dx = x - cx;
    const dy = y - cy;
    
    // Diamond shape (rhombus)
    const diamondH = height * 0.4;
    const diamondW = width * 0.3;
    const inDiamond = Math.abs(dy) < diamondH - (Math.abs(dx) / diamondW) * diamondH;
    
    // Facets (diagonal lines)
    const onFacet1 = Math.abs(dx - dy * diamondW / diamondH) < 1;
    const onFacet2 = Math.abs(dx + dy * diamondW / diamondH) < 1;
    
    // Shimmer
    const shimmer = Math.sin(t * 5 + x * 0.5 + y * 0.3) > 0.5;
    
    let intensity = 0;
    let char = " ";
    
    if (onFacet1 || onFacet2) {
      intensity = 9;
      char = "│";
    } else if (inDiamond) {
      intensity = shimmer ? 8 : 5;
      char = "▓";
    }
    
    return { char, intensity };
  }
}
