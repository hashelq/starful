import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Loading animation - progress bar
 */
export class LoadingAnimation extends Animation {
  name = "loading";
  
  override get config(): AnimationConfig {
    return { speed: 0.2, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Progress bar position
    const barWidth = width - 4;
    const progress = (t * 0.5) % 1;
    const filledWidth = Math.floor(progress * barWidth);
    
    const barY = Math.floor(height / 2);
    const isBar = y === barY || y === barY - 1 || y === barY + 1;
    const isFilled = x > 2 && x < 2 + filledWidth;
    const isBorder = (y === barY - 1 || y === barY + 1) && x > 1 && x < width - 2;
    
    let intensity = 0;
    let char = " ";
    
    if (isBorder) {
      intensity = 5;
      char = x === 1 || x === width - 2 ? "│" : "─";
    } else if (isBar && isFilled) {
      intensity = 10;
      char = "█";
    } else if (isBar && !isFilled) {
      intensity = 2;
      char = "░";
    }
    
    return { char, intensity };
  }
}
