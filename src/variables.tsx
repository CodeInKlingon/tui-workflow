import { createStore } from "solid-js/store";
import { Effect, Deferred, Either } from "effect";
import type { VariableType, VariableDefinition, VariableState, VariableHandle, VariableValueFor } from "./types";
import { dialogEffect } from "./dialog";
import { panelFocused, setPanelFocused } from "./focus";
import { Prompt, Confirm } from "./confirm";
import { CheckboxGroup } from "./checkbox-group";
import { DialogCancelled, VariableRequired } from "./errors";

const [variables, setVariables] = createStore<VariableState[]>([]);

const pendingResolutions = new Map<string, Deferred.Deferred<any, any>>();

export { variables };

export function defineVariable<T extends VariableType>(
    name: string,
    options: Omit<VariableDefinition<T>, 'name'>
): VariableHandle<T> {
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
        get: resolveVariable<T>(name),
        prompt: promptVariableDirect<T>(name),
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

function resolveVariable<T extends VariableType>(name: string): Effect.Effect<VariableValueFor<T>, VariableRequired> {
    const state = variables.find(v => v.name === name);
    if (!state) return Effect.fail(new VariableRequired({ name }));
    if (state.isSet) return Effect.succeed(state.value as VariableValueFor<T>);

    return Effect.gen(function* () {
        const existing = pendingResolutions.get(name);
        if (existing) {
            return yield* Deferred.await(existing as Deferred.Deferred<VariableValueFor<T>, VariableRequired>);
        }

        const deferred = yield* Deferred.make<VariableValueFor<T>, VariableRequired>();
        pendingResolutions.set(name, deferred);

        const either = yield* Effect.either(
            promptForVariable<T>(state as VariableState<T>).pipe(
                Effect.tap((value) => {
                    const idx = variables.findIndex(v => v.name === name);
                    if (idx !== -1) {
                        setVariables(idx, 'value', value as any);
                        setVariables(idx, 'isSet', true);
                    }
                }),
                Effect.catchTag("DialogCancelled", () => {
                    if (state.defaultValue !== undefined) {
                        const value = state.defaultValue as VariableValueFor<T>;
                        const idx = variables.findIndex(v => v.name === name);
                        if (idx !== -1) {
                            setVariables(idx, 'value', value as any);
                            setVariables(idx, 'isSet', true);
                        }
                        return Effect.succeed(value);
                    }
                    return Effect.fail(new VariableRequired({ name }));
                }),
            )
        );

        pendingResolutions.delete(name);

        if (Either.isRight(either)) {
            yield* Deferred.succeed(deferred, either.right);
            return either.right;
        } else {
            yield* Deferred.fail(deferred, either.left);
            return yield* Effect.fail(either.left);
        }
    });
}

function promptVariableDirect<T extends VariableType>(name: string): Effect.Effect<VariableValueFor<T>, DialogCancelled> {
    const state = variables.find(v => v.name === name);
    if (!state) return Effect.fail(new DialogCancelled({ title: name }));

    return promptForVariable<T>(state as VariableState<T>).pipe(
        Effect.tap((value) => {
            const idx = variables.findIndex(v => v.name === name);
            if (idx !== -1) {
                setVariables(idx, 'value', value as any);
                setVariables(idx, 'isSet', true);
            }
        }),
    );
}

function promptForVariable<T extends VariableType>(state: VariableState<T>): Effect.Effect<VariableValueFor<T>, DialogCancelled> {
    const returnFocus = panelFocused();

    if (state.type === 'boolean') {
        setPanelFocused('confirm');
        return dialogEffect.add<boolean>((resolve, reject) => (
            <Confirm
                message={`${state.description}\n(Default: ${state.defaultValue !== undefined ? String(state.defaultValue) : 'none'})`}
                title={`Variable: ${state.name}`}
                resolve={resolve}
                reject={reject}
            />
        )).pipe(
            Effect.ensuring(Effect.sync(() => setPanelFocused(returnFocus))),
            Effect.map((result) => result as VariableValueFor<T>),
        );
    }

    setPanelFocused('prompt');
    return dialogEffect.add<string>((resolve, reject) => (
        <Prompt
            message={state.description}
            title={`Variable: ${state.name} (${state.type})`}
            defaultValue={state.defaultValue !== undefined ? String(state.defaultValue) : undefined}
            resolve={resolve}
            reject={reject}
        />
    )).pipe(
        Effect.ensuring(Effect.sync(() => setPanelFocused(returnFocus))),
        Effect.map((result) => {
            if (state.type === 'number') {
                const num = Number(result);
                if (isNaN(num)) {
                    throw new Error(`Invalid number entered for variable "${state.name}": ${result}`);
                }
                return num as VariableValueFor<T>;
            }
            return result as VariableValueFor<T>;
        }),
    );
}

export function editVariable(name: string): Effect.Effect<void, never> {
    return Effect.gen(function* () {
        const state = variables.find(v => v.name === name);
        if (!state) return;

        const idx = variables.findIndex(v => v.name === name);
        const previousValue = state.value;
        const previousIsSet = state.isSet;

        const either = yield* Effect.either(promptForVariable(state));

        if (Either.isLeft(either)) {
            setVariables(idx, 'value', previousValue as any);
            setVariables(idx, 'isSet', previousIsSet);
            return;
        }

        setVariables(idx, 'value', either.right as any);
        setVariables(idx, 'isSet', true);
    });
}