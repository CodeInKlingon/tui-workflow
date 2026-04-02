import { createSignal } from "solid-js";

/**
 * Shared focus state for panel navigation.
 * Extracted to its own module to avoid circular dependencies
 * between lib.tsx and variables.tsx.
 */
export const [panelFocused, setPanelFocused] = createSignal<string>('stages');
