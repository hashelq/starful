import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * WiFi animation - spreading waves
 */
export class WiFiAnimation extends Animation {
  name = "wifi";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height * 0.8;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // WiFi arcs (concentric circles above a point)
    const arcs = [2, 5, 8, 11, 14];
    const arcPositions = arcs.map(a => a + Math.sin(t * 2) * 0.5);
    
    let inArc = -1;
    for (let i = 0; i < arcPositions.length; i++) {
      const arcPos = arcPositions[i];
      if (arcPos !== undefined && Math.abs(dist - arcPos) < 1.5) {
        inArc = i;
        break;
      }
    }
    
    // Only show arcs above the base point
    if (dy > 0) {
      return { char: " ", intensity: 0 };
    }
    
    let intensity = 0;
    let char = " ";
    
    if (inArc >= 0) {
      intensity = 10 - inArc;
      char = "─";
    }
    
    // Base dot
    if (dist < 2) {
      intensity = 10;
      char = "●";
    }
    
    return { char, intensity };
  }
}
