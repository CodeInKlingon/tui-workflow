import { createWorkflow } from "./src/lib";

const workflow = createWorkflow();

workflow.addStep({
    title: "Step 1: Initialize",
    key: "step1",
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

workflow.addStep({
    title: "Step 2: Process Data",
    key: "step2",
    action: async ({ log }) => {
        // Simulate some async work
        log("Processing data...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        log("Data processed.");
    }
});