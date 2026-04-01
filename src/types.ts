import type { JSXElement } from "solid-js";

export type LogEntry = 
    | { type: 'text', content: string }
    | { type: 'component', render: () => JSXElement };

export interface ProgressHandle {
    advance: (amount: number, message?: string) => void;
    complete: (message?: string) => void;
    halt: (message?: string) => void;
}

export interface Stage {
    title: string;
    key: string;
    action: (args: {
        log: (message: string) => void,
        confirm: (message: string) => Promise<boolean>,
        prompt: (message: string) => Promise<string>,
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