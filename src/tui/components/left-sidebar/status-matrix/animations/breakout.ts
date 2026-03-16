import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Breakout animation - bouncing brick breaker
 */
export class BreakoutAnimation extends Animation {
  name = "breakout";
  
  override get config(): AnimationConfig {
    return { speed: 0.18, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Ball
    const ballX = ((t * 6) % (width - 4)) + 2;
    const ballY = ((t * 4) % (height - 6)) + 3;
    
    // Paddle
    const paddleX = Math.floor(width / 2);
    const paddleY = height - 2;
    
    // Bricks
    const brickRows = 3;
    const brickCols = 6;
    const brickW = Math.floor(width / brickCols);
    
    const onBall = Math.abs(x - ballX) < 1 && Math.abs(y - Math.floor(ballY)) < 1;
    const onPaddle = y === paddleY && Math.abs(x - paddleX) < 4;
    
    let inBrick = false;
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        const bx = c * brickW + 1;
        const by = r * 2 + 2;
        if (x > bx && x < bx + brickW - 1 && y === by) {
          inBrick = true;
          break;
        }
      }
    }
    
    let intensity = 0;
    let char = " ";
    
    if (onBall) {
      intensity = 10;
      char = "●";
    } else if (inBrick) {
      intensity = 8;
      char = "█";
    } else if (onPaddle) {
      intensity = 9;
      char = "█";
    }
    
    return { char, intensity };
  }
}
