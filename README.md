# tui-workflow

A terminal ui library for defining and running workflows. Built on top of opentui. Define your workflow variables and stages with easy to use ui components like prompts, progress bars, and spinners. 

```ts
import { createWorkflow } from "tui-workflow";

const workflow = createWorkflow();

const version = workflow.defineVariable("version", {
    type: "string",
    description: "The version of the application to deploy",
    defaultValue: "1.0.0",
});


workflow.addStage({
    title: "Stage 1: Initialize",
    key: "stage1",
    action: async ({ log, confirm, exit, spinner }) => {
        log("Initializing...");
        const ver = await version.get();
        log(`Deploying version: ${ver}`);

        const spin = spinner();
        spin.start("Processing...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.message("Still working...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.stop("Done processing.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const shouldExit = await confirm("We encountered something unexpected while processing. Do you want to exit?");
        if (shouldExit) exit();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("Initialization complete.");
    }
});

```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```