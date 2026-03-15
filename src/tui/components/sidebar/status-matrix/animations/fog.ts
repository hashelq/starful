import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Fog animation - rolling mist
 */
export class FogAnimation extends Animation {
  name = "fog";
  
  override get config(): AnimationConfig {
    return { speed: 0.05, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Multiple fog layers
    const fog1 = Math.sin(x * 0.05 + t) * Math.cos(y * 0.1 + t * 0.5);
    const fog2 = Math.sin(x * 0.08 - t * 0.7) * Math.sin(y * 0.15 + t * 0.3);
    const fog3 = Math.sin(x * 0.03 + t * 0.5) * Math.cos(y * 0.08 - t * 0.4);
    
    const combined = (fog1 + fog2 + fog3) / 3;
    const intensity = Math.floor((combined * 0.5 + 0.5) * 7);
    
    // More fog at bottom
    const yFactor = 1 - (y / height) * 0.5;
    const finalIntensity = Math.floor(intensity * yFactor);
    
    const chars = " .,-~≡╱";
    const charIdx = Math.min(Math.floor(finalIntensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.max(1, finalIntensity),
    };
  }
}
