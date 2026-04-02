import { createEffect, createSignal, For } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import type { ScrollBoxRenderable } from "@opentui/core";
import type { VariableState } from "./types";
import { useTerminalColors } from "./theme";
import { FocusTheme } from "./focus-colors";
import { editVariable } from "./variables";

export function VariablesPanel(props: { variables: VariableState[], isFocused: boolean }) {
    const { palette } = useTerminalColors();
    const [selectedIndex, setSelectedIndex] = createSignal(0);
    let scrollRef: ScrollBoxRenderable | undefined;

    useKeyboard((key) => {
        if (!props.isFocused) return;

        if (key.name === 'up') {
            setSelectedIndex(Math.max(selectedIndex() - 1, 0));
        }
        if (key.name === 'down') {
            setSelectedIndex(Math.min(selectedIndex() + 1, props.variables.length - 1));
        }
        if (key.name === 'return' && props.variables.length > 0) {
            const variable = props.variables[selectedIndex()];
            if (variable) {
                editVariable(variable.name);
            }
        }
    });

    createEffect(() => {
        const index = selectedIndex();
        if (scrollRef && index != null) {
            scrollRef.scrollTo({ x: 0, y: index });
        }
    });

    return (
        <FocusTheme isHighlighted={props.isFocused} highlightForeground={palette().highlightForeground} foreground={palette().defaultForeground}>
            {({ foreground, isHighlighted }) => (
                <scrollbox ref={scrollRef} border={true} borderStyle="rounded" title="[3]─Variables" borderColor={foreground} flexGrow={1} scrollY={true} focused={false}>
                    <For each={props.variables} fallback={<text fg={foreground}>No variables defined.</text>}>
                        {(variable, index) => (
                            <VariableListItem
                                variable={variable}
                                isSelected={isHighlighted && selectedIndex() === index()}
                                isActive={selectedIndex() === index()}
                            />
                        )}
                    </For>
                </scrollbox>
            )}
        </FocusTheme>
    );
}

function VariableListItem(props: { variable: VariableState, isSelected: boolean, isActive: boolean }) {
    const { palette } = useTerminalColors();
    const foreground = () => props.isSelected || props.isActive ? palette().highlightForeground : palette().defaultForeground;
    const dimForeground = () => palette().defaultForeground;

    const displayValue = () => {
        if (props.variable.isSet) {
            return String(props.variable.value);
        }
        if (props.variable.defaultValue !== undefined) {
            return `(${String(props.variable.defaultValue)})`;
        }
        return '<not set>';
    };

    return (
        <box flexDirection="row" backgroundColor={props.isActive ? palette().palette[4] : undefined}>
            <text fg={foreground()}>{props.variable.name}: </text>
            <text fg={props.variable.isSet ? foreground() : dimForeground()}>{displayValue()}</text>
        </box>
    );
}
