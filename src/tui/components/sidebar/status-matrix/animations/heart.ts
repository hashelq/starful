import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Pulse rings animation - concentric pulsing rings
 */
export class PulseRingsAnimation extends Animation {
  name = "pulserings";
  
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
    
    // Concentric pulsing rings
    const ring1 = Math.abs(dist - 5 - Math.sin(t * 3) * 2) < 1;
    const ring2 = Math.abs(dist - 10 - Math.sin(t * 2) * 3) < 1;
    const ring3 = Math.abs(dist - 15 - Math.sin(t * 1.5) * 4) < 1;
    
    let intensity = 0;
    let char = " ";
    
    if (ring1) {
      intensity = 10;
      char = "●";
    } else if (ring2) {
      intensity = 7;
      char = "○";
    } else if (ring3) {
      intensity = 4;
      char = "○";
    }
    
    return { char, intensity };
  }
}
