import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * GameOfLife animation - cellular automaton
 */
export class GameOfLifeAnimation extends Animation {
  name = "gameoflife";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Pseudo-random but deterministic grid based on position
    const seed = x * 7 + y * 13 + Math.floor(t * 0.5);
    const isAlive = Math.sin(seed * 0.1) > 0.3;
    
    // Glider pattern moving
    const gliderX = ((t * 2) % width);
    const gliderY = ((t * 1) % height);
    const onGlider = Math.abs(x - gliderX) < 2 && Math.abs(y - gliderY) < 2;
    
    let intensity = 0;
    let char = " ";
    
    if (onGlider) {
      intensity = 10;
      char = "█";
    } else if (isAlive) {
      intensity = 7;
      char = "▓";
    }
    
    return { char, intensity };
  }
}
