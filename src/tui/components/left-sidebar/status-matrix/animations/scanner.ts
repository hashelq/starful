import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Scanner animation - radar sweep
 */
export class ScannerAnimation extends Animation {
  name = "scanner";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 1;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
    
    // Sweep line
    const sweepAngle = (t * 2) % (Math.PI * 2);
    const angleDiff = (angle - sweepAngle + Math.PI * 2) % (Math.PI * 2);
    
    // Outer ring
    const onRing = Math.abs(dist - radius) < 1;
    
    // Sweep line with fade
    const onSweep = angleDiff < 0.3 && dist < radius;
    const sweepIntensity = onSweep ? Math.floor((0.3 - angleDiff) * 30) : 0;
    
    // Grid lines (concentric circles)
    const onGrid = Math.abs(dist % (radius / 4)) < 0.5 && dist < radius;
    
    // Cross lines
    const onCrossH = Math.abs(y - cy) < 1 && dist < radius;
    const onCrossV = Math.abs(x - cx) < 1 && dist < radius;
    
    // Random blips
    const blipAngle = (Math.sin(t * 0.7) * Math.PI + Math.PI * 2) % (Math.PI * 2);
    const blipDist = radius * 0.6 + Math.sin(t * 1.3) * radius * 0.3;
    const blipX = cx + Math.cos(blipAngle) * blipDist;
    const blipY = cy + Math.sin(blipAngle) * blipDist;
    const isBlip = Math.abs(x - blipX) < 2 && Math.abs(y - blipY) < 2;
    
    let intensity = 0;
    let char = " ";
    
    if (onRing) intensity = 8;
    else if (onCrossH || onCrossV) intensity = 3;
    else if (onGrid) intensity = 2;
    else if (sweepIntensity > 0) intensity = sweepIntensity;
    
    if (isBlip) {
      intensity = 10;
      char = "●";
    } else if (onRing) {
      char = "○";
    } else if (onCrossH || onCrossV) {
      char = "┼";
    }
    
    return { char, intensity: Math.min(intensity, 10) };
  }
}
