import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Volcano animation - erupting lava
 */
export class VolcanoAnimation extends Animation {
  name = "volcano";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    
    // Volcano mountain shape
    const mountainY = height - 3;
    const mountainWidth = width * 0.3;
    const dx = Math.abs(x - cx);
    const onMountain = y > mountainY - (1 - dx / mountainWidth) * (height - 5) && dx < mountainWidth;
    
    // Lava in crater
    const inCrater = y < 3 && dx < 4;
    
    // Erupting particles
    const eruptPhase = (t * 5) % 3;
    const particle1Y = 3 + Math.sin(eruptPhase * Math.PI) * eruptPhase * 3;
    const particle1X = cx + Math.cos(eruptPhase * Math.PI * 2) * eruptPhase * 2;
    const particle2Y = 3 + Math.sin((eruptPhase + 1) * Math.PI) * (eruptPhase + 1) * 2;
    const particle2X = cx + Math.cos((eruptPhase + 1) * Math.PI * 2) * (eruptPhase + 1) * 1.5;
    
    const isParticle1 = Math.abs(x - particle1X) < 1 && Math.abs(y - particle1Y) < 1;
    const isParticle2 = Math.abs(x - particle2X) < 1 && Math.abs(y - particle2Y) < 1;
    
    // Falling lava
    const fallingLava = onMountain && Math.random() > 0.97;
    
    let intensity = 0;
    let char = " ";
    
    if (isParticle1 || isParticle2) {
      intensity = 10;
      char = "*";
    } else if (inCrater) {
      intensity = 9;
      char = "▓";
    } else if (fallingLava) {
      intensity = 8;
      char = "│";
    } else if (onMountain) {
      intensity = 4;
      char = "▲";
    }
    
    return { char, intensity };
  }
}
