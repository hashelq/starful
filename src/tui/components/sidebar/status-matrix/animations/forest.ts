import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Forest animation - trees swaying
 */
export class ForestAnimation extends Animation {
  name = "forest";
  
  override get config(): AnimationConfig {
    return { speed: 0.08, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Tree positions
    const treeX = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map(x => Math.floor(x * width));
    const treeBaseY = height - 2;
    
    let inTree = -1;
    for (let i = 0; i < treeX.length; i++) {
      const tx = treeX[i] ?? 0;
      const sway = Math.sin(t * 2 + i) * 2;
      const treeHeight = 5 + (i % 3) * 2;
      
      // Tree trunk and branches
      const dx = x - (tx + sway * (treeBaseY - y) / treeHeight);
      const inTrunk = Math.abs(dx) < 1 && y > treeBaseY - treeHeight;
      const inLeaves = Math.abs(dx) < 3 + (treeBaseY - y) * 0.3 && y > treeBaseY - treeHeight - 3;
      
      if (inTrunk) {
        inTree = i;
        break;
      }
      if (inLeaves) {
        inTree = i;
        break;
      }
    }
    
    let intensity = 0;
    let char = " ";
    
    if (inTree >= 0) {
      const isTrunk = y > height - 6;
      intensity = isTrunk ? 5 : 7;
      char = isTrunk ? "│" : "♣";
    }
    
    return { char, intensity };
  }
}
