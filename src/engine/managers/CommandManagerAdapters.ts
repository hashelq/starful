import type { CommandSpec, ResolvedCommand } from "../commands/index.js";
import type { CommandHandler } from "./CommandManager.js";

/**
 * Adapter to wrap TUI CommandRegistry commands as Engine CommandHandlers
 */
export function wrapCommandRegistryCommand(spec: ResolvedCommand): CommandHandler {
  return {
    id: spec.id,
    name: spec.resolvedName,
    description: spec.resolvedDescription,
    execute: async (args?: unknown[]) => {
      // Execute the command handler
      const result = spec.handler();
      if (result instanceof Promise) {
        await result;
      }
      return { args, executed: true };
    },
  };
}

/**
 * Create CommandHandlers from a CommandRegistry
 */
export function createCommandHandlersFromRegistry(
  registryCommands: ResolvedCommand[],
): Map<string, CommandHandler> {
  const handlers = new Map<string, CommandHandler>();
  
  for (const cmd of registryCommands) {
    handlers.set(cmd.id, wrapCommandRegistryCommand(cmd));
  }
  
  return handlers;
}

/**
 * Convert CommandHandler to CommandSpec for TUI registry
 */
export function handlerToCommandSpec(
  handler: CommandHandler,
  category: { id: string; name: string; icon?: string },
): CommandSpec {
  return {
    id: handler.id,
    name: handler.name,
    description: handler.description,
    category,
    handler: async () => {
      if (handler.execute) {
        await handler.execute();
      }
    },
  };
}
