/**
 * Global state for TUI application
 * Tracks modal count to prevent input focus when modals are open
 */

import type { InputRenderable } from "@opentui/core";

export let TUIState = {
  currentInputFocused: <InputRenderable | null>null,
};

export function setFocused(input: InputRenderable) {
  TUIState.currentInputFocused = input;
}

export function setUnfocused(input: InputRenderable) {
  if (TUIState.currentInputFocused === input)
    TUIState.currentInputFocused = null;
}
