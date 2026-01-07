import { render, useKeyboard, useRenderer } from "@opentui/solid"
import { createSignal, onMount, onCleanup, For, Show } from "solid-js"

interface Step {
    title: string;
    key: string;
    action: (args: { log: (message: string) => void }) => Promise<void>;
}

interface StepDetail extends Step {
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    error?: string;
    log: string[];
}

function App(props: { steps: StepDetail[], activeStepIndex?: number | null }) {
    const renderer = useRenderer();

    useKeyboard((key) => {
        if(key.ctrl && key.name === 'b') renderer.console.toggle(); 
        console.log(`Key pressed: ${key.name}`);
    });

    return (
        <box flexDirection="row" padding={1} gap={1} height="100%">
            <box border={true} borderStyle="rounded">
                <For each={props.steps} fallback={<text>No steps defined.</text>}>
                    {(step, index) => (
                        <box backgroundColor={props.activeStepIndex === index() ? "blue" : undefined}>
                            <text>{step.title}</text>
                        </box>
                    )}
                </For>
            </box>
            <box border={true} borderStyle="rounded" flexGrow={1} padding={1}>
                <Show when={props.activeStepIndex !== null && props.steps[props.activeStepIndex ?? -1]} fallback={<text>No active step.</text>}>
                    <For each={props.steps[props.activeStepIndex ?? -1]?.log} fallback={<text>No steps defined.</text>}>
                        {(log) => (
                            <text>{log}</text>
                        )}
                    </For>
                </Show>
            </box>
        </box>
    )
}

export function createWorkflow() {
    const [steps, setSteps] = createSignal<StepDetail[]>([]);
    const [activeStepIndex, setActiveStepIndex] = createSignal<number | null>(null);
    
    function addStep(step: Step) {
        setSteps(s => [...s, { ...step, status: 'pending', log: [] }]);
    }
    
    async function startWorkflow() {
        const stepsList = steps();
        for (const [index, step] of stepsList.entries()) {
            setActiveStepIndex(index);
            step.status = 'in-progress';
            try{
                await step.action({ 
                    log: (message: string) => {
                        step.log.push(message);
                    },
                });
            }catch (e){
                step.status = 'failed';
                step.error = (e instanceof Error ? e.message : String(e));
            }
        }
        setActiveStepIndex(null);
    }

    render(() => <App steps={steps()} activeStepIndex={activeStepIndex()}/>, {
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