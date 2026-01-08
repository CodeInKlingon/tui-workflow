
import { useRenderer } from "@opentui/solid"
import { createContext, createResource, useContext, type ParentComponent } from "solid-js"

interface TerminalPalette {
	palette: string[];
	defaultForeground: string;
	defaultBackground: string;
	cursorColor: string;
	mouseForeground: string;
	mouseBackground: string;
	tekForeground: string;
	tekBackground: string;
	highlightBackground: string;
	highlightForeground: string;
}

interface TerminalColorContextValue {
	palette: () => TerminalPalette;
}

const TerminalColorContext = createContext<TerminalColorContextValue>()
export const TerminalColorProvider: ParentComponent = (props) => {
  	const renderer = useRenderer();
	  
	const defaultPalette = {
		palette: ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#c0c0c0",
				"#808080", "#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ff00ff", "#00ffff", "#ffffff"],
		defaultForeground: "#FFFFFF",
		defaultBackground: "#000000",
		cursorColor: "#FFFFFF",
		mouseForeground: "#FFFFFF",
		mouseBackground: "#000000",
		tekForeground: "#FFFFFF",
		tekBackground: "#000000",
		highlightBackground: "#0000FF",
		highlightForeground: "#FFFFFF",
	};
	  
	const [palette] = createResource(async () => {
		const result = await renderer.getPalette();
		return {
			palette: result.palette.map((c, i) => c ?? defaultPalette.palette[i]!),
			defaultForeground: result.defaultForeground ?? defaultPalette.defaultForeground,
			defaultBackground: result.defaultBackground ?? defaultPalette.defaultBackground,
			cursorColor: result.cursorColor ?? defaultPalette.cursorColor,
			mouseForeground: result.mouseForeground ?? defaultPalette.mouseForeground,
			mouseBackground: result.mouseBackground ?? defaultPalette.mouseBackground,
			tekForeground: result.tekForeground ?? defaultPalette.tekForeground,
			tekBackground: result.tekBackground ?? defaultPalette.tekBackground,
			highlightBackground: result.highlightBackground ?? defaultPalette.highlightBackground,
			highlightForeground: result.highlightForeground ?? defaultPalette.highlightForeground,
		};
	}, { initialValue: defaultPalette });
	  
  const value: TerminalColorContextValue = {
    palette: () => palette()!,
  }
  return (
    <TerminalColorContext.Provider value={value}>
      {props.children}
    </TerminalColorContext.Provider>
  )
}
export function useTerminalColors() {
  const context = useContext(TerminalColorContext)
  if (!context) {
    throw new Error("useTerminalColors must be used within TerminalColorProvider")
  }
  return context
}
