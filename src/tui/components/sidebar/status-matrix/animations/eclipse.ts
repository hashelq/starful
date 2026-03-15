import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Eclipse animation - solar/lunar eclipse
 */
export class EclipseAnimation extends Animation {
  name = "eclipse";
  
  override get config(): AnimationConfig {
    return { speed: 0.08, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const sunRadius = Math.min(width, height) / 2 - 2;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Moon position (moving across)
    const moonX = cx + Math.sin(t * 2) * sunRadius * 1.5;
    const moonY = cy;
    const moonRadius = sunRadius * 0.9;
    
    const moonDx = x - moonX;
    const moonDy = y - moonY;
    const moonDist = Math.sqrt(moonDx * moonDx + moonDy * moonDy);
    
    // Corona (visible during eclipse)
    const coronaDist = Math.abs(dist - sunRadius);
    const isCorona = coronaDist < 3 && moonDist > moonRadius;
    const coronaIntensity = isCorona ? Math.floor((3 - coronaDist) * 3) : 0;
    
    // Sun outside eclipse
    const isSun = dist < sunRadius && moonDist > moonRadius;
    
    // Moon
    const isMoon = moonDist < moonRadius;
    
    // Totality (when moon fully covers)
    const inTotality = isMoon && moonDist < moonRadius * 0.8;
    
    let intensity = 0;
    let char = " ";
    
    if (inTotality) {
      intensity = 1;
      char = " ";
    } else if (isMoon) {
      intensity = 3;
      char = "●";
    } else if (isSun) {
      intensity = 10;
      char = "●";
    } else if (coronaIntensity > 0) {
      intensity = coronaIntensity;
      char = "~";
    }
    
    return { char, intensity };
  }
}
