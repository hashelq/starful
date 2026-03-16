import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Gravity animation - orbiting bodies
 */
export class GravityAnimation extends Animation {
  name = "gravity";
  
  override get config(): AnimationConfig {
    return { speed: 0.12, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const cx = width / 2;
    const cy = height / 2;
    
    // Central mass (star)
    const starDist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const isStar = starDist < 3;
    
    // Orbiting planet
    const orbitR = Math.min(width, height) * 0.35;
    const angle = t * 1.5;
    const planetX = cx + Math.cos(angle) * orbitR;
    const planetY = cy + Math.sin(angle) * orbitR * 0.6;
    const planetDist = Math.sqrt((x - planetX) ** 2 + (y - planetY) ** 2);
    const isPlanet = planetDist < 2;
    
    // Moon orbiting planet
    const moonOrbitR = 4;
    const moonAngle = t * 5;
    const moonX = planetX + Math.cos(moonAngle) * moonOrbitR;
    const moonY = planetY + Math.sin(moonAngle) * moonOrbitR;
    const moonDist = Math.sqrt((x - moonX) ** 2 + (y - moonY) ** 2);
    const isMoon = moonDist < 1;
    
    // Orbit path
    const onOrbit = Math.abs(Math.sqrt((x - cx) ** 2 + ((y - cy) / 0.6) ** 2) - orbitR) < 1;
    
    let intensity = 0;
    let char = " ";
    
    if (isStar) {
      intensity = 10;
      char = "●";
    } else if (isPlanet) {
      intensity = 9;
      char = "●";
    } else if (isMoon) {
      intensity = 7;
      char = "·";
    } else if (onOrbit) {
      intensity = 2;
      char = "─";
    }
    
    return { char, intensity };
  }
}
