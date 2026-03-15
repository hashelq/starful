import { Command, CommandCategories } from "./command.js";
import { type UIImplementation, noopUI } from "../ui.js";
import { setDefaultModel, parseDefaultModel, getAllModels } from "../config.js";

/**
 * Model Command
 * Allows selecting and switching between available Ollama models
 * Categorizes models as "Configured" or "Inferred"
 */
export class ModelCommand extends Command {
  private _ui: UIImplementation;
  private _ollamaClient: any;
  private _onModelChange?: (model: string) => void;
  
  constructor(
    ui: UIImplementation = noopUI, 
    ollamaClient?: any,
    onModelChange?: (model: string) => void
  ) {
    super();
    this._ui = ui;
    this._ollamaClient = ollamaClient;
    this._onModelChange = onModelChange;
  }
  
  override readonly id = "model";
  override readonly name = "Switch Model: {model}";
  override readonly description = "Switch to a different Ollama model";
  override readonly category = CommandCategories.SETTINGS;

  async handler(): Promise<void> {
    const { provider, model: currentModel } = parseDefaultModel();
    
    // If no ollama client, just show current model
    if (!this._ollamaClient) {
      this._ui.showNotification?.(`Model: ${currentModel}`);
      return;
    }

    try {
      // Get available models from Ollama
      const models = await this._ollamaClient.listModels();
      const modelNames = models.map((m: any) => m.name);
      
      if (modelNames.length === 0) {
        this._ui.showNotification?.("No models available");
        return;
      }

      // Get configured models
      const configuredModels = getAllModels();
      const configuredNames = new Set(configuredModels.map(m => m.name));

      // Categorize models
      const configured: string[] = [];
      const inferred: string[] = [];

      for (const name of modelNames) {
        if (configuredNames.has(name)) {
          configured.push(name);
        } else {
          inferred.push(name);
        }
      }

      // Build items with category headers (matching command category style)
      const items: string[] = [];
      if (configured.length > 0) {
        items.push("⚙ Configured");
        items.push(...configured);
      }
      if (inferred.length > 0) {
        items.push("🔮 Inferred");
        items.push(...inferred);
      }

      // Show selection UI
      this._ui.promptSelect?.({
        title: "Select Model",
        items,
        current: currentModel,
      }).then((selected) => {
        // Skip category headers
        if (selected && !selected.includes(" ") && !selected.startsWith("⚙") && !selected.startsWith("🔮")) {
          setDefaultModel(provider, selected);
          const newModel = `${provider}/${selected}`;
          this._ui.showNotification?.(`Model: ${selected}`);
          
          if (this._onModelChange) {
            this._onModelChange(newModel);
          }
        }
      });
    } catch (error) {
      this._ui.showNotification?.(`Error: ${error instanceof Error ? error.message : "Failed to list models"}`);
    }
  }
}

// Default instance
export const modelCommand = new ModelCommand();
