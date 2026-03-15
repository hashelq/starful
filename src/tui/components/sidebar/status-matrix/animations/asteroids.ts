import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Asteroids animation - ship with rocks
 */
export class AsteroidsAnimation extends Animation {
  name = "asteroids";
  
  override get config(): AnimationConfig {
    return { speed: 0.12, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Ship
    const shipX = Math.floor(width / 2);
    const shipY = Math.floor(height / 2);
    const shipAngle = t * 0.5;
    
    // Asteroids
    const asteroids = [
      { x: 0.2, y: 0.3, r: 3 },
      { x: 0.7, y: 0.6, r: 4 },
      { x: 0.8, y: 0.2, r: 2 },
    ];
    
    // Check ship (triangle)
    const shipDX = Math.abs(x - shipX);
    const shipDY = y - shipY;
    const onShip = shipDX < 2 && shipDY > -2 && shipDY < 1;
    
    // Check asteroids
    let onAsteroid = false;
    for (const a of asteroids) {
      const ax = a.x * width;
      const ay = a.y * height;
      const dist = Math.sqrt((x - ax) ** 2 + (y - ay) ** 2);
      if (dist < a.r) onAsteroid = true;
    }
    
    let intensity = 0;
    let char = " ";
    
    if (onShip) {
      intensity = 10;
      char = "▲";
    } else if (onAsteroid) {
      intensity = 7;
      char = "●";
    }
    
    return { char, intensity };
  }
}
