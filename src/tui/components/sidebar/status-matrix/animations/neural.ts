import { Animation, type AnimationFrame, type AnimationConfig } from "./types.js";

/**
 * Neural animation - neural network
 */
export class NeuralAnimation extends Animation {
  name = "neural";
  
  override get config(): AnimationConfig {
    return { speed: 0.12, colorScale: 1 };
  }
  
  render(tick: number, x: number, y: number, width: number, height: number): AnimationFrame {
    const t = tick * this.config.speed;
    
    // Neural network nodes (layers)
    const layers = 4;
    const nodesPerLayer = 3;
    const layerWidth = width / (layers + 1);
    const nodeHeight = height / (nodesPerLayer + 1);
    
    // Check if at node position
    let nearNode = false;
    let nodeIntensity = 0;
    
    for (let l = 1; l <= layers; l++) {
      for (let n = 1; n <= nodesPerLayer; n++) {
        const nodeX = Math.floor(l * layerWidth);
        const nodeY = Math.floor(n * nodeHeight);
        
        if (Math.abs(x - nodeX) < 1 && Math.abs(y - nodeY) < 1) {
          nearNode = true;
          // Nodes pulse
          nodeIntensity = Math.floor(8 + Math.sin(t * 3 + l + n) * 2);
        }
      }
    }
    
    // Signal traveling between nodes
    let signalIntensity = 0;
    let onSignal = false;
    
    for (let l = 1; l < layers; l++) {
      const startX = Math.floor(l * layerWidth);
      const endX = Math.floor((l + 1) * layerWidth);
      const signalProgress = ((t * 3 + l) % 1);
      const signalX = startX + (endX - startX) * signalProgress;
      
      if (Math.abs(x - signalX) < 1) {
        // Find corresponding y
        for (let n = 1; n <= nodesPerLayer; n++) {
          const nodeY = Math.floor(n * nodeHeight);
          if (Math.abs(y - nodeY) < 2) {
            onSignal = true;
            signalIntensity = 10;
          }
        }
      }
    }
    
    let intensity = 0;
    let char = " ";
    
    if (nearNode) {
      intensity = nodeIntensity;
      char = "●";
    } else if (onSignal) {
      intensity = signalIntensity;
      char = "─";
    }
    
    return { char, intensity };
  }
}
