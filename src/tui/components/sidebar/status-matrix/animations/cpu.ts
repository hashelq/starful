import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * CPU animation - processing visualization
 */
export class CPUAnimation extends Animation {
  name = "cpu";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    
    // CPU core (center square)
    const inCore = Math.abs(x - cx) < 3 && Math.abs(y - cy) < 3;
    
    // Heat radiating outward
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const heatWave = Math.sin(dist * 0.8 - t * 5);
    const isHeat = dist < 8 && heatWave > 0;
    
    // Processing cores (corners)
    const corners = [
      { cx: 3, cy: 3 },
      { cx: width - 4, cy: 3 },
      { cx: 3, cy: height - 4 },
      { cx: width - 4, cy: height - 4 },
    ];
    
    let inCorner = -1;
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      if (c && Math.abs(x - c.cx) < 2 && Math.abs(y - c.cy) < 2) {
        inCorner = i;
        break;
      }
    }
    
    let intensity = 0;
    let char = " ";
    
    if (inCore) {
      intensity = 10;
      char = "█";
    } else if (inCorner >= 0) {
      const pulse = Math.sin(t * 3 + inCorner) > 0 ? 8 : 4;
      intensity = pulse;
      char = "▓";
    } else if (isHeat) {
      intensity = Math.floor((heatWave + 1) * 4);
      char = "·";
    }
    
    return { char, intensity };
  }
}
