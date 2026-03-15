import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Cube animation - 3D cube rotation
 */
export class CubeAnimation extends Animation {
  name = "cube";
  
  override get config(): AnimationConfig {
    return { speed: 0.1, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    const size = Math.min(width, height) * 0.3;
    
    // Rotating cube projection
    const angle = t * 0.5;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    // Cube vertices (simplified 2D projection)
    const vertices = [
      { x: -size, y: -size },
      { x: size, y: -size },
      { x: size, y: size },
      { x: -size, y: size },
    ].map(v => ({
      x: cx + v.x * cosA - v.y * sinA * 0.3,
      y: cy + v.x * sinA + v.y * cosA * 0.3,
    }));
    
    // Check if on edges
    let onEdge = false;
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      if (!v1 || !v2) continue;
      const edgeDx = v2.x - v1.x;
      const edgeDy = v2.y - v1.y;
      const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);
      if (edgeLen === 0) continue;
      
      const t2 = ((x - v1.x) * edgeDx + (y - v1.y) * edgeDy) / (edgeLen * edgeLen);
      const closestX = v1.x + t2 * edgeDx;
      const closestY = v1.y + t2 * edgeDy;
      const dist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
      
      if (t2 >= 0 && t2 <= 1 && dist < 1.5) {
        onEdge = true;
        break;
      }
    }
    
    let intensity = 0;
    let char = " ";
    
    if (onEdge) {
      intensity = 10;
      char = "█";
    }
    
    return { char, intensity };
  }
}
