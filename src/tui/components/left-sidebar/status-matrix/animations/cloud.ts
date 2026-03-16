import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Cloud animation - drifting clouds
 */
export class CloudAnimation extends Animation {
  name = "cloud";
  
  override get config(): AnimationConfig {
    return { speed: 0.06, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Multiple clouds at different heights
    const cloudY1 = height * 0.3;
    const cloudY2 = height * 0.5;
    const cloudY3 = height * 0.25;
    
    // Cloud positions (moving horizontally)
    const cloud1X = ((t * 8) % (width + 20)) - 10;
    const cloud2X = ((t * 6 + width / 2) % (width + 20)) - 10;
    const cloud3X = ((t * 10 + width / 3) % (width + 20)) - 10;
    
    // Cloud shape (puffy)
    const getCloudDensity = (cx: number, cy: number, px: number, py: number) => {
      const dx = px - cx;
      const dy = py - cy;
      // Fluffy cloud shape
      const cloudWidth = 8;
      const cloudHeight = 3;
      return Math.abs(dx) < cloudWidth && Math.abs(dy) < cloudHeight * (1 - Math.abs(dx) / cloudWidth * 0.5);
    };
    
    const inCloud1 = getCloudDensity(cloud1X, cloudY1, x, y);
    const inCloud2 = getCloudDensity(cloud2X, cloudY2, x, y);
    const inCloud3 = getCloudDensity(cloud3X, cloudY3, x, y);
    
    let intensity = 0;
    let char = " ";
    
    if (inCloud1) {
      intensity = 8;
      char = "▃";
    } else if (inCloud2) {
      intensity = 7;
      char = "▃";
    } else if (inCloud3) {
      intensity = 6;
      char = "▃";
    }
    
    return { char, intensity };
  }
}
