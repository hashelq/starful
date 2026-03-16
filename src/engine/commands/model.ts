import { Command, CommandCategories } from "./command.js";
import { type UIImplementation, noopUI } from "../ui.js";
import { setDefaultModel, parseDefaultModel } from "../config.js";

/**
 * Model Command
 * Allows selecting and switching between available Ollama models
 * Shows flat list in format: "provider/modelname:tag"
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

      // Build flat list with format: "    label::id" (4 spaces prefix to mark as items)
      // Label: "provider/modelname", Id: "modelname"
      const items = modelNames.map((name: string) => `    ${provider}/${name}::${name}`);

      // Show selection UI
      this._ui.promptSelect?.({
        title: "Select Model",
        items,
        current: `    ${provider}/${currentModel}::${currentModel}`,
      }).then((selected) => {
        if (selected) {
          // Extract id from "label::id" format (everything after ::)
          const modelName = selected.split("::")[1] || selected;
          
          setDefaultModel(provider, modelName);
          this._ui.showNotification?.(`Model: ${modelName}`);
          
          if (this._onModelChange) {
            this._onModelChange(`${provider}/${modelName}`);
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
