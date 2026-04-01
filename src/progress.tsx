import { Show } from "solid-js";
import { panelFocused } from "./lib";
import { useTerminalColors } from "./theme";

export function Progress(props: {
	total: number,
	current: number,
	message?: string,
	status: 'active' | 'complete' | 'halted',
}) {
	const { palette } = useTerminalColors();

	const logForeground = () => panelFocused() === 'log' ? palette().highlightForeground : palette().defaultForeground;
	const fraction = () => Math.min(props.current / props.total, 1);
	const percent = () => Math.round(fraction() * 100);

	const barWidth = 20;
	const filled = () => Math.round(fraction() * barWidth);
	const empty = () => barWidth - filled();
	const bar = () => `[${"#".repeat(filled())}${"-".repeat(empty())}]`;

	const statusChar = () => {
		if (props.status === 'complete') return '*';
		if (props.status === 'halted') return 'x';
		return ' ';
	};

	return <box>
		<text fg={logForeground()}>
			{statusChar()} {bar()} {percent()}%{props.message ? ` ${props.message}` : ''}
		</text>
	</box>
}
