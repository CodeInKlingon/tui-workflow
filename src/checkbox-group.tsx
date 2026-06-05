import { useKeyboard, useRenderer } from "@opentui/solid";
import { createResource, createSignal, For, Show } from "solid-js";
import { useTerminalColors } from "./theme";

export interface CheckboxGroupProps<T> {
    options: T[];
    label: (option: T) => string;
    title?: string;
    resolve: (result: T[]) => void;
    reject: (reason?: any) => void;
}

export function CheckboxGroup<T>(props: CheckboxGroupProps<T>) {
    const { palette } = useTerminalColors();
    const [focusedIndex, setFocusedIndex] = createSignal(0);
    const [selectedIndices, setSelectedIndices] = createSignal<Set<number>>(new Set());
    const renderer = useRenderer();

    const [backgroundColor] = createResource(async () => {
        const result = await renderer.getPalette();
        return result.defaultBackground as string;
    }, { initialValue: 'black' });

    const toggleSelection = (index: number) => {
        setSelectedIndices((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    useKeyboard((key) => {
        if (key.name === 'up') {
            setFocusedIndex((prev) => Math.max(0, prev - 1));
        }
        if (key.name === 'down') {
            setFocusedIndex((prev) => Math.min(props.options.length - 1, prev + 1));
        }
        if (key.name === 'space') {
            toggleSelection(focusedIndex());
        }
        if (key.name === 'return') {
            const selected = props.options.filter((_, index) => selectedIndices().has(index));
            props.resolve(selected);
        }
        if (key.name === 'escape') {
            props.reject();
        }
    });

    const selectionCount = () => selectedIndices().size;
    const titleText = () => {
        const baseTitle = props.title ?? 'Select options';
        const count = selectionCount();
        return count > 0 ? `${baseTitle} (${count} selected)` : baseTitle;
    };

    return (
        <box 
            border={true} 
            padding={1} 
            borderStyle="rounded" 
            alignItems="flex-start" 
            backgroundColor={backgroundColor()} 
            title={titleText()}
            flexDirection="column"
            gap={0}
        >
            <For each={props.options}>
                {(option, index) => {
                    const isFocused = () => focusedIndex() === index();
                    const isSelected = () => selectedIndices().has(index());
                    const checkbox = () => isSelected() ? '[✓]' : '[ ]';
                    const labelText = () => props.label(option);
                    const highlightFg = () => palette().highlightForeground;
                    const defaultFg = () => palette().defaultForeground;
                    
                    return (
                        <box flexDirection="row" gap={1}>
                            <Show when={isFocused()} fallback={
                                <text content={`  ${checkbox()} ${labelText()}`} />
                            }>
                                <text fg={highlightFg()}>{`> ${checkbox()} ${labelText()}`}</text>
                            </Show>
                        </box>
                    );
                }}
            </For>
            <box marginTop={1}>
                <text fg={palette().palette[8] ?? '#808080'}>↑↓ navigate • space toggle • enter confirm • esc cancel</text>
            </box>
        </box>
    );
}
