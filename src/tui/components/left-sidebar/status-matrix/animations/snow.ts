import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Snow animation - gentle falling snowflakes
 */
export class SnowAnimation extends Animation {
  name = "snow";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, _width: number, _height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Create multiple layers of snow
    const layer1 = Math.abs(Math.sin(x * 0.5 + t) * Math.cos(y * 0.3 - t * 0.5)) > 0.7;
    const layer2 = Math.abs(Math.sin(x * 0.8 + t * 1.5) * Math.cos(y * 0.5 - t * 0.8)) > 0.8;
    const layer3 = Math.abs(Math.sin(x * 0.3 + t * 0.7) * Math.cos(y * 0.2 - t * 0.3)) > 0.85;
    
    let intensity = 0;
    let char = " ";
    
    if (layer1) {
      intensity = 6;
      char = "·";
    }
    if (layer2) {
      intensity = 8;
      char = "*";
    }
    if (layer3) {
      intensity = 10;
      char = "✶";
    }
    
    return { char, intensity };
  }
}
