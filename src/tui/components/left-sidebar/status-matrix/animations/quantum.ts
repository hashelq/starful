import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Quantum animation - probability cloud
 */
export class QuantumAnimation extends Animation {
  name = "quantum";
  
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
    const maxDist = Math.min(width, height) / 2;
    
    // Probability cloud - particles in orbital shells
    const shell1 = Math.abs(dist - maxDist * 0.3) < 1.5;
    const shell2 = Math.abs(dist - maxDist * 0.5) < 1.5;
    const shell3 = Math.abs(dist - maxDist * 0.7) < 1.5;
    
    // Orbital rotation
    const angle = Math.atan2(dy, dx);
    const orbitalPhase = angle + t * 2;
    const isParticle = Math.sin(orbitalPhase * 3) > 0.7;
    
    // Random quantum fluctuations
    const fluctuation = Math.random() > 0.995;
    
    let intensity = 0;
    let char = " ";
    
    if (fluctuation) {
      intensity = 10;
      char = "*";
    } else if (shell1 && isParticle) {
      intensity = 8;
      char = "●";
    } else if (shell2 && isParticle) {
      intensity = 6;
      char = "○";
    } else if (shell3 && isParticle) {
      intensity = 4;
      char = "·";
    }
    
    return { char, intensity };
  }
}
