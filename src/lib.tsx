import { render, useKeyboard, useRenderer } from "@opentui/solid"
import { createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import type { Step, StepDetail } from "./types";
import { DialogContainer, dialogService } from "./dialog";
import { Confirm, Prompt } from "./confirm";
import { Spinner } from "./spinner";
import { useTerminalColors, TerminalColorProvider } from "./theme";
import { FocusTheme } from "./focus-colors";

export const [panelFocused, setPanelFocused] = createSignal<string>('steps');
const [activeStepIndex, setActiveStepIndex] = createSignal<number>(0);

function App(props: { steps: StepDetail[], runStep: (index: number) => void }) {
    const renderer = useRenderer();

    const mainPanelsFocused = () => panelFocused() === 'steps' || panelFocused() === 'log';
    useKeyboard((key) => {
        if(key.ctrl && key.name === 'b') renderer.console.toggle(); 
        if(key.name === '1' && mainPanelsFocused()) setPanelFocused('steps');
        if(key.name === '2' && mainPanelsFocused()) setPanelFocused('log');
    });

    return (
        <box flexDirection="column" height="100%" width="100%">
            <box flexDirection="row" gap={1} flexGrow={1}>
                <StepPanel steps={props.steps} isFocused={panelFocused() === 'steps'} runStep={props.runStep} />
                <LogPanel steps={props.steps} isFocused={panelFocused() === 'log'} />
            </box>
            <DialogContainer />
        </box>
    )
}

function LogPanel(props: { steps: StepDetail[], isFocused: boolean }) {
    const { palette } = useTerminalColors();
    const activeStep = () => activeStepIndex() !== null ? props.steps[activeStepIndex()!] : undefined;
    const logTitle = () => activeStep() ? `[2]─Log: ${activeStep()!.title}` : "[2]─Log";
    return (
        <FocusTheme isHighlighted={props.isFocused} highlightForeground={palette().highlightForeground} foreground={palette().defaultForeground}>
            {({foreground}) => (
                <scrollbox border={true} borderStyle="rounded" flexShrink={1} title={logTitle()} borderColor={foreground} scrollY={true}>
                    <Show when={activeStepIndex() !== null && props.steps[activeStepIndex() ?? -1]} fallback={<text fg={foreground}>No active step.</text>}>
                        <For each={props.steps[activeStepIndex() ?? -1]?.log} fallback={<text fg={foreground}>No steps defined.</text>}>
                            {(log) => (
                                log.type === 'text' ? <text fg={foreground}>{log.content}</text> : log.render()
                            )}
                        </For>
                    </Show>
                </scrollbox>
            )}
        </FocusTheme>
    )
}

function StepPanel(props: { steps: StepDetail[], isFocused: boolean, runStep: (index: number) => void }) {
    const { palette } = useTerminalColors();

    useKeyboard((key) => {
        if(!props.isFocused) {
            return;
        };
        if(key.name === 'up'){
            const newIndex = Math.max((activeStepIndex() ?? 1) - 1, 0);
            setActiveStepIndex(newIndex);
            
        }
        if(key.name === 'down'){
            const newIndex = Math.min((activeStepIndex() ?? props.steps.length - 2) + 1, props.steps.length - 1);
            setActiveStepIndex(newIndex);
        }
        if(key.name === 'return'){
            props.runStep(activeStepIndex());
        }
    });
    return (
        <FocusTheme isHighlighted={props.isFocused} highlightForeground={palette().highlightForeground} foreground={palette().defaultForeground}>
            {({foreground, isHighlighted}) => (
                <box border={true} borderStyle="rounded" title="[1]─Steps" borderColor={foreground} flexBasis={40}>
                    <For each={props.steps} fallback={<text fg={foreground}>No steps defined.</text>}>
                        {(step, index) => (
                            <StepListItem step={step} isFocused={isHighlighted && activeStepIndex() === index()} isActive={activeStepIndex() === index()} />
                        )}
                    </For>
                </box>
            )}
        </FocusTheme>
    )
}


function StepListItem(props: {step: StepDetail, isFocused: boolean, isActive: boolean}) {
    const { palette } = useTerminalColors();
    const stepsForeground = () => props.isFocused || props.isActive ? palette().highlightForeground : palette().defaultForeground;
    return <box flexDirection="row" backgroundColor={props.isActive ? palette().palette[4] : undefined}>
        <Show when={props.step.status == 'in-progress'} fallback={<text>•</text>}><spinner name="dots" color={stepsForeground()} /></Show>
        <text fg={stepsForeground()}>{props.step.title}</text>
    </box>
}

export function createWorkflow() {
    const [steps, setSteps] = createStore<StepDetail[]>([]);
    
    function addStep(step: Step) {
        setSteps(steps.length, { ...step, status: 'pending', log: [] });
    }
    
    async function runStep(index: number) {
        const step = steps[index];
        if (!step || step.status === 'in-progress') return;
        
        setActiveStepIndex(index);
        setSteps(index, 'status', 'in-progress');
        
        try {
            await step.action({ 
                log: (message: string) => {
                    setSteps(index, 'log', (logs) => [...logs, { type: 'text' as const, content: message }]);
                },
                prompt: async (message: string) => {
                    const returnFocus = panelFocused();
                    setPanelFocused('prompt');
                    const result = await dialogService.add<string>((resolve, reject) => (
                        <Prompt message={message} title={step.title} resolve={resolve} reject={reject} />
                    ));
                    setPanelFocused(returnFocus);
                    return result;
                },
                confirm: async (message: string) => {
                    const returnFocus = panelFocused();
                    setPanelFocused('confirm');
                    const result = await dialogService.add<boolean>((resolve, reject) => (
                        <Confirm message={message} title={step.title} resolve={resolve} reject={reject} />
                    ));
                    setPanelFocused(returnFocus);
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

    render(() => (
        <TerminalColorProvider>
            <App steps={steps} runStep={runStep} />
        </TerminalColorProvider>
    ), {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: true,
    });

    return {
        steps,
        addStep,
        runStep,
    };
}