import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Clock animation - working clock face
 */
export class ClockAnimation extends Animation {
  name = "clock";
  
  override get config(): AnimationConfig {
    return { speed: 0.5, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 1;
    
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Clock face (circle)
    const onFace = Math.abs(dist - radius) < 1;
    const inFace = dist < radius;
    
    if (!inFace) {
      return { char: " ", intensity: 0 };
    }
    
    // Hour markers
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    let hourAngle = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    let isHourMarker = Math.abs(hourAngle % (Math.PI / 6)) < 0.1 && dist > radius - 2;
    
    // Time (animated)
    const t = tick * this.config.speed;
    const second = (t * 2) % 60;
    const minute = ((t * 2) / 60) % 12;
    const hour = ((t * 2) / 720) % 12 + minute / 12;
    
    // Second hand
    const secondAngle = (second / 60) * Math.PI * 2 - Math.PI / 2;
    const secondRad = radius - 2;
    const secondX = Math.cos(secondAngle) * secondRad;
    const secondY = Math.sin(secondAngle) * secondRad;
    const isSecond = Math.abs(dx - secondX) < 1 && Math.abs(dy - secondY) < 1;
    
    // Minute hand
    const minuteAngle = (minute / 60) * Math.PI * 2 - Math.PI / 2;
    const minuteRad = radius - 3;
    const minuteX = Math.cos(minuteAngle) * minuteRad;
    const minuteY = Math.sin(minuteAngle) * minuteRad;
    const isMinute = Math.abs(dx - minuteX) < 1.5 && Math.abs(dy - minuteY) < 1.5;
    
    // Hour hand
    const hourAnglePos = (hour / 12) * Math.PI * 2 - Math.PI / 2;
    const hourRad = radius * 0.5;
    const hourX = Math.cos(hourAnglePos) * hourRad;
    const hourY = Math.sin(hourAnglePos) * hourRad;
    const isHour = Math.abs(dx - hourX) < 2 && Math.abs(dy - hourY) < 2;
    
    // Center dot
    const isCenter = dist < 2;
    
    let intensity = 0;
    let char = " ";
    
    if (onFace) {
      intensity = 5;
      char = "○";
    }
    if (isHourMarker) {
      intensity = 7;
      char = "║";
    }
    if (isHour) {
      intensity = 10;
      char = "║";
    }
    if (isMinute) {
      intensity = 9;
      char = "║";
    }
    if (isSecond) {
      intensity = 8;
      char = ".";
    }
    if (isCenter) {
      intensity = 10;
      char = "●";
    }
    
    return { char, intensity };
  }
}
