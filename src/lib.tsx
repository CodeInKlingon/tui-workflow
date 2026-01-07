import { render, useKeyboard, useRenderer } from "@opentui/solid"
import { createSignal, onMount, onCleanup, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import type { Step, StepDetail } from "./types";
import { DialogContainer, dialogService } from "./dialog";
import { Confirm, Prompt } from "./confirm";



function App(props: { steps: StepDetail[], activeStepIndex?: number | null }) {
    const renderer = useRenderer();

    useKeyboard((key) => {
        if(key.ctrl && key.name === 'b') renderer.console.toggle(); 
        console.log(`Key pressed: ${key.name}`);
    });

    return (
        <box flexDirection="column" height="100%" width="100%">
            <box flexDirection="row" gap={1} flexGrow={1}>
                <box border={true} borderStyle="rounded">
                    <For each={props.steps} fallback={<text>No steps defined.</text>}>
                        {(step, index) => (
                            <box backgroundColor={props.activeStepIndex === index() ? "blue" : undefined}>
                                <text>{step.title}</text>
                            </box>
                        )}
                    </For>
                </box>
                <box border={true} borderStyle="rounded" flexGrow={1}>
                    <Show when={props.activeStepIndex !== null && props.steps[props.activeStepIndex ?? -1]} fallback={<text>No active step.</text>}>
                        <For each={props.steps[props.activeStepIndex ?? -1]?.log} fallback={<text>No steps defined.</text>}>
                            {(log) => (
                                <text>{log}</text>
                            )}
                        </For>
                    </Show>
                </box>
            </box>
            <DialogContainer />
        </box>
    )
}

export function createWorkflow() {
    const [steps, setSteps] = createStore<StepDetail[]>([]);
    const [activeStepIndex, setActiveStepIndex] = createSignal<number | null>(null);
    
    function addStep(step: Step) {
        setSteps(steps.length, { ...step, status: 'pending', log: [] });
    }
    
    async function startWorkflow() {
        for (let index = 0; index < steps.length; index++) {
            const step = steps[index];
            if (!step) continue;
            
            setActiveStepIndex(index);
            setSteps(index, 'status', 'in-progress');
            
            try {
                await step.action({ 
                    log: (message: string) => {
                        setSteps(index, 'log', (logs) => [...logs, message]);
                    },
                    prompt: async (message: string) => {
                        const result = await dialogService.add<string>((resolve, reject) => (
                            <Prompt message={message} resolve={resolve} reject={reject} />
                        ));
                        return result;
                    },
                    confirm: async (message: string) => {
                        const result = await dialogService.add<boolean>((resolve, reject) => (
                            <Confirm message={message} resolve={resolve} reject={reject} />
                        ));
                        return result;
                    },
                    spinner: () => {
                        function start(msg: string){}
                        function message(msg: string){}
                        function stop(msg: string){}
                        return {
                            start,
                            message,
                            stop
                        }
                    },
                    progress: async () => {},
                    exit: () => process.exit(0),
                });
                setSteps(index, 'status', 'completed');
            } catch (e) {
                setSteps(index, 'status', 'failed');
                setSteps(index, 'error', (e instanceof Error ? e.message : String(e)));
            }
        }
        setActiveStepIndex(null);
    }

    render(() => <App steps={steps} activeStepIndex={activeStepIndex()}/>, {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: true,
    });

    return {
        steps,
        addStep,
        startWorkflow,
    };
}