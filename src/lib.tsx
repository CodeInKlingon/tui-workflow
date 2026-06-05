import { render, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid"
import type { ScrollBoxRenderable } from "@opentui/core"
import { createEffect, createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { Effect } from "effect"
import type { Stage, StageDetail, VariableState, InitContext, WorkflowConfig, LogEntry, StageActionContext } from "./types";
import { WorkflowExit, DialogCancelled } from "./errors";
import { DialogContainer, dialogEffect } from "./dialog";
import { Confirm, Prompt } from "./confirm";
import { CheckboxGroup } from "./checkbox-group";
import { Spinner } from "./spinner";
import { Progress } from "./progress";
import { useTerminalColors, TerminalColorProvider } from "./theme";
import { FocusTheme } from "./focus-colors";
import { panelFocused, setPanelFocused } from "./focus";
export { panelFocused, setPanelFocused } from "./focus";
export type { VariableType, VariableValueFor, VariableDefinition, VariableState, VariableHandle, ProgressHandle, Stage, StageDetail, LogEntry, InitContext, WorkflowConfig, StageActionContext, SpinnerHandle } from "./types";
export { DialogCancelled, VariableRequired, WorkflowExit, VariableAlreadyDefined } from "./errors";
export { defineVariable } from "./variables";
import { variables as variablesStore } from "./variables";
import { VariablesPanel } from "./variables-panel";

const [activeStageIndex, setActiveStageIndex] = createSignal<number>(0);

function App(props: { stages: StageDetail[], variables: VariableState[], runStage: (index: number) => void }) {
    const renderer = useRenderer();
    const dimensions = useTerminalDimensions();
    console.log('[lifecycle] App mounted, panelFocused:', panelFocused());

    const mainPanelsFocused = () => panelFocused() === 'stages' || panelFocused() === 'log' || panelFocused() === 'variables';
    useKeyboard((key) => {
        console.log('[App] key pressed:', JSON.stringify({ name: key.name, ctrl: key.ctrl, shift: key.shift, meta: key.meta, focused: panelFocused() }));
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
        console.log('[StagePanel] key pressed:', JSON.stringify({ name: key.name, ctrl: key.ctrl, shift: key.shift, meta: key.meta, isFocused: props.isFocused }));
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
        >
            <box 
                flexDirection="column" 
                flexGrow={1}
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
        setStages(stages.length, { ...stage, status: 'pending' as const, log: [] });
    }

    function makeStageContext(index: number, stage: StageDetail): StageActionContext {
        return {
            log: (message: string) => {
                setStages(index, 'log', (logs) => [...logs, { type: 'text' as const, content: message }]);
            },
            prompt: (message: string) => {
                const returnFocus = panelFocused();
                setPanelFocused('prompt');
                return dialogEffect.add<string>((resolve, reject) => (
                    <Prompt message={message} title={stage.title} resolve={resolve} reject={reject} />
                )).pipe(
                    Effect.ensuring(Effect.sync(() => setPanelFocused(returnFocus))),
                );
            },
            confirm: (message: string) => {
                const returnFocus = panelFocused();
                setPanelFocused('confirm');
                return dialogEffect.add<boolean>((resolve, reject) => (
                    <Confirm message={message} title={stage.title} resolve={resolve} reject={reject} />
                )).pipe(
                    Effect.ensuring(Effect.sync(() => setPanelFocused(returnFocus))),
                );
            },
            checkboxGroup: <T,>(options: { options: T[]; label: (option: T) => string; title?: string }) => {
                const returnFocus = panelFocused();
                setPanelFocused('checkboxGroup');
                return dialogEffect.add<T[]>((resolve, reject) => (
                    <CheckboxGroup options={options.options} label={options.label} title={options.title} resolve={resolve} reject={reject} />
                )).pipe(
                    Effect.ensuring(Effect.sync(() => setPanelFocused(returnFocus))),
                );
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

                return { start, message, stop };
            },
            progress: (total: number) => {
                const [current, setCurrent] = createSignal(0);
                const [message, setMessage] = createSignal<string | undefined>(undefined);
                const [status, setStatus] = createSignal<'active' | 'complete' | 'halted'>('active');
                setStages(index, 'log', (logs) => [...logs, { type: 'component' as const, render: () =>
                    <Progress total={total} current={current()} message={message()} status={status()} />
                }]);
                return {
                    advance(amount: number, message?: string) {
                        setCurrent((prev) => prev + amount);
                        if (message !== undefined) setMessage(message);
                    },
                    complete(message?: string) {
                        setCurrent(total);
                        if (message !== undefined) setMessage(message);
                        setStatus('complete');
                    },
                    halt(message?: string) {
                        if (message !== undefined) setMessage(message);
                        setStatus('halted');
                    },
                };
            },
            exit: Effect.fail(new WorkflowExit({})),
        };
    }
    
    function runStage(index: number) {
        const stage = stages[index];
        if (!stage || stage.status === 'in-progress') return;
        
        setActiveStageIndex(index);
        setStages(index, 'status', 'in-progress');
        
        const ctx = makeStageContext(index, stage);
        const program = stage.action(ctx).pipe(
            Effect.tap(() => {
                setStages(index, 'status', 'completed');
            }),
            Effect.catchTags({
                WorkflowExit: (e) => Effect.sync(() => {
                    console.log('WorkflowExit:', e.reason);
                    process.exit(0);
                }),
                DialogCancelled: (e) => Effect.sync(() => {
                    setStages(index, 'status', 'failed');
                    setStages(index, 'error', `Cancelled: ${e.title ?? stage.title}`);
                }),
            }),
            Effect.catchAllCause((cause) => Effect.sync(() => {
                setStages(index, 'status', 'failed');
                const errorMsg = cause._tag === "Fail"
                    ? String(cause.error instanceof Error ? cause.error.message : cause.error)
                    : String(cause);
                setStages(index, 'error', errorMsg);
            })),
        );

Effect.runPromise(program).catch((e) => { console.error('Stage error:', e); });
    }

    function makeInitContext(): InitContext {
        return {
            log: (message: string) => {
                setInitLogs((logs) => [...logs, { type: 'text' as const, content: message }]);
            },
            prompt: (message: string) => {
                const returnFocus = panelFocused();
                setPanelFocused('prompt');
                return dialogEffect.add<string>((resolve, reject) => (
                    <Prompt message={message} title="Initialization" resolve={resolve} reject={reject} />
                )).pipe(
                    Effect.ensuring(Effect.sync(() => setPanelFocused(returnFocus))),
                );
            },
            confirm: (message: string) => {
                const returnFocus = panelFocused();
                setPanelFocused('confirm');
                return dialogEffect.add<boolean>((resolve, reject) => (
                    <Confirm message={message} title="Initialization" resolve={resolve} reject={reject} />
                )).pipe(
                    Effect.ensuring(Effect.sync(() => setPanelFocused(returnFocus))),
                );
            },
            checkboxGroup: <T,>(options: { options: T[]; label: (option: T) => string; title?: string }) => {
                const returnFocus = panelFocused();
                setPanelFocused('checkboxGroup');
                return dialogEffect.add<T[]>((resolve, reject) => (
                    <CheckboxGroup options={options.options} label={options.label} title={options.title} resolve={resolve} reject={reject} />
                )).pipe(
                    Effect.ensuring(Effect.sync(() => setPanelFocused(returnFocus))),
                );
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
                    advance(amount: number, message?: string) {
                        setCurrent((prev) => prev + amount);
                        if (message !== undefined) setMessage(message);
                    },
                    complete(message?: string) {
                        setCurrent(total);
                        if (message !== undefined) setMessage(message);
                        setStatus('complete');
                    },
                    halt(message?: string) {
                        if (message !== undefined) setMessage(message);
                        setStatus('halted');
                    },
                };
            },
            exit: Effect.fail(new WorkflowExit({})),
        };
    }

    function runInit() {
        if (!config?.init) {
            setInitStatus('completed');
            return;
        }

        setInitStatus('running');
        
        const ctx = makeInitContext();
        const program = config.init(ctx).pipe(
            Effect.tap(() => {
                setPanelFocused('stages');
                setInitStatus('completed');
            }),
            Effect.catchTags({
                WorkflowExit: (e) => Effect.sync(() => {
                    console.log('WorkflowExit:', e.reason);
                    process.exit(0);
                }),
                DialogCancelled: (e) => Effect.sync(() => {
                    setInitStatus('failed');
                    setInitLogs((logs) => [...logs, { type: 'text' as const, content: `Initialization cancelled: ${e.title ?? 'user cancelled'}` }]);
                }),
            }),
            Effect.catchAllCause((cause) => Effect.sync(() => {
                setInitStatus('failed');
                const errorMsg = cause._tag === "Fail"
                    ? String(cause.error instanceof Error ? cause.error.message : cause.error)
                    : String(cause);
                console.error(`Initialization failed: ${errorMsg}`);
                setInitLogs((logs) => [...logs, { type: 'text' as const, content: `Initialization failed: ${errorMsg}` }]);
            })),
        );

        Effect.runPromise(program).catch((e) => { console.error('Init error:', e); });
    }

    runInit();

    render(() => {
        return (
            <TerminalColorProvider>
                <Show 
                    when={initStatus() === 'completed'}
                    fallback={<InitApp logs={initLogs()} />}
                >
                    <App stages={stages} variables={variablesStore} runStage={runStage} />
                </Show>
            </TerminalColorProvider>
        );
    }, {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: true,
        consoleMode: "console-overlay",
    });

    return {
        stages,
        addStage,
        runStage,
    };
}