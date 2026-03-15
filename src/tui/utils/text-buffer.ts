import type { CliRenderer } from "@opentui/core";

/**
 * Get text from renderer buffer in a rectangular region
 * If multiple lines are selected, copies whole lines (including empty lines between)
 */
export function getTextInRange(
  renderer: CliRenderer,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  copyWholeLines: boolean = true,
): string {
  const buf = renderer.currentRenderBuffer;
  if (!buf) return "";

  // Normalize coordinates
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  const isMultiLine = minY !== maxY;

  const charArr = buf.buffers.char as Uint32Array;
  
  let text = "";
  for (let y = minY; y <= maxY && y < buf.height; y++) {
    let line = "";
    // If multi-line selection, copy from column 0 to maxX to get whole lines
    // Otherwise use the original x1/x2 range
    const startX = (isMultiLine && copyWholeLines) ? 0 : minX;
    const endX = (isMultiLine && copyWholeLines) ? maxX : maxX;
    
    for (let x = startX; x <= endX && x < buf.width; x++) {
      const index = y * buf.width + x;
      const charCode = charArr[index];
      if (charCode !== 0) {
        line += String.fromCharCode(charCode);
      }
    }
    if (isMultiLine && copyWholeLines) {
      // Include all lines when multi-line
      text += line + "\n";
    } else if (line.trim()) {
      text += line + "\n";
    }
  }
  return text.trim();
}

/**
 * Get text from a single line
 */
export function getLineText(renderer: CliRenderer, y: number, x1: number = 0, x2?: number): string {
  const buf = renderer.currentRenderBuffer;
  if (!buf || y < 0 || y >= buf.height) return "";

  const endX = x2 ?? buf.width - 1;
  const charArr = buf.buffers.char as Uint32Array;
  
  let line = "";
  for (let x = x1; x <= endX && x < buf.width; x++) {
    const index = y * buf.width + x;
    const charCode = charArr[index];
    if (charCode !== 0) {
      line += String.fromCharCode(charCode);
    }
  }
  return line;
}

/**
 * Get all visible text from buffer
 */
export function getAllText(renderer: CliRenderer): string {
  const buf = renderer.currentRenderBuffer;
  if (!buf) return "";

  const charArr = buf.buffers.char as Uint32Array;
  
  let text = "";
  for (let y = 0; y < buf.height; y++) {
    let line = "";
    for (let x = 0; x < buf.width; x++) {
      const index = y * buf.width + x;
      const charCode = charArr[index];
      if (charCode !== 0) {
        line += String.fromCharCode(charCode);
      }
    }
    if (line.trim()) {
      text += line + "\n";
    }
  }
  return text.trim();
}
