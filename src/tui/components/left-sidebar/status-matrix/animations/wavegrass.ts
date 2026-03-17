import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Objects animation - flowing plasma waves
 * A psychedelic wave pattern that morphs and pulses over time
 */
export class ObjectsAnimation extends Animation {
  name = "objects";

  override get config(): AnimationConfig {
    return { speed: 0.15, colorScale: 1.2 };
  }

  render(tick: number, x: number, y: number, _width: number, _height: number): AnimationFrame {
    const t = tick * this.config.speed;
    const t2 = tick * this.config.speed * 2;

    // Normalize position
    const nx = x * 0.1;
    const ny = y * 0.1;

    // Multi-layered wave function (adapted from plasma shader)
    // Layer 1: Primary wave
    const wave1 = Math.sin(nx * 0.5 + t + ny * 0.3);

    // Layer 2: Secondary wave (faster)
    const wave2 = Math.sin(ny * 0.7 - t2 * 0.5 + nx * 0.2);

    // Layer 3: Tertiary wave (slower, larger scale)
    const wave3 = Math.sin((nx + ny) * 0.3 + t * 0.7);

    // Layer 4: Diagonal wave
    const wave4 = Math.sin((nx - ny) * 0.4 + t2 * 0.3);

    // Combine all waves
    const combined = (wave1 + wave2 + wave3 + wave4) / 4;

    // Calculate intensity (0-10 scale)
    const rawIntensity = (combined + 1) * 5;
    const intensity = Math.min(Math.max(Math.floor(rawIntensity), 0), 10);

    // Character selection based on intensity
    const chars = " .,-~:;=!*#$@";
    const charIdx = Math.floor((intensity / 10) * (chars.length - 1));
    const char = chars[charIdx] || " ";

    return {
      char,
      intensity,
    };
  }
}
