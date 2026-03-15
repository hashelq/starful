import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Tornado animation - rotating funnel
 */
export class TornadoAnimation extends Animation {
  name = "tornado";
  
  override get config(): AnimationConfig {
    return { speed: 0.12, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    
    // Tornado funnel - widens at top, narrows at bottom
    const funnelWidth = (1 - y / height) * width * 0.3 + width * 0.05;
    const dx = Math.abs(x - cx);
    
    // In funnel
    const inFunnel = dx < funnelWidth;
    
    // Rotating spiral
    const spiralAngle = y * 0.3 - t * 4;
    const spiral = Math.sin(spiralAngle + dx * 0.5);
    
    // Funnel shape intensity
    const funnelIntensity = inFunnel ? (1 - dx / funnelWidth) * 10 : 0;
    const spiralIntensity = Math.abs(spiral) * funnelIntensity;
    
    // Debris particles
    const debris = Math.random() > 0.98 ? 8 : 0;
    
    const intensity = Math.floor(spiralIntensity + debris);
    
    const chars = " ·:-=*#@█";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
