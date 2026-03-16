import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Galaxy animation - swirling cosmic dust
 */
export class GalaxyAnimation extends Animation {
  name = "galaxy";
  
  override get config(): AnimationConfig {
    return { speed: 0.05, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Distance from center
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Angle from center
    let angle = Math.atan2(dy, dx);
    
    // Spiral arms
    const arms = 3;
    const armAngle = angle + dist * 0.1 - t * 2;
    const spiral = Math.sin(armAngle * arms);
    
    // Core brightness
    const core = Math.max(0, 1 - dist / (width * 0.3));
    
    // Random stars
    const star = Math.random() > 0.995 ? 10 : 0;
    
    const intensity = Math.floor((spiral * 0.5 + 0.5) * 8 * (1 - dist / width) + core * 3 + star);
    
    // Use different chars based on intensity
    const chars = " ·:*+&#@";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.min(Math.max(intensity, 0), 10),
    };
  }
}
