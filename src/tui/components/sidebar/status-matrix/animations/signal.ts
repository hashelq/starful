import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Signal animation - wave transmission
 */
export class SignalAnimation extends Animation {
  name = "signal";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Sine wave moving outward
    const wavePhase = (x - cx) * 0.15 - t * 3;
    const waveY = cy + Math.sin(wavePhase) * height * 0.3;
    
    const dy = Math.abs(y - waveY);
    
    // Wave intensity
    const intensity = dy < 2 ? 9 : dy < 4 ? 5 : dy < 6 ? 2 : 0;
    
    let char = " ";
    if (intensity > 6) char = "●";
    else if (intensity > 3) char = "─";
    else if (intensity > 0) char = "·";
    
    return { char, intensity };
  }
}
