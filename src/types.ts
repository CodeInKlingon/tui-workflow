import type { JSXElement } from "solid-js";

export type LogEntry = 
    | { type: 'text', content: string }
    | { type: 'component', render: () => JSXElement };

export interface Step {
    title: string;
    key: string;
    action: (args: {
        log: (message: string) => void,
        confirm: (message: string) => Promise<boolean>,
        prompt: (message: string) => Promise<string>,
        spinner: () => any,
        exit: () => void,
    }) => Promise<void>;
}

export interface StepDetail extends Step {
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    error?: string;
    log: LogEntry[];
}