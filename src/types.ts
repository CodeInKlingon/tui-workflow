import type { JSXElement } from "solid-js";

export type LogEntry = 
    | { type: 'text', content: string }
    | { type: 'component', render: () => JSXElement };

export interface ProgressHandle {
    advance: (amount: number, message?: string) => void;
    complete: (message?: string) => void;
    halt: (message?: string) => void;
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
    get: () => Promise<VariableValueFor<T>>;
    /** Always prompt the user for a new value, even if already set. Useful for re-authenticating stale credentials. */
    prompt: () => Promise<VariableValueFor<T>>;
    /** Non-blocking read. Returns undefined if not yet set. */
    peek: () => VariableValueFor<T> | undefined;
    /** Programmatically set the variable value. */
    set: (value: VariableValueFor<T>) => void;
    /** Internal: the variable name, used for wiring. */
    readonly name: string;
    /** Internal: the variable type. */
    readonly type: T;
}

// --- Stage Types ---

export interface Stage {
    title: string;
    key: string;
    action: (args: {
        log: (message: string) => void,
        confirm: (message: string) => Promise<boolean>,
        prompt: (message: string) => Promise<string>,
        checkboxGroup: <T>(options: {
            options: T[];
            label: (option: T) => string;
            title?: string;
        }) => Promise<T[]>;
        spinner: () => any,
        progress: (total: number) => ProgressHandle,
        exit: () => void,
    }) => Promise<void>;
}

export interface StageDetail extends Stage {
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    error?: string;
    log: LogEntry[];
}

// --- Init Types ---

export interface InitContext {
    log: (message: string) => void;
    confirm: (message: string) => Promise<boolean>;
    prompt: (message: string) => Promise<string>;
    checkboxGroup: <T>(options: {
        options: T[];
        label: (option: T) => string;
        title?: string;
    }) => Promise<T[]>;
    spinner: () => {
        start: (msg: string) => void;
        message: (msg: string) => void;
        stop: (msg: string) => void;
    };
    progress: (total: number) => ProgressHandle;
    exit: () => void;
}

export interface WorkflowConfig {
    init?: (ctx: InitContext) => Promise<void>;
}