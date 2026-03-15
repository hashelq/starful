import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Star animation - pointed star
 */
export class StarAnimation extends Animation {
  name = "star";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // 5-pointed star
    const points = 5;
    const starPhase = (Math.PI / 2 - angle + t * 0.5) % (Math.PI * 2);
    const starRadius = radius * 0.6 * Math.abs(Math.sin(starPhase * points / 2));
    
    const onStar = Math.abs(dist - starRadius) < 2;
    
    // Inner glow
    const inGlow = dist < radius * 0.3;
    
    let intensity = 0;
    let char = " ";
    
    if (onStar) {
      intensity = 10;
      char = "*";
    } else if (inGlow) {
      intensity = 6;
      char = "·";
    }
    
    return { char, intensity };
  }
}
