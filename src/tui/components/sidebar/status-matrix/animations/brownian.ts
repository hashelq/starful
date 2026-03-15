import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Brownian animation - random motion
 */
export class BrownianAnimation extends Animation {
  name = "brownian";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Multiple particles with Brownian motion
    const particles = [
      { seed: 0.1, speed: 0.8 },
      { seed: 0.3, speed: 0.6 },
      { seed: 0.5, speed: 0.7 },
      { seed: 0.7, speed: 0.9 },
      { seed: 0.9, speed: 0.5 },
    ];
    
    let intensity = 0;
    let char = " ";
    
    for (const p of particles) {
      // Pseudo-random position based on seed
      const px = ((Math.sin(t * p.speed + p.seed * 10) * 0.5 + 0.5) * (width - 4)) + 2;
      const py = ((Math.cos(t * p.speed * 1.3 + p.seed * 7) * 0.5 + 0.5) * (height - 4)) + 2;
      
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      
      if (dist < 1.5) {
        intensity = 10;
        char = "●";
      } else if (dist < 2.5) {
        intensity = 6;
        char = "○";
      }
    }
    
    return { char, intensity };
  }
}
