import "opentui-spinner/solid";
import { Show } from "solid-js";
import { panelFocused } from "./lib";
import { useTerminalColors } from "./theme";
export function Spinner(props: {message?: string, complete: boolean}) {
	
	const { palette } = useTerminalColors();
	
	const logForeground = () => panelFocused() === 'log' ? palette().highlightForeground : palette().defaultForeground;
	return <box>
		<Show when={!props.complete} fallback={<text fg={logForeground()}>*</text>}><spinner name="dots" color={logForeground()} /></Show>
		<text fg={logForeground()} marginLeft={1}>{props.message ?? "Loading..."}</text>
	</box>
}
