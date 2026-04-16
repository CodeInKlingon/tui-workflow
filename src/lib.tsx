import { render, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid"
import type { ScrollBoxRenderable } from "@opentui/core"
import { createEffect, createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import type { Stage, StageDetail, VariableState, InitContext, WorkflowConfig, LogEntry } from "./types";
import { DialogContainer, dialogService } from "./dialog";
import { Confirm, Prompt } from "./confirm";
import { CheckboxGroup } from "./checkbox-group";
import { Spinner } from "./spinner";
import { Progress } from "./progress";
import { useTerminalColors, TerminalColorProvider } from "./theme";
import { FocusTheme } from "./focus-colors";
import { panelFocused, setPanelFocused } from "./focus";
export { panelFocused, setPanelFocused } from "./focus";
export type { VariableType, VariableValueFor, VariableDefinition, VariableState, VariableHandle, ProgressHandle, Stage, StageDetail, LogEntry, InitContext, WorkflowConfig } from "./types";
export { defineVariable } from "./variables";
import { variables, defineVariable } from "./variables";
import { VariablesPanel } from "./variables-panel";

const [activeStageIndex, setActiveStageIndex] = createSignal<number>(0);

function App(props: { stages: StageDetail[], variables: VariableState[], runStage: (index: number) => void }) {
    const renderer = useRenderer();
    const dimensions = useTerminalDimensions();

    const mainPanelsFocused = () => panelFocused() === 'stages' || panelFocused() === 'log' || panelFocused() === 'variables';
    useKeyboard((key) => {
        if(key.ctrl && key.name === 'b') renderer.console.toggle(); 
        if(key.name === '1' && mainPanelsFocused()) setPanelFocused('stages');
        if(key.name === '2' && mainPanelsFocused()) setPanelFocused('log');
        if(key.name === '3' && mainPanelsFocused()) setPanelFocused('variables');
    });

    return (
        <box flexDirection="column" height={dimensions().height} width={dimensions().width}>
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
                <scrollbox border={true} borderStyle="rounded" flexShrink={1} title={logTitle()} borderColor={foreground} focusedBorderColor={foreground} scrollY={true} focused={props.isFocused} stickyScroll={true} stickyStart="bottom">
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
    let scrollRef: ScrollBoxRenderable | undefined;

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

    createEffect(() => {
        const index = activeStageIndex();
        if (scrollRef && index != null) {
            scrollRef.scrollTo({ x: 0, y: index });
        }
    });

    return (
        <FocusTheme isHighlighted={props.isFocused} highlightForeground={palette().highlightForeground} foreground={palette().defaultForeground}>
            {({foreground, isHighlighted}) => (
                <scrollbox ref={scrollRef} border={true} borderStyle="rounded" title="[1]─Stages" borderColor={foreground} flexGrow={1} scrollY={true} focused={false}>
                    <For each={props.stages} fallback={<text fg={foreground}>No stages defined.</text>}>
                        {(stage, index) => (
                            <StageListItem stage={stage} isFocused={isHighlighted && activeStageIndex() === index()} isActive={activeStageIndex() === index()} />
                        )}
                    </For>
                </scrollbox>
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

function InitApp(props: { 
    logs: LogEntry[], 
    children?: any 
}) {
    const { palette } = useTerminalColors();
    const dimensions = useTerminalDimensions();

    return (
        <box 
            flexDirection="column" 
            height={dimensions().height} 
            width={dimensions().width}
            alignItems="center"
            justifyContent="center"
        >
            <box 
                flexDirection="column" 
                width={Math.min(80, dimensions().width - 4)}
                height={Math.min(20, dimensions().height - 4)}
                border={true}
                borderStyle="rounded"
                borderColor={palette().defaultForeground}
                title="Initializing"
            >
                <scrollbox flexGrow={1} scrollY={true} stickyScroll={true} stickyStart="bottom">
                    <For each={props.logs}>
                        {(log) => (
                            log.type === 'text' ? <text>{log.content}</text> : log.render()
                        )}
                    </For>
                </scrollbox>
            </box>
            <DialogContainer />
        </box>
    );
}

export function createWorkflow(config?: WorkflowConfig) {
    const [stages, setStages] = createStore<StageDetail[]>([]);
    const [initLogs, setInitLogs] = createSignal<LogEntry[]>([]);
    const [initStatus, setInitStatus] = createSignal<'idle' | 'running' | 'completed' | 'failed'>('idle');
    
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
                checkboxGroup: async <T,>(options: { options: T[]; label: (option: T) => string; title?: string }) => {
                    const returnFocus = panelFocused();
                    setPanelFocused('checkboxGroup');
                    const result = await dialogService.add<T[]>((resolve, reject) => (
                        <CheckboxGroup options={options.options} label={options.label} title={options.title} resolve={resolve} reject={reject} />
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

    // Create the init context with bound log function
    function createInitContext(): InitContext {
        return {
            log: (message: string) => {
                setInitLogs((logs) => [...logs, { type: 'text' as const, content: message }]);
            },
            prompt: async (message: string) => {
                const result = await dialogService.add<string>((resolve, reject) => (
                    <Prompt message={message} title="Initialization" resolve={resolve} reject={reject} />
                ));
                return result;
            },
            confirm: async (message: string) => {
                const result = await dialogService.add<boolean>((resolve, reject) => (
                    <Confirm message={message} title="Initialization" resolve={resolve} reject={reject} />
                ));
                return result;
            },
            checkboxGroup: async <T,>(options: { options: T[]; label: (option: T) => string; title?: string }) => {
                const result = await dialogService.add<T[]>((resolve, reject) => (
                    <CheckboxGroup options={options.options} label={options.label} title={options.title} resolve={resolve} reject={reject} />
                ));
                return result;
            },
            spinner: () => {
                const [messageText, setMessageText] = createSignal<string>('');
                const [complete, setCompleted] = createSignal<boolean>(false);
                function start(msg: string){
                    setMessageText(msg);
                    setInitLogs((logs) => [...logs, { type: 'component' as const, render: () => 
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
                };
            },
            progress: (total: number) => {
                const [current, setCurrent] = createSignal(0);
                const [message, setMessage] = createSignal<string | undefined>(undefined);
                const [status, setStatus] = createSignal<'active' | 'complete' | 'halted'>('active');
                setInitLogs((logs) => [...logs, { type: 'component' as const, render: () =>
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
        };
    }

    // Handle init execution
    async function runInit() {
        if (!config?.init) {
            setInitStatus('completed');
            return;
        }

        setInitStatus('running');
        
        try {
            const ctx = createInitContext();
            await config.init(ctx);
            setInitStatus('completed');
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.error(`Initialization failed: ${errorMsg}`);
            process.exit(1);
        }
    }

    // Start init immediately
    runInit();

    render(() => {
        return (
            <TerminalColorProvider>
                <Show 
                    when={initStatus() === 'completed'}
                    fallback={<InitApp logs={initLogs()} />}
                >
                    <App stages={stages} variables={variables} runStage={runStage} />
                </Show>
            </TerminalColorProvider>
        );
    }, {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: true,
    });

    return {
        stages,
        addStage,
        runStage,
    };
}