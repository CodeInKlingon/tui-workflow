import { render, useKeyboard, useRenderer } from "@opentui/solid"
import { createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import type { Stage, StageDetail, VariableState } from "./types";
import { DialogContainer, dialogService } from "./dialog";
import { Confirm, Prompt } from "./confirm";
import { Spinner } from "./spinner";
import { Progress } from "./progress";
import { useTerminalColors, TerminalColorProvider } from "./theme";
import { FocusTheme } from "./focus-colors";
import { panelFocused, setPanelFocused } from "./focus";
export { panelFocused, setPanelFocused } from "./focus";
import { variables, defineVariable } from "./variables";
import { VariablesPanel } from "./variables-panel";

const [activeStageIndex, setActiveStageIndex] = createSignal<number>(0);

function App(props: { stages: StageDetail[], variables: VariableState[], runStage: (index: number) => void }) {
    const renderer = useRenderer();

    const mainPanelsFocused = () => panelFocused() === 'stages' || panelFocused() === 'log' || panelFocused() === 'variables';
    useKeyboard((key) => {
        if(key.ctrl && key.name === 'b') renderer.console.toggle(); 
        if(key.name === '1' && mainPanelsFocused()) setPanelFocused('stages');
        if(key.name === '2' && mainPanelsFocused()) setPanelFocused('log');
        if(key.name === '3' && mainPanelsFocused()) setPanelFocused('variables');
    });

    return (
        <box flexDirection="column" height="100%" width="100%">
            <box flexDirection="row" gap={1} flexGrow={1}>
                <box flexDirection="column" flexBasis={40}>
                    <StagePanel stages={props.stages} isFocused={panelFocused() === 'stages'} runStage={props.runStage} />
                    <VariablesPanel variables={props.variables} isFocused={panelFocused() === 'variables'} />
                </box>
                <LogPanel stages={props.stages} isFocused={panelFocused() === 'log'} />
            </box>
            <DialogContainer />
        </box>
    )
}

function LogPanel(props: { stages: StageDetail[], isFocused: boolean }) {
    const { palette } = useTerminalColors();
    const activeStage = () => activeStageIndex() !== null ? props.stages[activeStageIndex()!] : undefined;
    const logTitle = () => activeStage() ? `[2]─Log: ${activeStage()!.title}` : "[2]─Log";
    return (
        <FocusTheme isHighlighted={props.isFocused} highlightForeground={palette().highlightForeground} foreground={palette().defaultForeground}>
            {({foreground}) => (
                <scrollbox border={true} borderStyle="rounded" flexShrink={1} title={logTitle()} borderColor={foreground} scrollY={true}>
                    <Show when={activeStageIndex() !== null && props.stages[activeStageIndex() ?? -1]} fallback={<text fg={foreground}>No active stage.</text>}>
                        <For each={props.stages[activeStageIndex() ?? -1]?.log} fallback={<text fg={foreground}>No stages defined.</text>}>
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

function StagePanel(props: { stages: StageDetail[], isFocused: boolean, runStage: (index: number) => void }) {
    const { palette } = useTerminalColors();

    useKeyboard((key) => {
        if(!props.isFocused) {
            return;
        };
        if(key.name === 'up'){
            const newIndex = Math.max((activeStageIndex() ?? 1) - 1, 0);
            setActiveStageIndex(newIndex);
            
        }
        if(key.name === 'down'){
            const newIndex = Math.min((activeStageIndex() ?? props.stages.length - 2) + 1, props.stages.length - 1);
            setActiveStageIndex(newIndex);
        }
        if(key.name === 'return'){
            props.runStage(activeStageIndex());
        }
    });
    return (
        <FocusTheme isHighlighted={props.isFocused} highlightForeground={palette().highlightForeground} foreground={palette().defaultForeground}>
            {({foreground, isHighlighted}) => (
                <box border={true} borderStyle="rounded" title="[1]─Stages" borderColor={foreground} flexGrow={1}>
                    <For each={props.stages} fallback={<text fg={foreground}>No stages defined.</text>}>
                        {(stage, index) => (
                            <StageListItem stage={stage} isFocused={isHighlighted && activeStageIndex() === index()} isActive={activeStageIndex() === index()} />
                        )}
                    </For>
                </box>
            )}
        </FocusTheme>
    )
}


function StageListItem(props: {stage: StageDetail, isFocused: boolean, isActive: boolean}) {
    const { palette } = useTerminalColors();
    const stageForeground = () => props.isFocused || props.isActive ? palette().highlightForeground : palette().defaultForeground;
    return <box flexDirection="row" backgroundColor={props.isActive ? palette().palette[4] : undefined}>
        <Show when={props.stage.status == 'in-progress'} fallback={<text>•</text>}><spinner name="dots" color={stageForeground()} /></Show>
        <text fg={stageForeground()}>{props.stage.title}</text>
    </box>
}

export function createWorkflow() {
    const [stages, setStages] = createStore<StageDetail[]>([]);
    
    function addStage(stage: Stage) {
        setStages(stages.length, { ...stage, status: 'pending', log: [] });
    }
    
    async function runStage(index: number) {
        const stage = stages[index];
        if (!stage || stage.status === 'in-progress') return;
        
        setActiveStageIndex(index);
        setStages(index, 'status', 'in-progress');
        
        try {
            await stage.action({ 
                log: (message: string) => {
                    setStages(index, 'log', (logs) => [...logs, { type: 'text' as const, content: message }]);
                },
                prompt: async (message: string) => {
                    const returnFocus = panelFocused();
                    setPanelFocused('prompt');
                    const result = await dialogService.add<string>((resolve, reject) => (
                        <Prompt message={message} title={stage.title} resolve={resolve} reject={reject} />
                    ));
                    setPanelFocused(returnFocus);
                    return result;
                },
                confirm: async (message: string) => {
                    const returnFocus = panelFocused();
                    setPanelFocused('confirm');
                    const result = await dialogService.add<boolean>((resolve, reject) => (
                        <Confirm message={message} title={stage.title} resolve={resolve} reject={reject} />
                    ));
                    setPanelFocused(returnFocus);
                    return result;
                },
                spinner: () => {
                    const [messageText, setMessageText] = createSignal<string>('');
                    const [complete, setCompleted] = createSignal<boolean>(false);
                    function start(msg: string){
                        setMessageText(msg);
                        setStages(index, 'log', (logs) => [...logs, { type: 'component' as const, render: () => 
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
                progress: (total: number) => {
                    const [current, setCurrent] = createSignal(0);
                    const [message, setMessage] = createSignal<string | undefined>(undefined);
                    const [status, setStatus] = createSignal<'active' | 'complete' | 'halted'>('active');
                    setStages(index, 'log', (logs) => [...logs, { type: 'component' as const, render: () =>
                        <Progress total={total} current={current()} message={message()} status={status()} />
                    }]);
                    return {
                        advance(amount: number, msg?: string) {
                            setCurrent((prev) => prev + amount);
                            if (msg !== undefined) setMessage(msg);
                        },
                        complete(msg?: string) {
                            setCurrent(total);
                            if (msg !== undefined) setMessage(msg);
                            setStatus('complete');
                        },
                        halt(msg?: string) {
                            if (msg !== undefined) setMessage(msg);
                            setStatus('halted');
                        },
                    };
                },
                exit: () => process.exit(0),
            });
            setStages(index, 'status', 'completed');
        } catch (e) {
            setStages(index, 'status', 'failed');
            setStages(index, 'error', (e instanceof Error ? e.message : String(e)));
        }
    }

    render(() => (
        <TerminalColorProvider>
            <App stages={stages} variables={variables} runStage={runStage} />
        </TerminalColorProvider>
    ), {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: true,
    });

    return {
        stages,
        addStage,
        runStage,
        defineVariable,
    };
}