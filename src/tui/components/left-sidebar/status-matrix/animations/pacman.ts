import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Pacman animation - chomping character
 */
export class PacmanAnimation extends Animation {
  name = "pacman";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Pacman position
    const pacX = Math.floor(width / 2);
    const pacY = Math.floor(height / 2);
    
    // Chomping animation
    const mouthOpen = Math.sin(t * 8) > 0 ? 1 : 0;
    
    // Pacman circle (simplified)
    const dx = x - pacX;
    const dy = y - pacY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Mouth opening
    const onMouth = mouthOpen === 1 && Math.abs(angle) < 0.5;
    const inPacman = dist < 4 && !onMouth;
    
    // Ghost
    const ghostX = pacX + 8;
    const ghostY = pacY;
    const gdx = x - ghostX;
    const gdy = y - ghostY;
    const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
    const inGhost = gdist < 3;
    
    let intensity = 0;
    let char = " ";
    
    if (inPacman) {
      intensity = 10;
      char = "●";
    } else if (inGhost) {
      intensity = 9;
      char = "▼";
    }
    
    return { char, intensity };
  }
}
