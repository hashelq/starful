import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Atom animation - Bohr model
 */
export class AtomAnimation extends Animation {
  name = "atom";
  
  override get config(): AnimationConfig {
    return { speed: 0.12, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Multiple electron orbits
    const orbits = [0.25, 0.4, 0.55];
    
    // Nucleus
    const nucDist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const isNucleus = nucDist < 2;
    
    // Electrons on orbits
    let onElectron = false;
    let onOrbit = false;
    
    for (let i = 0; i < orbits.length; i++) {
      const orbitVal = orbits[i] ?? 0.3;
      const orbitR = orbitVal * Math.min(width, height);
      const angle = t * (2 - i * 0.3);
      const ex = cx + Math.cos(angle) * orbitR;
      const ey = cy + Math.sin(angle) * orbitR * 0.6;
      
      const eDist = Math.sqrt((x - ex) ** 2 + (y - ey) ** 2);
      if (eDist < 2) onElectron = true;
      
      const oDist = Math.abs(Math.sqrt((x - cx) ** 2 + ((y - cy) / 0.6) ** 2) - orbitR);
      if (oDist < 1) onOrbit = true;
    }
    
    let intensity = 0;
    let char = " ";
    
    if (isNucleus) {
      intensity = 10;
      char = "●";
    } else if (onElectron) {
      intensity = 9;
      char = "●";
    } else if (onOrbit) {
      intensity = 3;
      char = "─";
    }
    
    return { char, intensity };
  }
}
