import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Terminal animation - typing text
 */
export class TerminalAnimation extends Animation {
  name = "terminal";
  
  override get config(): AnimationConfig {
    return { speed: 0.3, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Typing cursor position
    const cursorX = Math.floor((t * 8) % width);
    const cursorY = Math.floor((t * 0.5) % height);
    
    // Text lines (fake terminal output)
    const lineStarts = [0, 3, 6, 9, 12].map(l => l + Math.floor(t * 0.3) % height);
    
    let inText = false;
    let char = " ";
    
    // Check if this position has "text"
    for (const lineStart of lineStarts) {
      if (y === lineStart % height) {
        const textPos = (x + Math.floor(t * 5)) % (width - 5);
        if (textPos < width - 5 && textPos > 0) {
          inText = true;
          // Fake characters
          const chars = "abcdefghijklmnopqrstuvwxyz0123456789$+-*/=%\"'#&_(),.;:?!";
          char = chars[Math.floor(textPos + y) % chars.length] || " ";
          break;
        }
      }
    }
    
    // Cursor
    const isCursor = x === cursorX && y === cursorY;
    
    let intensity = 0;
    if (isCursor) {
      intensity = 10;
      char = "▋";
    } else if (inText) {
      intensity = 7;
    }
    
    return { char, intensity };
  }
}
