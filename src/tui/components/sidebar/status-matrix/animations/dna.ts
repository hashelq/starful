import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * DNA animation - double helix
 */
export class DNAAnimation extends Animation {
  name = "dna";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    
    // Double helix parameters
    const amplitude = 4;
    const wavelength = 8;
    const phase1 = (y * wavelength / height + t * 2) % (Math.PI * 2);
    const phase2 = (phase1 + Math.PI) % (Math.PI * 2);
    
    const strand1X = cx + Math.sin(phase1) * amplitude;
    const strand2X = cx + Math.sin(phase2) * amplitude;
    
    // Rungs (base pairs)
    const onRung = Math.abs(x - strand1X) < 2 || Math.abs(x - strand2X) < 2;
    const isRung = x > strand1X && x < strand2X && Math.abs(y % 3) < 1;
    
    let intensity = 0;
    let char = " ";
    
    if (Math.abs(x - strand1X) < 1 || Math.abs(x - strand2X) < 1) {
      intensity = 9;
      char = "│";
    } else if (isRung) {
      intensity = 5;
      char = "─";
    }
    
    return { char, intensity };
  }
}
