import { createContext, type JSXElement } from "solid-js";



const FocusedColorsContext = createContext<{foreground?: string, background?: string, highlightForeground?: string, highlightBackground?: string, isHighlighted?: boolean}>()

interface FocusThemeProps {
    children: (colors: {foreground: string, background: string, isHighlighted: boolean}) => JSXElement;
    highlightBackground?: string;
    highlightForeground?: string;
    background?: string;
    foreground?: string;
    isHighlighted?: boolean;
}

export function FocusTheme(props: FocusThemeProps): JSXElement {
    const isHighlighted = () => props.isHighlighted ?? false;
    const foreground = () => isHighlighted() ? props.highlightForeground ?? "white" : props.foreground ?? "white";
    const background = () => isHighlighted() ? props.highlightBackground ?? "black" : props.background ?? "black";

    return (
        <FocusedColorsContext.Provider value={{foreground: foreground(), background: background(), isHighlighted: isHighlighted()}}>
            {props.children({foreground: foreground(), background: background(), isHighlighted: isHighlighted()})}
        </FocusedColorsContext.Provider>
    )
}