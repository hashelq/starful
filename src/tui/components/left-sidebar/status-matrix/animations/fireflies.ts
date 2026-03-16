import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Fireflies animation - glowing bugs at night
 */
export class FirefliesAnimation extends Animation {
  name = "fireflies";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Firefly positions (moving randomly)
    const fireflies = [
      { x: 0.1, y: 0.3, vx: 0.3, vy: 0.2, phase: 0 },
      { x: 0.3, y: 0.6, vx: 0.4, vy: 0.3, phase: 1 },
      { x: 0.5, y: 0.4, vx: 0.25, vy: 0.35, phase: 2 },
      { x: 0.7, y: 0.7, vx: 0.35, vy: 0.25, phase: 3 },
      { x: 0.85, y: 0.25, vx: 0.3, vy: 0.4, phase: 4 },
      { x: 0.2, y: 0.8, vx: 0.45, vy: 0.2, phase: 5 },
      { x: 0.6, y: 0.15, vx: 0.35, vy: 0.3, phase: 6 },
      { x: 0.9, y: 0.5, vx: 0.25, vy: 0.35, phase: 7 },
    ];
    
    let intensity = 0;
    let char = " ";
    
    for (const fly of fireflies) {
      // Position with movement
      const fx = ((fly.x * width + Math.sin(t * fly.vx) * width * 0.2) % width);
      const fy = ((fly.y * height + Math.cos(t * fly.vy) * height * 0.15) % height);
      
      // Glowing pulse
      const pulse = Math.sin(t * 3 + fly.phase * Math.PI / 4) * 0.5 + 0.5;
      
      const dx = x - fx;
      const dy = y - fy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 1 && pulse > 0.6) {
        intensity = 10;
        char = "●";
      } else if (dist < 2 && pulse > 0.3) {
        intensity = 5;
        char = "·";
      }
    }
    
    return { char, intensity };
  }
}
