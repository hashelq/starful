import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Starfield animation - flying through space
 */
export class StarfieldAnimation extends Animation {
  name = "starfield";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Stars coming toward viewer (z-depth simulation)
    const stars = [
      { x: 0.2, y: 0.3, z: 0.1 },
      { x: 0.5, y: 0.2, z: 0.15 },
      { x: 0.8, y: 0.6, z: 0.08 },
      { x: 0.3, y: 0.7, z: 0.12 },
      { x: 0.7, y: 0.4, z: 0.1 },
      { x: 0.1, y: 0.5, z: 0.2 },
      { x: 0.9, y: 0.3, z: 0.05 },
      { x: 0.4, y: 0.8, z: 0.18 },
    ];
    
    let intensity = 0;
    let char = " ";
    
    for (const star of stars) {
      // Move star toward center based on z
      const z = (star.z + t * 0.1) % 1;
      const projX = cx + (star.x - 0.5) / z * width * 0.5;
      const projY = cy + (star.y - 0.5) / z * height * 0.5;
      const size = Math.floor(3 - z * 2);
      
      const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
      
      if (dist < size) {
        intensity = Math.floor(10 - z * 8);
        char = "*";
      }
    }
    
    return { char, intensity };
  }
}
