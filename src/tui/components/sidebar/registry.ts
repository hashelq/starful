import type { SidebarCategoryDef, SidebarCategoryId, SidebarRegistry } from "./types.js";

/**
 * Simple registry for sidebar categories
 * Can be extended by plugins to add custom categories
 */
class SimpleSidebarRegistry implements SidebarRegistry {
  private categories: Map<SidebarCategoryId, SidebarCategoryDef> = new Map();

  registerCategory(category: SidebarCategoryDef): void {
    this.categories.set(category.id, category);
  }

  getCategories(): SidebarCategoryDef[] {
    return Array.from(this.categories.values());
  }

  unregisterCategory(id: SidebarCategoryId): void {
    this.categories.delete(id);
  }

  clear(): void {
    this.categories.clear();
  }
}

// Singleton instance
let _registry: SidebarRegistry | null = null;

/**
 * Get the sidebar registry instance
 */
export function getSidebarRegistry(): SidebarRegistry {
  if (!_registry) {
    _registry = new SimpleSidebarRegistry();
  }
  return _registry;
}

/**
 * Reset the registry (useful for testing)
 */
export function resetSidebarRegistry(): void {
  _registry = null;
}
