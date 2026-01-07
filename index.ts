import { createWorkflow } from "./src/lib";

const workflow = createWorkflow();

workflow.addStep({
    title: "Step 1: Initialize",
    key: "step1",
    action: async ({ log }) => {
        // Simulate some async work
        log("Initializing...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        log("Initialization complete.");
        await new Promise((resolve) => setTimeout(resolve, 5000));
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