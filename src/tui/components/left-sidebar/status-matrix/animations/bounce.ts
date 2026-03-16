import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Bounce animation - bouncing balls with gravity
 */
export class BounceAnimation extends Animation {
  name = "bounce";
  
  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Multiple balls with different properties
    const balls = [
      { x: 0.2, vx: 0.8, vy: 0.3, phase: 0, size: 1 },
      { x: 0.5, vx: 1.0, vy: 0.4, phase: 1.5, size: 1.5 },
      { x: 0.8, vx: 0.6, vy: 0.35, phase: 3, size: 1 },
    ];
    
    let intensity = 0;
    let char = " ";
    
    for (const ball of balls) {
      // Bounce physics
      const bounceT = (t + ball.phase) * ball.vy * 5;
      const bounceY = Math.abs(Math.sin(bounceT * Math.PI)) * (height - 3) + 1;
      const ballX = ((t * ball.vx * 10 + ball.x * width) % (width - 2)) + 1;
      
      // Check if this pixel is the ball
      const dx = x - ballX;
      const dy = y - bounceY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < ball.size) {
        intensity = 10;
        char = "●";
      } else if (dist < ball.size + 1) {
        intensity = 6;
        char = "○";
      }
    }
    
    return { char, intensity };
  }
}
