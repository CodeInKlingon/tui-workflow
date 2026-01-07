import { createWorkflow } from "./src/lib";

const workflow = createWorkflow();

workflow.addStep({
    title: "Step 1: Initialize",
    key: "step1",
    action: async ({ log, confirm, exit, prompt }) => {
        // Simulate some async work
        log("Initializing...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const value = await prompt("Please enter a value:");
        log(`User entered: ${value}`);
        const shouldContinue = await confirm("Do you want to continue to the next step?");
        if(!shouldContinue) exit();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("Initialization complete.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
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


workflow.startWorkflow();