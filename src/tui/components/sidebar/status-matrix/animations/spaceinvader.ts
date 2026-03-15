import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * SpaceInvader animation - little alien
 */
export class SpaceInvaderAnimation extends Animation {
  name = "spaceinvader";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Invader position (moving side to side)
    const invaderX = Math.floor(width / 2 + Math.sin(t) * width * 0.3);
    const invaderY = Math.floor(height / 2);
    
    // Invader sprite (simplified 5x4)
    const sprite = [
      "  ▄   ▄ ",
      " ▀█▀▀█▀▀ ",
      " ▀█████▀ ",
      "  ▀▀ ▀▀  ",
    ];
    
    const spriteX = x - invaderX + 4;
    const spriteY = y - invaderY + 2;
    
    let intensity = 0;
    let char = " ";
    
    if (spriteY >= 0 && spriteY < sprite.length) {
      const row = sprite[spriteY];
      if (row && spriteX >= 0 && spriteX < row.length) {
        const spriteChar = row[spriteX];
        if (spriteChar && spriteChar !== " ") {
          intensity = 9;
          char = spriteChar;
        }
      }
    }
    
    return { char, intensity };
  }
}
