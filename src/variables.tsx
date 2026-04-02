import { createStore } from "solid-js/store";
import type { VariableType, VariableDefinition, VariableState, VariableHandle, VariableValueFor } from "./types";
import { dialogService } from "./dialog";
import { panelFocused, setPanelFocused } from "./focus";
import { Prompt, Confirm } from "./confirm";

// --- Reactive store for all variables ---
const [variables, setVariables] = createStore<VariableState[]>([]);

// --- Pending resolution promises (for dedup) ---
const pendingResolutions = new Map<string, Promise<any>>();

export { variables };

/**
 * Register a new variable definition and return a handle for interacting with it.
 */
export function defineVariable<T extends VariableType>(
    name: string,
    options: Omit<VariableDefinition<T>, 'name'>
): VariableHandle<T> {
    // Prevent duplicate registrations
    const existingIndex = variables.findIndex(v => v.name === name);
    if (existingIndex !== -1) {
        throw new Error(`Variable "${name}" is already defined.`);
    }

    const index = variables.length;
    setVariables(index, {
        name,
        type: options.type,
        description: options.description,
        defaultValue: options.defaultValue,
        value: undefined,
        isSet: false,
    } as VariableState<T>);

    const handle: VariableHandle<T> = {
        name,
        type: options.type,
        get: () => resolveVariable<T>(name),
        peek: () => {
            const state = variables.find(v => v.name === name);
            return state?.value as VariableValueFor<T> | undefined;
        },
        set: (value: VariableValueFor<T>) => {
            const idx = variables.findIndex(v => v.name === name);
            if (idx === -1) return;
            setVariables(idx, 'value', value as any);
            setVariables(idx, 'isSet', true);
        },
    };

    return handle;
}

/**
 * Resolve a variable's value. If already set, returns immediately.
 * If not set, prompts the user. Deduplicates concurrent prompts for the same variable.
 */
async function resolveVariable<T extends VariableType>(name: string): Promise<VariableValueFor<T>> {
    const state = variables.find(v => v.name === name);
    if (!state) {
        throw new Error(`Variable "${name}" is not defined.`);
    }

    // Already set — return immediately
    if (state.isSet) {
        return state.value as VariableValueFor<T>;
    }

    // Dedup: if another caller is already prompting for this variable, wait on the same promise
    const pending = pendingResolutions.get(name);
    if (pending) {
        return pending as Promise<VariableValueFor<T>>;
    }

    // Create the prompt and store the pending promise
    const promise = promptForVariable<T>(state as VariableState<T>);
    pendingResolutions.set(name, promise);

    try {
        const result = await promise;
        // Update the store
        const idx = variables.findIndex(v => v.name === name);
        if (idx !== -1) {
            setVariables(idx, 'value', result as any);
            setVariables(idx, 'isSet', true);
        }
        return result;
    } finally {
        pendingResolutions.delete(name);
    }
}

/**
 * Open the appropriate dialog to prompt the user for a variable value.
 */
async function promptForVariable<T extends VariableType>(state: VariableState<T>): Promise<VariableValueFor<T>> {
    const returnFocus = panelFocused();

    if (state.type === 'boolean') {
        setPanelFocused('confirm');
        try {
            const result = await dialogService.add<boolean>((resolve, reject) => (
                <Confirm
                    message={`${state.description}\n(Default: ${state.defaultValue !== undefined ? String(state.defaultValue) : 'none'})`}
                    title={`Variable: ${state.name}`}
                    resolve={resolve}
                    reject={reject}
                />
            ));
            setPanelFocused(returnFocus);
            return result as VariableValueFor<T>;
        } catch {
            // User cancelled — fall back to default or re-throw
            setPanelFocused(returnFocus);
            if (state.defaultValue !== undefined) {
                return state.defaultValue as VariableValueFor<T>;
            }
            throw new Error(`Variable "${state.name}" is required but was cancelled.`);
        }
    }

    // String or Number — use Prompt dialog
    setPanelFocused('prompt');
    try {
        const result = await dialogService.add<string>((resolve, reject) => (
            <Prompt
                message={state.description}
                title={`Variable: ${state.name} (${state.type})`}
                defaultValue={state.defaultValue !== undefined ? String(state.defaultValue) : undefined}
                resolve={resolve}
                reject={reject}
            />
        ));
        setPanelFocused(returnFocus);

        if (state.type === 'number') {
            const num = Number(result);
            if (isNaN(num)) {
                throw new Error(`Invalid number entered for variable "${state.name}": ${result}`);
            }
            return num as VariableValueFor<T>;
        }

        return result as VariableValueFor<T>;
    } catch {
        // User cancelled — fall back to default or re-throw
        setPanelFocused(returnFocus);
        if (state.defaultValue !== undefined) {
            return state.defaultValue as VariableValueFor<T>;
        }
        throw new Error(`Variable "${state.name}" is required but was cancelled.`);
    }
}

/**
 * Prompt the user to edit an existing variable (from the variables panel).
 * Re-uses the same prompt flow as initial resolution.
 */
export async function editVariable(name: string): Promise<void> {
    const state = variables.find(v => v.name === name);
    if (!state) return;

    // Temporarily mark as unset so the prompt flow works
    const idx = variables.findIndex(v => v.name === name);
    const previousValue = state.value;
    const previousIsSet = state.isSet;

    try {
        const result = await promptForVariable(state);
        setVariables(idx, 'value', result as any);
        setVariables(idx, 'isSet', true);
    } catch {
        // Restore previous state on cancel
        setVariables(idx, 'value', previousValue as any);
        setVariables(idx, 'isSet', previousIsSet);
    }
}
