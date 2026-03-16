import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Torus animation - donut shape
 */
export class TorusAnimation extends Animation {
  name = "torus";
  
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
    
    // Torus parameters
    const mainRadius = Math.min(width, height) * 0.3;
    const tubeRadius = mainRadius * 0.3;
    
    // Torus shape
    const onTorus = Math.abs(dist - mainRadius) < tubeRadius;
    
    // Wireframe rings
    const angle = Math.atan2(dy, dx);
    const onRing1 = Math.abs(Math.sin(angle * 5 + t)) < 0.15 && onTorus;
    const onRing2 = Math.abs(Math.sin(angle * 8 - t * 0.7)) < 0.15 && onTorus;
    
    let intensity = 0;
    let char = " ";
    
    if (onRing1 || onRing2) {
      intensity = 9;
      char = "○";
    } else if (onTorus) {
      intensity = 5;
      char = "─";
    }
    
    return { char, intensity };
  }
}
