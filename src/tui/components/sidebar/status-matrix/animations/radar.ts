import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Radar animation - scanning sweep (similar to scanner but with different style)
 */
export class RadarAnimation extends Animation {
  name = "radar";
  
  override get config(): AnimationConfig {
    return { speed: 0.12, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 2;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
    
    // Sweep line (360 degree rotation)
    const sweepAngle = (t * 2) % (Math.PI * 2);
    const angleDiff = Math.abs(angle - sweepAngle);
    const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
    
    // Sweep with trail
    const onSweep = normalizedDiff < 0.4 && dist < radius;
    const trailIntensity = onSweep ? Math.floor((0.4 - normalizedDiff) * 25) : 0;
    
    // Concentric rings
    const onRing = Math.abs(dist % (radius / 3)) < 1 && dist < radius;
    
    // Random blips
    const blipPhase = Math.sin(t * 0.5) * Math.PI;
    const blipDist = radius * 0.5 + Math.sin(t * 1.2) * radius * 0.3;
    const blipAngle = blipPhase;
    const blipX = cx + Math.cos(blipAngle) * blipDist;
    const blipY = cy + Math.sin(blipAngle) * blipDist;
    const isBlip = Math.abs(x - blipX) < 2 && Math.abs(y - blipY) < 2;
    
    let intensity = 0;
    let char = " ";
    
    if (isBlip) {
      intensity = 10;
      char = "●";
    } else if (onRing) {
      intensity = 4;
      char = "○";
    } else if (trailIntensity > 0) {
      intensity = trailIntensity;
    }
    
    return { char, intensity: Math.min(intensity, 10) };
  }
}
