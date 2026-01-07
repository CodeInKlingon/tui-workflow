import { render, useKeyboard, useRenderer } from "@opentui/solid"
import { createSignal, onMount, onCleanup } from "solid-js"
function App() {
    const [count, setCount] = createSignal(0);
    const renderer = useRenderer();

    useKeyboard((key) => {
        if(key.ctrl && key.name === 'b') renderer.console.toggle(); 
        console.log(`Key pressed: ${key.name}`);
    });
    onMount(() => {
        const interval = setInterval(() => {
            setCount(c => c + 1)
        }, 500);
        onCleanup(() => clearInterval(interval));
    });
    return (
        <box>
            <text>Count: {count()}</text>
        </box>
    )
}
render(() => <App />, {
    targetFps: 60,
    gatherStats: false,
    exitOnCtrlC: true,
});