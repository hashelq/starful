import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Sonar animation - circular pings
 */
export class SonarAnimation extends Animation {
  name = "sonar";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Multiple expanding rings
    const ring1 = Math.abs(dist - ((t * 5) % 15)) < 1;
    const ring2 = Math.abs(dist - ((t * 5 + 5) % 15)) < 1;
    const ring3 = Math.abs(dist - ((t * 5 + 10) % 15)) < 1;
    
    // Center point (emitter)
    const isCenter = dist < 2;
    
    let intensity = 0;
    let char = " ";
    
    if (isCenter) {
      intensity = 10;
      char = "●";
    } else if (ring1) {
      intensity = 8;
      char = "○";
    } else if (ring2) {
      intensity = 6;
      char = "○";
    } else if (ring3) {
      intensity = 4;
      char = "○";
    }
    
    return { char, intensity };
  }
}
