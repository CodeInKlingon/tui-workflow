import { createSignal, type JSX, For, type Component } from 'solid-js';

type DialogRenderer<T = any> = (resolve: (value: T) => void, reject: (reason?: any) => void) => JSX.Element;

interface DialogItem<T = any> {
	id: number;
	renderer: DialogRenderer<T>;
	resolve: (value: T) => void;
	reject: (reason?: any) => void;
}

// Module-scoped state
const [dialogs, setDialogs] = createSignal<DialogItem[]>([]);
let nextId = 0;

// Dialog service singleton
export const dialogService = {
	add: <T,>(renderer: DialogRenderer<T>): Promise<T> => {
		return new Promise<T>((resolve, reject) => {
			const id = nextId++;
			
			const wrappedResolve = (value: T) => {
				setDialogs((prev) => prev.filter((d) => d.id !== id));
				resolve(value);
			};
			
			const wrappedReject = (reason?: any) => {
				setDialogs((prev) => prev.filter((d) => d.id !== id));
				reject(reason);
			};

			const dialogItem: DialogItem<T> = {
				id,
				renderer,
				resolve: wrappedResolve,
				reject: wrappedReject,
			};

			setDialogs((prev) => [...prev, dialogItem]);
		});
	},
};

// Dialog container component to render active dialogs
export const DialogContainer: Component = () => {
	return (
		<box position='absolute' top={0} left={0} right={0} bottom={0} zIndex={1000} alignItems='center' justifyContent='center'>
			<For each={dialogs()}>
				{(dialog) => dialog.renderer(dialog.resolve, dialog.reject)}
			</For>
		</box>
	);
};
