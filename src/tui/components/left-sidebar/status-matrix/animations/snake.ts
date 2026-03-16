import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Snake animation - slithering snake
 */
export class SnakeAnimation extends Animation {
  name = "snake";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Snake head position
    const headX = ((t * 3) % (width - 6)) + 3;
    const headY = Math.floor(height / 2 + Math.sin(t * 0.5) * (height * 0.3));
    
    // Snake body (trailing)
    const bodySegments = 6;
    let onBody = false;
    
    for (let i = 1; i <= bodySegments; i++) {
      const segX = headX - i * 2;
      const segY = headY + Math.sin(t + i * 0.5) * i;
      if (Math.abs(x - segX) < 1 && Math.abs(y - Math.floor(segY)) < 1) {
        onBody = true;
        break;
      }
    }
    
    const onHead = Math.abs(x - headX) < 1 && Math.abs(y - headY) < 1;
    
    let intensity = 0;
    let char = " ";
    
    if (onHead) {
      intensity = 10;
      char = "●";
    } else if (onBody) {
      intensity = 7;
      char = "─";
    }
    
    return { char, intensity };
  }
}
