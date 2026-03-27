import { useKeyboard, useRenderer } from "@opentui/solid";
import { createResource, createSignal } from "solid-js";

export function Confirm(props: {message: string, title?: string, resolve: (result: boolean) => void, reject: (reason?: any) => void}){

    const [focusedButton, setFocusedButton] = createSignal<'yes' | 'no'>('yes');
    const renderer = useRenderer();
    
    const [backgroundColor] = createResource(async () => {
        const palette = await renderer.getPalette();
        return palette.defaultBackground as string;
    }, { initialValue: 'black' });

    useKeyboard((key) => {
        if(key.name === 'left' || key.name === 'right'){
            setFocusedButton(focusedButton() === 'yes' ? 'no' : 'yes');
        }
        if(key.name === 'return'){
            props.resolve(focusedButton() === 'yes');
        }
        if(key.name === 'escape'){
            props.reject();
        }
    });

    return (
        <box border={true} padding={2} borderStyle="rounded" alignItems="center" backgroundColor={backgroundColor()} title={props.title}>
            <text>{props.message}</text>
            <box flexDirection="row" marginTop={1} justifyContent="space-between" gap={2}>
                <text>{focusedButton() === 'yes' ? '[Yes]' : 'Yes'}</text>
                <text>{focusedButton() === 'no' ? '[No]' : 'No'}</text>
            </box>
        </box>
    )


}



export function Prompt(props: {message: string, title?: string, resolve: (result: string) => void, reject: (reason?: any) => void}){

    const renderer = useRenderer();
    const [value, setValue] = createSignal<string>('');

    const [backgroundColor] = createResource(async () => {
        const palette = await renderer.getPalette();
        return palette.defaultBackground as string;
    }, { initialValue: 'black' });

    useKeyboard((key) => {
        if(key.name === 'return'){
            props.resolve(value());
        }
        if(key.name === 'escape'){
            props.reject();
        }
    });

    return (
        <box border={true} padding={2} borderStyle="rounded" alignItems="center" backgroundColor={backgroundColor()} title={props.title}>
            <text>{props.message}</text>
            <box width={25} marginTop={1}  gap={2}>
                <input value={value()} onInput={e => setValue(e)} focused/>
            </box>
        </box>
    )


}