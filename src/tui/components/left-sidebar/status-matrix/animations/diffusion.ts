import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Diffusion animation - spreading molecules
 */
export class DiffusionAnimation extends Animation {
  name = "diffusion";
  
  override get config(): AnimationConfig {
    return { speed: 0.12, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Diffusion from center outward
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Expanding ring
    const ringPos = ((t * 3) % (width * 0.6));
    const onRing = Math.abs(dist - ringPos) < 2;
    
    // Random particles
    const particle = Math.random() > 0.99;
    
    // Concentration gradient
    const gradient = Math.max(0, 1 - dist / (width * 0.5));
    
    let intensity = 0;
    let char = " ";
    
    if (particle) {
      intensity = 8;
      char = "·";
    } else if (onRing) {
      intensity = 7;
      char = "○";
    } else if (gradient > 0.3) {
      intensity = Math.floor(gradient * 4);
    }
    
    return { char, intensity };
  }
}
