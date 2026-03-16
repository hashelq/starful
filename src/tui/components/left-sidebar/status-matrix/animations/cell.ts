import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Cell animation - dividing cell
 */
export class CellAnimation extends Animation {
  name = "cell";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Cell division phases
    const phase = (t * 0.5) % 2;
    
    let cell1X = cx;
    let cell2X = cx;
    let separation = 0;
    
    if (phase < 1) {
      // Single cell growing
      separation = phase * 5;
    } else {
      // Splitting
      separation = 5 + (phase - 1) * 8;
    }
    
    cell1X = cx - separation;
    cell2X = cx + separation;
    
    // Cell membranes
    const dist1 = Math.sqrt((x - cell1X) ** 2 + (y - cy) ** 2);
    const dist2 = Math.sqrt((x - cell2X) ** 2 + (y - cy) ** 2);
    const radius = 4;
    
    const inCell1 = dist1 < radius;
    const inCell2 = dist2 < radius && separation > 3;
    const onMembrane1 = Math.abs(dist1 - radius) < 1;
    const onMembrane2 = Math.abs(dist2 - radius) < 1 && separation > 3;
    
    // Nucleus
    const nuc1 = Math.abs(dist1 - radius * 0.4) < 1;
    const nuc2 = Math.abs(dist2 - radius * 0.4) < 1 && separation > 3;
    
    let intensity = 0;
    let char = " ";
    
    if (nuc1 || nuc2) {
      intensity = 10;
      char = "●";
    } else if (onMembrane1 || onMembrane2) {
      intensity = 8;
      char = "○";
    } else if (inCell1 || inCell2) {
      intensity = 4;
      char = " ";
    }
    
    return { char, intensity };
  }
}
