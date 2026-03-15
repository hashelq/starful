import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Vortex animation - spiral suction
 */
export class VortexAnimation extends Animation {
  name = "vortex";
  
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
    
    if (dist > maxDist) {
      return { char: " ", intensity: 0 };
    }
    
    // Spiral angle
    const angle = Math.atan2(dy, dx);
    const spiralTurns = 3;
    const spiral = angle + dist * spiralTurns * Math.PI / maxDist - t * 3;
    const spiralVal = Math.sin(spiral);
    
    // Swirl intensity based on distance
    const swirlFactor = 1 - dist / maxDist;
    const intensity = Math.floor((spiralVal * 0.5 + 0.5) * 10 * swirlFactor);
    
    // Chars for spiral effect
    const chars = " ·:-=+*#@";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
