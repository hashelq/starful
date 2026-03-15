import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Mandelbrot animation - fractal set
 */
export class MandelbrotAnimation extends Animation {
  name = "mandelbrot";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Mandelbrot set calculation
    const x0 = (x / width) * 3.5 - 2.5;
    const y0 = (y / height) * 2 - 1;
    
    let zx = 0;
    let zy = 0;
    let iter = 0;
    const maxIter = 20;
    
    while (zx * zx + zy * zy < 4 && iter < maxIter) {
      const xtemp = zx * zx - zy * zy + x0;
      zy = 2 * zx * zy + y0;
      zx = xtemp;
      iter++;
    }
    
    const intensity = iter === maxIter ? 0 : Math.floor(iter * 0.5);
    
    const chars = " .·:+*#@█";
    const charIdx = Math.min(Math.floor(intensity * chars.length / 10), chars.length - 1);
    
    return {
      char: chars[charIdx] || " ",
      intensity: Math.min(intensity, 10),
    };
  }
}
