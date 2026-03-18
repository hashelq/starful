import { createCommandHandler } from "./CommandManager.js";
import type { CommandHandler } from "./CommandManager.js";
import type { Config } from "../config.js";

/**
 * Create built-in commands for the Engine
 */
export function createEngineCommands(
  engine: {
    getMessages: () => import("./MessageManager.js").MessageManager;
    getCommands: () => import("./CommandManager.js").CommandManager;
    notify: (message: string) => void;
    listModels: () => import("../config.js").ModelEntry[];
    listAllModels: () => Record<string, import("../config.js").ModelEntry[]>;
    findModel: (index: string) => import("../config.js").ModelEntry | undefined;
    setModel: (index: string) => void;
  },
  getConfig: () => Config,
): Map<string, CommandHandler> {
  const commands = new Map<string, CommandHandler>();

  // /help - Show available commands
  commands.set("help", createCommandHandler(
    "help",
    "help",
    "Show available commands",
    async () => {
      const cmdMgr = engine.getCommands();
      const allCommands = cmdMgr.listCommands();
      const list = allCommands.map(id => `  ${id}`).join("\n");
      engine.notify(`Available commands:\n${list}`);
    }
  ));

  // /clear - Clear chat history
  commands.set("clear", createCommandHandler(
    "clear",
    "clear",
    "Clear chat history",
    async () => {
      const msgMgr = engine.getMessages();
      msgMgr.clear();
      engine.notify("Chat history cleared");
    }
  ));

  // /models - List available models
  commands.set("models", createCommandHandler(
    "models",
    "models",
    "List available models",
    async () => {
      const models = engine.listModels();
      if (models.length === 0) {
        engine.notify("No models available");
        return;
      }
      const list = models.map(m => `  ${m.provider}/${m.name}`).join("\n");
      engine.notify(`Available models:\n${list}`);
    }
  ));

  // /model - Show current model
  commands.set("model", createCommandHandler(
    "model",
    "model",
    "Show or set current model (use: /model provider/model)",
    async (args) => {
      if (args && args.length > 0) {
        const index = args[0] as string;
        const model = engine.findModel(index);
        if (model) {
          engine.setModel(index);
          engine.notify(`Model changed to ${index}`);
        } else {
          engine.notify(`Model not found: ${index}`);
        }
      } else {
        const models = engine.listModels();
        const first = models[0];
        if (first) {
          engine.notify(`Current model: ${first.provider}/${first.name}`);
        }
      }
    }
  ));

  // /config - Show config (replaces /settings)
  commands.set("config", createCommandHandler(
    "config",
    "config",
    "Show configuration (use: /config [key] [value])",
    async (args) => {
      const config = getConfig();
      const configData = config.toJSON();
      
      if (args && args.length > 0) {
        const key = args[0] as string;
        
        // Check if it's a provider or model key
        if (key in configData.providers) {
          const provider = configData.providers[key];
          engine.notify(`Provider "${key}":\n${JSON.stringify(provider, null, 2)}`);
        } else if (key in configData.models) {
          const models = configData.models[key];
          if (models) {
            engine.notify(`Models for "${key}":\n${models.map(m => `  ${m.name}`).join("\n")}`);
          }
        } else if (key === "defaultModel") {
          const dm = configData.defaultModel;
          engine.notify(`Default model: ${dm.provider}/${dm.name}`);
        } else {
          engine.notify(`Unknown config key: ${key}`);
        }
      } else {
        // Show all config
        let output = "Configuration:\n\n";
        output += `[defaultModel]\n  ${configData.defaultModel.provider}/${configData.defaultModel.name}\n\n`;
        output += "[providers]\n";
        for (const [name, cfg] of Object.entries(configData.providers)) {
          output += `  ${name}: ${cfg.baseUrl || `${cfg.host}:${cfg.port}`}\n`;
        }
        output += "\n[models]\n";
        for (const [provider, models] of Object.entries(configData.models)) {
          output += `  ${provider}:\n`;
          for (const m of models) {
            output += `    - ${m.name}\n`;
          }
        }
        engine.notify(output);
      }
    }
  ));

  // /history - Show command history
  commands.set("history", createCommandHandler(
    "history",
    "history",
    "Show command history",
    async () => {
      const cmdMgr = engine.getCommands();
      const history = cmdMgr.getHistory();
      if (history.length === 0) {
        engine.notify("No command history");
        return;
      }
      const list = history.slice(-10).map((h, i) => 
        `  ${i + 1}. ${h.commandId} ${h.args?.join(" ") || ""}`
      ).join("\n");
      engine.notify(`Recent commands:\n${list}`);
    }
  ));

  // /undo - Undo last command (if supported)
  commands.set("undo", createCommandHandler(
    "undo",
    "undo",
    "Undo last command (if supported)",
    async () => {
      engine.notify("Undo not supported for this command");
    }
  ));

  return commands;
}
