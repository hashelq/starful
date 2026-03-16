import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Heartbeat animation - pulsing heart rhythm
 */
export class HeartbeatAnimation extends Animation {
  name = "heartbeat";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Heartbeat pulse - two beats then pause
    const beatPhase = (t * 3) % 4;
    const pulse = beatPhase < 1 ? 1 - beatPhase * 0.3 :
                  beatPhase < 1.5 ? 0.7 + (beatPhase - 1) * 0.6 :
                  beatPhase < 2 ? 1.0 - (beatPhase - 1.5) * 0.4 : 1;
    
    // Heart shape (two curves meeting at bottom)
    const dx = (x - cx) / (width * 0.15 * pulse);
    const dy = (y - cy) / (height * 0.15 * pulse);
    
    // Heart formula
    const heart = Math.pow(dx * dx + dy * dy - 1, 3) - dx * dx * dy * dy * dy;
    const inHeart = heart < 0;
    
    // Beat ring
    const dist = Math.sqrt(dx * dx + dy * dy);
    const onRing = Math.abs(dist - 1.2 - pulse * 0.3) < 0.3;
    
    let intensity = 0;
    let char = " ";
    
    if (inHeart) {
      intensity = 10;
      char = "♥";
    } else if (onRing) {
      intensity = 4;
      char = "○";
    }
    
    return { char, intensity };
  }
}
