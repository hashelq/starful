import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Laser animation - beam firing
 */
export class LaserAnimation extends Animation {
  name = "laser";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Laser firing from left to right
    const beamY = height / 2;
    const beamProgress = (t * 5) % (width + 10);
    const beamX = beamProgress - 5;
    
    const dy = Math.abs(y - beamY);
    const dx = x - beamX;
    
    // Laser beam
    const onBeam = dx > 0 && dx < width - 5 && dy < 1;
    
    // Impact flash at the end
    const impactX = width - 5;
    const impactDy = Math.abs(y - beamY);
    const impactDist = Math.abs(x - impactX);
    const atImpact = impactDist < 3 + Math.sin(t * 20) * 2;
    
    let intensity = 0;
    let char = " ";
    
    if (onBeam) {
      intensity = 10;
      char = "─";
    } else if (atImpact && impactDy < 2) {
      intensity = Math.floor(10 - impactDy * 4);
      char = "*";
    }
    
    return { char, intensity };
  }
}
