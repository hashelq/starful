import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Fractal animation - recursive pattern
 */
export class FractalAnimation extends Animation {
  name = "fractal";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Recursive subdivision pattern
    const scale = 1;
    const xScaled = x / scale + tick;
    const yScaled = y / scale + tick + Math.floor(Math.random() * 4);
    
    // Sierpinski-like pattern
    const fractal = (xScaled + t) & (yScaled + t);
    const isFractal = (xScaled & yScaled) === 0;
    
    let intensity = 0;
    let char = " ";
    
    if (isFractal) {
      intensity = 8;
      char = "█";
    } else if (Math.random() > 0.98) {
      intensity = 3;
      char = "·";
    }
    
    return { char, intensity };
  }
}
