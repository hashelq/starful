import { Command, CommandCategories } from "./command.js";
import { type UIImplementation, noopUI } from "../ui.js";
import { setDefaultModel, parseDefaultModel, getAllModels } from "../config.js";

/**
 * Model Command
 * Allows selecting and switching between available Ollama models
 * Categorizes models by provider and configured/inferred status
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

      // Get configured models by provider
      const configuredModels = getAllModels();
      
      // Build sets for quick lookup
      const configuredModelNames = new Set(configuredModels.map(m => m.name));
      
      // Separate configured vs inferred, then group by provider
      const configuredByProvider = new Map<string, string[]>();
      const inferredByProvider = new Map<string, string[]>();
      
      for (const name of modelNames) {
        if (configuredModelNames.has(name)) {
          // Find which provider this model belongs to
          const modelConfig = configuredModels.find(m => m.name === name);
          const prov = modelConfig?.provider || "ollama";
          if (!configuredByProvider.has(prov)) {
            configuredByProvider.set(prov, []);
          }
          configuredByProvider.get(prov)!.push(name);
        } else {
          // Inferred - assign to default "ollama" provider for now
          // Could be enhanced to detect provider from model name patterns
          if (!inferredByProvider.has("ollama")) {
            inferredByProvider.set("ollama", []);
          }
          inferredByProvider.get("ollama")!.push(name);
        }
      }

      // Build items with nested categories: Configured > provider > models, Inferred > provider > models
      const items: string[] = [];
      
      // Configured section
      if (configuredByProvider.size > 0) {
        items.push("Configured");
        for (const [prov, modelList] of configuredByProvider) {
          items.push(`  ${prov}`);
          for (const m of modelList) {
            items.push(`    ${m}`);
          }
        }
      }
      
      // Inferred section
      if (inferredByProvider.size > 0) {
        items.push("Inferred");
        for (const [prov, modelList] of inferredByProvider) {
          items.push(`  ${prov}`);
          for (const m of modelList) {
            items.push(`    ${m}`);
          }
        }
      }

      // Show selection UI
      this._ui.promptSelect?.({
        title: "Select Model",
        items,
        current: currentModel,
      }).then((selected) => {
        // Skip category headers (items starting with "Configured", "Inferred", or "  provider")
        if (selected && !selected.startsWith("Configured") && !selected.startsWith("Inferred") && !selected.startsWith("  ")) {
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
