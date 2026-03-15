import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Tetris animation - falling blocks
 */
export class TetrisAnimation extends Animation {
  name = "tetris";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Falling piece position
    const pieceY = Math.floor((t * 3) % height);
    const pieceX = Math.floor(width / 2);
    
    // Tetromino shapes (simplified)
    const shapes = [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, // O
      { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, // T
    ];
    
    let inPiece = false;
    for (const s of shapes) {
      if (x === pieceX + s.x && y === pieceY + s.y) {
        inPiece = true;
        break;
      }
    }
    
    // Ground
    const onGround = y === height - 1;
    
    let intensity = 0;
    let char = " ";
    
    if (inPiece) {
      intensity = 10;
      char = "█";
    } else if (onGround) {
      intensity = 5;
      char = "─";
    }
    
    return { char, intensity };
  }
}
