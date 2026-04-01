import { createWorkflow } from "./src/lib";

const workflow = createWorkflow();

workflow.addStage({
    title: "Stage 1: Initialize",
    key: "stage1",
    action: async ({ log, confirm, exit, prompt, spinner }) => {
        // Simulate some async work
        log("Initializing...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const value = await prompt("Please enter a value:");
        log(`User entered: ${value}`);
        const spin = spinner();
        spin.start("Processing...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.message("Still working...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.stop("Done processing.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const shouldExit = await confirm("We encountered something unexpected while processing. Do you want to exit?");
        if(shouldExit) exit();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("Initialization complete.");
    }
});

workflow.addStage({
    title: "Stage 2: Process Data",
    key: "stage2",
    action: async ({ log, progress }) => {
        log("Processing data...");
        const p = progress(100);
        await new Promise((resolve) => setTimeout(resolve, 500));
        p.advance(25, "Fetching profiles");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        p.advance(25, "Validating records");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        p.advance(25, "Saving changes");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        p.complete("All done");
        log("Data processed.");
    }
});