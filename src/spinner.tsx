import "opentui-spinner/solid";
import { Show } from "solid-js";

export function Spinner(props: {message?: string, complete: boolean}) {
	return <box alignItems="center" flexDirection="row">
		<Show when={!props.complete} fallback={<text fg="green">✔</text>}><spinner name="dots" color="white" /></Show>
		<text marginLeft={1}>{props.message ?? "Loading..."}</text>
	</box>
}
