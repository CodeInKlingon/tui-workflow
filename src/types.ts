import type { JSXElement } from "solid-js";
import { Effect } from "effect";
import type { DialogCancelled, VariableRequired, WorkflowExit } from "./errors";

export type LogEntry = 
    | { type: 'text', content: string }
    | { type: 'component', render: () => JSXElement };

export interface ProgressHandle {
    advance: (amount: number, message?: string) => void;
    complete: (message?: string) => void;
    halt: (message?: string) => void;
}

export interface SpinnerHandle {
    start: (msg: string) => void;
    message: (msg: string) => void;
    stop: (msg: string) => void;
}

// --- Variable Types ---

export type VariableType = 'string' | 'number' | 'boolean';

export type VariableValueFor<T extends VariableType> = 
    T extends 'string' ? string :
    T extends 'number' ? number :
    T extends 'boolean' ? boolean :
    never;

export interface VariableDefinition<T extends VariableType = VariableType> {
    name: string;
    type: T;
    description: string;
    defaultValue?: VariableValueFor<T>;
}

export interface VariableState<T extends VariableType = VariableType> extends VariableDefinition<T> {
    value: VariableValueFor<T> | undefined;
    isSet: boolean;
}

export interface VariableHandle<T extends VariableType = VariableType> {
    /** Resolve the variable value. Prompts the user if not yet set. */
    get: Effect.Effect<VariableValueFor<T>, DialogCancelled | VariableRequired>;
    /** Always prompt the user for a new value, even if already set. */
    prompt: Effect.Effect<VariableValueFor<T>, DialogCancelled>;
    /** Non-blocking read. Returns undefined if not yet set. */
    peek: () => VariableValueFor<T> | undefined;
    /** Programmatically set the variable value. Synchonous, persists to store immediately. */
    set: (value: VariableValueFor<T>) => void;
    /** Internal: the variable name, used for wiring. */
    readonly name: string;
    /** Internal: the variable type. */
    readonly type: T;
}

// --- Stage Types ---

export interface StageActionContext {
    readonly log: (message: string) => void;
    readonly confirm: (message: string) => Effect.Effect<boolean, DialogCancelled>;
    readonly prompt: (message: string) => Effect.Effect<string, DialogCancelled>;
    readonly checkboxGroup: <T>(options: {
        options: T[];
        label: (option: T) => string;
        title?: string;
    }) => Effect.Effect<T[], DialogCancelled>;
    readonly spinner: () => SpinnerHandle;
    readonly progress: (total: number) => ProgressHandle;
    readonly exit: Effect.Effect<never, WorkflowExit>;
}

export interface Stage {
    title: string;
    key: string;
    action: (ctx: StageActionContext) => Effect.Effect<void, any>;
}

export interface StageDetail extends Stage {
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    error?: string;
    log: LogEntry[];
}

// --- Init Types ---

export interface InitContext extends StageActionContext {}

export interface WorkflowConfig {
    init?: (ctx: InitContext) => Effect.Effect<void, any>;
}