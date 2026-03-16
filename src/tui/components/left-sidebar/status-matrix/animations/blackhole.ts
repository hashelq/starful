import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Blackhole animation - spacetime warping
 */
export class BlackholeAnimation extends Animation {
  name = "blackhole";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.45;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Event horizon
    const onHorizon = Math.abs(dist - 2) < 1;
    
    // Accretion disk
    const onDisk = dist < maxR && dist > 3;
    const diskAngle = Math.atan2(dy, dx);
    const diskPattern = Math.sin(dist * 0.5 - t * 3 + diskAngle * 3);
    const isDisk = onDisk && diskPattern > 0.5;
    
    // Gravitational lensing effect
    const lensing = Math.sin(dist * 0.3 + t) > 0.7 && dist < maxR;
    
    let intensity = 0;
    let char = " ";
    
    if (onHorizon) {
      intensity = 10;
      char = "●";
    } else if (isDisk) {
      intensity = 8;
      char = "▓";
    } else if (lensing) {
      intensity = 4;
      char = "·";
    }
    
    return { char, intensity };
  }
}
