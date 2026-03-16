import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Supernova animation - explosion
 */
export class SupernovaAnimation extends Animation {
  name = "supernova";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Explosion phases
    const phase = (t * 0.3) % 3;
    const maxRadius = phase * 8;
    
    // Shockwave
    const onShock = Math.abs(dist - maxRadius) < 2 && phase > 0.5;
    
    // Debris
    const debrisAngle = Math.atan2(dy, dx);
    const debris = Math.sin(debrisAngle * 5 + t * 10) > 0.8 && dist < maxRadius * 0.8;
    
    // Core
    const inCore = dist < 3 - phase * 0.5;
    
    let intensity = 0;
    let char = " ";
    
    if (inCore && phase < 2) {
      intensity = 10;
      char = "●";
    } else if (onShock) {
      intensity = 8;
      char = "○";
    } else if (debris) {
      intensity = 6;
      char = "*";
    }
    
    return { char, intensity };
  }
}
