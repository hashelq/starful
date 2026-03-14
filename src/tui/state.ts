/**
 * Global state for TUI application
 * Tracks modal count to prevent input focus when modals are open
 */

let _openModalCount = 0;

/**
 * Check if any modal is currently open
 */
export function isModalOpen(): boolean {
  return _openModalCount > 0;
}

/**
 * Increment modal count (call when modal opens)
 */
export function openModal(): void {
  _openModalCount++;
}

/**
 * Decrement modal count (call when modal closes)
 */
export function closeModal(): void {
  _openModalCount = Math.max(0, _openModalCount - 1);
}

/**
 * Get current open modal count
 */
export function getOpenModalCount(): number {
  return _openModalCount;
}
