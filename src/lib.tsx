import { render, useKeyboard, useRenderer } from "@opentui/solid"
import { createSignal, onMount, onCleanup, For, Show, createResource, useContext } from "solid-js"
import { createStore } from "solid-js/store"
import type { Step, StepDetail } from "./types";
import { DialogContainer, dialogService } from "./dialog";
import { Confirm, Prompt } from "./confirm";
import { Spinner } from "./spinner";
import { useTerminalColors, TerminalColorProvider } from "./theme";

function App(props: { steps: StepDetail[], activeStepIndex?: number | null }) {
    const renderer = useRenderer();

    const { palette } = useTerminalColors();
    
    const [panelFocused, setPanelFocused] = createSignal<'steps' | 'log'>('log');

    useKeyboard((key) => {
        if(key.ctrl && key.name === 'b') renderer.console.toggle(); 
        if(key.name === '1') setPanelFocused('steps');
        if(key.name === '2') setPanelFocused('log');
    });

    return (
        <box flexDirection="column" height="100%" width="100%">
            <box flexDirection="row" gap={1} flexGrow={1}>
                <box border={true} borderStyle="rounded" title="[1]─Steps" borderColor={panelFocused() === 'steps' ? palette().defaultForeground : 'white'}>
                    <For each={props.steps} fallback={<text>No steps defined.</text>}>
                        {(step, index) => (
                            <box backgroundColor={props.activeStepIndex === index() ? palette().palette[4] : undefined}>
                                <text>{step.title}</text>
                            </box>
                        )}
                    </For>
                </box>
                <scrollbox border={true} borderStyle="rounded" flexGrow={1} title="Log" scrollY={true}>
                    <Show when={props.activeStepIndex !== null && props.steps[props.activeStepIndex ?? -1]} fallback={<text>No active step.</text>}>
                        <For each={props.steps[props.activeStepIndex ?? -1]?.log} fallback={<text>No steps defined.</text>}>
                            {(log) => (
                                log.type === 'text' ? <text>{log.content}</text> : log.render()
                            )}
                        </For>
                    </Show>
                </scrollbox>
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
                        setSteps(index, 'log', (logs) => [...logs, { type: 'text' as const, content: message }]);
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
                        const [messageText, setMessageText] = createSignal<string>('');
                        const [complete, setCompleted] = createSignal<boolean>(false);
                        function start(msg: string){
                            setMessageText(msg);
                            setSteps(index, 'log', (logs) => [...logs, { type: 'component' as const, render: () => 
                                <Spinner message={messageText()} complete={complete()} /> 
                            }]);
                        }
                        function message(msg: string){
                            setMessageText(msg);
                        }
                        function stop(msg: string){
                            setMessageText(msg);
                            setCompleted(true);
                        }

                        return {
                            start,
                            message,
                            stop
                        }
                    },
                    // progress: async () => {},
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

    render(() => (
        <TerminalColorProvider>
            <App steps={steps} activeStepIndex={activeStepIndex()}/>
        </TerminalColorProvider>
    ), {
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