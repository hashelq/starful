import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Comet animation - shooting star with tail
 */
export class CometAnimation extends Animation {
  name = "comet";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Comet position (moves diagonally)
    const cycleT = (t * 3) % 4;
    const startX = -width * 0.2;
    const endX = width * 1.2;
    const startY = height * 0.2;
    const endY = height * 0.8;
    
    const cometX = startX + (endX - startX) * (cycleT / 3);
    const cometY = startY + (endY - startY) * (cycleT / 3);
    
    // Direction for tail
    const dx = x - cometX;
    const dy = y - cometY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Tail direction (opposite to movement)
    const tailLen = 15;
    const angle = Math.atan2(endY - startY, endX - startX);
    const tailX = cometX - Math.cos(angle) * tailLen;
    const tailY = cometY - Math.sin(angle) * tailLen;
    
    // Distance to tail line
    const tailDx = x - tailX;
    const tailDy = y - tailY;
    const tailDist = Math.sqrt(tailDx * tailDx + tailDy * tailDy);
    
    // On comet head
    const onHead = dist < 2;
    // On tail
    const onTail = tailDist < tailLen && tailDist > dist;
    const tailIntensity = onTail ? Math.floor((1 - tailDist / tailLen) * 8) : 0;
    
    let intensity = 0;
    let char = " ";
    
    if (onHead) {
      intensity = 10;
      char = "●";
    } else if (tailIntensity > 0) {
      intensity = tailIntensity;
      char = tailIntensity > 5 ? "*" : "·";
    }
    
    return { char, intensity };
  }
}
