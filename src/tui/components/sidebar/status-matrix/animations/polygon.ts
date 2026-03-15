import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Polygon animation - rotating shape
 */
export class PolygonAnimation extends Animation {
  name = "polygon";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Rotating hexagon/octagon
    const sides = 6;
    const rotation = t * 2;
    const targetAngle = ((angle - rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const segmentAngle = (Math.PI * 2) / sides;
    const onEdge = Math.abs(dist - radius) < 1.5;
    
    // Polygon edges
    const isOnPolygon = onEdge && Math.abs(targetAngle % segmentAngle - segmentAngle / 2) < 0.3;
    
    let intensity = 0;
    let char = " ";
    
    if (isOnPolygon) {
      intensity = 10;
      char = "█";
    } else if (onEdge) {
      intensity = 6;
      char = "─";
    } else if (dist < radius * 0.3) {
      intensity = 3;
      char = "·";
    }
    
    return { char, intensity };
  }
}
