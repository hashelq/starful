import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Data animation - flowing data blocks
 */
export class DataAnimation extends Animation {
  name = "data";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Data packets flowing left to right
    const packetPositions = [
      (t * 8) % (width + 10) - 5,
      (t * 6 + width * 0.3) % (width + 10) - 5,
      (t * 7 + width * 0.6) % (width + 10) - 5,
    ];
    
    let inPacket = -1;
    for (let i = 0; i < packetPositions.length; i++) {
      const px = packetPositions[i] ?? 0;
      if (px !== undefined && x >= px && x < px + 4 && y >= 2 && y < height - 2) {
        inPacket = i;
        break;
      }
    }
    
    let intensity = 0;
    let char = " ";
    
    if (inPacket >= 0) {
      // Packet content
      const chars = "01█▓░";
      char = chars[(x + y + inPacket) % chars.length] || "█";
      intensity = 10 - inPacket;
    } else {
      // Connection lines
      const onLine = y === 2 || y === height - 3;
      if (onLine && Math.random() > 0.95) {
        intensity = 3;
        char = "─";
      }
    }
    
    return { char, intensity };
  }
}
