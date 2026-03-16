import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Electron animation - orbiting particle
 */
export class ElectronAnimation extends Animation {
  name = "electron";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Electron orbiting nucleus
    const orbitRadius = Math.min(width, height) * 0.3;
    const angle = t * 2;
    const electronX = cx + Math.cos(angle) * orbitRadius;
    const electronY = cy + Math.sin(angle) * orbitRadius * 0.5;
    
    const dx = x - electronX;
    const dy = y - electronY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Nucleus
    const nucleusDist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const isNucleus = nucleusDist < 2;
    
    // Electron path (ellipse)
    const onPath = Math.abs(Math.sqrt((x - cx) ** 2 + ((y - cy) / 0.5) ** 2) - orbitRadius) < 1;
    
    let intensity = 0;
    let char = " ";
    
    if (isNucleus) {
      intensity = 10;
      char = "●";
    } else if (dist < 2) {
      intensity = 9;
      char = "●";
    } else if (onPath) {
      intensity = 3;
      char = "─";
    }
    
    return { char, intensity };
  }
}
