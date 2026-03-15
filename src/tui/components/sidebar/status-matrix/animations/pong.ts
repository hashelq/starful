import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Pong animation - bouncing ball
 */
export class PongAnimation extends Animation {
  name = "pong";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Ball bouncing
    const ballX = ((t * 8) % (width - 4)) + 2;
    const ballY = height / 2 + Math.sin(t * 4) * (height * 0.35);
    
    // Paddles
    const paddle1Y = Math.floor(height / 2);
    const paddle2Y = Math.floor(height / 2);
    
    const onBall = Math.abs(x - ballX) < 1 && Math.abs(y - Math.floor(ballY)) < 1;
    const onPaddle1 = x === 2 && Math.abs(y - paddle1Y) < 3;
    const onPaddle2 = x === width - 3 && Math.abs(y - paddle2Y) < 3;
    const onWall = y === 1 || y === height - 1;
    
    let intensity = 0;
    let char = " ";
    
    if (onBall) {
      intensity = 10;
      char = "●";
    } else if (onPaddle1 || onPaddle2) {
      intensity = 8;
      char = "█";
    } else if (onWall) {
      intensity = 3;
      char = "─";
    }
    
    return { char, intensity };
  }
}
