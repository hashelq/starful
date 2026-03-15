import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Lissajous animation - complex curve pattern
 */
export class LissajousAnimation extends Animation {
  name = "lissajous";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.4;
    
    // Lissajous curve
    const a = 3;
    const b = 2;
    const lissX = cx + Math.sin(a * t) * scale;
    const lissY = cy + Math.sin(b * t) * scale;
    
    const dx = x - lissX;
    const dy = y - lissY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Trail
    const trail = [];
    for (let i = 0; i < 20; i++) {
      const tt = t - i * 0.05;
      trail.push({
        x: cx + Math.sin(a * tt) * scale,
        y: cy + Math.sin(b * tt) * scale,
      });
    }
    
    let onTrail = false;
    for (const p of trail) {
      if (Math.abs(x - p.x) < 1 && Math.abs(y - p.y) < 1) {
        onTrail = true;
        break;
      }
    }
    
    let intensity = 0;
    let char = " ";
    
    if (onTrail) {
      intensity = 9;
      char = "●";
    } else if (dist < 3) {
      intensity = 10;
      char = "●";
    }
    
    return { char, intensity };
  }
}
