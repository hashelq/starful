import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Sphere animation - wireframe ball
 */
export class SphereAnimation extends Animation {
  name = "sphere";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Only show inside sphere radius
    if (dist > radius) {
      return { char: " ", intensity: 0 };
    }
    
    // Longitude and latitude lines
    const angle = Math.atan2(dy, dx);
    const onLong = Math.abs(Math.sin(angle * 3 + t)) < 0.2;
    const onLat = Math.abs(Math.sin((dist / radius) * Math.PI * 3 + t * 0.5)) < 0.2;
    
    // Outer ring
    const onRing = Math.abs(dist - radius) < 1.5;
    
    let intensity = 0;
    let char = " ";
    
    if (onRing) {
      intensity = 8;
      char = "○";
    } else if (onLong || onLat) {
      intensity = 6;
      char = "─";
    } else {
      intensity = Math.floor((1 - dist / radius) * 4);
      char = "·";
    }
    
    return { char, intensity };
  }
}
