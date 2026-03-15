import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * USB animation - data transfer
 */
export class USBAnimation extends Animation {
  name = "usb";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // USB connector shape
    const cx = width / 2;
    const cy = height / 2;
    
    // Connector body
    const inBody = x > cx - 4 && x < cx + 4 && y > cy - 2 && y < cy + 2;
    
    // Data flow (particles moving through)
    const flowY = cy;
    const flowX = ((t * 15) % (width + 10)) - 5;
    const onFlow = Math.abs(y - flowY) < 1 && x > cx + 2 && Math.abs(x - flowX) < 2;
    
    // Contact points
    const isContact1 = x === cx - 2 && y === cy - 1;
    const isContact2 = x === cx - 2 && y === cy + 1;
    const isContact3 = x === cx + 2 && y === cy;
    
    let intensity = 0;
    let char = " ";
    
    if (onFlow) {
      intensity = 10;
      char = "●";
    } else if (inBody) {
      intensity = 7;
      char = "█";
    } else if (isContact1 || isContact2 || isContact3) {
      intensity = 5;
      char = "●";
    }
    
    return { char, intensity };
  }
}
