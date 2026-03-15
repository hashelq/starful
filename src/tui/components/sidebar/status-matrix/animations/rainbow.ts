import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Rainbow animation - arc of colors
 */
export class RainbowAnimation extends Animation {
  name = "rainbow";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const baseRadius = Math.min(width, height) * 0.4;
    
    const dx = x - cx;
    const dy = y - height * 0.85;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Rainbow bands
    const bandWidth = baseRadius / 7;
    const bands = [0, 1, 2, 3, 4, 5, 6].map(i => baseRadius - i * bandWidth);
    
    let inBand = -1;
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      if (band !== undefined && Math.abs(dist - band) < bandWidth * 0.6) {
        inBand = i;
        break;
      }
    }
    
    // Only show in arc form (above horizon)
    const isArc = dy < 0 && dist > baseRadius * 0.3;
    
    if (!isArc || inBand < 0) {
      return { char: " ", intensity: 0 };
    }
    
    // ROYGBIV colors as intensity
    const intensities = [10, 9, 8, 7, 6, 5, 4];
    const intensity = intensities[inBand] ?? 5;
    
    // Animated shimmer
    const shimmer = Math.sin(t * 3 + inBand) * 0.3 + 0.7;
    const finalIntensity = Math.floor(intensity * shimmer);
    
    return {
      char: "▓",
      intensity: Math.max(1, finalIntensity),
    };
  }
}
