import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Voronoi animation - cell pattern
 */
export class VoronoiAnimation extends Animation {
  name = "voronoi";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Seed points moving around
    const seeds = [
      { x: width * 0.3 + Math.sin(t * 0.7) * width * 0.2, y: height * 0.3 + Math.cos(t * 0.5) * height * 0.2 },
      { x: width * 0.7 + Math.cos(t * 0.6) * width * 0.2, y: height * 0.3 + Math.sin(t * 0.4) * height * 0.2 },
      { x: width * 0.5 + Math.sin(t * 0.8) * width * 0.25, y: height * 0.7 + Math.cos(t * 0.6) * height * 0.2 },
      { x: width * 0.2 + Math.cos(t * 0.5) * width * 0.15, y: height * 0.6 + Math.sin(t * 0.7) * height * 0.15 },
      { x: width * 0.8 + Math.sin(t * 0.4) * width * 0.15, y: height * 0.6 + Math.cos(t * 0.8) * height * 0.15 },
    ];
    
    // Find closest seed
    let minDist = Infinity;
    let closestIdx = 0;
    
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      if (!s) continue;
      const dx = x - s.x;
      const dy = y - s.y;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    
    // Cell boundaries (approximate)
    let onBoundary = false;
    for (let i = 0; i < seeds.length; i++) {
      if (i === closestIdx) continue;
      const s1 = seeds[closestIdx];
      const s2 = seeds[i];
      if (!s1 || !s2) continue;
      const dx = x - (s1.x + s2.x) / 2;
      const dy = y - (s1.y + s2.y) / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2) {
        onBoundary = true;
        break;
      }
    }
    
    let intensity = 0;
    let char = " ";
    
    if (onBoundary) {
      intensity = 8;
      char = "│";
    } else {
      intensity = closestIdx * 2 + 3;
      char = " ";
    }
    
    return { char, intensity };
  }
}
