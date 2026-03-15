/**
 * Sidebar Types - Using nominal types for type safety
 * 
 * These types use the "nominal" pattern to prevent accidental mixing
 * of sidebar types with other string IDs.
 */

// Brand nominal types - these are opaque identifiers
declare const __brand: unique symbol;

/** Nominal type for SidebarButton ID */
type Brand<T, B> = T & { [__brand]: B };

/** Sidebar button unique identifier */
export type SidebarButtonId = Brand<string, "SidebarButton">;

/** Sidebar category unique identifier */
export type SidebarCategoryId = Brand<string, "SidebarCategory">;

/** Sidebar section unique identifier */
export type SidebarSectionId = Brand<string, "SidebarSection">;

/** Create a button ID from a string */
export function createButtonId(id: string): SidebarButtonId {
  return id as SidebarButtonId;
}

/** Create a category ID from a string */
export function createCategoryId(id: string): SidebarCategoryId {
  return id as SidebarCategoryId;
}

/** Create a section ID from a string */
export function createSectionId(id: string): SidebarSectionId {
  return id as SidebarSectionId;
}

/** Button definition for the sidebar */
export interface SidebarButtonDef {
  id: SidebarButtonId;
  label: string;
  onClick: () => void;
}

/** Category definition - groups buttons together */
export interface SidebarCategoryDef {
  id: SidebarCategoryId;
  title: string;
  buttons: SidebarButtonDef[];
  /** Default folded state */
  folded?: boolean;
}

/** Sidebar section - can be a category or custom content */
export type SidebarItemDef = SidebarCategoryDef;

/** Registry for sidebar items */
export interface SidebarRegistry {
  /** Register a category */
  registerCategory(category: SidebarCategoryDef): void;
  /** Get all registered categories */
  getCategories(): SidebarCategoryDef[];
  /** Remove a category */
  unregisterCategory(id: SidebarCategoryId): void;
  /** Clear all categories */
  clear(): void;
}
