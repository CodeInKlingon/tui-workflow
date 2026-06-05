import { createSignal, type JSX, For, type Component } from 'solid-js';
import { Effect } from 'effect';
import { DialogCancelled } from './errors';

type DialogRenderer<T = any> = (resolve: (value: T) => void, reject: () => void) => JSX.Element;

interface DialogItem {
    id: number;
    renderer: DialogRenderer<any>;
    resolve: (value: any) => void;
    reject: () => void;
}

const [dialogs, setDialogs] = createSignal<DialogItem[]>([]);
let nextId = 0;

export const dialogEffect = {
    add: <T,>(renderer: DialogRenderer<T>): Effect.Effect<T, DialogCancelled> =>
        Effect.async<T, DialogCancelled>((resume) => {
            const id = nextId++;

            const wrappedResolve = (value: T) => {
                setDialogs((prev) => prev.filter((d) => d.id !== id));
                resume(Effect.succeed(value));
            };

            const wrappedReject = () => {
                setDialogs((prev) => prev.filter((d) => d.id !== id));
                resume(Effect.fail(new DialogCancelled({})));
            };

            setDialogs((prev) => [...prev, { id, renderer, resolve: wrappedResolve, reject: wrappedReject }]);

            return Effect.sync(() => setDialogs((prev) => prev.filter((d) => d.id !== id)));
        }),
};

export const DialogContainer: Component = () => {
    return (
        <box position='absolute' top={0} left={0} right={0} bottom={0} zIndex={1000} alignItems='center' justifyContent='center'>
            <For each={dialogs()}>
                {(dialog) => dialog.renderer(dialog.resolve, dialog.reject)}
            </For>
        </box>
    );
};